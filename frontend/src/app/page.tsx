"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { 
  UserCircle, ShieldAlert, Lock, User, Terminal, DatabaseBackup, Fingerprint, 
  FolderSearch, Users, ChevronRight, MessageSquare, Send, X, Shield, 
  Volume2, VolumeX, Radio, Sparkles, GitBranch, Eye, EyeOff, KeyRound, 
  ArrowUpRight, RadioTower, Shuffle, ChevronDown, VenetianMask,
  ArrowLeft, ArrowRight, FileText, Clock, AlertTriangle, Search, ArrowDownUp
} from "lucide-react";

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("casezero_token");
      window.location.reload(); // forces back to login cleanly instead of half-broken state
    }
    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------------ */
/* Helper Components                                                 */
/* ------------------------------------------------------------------ */

const AVATARS = ["🕵️", "🎩", "🗡️", "🔦", "🧥", "📷"];

function ProfileSetup({ token, onDone }: { token: string, onDone: (p: any) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await axios.patch("http://127.0.0.1:8000/auth/profile",
        { detective_name: name, avatar_id: avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDone(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cz-access" style={{ minHeight: "100vh", alignItems: "center" }}>
      <div className="cz-access-box cz-edge">
        <div className="cz-section-eyebrow cz-mono">IDENTITY REGISTRATION</div>
        <h3 className="cz-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 26 }}>Set Your Detective Profile</h3>
        <form onSubmit={submit}>
          <div className="cz-field">
            <label className="cz-field-label">CHOOSE YOUR MARK</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {AVATARS.map(a => (
                <button type="button" key={a} onClick={() => setAvatar(a)}
                  className="cz-edge" style={{
                    fontSize: 24, padding: 12, cursor: "pointer",
                    background: avatar === a ? "rgba(255,178,63,0.15)" : "transparent",
                    borderColor: avatar === a ? "var(--amber)" : undefined
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="cz-field">
            <label className="cz-field-label">DETECTIVE NAME</label>
            <div className="cz-input-wrap cz-edge">
              <UserCircle size={16} />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vale Marlowe" required />
            </div>
          </div>
          <MagneticButton as="button" type="submit" disabled={saving} className="cz-submit">
            {saving ? "SAVING..." : "ENTER THE ARCHIVE"} <ChevronRight size={16} />
          </MagneticButton>
        </form>
      </div>
    </div>
  );
}

function ProfileModal({ token, profile, onClose, onSave }: { token: string, profile: any, onClose: () => void, onSave: (p: any) => void }) {
  const [name, setName] = useState(profile.detective_name || "");
  const [avatar, setAvatar] = useState(profile.avatar_id || AVATARS[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await axios.patch("http://127.0.0.1:8000/auth/profile",
        { detective_name: name, avatar_id: avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSave({ ...profile, ...res.data });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="cz-edge w-full max-w-md p-8" style={{ background: 'var(--obsidian)' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="cz-section-eyebrow cz-mono">DETECTIVE PROFILE</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="cz-edge p-3">
            <div className="cz-mono text-[10px] text-slate-500 mb-1">RATING</div>
            <div className="cz-display font-bold text-lg" style={{ color: 'var(--amber)' }}>{profile.rating ?? 100}</div>
          </div>
          <div className="cz-edge p-3">
            <div className="cz-mono text-[10px] text-slate-500 mb-1">SOLVED</div>
            <div className="cz-display font-bold text-lg" style={{ color: 'var(--cyan)' }}>{profile.cases_solved ?? 0}</div>
          </div>
          <div className="cz-edge p-3">
            <div className="cz-mono text-[10px] text-slate-500 mb-1">FAILED</div>
            <div className="cz-display font-bold text-lg" style={{ color: 'var(--amber-deep)' }}>{profile.cases_failed ?? 0}</div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="cz-field">
            <label className="cz-field-label">MARK</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {AVATARS.map(a => (
                <button type="button" key={a} onClick={() => setAvatar(a)}
                  className="cz-edge" style={{ fontSize: 22, padding: 10, cursor: "pointer", background: avatar === a ? "rgba(255,178,63,0.15)" : "transparent", borderColor: avatar === a ? "var(--amber)" : undefined }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="cz-field">
            <label className="cz-field-label">DETECTIVE NAME</label>
            <div className="cz-input-wrap cz-edge">
              <UserCircle size={16} />
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>
          <MagneticButton as="button" type="submit" disabled={saving} className="cz-submit">
            {saving ? "SAVING..." : "SAVE CHANGES"} <ChevronRight size={16} />
          </MagneticButton>
        </form>
      </div>
    </div>
  );
}


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

function VerdictReveal({ result, onClose, onTryAgain, onRevealTruth, truth }: { result: any, onClose: () => void, onTryAgain: () => void, onRevealTruth: () => void, truth: {name: string, description: string, alibi: string} | null }) {
  const [stage, setStage] = useState(0);
  const paragraphs = (result.narrative || "").split(/\n\s*\n/).filter(Boolean);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 200),
      setTimeout(() => setStage(2), 900),
      setTimeout(() => setStage(3), 1500),
      setTimeout(() => setStage(4), 2400),
      setTimeout(() => setStage(5), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="text-center space-y-8">
      <div className={`cz-verdict-icon ${stage >= 1 ? "cz-verdict-in" : ""}`}
        style={{ background: result.success ? 'rgba(92,225,230,0.1)' : 'rgba(255,122,26,0.1)', borderColor: result.success ? 'var(--cyan)' : 'var(--amber-deep)' }}>
        {result.success ? <Shield size={56} color="var(--cyan)" /> : <X size={56} color="var(--amber-deep)" />}
      </div>

      <div className={`cz-verdict-fade ${stage >= 2 ? "cz-verdict-in" : ""}`}>
        <span className="cz-mono text-xs font-bold tracking-widest block mb-2" style={{ color: result.success ? 'var(--cyan)' : 'var(--amber-deep)' }}>
          {result.success ? "CASE SOLVED" : "WRONG SUSPECT"}
        </span>
        <h3 className="cz-display text-4xl font-light uppercase">Resolution Report</h3>
      </div>

      <div className="text-left p-8 rounded-xl cz-edge cz-serif text-slate-300 text-lg leading-relaxed space-y-5" style={{ background: 'rgba(0,0,0,0.4)' }}>
        {paragraphs.map((p: string, i: number) => (
          <p key={i} className={`cz-verdict-fade ${stage >= 3 + i ? "cz-verdict-in" : ""}`}>{p}</p>
        ))}
      </div>

      {!result.success && truth && (
        <div className="text-left p-6 rounded-xl cz-edge cz-verdict-fade cz-verdict-in" style={{ background: 'rgba(92,225,230,0.06)', borderColor: 'rgba(92,225,230,0.3)' }}>
          <div className="cz-mono text-[11px] mb-2" style={{ color: 'var(--cyan)' }}>THE ACTUAL CULPRIT</div>
          <div className="cz-display font-bold text-lg mb-2">{truth.name}</div>
          <p className="cz-card-copy">{truth.description}</p>
        </div>
      )}

      <div className={`flex flex-wrap gap-3 justify-center cz-verdict-fade ${stage >= 5 ? "cz-verdict-in" : ""}`}>
        {!result.success ? (
          <>
            <button onClick={onTryAgain} className="px-6 py-3 cz-mono font-bold uppercase text-xs border-none cursor-pointer rounded-lg text-black hover:opacity-80" style={{ background: 'var(--amber)' }}>Try Again</button>
            {!truth && (
              <button onClick={onRevealTruth} className="cz-edge px-6 py-3 cz-mono text-xs" style={{ color: 'var(--cyan)', background: 'rgba(92,225,230,0.08)', border: 'none', cursor: 'pointer' }}>Reveal the Truth</button>
            )}
            <button onClick={onClose} className="cz-edge px-6 py-3 cz-mono text-xs text-slate-400 bg-transparent border-none cursor-pointer">Close</button>
          </>
        ) : (
          <button onClick={onClose} className="px-8 py-4 cz-mono font-bold uppercase text-xs border-none cursor-pointer rounded-lg text-black hover:opacity-80" style={{ background: 'var(--bone)' }}>Close</button>
        )}
      </div>
    </div>
  );
}

function SuspectBrief({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const short = text.length > 70 ? text.slice(0, 70).trim() + "…" : text;
  return (
    <div onClick={() => setOpen(o => !o)} style={{ cursor: "pointer", marginBottom: 18 }}>
      <p className="cz-card-copy italic">"{open ? text : short}"</p>
      {text.length > 70 && (
        <span className="cz-mono" style={{ fontSize: 10, color: "var(--cyan)", opacity: 0.8 }}>
          {open ? "SHOW LESS" : "READ FULL STATEMENT"}
        </span>
      )}
    </div>
  );
}

function threatColor(t: number) {
  if (t >= 4) return "255,122,26"; // Amber-deep
  if (t === 3) return "92,225,230"; // Cyan
  return "138,141,151"; // Muted
}

function Portrait({ id, hue, threat, name }: { id: number, hue: string, threat: number, name: string }) {
  // Pulls a random, gritty grayscale photo based on the suspect's name
  const avatarUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200?grayscale`;

  return (
    <div className="czs-portrait" style={{ backgroundColor: '#0a0b0d' }}>
      
      {/* 1. Surveillance Photo Base */}
      <img 
        src={avatarUrl} 
        alt="suspect surveillance" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70" 
        style={{ filter: 'contrast(1.3) brightness(0.7)' }}
      />
      
      {/* 2. Cyber-Noir Color Tint */}
      <div className="absolute inset-0 z-10 mix-blend-color" style={{ backgroundColor: `rgb(${hue})` }} />
      <div className="absolute inset-0 z-10 mix-blend-multiply opacity-60" style={{ backgroundColor: `rgb(${hue})` }} />

      {/* 3. Heavy Vignette */}
      <div className="absolute inset-0 z-10" style={{ background: 'radial-gradient(circle at center, transparent 10%, #07080a 95%)' }} />

      {/* 4. Security Camera Scanlines */}
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="czs-portrait-svg absolute inset-0 z-20 pointer-events-none opacity-40">
        <defs>
          <pattern id={`czs-scan-${id}`} width="4" height="4" patternTransform="rotate(0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="10" y2="0" stroke="#ffffff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#czs-scan-${id})`} />
      </svg>

      {/* 5. Targeting Brackets */}
      <svg className="czs-brackets z-30" viewBox="0 0 200 200">
        <g stroke={`rgba(${hue}, 0.9)`} strokeWidth="2" fill="none">
          <path d="M10,26 L10,10 L26,10" />
          <path d="M174,10 L190,10 L190,26" />
          <path d="M190,174 L190,190 L174,190" />
          <path d="M26,190 L10,190 L10,174" />
        </g>
      </svg>

      {/* 6. UI Elements */}
      <div className="czs-scanline z-30" style={{ background: `linear-gradient(180deg, transparent, rgba(${hue},0.6), transparent)` }} />
      <div className="czs-node-tag czs-mono z-30">ID-NODE-0{id}</div>

      <div className="czs-threat-meter z-30">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="czs-threat-seg" style={{ background: n <= threat ? `rgb(${hue})` : "rgba(255,255,255,0.12)" }} />
        ))}
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
interface Evidence { id: number; name: string; description: string; cipher_word: string; hint: string; }
interface Suspect { id: number; name: string; description: string; alibi: string; threat_level: number; is_guilty: boolean; }
interface Case { id: number; title: string; theme: string; backstory: string; suspects: Suspect[]; evidence: Evidence[]; cover_image_url?: string; }

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
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState("");
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
  const [truthReveal, setTruthReveal] = useState<{name: string, description: string, alibi: string} | null>(null);

  const [profile, setProfile] = useState<{detective_name: string, avatar_id: string, profile_complete: number, rating?: number, cases_solved?: number, cases_failed?: number} | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [caseResolution, setCaseResolution] = useState<any>(null);

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
      axios.get("http://127.0.0.1:8000/auth/me", { headers: { Authorization: `Bearer ${savedToken}` } })
        .then(res => {
          setProfile(res.data);
          setNeedsSetup(res.data.profile_complete === 0);
        })
        .catch(() => handleLogout());
    }
  }, []);

  // Typewriter for Briefing
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

  /* ================================================================== */
  /* NEW API HANDLERS (Database Persistence)                            */
  /* ================================================================== */

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append("username", username);
        params.append("password", password);
        const res = await axios.post("http://127.0.0.1:8000/auth/token", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        localStorage.setItem("casezero_token", res.data.access_token);
        setToken(res.data.access_token);
        setProfile({ detective_name: res.data.detective_name, avatar_id: res.data.avatar_id, profile_complete: res.data.profile_complete });
        setNeedsSetup(res.data.profile_complete === 0);
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

  const handleSelectCase = async (c: Case) => {
    playSound("click");
    setActiveCase(c);
    setActiveTab("BRIEFING");
    // Fetch Saved Evidence Progress
    try {
      const res = await axios.get(`http://127.0.0.1:8000/ai/progress/${c.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.decrypted_ids) {
        setDecryptedEvidenceIds(res.data.decrypted_ids);
      }
    } catch (err) {
      console.error("Could not fetch progress:", err);
      setDecryptedEvidenceIds([]);
      setTruthReveal(null);
    }
    try {
      const res = await axios.get(`http://127.0.0.1:8000/ai/resolve/${c.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCaseResolution(res.data);
    } catch {
      setCaseResolution(null);
    }
  };

  const handleSelectSuspect = async (sus: Suspect) => {
    playSound("click");
    setActiveSuspect(sus);
    setChatMessages([]);
    // Fetch Saved Chat History
    try {
      const res = await axios.get(`http://127.0.0.1:8000/ai/chat/${activeCase?.id}/${sus.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.length > 0) {
        setChatMessages(res.data);
      }
    } catch (err) {
      console.error("Could not fetch chat history:", err);
    }
  };

  const startDecryptionProcess = (evidenceId: number) => {
    playSound("click");
    const evidenceItem = activeCase?.evidence.find(e => e.id === evidenceId);
    if (!evidenceItem) return;
    const targetWord = evidenceItem.cipher_word.toUpperCase();
    (window as any)[`crypto_${evidenceId}`] = targetWord;
    setScrambleWord(targetWord.split('').sort(() => Math.random() - 0.5).join(''));
    setMiniGameTargetId(evidenceId);
    setUserGuess("");
    setGameError(false);
    setShowHint(false);
  };

  const revealHint = () => {
    playSound("click");
    const evidenceItem = activeCase?.evidence.find(e => e.id === miniGameTargetId);
    setHintText(evidenceItem?.hint || "No intel available.");
    setShowHint(true);
  };

  const verifyDecryptionGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniGameTargetId || !activeCase || !token) return;
    
    const correctWord = (window as any)[`crypto_${miniGameTargetId}`];
    if (userGuess.toUpperCase().trim() === correctWord) {
      playSound("success");
      setDecryptingId(miniGameTargetId);
      
      // Save Evidence Progress to Database Immediately
      try {
        await axios.post("http://127.0.0.1:8000/ai/progress/save", {
          case_id: activeCase.id,
          evidence_id: miniGameTargetId
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.error("Failed to save evidence progress", err);
      }

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
      // 1. Save User's Message to Database
      await axios.post("http://127.0.0.1:8000/ai/chat/save", {
        case_id: activeCase.id,
        suspect_id: activeSuspect.id,
        role: 'user',
        text: query
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 2. Fetch AI Response
      const res = await axios.post("http://127.0.0.1:8000/ai/interrogate/", { 
        case_id: activeCase.id, 
        suspect_id: activeSuspect.id, 
        question: query 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      const replyText = res.data.reply;
      setChatMessages(prev => [...prev, { role: 'suspect', text: replyText }]);

      // 3. Save AI's Response to Database
      await axios.post("http://127.0.0.1:8000/ai/chat/save", {
        case_id: activeCase.id,
        suspect_id: activeSuspect.id,
        role: 'suspect',
        text: replyText
      }, { headers: { Authorization: `Bearer ${token}` } });

    } catch (err) {
      console.error(err);
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
      setCaseResolution({ success: res.data.success, narrative: res.data.narrative });
      if (profile) setProfile({ ...profile, rating: res.data.rating });
      if (res.data.success) playSound("success"); else playSound("fail");
    } catch (err: any) {
      console.error("Accusation failed:", err.response?.data || err.message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleTryAgain = () => {
    setGameResult(null);
    setCaseResolution(null);
    setAccuseTarget(null);
    setTruthReveal(null);
  };

  const fetchTruth = async () => {
    if (!activeCase || !token) return;
    playSound("click");
    try {
      const res = await axios.get(`http://127.0.0.1:8000/ai/reveal-truth/${activeCase.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTruthReveal(res.data);
    } catch (err) {
      console.error("Could not reveal truth:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("casezero_token");
    setToken(null);
    setActiveCase(null);
    setCases([]);
    setMuted(true);
  };

  // Helper variables for Briefing UI calculations
  const totalBackstoryLen = activeCase ? activeCase.backstory.length : 100;
  const decryptPercent = Math.min(100, Math.round((textIndex / totalBackstoryLen) * 100));
  const isDecryptDone = textIndex >= totalBackstoryLen;

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

        .cz-logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 22px; letter-spacing: 0.08em; }
        .cz-logo-mark {
          font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--obsidian);
          background: linear-gradient(135deg, var(--amber-deep), var(--amber));
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }

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
        .cz-hero { position: relative; padding: 110px 28px 120px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .cz-orb { position: absolute; top: 50%; left: 50%; width: 720px; height: 720px; transform: translate(-50%, -55%); border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(92,225,230,0.30), transparent 55%), radial-gradient(circle at 65% 70%, rgba(255,122,26,0.28), transparent 55%), radial-gradient(circle at 50% 50%, rgba(255,178,63,0.18), transparent 60%); filter: blur(70px); animation: cz-orb-pulse 9s ease-in-out infinite; z-index: 0; }
        @keyframes cz-orb-pulse { 0%, 100% { transform: translate(-50%, -55%) scale(1); opacity: 0.75; } 50% { transform: translate(-50%, -55%) scale(1.12); opacity: 1; } }
        .cz-scanline { position: absolute; left: 8%; right: 8%; height: 1px; background: linear-gradient(90deg, transparent, rgba(92,225,230,0.55), transparent); animation: cz-scan 7s linear infinite; z-index: 1; pointer-events: none; }
        @keyframes cz-scan { 0% { top: 12%; opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { top: 92%; opacity: 0; } }

        /* Typography Components */
        .cz-eyebrow { position: relative; z-index: 2; font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 0.18em; color: var(--ink-muted); margin-bottom: 15px; display: inline-flex; align-items: center; gap: 10px; }
        .cz-cursor { animation: cz-blink 1.1s steps(1) infinite; color: var(--amber); }
        @keyframes cz-blink { 50% { opacity: 0; } }
        .cz-hero-title { position: relative; z-index: 2; }
        .cz-hero-title .accent { 
          font-family: 'Fraunces', serif; 
          font-style: italic; 
          font-weight: 600; 
          letter-spacing: -0.01em; 
          background: linear-gradient(100deg, var(--amber-deep), var(--amber) 60%, #ffe2b0); 
          -webkit-background-clip: text; 
          background-clip: text; 
          color: transparent; 
          margin: 0.05em 0.06em;
          transform: translateY(-0.08em) rotate(-1.2deg); 
          display: inline-block; 
        }
        .cz-hero-title { margin: 0; }
        .cz-hero-title .line {
          display: block;
          margin: 0;
          line-height: 0.80;
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
        .cz-access-box { width: 100%; max-width: 580px; padding: 56px; backdrop-filter: blur(24px); }
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

        /* ================================================================== */
        /* NEW STYLES: SUSPECTS (czs-) & BRIEFING (czb-)                      */
        /* ================================================================== */
        
        /* Suspects Grid */
        .czs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 1024px) { .czs-grid { grid-template-columns: 1fr; } }

        .cz-case-card {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease;
        }
        .cz-case-card:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 24px 70px -20px rgba(0,0,0,0.7);
        }

        .cz-case-cover {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,178,63,0.08), rgba(92,225,230,0.06));
        }
        
        .cz-case-cover-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 50% 40%, rgba(255,178,63,0.08), transparent 70%);
        }


        .cz-case-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: saturate(0.85) contrast(1.1) brightness(0.75);
          transform: scale(1.04);
          transition: transform 0.6s ease, filter 0.6s ease;
        }
        .cz-case-card:hover .cz-case-img {
          transform: scale(1.12);
          filter: saturate(1) contrast(1.15) brightness(0.85);
        }

        .cz-case-veil {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(7,8,10,0.15) 0%, rgba(7,8,10,0.55) 60%, rgba(7,8,10,0.95) 100%);
        }
        .cz-case-scan {
          position: absolute; left: 0; right: 0; height: 60px; top: -60px;
          background: linear-gradient(180deg, transparent, rgba(92,225,230,0.18), transparent);
          opacity: 0; transition: opacity 0.3s ease;
          animation: czs-scan-v 3.5s linear infinite;
        }
        .cz-case-card:hover .cz-case-scan { opacity: 1; }

        .cz-case-id {
          position: absolute; top: 16px; left: 16px; z-index: 2;
          font-size: 10.5px; letter-spacing: 0.1em; color: var(--amber);
          background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 999px;
        }
        .cz-case-access {
          position: absolute; top: 16px; right: 16px; z-index: 2;
          font-size: 10px; letter-spacing: 0.1em; color: var(--cyan); font-weight: 700;
          display: flex; align-items: center; gap: 5px;
          opacity: 0; transform: translateX(8px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .cz-case-card:hover .cz-case-access { opacity: 1; transform: translateX(0); }

        .cz-case-body { padding: 22px 22px 26px; position: relative; z-index: 2; margin-top: -54px; }
        .cz-case-theme {
          display: inline-block; font-size: 9.5px; letter-spacing: 0.1em; font-weight: 700;
          color: var(--amber-deep); background: rgba(255,122,26,0.12); padding: 4px 10px; border-radius: 4px; margin-bottom: 10px;
        }
        .cz-case-title { font-size: 21px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; color: var(--bone); }
        .cz-case-copy {
          color: var(--ink-muted); font-size: 13px; line-height: 1.55;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .cz-case-glowline {
          position: absolute; bottom: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          transform: scaleX(0); transform-origin: left; transition: transform 0.5s ease;
        }
        .cz-case-card:hover .cz-case-glowline { transform: scaleX(1); }

        .cz-sidebar-stats {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 4px; margin-bottom: 18px;
        }
        .cz-sidebar-stat { text-align: center; flex: 1; }
        .cz-sidebar-stat-num { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; }
        .cz-sidebar-stat-label { font-size: 9px; letter-spacing: 0.1em; color: var(--ink-muted); margin-top: 2px; }
        .cz-sidebar-stat-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.08); }

        .cz-sidebar-quote {
          font-size: 11px; font-style: italic; color: var(--ink-muted);
          padding: 14px 16px; border-left: 2px solid var(--amber); line-height: 1.6;
          background: rgba(255,178,63,0.04); border-radius: 0 8px 8px 0;
        }
        
        .czs-portrait { position: relative; height: 190px; overflow: hidden; border-radius: 16px 16px 0 0; }
        .czs-portrait-svg { width: 100%; height: 100%; display: block; }
        .czs-brackets { position: absolute; inset: 10px; width: calc(100% - 20px); height: calc(100% - 20px); pointer-events: none; z-index: 20;}
        .czs-scanline { position: absolute; left: 0; right: 0; height: 50px; top: -50px; animation: czs-scan-v 4.5s linear infinite; opacity: 0; transition: opacity 0.3s ease; z-index: 20;}
        .cz-card:hover .czs-scanline { opacity: 1; }
        @keyframes czs-scan-v { 0% { top: -50px; } 100% { top: 190px; } }
        .czs-node-tag { position: absolute; left: 14px; bottom: 12px; font-size: 10.5px; letter-spacing: 0.06em; color: rgba(236,231,220,0.9); z-index: 20; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px;}
        .czs-threat-meter { position: absolute; right: 14px; top: 14px; display: flex; gap: 3px; z-index: 20;}
        .czs-threat-seg { width: 6px; height: 16px; border-radius: 2px; }

        .czs-status-ribbon { display: flex; align-items: center; gap: 6px; font-size: 10.5px; letter-spacing: 0.08em; padding: 16px 20px 0; }
        .czs-card-body { padding: 14px 20px 22px; }
        .czs-name { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; margin-top: 4px; }
        
        .czs-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 18px; margin-top: 12px;}
        .czs-chip { font-size: 10.5px; letter-spacing: 0.02em; color: var(--bone); background: rgba(255,255,255,0.06); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);}

        .czs-interrogate {
          width: 100%; display: flex; align-items: center; gap: 8px; padding: 14px 14px; border-radius: 10px;
          background: rgba(255,178,63,0.08); border: 1px solid rgba(255,178,63,0.2); color: var(--amber); font-size: 12.5px; font-weight: 600; cursor: pointer;
          transition: all 0.25s ease;
        }
        .czs-interrogate:hover { background: rgba(255,178,63,0.16); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,178,63,0.1);}

        /* Briefing Animations & Panels */
        .czb-orb {
          position: absolute; top: -180px; right: -120px; width: 520px; height: 520px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,122,26,0.15), transparent 60%);
          filter: blur(60px); z-index: 0; animation: czb-orb-pulse 10s ease-in-out infinite; pointer-events: none;
        }
        @keyframes czb-orb-pulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }

        .czb-eyebrow { display: flex; align-items: center; gap: 10px; font-size: 12px; letter-spacing: 0.14em; color: var(--ink-muted); position: relative; z-index: 2; }
        .czb-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 8px var(--amber); animation: czb-dot 1.8s ease-in-out infinite; }
        
        .czb-title { font-size: clamp(30px, 4.2vw, 48px); font-weight: 800; letter-spacing: -0.01em; margin: 14px 0 18px; position: relative; z-index: 2; }
        .czb-meta-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-bottom: 38px; position: relative; z-index: 2; }
        .czb-chip { font-size: 11px; letter-spacing: 0.08em; padding: 7px 14px; border-radius: 999px; color: var(--amber); border: 1px solid rgba(255,178,63,0.3); background: rgba(255,178,63,0.1); }
        .czb-meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-muted); }

        .czb-panel { position: relative; border-radius: 20px; overflow: hidden; z-index: 2; }
        .czb-panel-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
        .czb-blob { position: absolute; border-radius: 50%; filter: blur(50px); }
        .czb-blob-1 { width: 320px; height: 320px; background: radial-gradient(circle, rgba(92,225,230,0.15), transparent 70%); top: -80px; left: -60px; animation: czb-float-1 12s ease-in-out infinite; }
        .czb-blob-2 { width: 280px; height: 280px; background: radial-gradient(circle, rgba(255,122,26,0.15), transparent 70%); bottom: -90px; right: -40px; animation: czb-float-2 14s ease-in-out infinite; }
        @keyframes czb-float-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.15); } }
        @keyframes czb-float-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-25px) scale(1.1); } }

        .czb-gridlines {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 34px 34px; animation: czb-pan 16s linear infinite;
        }
        @keyframes czb-pan { 0% { background-position: 0 0; } 100% { background-position: 120px 90px; } }

        .czb-panel-scan {
          position: absolute; left: 0; right: 0; height: 70px;
          background: linear-gradient(180deg, transparent, rgba(92,225,230,0.10), transparent);
          animation: czb-scan-v 5s linear infinite;
        }
        
        .czb-panel-veil { position: absolute; inset: 0; background: rgba(8,9,11,0.72); z-index: 1; }
        .czb-panel-content { position: relative; z-index: 2; padding: 30px 34px 34px; }
        .czb-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .czb-panel-label { display: flex; align-items: center; gap: 8px; font-size: 12px; letter-spacing: 0.12em; color: var(--amber); }
        .czb-decrypt-badge { font-size: 11px; color: var(--ink-muted); display: flex; align-items: center; gap: 8px; }
        
        .czb-progress-track { width: 100%; height: 2px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-bottom: 26px; overflow: hidden; }
        .czb-progress-fill { height: 100%; background: linear-gradient(90deg, var(--amber-deep), var(--cyan)); transition: width 0.1s linear; }

        .czb-report-text { font-size: 18px; line-height: 1.8; color: var(--bone); max-width: 760px; }
        .czb-cursor { display: inline-block; width: 8px; height: 18px; background: var(--amber); margin-left: 2px; vertical-align: -2px; animation: czb-blink 0.9s steps(1) infinite; }
        @keyframes czb-blink { 50% { opacity: 0; } }

        /* Preview Cards */
        .czb-previews { display: flex; gap: 18px; margin-top: 28px; flex-wrap: wrap; position: relative; z-index: 2; }
        .czb-preview-card { flex: 1 1 280px; padding: 24px; cursor: pointer; transition: all 0.3s ease;}
        .czb-preview-card:hover { transform: translateY(-4px); border-color: rgba(92,225,230,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.5);}
        .czb-preview-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .czb-preview-title { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; color: var(--bone);}
        
        .cz-dashboard-bg {
          background:
            radial-gradient(circle at 15% 0%, rgba(255,178,63,0.06), transparent 45%),
            radial-gradient(circle at 85% 20%, rgba(92,225,230,0.05), transparent 45%),
            linear-gradient(180deg, rgba(7,8,10,1) 0%, rgba(10,11,14,1) 100%);
          background-attachment: fixed;
        }

        .czb-stack { display: flex; }
        .czb-stack-avatar {
          width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #0a0a0a; margin-left: -8px; border: 2px solid var(--obsidian);
        }
        .czb-evidence-grid { display: flex; gap: 8px; margin-bottom: 14px; }
        .czb-evidence-sq {
          width: 40px; height: 40px; border-radius: 8px; background: rgba(255,255,255,0.04);
          display: flex; align-items: center; justify-content: center; color: var(--ink-muted); font-size: 11px;
        }
        .cz-evidence-card {
          position: relative;
          padding: 24px;
          padding-left: 60px;
          min-height: 200px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .cz-evidence-card:hover { transform: translateY(-3px); box-shadow: 0 14px 40px -14px rgba(0,0,0,0.5); }
        .cz-evidence-card[data-locked="true"] {
          border-style: dashed;
        }

        .cz-evidence-tab {
          position: absolute; top: 0; left: 0;
          writing-mode: vertical-rl; text-orientation: mixed;
          font-size: 9.5px; letter-spacing: 0.12em; color: var(--ink-muted);
          padding: 14px 6px; border-right: 1px solid rgba(255,255,255,0.06);
          height: 100%; display: flex; align-items: center; justify-content: center;
        }

        .cz-evidence-icon {
          position: absolute; top: 24px; left: 60px;
          transform: translateX(-50%);
          display: none;
        }

        .cz-evidence-content { position: relative; }

        .cz-evidence-corrupt {
          position: relative; overflow: hidden;
          text-align: center; padding: 20px 10px;
          background: rgba(0,0,0,0.25); border-radius: 8px;
          display: flex; flex-direction: column; gap: 6px; align-items: center;
        }
        .cz-evidence-noise {
          position: absolute; inset: 0; opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: cz-grain 1s steps(2) infinite;
        }

        .cz-evidence-btn {
          width: 100%; margin-top: 16px; padding: 12px;
          background: rgba(255,255,255,0.03); border: none; border-radius: 8px;
          color: var(--ink-muted); font-size: 11px; letter-spacing: 0.06em;
          cursor: pointer; transition: all 0.25s ease;
        }
        .cz-evidence-btn:hover { background: rgba(255,178,63,0.1); color: var(--amber); }

        .czb-evidence-sq.locked { color: var(--amber); background: rgba(255,178,63,0.08); }
        .czb-preview-link { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--cyan); margin-top: auto; font-weight: 600;}
      `}</style>

      <div className="cz-noise" />

      {/* ========================================== */}
      {/* VIEW 1: SCROLLABLE LANDING PAGE (Logged Out) */}
      {/* ========================================== */}
      {!token && (
        <div style={{ position: 'relative', zIndex: 10 }}>
          <nav className="cz-nav" data-solid={navSolid}>
            <div className="cz-logo">
              <span className="cz-logo-mark">0</span>
              <div className="cz-logo-text">
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
                <div className="cz-section-eyebrow cz-mono" style={{ marginBottom: 6 }}>GET STARTED</div>
                <h3 className="cz-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 26 }}>{isLogin ? "Log In" : "Create Account"}</h3>
                
                {error && <div style={{ color: "var(--amber-deep)", marginBottom: "16px", fontSize: "13px", textAlign: "center", background: "rgba(255,122,26,0.1)", padding: "10px", borderRadius: "8px" }}>{error}</div>}

                <form onSubmit={handleAuth}>
                  <div className="cz-field">
                    <label className="cz-field-label">USERNAME</label>
                    <div className="cz-input-wrap cz-edge">
                      <Fingerprint size={16} />
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="your_username" />
                    </div>
                  </div>
                  <div className="cz-field">
                    <label className="cz-field-label">PASSWORD</label>
                    <div className="cz-input-wrap cz-edge">
                      <KeyRound size={16} />
                      <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••••" />
                      <button type="button" className="cz-eye-btn" onClick={() => setShowPass((s) => !s)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <MagneticButton as="button" type="submit" disabled={loading} className="cz-submit">
                    {loading ? "SIGNING IN..." : isLogin ? "LOG IN" : "SIGN UP"} <ChevronRight size={16} />
                  </MagneticButton>
                  <div className="cz-access-foot">
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
                      {isLogin ? "Don't have an account? Sign up." : "Already have an account? Log in."}
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
      {token && needsSetup && (
        <ProfileSetup token={token} onDone={(p) => { setProfile(p); setNeedsSetup(false); }} />
      )}
      {token && !needsSetup && (
        <div className="flex w-full h-screen relative z-10">
          <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(92,225,230,0.1), transparent 70%)', filter: 'blur(100px)', zIndex: -1 }}></div>
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,178,63,0.1), transparent 70%)', filter: 'blur(100px)', zIndex: -1 }}></div>

          {/* Sidebar */}
          <div className="w-72 flex flex-col z-20 p-6" style={{ background: 'var(--surface-soft)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="mb-10 flex items-center justify-between">
              <div className="cz-logo">
                <span className="cz-logo-mark">0</span>
                <div className="cz-logo-text">
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
                <div>
                  <div className="cz-edge p-5 mb-4" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }}>
                    <div className="cz-card-label cz-mono" style={{ marginBottom: 8 }}>
                      {profile?.avatar_id} Detective {profile?.detective_name?.toUpperCase()}
                    </div>
                    <p className="cz-card-copy" style={{ fontSize: 12 }}>Rating: <span style={{ color: 'var(--amber)' }}>{profile?.rating ?? 100}</span> · Tap to edit profile</p>
                  </div>

                  <div className="cz-sidebar-stats">
                    <div className="cz-sidebar-stat">
                      <div className="cz-sidebar-stat-num" style={{ color: 'var(--cyan)' }}>{profile?.cases_solved ?? 0}</div>
                      <div className="cz-sidebar-stat-label cz-mono">SOLVED</div>
                    </div>
                    <div className="cz-sidebar-stat-divider" />
                    <div className="cz-sidebar-stat">
                      <div className="cz-sidebar-stat-num" style={{ color: 'var(--amber-deep)' }}>{profile?.cases_failed ?? 0}</div>
                      <div className="cz-sidebar-stat-label cz-mono">FAILED</div>
                    </div>
                    <div className="cz-sidebar-stat-divider" />
                    <div className="cz-sidebar-stat">
                      <div className="cz-sidebar-stat-num" style={{ color: 'var(--amber)' }}>{cases.length}</div>
                      <div className="cz-sidebar-stat-label cz-mono">ARCHIVE</div>
                    </div>
                  </div>

                  <div className="cz-sidebar-quote cz-mono">
                    "{RULES[Math.floor(Math.random() * RULES.length)].title}"
                  </div>
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
                        {tab === "BRIEFING" && <FileText size={14} />}
                        {tab === "SUSPECTS" && <Users size={14} />}
                        {tab === "EVIDENCE" && <Fingerprint size={14} />}
                        {tab}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowAccuseModal(true)} className="cz-submit" style={{ padding: '16px', opacity: caseResolution?.success ? 0.6 : 1 }}>
                  {caseResolution?.success ? "CASE CLOSED — SOLVED" : "FILE ACCUSATION"}
                </button>
              </div>
            )}
          </div>

          {/* Main Dashboard Area */}
          <div className="flex-1 p-10 max-h-screen overflow-y-auto cz-dashboard-bg">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 mt-12">
                    {cases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCase(c)}
                        className="cz-case-card cz-edge group"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="cz-case-cover">
                          {c.cover_image_url ? (
                            <img src={c.cover_image_url} alt={c.title} className="cz-case-img" loading="lazy" />
                          ) : (
                            <div className="cz-case-cover-fallback">
                              <Sparkles size={28} color="var(--amber)" style={{ opacity: 0.4 }} />
                            </div>
                          )}
                          <div className="cz-case-veil" />
                          <div className="cz-case-scan" />
                          <div className="cz-case-id cz-mono">{c.id}-SEC</div>
                          <div className="cz-case-access cz-mono">
                            ACCESS FILE <ArrowUpRight size={14} strokeWidth={2.5} />
                          </div>
                        </div>
                        <div className="cz-case-body">
                          <div className="cz-case-theme cz-mono">{c.theme.toUpperCase()}</div>
                          <h3 className="cz-display cz-case-title">{c.title}</h3>
                          <p className="cz-case-copy">"{c.backstory}"</p>
                        </div>
                        <div className="cz-case-glowline" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto pt-4 pb-20">
                
                {/* BRIEFING */}
                {activeTab === "BRIEFING" && (
                  <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="czb-orb" />
                    <div className="czb-eyebrow czb-mono">
                      <span className="czb-live-dot" /> <Radio size={13} /> FILE ID: #00{activeCase.id}
                    </div>
                    <h1 className="czb-title">{activeCase.title}</h1>
                    
                    <div className="czb-meta-row">
                      <span className="czb-chip czb-mono">{activeCase.theme.toUpperCase()}</span>
                      <div className="czb-meta-item czb-mono"><Clock size={13} /> FILED RECENTLY</div>
                      <div className="czb-meta-item czb-mono">THREAT <span style={{ color: "var(--amber)" }}>●●●</span>○○</div>
                    </div>

                    <div className="czb-panel cz-edge shadow-2xl">
                      <div className="czb-panel-bg">
                        <div className="czb-gridlines" />
                        <div className="czb-blob czb-blob-1" />
                        <div className="czb-blob czb-blob-2" />
                        {!isDecryptDone && <div className="czb-panel-scan" />}
                      </div>
                      <div className="czb-panel-veil" />

                      <div className="czb-panel-content">
                        <div className="czb-panel-head">
                          <div className="czb-panel-label czb-mono">
                            <AlertTriangle size={13} /> INCIDENT REPORT DATA-STREAM
                          </div>
                          <div className="czb-decrypt-badge czb-mono">
                            {isDecryptDone ? "STREAM COMPLETE" : "DECRYPTING"} — {decryptPercent}%
                          </div>
                        </div>
                        <div className="czb-progress-track">
                          <div className="czb-progress-fill" style={{ width: `${decryptPercent}%` }} />
                        </div>
                        <p className="czb-report-text czb-serif">
                          {typewriterText}
                          {!isDecryptDone && <span className="czb-cursor" />}
                        </p>
                      </div>
                    </div>

                    <div className="czb-previews">
                      <div className="czb-preview-card cz-edge" onClick={() => setActiveTab("SUSPECTS")}>
                        <div className="czb-preview-top">
                          <div className="czb-preview-title">PERSONS OF INTEREST</div>
                          <div className="czb-stack">
                            {activeCase.suspects.slice(0, 3).map((s, i) => (
                              <div key={i} className="czb-stack-avatar" style={{ background: threatColor(s.threat_level) !== "138,141,151" ? `rgb(${threatColor(s.threat_level)})` : "var(--cyan)", zIndex: 10 - i }}>
                                {s.name.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="cz-mono text-[10px] text-slate-500 mb-4">{activeCase.suspects.length} targets identified.</div>
                        <a className="czb-preview-link">View Suspect Profiles <ArrowRight size={13} /></a>
                      </div>

                      <div className="czb-preview-card cz-edge" onClick={() => setActiveTab("EVIDENCE")}>
                        <div className="czb-preview-top">
                          <div className="czb-preview-title">EVIDENCE LOGGED</div>
                        </div>
                        <div className="czb-evidence-grid">
                          {activeCase.evidence.slice(0, 4).map((e, i) => (
                            <div key={e.id} className={`czb-evidence-sq ${!decryptedEvidenceIds.includes(e.id) ? 'locked' : ''}`}>
                              {!decryptedEvidenceIds.includes(e.id) ? <Lock size={13} /> : `0${i+1}`}
                            </div>
                          ))}
                        </div>
                        <a className="czb-preview-link">View Crime Scene <ArrowRight size={13} /></a>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUSPECTS */}
                {activeTab === "SUSPECTS" && (
                  <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="czb-eyebrow czb-mono"><Users size={13} /> FILE #00{activeCase.id} — PERSONS OF INTEREST</div>
                    <h1 className="czb-title mb-8">{activeCase.suspects.length} targets identified.</h1>
                    
                    <div className="czs-grid">
                      {activeCase.suspects.map((sus) => (
                        <div key={sus.id} className="cz-card cz-edge p-0 flex flex-col group overflow-hidden">
                          <Portrait id={sus.id} hue={threatColor(sus.threat_level)} threat={sus.threat_level} name={sus.name} />

                          <div className="czs-status-ribbon czb-mono" style={{ color: `rgb(${threatColor(sus.threat_level)})` }}>
                            <ShieldAlert size={11} /> {sus.threat_level >= 4 ? "PRIME SUSPECT" : "PERSON OF INTEREST"}
                          </div>

                          <div className="czs-card-body flex-1 flex flex-col">
                              <div className="czs-name">{sus.name}</div>
  
                              <div className="czs-chips">
                                <span className="czs-chip czb-mono">ALIBI: {sus.alibi.substring(0, 15)}...</span>
                                <span className="czs-chip czb-mono">THREAT: LVL {sus.threat_level}</span>
                              </div>
                              
                              <p className="cz-card-copy italic mb-6">"{sus.description}"</p>
                              
                              <div className="mt-auto">
                                <button className="czs-interrogate czb-mono" onClick={() => handleSelectSuspect(sus)}>
                                  <MessageSquare size={14} /> Initialize Interrogation
                                  <ChevronRight size={14} className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </button>
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EVIDENCE */}
                {activeTab === "EVIDENCE" && (
                  <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="czb-eyebrow czb-mono"><Fingerprint size={13} /> FILE #00{activeCase.id} — CONFISCATED ASSETS</div>
                    <h1 className="czb-title mb-8">{activeCase.evidence.length} physical leads secured.</h1>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {activeCase.evidence.map((item, i) => {
                        const isDecrypted = decryptedEvidenceIds.includes(item.id);
                        return (
                          <div key={item.id} className="cz-evidence-card cz-edge" data-locked={!isDecrypted}>
                            <div className="cz-evidence-tab cz-mono">EXHIBIT {String(i + 1).padStart(2, '0')}</div>
                            <div className="cz-evidence-icon">
                              {isDecrypted ? <FileText size={22} color="var(--cyan)" /> : <Lock size={22} color="var(--amber-deep)" />}
                            </div>
                            <div className="cz-evidence-content">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="cz-mono font-bold" style={{ fontSize: 13, color: isDecrypted ? 'var(--bone)' : 'var(--ink-muted)' }}>
                                  {isDecrypted ? item.name : "CLASSIFIED NODE"}
                                </h4>
                                <span className="cz-mono" style={{ fontSize: 9, padding: '4px 8px', borderRadius: 4, background: isDecrypted ? 'rgba(92,225,230,0.1)' : 'rgba(255,122,26,0.1)', color: isDecrypted ? 'var(--cyan)' : 'var(--amber-deep)' }}>
                                  {isDecrypted ? "SECURED" : "LOCKED"}
                                </span>
                              </div>
                              {isDecrypted ? (
                                <p className="cz-card-copy">{item.description}</p>
                              ) : (
                                <div className="cz-evidence-corrupt">
                                  <div className="cz-evidence-noise" />
                                  <span className="cz-mono text-[10px] text-slate-600 relative z-10">DATA CORRUPT</span>
                                  <span className="cz-mono text-xs relative z-10" style={{ color: 'var(--amber-deep)', opacity: 0.7 }}>0X{Math.abs(item.id * 7919).toString(16).toUpperCase().padStart(8, '0')}</span>
                                </div>
                              )}
                              {!isDecrypted && (
                                <button onClick={() => startDecryptionProcess(item.id)} disabled={decryptingId === item.id} className="cz-evidence-btn cz-mono">
                                  {decryptingId === item.id ? "DECRYPTING..." : "BYPASS SECURITY"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                {showHint ? (
                  <p className="cz-mono text-center text-amber-500/80 text-xs mb-4 px-2">{hintText}</p>
                ) : (
                  <button type="button" onClick={revealHint} className="cz-mono text-[10px] text-cyan-400 block mx-auto mb-4 bg-transparent border-none cursor-pointer opacity-70 hover:opacity-100">
                    NEED A HINT?
                  </button>
                )}
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
                {!gameResult && !caseResolution ? (
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
                  <VerdictReveal
                    result={gameResult || caseResolution}
                    onClose={() => setShowAccuseModal(false)}
                    onTryAgain={handleTryAgain}
                    onRevealTruth={fetchTruth}
                    truth={truthReveal}
                  />
                )}
              </div>
            </div>
          )}

          {/* 4. Profile Modal */}
          {showProfileModal && profile && (
            <ProfileModal token={token!} profile={profile} onClose={() => setShowProfileModal(false)} onSave={(p) => setProfile(p)} />
          )}

        </div>
      )}
    </div>
  );
}