import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload 
from pydantic import BaseModel, Field
from typing import List
import google.generativeai as genai
from dotenv import load_dotenv


import models
from deps import get_db, get_current_user
import requests
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

import urllib.parse

def build_cover_image_url(theme: str, case_id: int) -> str:
    query = f"{theme} noir mystery dark cinematic"
    try:
        res = requests.get(
            "https://api.unsplash.com/photos/random",
            params={"query": query, "orientation": "portrait"},
            headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
            timeout=5
        )
        if res.status_code == 200:
            return res.json()["urls"]["regular"]
        else:
            print(f"Unsplash error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Unsplash fetch failed: {e}")
    return None

# Load environment variables and configure Gemini
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI Generator"])

# ---------------------------------------------------------
# 1. DEFINE THE STRICT AI OUTPUT SCHEMA
# ---------------------------------------------------------
class SuspectSchema(BaseModel):
    name: str
    description: str
    alibi: str
    threat_level: int = Field(ge=1, le=5) # Forces Gemini to pick a level from 1 to 5
    is_guilty: bool

class EvidenceSchema(BaseModel):
    name: str
    description: str
    cipher_word: str  # single uppercase word, 5-11 letters, thematically tied to this evidence
    hint: str          # one short sentence hinting at the word without giving it away

class CaseSchema(BaseModel):
    title: str
    theme: str
    backstory: str
    suspects: List[SuspectSchema]
    evidence: List[EvidenceSchema]

class ProgressRequest(BaseModel):
    case_id: int
    evidence_id: int

class ChatRequest(BaseModel):
    case_id: int
    suspect_id: int
    role: str
    text: str

class ResolveRequest(BaseModel):
    case_id: int
    accused_suspect_id: int
    success: bool
    narrative: str

# ---------------------------------------------------------
# 2. THE GENERATION ENDPOINT
# ---------------------------------------------------------
@router.post("/generate-case/")
def generate_new_case(theme: str, db: Session = Depends(get_db)):
    try:
        # Using gemini-2.5-flash: the current free-tier model optimized for structured JSON
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={"response_mime_type": "application/json"}
        )

        prompt = f"""
        You are a master mystery writer. Generate a complete, logical murder mystery case.
        Theme: {theme}.
        Write the content using simple, punchy, fun language. Aim for an 8th-grade reading level. Avoid overly academic or sophisticated vocabulary. 
        Keep it gritty but easy to understand
        
        Game Mechanics:
        - Include exactly 5 suspects and exactly 6 pieces of evidence.
        - Exactly ONE suspect must have is_guilty set to true. 
        - The evidence must subtly point to the guilty suspect, but include clever red herrings to misdirect the player.
        - For each piece of evidence, also generate a "cipher_word": a single real English word (5-11 letters, no spaces or hyphens) that relates to that specific piece of evidence. This word will be used in a decryption mini-game.
        - Also generate a "hint" for each evidence: one short, punchy sentence that gives a clue toward the cipher_word WITHOUT saying the word itself.
                
        Stylistic Constraints:
        - The suspects MUST have realistic, natural-sounding human names appropriate for the theme.
        - ABSOLUTELY NO cliché sci-fi titles, robotic handles, or corny aliases (e.g., do NOT use names like 'Circuit Jaxson', 'Data-Sage Elara', or 'Spectre').
        - Vary names across different cultural backgrounds and naming styles — do not default to the same handful of Western names (avoid overusing "Marcus," "Elena," "Vance," "Blackwood," "Thorne," "Sterling" specifically, since these are overused). Mix first/last name combinations, and draw from a wide range of ethnic and cultural naming conventions appropriate to a modern, diverse cast — for example mixing names like Priya Nakamura, Diego Osei, Freya Lindqvist, Amara Osei, Kenji Alvarez, Noor Khoury, alongside more familiar Western names, so no two suspects across different cases feel like palette-swaps of each other.
        - No two suspects in the same case should share a surname unless they are explicitly stated to be related.
        
        Output ONLY valid JSON that matches this exact schema structure:
        Randomize your creative choices. Do not default to your most common or expected answer — vary character names, professions, and murder weapons each time this prompt runs, even for the same theme.
        {CaseSchema.schema_json()}
        """

        # Ask Gemini to generate the case content
        response = model.generate_content(prompt)
        
        # Validate and parse the JSON string directly into Python objects
        ai_case_data = CaseSchema.model_validate_json(response.text)
        
        # ---------------------------------------------------------
        # 3. INJECT THE AI DATA INTO SQLITE
        # ---------------------------------------------------------
        # Create the Case master entry
        new_case = models.Case(
            title=ai_case_data.title,
            theme=ai_case_data.theme,
            backstory=ai_case_data.backstory
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        new_case.cover_image_url = build_cover_image_url(new_case.theme, new_case.id)
        db.commit()

        # Loop through and save all 5 suspects
        for sus in ai_case_data.suspects:
            new_suspect = models.Suspect(
                case_id=new_case.id,
                name=sus.name,
                description=sus.description,
                alibi=sus.alibi,
                threat_level=sus.threat_level,
                is_guilty=1 if sus.is_guilty else 0
            )
            db.add(new_suspect)

        # Loop through and save all 6 evidence pieces
        for ev in ai_case_data.evidence:
            new_evidence = models.Evidence(
                case_id=new_case.id,
                name=ev.name,
                description=ev.description,
                cipher_word=ev.cipher_word.upper(),
                hint=ev.hint
            )
            db.add(new_evidence)

        # Commit all entities to the database
        db.commit()

        return {
            "message": "Case successfully generated and locked into database!", 
            "case_id": new_case.id, 
            "title": new_case.title
        }

    except Exception as e:
        print(f"AI Generation Error: {str(e)}") # Crucial for terminal debugging
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-case/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    # 1. Look for the target case
    target_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    
    if not target_case:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    try:
        # 2. Clean up associated suspects and evidence first (if not handled by cascade)
        db.query(models.Suspect).filter(models.Suspect.case_id == case_id).delete()
        db.query(models.Evidence).filter(models.Evidence.case_id == case_id).delete()
        
        # 3. Delete the master case entry
        db.delete(target_case)
        db.commit()
        
        return {"message": f"Case #{case_id} and all its clues/suspects have been wiped clean."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cases/")
def get_all_cases(db: Session = Depends(get_db)):
    """Retrieves all cases from the archive database for the dashboard index view."""
    try:
        all_cases = db.query(models.Case)\
            .options(joinedload(models.Case.suspects), joinedload(models.Case.evidence))\
            .order_by(models.Case.id.desc())\
            .all()
        return all_cases
    except Exception as e:
        print(f"Database Fetch Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal core communication link failure.")


@router.get("/latest-case/")
def get_latest_case(db: Session = Depends(get_db)):
    # Fetch the newest case and 'join' its suspects and evidence so it's all in one package
    latest_case = db.query(models.Case)\
        .options(joinedload(models.Case.suspects), joinedload(models.Case.evidence))\
        .order_by(models.Case.id.desc())\
        .first()
    
    if not latest_case:
        raise HTTPException(status_code=404, detail="No active cases found.")
    
    return latest_case


# ---------------------------------------------------------
# 4. THE AI INTERROGATION ENDPOINT
# ---------------------------------------------------------
class InterrogationRequest(BaseModel):
    case_id: int
    suspect_id: int
    question: str

@router.post("/interrogate/")
def interrogate_suspect(req: InterrogationRequest, db: Session = Depends(get_db)):
    try:
        # 1. Fetch the exact Suspect and the Case context from the database
        suspect = db.query(models.Suspect).filter(models.Suspect.id == req.suspect_id).first()
        case = db.query(models.Case).filter(models.Case.id == req.case_id).first()
        evidence = db.query(models.Evidence).filter(models.Evidence.case_id == req.case_id).all()

        if not suspect or not case:
            raise HTTPException(status_code=404, detail="Data not found in the archives.")

        # 2. Build the Evidence list so the AI knows the clues
        evidence_list = "\n".join([f"- {e.name}: {e.description}" for e in evidence])

        # 3. Construct the Roleplay Prompt
        roleplay_prompt = f"""
        You are participating in a murder mystery roleplay. You MUST stay in character at all times. Never refer to yourself as an AI.
        Write the content using simple, punchy, fun language. Aim for an 8th-grade reading level. Avoid overly academic or sophisticated vocabulary. 
        Keep it gritty but easy to understand

        YOUR IDENTITY:
        Name: {suspect.name}
        Description: {suspect.description}
        Your Stated Alibi: {suspect.alibi}
        Are you the actual murderer?: {"YES" if suspect.is_guilty else "NO"}
        
        CASE BACKGROUND:
        Theme: {case.theme}
        What Happened: {case.backstory}
        
        EVIDENCE FOUND AT THE SCENE:
        {evidence_list}
        
        RULES:
        1. An investigator is interrogating you. Respond to their question naturally, in a tone that fits your character.
        2. Keep your answer concise (2-4 sentences max). This is a fast-paced chat.
        3. If you are INNOCENT, be helpful, defensive, or annoyed, but stick to your alibi.
        4. If you are GUILTY, lie and deflect. Do NOT confess unless the investigator specifically confronts you with undeniable evidence that contradicts your alibi.
        
        INVESTIGATOR'S QUESTION: "{req.question}"
        
        Provide your exact verbal response:
        """

        # 4. Generate the response using Gemini
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(roleplay_prompt)

        return {"reply": response.text.strip()}

    except Exception as e:
        print(f"Interrogation Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Secure comms link failed.")

# ---------------------------------------------------------
# 5. THE ACCUSATION & RESOLUTION ENDPOINT
# ---------------------------------------------------------
class AccusationRequest(BaseModel):
    case_id: int
    suspect_id: int

@router.post("/accuse/")
def make_accusation(req: AccusationRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        suspect = db.query(models.Suspect).filter(models.Suspect.id == req.suspect_id).first()
        case = db.query(models.Case).filter(models.Case.id == req.case_id).first()

        if not suspect or not case:
            raise HTTPException(status_code=404, detail="Data not found.")

        status_row = db.query(models.UserCaseStatus).filter(
            models.UserCaseStatus.user_id == current_user['id'],
            models.UserCaseStatus.case_id == req.case_id
        ).first()

        if status_row and status_row.success:
            raise HTTPException(status_code=400, detail="This case is already closed.")

        is_correct = bool(suspect.is_guilty)

        prompt = f"""
        You are writing the ending of a detective story. The investigator just accused: {suspect.name}.
        Was this the correct guilty suspect? {"YES" if is_correct else "NO"}.

        Write like a true-crime podcast script, not a novel. Short sentences. Punchy. No metaphors, no flowery imagery.

        BANNED WORDS: shadow, whisper, veil, laser, neon, chrome, cryo, gilded, tapestry, enigma, palpable, visceral, labyrinth.

        If they are RIGHT: The suspect breaks and confesses. Reveal their motive plainly, in 1-2 sentences.
        If they are WRONG: Say plainly that this wasn't the right person, and that the investigation continues.

        Write exactly 2 short paragraphs. 4-5 sentences each, max. Plain text, no markdown.
        """

        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        narrative = response.text.strip()

        user = db.query(models.User).filter(models.User.id == current_user['id']).first()

        if not status_row:
            status_row = models.UserCaseStatus(user_id=current_user['id'], case_id=req.case_id, wrong_attempts=0)
            db.add(status_row)

        status_row.accused_suspect_id = req.suspect_id
        status_row.narrative = narrative
        status_row.success = is_correct

        if is_correct:
            user.rating = (user.rating or 100) + 15
            user.cases_solved = (user.cases_solved or 0) + 1
        else:
            status_row.wrong_attempts = (status_row.wrong_attempts or 0) + 1
            user.rating = max(0, (user.rating or 100) - 5)
            user.cases_failed = (user.cases_failed or 0) + 1

        db.commit()

        return {
            "success": is_correct,
            "narrative": narrative,
            "rating": user.rating,
            "attempts": status_row.wrong_attempts
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Accusation Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process accusation.")

@router.get("/reveal-truth/{case_id}")
def reveal_truth(case_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    status_row = db.query(models.UserCaseStatus).filter(
        models.UserCaseStatus.user_id == current_user['id'],
        models.UserCaseStatus.case_id == case_id
    ).first()

    if not status_row:
        raise HTTPException(status_code=403, detail="Make an accusation first.")

    guilty_suspect = db.query(models.Suspect).filter(
        models.Suspect.case_id == case_id,
        models.Suspect.is_guilty == 1
    ).first()

    if not guilty_suspect:
        raise HTTPException(status_code=404, detail="No culprit on record.")

    return {"name": guilty_suspect.name, "description": guilty_suspect.description, "alibi": guilty_suspect.alibi}
    

@router.post("/progress/save")
def save_evidence_progress(
    request: ProgressRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    existing = db.query(models.CaseProgress).filter(
        models.CaseProgress.user_id == user_id,
        models.CaseProgress.case_id == request.case_id,
        models.CaseProgress.evidence_id == request.evidence_id
    ).first()
    
    if not existing:
        new_progress = models.CaseProgress(
            user_id=user_id,
            case_id=request.case_id,
            evidence_id=request.evidence_id
        )
        db.add(new_progress)
        db.commit()
    
    return {"status": "Evidence secured"}

@router.get("/progress/{case_id}")
def get_case_progress(
    case_id: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    unlocked_nodes = db.query(models.CaseProgress.evidence_id).filter(
        models.CaseProgress.user_id == user_id,
        models.CaseProgress.case_id == case_id
    ).all()
    
    return {"decrypted_ids": [node[0] for node in unlocked_nodes]}

@router.post("/chat/save")
def save_chat_message(
    request: ChatRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    new_message = models.ChatMessage(
        user_id=user_id,
        case_id=request.case_id,
        suspect_id=request.suspect_id,
        role=request.role,
        text=request.text
    )
    db.add(new_message)
    db.commit()
    return {"status": "Message logged"}

@router.get("/chat/{case_id}/{suspect_id}")
def get_chat_history(
    case_id: int, 
    suspect_id: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    
    history = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id,
        models.ChatMessage.case_id == case_id,
        models.ChatMessage.suspect_id == suspect_id
    ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    return [{"role": msg.role, "text": msg.text} for msg in history]


@router.get("/resolve/{case_id}")
def get_resolution(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    status_row = db.query(models.UserCaseStatus).filter(
        models.UserCaseStatus.user_id == current_user['id'],
        models.UserCaseStatus.case_id == case_id
    ).first()
    if not status_row:
        return None
    return {
        "success": status_row.success,
        "narrative": status_row.narrative,
        "accused_suspect_id": status_row.accused_suspect_id
    }