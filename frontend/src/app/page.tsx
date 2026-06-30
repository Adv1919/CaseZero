"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { 
  UserCircle, ShieldAlert, Lock, User, Terminal, DatabaseBackup, Fingerprint, 
  FolderSearch, Users, ChevronRight, MessageSquare, Send, X, Shield, 
  Volume2, VolumeX, Radio, Sparkles, GitBranch, Eye, EyeOff, KeyRound, 
  ArrowUpRight, RadioTower, Shuffle, ChevronDown, Incognito
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helper Components (Animations & Styling)                          */
/* ------------------------------------------------------------------ */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`cz-reveal ${visible ? "cz-reveal-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function MagneticButton({ children, className = "", as = "button", ...props }: any) {
  const ref = useRef<any>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [easing, setEasing] = useState(false);

  const handleMove = useCallback((e: any) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setEasing(false);
    setPos({ x: relX * 0.25, y: relY * 0.35 });
  }, []);

  const handleLeave = useCallback(() => {
    setEasing(true);
    setPos({ x: 0, y: 0 });
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`cz-magnetic ${className}`}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: easing ? "transform 0.5s cubic-bezier(0.16,1,0.3,1)" : "transform 0.08s linear",
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

function RuleBar({ rule }: { rule: {num: string, title: string, body: string} }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cz-edge cz-rule" data-open={open} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} tabIndex={0}>
      <div className="cz-rule-head">
        <div className="cz-rule-left">
          <span className="cz-rule-num">{rule.num}</span>
          <span className="cz-rule-title">{rule.title}</span>
        </div>
        <ChevronDown className="cz-rule-chevron" size={18} strokeWidth={1.5} />
      </div>
      <div className="cz-rule-body-wrap" style={{ maxHeight: open ? "220px" : "0px", opacity: open ? 1 : 0 }}>
        <p className="cz-rule-body">{rule.body}</p>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { label: "Dossier", href: "#dossier" },
  { label: "Protocol", href: "#protocol" },
  { label: "Access", href: "#access" },
];

const RULES = [
  { num: "01", title: "Trust no testimony.", body: "Every witness omits something — out of fear, loyalty, or guilt. Weigh every statement against the physical evidence before it enters your case file. The board doesn't lie. People do." },
  { num: "02", title: "The first suspect is never—", body: "—the last. An open door, a convenient alibi, a story that fits too neatly: someone built that for you to walk through. Obvious guilt is bait. Look past the suspect you were handed." },
  { num: "03", title: "Silence is a statement.", body: "What a suspect refuses to answer carries more weight than what they confess. Log every deflection, every change of subject, every “I'd rather not say.” The gaps are where the truth hides." },
];

/* ------------------------------------------------------------------ */
/* Interfaces                                                        */
/* ------------------------------------------------------------------ */
interface Evidence { id: number; name: string; description: string; }
interface Suspect { id: number; name: string; description: string; alibi: string; threat_level: number; is_guilty: boolean; }
interface Case { id: number; title: string; theme: string; backstory: string; suspects: Suspect[]; evidence: Evidence[]; }

/* ------------------------------------------------------------------ */
/* Main Application Component                                        */
/* ------------------------------------------------------------------ */
export default function Home() {
  // Auth & UI States
  const [token, setToken] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [navSolid, setNavSolid] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Engine States
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState<"BRIEFING" | "SUSPECTS" | "EVIDENCE">("BRIEFING");
  
  // Immersive States
  const [muted, setMuted] = useState(true);
  const [typewriterText, setTypewriterText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  
  // Game States
  const [decryptedEvidenceIds, setDecryptedEvidenceIds] = useState<number[]>([]);
  const [decryptingId, setDecryptingId] = useState<number | null>(null);
  const [scrambleWord, setScrambleWord] = useState("");
  const [userGuess, setUserGuess] = useState("");
  const [miniGameTargetId, setMiniGameTargetId] = useState<number | null>(null);
  const [gameError, setGameError] = useState(false);
  const cryptoWords = ["FORENSICS", "CYANIDE", "CORRUPT", "ALIBI", "MAINFRAME", "INHERITANCE", "OVERRIDE", "HOMICIDE"];

  const [activeSuspect, setActiveSuspect] = useState<Suspect | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'suspect', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [accuseTarget, setAccuseTarget] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [gameResult, setGameResult] = useState<{success: boolean, narrative: string} | null>(null);

  // Scroll Event for Navbar
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => (e: any) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Audio Logic
  const playSound = (type: "click" | "success" | "fail") => {
    if (muted || typeof window === "undefined") return;
    try {
      const audioMap = {
        click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav",
        success: "https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav",
        fail: "https://assets.mixkit.co/active_storage/sfx/911/911-84.wav"
      };
      const audio = new Audio(audioMap[type]);
      audio.volume = type === "click" ? 0.15 : 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== "undefined" && token) {
      if (!ambientRef.current) {
        ambientRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"); 
        ambientRef.current.loop = true;
        ambientRef.current.volume = 0.05;
      }
      if (!muted) ambientRef.current.play().catch(() => {});
      else ambientRef.current.pause();
    }
    return () => ambientRef.current?.pause();
  }, [muted, token]);

  // Data Fetching
  const fetchDashboardData = async (authToken: string) => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/ai/cases/", { headers: { Authorization: `Bearer ${authToken}` } });
      setCases(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("casezero_token");
    if (savedToken) {
      setToken(savedToken);
      fetchDashboardData(savedToken);
    }
  }, []);

  // Typewriter
  useEffect(() => {
    if (!activeCase) return;
    setTypewriterText("");
    setTextIndex(0);
  }, [activeCase]);

  useEffect(() => {
    if (!activeCase || textIndex >= activeCase.backstory.length || activeTab !== "BRIEFING") return;
    const timeout = setTimeout(() => {
      setTypewriterText((prev) => prev + activeCase.backstory[textIndex]);
      setTextIndex((prev) => prev + 1);
    }, 15);
    return () => clearTimeout(timeout);
  }, [textIndex, activeCase, activeTab]);

  // Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append("username", username);
        params.append("password", password);
        const res = await axios.post("http://127.0.0.1:8000/auth/token", params, { headers: { "Content-Type": "application/x-www-form-urlencoded" }});
        localStorage.setItem("casezero_token", res.data.access_token);
        setToken(res.data.access_token);
        fetchDashboardData(res.data.access_token);
        setMuted(false);
      } else {
        await axios.post("http://127.0.0.1:8000/auth/", { username, password });
        setIsLogin(true);
        setError("Profile created. Please authenticate to open link.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Link Denied.");
    } finally {
      setLoading(false);
    }
  };

  const startDecryptionProcess = (evidenceId: number) => {
    playSound("click");
    const targetWord = cryptoWords[Math.floor(Math.random() * cryptoWords.length)];
    (window as any)[`crypto_${evidenceId}`] = targetWord;
    setScrambleWord(targetWord.split('').sort(() => Math.random() - 0.5).join(''));
    setMiniGameTargetId(evidenceId);
    setUserGuess("");
    setGameError(false);
  };

  const verifyDecryptionGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniGameTargetId) return;
    const correctWord = (window as any)[`crypto_${miniGameTargetId}`];
    if (userGuess.toUpperCase().trim() === correctWord) {
      playSound("success");
      setDecryptingId(miniGameTargetId);
      setTimeout(() => {
        setDecryptedEvidenceIds(prev => [...prev, miniGameTargetId]);
        setDecryptingId(null);
        setMiniGameTargetId(null);
      }, 1500);
    } else {
      playSound("fail");
      setGameError(true);
      setUserGuess("");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSuspect || !activeCase || !token) return;
    const query = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: query }]);
    setChatInput("");
    setIsTyping(true);
    playSound("click");
    try {
      const res = await axios.post("http://127.0.0.1:8000/ai/interrogate/", { case_id: activeCase.id, suspect_id: activeSuspect.id, question: query }, { headers: { Authorization: `Bearer ${token}` } });
      setChatMessages(prev => [...prev, { role: 'suspect', text: res.data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'suspect', text: "[SIGNAL LOSS: SYSTEM DROPPED CONNECT]" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAccusation = async () => {
    if (!accuseTarget || !activeCase || !token) return;
    setIsResolving(true);
    playSound("click");
    try {
      const res = await axios.post("http://127.0.0.1:8000/ai/accuse/", { case_id: activeCase.id, suspect_id: accuseTarget }, { headers: { Authorization: `Bearer ${token}` } });
      setGameResult(res.data);
      if (res.data.success) playSound("success"); else playSound("fail");
    } catch {
      console.error("Transmission error");
    } finally {
      setIsResolving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("casezero_token");
    setToken(null);
    setActiveCase(null);
    setCases([]);
    setMuted(true);
  };

  return (
    <div className="cz-root min-h-screen relative selection:bg-amber-900/40">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .cz-root {
          --obsidian: #07080a;
          --surface: #0e1014;
          --surface-soft: rgba(17, 19, 24, 0.55);
          --amber: #ffb23f;
          --amber-deep: #ff7a1a;
          --cyan: #5ce1e6;
          --bone: #ece7dc;
          --ink-muted: #8a8d97;
          background: var(--obsidian);
          color: var(--bone);
          font-family: 'Space Grotesk', sans-serif;
        }

        .cz-display { font-family: 'Space Grotesk', sans-serif; }
        .cz-serif { font-family: 'Fraunces', serif; font-style: italic; }
        .cz-mono { font-family: 'JetBrains Mono', monospace; }

        /* Noise Overlay */
        .cz-noise {
          position: fixed; inset: -120px; z-index: 60; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: cz-grain 1s steps(2) infinite;
        }
        @keyframes cz-grain { 0%, 100% { transform: translate(0,0); } 10% { transform: translate(-1%,-2%); } 20% { transform: translate(2%,1%); } 30% { transform: translate(-2%,2%); } 40% { transform: translate(1%,-1%); } 50% { transform: translate(-1%,2%); } 60% { transform: translate(2%,-2%); } 70% { transform: translate(-2%,-1%); } 80% { transform: translate(1%,2%); } 90% { transform: translate(-1%,1%); } }

        /* Glowing Edge-lit Borders */
        .cz-edge { position: relative; border-radius: 18px; background: var(--surface-soft); }
        .cz-edge::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
          background: linear-gradient(135deg, rgba(255,178,63,0.55), rgba(92,225,230,0.22) 55%, rgba(255,178,63,0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
        }

        /* Nav */
        .cz-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; transition: all 0.4s ease; border-bottom: 1px solid transparent; }
        .cz-nav[data-solid="true"] { background-color: rgba(7,8,10,0.7); backdrop-filter: blur(18px); border-bottom: 1px solid rgba(255,178,63,0.12); }
        .cz-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 6px var(--cyan); animation: cz-dot 2.2s ease-in-out infinite; }
        @keyframes cz-dot { 0%,100% { opacity: 0.4; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }

        /* Hero */
        .cz-hero { position: relative; padding: 168px 28px 120px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .cz-orb { position: absolute; top: 50%; left: 50%; width: 720px; height: 720px; transform: translate(-50%, -55%); border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(92,225,230,0.30), transparent 55%), radial-gradient(circle at 65% 70%, rgba(255,122,26,0.28), transparent 55%), radial-gradient(circle at 50% 50%, rgba(255,178,63,0.18), transparent 60%); filter: blur(70px); animation: cz-orb-pulse 9s ease-in-out infinite; z-index: 0; }
        @keyframes cz-orb-pulse { 0%, 100% { transform: translate(-50%, -55%) scale(1); opacity: 0.75; } 50% { transform: translate(-50%, -55%) scale(1.12); opacity: 1; } }
        .cz-scanline { position: absolute; left: 8%; right: 8%; height: 1px; background: linear-gradient(90deg, transparent, rgba(92,225,230,0.55), transparent); animation: cz-scan 7s linear infinite; z-index: 1; pointer-events: none; }
        @keyframes cz-scan { 0% { top: 12%; opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { top: 92%; opacity: 0; } }

        /* Typography Components */
        .cz-eyebrow { position: relative; z-index: 2; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.18em; color: var(--ink-muted); margin-bottom: 28px; display: inline-flex; align-items: center; gap: 10px; }
        .cz-cursor { animation: cz-blink 1.1s steps(1) infinite; color: var(--amber); }
        @keyframes cz-blink { 50% { opacity: 0; } }
        .cz-hero-title { position: relative; z-index: 2; }
        .cz-hero-title .line { display: block; line-height: 0.7; letter-spacing: -0.02em; font-weight: 800; }
        .cz-hero-title .accent { 
          font-family: 'Fraunces', serif; 
          font-style: italic; 
          font-weight: 600; 
          letter-spacing: -0.01em; 
          background: linear-gradient(100deg, var(--amber-deep), var(--amber) 60%, #ffe2b0); 
          -webkit-background-clip: text; 
          background-clip: text; 
          color: transparent; 
          margin: -0.15em 0.06em -0.15em 0.18em;
          transform: rotate(-1.2deg); 
          display: inline-block; 
        }
        .cz-sub { position: relative; z-index: 2; max-width: 560px; margin: 34px auto 0; color: var(--ink-muted); font-size: 16px; line-height: 1.65; }
        .cz-tags { position: relative; z-index: 2; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 28px; }
        .cz-tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--ink-muted); padding: 6px 14px; border-radius: 999px; }
        
        /* Buttons */
        .cz-cta-row { position: relative; z-index: 2; margin-top: 44px; display: flex; flex-direction: column; align-items: center; gap: 22px; }
        .cz-magnetic.cz-cta { background: linear-gradient(135deg, var(--amber-deep), var(--amber)); color: #100a04; font-weight: 700; font-size: 15px; padding: 16px 34px; border-radius: 999px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 0 0px rgba(255,178,63,0); transition: box-shadow 0.45s ease; }
        .cz-magnetic.cz-cta:hover { box-shadow: 0 0 48px 4px rgba(255,178,63,0.45); }
        .cz-scroll-cue { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.14em; color: var(--ink-muted); display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; cursor: pointer; }
        .cz-scroll-cue svg { animation: cz-bounce 1.8s ease-in-out infinite; }
        @keyframes cz-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

        /* General Layout */
        .cz-section { position: relative; padding: 100px 28px; max-width: 1180px; margin: 0 auto; }
        .cz-section-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.18em; color: var(--amber); margin-bottom: 14px; }
        .cz-section-heading { font-size: 34px; font-weight: 800; letter-spacing: -0.01em; max-width: 620px; }

        /* Bento Grid */
        .cz-bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, minmax(190px, 1fr)); grid-template-areas: "a a b c" "a a d c" "e e e e"; gap: 16px; margin-top: 48px; }
        @media (max-width: 1024px) { .cz-bento-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: auto; grid-template-areas: "a a" "b c" "d c" "e e"; } }
        @media (max-width: 640px) { .cz-bento-grid { grid-template-columns: 1fr; grid-template-areas: "a" "b" "c" "d" "e"; } }
        
        .cz-card { backdrop-filter: blur(28px); padding: 26px; display: flex; flex-direction: column; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
        .cz-card:hover { transform: translateY(-4px); box-shadow: 0 18px 60px -20px rgba(0,0,0,0.6); }
        .cz-card-a { grid-area: a; } .cz-card-b { grid-area: b; } .cz-card-c { grid-area: c; } .cz-card-d { grid-area: d; } .cz-card-e { grid-area: e; flex-direction: row; flex-wrap: wrap; align-items: stretch; gap: 24px; }
        .cz-card-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--amber); display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .cz-card-title { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 10px; }
        .cz-card-copy { color: var(--ink-muted); font-size: 13.5px; line-height: 1.6; }

        /* Chat snippets & nodes */
        .cz-chat { margin-top: auto; display: flex; flex-direction: column; gap: 10px; padding-top: 18px; }
        .cz-bubble { font-size: 13px; line-height: 1.5; padding: 10px 14px; border-radius: 12px; max-width: 82%; }
        .cz-bubble-det { align-self: flex-end; background: rgba(255,178,63,0.14); color: #ffe2b0; border-radius: 12px 12px 2px 12px; }
        .cz-bubble-sus { align-self: flex-start; background: rgba(255,255,255,0.05); color: var(--bone); border-radius: 12px 12px 12px 2px; }
        .cz-flag { align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.04em; color: var(--amber); margin-top: -2px; }
        
        /* Redacted / Timeline Data */
        .cz-redact { background: #000; color: transparent; border-radius: 2px; padding: 0 4px; }
        .cz-evidence-line { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgba(236,231,220,0.55); line-height: 1.9; }
        .cz-timeline { position: relative; margin-top: 12px; padding-left: 22px; flex: 1; }
        .cz-timeline::before { content: ""; position: absolute; left: 5px; top: 4px; bottom: 4px; width: 1px; background: linear-gradient(180deg, rgba(92,225,230,0.5), rgba(255,178,63,0.5)); }
        .cz-tl-node { position: relative; margin-bottom: 20px; }
        .cz-tl-dot { position: absolute; left: -22px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }
        .cz-tl-node.flag .cz-tl-dot { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
        .cz-tl-label { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.05em; color: var(--ink-muted); }
        .cz-tl-node.flag .cz-tl-label { color: var(--amber); }
        .cz-tl-text { font-size: 13px; margin-top: 2px; }
        .cz-verdict-col { flex: 1 1 160px; display: flex; flex-direction: column; gap: 8px; padding: 18px 0; }
        .cz-verdict-divider { width: 1px; align-self: stretch; background: linear-gradient(180deg, transparent, rgba(255,178,63,0.4), transparent); }
        .cz-verdict-head { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
        .cz-verdict-copy { color: var(--ink-muted); font-size: 12.5px; line-height: 1.55; }

        /* Rules */
        .cz-rule { margin-bottom: 14px; cursor: pointer; outline: none; transition: box-shadow 0.4s ease; }
        .cz-rule[data-open="true"] { box-shadow: 0 0 50px -12px rgba(255,178,63,0.45); }
        .cz-rule-head { display: flex; align-items: center; justify-content: space-between; padding: 26px 30px; }
        .cz-rule-left { display: flex; align-items: baseline; gap: 22px; }
        .cz-rule-num { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--ink-muted); }
        .cz-rule[data-open="true"] .cz-rule-num { color: var(--amber); }
        .cz-rule-title { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; transition: color 0.3s ease; }
        .cz-rule[data-open="true"] .cz-rule-title { color: var(--amber); }
        .cz-rule-chevron { color: var(--ink-muted); transition: transform 0.4s ease; }
        .cz-rule[data-open="true"] .cz-rule-chevron { transform: rotate(180deg); color: var(--amber); }
        .cz-rule-body-wrap { overflow: hidden; transition: max-height 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease; padding: 0 30px; }
        .cz-rule-body { font-size: 14.5px; line-height: 1.7; color: var(--bone); padding-bottom: 26px; max-width: 720px; }

        /* Form / Auth */
        .cz-access { display: flex; justify-content: center; padding: 60px 28px 140px; }
        .cz-access-box { width: 100%; max-width: 500px; padding: 48px; backdrop-filter: blur(24px); }
        .cz-field { margin-bottom: 18px; }
        .cz-field-label { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; color: var(--ink-muted); display: block; margin-bottom: 8px; }
        .cz-input-wrap { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; background: rgba(255,255,255,0.03); }
        .cz-input-wrap input { background: transparent; border: none; outline: none; color: var(--bone); font-size: 14px; width: 100%; font-family: 'Space Grotesk', sans-serif; }
        .cz-input-wrap input::placeholder { color: rgba(138,141,151,0.6); }
        .cz-input-wrap svg { color: var(--ink-muted); flex-shrink: 0; }
        .cz-eye-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; }
        .cz-submit { width: 100%; margin-top: 8px; background: linear-gradient(135deg, var(--amber-deep), var(--amber)); color: #100a04; font-weight: 700; font-size: 14.5px; padding: 14px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: box-shadow 0.4s ease; }
        .cz-submit:hover { box-shadow: 0 0 40px 2px rgba(255,178,63,0.4); }
        .cz-access-foot { text-align: center; margin-top: 18px; font-size: 12.5px; color: var(--ink-muted); }
        .cz-access-foot button { color: var(--cyan); background: none; border: none; cursor: pointer; font-family: 'JetBrains Mono', monospace; }

        /* Footer */
        .cz-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 26px 28px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--ink-muted); }
        
        .cz-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .cz-reveal-visible { opacity: 1; transform: translateY(0); }
      `}</style>

      <div className="cz-noise" />

      {/* ========================================== */}
      {/* VIEW 1: SCROLLABLE LANDING PAGE (Logged Out) */}
      {/* ========================================== */}
      {!token && (
        <div style={{ position: 'relative', zIndex: 10 }}>
          <nav className="cz-nav" data-solid={navSolid}>
            <div className="cz-display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 8 }}>
              <Incognito size={28} strokeWidth={2} color="var(--amber)" />
              <div>
                <span style={{ color: "var(--bone)" }}>CASE</span>
                <span style={{ color: "var(--amber)", fontWeight: 500 }}>ZERO</span>
              </div>
            </div>      
            <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
              <div className="cz-mono hidden md:flex" style={{ gap: 28, fontSize: 13 }}>
                {NAV_LINKS.map((l) => (<a key={l.label} href={l.href} onClick={scrollTo(l.href)} style={{ color: "var(--bone)", textDecoration: "none", opacity: 0.85 }}>{l.label}</a>))}
              </div>
              <div className="cz-mono hidden md:flex" style={{ alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-muted)" }}>
                <span className="cz-status-dot" /> SYSTEM ONLINE
              </div>
            </div>
          </nav>

          <header className="cz-hero">
            <div className="cz-orb" />
            <div className="cz-scanline" />
            <div className="cz-eyebrow cz-mono">FILE NO. 0451 — STATUS: UNSOLVED <span className="cz-cursor">_</span></div>
            <h1 className="cz-hero-title cz-display" style={{ fontSize: "clamp(48px, 11vw, 124px)" }}>
              <span className="line">NOTHING</span>
              <span className="line accent" style={{ fontSize: "0.7em" }}>stays</span>
              <span className="line">BURIED.</span>
            </h1>
            <p className="cz-sub">
              CaseZero is a narrative interrogation thriller. Suspects remember every word you say, evidence rewards patience over speed, and the truth only surfaces if you're sharp enough to corner it.
            </p>
            <div className="cz-tags">
              {["LIVE AI SUSPECTS", "BRANCHING DIALOGUE", "PERMANENT CONSEQUENCES"].map((t) => (
                <span key={t} className="cz-tag cz-edge">{t}</span>
              ))}
            </div>
            <div className="cz-cta-row">
              <MagneticButton className="cz-cta" onClick={scrollTo("#access")}>
                Access Terminal <ArrowUpRight size={17} strokeWidth={2.2} />
              </MagneticButton>
              <a href="#dossier" onClick={scrollTo("#dossier")} className="cz-scroll-cue">SCROLL TO DOSSIER <ChevronDown size={14} /></a>
            </div>
          </header>

          <section className="cz-section" id="dossier">
            <Reveal>
              <div className="cz-section-eyebrow cz-mono">DOSSIER — OVERVIEW</div>
              <h2 className="cz-section-heading cz-display">Open the case file.</h2>
            </Reveal>
            <Reveal delay={80}>
              <div className="cz-bento-grid">
                <div className="cz-card cz-card-a cz-edge">
                  <div className="cz-card-label cz-mono"><MessageSquare size={13} /> LIVE INTERROGATION</div>
                  <div className="cz-card-title cz-display">Suspects remember everything you say.</div>
                  <p className="cz-card-copy">No scripted dialogue trees. Every answer is generated in the moment, shaped by what you've already asked, what you already know, and how hard you push.</p>
                  <div className="cz-chat">
                    <div className="cz-bubble cz-bubble-det">"Where were you at 2 AM?"</div>
                    <div className="cz-bubble cz-bubble-sus">"I— I told you already. Home."</div>
                    <div className="cz-flag cz-mono">⚠ CONTRADICTS STATEMENT #1</div>
                    <div className="cz-bubble cz-bubble-det">"That's not what your neighbor says."</div>
                    <div className="cz-bubble cz-bubble-sus"><span className="cz-typing"><span /><span /><span /></span></div>
                  </div>
                </div>
                <div className="cz-card cz-card-b cz-edge">
                  <div className="cz-card-label cz-mono"><Lock size={13} /> REDACTED EVIDENCE</div>
                  <div className="cz-card-title cz-display" style={{ fontSize: 16 }}>Some files won't talk for free.</div>
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="cz-evidence-line">SUBJECT: <span className="cz-redact">Marlowe Voss</span></div>
                    <div className="cz-evidence-line">LAST SEEN: <span className="cz-redact">Pier 9, 2:1</span>1 PM</div>
                    <div className="cz-evidence-line">CLEARANCE: LEVEL <span className="cz-redact">3</span> REQUIRED</div>
                  </div>
                </div>
                <div className="cz-card cz-card-c cz-edge">
                  <div className="cz-card-label cz-mono"><GitBranch size={13} /> DEDUCTION BOARD</div>
                  <div className="cz-card-title cz-display" style={{ fontSize: 17 }}>Pin it. Connect it. Prove it.</div>
                  <div className="cz-timeline">
                    <div className="cz-tl-node"><span className="cz-tl-dot" /><div className="cz-tl-label cz-mono">WITNESS A</div><div className="cz-tl-text">Saw the car leave at 2 AM.</div></div>
                    <div className="cz-tl-node flag"><span className="cz-tl-dot" /><div className="cz-tl-label cz-mono">ALIBI — BROKEN</div><div className="cz-tl-text">Claimed to be home by then.</div></div>
                  </div>
                </div>
                <div className="cz-card cz-card-d cz-edge">
                  <div className="cz-card-label cz-mono"><Shuffle size={13} /> DYNAMIC</div>
                  <div className="cz-card-title cz-display" style={{ fontSize: 16 }}>The file reshuffles.</div>
                  <p className="cz-card-copy">Motives, alibis, and the guilty party change between playthroughs.</p>
                </div>
                <div className="cz-card cz-card-e cz-edge">
                  <div style={{ flexBasis: "100%" }}><div className="cz-card-label cz-mono"><Fingerprint size={13} /> YOUR VERDICT IS FINAL</div></div>
                  <div className="cz-verdict-col"><div className="cz-verdict-head"><RadioTower size={15} color="var(--cyan)" /> Convicted</div><div className="cz-verdict-copy">The case closes on your word.</div></div>
                  <div className="cz-verdict-divider" />
                  <div className="cz-verdict-col"><div className="cz-verdict-head"><RadioTower size={15} color="var(--amber)" /> Released</div><div className="cz-verdict-copy">Not enough to hold them. They walk.</div></div>
                  <div className="cz-verdict-divider" />
                  <div className="cz-verdict-col"><div className="cz-verdict-head"><RadioTower size={15} color="var(--ink-muted)" /> Unresolved</div><div className="cz-verdict-copy">Cold cases don't disappear.</div></div>
                </div>
              </div>
            </Reveal>
          </section>

          <section className="cz-section" id="protocol">
            <Reveal>
              <div className="cz-section-eyebrow cz-mono">PROTOCOL</div>
              <h2 className="cz-section-heading cz-display">Three rules every detective breaks eventually.</h2>
            </Reveal>
            <div style={{ marginTop: 48 }}>
              {RULES.map((r, i) => (<Reveal key={r.num} delay={i * 90}><RuleBar rule={r} /></Reveal>))}
            </div>
          </section>

          <section className="cz-access" id="access">
            <Reveal>
              <div className="cz-access-box cz-edge">
                <div className="cz-section-eyebrow cz-mono" style={{ marginBottom: 6 }}>CLEARANCE REQUIRED</div>
                <h3 className="cz-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 26 }}>Access Terminal</h3>
                
                {error && <div style={{ color: "var(--amber-deep)", marginBottom: "16px", fontSize: "13px", textAlign: "center", background: "rgba(255,122,26,0.1)", padding: "10px", borderRadius: "8px" }}>{error}</div>}

                <form onSubmit={handleAuth}>
                  <div className="cz-field">
                    <label className="cz-field-label">ALIAS</label>
                    <div className="cz-input-wrap cz-edge">
                      <Fingerprint size={16} />
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="operative_name" />
                    </div>
                  </div>
                  <div className="cz-field">
                    <label className="cz-field-label">PASSPHRASE</label>
                    <div className="cz-input-wrap cz-edge">
                      <KeyRound size={16} />
                      <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••••" />
                      <button type="button" className="cz-eye-btn" onClick={() => setShowPass((s) => !s)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <MagneticButton as="button" type="submit" disabled={loading} className="cz-submit">
                    {loading ? "AUTHENTICATING..." : isLogin ? "INITIATE LINK" : "CREATE PROFILE"} <ChevronRight size={16} />
                  </MagneticButton>
                  <div className="cz-access-foot">
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
                      {isLogin ? "No badge yet? Request clearance." : "Already an investigator? Authenticate."}
                    </button>
                  </div>
                </form>
              </div>
            </Reveal>
          </section>

          <footer className="cz-footer">
            <div>© 2026 CASEZERO ARCHIVES — ALL FILES CONFIDENTIAL.</div>
            <div>
              <a href="#dossier" onClick={scrollTo("#dossier")}>PRIVACY</a>
              <a href="#protocol" onClick={scrollTo("#protocol")}>TERMS</a>
            </div>
          </footer>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW 2: LOGGED IN INTERACTIVE DASHBOARD    */}
      {/* ========================================== */}
      {token && (
        <div className="flex w-full h-screen relative z-10">
          <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(92,225,230,0.1), transparent 70%)', filter: 'blur(100px)', zIndex: -1 }}></div>
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,178,63,0.1), transparent 70%)', filter: 'blur(100px)', zIndex: -1 }}></div>

          {/* Sidebar */}
          <div className="w-72 flex flex-col z-20 p-6" style={{ background: 'var(--surface-soft)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="mb-10 flex items-center justify-between">
              <div className="cz-display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 8 }}>
                <Incognito size={28} strokeWidth={2} color="var(--amber)" />
                <div>
                  <span style={{ color: "var(--bone)" }}>CASE</span>
                  <span style={{ color: "var(--amber)", fontWeight: 500 }}>ZERO</span>
                </div>
              </div>
              <button onClick={() => setMuted(!muted)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} color="var(--amber)" />}
              </button>
            </div>

            {!activeCase ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="cz-edge p-5">
                  <div className="cz-card-label cz-mono" style={{ marginBottom: 8 }}><Radio size={14} className="animate-pulse" /> Welcome Investigator</div>
                  <p className="cz-card-copy" style={{ fontSize: 12 }}>Select a classified archive from the main grid to initiate sensor decryption, cross-examination, and filing protocols.</p>
                </div>
                <button onClick={handleLogout} className="cz-edge p-4 flex items-center justify-center gap-2 cz-mono" style={{ fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer', background: 'transparent' }}>
                  <Lock size={14} /> SECURE LOGOUT
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <button onClick={() => setActiveCase(null)} className="cz-mono flex items-center gap-2" style={{ background: 'none', border: 'none', color: 'var(--amber)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer', marginBottom: 20 }}>
                    &larr; BACK TO GRID
                  </button>
                  {["BRIEFING", "SUSPECTS", "EVIDENCE"].map((tab) => (
                    <button 
                      key={tab} onClick={() => setActiveTab(tab as any)} 
                      className="cz-edge w-full p-4 flex items-center justify-between cz-mono"
                      style={{ background: activeTab === tab ? 'rgba(255,178,63,0.1)' : 'transparent', color: activeTab === tab ? 'var(--amber)' : 'var(--ink-muted)', fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer' }}
                    >
                      <div className="flex items-center gap-3">
                        {tab === "BRIEFING" && <FolderSearch size={14} />}
                        {tab === "SUSPECTS" && <Users size={14} />}
                        {tab === "EVIDENCE" && <Fingerprint size={14} />}
                        {tab}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowAccuseModal(true)} className="cz-submit" style={{ padding: '16px' }}>FILE ACCUSATION</button>
              </div>
            )}
          </div>

          {/* Main Dashboard Area */}
          <div className="flex-1 p-10 max-h-screen overflow-y-auto">
            {!activeCase ? (
              <div className="max-w-6xl mx-auto pt-10">
                <div className="cz-section-eyebrow cz-mono flex items-center gap-2"><Terminal size={14} /> CLASSIFIED ARCHIVES</div>
                <h2 className="cz-section-heading cz-display">Active Investigations</h2>

                {cases.length === 0 ? (
                  <div className="cz-edge p-20 flex flex-col items-center justify-center text-center mt-12 opacity-70">
                    <DatabaseBackup size={48} className="text-slate-700 mb-4 animate-pulse" />
                    <p className="cz-mono text-xs tracking-widest text-slate-500">NO ACTIVE CASES IN DATABASE.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mt-12">
                    {cases.map((c, i) => {
                      // Bento Layout Math: Alternating wide (4-col) and narrow (2-col) cards
                      let spanClass = "lg:col-span-3"; 
                      if (i % 4 === 0) spanClass = "lg:col-span-4";
                      else if (i % 4 === 1) spanClass = "lg:col-span-2";
                      else if (i % 4 === 2) spanClass = "lg:col-span-2";
                      else if (i % 4 === 3) spanClass = "lg:col-span-4";

                      return (
                        <div 
                          key={c.id} 
                          onClick={() => { playSound("click"); setActiveCase(c); setActiveTab("BRIEFING"); }} 
                          className={`cz-card cz-edge group ${spanClass} relative overflow-hidden flex flex-col justify-between`} 
                          style={{ cursor: 'pointer', minHeight: '240px' }}
                        >
                          {/* Internal Card Glow */}
                          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--cyan), transparent 70%)', filter: 'blur(40px)' }}></div>
                          
                          <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="cz-card-label cz-mono mb-0"><Sparkles size={12} /> {c.id}-SEC</div>
                            <div className="cz-mono text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0" style={{ color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>
                              ACCESS FILE <ArrowUpRight size={14} strokeWidth={2.5} />
                            </div>
                          </div>
                          
                          <div className="relative z-10 mt-auto">
                            <h3 className="cz-display text-2xl font-bold mb-3 group-hover:text-white transition-colors" style={{ color: 'var(--bone)' }}>{c.title}</h3>
                            <div className="cz-mono text-[9px] mb-4 inline-block px-2 py-1 rounded-sm tracking-widest font-bold" style={{ background: 'rgba(255,122,26,0.1)', color: 'var(--amber-deep)' }}>
                              {c.theme.toUpperCase()}
                            </div>
                            <p className="cz-card-copy line-clamp-2 pr-4">"{c.backstory}"</p>
                          </div>

                          {/* Decorative Tech Border Bottom */}
                          <div className="absolute bottom-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out" style={{ background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)' }}></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto pt-10 pb-20">
                <div className="cz-section-eyebrow cz-mono flex items-center gap-2"><Radio size={14} className="animate-pulse" /> FILE ID: #00{activeCase.id}</div>
                <h2 className="cz-section-heading cz-display mb-12">{activeCase.title}</h2>

                {/* BRIEFING */}
                {activeTab === "BRIEFING" && (
                  <div className="cz-card cz-edge p-10">
                    <div className="cz-card-label cz-mono" style={{ marginBottom: 20 }}>INCIDENT REPORT DATA-STREAM</div>
                    <p className="cz-serif" style={{ fontSize: 20, lineHeight: 1.8, color: 'var(--bone)' }}>
                      {typewriterText}
                      {textIndex < activeCase.backstory.length && <span className="inline-block w-2 h-5 bg-amber-500 ml-1 animate-pulse align-middle"></span>}
                    </p>
                  </div>
                )}

                {/* SUSPECTS */}
                {activeTab === "SUSPECTS" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeCase.suspects.map((sus) => (
                      <div key={sus.id} onClick={() => { setActiveSuspect(sus); setChatMessages([]); }} className="cz-card cz-edge group" style={{ cursor: 'pointer' }}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <UserCircle size={32} color="var(--ink-muted)" />
                            <div>
                              <div className="cz-card-title cz-display mb-0">{sus.name}</div>
                              <div className="cz-mono" style={{ fontSize: 10, color: 'var(--ink-muted)' }}>ID-NODE-0{sus.id}</div>
                            </div>
                          </div>
                          <div className="cz-mono" style={{ fontSize: 10, color: 'var(--amber)' }}>THREAT: {sus.threat_level}/5</div>
                        </div>
                        <p className="cz-card-copy italic mb-6">"{sus.description}"</p>
                        <div className="cz-mono flex items-center justify-between" style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 'auto' }}>
                          <span>INTERROGATE SUSPECT</span> <MessageSquare size={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* EVIDENCE */}
                {activeTab === "EVIDENCE" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeCase.evidence.map((item) => {
                      const isDecrypted = decryptedEvidenceIds.includes(item.id);
                      return (
                        <div key={item.id} className="cz-card cz-edge flex flex-col justify-between" style={{ minHeight: 200, borderStyle: isDecrypted ? 'solid' : 'dashed', borderColor: isDecrypted ? 'rgba(255,255,255,0.05)' : 'rgba(255,122,26,0.3)' }}>
                          <div>
                            <div className="flex justify-between items-center mb-6">
                              <h4 className="cz-mono font-bold" style={{ fontSize: 13, color: isDecrypted ? 'var(--bone)' : 'var(--ink-muted)' }}>{isDecrypted ? item.name : "CLASSIFIED NODE"}</h4>
                              <span className="cz-mono" style={{ fontSize: 9, padding: '4px 8px', borderRadius: 4, background: isDecrypted ? 'rgba(92,225,230,0.1)' : 'rgba(255,122,26,0.1)', color: isDecrypted ? 'var(--cyan)' : 'var(--amber-deep)' }}>{isDecrypted ? "SECURED" : "LOCKED"}</span>
                            </div>
                            {isDecrypted ? (
                              <p className="cz-card-copy">{item.description}</p>
                            ) : (
                              <div className="text-center p-6 bg-black/20 rounded">
                                <span className="cz-mono block mb-2 text-[10px] text-slate-600">DATA CORRUPT</span>
                                <span className="cz-mono text-xs text-amber-800 bg-amber-950/20 px-3 py-1 rounded">0X77A901FBC32</span>
                              </div>
                            )}
                          </div>
                          {!isDecrypted && (
                            <button onClick={() => startDecryptionProcess(item.id)} disabled={decryptingId === item.id} className="cz-edge w-full py-3 mt-4 cz-mono text-xs text-slate-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer' }}>
                              {decryptingId === item.id ? "DECRYPTING..." : "BYPASS SECURITY"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DASHBOARD MODALS */}

          {/* 1. Crypto Modal */}
          {miniGameTargetId && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="cz-card cz-edge w-full max-w-md p-8" style={{ background: 'var(--obsidian)' }}>
                <div className="cz-card-label cz-mono"><Terminal size={14} /> DECRYPT EVIDENCE</div>
                <p className="cz-card-copy mb-6" style={{ fontSize: 12 }}>Unscramble the sequence to view the file.</p>
                <div className="text-center p-6 bg-black rounded mb-6 cz-mono text-2xl tracking-[0.3em] font-bold text-amber-500">{scrambleWord}</div>
                <form onSubmit={verifyDecryptionGuess} className="space-y-4">
                  <input type="text" required value={userGuess} onChange={e => setUserGuess(e.target.value)} placeholder="ENTER WORD..." className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white uppercase text-center tracking-widest font-mono outline-none focus:border-amber-500" />
                  {gameError && <p className="cz-mono text-[10px] text-red-500 text-center animate-pulse">!! INCORRECT SEQUENCE !!</p>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setMiniGameTargetId(null)} className="cz-edge flex-1 py-3 cz-mono text-[11px] text-slate-400 bg-transparent border-none cursor-pointer hover:text-white">ABORT</button>
                    <button type="submit" className="flex-1 py-3 cz-mono text-[11px] font-bold text-black border-none cursor-pointer" style={{ background: 'var(--amber)', borderRadius: 10 }}>DECRYPT</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. Chat Modal */}
          {activeSuspect && activeCase && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
              <div className="cz-card cz-edge w-full max-w-3xl flex flex-col h-[85vh] p-0 overflow-hidden" style={{ background: 'var(--obsidian)' }}>
                <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'var(--surface-soft)' }}>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={16} color="var(--cyan)" />
                    <div>
                      <div className="cz-display font-bold text-sm">INTERROGATION PROTOCOL</div>
                      <div className="cz-mono text-[10px] text-slate-500 mt-1">SUBJECT: {activeSuspect.name}</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveSuspect(null)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`cz-bubble ${msg.role === 'user' ? 'cz-bubble-det' : 'cz-bubble-sus'}`}>
                      <span className="cz-mono block mb-2 opacity-50 flex items-center gap-2" style={{ fontSize: 9 }}>{msg.role === 'user' ? <User size={10} /> : <Radio size={10} />} {msg.role === 'user' ? 'YOU' : activeSuspect.name}</span>
                      <p className="cz-serif" style={{ fontSize: 15 }}>{msg.text}</p>
                    </div>
                  ))}
                  {isTyping && <div className="cz-bubble cz-bubble-sus"><span className="cz-typing"><span /><span /><span /></span></div>}
                </div>
                <form onSubmit={handleSendMessage} className="p-5 border-t flex gap-3" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'var(--surface-soft)' }}>
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask a question..." className="flex-1 bg-black border border-white/10 rounded-lg px-5 py-3 text-sm text-white font-mono outline-none focus:border-cyan-500" />
                  <button type="submit" disabled={isTyping || !chatInput.trim()} className="px-6 rounded-lg border-none cursor-pointer flex items-center justify-center" style={{ background: 'var(--cyan)', color: 'black' }}><Send size={18} /></button>
                </form>
              </div>
            </div>
          )}

          {/* 3. Accusation Modal */}
          {showAccuseModal && activeCase && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
              <div className="cz-card cz-edge w-full max-w-4xl p-10" style={{ background: 'var(--obsidian)' }}>
                {!gameResult ? (
                  <>
                    <div className="text-center mb-10">
                      <ShieldAlert size={40} className="mx-auto mb-4" color="var(--amber-deep)" />
                      <h3 className="cz-display text-2xl font-bold mb-2">Issue Arrest Warrant</h3>
                      <p className="cz-mono text-xs text-slate-500">Choose carefully. This action cannot be undone.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                      {activeCase.suspects.map(sus => (
                        <div key={sus.id} onClick={() => setAccuseTarget(sus.id)} className="cz-card cz-edge p-5" style={{ cursor: 'pointer', background: accuseTarget === sus.id ? 'rgba(255,178,63,0.1)' : 'var(--surface-soft)', borderColor: accuseTarget === sus.id ? 'var(--amber)' : 'transparent' }}>
                          <UserCircle size={24} className="mb-3" color={accuseTarget === sus.id ? 'var(--amber)' : 'var(--ink-muted)'} />
                          <h5 className="cz-display font-bold text-sm mb-1">{sus.name}</h5>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end border-t pt-6 gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <button onClick={() => setShowAccuseModal(false)} className="px-6 py-3 cz-mono text-xs text-slate-400 bg-transparent border-none cursor-pointer hover:text-white">ABORT</button>
                      <button onClick={handleAccusation} disabled={!accuseTarget || isResolving} className="px-8 py-3 cz-mono font-bold text-black border-none cursor-pointer rounded-lg disabled:opacity-40" style={{ background: 'var(--amber)' }}>{isResolving ? "PROCESSING..." : "CONFIRM ARREST"}</button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-8">
                    <div className="inline-flex p-6 rounded-full border" style={{ background: gameResult.success ? 'rgba(92,225,230,0.1)' : 'rgba(255,122,26,0.1)', borderColor: gameResult.success ? 'var(--cyan)' : 'var(--amber-deep)' }}>
                      {gameResult.success ? <Shield size={56} color="var(--cyan)" /> : <X size={56} color="var(--amber-deep)" />}
                    </div>
                    <div>
                      <span className="cz-mono text-xs font-bold tracking-widest block mb-2" style={{ color: gameResult.success ? 'var(--cyan)' : 'var(--amber-deep)' }}>{gameResult.success ? "CASE SOLVED" : "INVESTIGATION FAILED"}</span>
                      <h3 className="cz-display text-4xl font-light uppercase">Resolution Report</h3>
                    </div>
                    <div className="text-left p-8 rounded-xl cz-edge cz-serif text-slate-300 text-lg leading-relaxed" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      {gameResult.narrative}
                    </div>
                    <button onClick={() => window.location.reload()} className="px-8 py-4 cz-mono font-bold uppercase text-xs border-none cursor-pointer rounded-lg text-black hover:opacity-80" style={{ background: 'var(--bone)' }}>Return to Main Menu</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}