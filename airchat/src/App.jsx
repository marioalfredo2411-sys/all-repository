import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "peerjs";

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
// HELPERS
// ─────────────────────────────────────────────
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(len = 6) {
  return Array.from({ length: len }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}
const clock = () =>
  new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────
// FONTS + GLOBAL CSS
// ─────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; }
      body { background: ${C.bg}; overflow: hidden; }
      input::placeholder { color: ${C.textLight}; }
      input:focus {
        border-color: ${C.action} !important;
        outline: none;
        box-shadow: 0 0 0 3px rgba(0,180,216,0.15);
      }
      @keyframes float {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }
      @keyframes cloud-drift {
        0%   { transform: translateX(0); }
        100% { transform: translateX(8px); }
      }
      @keyframes fade-up {
        from { opacity:0; transform:translateY(14px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .float  { animation: float 4s ease-in-out infinite; }
      .cloud1 { animation: cloud-drift 6s ease-in-out infinite alternate; }
      .cloud2 { animation: cloud-drift 8s ease-in-out infinite alternate-reverse; }
      .fade-up { animation: fade-up 0.35s ease forwards; }
      button:active { transform: scale(0.97); }
    `;
    document.head.appendChild(style);
  }, []);
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = {
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: C.bg,
    color: C.text,
    fontFamily: "'Comfortaa', 'Quicksand', system-ui, sans-serif",
    overflowY: "auto",
  },
  wrap: {
    width: "100%",
    maxWidth: 440,
    padding: "0 22px",
    boxSizing: "border-box",
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
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: C.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 9,
    fontFamily: "'Quicksand', sans-serif",
  },
  input: {
    width: "100%",
    background: C.bgSoft,
    border: `1.5px solid ${C.border}`,
    borderRadius: 16,
    padding: "14px 18px",
    color: C.primary,
    fontSize: 16,
    fontFamily: "'Comfortaa', sans-serif",
    fontWeight: 600,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  codeInput: {
    width: "100%",
    background: C.bgSoft,
    border: `2px solid ${C.action}`,
    borderRadius: 20,
    padding: "18px 10px",
    color: C.primary,
    fontSize: 30,
    fontFamily: "'Quicksand', monospace",
    fontWeight: 700,
    letterSpacing: 12,
    textAlign: "center",
    textTransform: "uppercase",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  btnPrimary: {
    width: "100%",
    padding: "15px 0",
    background: `linear-gradient(135deg, ${C.action}, #0096C7)`,
    border: "none",
    borderRadius: 20,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Comfortaa', sans-serif",
    letterSpacing: 0.5,
    cursor: "pointer",
    boxShadow: `0 6px 20px rgba(0,180,216,0.35)`,
    transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnGhost: {
    width: "100%",
    padding: "15px 0",
    background: "transparent",
    border: `2px solid ${C.action}`,
    borderRadius: 20,
    color: C.action,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Comfortaa', sans-serif",
    letterSpacing: 0.5,
    cursor: "pointer",
    transition: "background 0.15s, opacity 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnSmall: {
    padding: "8px 16px",
    background: C.fog,
    border: `1.5px solid ${C.action}`,
    borderRadius: 50,
    color: C.primary,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Quicksand', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  codeDisplay: {
    fontFamily: "'Quicksand', monospace",
    fontWeight: 700,
    fontSize: 44,
    letterSpacing: 14,
    color: C.primary,
    textAlign: "center",
    padding: "20px 0 8px",
  },
  msgMine: {
    alignSelf: "flex-end",
    background: C.action,
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "22px 22px 6px 22px",
    maxWidth: "78%",
    fontSize: 15,
    boxShadow: `0 4px 14px rgba(0,180,216,0.3)`,
    fontFamily: "'Comfortaa', sans-serif",
    lineHeight: 1.5,
    fontWeight: 500,
  },
  msgOther: {
    alignSelf: "flex-start",
    background: C.fog,
    color: C.primary,
    padding: "12px 16px",
    borderRadius: "22px 22px 22px 6px",
    maxWidth: "78%",
    fontSize: 15,
    fontFamily: "'Comfortaa', sans-serif",
    lineHeight: 1.5,
    fontWeight: 500,
  },
  msgSys: {
    alignSelf: "center",
    background: C.bgSoft,
    border: `1px solid ${C.border}`,
    color: C.textMuted,
    padding: "5px 16px",
    borderRadius: 50,
    fontSize: 11,
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 600,
  },
  backBtn: {
    background: C.bgSoft,
    border: `1.5px solid ${C.border}`,
    borderRadius: 14,
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: C.primary,
    flexShrink: 0,
  },
  errorBox: {
    background: "#FFF5F5",
    border: "1.5px solid #FFCCCC",
    borderRadius: 16,
    padding: "12px 16px",
    textAlign: "center",
    marginTop: 12,
  },
};

// ─────────────────────────────────────────────
// SVG ICONS (2px stroke, rounded caps)
// ─────────────────────────────────────────────
const Icon = {
  plane: (sz = 20, col = C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
    </svg>
  ),
  wifi: (sz = 22, col = C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill={col} />
    </svg>
  ),
  key: (sz = 22, col = C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  ),
  copy: (sz = 18, col = "#fff") => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="3" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (sz = 18, col = "#fff") => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  send: (sz = 18, col = "#fff") => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  back: (sz = 18, col = C.primary) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  plus: (sz = 15, col = C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  users: (sz = 16, col = C.action) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

// ─────────────────────────────────────────────
// ILLUSTRATION
// ─────────────────────────────────────────────
function OnboardingIllustration() {
  return (
    <svg width="280" height="155" viewBox="0 0 280 155" fill="none" style={{ overflow: "visible" }}>
      <g className="cloud1" style={{ opacity: 0.75 }}>
        <ellipse cx="52" cy="50" rx="30" ry="16" fill={C.fog} />
        <ellipse cx="42" cy="54" rx="18" ry="12" fill={C.fog} />
        <ellipse cx="68" cy="54" rx="16" ry="11" fill={C.fog} />
      </g>
      <g className="cloud2" style={{ opacity: 0.5 }}>
        <ellipse cx="218" cy="34" rx="24" ry="13" fill={C.fogDark} />
        <ellipse cx="206" cy="38" rx="14" ry="10" fill={C.fogDark} />
        <ellipse cx="232" cy="38" rx="13" ry="9" fill={C.fogDark} />
      </g>
      <g style={{ opacity: 0.3 }}>
        <ellipse cx="158" cy="18" rx="16" ry="9" fill={C.border} />
        <ellipse cx="150" cy="21" rx="10" ry="7" fill={C.border} />
        <ellipse cx="168" cy="21" rx="9" ry="7" fill={C.border} />
      </g>
      <g className="float" style={{ transformOrigin: "140px 88px" }}>
        <g transform="rotate(-20, 140, 88)">
          <path d="M100 88 Q140 68 180 88 Q140 93 100 88Z"
            stroke={C.action} strokeWidth="2" strokeLinejoin="round" fill={C.fog} />
          <path d="M130 86 L118 108 L155 90Z"
            stroke={C.action} strokeWidth="2" strokeLinejoin="round" fill={C.fogDark} />
          <path d="M100 88 L92 78 L108 86Z"
            stroke={C.action} strokeWidth="2" strokeLinejoin="round" fill={C.fogDark} />
          <circle cx="148" cy="83" r="4"
            stroke={C.action} strokeWidth="1.5" fill={C.bg} />
          <circle cx="162" cy="82" r="3.5"
            stroke={C.action} strokeWidth="1.5" fill={C.bg} />
        </g>
      </g>
      <path d="M40 118 Q80 78 140 88 Q200 98 240 58"
        stroke={C.fogDark} strokeWidth="1.5" strokeDasharray="5 6"
        fill="none" strokeLinecap="round" style={{ opacity: 0.6 }} />
      <g>
        <rect x="28" y="118" width="68" height="28" rx="14" fill={C.fog} />
        <text x="62" y="136" textAnchor="middle" fill={C.primary}
          fontSize="9" fontFamily="Comfortaa" fontWeight="700">Hola! ✈</text>
      </g>
      <g>
        <rect x="182" y="108" width="76" height="28" rx="14" fill={C.action} />
        <text x="220" y="126" textAnchor="middle" fill="#fff"
          fontSize="9" fontFamily="Comfortaa" fontWeight="700">¡Hola! 👋</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────
// ANIMATED DOTS
// ─────────────────────────────────────────────
function WaitingDots() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((v) => (v + 1) % 3), 550);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 9, height: 9, borderRadius: "50%",
          background: active === i ? C.action : C.fogDark,
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function App() {
  useFonts();

  const [view, setView]         = useState("home");   // home | host | guest | chat
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
  const [peers, setPeers]       = useState([]);          // display names

  const peerRef    = useRef(null);   // my Peer instance
  const connsRef   = useRef([]);     // all active DataConnections
  const nameRef    = useRef("");
  const roomRef    = useRef("");
  const bottomRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const push = useCallback((m) => {
    setMsgs((prev) => [...prev, { id: Math.random(), ...m }]);
  }, []);

  // ── Wire a DataConnection (used by both host and guest) ────
  const wireConn = useCallback((conn) => {
    conn.on("open", () => {
      connsRef.current.push(conn);
      conn.send({ k: "hi", n: nameRef.current });
      setView("chat");
      push({ sys: true, txt: "¡Alguien se unió al vuelo! 🎉" });
    });

    conn.on("data", (data) => {
      if (data.k === "hi") {
        conn._peerName = data.n;
        setPeers(connsRef.current.map((c) => c._peerName || "…"));
        push({ sys: true, txt: `${data.n} entró a la conversación ✈` });
      } else if (data.k === "msg") {
        push({ from: data.from, txt: data.txt, time: data.time, mine: false });
        // Relay to other peers (host-side)
        connsRef.current.forEach((c) => {
          if (c !== conn && c.open) c.send(data);
        });
      }
    });

    conn.on("close", () => {
      const name = conn._peerName || "alguien";
      connsRef.current = connsRef.current.filter((c) => c !== conn);
      setPeers(connsRef.current.map((c) => c._peerName || "…"));
      push({ sys: true, txt: `${name} aterrizó y se fue 👋` });
    });

    conn.on("error", (e) => {
      console.error("conn error", e);
    });
  }, [push]);

  // ── HOST: create room ──────────────────────
  const createRoom = useCallback((name) => {
    const code = genCode();
    setRoomCode(code);
    roomRef.current = code;

    const peer = new Peer(`airchat-${code}`, {
      debug: 0,
    });
    peerRef.current = peer;

    peer.on("open", () => {
      setView("host");
      setStatus("");
    });

    peer.on("connection", (conn) => {
      wireConn(conn);
    });

    peer.on("error", (e) => {
      if (e.type === "unavailable-id") {
        // Code taken — try another
        peer.destroy();
        createRoom(name);
      } else {
        setError("Error de conexión. Intenta de nuevo.");
        console.error(e);
      }
    });
  }, [wireConn]);

  // ── GUEST: join room ───────────────────────
  const joinRoom = useCallback(() => {
    const code = codeIn.trim().toUpperCase();
    if (code.length < 4) { setError("El código parece muy corto 🤔"); return; }

    setError("");
    setStatus("Buscando a tus compañeros de viaje...");

    const peer = new Peer({ debug: 0 });
    peerRef.current = peer;

    peer.on("open", () => {
      setStatus("Casi listos, conectando...");
      const conn = peer.connect(`airchat-${code}`, { reliable: true });
      wireConn(conn);

      conn.on("error", (e) => {
        setError("No encontramos esa sala. ¿El código es correcto?");
        setStatus("");
        peer.destroy();
      });

      // Timeout if no connection after 10s
      const t = setTimeout(() => {
        if (!conn.open) {
          setError("Este puente se ha cerrado, ¡pide un código nuevo!");
          setStatus("");
          peer.destroy();
        }
      }, 10000);

      conn.on("open", () => clearTimeout(t));
    });

    peer.on("error", (e) => {
      setError("Algo salió mal. Verifica el código e intenta de nuevo.");
      setStatus("");
    });
  }, [codeIn, wireConn]);

  // ── Send message ───────────────────────────
  const send = () => {
    const txt = chatIn.trim();
    if (!txt) return;
    const time = clock();
    const payload = { k: "msg", from: myName, txt, time };
    connsRef.current.forEach((c) => { if (c.open) c.send(payload); });
    push({ from: myName, txt, time, mine: true });
    setChatIn("");
  };

  const goStart = (r) => {
    const n = nameIn.trim();
    if (!n) return;
    setMyName(n);
    nameRef.current = n;
    setRole(r);
    if (r === "host") {
      setStatus("Preparando tu sala...");
      createRoom(n);
    } else {
      setView("guest");
      setError("");
      setStatus("");
    }
  };

  // Cleanup on unmount
  useEffect(() => () => { peerRef.current?.destroy(); }, []);

  const skyBg = "linear-gradient(180deg, #EAF8FD 0%, #fff 55%)";

  // ════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════
  if (view === "home") return (
    <div style={{ ...S.root, background: skyBg }}>
      <div style={{ ...S.wrap, paddingTop: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>

        <div style={{ marginBottom: 4 }}>
          <OnboardingIllustration />
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 34, fontWeight: 700, color: C.primary, letterSpacing: 0.5, marginBottom: 6 }}>
            AirChat
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, fontWeight: 600 }}>
            Conversa sin fronteras, incluso en las nubes ✈
          </p>
        </div>

        <div style={{ ...S.card, width: "100%", marginBottom: 20, background: C.bgSoft }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>{Icon.wifi()}</div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8, fontWeight: 500 }}>
              Comparte un <strong style={{ color: C.primary }}>código de 6 letras</strong> con quien esté cerca.
              No necesitas internet — solo la misma red WiFi o hotspot.
            </p>
          </div>
        </div>

        <div style={{ width: "100%", marginBottom: 18 }}>
          <span style={S.label}>¿Cómo te llaman? 👤</span>
          <input
            value={nameIn}
            onChange={(e) => setNameIn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nameIn.trim() && goStart("host")}
            placeholder="Tu nombre o apodo..."
            style={S.input}
            autoFocus
          />
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => goStart("host")}
            disabled={!nameIn.trim()}
            style={{ ...S.btnPrimary, opacity: nameIn.trim() ? 1 : 0.45 }}
          >
            {Icon.wifi(20, "#fff")} Crear sala de vuelo
          </button>
          <button
            onClick={() => goStart("guest")}
            disabled={!nameIn.trim()}
            style={{ ...S.btnGhost, opacity: nameIn.trim() ? 1 : 0.45 }}
          >
            {Icon.key(20)} Tengo un código
          </button>
        </div>

        <p style={{ fontSize: 11, color: C.border, textAlign: "center", paddingBottom: 32, fontWeight: 600, letterSpacing: 0.5 }}>
          WebRTC · PeerJS · P2P · Sin servidores propios
        </p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // HOST WAITING
  // ════════════════════════════════════════════
  if (view === "host") return (
    <div style={{ ...S.root, background: skyBg }}>
      <div style={{ ...S.wrap, paddingTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => { peerRef.current?.destroy(); setView("home"); }}
            style={S.backBtn}
          >{Icon.back()}</button>
          <div>
            <h2 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 20, fontWeight: 700, color: C.primary }}>
              Tu sala está lista
            </h2>
            <p style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>Anfitrión · {myName}</p>
          </div>
        </div>

        <div style={{ ...S.card, textAlign: "center", background: C.bgSoft }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 2 }}>
            {Icon.plane(16)}
            <span style={{ ...S.label, marginBottom: 0 }}>Comparte este código</span>
          </div>
          <div style={S.codeDisplay}>{roomCode}</div>
          <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 16 }}>
            Léelo en voz alta o muestra la pantalla
          </p>
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(roomCode); } catch {}
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            style={S.btnPrimary}
          >
            {copied ? Icon.check(18) : Icon.copy(18)}
            {copied ? "¡Copiado!" : "Copiar código"}
          </button>
        </div>

        <div style={{ ...S.card, textAlign: "center" }}>
          <WaitingDots />
          <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Esperando compañeros de vuelo...
          </p>
          <p style={{ color: C.textLight, fontSize: 11, fontWeight: 600 }}>
            Cualquier persona con el código puede unirse
          </p>
        </div>

        {error && (
          <div style={S.errorBox}>
            <p style={{ color: "#C00", fontSize: 13, fontWeight: 600 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // GUEST — enter code
  // ════════════════════════════════════════════
  if (view === "guest") return (
    <div style={{ ...S.root, background: skyBg }}>
      <div style={{ ...S.wrap, paddingTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button onClick={() => setView("home")} style={S.backBtn}>{Icon.back()}</button>
          <div>
            <h2 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 20, fontWeight: 700, color: C.primary }}>
              Únete al vuelo
            </h2>
            <p style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>Invitado · {myName}</p>
          </div>
        </div>

        <div style={S.card}>
          <span style={S.label}>Código de la sala ✈</span>
          <input
            value={codeIn}
            onChange={(e) =>
              setCodeIn(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
            }
            onKeyDown={(e) => e.key === "Enter" && codeIn.trim() && !status && joinRoom()}
            placeholder="XXXXXX"
            maxLength={8}
            style={S.codeInput}
            autoFocus
          />

          {status ? (
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <WaitingDots />
              <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>{status}</p>
            </div>
          ) : (
            <button
              onClick={joinRoom}
              disabled={!codeIn.trim()}
              style={{ ...S.btnPrimary, marginTop: 16, opacity: codeIn.trim() ? 1 : 0.45 }}
            >
              {Icon.plane(18, "#fff")} ¡A bordo!
            </button>
          )}

          {error && (
            <div style={S.errorBox}>
              <p style={{ color: "#C00", fontSize: 13, fontWeight: 600 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ ...S.card, background: C.bgSoft }}>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8, fontWeight: 500, textAlign: "center" }}>
            Pide el código al anfitrión.<br />
            Son <strong style={{ color: C.primary }}>6 letras</strong> — fácil de compartir en voz alta.
          </p>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // CHAT
  // ════════════════════════════════════════════
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: C.bg, fontFamily: "'Comfortaa', sans-serif", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: C.bg,
        borderBottom: `1.5px solid ${C.border}`,
        padding: "12px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: `0 2px 16px ${C.shadow}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.action}, #0096C7)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px rgba(0,180,216,0.3)`,
            flexShrink: 0,
          }}>
            {Icon.plane(20, "#fff")}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontFamily: "'Comfortaa',sans-serif", fontSize: 16, fontWeight: 700, color: C.primary }}>
                AirChat
              </h3>
              {roomCode && (
                <span style={{
                  background: C.fog, color: C.primary,
                  fontSize: 10, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 50,
                  fontFamily: "'Quicksand',sans-serif", letterSpacing: 1,
                }}>
                  {roomCode}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
              <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600 }}>
                {peers.length
                  ? `${peers.length} en vuelo: ${peers.join(", ")}`
                  : "Conectado"}
              </p>
            </div>
          </div>
        </div>

        {role === "host" && roomCode && (
          <button style={S.btnSmall} onClick={async () => {
            try { await navigator.clipboard.writeText(roomCode); } catch {}
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }}>
            {Icon.plus()} {copied ? "¡Copiado!" : "Invitar"}
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "14px 16px 6px",
        display: "flex", flexDirection: "column", gap: 10,
        background: C.bgSoft,
      }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "20%", color: C.textLight }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>✈</div>
            <p style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 13, fontWeight: 600, color: C.textMuted }}>
              Canal seguro listo.<br />¡Di algo bonito!
            </p>
          </div>
        )}

        {msgs.map((m) => (
          <div key={m.id} className="fade-up" style={{ display: "flex", flexDirection: "column" }}>
            {m.sys ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={S.msgSys}>{m.txt}</span>
              </div>
            ) : (
              <>
                {!m.mine && (
                  <span style={{
                    fontSize: 11, color: C.textMuted,
                    marginLeft: 6, marginBottom: 4,
                    fontFamily: "'Quicksand',sans-serif", fontWeight: 700,
                  }}>
                    {m.from}
                  </span>
                )}
                <div style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
                  <div style={m.mine ? S.msgMine : S.msgOther}>
                    <span>{m.txt}</span>
                    <div style={{
                      fontSize: 10,
                      color: m.mine ? "rgba(255,255,255,0.65)" : C.textLight,
                      marginTop: 5, textAlign: "right",
                      fontFamily: "'Quicksand',sans-serif", fontWeight: 600,
                    }}>
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
        background: C.bg,
        borderTop: `1.5px solid ${C.border}`,
        padding: "10px 14px 16px",
        display: "flex", gap: 10, alignItems: "center",
        flexShrink: 0,
      }}>
        <input
          value={chatIn}
          onChange={(e) => setChatIn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe tu mensaje..."
          style={{ ...S.input, flex: 1, padding: "12px 16px" }}
        />
        <button
          onClick={send}
          disabled={!chatIn.trim()}
          style={{
            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
            background: chatIn.trim()
              ? `linear-gradient(135deg,${C.action},#0096C7)`
              : C.bgSoft,
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
