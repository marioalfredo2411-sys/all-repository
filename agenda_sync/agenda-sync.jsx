import { useState, useRef, useEffect } from "react";

const C = {
  bg:"#FAF7F2", surface:"#FFFFFF", card:"#F5F0E8",
  border:"#E8E0D0", text:"#2C2416", muted:"#8A7D6A", accent:"#C4714A",
};

const PALETTE = [
  {dot:"#C4714A",bg:"#F9EDE6"},{dot:"#3A6B8A",bg:"#E6EFF5"},{dot:"#5A7A4A",bg:"#EBF2E8"},
  {dot:"#8A4AA8",bg:"#F3E8F5"},{dot:"#E07A00",bg:"#FFF3E0"},{dot:"#2A8A6A",bg:"#E8F5F0"},
  {dot:"#C43A5A",bg:"#FDE8EC"},{dot:"#3A4AA8",bg:"#E8EAF5"},{dot:"#8A8A2A",bg:"#F5F5E8"},
  {dot:"#7A2A8A",bg:"#F0E8F5"},
];

const QUICK_COLORS = [
  "#E74C3C","#E67E22","#F39C12","#2ECC71","#1ABC9C",
  "#3498DB","#9B59B6","#E91E63","#FF5722","#607D8B","#795548","#34495E",
];

const DEFAULT_CATS = [
  {name:"Familia", icon:"🏠", dot:"#C4714A", bg:"#F9EDE6"},
  {name:"Trabajo",  icon:"💼", dot:"#3A6B8A", bg:"#E6EFF5"},
  {name:"Personal", icon:"⭐", dot:"#5A7A4A", bg:"#EBF2E8"},
];

const EMOJI_LIST = [
  "🏠","💼","⭐","🎉","❤️","🏃","📚","🎵","✈️","🍕",
  "🎯","💪","🧘","🌿","🐾","🎮","🎨","🏥","🎓","💰",
  "🌍","🏋️","🤝","🎤","📸","🚗","🛒","🍔","🎁","🔧",
  "🏖️","⚽","🎭","🧁","🦷","💊","📊","🖥️","🎪","🌸",
  "🦋","🔑","💡","🎬","🍷","☕","🌙","🚀","🎻","🏔️",
];

const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function pad(n){ return String(n).padStart(2,"0"); }
function toKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }

function hexToLight(hex){
  if(!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#F5F0E8";
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r+(255-r)*0.82)},${Math.round(g+(255-g)*0.82)},${Math.round(b+(255-b)*0.82)})`;
}

const NOW = new Date(2026,3,28,14,0); // April 28 2026, 14:00
function td(days=0){
  const d=new Date(NOW); d.setDate(d.getDate()+days);
  return toKey(d.getFullYear(),d.getMonth(),d.getDate());
}

const SEED = [
  {id:1,title:"Reunión de equipo",  date:td(2),time:"10:00",category:"Trabajo", note:"Presentar avances Q2",  invitees:"carlos@work.com"},
  {id:2,title:"Cena familiar",       date:td(4),time:"19:30",category:"Familia", note:"Cumpleaños de mamá 🎂",invitees:"maria@familia.com"},
  {id:3,title:"Revisión proyecto",   date:td(1),time:"14:00",category:"Trabajo", note:"Entregar informe final",invitees:""},
];

// ── Shared cat editor fields (used for both add & edit) ───────────────────────
function CatForm({initial, isEdit, existingNames, onSubmit, onCancel}){
  const [name,      setName]      = useState(initial?.name||"");
  const [icon,      setIcon]      = useState(initial?.icon||"📌");
  const [iconInput, setIconInput] = useState(initial?.icon||"");
  const [showEmoji, setShowEmoji] = useState(false);
  const [colorMode, setColorMode] = useState("custom");
  const [palIdx,    setPalIdx]    = useState(0);
  const [hexVal,    setHexVal]    = useState(initial?.dot||"#8A4AA8");

  const dot = colorMode==="palette" ? PALETTE[palIdx].dot : hexVal;
  const bg  = colorMode==="palette" ? PALETTE[palIdx].bg  : hexToLight(hexVal);

  function submit(){
    const n=name.trim();
    if(!n) return;
    // For add: no duplicate names. For edit: allow same name (own).
    if(!isEdit && existingNames.includes(n)) return;
    onSubmit({name:n, icon, dot, bg});
  }

  const valid = name.trim() && (!(!isEdit && existingNames.includes(name.trim())));

  return (
    <div style={{background:C.bg,borderRadius:13,padding:16,border:`1.5px solid ${dot}`,marginTop:isEdit?8:0}}>
      {/* Live preview */}
      <div style={{display:"flex",alignItems:"center",gap:12,background:bg,border:`2px dashed ${dot}`,borderRadius:11,padding:"10px 14px",marginBottom:14}}>
        <span style={{fontSize:26}}>{icon}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:dot}}>{name||"Nombre de categoría"}</div>
          <div style={{fontSize:10,color:C.muted}}>Vista previa</div>
        </div>
        <div style={{width:18,height:18,borderRadius:"50%",background:dot,border:"2px solid white",boxShadow:`0 0 0 2px ${dot}`}}/>
      </div>

      {/* Name */}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,display:"block",marginBottom:4,fontFamily:"monospace"}}>NOMBRE *</label>
        <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="Ej: Salud, Viajes..."
          style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:C.surface}}/>
      </div>

      {/* Emoji */}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,display:"block",marginBottom:6,fontFamily:"monospace"}}>ÍCONO / EMOJI</label>
        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:6}}>
          <div style={{width:40,height:40,borderRadius:9,background:bg,border:`2px solid ${dot}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
          <input value={iconInput} onChange={e=>{setIconInput(e.target.value);if(e.target.value.trim())setIcon(e.target.value.trim());}}
            placeholder="Escribe o pega emoji ✍️"
            style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:8,padding:"8px 11px",fontSize:18,fontFamily:"inherit",outline:"none",background:C.surface}}/>
          <button onClick={()=>setShowEmoji(o=>!o)}
            style={{padding:"8px 10px",border:`1.5px solid ${showEmoji?dot:C.border}`,borderRadius:8,background:showEmoji?bg:"transparent",cursor:"pointer",fontSize:11,color:showEmoji?dot:C.muted,fontWeight:showEmoji?700:400,whiteSpace:"nowrap"}}>
            {showEmoji?"▲":"▼ Más"}
          </button>
        </div>
        {showEmoji&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:4,background:C.surface,borderRadius:10,padding:10,border:`1px solid ${C.border}`}}>
            {EMOJI_LIST.map(em=>(
              <button key={em} onClick={()=>{setIcon(em);setIconInput(em);setShowEmoji(false);}}
                style={{fontSize:20,background:icon===em?bg:"transparent",border:icon===em?`2px solid ${dot}`:"2px solid transparent",borderRadius:7,padding:"3px 5px",cursor:"pointer"}}>
                {em}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div style={{marginBottom:14}}>
        <label style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,display:"block",marginBottom:8,fontFamily:"monospace"}}>COLOR</label>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[["palette","🎨 Paleta"],["custom","✏️ Personalizado"]].map(([m,lbl])=>(
            <button key={m} onClick={()=>setColorMode(m)}
              style={{flex:1,padding:"6px 0",borderRadius:8,border:`1.5px solid ${colorMode===m?dot:C.border}`,background:colorMode===m?bg:"transparent",color:colorMode===m?dot:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:colorMode===m?700:400}}>
              {lbl}
            </button>
          ))}
        </div>
        {colorMode==="palette"&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {PALETTE.map((p,i)=>(
              <button key={i} onClick={()=>setPalIdx(i)}
                style={{width:28,height:28,borderRadius:"50%",background:p.dot,border:palIdx===i?`3px solid ${C.text}`:"3px solid transparent",cursor:"pointer",outline:"none",boxShadow:palIdx===i?`0 0 0 2px white,0 0 0 4px ${p.dot}`:"none"}}/>
            ))}
          </div>
        )}
        {colorMode==="custom"&&(
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{position:"relative",width:50,height:50,borderRadius:11,overflow:"hidden",border:`2px solid ${C.border}`,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
              <input type="color" value={hexVal} onChange={e=>setHexVal(e.target.value)}
                style={{position:"absolute",inset:"-8px",width:"calc(100%+16px)",height:"calc(100%+16px)",border:"none",padding:0,cursor:"pointer"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:hexVal,border:`1px solid ${C.border}`,flexShrink:0}}/>
                <input value={hexVal} onChange={e=>{if(/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))setHexVal(e.target.value);}}
                  style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:7,padding:"6px 9px",fontSize:12,fontFamily:"monospace",outline:"none",background:C.surface,letterSpacing:1}}/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {QUICK_COLORS.map(h=>(
                  <button key={h} onClick={()=>setHexVal(h)}
                    style={{width:22,height:22,borderRadius:"50%",background:h,border:hexVal===h?`3px solid ${C.text}`:"2px solid white",cursor:"pointer",outline:"none",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onCancel}
          style={{flex:1,padding:"9px 0",border:`1.5px solid ${C.border}`,borderRadius:9,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
          Cancelar
        </button>
        <button onClick={submit} disabled={!valid}
          style={{flex:2,padding:"9px 0",border:"none",borderRadius:9,background:valid?dot:C.border,color:"#fff",cursor:valid?"pointer":"not-allowed",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
          {isEdit?"💾 Guardar cambios":"+ Agregar categoría"}
        </button>
      </div>
    </div>
  );
}

// ── Category Modal ────────────────────────────────────────────────────────────
function CatModal({cats, onClose, onSave, onEdit, onDelete}){
  const [editingName, setEditingName] = useState(null); // name of cat being edited
  const [addingNew,   setAddingNew]   = useState(false);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(44,36,22,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
      <div style={{background:C.surface,borderRadius:20,padding:26,width:500,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontSize:17,fontWeight:700}}>🏷 Gestionar categorías</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted}}>×</button>
        </div>

        {/* Category list */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,marginBottom:10,fontFamily:"monospace"}}>TODAS LAS CATEGORÍAS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cats.map(cat=>(
              <div key={cat.name}>
                {/* Row */}
                {editingName!==cat.name&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,background:cat.bg,border:`1.5px solid ${cat.dot}`,borderRadius:11,padding:"9px 14px"}}>
                    <span style={{fontSize:22}}>{cat.icon}</span>
                    <span style={{flex:1,fontWeight:600,fontSize:14,color:cat.dot}}>{cat.name}</span>
                    <div style={{width:14,height:14,borderRadius:"50%",background:cat.dot,flexShrink:0}}/>
                    {/* Edit button — ALL cats */}
                    <button onClick={()=>{setEditingName(cat.name);setAddingNew(false);}}
                      style={{background:"rgba(0,0,0,0.07)",border:"none",cursor:"pointer",fontSize:13,padding:"4px 9px",borderRadius:7,color:cat.dot,fontWeight:600}}>
                      ✏️ Editar
                    </button>
                    {/* Delete only non-base */}
                    {!["Familia","Trabajo","Personal"].includes(cat.name)&&(
                      <button onClick={()=>onDelete(cat.name)}
                        style={{background:"rgba(0,0,0,0.07)",border:"none",cursor:"pointer",fontSize:13,padding:"4px 9px",borderRadius:7,color:C.muted}}>
                        🗑
                      </button>
                    )}
                  </div>
                )}
                {/* Inline edit form */}
                {editingName===cat.name&&(
                  <CatForm
                    initial={cat}
                    isEdit={true}
                    existingNames={cats.map(c=>c.name).filter(n=>n!==cat.name)}
                    onSubmit={updated=>{onEdit(cat.name, updated); setEditingName(null);}}
                    onCancel={()=>setEditingName(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add new */}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
          {!addingNew
            ? <button onClick={()=>{setAddingNew(true);setEditingName(null);}}
                style={{width:"100%",padding:"10px 0",border:`1.5px dashed ${C.border}`,borderRadius:10,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>
                + Nueva categoría
              </button>
            : <>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,marginBottom:4,fontFamily:"monospace"}}>+ NUEVA CATEGORÍA</div>
                <CatForm
                  initial={null}
                  isEdit={false}
                  existingNames={cats.map(c=>c.name)}
                  onSubmit={cat=>{onSave(cat);setAddingNew(false);}}
                  onCancel={()=>setAddingNew(false)}
                />
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({e, cats, onDelete, compact}){
  const cat = cats.find(c=>c.name===e.category)||{bg:C.card,dot:C.muted,icon:"📌"};
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:compact?"10px 14px":"14px 16px",marginBottom:10,display:"flex",alignItems:compact?"center":"flex-start",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
      <div style={{width:3,borderRadius:4,alignSelf:"stretch",minHeight:36,background:cat.dot,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:compact?0:4}}>
          <span style={{fontSize:16,flexShrink:0}}>{cat.icon}</span>
          <span style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</span>
          <span style={{background:cat.bg,color:cat.dot,borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700,flexShrink:0,fontFamily:"monospace"}}>{e.category}</span>
        </div>
        {!compact&&<>
          <div style={{fontSize:12,color:C.muted,marginBottom:e.note||e.invitees?5:0}}>📅 {e.date}{e.time&&` · ⏰ ${e.time}`}</div>
          {e.note&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:3}}>📝 {e.note}</div>}
          {e.invitees&&<div style={{fontSize:12,color:C.muted}}>👥 {e.invitees}</div>}
        </>}
        {compact&&<div style={{fontSize:11,color:C.muted}}>{e.date}{e.time&&` · ${e.time}`}</div>}
      </div>
      <button onClick={()=>onDelete(e.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:"2px 6px",borderRadius:6,flexShrink:0}}>×</button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AgendaSync(){
  const [year,   setYear]   = useState(NOW.getFullYear());
  const [month,  setMonth]  = useState(NOW.getMonth());
  const [selDay, setSelDay] = useState(null);
  const [events, setEvents] = useState(SEED);
  const [cats,   setCats]   = useState(DEFAULT_CATS);
  const [filter, setFilter] = useState("Todas");

  const [showForm,   setShowForm]   = useState(false);
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [showNewCatInForm, setShowNewCatInForm] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [aiOpen,     setAiOpen]     = useState(false);

  const [form, setForm] = useState({title:"",date:"",time:"",category:"Familia",note:"",invitees:""});

  const [aiMsgs,    setAiMsgs]    = useState([{role:"assistant",content:"¡Hola! Soy tu asistente de agenda. Puedo ayudarte a organizar eventos, detectar conflictos o sugerir horarios. ¿En qué te ayudo?"}]);
  const [aiInput,   setAiInput]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEnd = useRef(null);
  const menuRef = useRef(null);

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[aiMsgs]);

  // Close menu on outside click
  useEffect(()=>{
    function handler(e){ if(menuRef.current&&!menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[]);

  const getCat = n => cats.find(c=>c.name===n)||{bg:C.card,dot:C.muted,icon:"📌"};

  const firstDay    = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const eventsForDay = d => {
    const k=toKey(year,month,d);
    return events.filter(e=>e.date===k&&(filter==="Todas"||e.category===filter));
  };

  const selKey = selDay ? toKey(year,month,selDay):null;
  const selEvts = selDay ? events.filter(e=>e.date===selKey&&(filter==="Todas"||e.category===filter)):[];

  const upcoming = [...events]
    .filter(e=>e.date>=td(0)&&(filter==="Todas"||e.category===filter))
    .sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))
    .slice(0,6);

  const isToday = d => d===NOW.getDate()&&month===NOW.getMonth()&&year===NOW.getFullYear();

  function addEvent(){
    if(!form.title||!form.date) return;
    setEvents(p=>[...p,{...form,id:Date.now()}]);
    setShowForm(false);
    setForm({title:"",date:"",time:"",category:cats[0]?.name||"Familia",note:"",invitees:""});
  }

  function addCat(cat){ setCats(p=>[...p,cat]); }
  function editCat(oldName, updated){
    setCats(p=>p.map(c=>c.name===oldName?updated:c));
    if(oldName!==updated.name) setEvents(p=>p.map(e=>e.category===oldName?{...e,category:updated.name}:e));
    if(filter===oldName) setFilter(updated.name);
  }
  function delCat(name){
    setCats(p=>p.filter(c=>c.name!==name));
    setEvents(p=>p.map(e=>e.category===name?{...e,category:"Personal"}:e));
    if(filter===name) setFilter("Todas");
  }

  async function sendAI(){
    if(!aiInput.trim()||aiLoading) return;
    const msg=aiInput.trim(); setAiInput("");
    const msgs=[...aiMsgs,{role:"user",content:msg}];
    setAiMsgs(msgs); setAiLoading(true);
    const ctx=events.length
      ?events.map(e=>`- ${e.title} (${e.category}) el ${e.date} a las ${e.time}${e.note?` — ${e.note}`:""}${e.invitees?` — Invitados: ${e.invitees}`:""}`).join("\n")
      :"Sin eventos.";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`Eres un asistente de agenda amigable y conciso. Responde en español.\nCategorías: ${cats.map(c=>`${c.icon} ${c.name}`).join(", ")}.\nEventos:\n${ctx}\nFecha y hora actual: 28 de Abril 2026, 14:00h`,
          messages:msgs.map(m=>({role:m.role,content:m.content}))})
      });
      const data=await res.json();
      setAiMsgs(p=>[...p,{role:"assistant",content:data.content?.[0]?.text||"Sin respuesta."}]);
    }catch{ setAiMsgs(p=>[...p,{role:"assistant",content:"Error al conectar con la IA."}]); }
    setAiLoading(false);
  }

  return (
    <div style={{fontFamily:"'Georgia','Times New Roman',serif",background:C.bg,minHeight:"100vh",color:C.text}}>

      {/* ── HEADER ── */}
      <div style={{background:C.text,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10}}>
          <span style={{color:"#fff",fontSize:20,fontWeight:700,letterSpacing:"-0.5px"}}>AgendaSync</span>
          <span style={{color:C.muted,fontSize:10,fontFamily:"monospace",letterSpacing:2}}>TU AGENDA INTELIGENTE</span>
        </div>

        {/* Dropdown menu */}
        <div ref={menuRef} style={{position:"relative"}}>
          <button onClick={()=>setMenuOpen(o=>!o)}
            style={{background:menuOpen?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:9,padding:"8px 16px",fontFamily:"inherit",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontWeight:600}}>
            ☰ Menú <span style={{fontSize:10,opacity:0.7}}>{menuOpen?"▲":"▼"}</span>
          </button>
          {menuOpen&&(
            <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:13,boxShadow:"0 12px 36px rgba(0,0,0,0.16)",minWidth:210,overflow:"hidden",zIndex:200}}>
              <button onClick={()=>{setShowCatMgr(true);setMenuOpen(false);}}
                style={{width:"100%",padding:"13px 16px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:14,textAlign:"left",display:"flex",alignItems:"center",gap:10,color:C.text,borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:20}}>🏷</span>
                <div>
                  <div style={{fontWeight:700}}>Categorías</div>
                  <div style={{fontSize:11,color:C.muted}}>Crear y gestionar</div>
                </div>
              </button>
              <button onClick={()=>{setAiOpen(o=>!o);setMenuOpen(false);}}
                style={{width:"100%",padding:"13px 16px",border:"none",background:aiOpen?"#F5F0E8":"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:14,textAlign:"left",display:"flex",alignItems:"center",gap:10,color:C.text}}>
                <span style={{fontSize:20}}>✦</span>
                <div>
                  <div style={{fontWeight:700,display:"flex",alignItems:"center",gap:7}}>
                    Asistente IA
                    {aiOpen&&<span style={{fontSize:10,background:"#C4714A",color:"#fff",borderRadius:8,padding:"1px 7px",fontFamily:"monospace"}}>activo</span>}
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>Chat inteligente</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{display:"flex",height:"calc(100vh - 54px)",overflow:"hidden"}}>

        {/* ── LEFT PANEL ── */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 16px 20px 18px"}}>

          {/* Category filters */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {["Todas",...cats.map(c=>c.name)].map(name=>{
              const active=filter===name;
              const cat=name!=="Todas"?getCat(name):null;
              return (
                <button key={name} onClick={()=>setFilter(name)}
                  style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${active?(cat?.dot||C.text):C.border}`,background:active?(cat?.bg||C.text):"transparent",color:active?(cat?.dot||"#fff"):C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400,display:"flex",alignItems:"center",gap:4,transition:"all 0.15s"}}>
                  {cat&&<span style={{fontSize:14}}>{cat.icon}</span>}
                  {name}
                </button>
              );
            })}
          </div>

          {/* ── ADD EVENT BUTTON (below filters) ── */}
          <button onClick={()=>{setShowForm(true);setForm(f=>({...f,date:selKey||td(0),category:cats[0]?.name||"Familia"}));}}
            style={{width:"100%",padding:"10px 0",marginBottom:16,background:C.accent,color:"#fff",border:"none",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"0 2px 10px rgba(196,113,74,0.25)"}}>
            <span style={{fontSize:18}}>+</span> Nuevo evento
          </button>

          {/* Month nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}}
              style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted,padding:"4px 8px"}}>‹</button>
            <span style={{fontSize:16,fontWeight:700}}>{MONTHS[month]} {year}</span>
            <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}}
              style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted,padding:"4px 8px"}}>›</button>
          </div>

          {/* Calendar */}
          <div style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)",marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:`1px solid ${C.border}`}}>
              {DAYS.map(d=><div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1,fontFamily:"monospace"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {cells.map((d,i)=>{
                if(!d) return <div key={`e${i}`} style={{padding:"6px 3px",minHeight:58,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}/>;
                const de=eventsForDay(d), sel=selDay===d, tod=isToday(d);
                return (
                  <div key={d} onClick={()=>setSelDay(sel?null:d)}
                    style={{padding:"6px 3px",minHeight:58,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:sel?C.card:"transparent",transition:"background 0.1s"}}>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:3}}>
                      <span style={{width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:tod?C.accent:"transparent",color:tod?"#fff":C.text,fontSize:12,fontWeight:tod?700:400}}>{d}</span>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                      {de.slice(0,4).map(e=>{
                        const cat=getCat(e.category);
                        return (
                          <span key={e.id} title={`${cat.icon} ${e.title}`}
                            style={{width:19,height:19,borderRadius:"50%",background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,border:`1.5px solid ${cat.dot}`}}>
                            {cat.icon}
                          </span>
                        );
                      })}
                      {de.length>4&&<span style={{fontSize:9,color:C.muted,alignSelf:"center",fontFamily:"monospace"}}>+{de.length-4}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16}}>
            {cats.map(c=>(
              <div key={c.name} style={{display:"flex",alignItems:"center",gap:4,background:c.bg,border:`1px solid ${c.dot}`,borderRadius:20,padding:"3px 10px 3px 6px"}}>
                <span style={{fontSize:13}}>{c.icon}</span>
                <span style={{fontSize:11,fontWeight:600,color:c.dot}}>{c.name}</span>
              </div>
            ))}
          </div>

          {/* Selected day */}
          {selDay&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,marginBottom:10,fontFamily:"monospace"}}>{selDay} DE {MONTHS[month].toUpperCase()}</div>
              {selEvts.length===0
                ?<div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>Sin eventos este día.</div>
                :selEvts.map(e=><EventCard key={e.id} e={e} cats={cats} onDelete={id=>setEvents(p=>p.filter(x=>x.id!==id))}/>)
              }
            </div>
          )}

          {/* Upcoming */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,marginBottom:10,fontFamily:"monospace"}}>PRÓXIMOS EVENTOS</div>
            {upcoming.length===0
              ?<div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>No hay eventos próximos.</div>
              :upcoming.map(e=><EventCard key={e.id} e={e} cats={cats} onDelete={id=>setEvents(p=>p.filter(x=>x.id!==id))} compact/>)
            }
          </div>
        </div>

        {/* ── AI PANEL ── */}
        {aiOpen&&(
          <div style={{width:330,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",boxShadow:"-4px 0 20px rgba(0,0,0,0.06)"}}>
            <div style={{padding:"13px 15px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:C.text,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13}}>✦</div>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>Asistente IA</div>
                <div style={{fontSize:11,color:C.muted}}>Conoce tus eventos</div>
              </div>
              <button onClick={()=>setAiOpen(false)} style={{marginLeft:"auto",background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted}}>×</button>
            </div>
            {/* Chips */}
            <div style={{padding:"9px 12px 8px",display:"flex",flexWrap:"wrap",gap:5,borderBottom:`1px solid ${C.border}`}}>
              {["¿Qué tengo esta semana?","Organiza mi semana","¿Hay conflictos?","Mejor día para reunión"].map(s=>(
                <button key={s} onClick={()=>setAiInput(s)}
                  style={{fontSize:11,padding:"4px 9px",borderRadius:12,border:`1px solid ${C.border}`,background:C.card,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>
              ))}
            </div>
            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"12px 12px 6px"}}>
              {aiMsgs.map((m,i)=>(
                <div key={i} style={{marginBottom:12,display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:7}}>
                  {m.role==="assistant"&&<div style={{width:24,height:24,borderRadius:"50%",background:C.text,color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>✦</div>}
                  <div style={{maxWidth:"83%",background:m.role==="user"?C.accent:C.card,color:m.role==="user"?"#fff":C.text,borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 12px",fontSize:13,lineHeight:1.5,whiteSpace:"pre-wrap"}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading&&(
                <div style={{display:"flex",gap:7,alignItems:"flex-start"}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.text,color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✦</div>
                  <div style={{background:C.card,borderRadius:"14px 14px 14px 4px",padding:"12px 16px",display:"flex",gap:5}}>
                    {[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:C.muted,display:"inline-block",animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}
                  </div>
                </div>
              )}
              <div ref={chatEnd}/>
            </div>
            <div style={{padding:"8px 12px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{display:"flex",gap:7}}>
                <input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAI()}
                  placeholder="Pregunta sobre tu agenda..."
                  style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 11px",fontSize:13,fontFamily:"inherit",outline:"none",background:C.card,color:C.text}}/>
                <button onClick={sendAI} disabled={aiLoading}
                  style={{background:C.text,color:"#fff",border:"none",borderRadius:10,padding:"9px 13px",cursor:"pointer",fontSize:16,opacity:aiLoading?0.5:1}}>→</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EVENT FORM MODAL ── */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(44,36,22,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:C.surface,borderRadius:18,padding:24,width:450,boxShadow:"0 24px 60px rgba(0,0,0,0.2)",maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>Nuevo evento</div>
            {[
              {label:"Título *",key:"title",type:"text",placeholder:"Nombre del evento"},
              {label:"Fecha *", key:"date", type:"date"},
              {label:"Hora",    key:"time", type:"time"},
              {label:"Nota",    key:"note", type:"text",placeholder:"Detalles adicionales..."},
              {label:"Invitados (emails)",key:"invitees",type:"text",placeholder:"email@ejemplo.com"},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,display:"block",marginBottom:5,fontFamily:"monospace"}}>{f.label}</label>
                <input type={f.type} value={form[f.key]} placeholder={f.placeholder||""}
                  onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:9,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:C.bg}}/>
              </div>
            ))}

            {/* Category selector */}
            <div style={{marginBottom:showNewCatInForm?12:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <label style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:1.2,fontFamily:"monospace"}}>CATEGORÍA</label>
                <button onClick={()=>setShowNewCatInForm(o=>!o)}
                  style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:`1.5px solid ${showNewCatInForm?C.accent:C.border}`,background:showNewCatInForm?"#F9EDE6":"transparent",color:showNewCatInForm?C.accent:C.muted,cursor:"pointer",fontFamily:"inherit",fontWeight:showNewCatInForm?700:400,display:"flex",alignItems:"center",gap:4}}>
                  {showNewCatInForm?"✕ Cancelar":"＋ Nueva categoría"}
                </button>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {cats.map(cat=>{
                  const active=form.category===cat.name;
                  return (
                    <button key={cat.name} onClick={()=>{setForm(f=>({...f,category:cat.name}));setShowNewCatInForm(false);}}
                      style={{padding:"7px 12px",borderRadius:9,border:`2px solid ${active?cat.dot:C.border}`,background:active?cat.bg:"transparent",color:active?cat.dot:C.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400,display:"flex",alignItems:"center",gap:5,transition:"all 0.1s"}}>
                      <span style={{fontSize:16}}>{cat.icon}</span>{cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline new category form */}
            {showNewCatInForm&&(
              <div style={{marginBottom:18,border:`1.5px dashed ${C.accent}`,borderRadius:13,padding:14,background:"#FFF9F6"}}>
                <div style={{fontSize:10,fontWeight:700,color:C.accent,letterSpacing:1.2,marginBottom:10,fontFamily:"monospace"}}>✦ CREAR NUEVA CATEGORÍA</div>
                <CatForm
                  initial={null}
                  isEdit={false}
                  existingNames={cats.map(c=>c.name)}
                  onSubmit={cat=>{
                    addCat(cat);
                    setForm(f=>({...f,category:cat.name}));
                    setShowNewCatInForm(false);
                  }}
                  onCancel={()=>setShowNewCatInForm(false)}
                />
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setShowForm(false);setShowNewCatInForm(false);}}
                style={{flex:1,padding:"10px 0",border:`1.5px solid ${C.border}`,borderRadius:10,background:"transparent",color:C.muted,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Cancelar</button>
              <button onClick={addEvent}
                style={{flex:1,padding:"10px 0",border:"none",borderRadius:10,background:C.text,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>Guardar evento</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ── */}
      {showCatMgr&&<CatModal cats={cats} onClose={()=>setShowCatMgr(false)} onSave={addCat} onEdit={editCat} onDelete={delCat}/>}

      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
