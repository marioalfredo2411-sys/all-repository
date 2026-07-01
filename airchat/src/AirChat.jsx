import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  primary:   "#023E8A",
  action:    "#00B4D8",
  fog:       "#CAF0F8",
  fogDark:   "#ADE8F4",
  bg:        "#FFFFFF",
  bgSoft:    "#F0FAFD",
  bgCard:    "#FAFEFF",
  text:      "#023E8A",
  textLight: "#90C4D8",
  textMuted: "#7BAFC4",
  border:    "#DCEEF5",
  shadow:    "rgba(0,180,216,0.12)",
};

// ─────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
    // inject global styles
    const s = document.createElement("style");
    s.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${C.bg}; }
      input::placeholder { color: ${C.textLight}; }
      input:focus { border-color: ${C.action} !important; outline: none; box-shadow: 0 0 0 3px rgba(0,180,216,0.15); }
      textarea:focus { outline: none; }
      @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
      @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes cloud-drift { 0%{transform:translateX(0)} 100%{transform:translateX(8px)} }
      @keyframes dash { to { stroke-dashoffset: 0; } }
      .float { animation: float 4s ease-in-out infinite; }
      .cloud1 { animation: cloud-drift 6s ease-in-out infinite alternate; }
      .cloud2 { animation: cloud-drift 8s ease-in-out infinite alternate-reverse; }
      .fade-up { animation: fade-up 0.4s ease forwards; }
    `;
    document.head.appendChild(s);
  }, []);
}

// ─────────────────────────────────────────────
// STYLES (inline, no tailwind needed)
// ─────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh", background: C.bg, color: C.text,
    fontFamily: "'Comfortaa', 'Quicksand', system-ui, sans-serif",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  wrap: {
    width: "100%", maxWidth: 420,
    padding: "0 24px", boxSizing: "border-box",
  },
  card: {
    background: C.bgCard,
    border: `1.5px solid ${C.border}`,
    borderRadius: 24,
    padding: "22px 20px",
    marginBottom: 16,
    boxShadow: `0 4px 24px ${C.shadow}`,
  },
  label: {
    display: "block", fontSize: 12, fontWeight: 700,
    color: C.textMuted, letterSpacing: 1.2,
    textTransform: "uppercase", marginBottom: 8,
    fontFamily: "'Quicksand', sans-serif",
  },
  input: {
    width: "100%", background: C.bgSoft,
    border: `1.5px solid ${C.border}`, borderRadius: 16,
    padding: "14px 18px", color: C.primary,
    fontSize: 16, fontFamily: "'Comfortaa', sans-serif",
    fontWeight: 600, transition: "border-color 0.2s, box-shadow 0.2s",
  },
  codeInput: {
    width: "100%", background: C.bgSoft,
    border: `2px solid ${C.action}`, borderRadius: 20,
    padding: "18px 10px", color: C.primary,
    fontSize: 30, fontFamily: "'Quicksand', monospace",
    fontWeight: 700, letterSpacing: 12,
    textAlign: "center", textTransform: "uppercase",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  btnPrimary: {
    width: "100%", padding: "15px 0",
    background: `linear-gradient(135deg, ${C.action}, #0096C7)`,
    border: "none", borderRadius: 20,
    color: "#fff", fontSize: 15, fontWeight: 700,
    fontFamily: "'Comfortaa', sans-serif", letterSpacing: 0.5,
    cursor: "pointer", boxShadow: `0 6px 20px rgba(0,180,216,0.35)`,
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  btnGhost: {
    width: "100%", padding: "15px 0",
    background: "transparent",
    border: `2px solid ${C.action}`, borderRadius: 20,
    color: C.action, fontSize: 15, fontWeight: 700,
    fontFamily: "'Comfortaa', sans-serif", letterSpacing: 0.5,
    cursor: "pointer", transition: "background 0.15s",
  },
  btnSmall: {
    padding: "8px 18px", background: C.fog,
    border: `1.5px solid ${C.action}`, borderRadius: 50,
    color: C.primary, fontSize: 13, fontWeight: 700,
    fontFamily: "'Quicksand', sans-serif", cursor: "pointer",
  },
  codeDisplay: {
    fontFamily: "'Quicksand', monospace", fontWeight: 700,
    fontSize: 44, letterSpacing: 14, color: C.primary,
    textAlign: "center", padding: "20px 0 8px",
  },
  msgMine: {
    alignSelf: "flex-end",
    background: C.action,
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "22px 22px 6px 22px",
    maxWidth: "78%", fontSize: 15,
    boxShadow: `0 4px 14px rgba(0,180,216,0.3)`,
    fontFamily: "'Comfortaa', sans-serif",
    lineHeight: 1.5, fontWeight: 500,
  },
  msgOther: {
    alignSelf: "flex-start",
    background: C.fog,
    color: C.primary,
    padding: "12px 16px",
    borderRadius: "22px 22px 22px 6px",
    maxWidth: "78%", fontSize: 15,
    fontFamily: "'Comfortaa', sans-serif",
    lineHeight: 1.5, fontWeight: 500,
  },
  msgSys: {
    alignSelf: "center",
    background: C.bgSoft,
    border: `1px solid ${C.border}`,
    color: C.textMuted,
    padding: "5px 16px", borderRadius: 50,
    fontSize: 11, fontFamily: "'Quicksand', sans-serif", fontWeight: 600,
    letterSpacing: 0.3,
  },
  backBtn: {
    background: C.bgSoft, border: `1.5px solid ${C.border}`,
    borderRadius: 14, width: 38, height: 38,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: C.primary, flexShrink: 0,
  },
};

// ─────────────────────────────────────────────
// SVG ICONS (line-art, 2px stroke, rounded)
// ─────────────────────────────────────────────
const Icon = {
  plane: (sz=28, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
    </svg>
  ),
  planeFull: (sz=56, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  ),
  wifi: (sz=22, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={col}/>
    </svg>
  ),
  key: (sz=22, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="4.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>
    </svg>
  ),
  copy: (sz=18, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="3"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  check: (sz=18, col="#fff") => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  send: (sz=20, col="#fff") => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  users: (sz=18, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  clock: (sz=14, col=C.textMuted) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  back: (sz=18, col=C.primary) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  plus: (sz=16, col=C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────
// ILLUSTRATIONS
// ─────────────────────────────────────────────
function OnboardingIllustration() {
  return (
    <svg width="280" height="160" viewBox="0 0 280 160" fill="none" style={{ overflow: "visible" }}>
      {/* Cloud 1 */}
      <g className="cloud1" style={{ opacity: 0.7 }}>
        <ellipse cx="54" cy="52" rx="30" ry="16" stroke={C.fog} strokeWidth="2" fill={C.fog}/>
        <ellipse cx="44" cy="56" rx="18" ry="12" stroke={C.fog} strokeWidth="2" fill={C.fog}/>
        <ellipse cx="70" cy="56" rx="16" ry="11" stroke={C.fog} strokeWidth="2" fill={C.fog}/>
      </g>
      {/* Cloud 2 */}
      <g className="cloud2" style={{ opacity: 0.5 }}>
        <ellipse cx="220" cy="36" rx="24" ry="13" stroke={C.fogDark} strokeWidth="2" fill={C.fogDark}/>
        <ellipse cx="208" cy="40" rx="14" ry="10" stroke={C.fogDark} strokeWidth="2" fill={C.fogDark}/>
        <ellipse cx="234" cy="40" rx="13" ry="9" stroke={C.fogDark} strokeWidth="2" fill={C.fogDark}/>
      </g>
      {/* Cloud 3 small */}
      <g style={{ opacity: 0.35 }}>
        <ellipse cx="160" cy="20" rx="16" ry="9" stroke={C.border} strokeWidth="1.5" fill={C.border}/>
        <ellipse cx="152" cy="23" rx="10" ry="7" stroke={C.border} strokeWidth="1.5" fill={C.border}/>
        <ellipse cx="170" cy="23" rx="9" ry="7" stroke={C.border} strokeWidth="1.5" fill={C.border}/>
      </g>
      {/* Plane */}
      <g className="float" style={{ transformOrigin: "140px 90px" }}>
        <g transform="rotate(-20, 140, 90)">
          {/* Body */}
          <path d="M100 90 Q140 70 180 90 Q140 95 100 90Z" stroke={C.action} strokeWidth="2" strokeLinejoin="round" fill={C.fog}/>
          {/* Wing */}
          <path d="M130 88 L118 110 L155 92Z" stroke={C.action} strokeWidth="2" strokeLinejoin="round" fill={C.fogDark}/>
          {/* Tail */}
          <path d="M100 90 L92 80 L108 88Z" stroke={C.action} strokeWidth="2" strokeLinejoin="round" fill={C.fogDark}/>
          {/* Window */}
          <circle cx="148" cy="85" r="4" stroke={C.action} strokeWidth="1.5" fill={C.bg}/>
          <circle cx="162" cy="84" r="3.5" stroke={C.action} strokeWidth="1.5" fill={C.bg}/>
        </g>
      </g>
      {/* Dotted path */}
      <path d="M40 120 Q80 80 140 90 Q200 100 240 60" stroke={C.fogDark} strokeWidth="1.5" strokeDasharray="5 6" fill="none" strokeLinecap="round" style={{ opacity: 0.6 }}/>
      {/* Chat bubbles */}
      <g style={{ opacity: 0.85 }}>
        <rect x="30" y="120" width="64" height="28" rx="14" fill={C.fog}/>
        <text x="62" y="138" textAnchor="middle" fill={C.primary} fontSize="9" fontFamily="Comfortaa" fontWeight="700">Hola! ✈</text>
      </g>
      <g style={{ opacity: 0.85 }}>
        <rect x="182" y="110" width="72" height="28" rx="14" fill={C.action}/>
        <text x="218" y="128" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="Comfortaa" fontWeight="700">¡Hola! 👋</text>
      </g>
    </svg>
  );
}

function WaitingAnimation() {
  const [r, setR] = useState(0);
  useEffect(() => { const t = setInterval(() => setR(v => (v + 1) % 3), 600); return () => clearInterval(t); }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 9, height: 9, borderRadius: "50%",
          background: r === i ? C.action : C.fogDark,
          transition: "background 0.3s",
        }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// WEBRTC & STORAGE (unchanged logic)
// ─────────────────────────────────────────────
function waitICE(pc) {
  return new Promise((res) => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, 8000);
    const h = () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); pc.removeEventListener("icegatheringstatechange", h); res(); } };
    pc.addEventListener("icegatheringstatechange", h);
  });
}

const ROOM_TTL = 5 * 60 * 1000;
async function storeOffer(code, sdp) { await window.storage.set(`ac:${code}:offer`, JSON.stringify({ sdp, ts: Date.now() }), true); }
async function fetchOffer(code) { try { const r = await window.storage.get(`ac:${code}:offer`, true); if (!r) return null; const d = JSON.parse(r.value); if (Date.now() - d.ts > ROOM_TTL) return null; return d.sdp; } catch { return null; } }
async function storeAnswer(code, sdp) { await window.storage.set(`ac:${code}:answer`, JSON.stringify({ sdp, ts: Date.now() }), true); }
async function fetchAnswer(code) { try { const r = await window.storage.get(`ac:${code}:answer`, true); if (!r) return null; const d = JSON.parse(r.value); if (Date.now() - d.ts > ROOM_TTL) return null; return d.sdp; } catch { return null; } }
async function cleanRoom(code) { try { await window.storage.delete(`ac:${code}:offer`, true); } catch {} try { await window.storage.delete(`ac:${code}:answer`, true); } catch {} }

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(len = 6) { return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join(""); }
const clock = () => new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function AirChat() {
  useFonts();

  const [view, setView]         = useState("home");
  const [nameIn, setNameIn]     = useState("");
  const [myName, setMyName]     = useState("");
  const [role, setRole]         = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [codeIn, setCodeIn]     = useState("");
  const [status, setStatus]     = useState("");
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);
  const [msgs, setMsgs]         = useState([]);
  const [chatIn, setChatIn]     = useState("");
  const [peers, setPeers]       = useState([]);

  const peersRef  = useRef([]);
  const guestCh   = useRef(null);
  const nameRef   = useRef("");
  const pollRef   = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const push = useCallback((m) => setMsgs(p => [...p, { id: Math.random(), ...m }]), []);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(roomCode); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const wireHost = (ch, pc) => {
    const peer = { pc, ch, name: "…" };
    ch.onopen = () => {
      peersRef.current.push(peer);
      ch.send(JSON.stringify({ k: "hi", n: nameRef.current }));
      setPeers(peersRef.current.map(p => p.name));
      push({ sys: true, txt: "¡Alguien se unió al vuelo! 🎉" });
      setView("chat");
    };
    ch.onclose = () => {
      peersRef.current = peersRef.current.filter(p => p !== peer);
      setPeers(peersRef.current.map(p => p.name));
      push({ sys: true, txt: `${peer.name} aterrizó y se fue 👋` });
    };
    ch.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.k === "hi") { peer.name = d.n; setPeers(peersRef.current.map(p => p.name)); push({ sys: true, txt: `${d.n} se unió a la conversación` }); }
        else if (d.k === "msg") { push({ from: d.from, txt: d.txt, time: d.time, mine: false }); peersRef.current.forEach(p => { if (p.ch !== ch && p.ch.readyState === "open") p.ch.send(e.data); }); }
      } catch {}
    };
  };

  const openSlot = async (code) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const ch = pc.createDataChannel("ac", { ordered: true });
      wireHost(ch, pc);
      await pc.setLocalDescription(await pc.createOffer());
      await waitICE(pc);
      await storeOffer(code, pc.localDescription);
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const ans = await fetchAnswer(code);
        if (!ans) return;
        clearInterval(pollRef.current);
        try { await pc.setRemoteDescription(ans); await cleanRoom(code); setTimeout(() => openSlot(code), 1500); } catch {}
      }, 2000);
    } catch {}
  };

  const createRoom = async () => {
    setError("");
    try {
      const code = genCode();
      setRoomCode(code);
      await openSlot(code);
      setView("host");
    } catch (e) { setError("No pudimos crear la sala. ¡Inténtalo de nuevo!"); }
  };

  const joinRoom = async () => {
    const code = codeIn.trim().toUpperCase();
    if (code.length < 4) { setError("El código parece muy corto 🤔"); return; }
    setError(""); setStatus("Buscando a tus compañeros de viaje...");
    try {
      const offer = await fetchOffer(code);
      if (!offer) { setError("Este puente se ha cerrado, ¡pide un código nuevo!"); setStatus(""); return; }
      setStatus("Preparando la conexión...");
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.ondatachannel = (evt) => {
        const ch = evt.channel; guestCh.current = ch;
        ch.onopen = () => { ch.send(JSON.stringify({ k: "hi", n: nameRef.current })); setView("chat"); push({ sys: true, txt: "¡Estás a bordo! Bienvenido ✈" }); };
        ch.onmessage = (e) => { try { const d = JSON.parse(e.data); if (d.k === "hi") { setPeers(prev => [...new Set([...prev, d.n])]); push({ sys: true, txt: `${d.n} está en la sala` }); } else if (d.k === "msg") { push({ from: d.from, txt: d.txt, time: d.time, mine: false }); } } catch {} };
        ch.onclose = () => push({ sys: true, txt: "Conexión perdida en la turbulencia 💨" });
      };
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());
      await waitICE(pc);
      await storeAnswer(code, pc.localDescription);
      setStatus("Casi listos...");
    } catch (e) { setError("Algo salió mal. ¡Verifica el código e inténtalo de nuevo!"); setStatus(""); }
  };

  const send = () => {
    const txt = chatIn.trim(); if (!txt) return;
    const time = clock();
    const raw = JSON.stringify({ k: "msg", from: myName, txt, time });
    if (role === "host") peersRef.current.forEach(p => { if (p.ch.readyState === "open") p.ch.send(raw); });
    else guestCh.current?.send(raw);
    push({ from: myName, txt, time, mine: true });
    setChatIn("");
  };

  const goStart = (r) => {
    const n = nameIn.trim(); if (!n) return;
    setMyName(n); nameRef.current = n; setRole(r);
    if (r === "host") createRoom();
    else { setView("guest"); setError(""); setStatus(""); }
  };

  useEffect(() => () => { clearInterval(pollRef.current); }, []);

  // ── HOME ─────────────────────────────────────
  if (view === "home") return (
    <div style={{ ...S.root, minHeight: "100vh" }}>
      {/* Soft gradient sky */}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #EAF8FD 0%, #fff 50%)", zIndex: 0, pointerEvents: "none" }}/>
      
      <div style={{ ...S.wrap, position: "relative", zIndex: 1, paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Illustration */}
        <div style={{ marginBottom: 8 }}>
          <OnboardingIllustration />
        </div>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Comfortaa', sans-serif", fontSize: 34, fontWeight: 700, color: C.primary, letterSpacing: 1, marginBottom: 6 }}>
            AirChat
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, fontWeight: 600, letterSpacing: 0.3 }}>
            Conversa sin fronteras, incluso en las nubes ✈
          </p>
        </div>

        {/* Info card */}
        <div style={{ ...S.card, width: "100%", background: C.bgSoft, border: `1.5px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>{Icon.wifi(22)}</div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75, fontWeight: 500 }}>
              Comparte un <strong style={{ color: C.primary }}>código de 6 letras</strong> con quienes estén cerca. No necesitas internet — solo estar en la misma red.
            </p>
          </div>
        </div>

        {/* Name */}
        <div style={{ width: "100%", marginBottom: 18 }}>
          <span style={S.label}>¿Cómo te llaman? 👤</span>
          <input
            value={nameIn}
            onChange={e => setNameIn(e.target.value)}
            onKeyDown={e => e.key === "Enter" && nameIn.trim() && goStart("host")}
            placeholder="Tu nombre o apodo..."
            style={S.input}
          />
        </div>

        {/* Buttons */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => goStart("host")}
            disabled={!nameIn.trim()}
            style={{ ...S.btnPrimary, opacity: nameIn.trim() ? 1 : 0.45, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            {Icon.wifi(20, "#fff")}
            Crear sala de vuelo
          </button>
          <button
            onClick={() => goStart("guest")}
            disabled={!nameIn.trim()}
            style={{ ...S.btnGhost, opacity: nameIn.trim() ? 1 : 0.45, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            {Icon.key(20)}
            Tengo un código
          </button>
        </div>

        <p style={{ fontSize: 11, color: C.border, textAlign: "center", paddingBottom: 32, fontWeight: 600, letterSpacing: 0.5 }}>
          WebRTC · P2P · Sin servidores
        </p>
      </div>
    </div>
  );

  // ── HOST WAITING ──────────────────────────────
  if (view === "host") return (
    <div style={{ ...S.root, background: "linear-gradient(180deg,#EAF8FD 0%,#fff 60%)", minHeight: "100vh" }}>
      <div style={{ ...S.wrap, paddingTop: 28 }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => { clearInterval(pollRef.current); cleanRoom(roomCode); setView("home"); }}
            style={S.backBtn}
          >{Icon.back()}</button>
          <div>
            <h2 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 20, fontWeight: 700, color: C.primary }}>Tu sala está lista</h2>
            <p style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>Anfitrión · {myName}</p>
          </div>
        </div>

        {/* Code card */}
        <div style={{ ...S.card, textAlign: "center", background: C.bgSoft }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
            {Icon.plane(18)}
            <span style={{ ...S.label, marginBottom: 0 }}>Comparte este código</span>
          </div>
          <div style={S.codeDisplay}>{roomCode}</div>
          <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 14 }}>
            Léelo en voz alta o muestra la pantalla
          </p>
          <button onClick={copyCode} style={{
            ...S.btnPrimary,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {copied ? Icon.check(18) : Icon.copy(18, "#fff")}
            {copied ? "¡Copiado al portapapeles!" : "Copiar código"}
          </button>
        </div>

        {/* Waiting */}
        <div style={{ ...S.card, textAlign: "center" }}>
          <WaitingAnimation />
          <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Esperando compañeros de vuelo...
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {Icon.clock()}
            <span style={{ color: C.textLight, fontSize: 11, fontWeight: 600 }}>El código expira en 5 minutos</span>
          </div>
        </div>

        {error && (
          <div style={{ ...S.card, background: "#FFF5F5", border: "1.5px solid #FFCCCC", textAlign: "center" }}>
            <p style={{ color: "#D00", fontSize: 13, fontWeight: 600 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── GUEST ─────────────────────────────────────
  if (view === "guest") return (
    <div style={{ ...S.root, background: "linear-gradient(180deg,#EAF8FD 0%,#fff 60%)", minHeight: "100vh" }}>
      <div style={{ ...S.wrap, paddingTop: 28 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button onClick={() => setView("home")} style={S.backBtn}>{Icon.back()}</button>
          <div>
            <h2 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 20, fontWeight: 700, color: C.primary }}>Únete al vuelo</h2>
            <p style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>Invitado · {myName}</p>
          </div>
        </div>

        <div style={S.card}>
          <span style={S.label}>Código de la sala ✈</span>
          <input
            value={codeIn}
            onChange={e => setCodeIn(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
            onKeyDown={e => e.key === "Enter" && codeIn.trim() && !status && joinRoom()}
            placeholder="XXXXXX"
            maxLength={8}
            style={S.codeInput}
          />

          {status ? (
            <div style={{ textAlign: "center", padding: "18px 0 4px" }}>
              <WaitingAnimation />
              <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>{status}</p>
            </div>
          ) : (
            <button
              onClick={joinRoom}
              disabled={!codeIn.trim()}
              style={{ ...S.btnPrimary, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: codeIn.trim() ? 1 : 0.45 }}
            >
              {Icon.plane(18, "#fff")}
              ¡A bordo!
            </button>
          )}

          {error && (
            <div style={{ marginTop: 14, background: "#FFF5F5", border: "1.5px solid #FFCCCC", borderRadius: 16, padding: "10px 14px", textAlign: "center" }}>
              <p style={{ color: "#C00", fontSize: 13, fontWeight: 600 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ ...S.card, background: C.bgSoft, border: `1.5px solid ${C.border}` }}>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75, fontWeight: 500, textAlign: "center" }}>
            Pide el código al anfitrión.<br />
            Son <strong style={{ color: C.primary }}>6 letras</strong> — ¡fácil de compartir en voz alta!
          </p>
        </div>
      </div>
    </div>
  );

  // ── CHAT ──────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg, fontFamily: "'Comfortaa', sans-serif" }}>
      
      {/* Header */}
      <div style={{
        background: C.bg,
        borderBottom: `1.5px solid ${C.border}`,
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: `0 2px 16px ${C.shadow}`,
        position: "sticky", top: 0, zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Avatar / logo */}
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.action}, #0096C7)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px rgba(0,180,216,0.3)`,
          }}>
            {Icon.plane(20, "#fff")}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 16, fontWeight: 700, color: C.primary }}>AirChat</h3>
              {roomCode && (
                <span style={{ background: C.fog, color: C.primary, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 50, fontFamily: "'Quicksand',sans-serif", letterSpacing: 1 }}>
                  {roomCode}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }}/>
              <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600 }}>
                {peers.length ? `${peers.length} en vuelo: ${peers.join(", ")}` : "Conectado"}
              </p>
            </div>
          </div>
        </div>

        {role === "host" && (
          <button
            onClick={() => { openSlot(roomCode); }}
            style={{ ...S.btnSmall, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}
          >
            {Icon.plus()}
            <span>Invitar</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px", display: "flex", flexDirection: "column", gap: 10, background: C.bgSoft }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "25%", color: C.textLight }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✈</div>
            <p style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 13, fontWeight: 600, color: C.textMuted }}>
              Canal seguro listo.<br />¡Di algo bonito!
            </p>
          </div>
        )}

        {msgs.map(m => (
          <div key={m.id} className="fade-up" style={{ display: "flex", flexDirection: "column" }}>
            {m.sys ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={S.msgSys}>{m.txt}</span>
              </div>
            ) : (
              <>
                {!m.mine && (
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 6, marginBottom: 4, fontFamily: "'Quicksand',sans-serif", fontWeight: 700 }}>
                    {m.from}
                  </span>
                )}
                <div style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
                  <div style={m.mine ? S.msgMine : S.msgOther}>
                    <span>{m.txt}</span>
                    <div style={{ fontSize: 10, color: m.mine ? "rgba(255,255,255,0.65)" : C.textLight, marginTop: 5, textAlign: "right", fontFamily: "'Quicksand',sans-serif", fontWeight: 600 }}>
                      {m.time}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        background: C.bg, borderTop: `1.5px solid ${C.border}`,
        padding: "10px 14px 16px",
        display: "flex", gap: 10, alignItems: "center",
        flexShrink: 0,
      }}>
        <input
          value={chatIn}
          onChange={e => setChatIn(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Escribe tu mensaje..."
          style={{ ...S.input, flex: 1, padding: "12px 16px" }}
        />
        <button
          onClick={send}
          disabled={!chatIn.trim()}
          style={{
            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
            background: chatIn.trim() ? `linear-gradient(135deg,${C.action},#0096C7)` : C.bgSoft,
            border: `1.5px solid ${chatIn.trim() ? C.action : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: chatIn.trim() ? "pointer" : "default",
            boxShadow: chatIn.trim() ? `0 4px 14px rgba(0,180,216,0.35)` : "none",
            transition: "all 0.2s",
          }}
        >
          {Icon.send(18, chatIn.trim() ? "#fff" : C.textLight)}
        </button>
      </div>
    </div>
  );
}
