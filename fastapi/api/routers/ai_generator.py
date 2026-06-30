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
from deps import get_db

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

class CaseSchema(BaseModel):
    title: str
    theme: str
    backstory: str
    suspects: List[SuspectSchema]
    evidence: List[EvidenceSchema]

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
        
        Game Mechanics:
        - Include exactly 5 suspects and exactly 6 pieces of evidence.
        - Exactly ONE suspect must have is_guilty set to true. 
        - The evidence must subtly point to the guilty suspect, but include clever red herrings to misdirect the player.
        
        Stylistic Constraints:
        - The suspects MUST have realistic, natural-sounding human names appropriate for the theme.
        - ABSOLUTELY NO cliché sci-fi titles, robotic handles, or corny aliases (e.g., do NOT use names like 'Circuit Jaxson', 'Data-Sage Elara', or 'Spectre'). Use grounded names like 'Elena Vance', 'Marcus Thorne', or 'Dr. Aris Vance'.
        
        Output ONLY valid JSON that matches this exact schema structure:
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
                description=ev.description
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
def make_accusation(req: AccusationRequest, db: Session = Depends(get_db)):
    try:
        suspect = db.query(models.Suspect).filter(models.Suspect.id == req.suspect_id).first()
        case = db.query(models.Case).filter(models.Case.id == req.case_id).first()

        if not suspect or not case:
            raise HTTPException(status_code=404, detail="Data not found.")

        # Check if the player is right!
        is_correct = bool(suspect.is_guilty)

        # Let Gemini write the dramatic conclusion
        prompt = f"""
        You are a master mystery writer. The investigator has just made their final accusation in the case: "{case.title}".
        They formally accused: {suspect.name}.
        
        Was this the correct guilty suspect? {"YES" if is_correct else "NO"}.
        
        Write a dramatic, 2-paragraph conclusion to the game. 
        If they are RIGHT: Describe how the suspect breaks down, confesses to the crime, and reveals their dark motive.
        If they are WRONG: Describe how the innocent suspect is forcefully arrested, how the real killer slips away into the shadows, and how the investigator is disgraced.
        
        Keep it gritty, cinematic, and in the tone of a cyberpunk noir thriller. Do not use markdown formatting, just plain text paragraphs.
        """
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)

        return {
            "success": is_correct,
            "narrative": response.text.strip()
        }

    except Exception as e:
        print(f"Accusation Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process accusation.")