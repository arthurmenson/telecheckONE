// v2 — HOME + CARE screens
const { useState: uSA, useEffect: uEA, useRef: uRA } = React;

// ── Swipeable vitals carousel (Latest / Trends / Today) ──
function Donut({ label, value, unit, pct, color, delta, deltaCls, target, sub, onClick }) {
  const r = 24, c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  return (
    <div className="gl" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="ring">
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeOpacity="0.14" strokeWidth="4"/>
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={off}/>
        </svg>
        <div className="ring-c">
          <div className="rn" style={{ color, fontSize: String(value).length > 3 ? 12 : 15 }}>{value}</div>
          <div className="ru">{unit}</div>
        </div>
      </div>
      <div className="ring-meta">
        <div className="rl">{label}{sub ? <><br/><span style={{fontWeight:600}}>{sub}</span></> : null}</div>
        <div className={`rd ${deltaCls || ""}`}>{delta}</div>
        {target ? <div className="rs">{target}</div> : null}
      </div>
    </div>
  );
}


// ── Page registry ──
const GLANCE_ALL = [
  { id: "summary",  label: "At a glance",       color: "#3aaa7a" },
  { id: "vitals",   label: "Lab results",        color: "#c28320" },
  { id: "lipids",   label: "Lipid panel",        color: "#d4742a" },
  { id: "liver",    label: "Liver & kidney",     color: "#2a8a4a" },
  { id: "meds",     label: "Medications today",  color: "#7c6fcd" },
  { id: "visit",    label: "Next visit",         color: "#5b8dee" },
  { id: "programs", label: "RPM program",        color: "#e07b54" },
];
const GLANCE_DEFAULT = ["summary", "vitals", "lipids"];
function loadGlancePages() {
  try {
    const s = localStorage.getItem("pt-v6-glance");
    if (s) {
      const parsed = JSON.parse(s);
      // If saved list doesn't include new "summary" page, reset to default
      if (!parsed.includes("summary")) { localStorage.removeItem("pt-v6-glance"); return GLANCE_DEFAULT; }
      return parsed;
    }
    return GLANCE_DEFAULT;
  } catch { return GLANCE_DEFAULT; }
}

// ── Page renderers ──
function GlancePageSummary({ nav }) {
  const tiles = [
    { label: "Labs",     value: "2",  sub: "New results",  go: "labs",             color: "#c28320" },
    { label: "Meds",     value: "3",  sub: "Active",       go: "pharmacy",         color: "#7c6fcd" },
    { label: "Orders",   value: "1",  sub: "In progress",  go: "pharmacy-orders",  color: "#5b8dee" },
    { label: "Refills",  value: "1",  sub: "In review",    go: "pharmacy-rx",      color: "#3aaa7a" },
  ];
  return (
    <div className="gl-page" style={{ display: "flex", gap: 7 }}>
      {tiles.map(({ label, value, sub, go, color }) => (
        <div key={label} onClick={() => nav(go)} style={{
          flex: 1, minWidth: 0, background: "#fff", borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.07)",
          borderBottom: `3px solid ${color}`,
          padding: "10px 8px 9px",
          cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxSizing: "border-box", height: "100%",
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.02em", margin: "auto 0" }}>{value}</div>
          <div style={{ fontSize: 10, fontWeight: 500, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

function GlancePageVitals({ nav }) {
  const metrics = [
    { label: "HbA1c",    value: "7.8", unit: "%",      status: "High",   statusCls: "warn", pct: 62, color: "#c28320", go: "labs-trends" },
    { label: "Glucose",  value: "132", unit: "mg/dL",  status: "↑ High", statusCls: "bad",  pct: 82, color: "#d4742a", go: "labs" },
    { label: "eGFR",     value: "94",  unit: "mL/min", status: "Normal", statusCls: "ok",   pct: 94, color: "#2a8a4a", go: "labs" },
    { label: "Haemog.",  value: "11.2",unit: "g/dL",   status: "↓ Low",  statusCls: "info", pct: 70, color: "#2b6cb0", go: "labs" },
  ];
  return (
    <div className="gl-page" style={{ display: "flex", gap: 7 }}>
      {metrics.map(({ label, value, unit, status, statusCls, pct, color, go }) => (
        <div key={label} onClick={() => nav(go)} style={{
          flex: 1, minWidth: 0, background: "#fff", borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.07)", padding: "9px 7px 8px",
          cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxSizing: "border-box", height: "100%",
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontSize: 9, color: "var(--fg-4)", marginTop: 1 }}>{unit}</div>
          </div>
          <div>
            <div style={{ height: 3, background: "rgba(0,0,0,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 5 }}>
              <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 2 }}/>
            </div>
            <span className={`lab-chip ${statusCls}`} style={{ fontSize: 8.5, padding: "2px 5px" }}>{status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
function GlancePageLipids({ nav }) {
  return (
    <div className="gl-page" onClick={() => nav("labs")} style={{ cursor: "pointer" }}>
      <div style={{ background: "#fbfaf7", borderRadius: 14, border: "1px solid rgba(0,0,0,0.05)", padding: "8px 12px", height: 120, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Lipid panel <span style={{ fontWeight: 500, color: "var(--fg-4)", marginLeft: 4, textTransform: "none" }}>4 Apr</span></div>
          <span className="lab-chip warn" style={{ fontSize: 9 }}>2 above target</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px", flex: "1 1 0", minHeight: 0, overflow: "hidden", alignContent: "center" }}>
          {[
            { k: "LDL",   v: 142, u: "mg/dL", pct: 71, lo: 0,  hi: 50,  color: "#d4742a" },
            { k: "HDL",   v: 48,  u: "mg/dL", pct: 48, lo: 40, hi: 100, color: "#2a8a4a" },
            { k: "Total", v: 220, u: "mg/dL", pct: 73, lo: 0,  hi: 67,  color: "#d4742a" },
            { k: "Trig",  v: 168, u: "mg/dL", pct: 67, lo: 0,  hi: 60,  color: "#d4742a" },
          ].map(({ k, v, u, pct, lo, hi, color }) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--fg-3)", width: 30, flexShrink: 0 }}>{k}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ position: "relative", height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 3 }}>
                  <div style={{ position: "absolute", top: 0, left: lo + "%", width: (hi - lo) + "%", height: "100%", background: "#2a8a4a22", borderRadius: 3 }}/>
                  <div style={{ position: "absolute", top: "50%", left: pct + "%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: "50%", background: color, border: "1.5px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0, color }}>{v}<span style={{ fontSize: 8.5, fontWeight: 500, color: "var(--fg-4)" }}> {u}</span></div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--fg-3)", paddingTop: 4, borderTop: "1px solid rgba(0,0,0,0.05)", flexShrink: 0 }}>
          <span>Next draw · <b style={{ color: "var(--fg-1)" }}>Jul</b></span>
          <span>HDL <b style={{ color: "#2a8a4a" }}>↑ +3</b> since Jan</span>
        </div>
      </div>
    </div>
  );
}
function GlancePageLiver({ nav }) {
  return (
    <div className="gl-page" onClick={() => nav("labs")} style={{ cursor: "pointer" }}>
      <div className="lab-row" style={{"--n": 2}}>
        <div className="lab-card tint-amber">
          <div className="lab-head">
            <div><div className="lab-k">Liver · ALT/AST</div><div className="lab-v"><span className="num" style={{color:"#8a5a1f"}}>28</span><span className="u">U/L</span></div></div>
            <span className="lab-chip ok">normal</span>
          </div>
          <div className="lab-chart">
            <svg viewBox="0 0 120 60" preserveAspectRatio="none">
              <rect x="0" y="30" width="120" height="30" fill="#2a8a4a" opacity="0.08"/>
              <line x1="0" y1="30" x2="120" y2="30" stroke="#2a8a4a" strokeDasharray="2 3" strokeWidth="0.7" opacity="0.5"/>
              <path d="M0,36 L20,34 L40,30 L60,32 L80,33 L100,32 L120,32" fill="none" stroke="#c28320" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              {[[0,36],[20,34],[40,30],[60,32],[80,33],[100,32],[120,32]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="1.5" fill="#c28320"/>))}
              <path d="M0,38 L20,37 L40,35 L60,36 L80,37 L100,36 L120,36" fill="none" stroke="#e0a85a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              {[[0,38],[20,37],[40,35],[60,36],[80,37],[100,36],[120,36]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="1.3" fill="#e0a85a"/>))}
              <circle cx="120" cy="32" r="6" fill="#c28320" opacity="0.18"/><circle cx="120" cy="32" r="2.6" fill="#c28320"/>
            </svg>
          </div>
          <div className="lab-axis"><span>Oct</span><span>Jan</span><span>Mar</span></div>
          <div className="lab-foot">
            <div><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#c28320",marginRight:3}}/>ALT 28</div>
            <div><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#e0a85a",marginRight:3}}/>AST 24</div>
          </div>
        </div>
        <div className="lab-card tint-green">
          <div className="lab-head">
            <div><div className="lab-k">Kidney · Creatinine</div><div className="lab-v"><span className="num" style={{color:"#2a8a4a"}}>0.9</span><span className="u">mg/dL</span></div></div>
            <span className="lab-delta dn">-0.1</span>
          </div>
          <div className="lab-chart">
            <svg viewBox="0 0 120 60" preserveAspectRatio="none">
              <rect x="0" y="18" width="120" height="24" fill="#2a8a4a" opacity="0.08"/>
              <line x1="0" y1="18" x2="120" y2="18" stroke="#2a8a4a" strokeDasharray="2 3" strokeWidth="0.7" opacity="0.5"/>
              <line x1="0" y1="42" x2="120" y2="42" stroke="#2a8a4a" strokeDasharray="2 3" strokeWidth="0.7" opacity="0.5"/>
              <defs><linearGradient id="kid-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a8a4a" stopOpacity="0.22"/><stop offset="100%" stopColor="#2a8a4a" stopOpacity="0"/></linearGradient></defs>
              <path d="M0,30 L24,30 L48,27 L72,30 L96,33 L120,33 L120,60 L0,60 Z" fill="url(#kid-fill)"/>
              <path d="M0,30 L24,30 L48,27 L72,30 L96,33 L120,33" fill="none" stroke="#2a8a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              {[[0,30],[24,30],[48,27],[72,30],[96,33],[120,33]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="1.6" fill="#fff" stroke="#2a8a4a" strokeWidth="1.1"/>))}
              <circle cx="120" cy="33" r="6" fill="#2a8a4a" opacity="0.18"/><circle cx="120" cy="33" r="2.6" fill="#2a8a4a"/>
            </svg>
          </div>
          <div className="lab-axis"><span>Oct</span><span>Jan</span><span>Mar</span></div>
          <div className="lab-foot"><div>target <b>0.6–1.2</b></div><div>eGFR <b>94</b></div></div>
        </div>
      </div>
    </div>
  );
}
function GlancePageMeds({ nav }) {
  return (
    <div className="gl-page" onClick={() => nav("pharmacy")} style={{ cursor: "pointer" }}>
      <div style={{ background: "#fbfaf7", borderRadius: 14, border: "1px solid rgba(0,0,0,0.05)", padding: "8px 12px", height: 120, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0 }}>Medications today</div>
        <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
          {[
            { name: "Metformin 500 mg", time: "07:00", done: true,  color: "#7c6fcd" },
            { name: "Lisinopril 10 mg", time: "07:00", done: true,  color: "#5b8dee" },
            { name: "Metformin 500 mg", time: "19:00", done: false, color: "#7c6fcd" },
            { name: "Vitamin D 1000IU", time: "19:00", done: false, color: "#3aaa7a" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid " + m.color, background: m.done ? m.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.done && <svg width="7" height="7" viewBox="0 0 8 8"><path d="M1.5 4 L3.2 5.8 L6.5 2.2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: m.done ? "var(--fg-3)" : "var(--fg-1)", flex: 1, textDecoration: m.done ? "line-through" : "none" }}>{m.name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: m.done ? "var(--fg-4)" : m.color }}>{m.time}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--fg-3)", paddingTop: 4, borderTop: "1px solid rgba(0,0,0,0.05)", flexShrink: 0 }}>
          <span><b style={{color:"var(--fg-1)"}}>2</b> taken · <b style={{color:"var(--fg-1)"}}>2</b> pending</span>
          <span style={{color:"#7c6fcd",fontWeight:600}}>94% adherence ↑</span>
        </div>
      </div>
    </div>
  );
}
function GlancePageVisit({ nav }) {
  return (
    <div className="gl-page" onClick={() => nav("visit-prep")} style={{ cursor: "pointer" }}>
      <div style={{ background: "linear-gradient(135deg,#e8f0fe,#f0f4ff)", borderRadius: 14, border: "1px solid rgba(91,141,238,0.18)", padding: "10px 14px", height: 120, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#5b8dee", letterSpacing: "0.07em", textTransform: "uppercase" }}>Next visit</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-1)", marginTop: 3, letterSpacing: "-0.01em" }}>Dr. A. Mensah</div>
            <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>Video · Mon 20 Apr · 10:30</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#5b8dee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic2 n="video" s={18} sw={2} c="#fff"/>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "rgba(91,141,238,0.12)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "#5b8dee", textAlign: "center" }}>Pre-call prep</div>
          <div style={{ flex: 1, background: "#5b8dee", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#fff", textAlign: "center" }}>Live in 8 min</div>
        </div>
      </div>
    </div>
  );
}
function GlancePagePrograms({ nav }) {
  return (
    <div className="gl-page" onClick={() => nav("care")} style={{ cursor: "pointer" }}>
      <div style={{ background: "#fbfaf7", borderRadius: 14, border: "1px solid rgba(0,0,0,0.05)", padding: "10px 14px", height: 120, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#e07b54", letterSpacing: "0.07em", textTransform: "uppercase" }}>RPM program</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)", marginTop: 3, letterSpacing: "-0.01em" }}>Diabetes RPM · Dr. Mensah</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#e07b54", background: "#e07b5418", padding: "3px 8px", borderRadius: 9999, flexShrink: 0 }}>WK 12/26</div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-3)", marginBottom: 5 }}>
            <span>Adherence <b style={{color:"var(--fg-1)"}}>92%</b></span>
            <span>Re-check in <b style={{color:"var(--fg-1)"}}>6 wks</b></span>
          </div>
          <div style={{ height: 6, background: "var(--n-100,#eee)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "46%", height: "100%", background: "#e07b54", borderRadius: 3 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

const GLANCE_RENDERERS = { summary: GlancePageSummary, vitals: GlancePageVitals, lipids: GlancePageLipids, liver: GlancePageLiver, meds: GlancePageMeds, visit: GlancePageVisit, programs: GlancePagePrograms };

// ── Carousel editor sheet ──
function GlanceEditor({ activeIds, onSave, onClose }) {
  const [ids, setIds] = uSA([...activeIds]);
  const [dragging, setDragging] = uSA(null);
  const [dragOver, setDragOver] = uSA(null);
  const inactive = GLANCE_ALL.filter(p => !ids.includes(p.id));
  const remove = (id) => setIds(p => p.filter(x => x !== id));
  const add    = (id) => setIds(p => [...p, id]);
  const startDrag = (i) => setDragging(i);
  const enterSlot = (i) => { if (dragging === null || dragging === i) return; setDragOver(i); };
  const endDrag   = () => {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      setIds(prev => { const arr=[...prev]; const [item]=arr.splice(dragging,1); arr.splice(dragOver,0,item); return arr; });
    }
    setDragging(null); setDragOver(null);
  };
  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", zIndex:80, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:"20px 16px 36px", maxHeight:"72%", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.01em" }}>Customise cards</div>
          <button onClick={onClose} style={{ background:"var(--n-100,#eee)", border:0, borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Done</button>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:"var(--fg-3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Shown · drag to reorder</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
          {ids.map((id,i) => {
            const pg = GLANCE_ALL.find(p=>p.id===id); if (!pg) return null;
            return (
              <div key={id} draggable onDragStart={()=>startDrag(i)} onDragEnter={()=>enterSlot(i)} onDragEnd={endDrag} onDragOver={e=>e.preventDefault()}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background: dragOver===i?"#f0f4ff":"var(--n-50,#f7f7f5)", border:"1.5px solid "+(dragOver===i?"#5b8dee44":"transparent"), opacity:dragging===i?0.45:1, cursor:"grab", transition:"background 0.12s" }}>
                <div style={{ color:"var(--fg-4)", display:"flex", flexDirection:"column", gap:2.5 }}>
                  {[0,1,2].map(n=><div key={n} style={{ width:14, height:1.5, background:"currentColor", borderRadius:1 }}/>)}
                </div>
                <div style={{ width:8, height:8, borderRadius:"50%", background:pg.color, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:13, fontWeight:600, color:"var(--fg-1)" }}>{pg.label}</div>
                {ids.length > 1 && <button onClick={()=>remove(id)} style={{ background:"none", border:0, cursor:"pointer", color:"var(--fg-4)", fontSize:15, lineHeight:1, padding:"0 4px" }}>✕</button>}
              </div>
            );
          })}
        </div>
        {inactive.length > 0 && <>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--fg-3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Available to add</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
            {inactive.map(pg => (
              <div key={pg.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:"var(--n-50,#f7f7f5)" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:pg.color, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:13, fontWeight:600, color:"var(--fg-2)" }}>{pg.label}</div>
                <button onClick={()=>add(pg.id)} style={{ background:"var(--teal-500,#3aaa7a)", color:"#fff", border:0, borderRadius:8, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>+ Add</button>
              </div>
            ))}
          </div>
        </>}
        <button onClick={()=>{onSave(ids);onClose();}} style={{ width:"100%", padding:12, background:"var(--teal-500,#3aaa7a)", color:"#fff", border:0, borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>Save</button>
      </div>
    </div>
  );
}

// ── Main GlanceCarousel ──
function GlanceCarousel({ nav }) {
  const trackRef = uRA(null);
  const [page, setPage] = uSA(0);
  const [activeIds, setActiveIds] = uSA(loadGlancePages);
  const [editing, setEditing] = uSA(false);

  const pages = activeIds.map(id => GLANCE_ALL.find(p => p.id === id)).filter(Boolean);

  const onScroll = () => {
    const el = trackRef.current; if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };
  const go = (i) => { const el = trackRef.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };

  const savePages = (ids) => {
    setActiveIds(ids);
    localStorage.setItem("pt-v6-glance", JSON.stringify(ids));
    setPage(0);
    setTimeout(() => { const el = trackRef.current; if (el) el.scrollLeft = 0; }, 50);
  };

  const currentPage = pages[page];

  return (
    <div className="gl-carousel" style={{ position: "relative" }}>
      <div className="gl-label" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>{currentPage ? currentPage.label : "At a glance"}</span>
      </div>
      <div className="gl-track" ref={trackRef} onScroll={onScroll}>
        {pages.map(pg => {
          const Renderer = GLANCE_RENDERERS[pg.id];
          return Renderer ? <Renderer key={pg.id} nav={nav}/> : null;
        })}
      </div>
      <div className="gl-dots">
        {pages.map((_, i) => (
          <div key={i} className={"gl-dot" + (page === i ? " on" : "")} onClick={() => go(i)}/>
        ))}
      </div>
      {editing && <GlanceEditor activeIds={activeIds} onSave={savePages} onClose={() => setEditing(false)}/>}
    </div>
  );
}

// ── Footer swipeable card (AI / Quick actions / Pharmacy+Community) ──
function FootCarousel({ nav, toast, openAI }) {
  const trackRef = uRA(null);
  const [page, setPage] = uSA(0);

  const onScroll = () => {
    const el = trackRef.current; if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };

  const labels = ["Telecheck AI", "Quick actions", "Pharmacy & Community"];

  const quickActions = [
    { icon: "chat",   label: "Message\ncare team",  go: "care",        color: "#5b8dee" },
    { icon: "camera", label: "Scan\nfood",          go: "scan-start",  color: "#7c6fcd" },
    { icon: "spark",  label: "Track\nsymptoms",     go: "care-track",  color: "#e07b54" },
    { icon: "upload", label: "Upload\ndocs",        go: "labs-upload", color: "#3aaa7a" },
  ];

  return (
    <div className="foot-carousel-wrap">
      <div className="gl-label" style={{ marginBottom: 6 }}>
        <span>{labels[page]}</span>
        <span className="hint">· {page < 2 ? "swipe →" : "← back"}</span>
      </div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          borderRadius: 14,
        }}
      >
        {/* PAGE 1 — Telecheck AI */}
        <div style={{ minWidth: "100%", scrollSnapAlign: "start" }}>
          <div onClick={openAI} style={{
            background: "#fafaf9", borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.07)",
            padding: "14px 16px",
            cursor: "pointer",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--iris-500,#7c6fcd)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic2 n="spark" s={14} sw={2.2} c="#fff"/>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "-0.01em" }}>Ask Telecheck AI</div>
            </div>
            <div style={{
              background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10,
              padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", fontStyle: "italic" }}>What would you like to know?</div>
              <Ic2 n="send" s={15} sw={1.8} c="var(--iris-500,#7c6fcd)"/>
            </div>
          </div>
        </div>

        {/* PAGE 2 — Quick actions */}
        <div style={{
          minWidth: "100%", scrollSnapAlign: "start",
          background: "var(--card-bg, #fff)",
          borderRadius: 14,
          padding: "14px 12px",
          display: "flex", gap: 0,
          justifyContent: "space-around",
          boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        }}>
          {quickActions.map(({ icon, label, go, color }) => (
            <div key={go} onClick={() => nav(go)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              cursor: "pointer", flex: 1,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: color + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Ic2 n={icon} s={22} sw={1.8} c={color}/>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 500, color: "var(--fg-2, #555)",
                textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line",
              }}>{label}</div>
            </div>
          ))}
        </div>

        {/* PAGE 3 — Pharmacy + Community */}
        <div style={{
          minWidth: "100%", scrollSnapAlign: "start",
          display: "flex", gap: 10,
        }}>
          <div className="hf" style={{ flex: 1 }} onClick={() => nav("pharmacy-rx")}>
            <div className="hf-k">Pharmacy</div>
            <div className="hf-t">1 in review</div>
            <div className="hf-s">Metformin · ETA 2h</div>
          </div>
          <div className="hf" style={{ flex: 1 }} onClick={() => nav("me-community")}>
            <div className="hf-k">Community</div>
            <div className="hf-t">Thu · Q&amp;A</div>
            <div className="hf-s">Type-2 · 18:00</div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} onClick={() => {
            const el = trackRef.current;
            if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
          }} style={{
            width: i === page ? 16 : 6, height: 6, borderRadius: 3,
            background: i === page ? "var(--primary, #5b8dee)" : "var(--fg-4, #ccc)",
            transition: "width 0.2s, background 0.2s", cursor: "pointer",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── AI Brief Carousel ──
const AI_BRIEFS = [
  {
    id: "hba1c",
    tag: "HbA1c TREND",
    title: "Your HbA1c ticked up to 7.8% — nudging, not alarming.",
    body: "Three missed evening doses in March line up with the rise. A steady 19:00 reminder for 6 weeks should re-settle it.",
    actions: ["Open brief", "Set reminder"],
    goAI: true,
    toastMsg: "Evening reminder set · 19:00",
  },
  {
    id: "glucose",
    tag: "GLUCOSE PATTERN",
    title: "Post-dinner glucose spikes on Tuesdays and Thursdays.",
    body: "Likely tied to fufu portions — your scans show 40% larger servings those evenings. A half-portion swap could cut the spike by ~30 mg/dL.",
    actions: ["See pattern", "Scan food"],
    goLabs: true,
    goScan: true,
  },
  {
    id: "visit",
    tag: "VISIT PREP",
    title: "Dr. Mensah's visit is in 8 minutes. You're ready.",
    body: "Pre-call checklist done · BP logged · HbA1c result attached. One question flagged: evening dosing schedule.",
    actions: ["Join now", "View prep"],
    goVisit: true,
  },
];

function AIBriefCarousel({ nav, toast, openAI }) {
  const trackRef = uRA(null);
  const [page, setPage] = uSA(0);

  const onScroll = () => {
    const el = trackRef.current; if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };
  const go = (i) => { const el = trackRef.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };

  const handleAction = (brief, actionIdx) => {
    if (actionIdx === 0) {
      if (brief.goAI || brief.id === "hba1c") { openAI(); return; }
      if (brief.goVisit) { nav("visit-prep"); return; }
      if (brief.goLabs)  { nav("labs-trends"); return; }
      toast(brief.toastMsg || "Done");
    } else {
      if (brief.goPharmacy) { nav("pharmacy"); return; }
      if (brief.goScan)     { nav("scan-start"); return; }
      if (brief.goVisit)    { nav("visit-prep"); return; }
      toast(brief.toastMsg || "Done");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={trackRef} onScroll={onScroll} style={{ display:"flex", overflowX:"auto", scrollSnapType:"x mandatory", scrollBehavior:"smooth", WebkitOverflowScrolling:"touch", msOverflowStyle:"none", scrollbarWidth:"none" }}>
        {AI_BRIEFS.map((brief, i) => (
          <div key={brief.id} style={{ minWidth:"100%", scrollSnapAlign:"start" }}>
            <div className="aib">
              <div className="aib-k">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/></svg>
                AI BRIEF · {brief.tag}
                <span style={{ marginLeft:"auto", fontSize:9, fontWeight:500, opacity:0.7 }}>{i+1}/{AI_BRIEFS.length}</span>
              </div>
              <div className="aib-t">{brief.title}</div>
              <div className="aib-b">{brief.body}</div>
              <div className="aib-a">
                <button className="p" onClick={() => handleAction(brief, 0)}>{brief.actions[0]}</button>
                <button className="s" onClick={() => handleAction(brief, 1)}>{brief.actions[1]}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:5, marginTop:6 }}>
        {AI_BRIEFS.map((_,i) => (
          <div key={i} onClick={() => go(i)} style={{ width: i===page?16:5, height:5, borderRadius:3, background: i===page?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)", transition:"width 0.2s, background 0.2s", cursor:"pointer" }}/>
        ))}
      </div>
    </div>
  );
}


// ── Floating glance strip (appears when glance scrolls out of view) ──
const FLOAT_ITEMS = [
  { n:"video",    c:"#c8402f",         label:"Visit",   go:"care-visits" },
  { n:"lab",      c:"#c28320",         label:"Labs",    go:"labs"        },
  { n:"pill",     c:"#7c6fcd",         label:"Meds",    go:"pharmacy"    },
  { n:"heart",    c:"var(--teal-700)", label:"Track",   go:"care-track"  },
];

function FloatingGlanceBar({ visible, nav, openAI }) {
  return (
    <div style={{
      position: "absolute",
      top: 94, left: 0, right: 0,
      zIndex: 28,
      transform: visible ? "translateY(0)" : "translateY(-48px)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.32s cubic-bezier(0.2,0,0,1), opacity 0.22s ease",
      pointerEvents: visible ? "auto" : "none",
      background: "rgba(251,252,251,0.94)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      padding: "8px 12px 10px",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
    }}>
      {FLOAT_ITEMS.map((item, i) => (
        <div key={i} onClick={() => item.go === "__ai__" ? openAI() : nav(item.go)}
          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s",
          }}>
            <Ic2 n={item.n} s={17} sw={1.8} c={item.c}/>
          </div>
          <div style={{ fontSize:8.5, fontWeight:600, color:"var(--fg-3)", letterSpacing:".02em" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ────────── HOME ──────────
function HomeV2({ nav, toast, openAccount, openAI, openNotifs, openEmergency, delegate, openFAB }) {
  const kofi = delegate === "k";
  const scrollRef = uRA(null);
  const glanceRef = uRA(null);
  const [floating, setFloating] = uSA(false);

  uEA(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const onScroll = () => {
      const gl = glanceRef.current;
      if (!gl) return;
      const glRect = gl.getBoundingClientRect();
      const parentRect = scrollEl.getBoundingClientRect();
      // Float when the bottom of glance carousel is above the scroll container top + 60px
      setFloating(glRect.bottom < parentRect.top + 60);
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI} onFAB={openFAB} notifCount={3}/>
      <FloatingGlanceBar visible={floating} nav={nav} openAI={openAI}/>
      <div className="scroll" ref={scrollRef}>
        {/* HERO — greeting + ONE next action */}
        <div className="v2-hero home-hero">
          <div className="sub-lbl">Mon · 20 Apr</div>
          <h1 style={{ marginTop: 2 }}>{kofi ? "Looking after Kofi" : "Good morning, Ama"}</h1>
          <div className="hero-sum">2 things today. You're on track.</div>

          <div className="hero-cta" onClick={() => nav("visit-prep")}>
            <div className="hc-l">
              <div className="hc-k"><span className="d"/>LIVE IN 8 MIN</div>
              <div className="hc-t">Dr. Mensah · video follow-up</div>
              <div className="hc-s">HbA1c discussion · 10:30</div>
            </div>
            <button className="hc-btn">Join</button>
          </div>
        </div>

        <div className="content">
          {/* GLANCE — swipeable: Latest / Trends / Today */}
          <div ref={glanceRef}>
            <GlanceCarousel nav={nav}/>
          </div>

          {/* AI BRIEF — hero moment, stands alone */}
          <div className="aib">
            <div className="aib-k"><Ic2 n="spark" s={12} sw={2.2} c="#fff"/> AI BRIEF · TELECHECK</div>
            <div className="aib-t">Your HbA1c ticked up to 7.8% — nudging, not alarming.</div>
            <div className="aib-b">Three missed evening doses in March line up with the rise. A steady 19:00 reminder for 6 weeks should re-settle it.</div>
            <div className="aib-a">
              <button className="p" onClick={openAI}>Open brief</button>
              <button className="s" onClick={() => toast("Evening reminder set · 18:45")}>Set reminder</button>
            </div>
          </div>

          {/* TODAY — compact task strip, two items max */}
          <div className="section-h"><span>Today</span><span className="section-link" onClick={() => nav("care")}>All →</span></div>
          <div className="today">
            <div className="td" onClick={() => nav("pharmacy")}>
              <div className="td-ic teal"><Ic2 n="pill" s={18} sw={2}/></div>
              <div style={{flex:1, minWidth:0}}>
                <div className="td-t">Evening metformin</div>
                <div className="td-s">19:00 · tap to log or refill</div>
              </div>
              <div className="td-tm">in 9h</div>
            </div>
            <div className="td" onClick={() => nav("rpm")}>
              <div className="td-ic iris"><Ic2 n="heart" s={18} sw={2}/></div>
              <div style={{flex:1, minWidth:0}}>
                <div className="td-t">Weekly check-in</div>
                <div className="td-s">3 questions · 90s</div>
              </div>
              <div className="td-tm">due</div>
            </div>
          </div>

          {/* PROGRAM — single hero card, emotionally positive */}
          <div className="section-h"><span>Your program</span><span className="section-link" onClick={() => nav("care")}>Details →</span></div>
          <div className="prog" onClick={() => nav("care")} style={{ cursor: "pointer" }}>
            <div className="prog-h">
              <div>
                <div className="prog-t">Diabetes RPM · Dr. Mensah</div>
                <div className="prog-s">Adherence 92% · re-check in 6 weeks</div>
              </div>
              <div className="prog-wk">WEEK 12 / 26</div>
            </div>
            <div className="prog-bar"><div className="prog-bar-f" style={{ width: "46%" }}/></div>
          </div>

          {/* FOOTER row — swipeable card (Pharmacy+Community / Quick actions) */}
          <FootCarousel nav={nav} toast={toast} openAI={openAI}/>
        </div>
      </div>
      <TabBar2 active="home" onTab={nav} care={2}/>
    </div>
  );
}

// ────────── CARE ──────────
function CareV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI, sub = "Inbox", setSub, trackSub, setTrackSub }) {
  const tabs = ["Inbox", "Visits", "Programs", "Track", "Team"];
  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">
        <BigH title="Care" sub="Messages, visits, programs and your team" right={<button className="ic-btn" onClick={() => toast("Search")}><Ic2 n="search" s={18}/></button>}/>
        <SubTabs tabs={tabs} active={sub} onPick={setSub} cls="v3"/>
        <div className="content">
          {sub === "Inbox" && <CareInbox nav={nav} toast={toast} openAI={openAI}/>}
          {sub === "Visits" && <CareVisits nav={nav} toast={toast}/>}
          {sub === "Programs" && <CarePrograms nav={nav} toast={toast}/>}
          {sub === "Track" && <CareTrack nav={nav} toast={toast} forcedSub={trackSub} setForcedSub={setTrackSub}/>}
          {sub === "Team" && <CareTeam nav={nav} toast={toast}/>}
        </div>
      </div>
      <TabBar2 active="care" onTab={nav} care={2}/>
    </div>
  );
}

function CareInbox({ nav, openAI }) {
  const msgs = [
    { f: "Telecheck AI", p: "Noticed your Thursday glucose pattern — want to discuss?", t: "09:08", u: true, a: "AI", ai: true },
    { f: "Dr. A. Mensah", p: "Let's plan a 6-week re-check. Lab draw Thursday?", t: "09:12", u: true, a: "DM", thread: "dr-mensah", color: "teal" },
    { f: "Mobipharm Osu", p: "Your metformin is being prepared. Dispatch ETA 11:30.", t: "09:31", u: false, a: "MP", thread: "pharmacy", color: "warn" },
    { f: "Nurse Adjoa · coach", p: "How are your evening readings this week?", t: "Yesterday", u: false, a: "NA", thread: "nurse-adjoa", color: "iris" },
    { f: "Kojo (shared)", p: "Shared: dad's BP log from Sunday.", t: "Sun", u: false, a: "KO", thread: "kojo", color: "info" },
    { f: "Telecheck support", p: "New — Community events on your conditions.", t: "Mon", u: false, a: "TC", thread: "support", color: "gold" },
  ];
  return (
    <>
      {msgs.map((m, i) => (
        <div key={i} className="lc" onClick={() => m.ai ? openAI() : nav(`thread-${m.thread}`)}>
          <div className="lc-ic" style={{ background: m.ai ? "var(--iris-500)" : `var(--${m.color || "teal"}-500)`, color: "#fff", fontWeight: 700, fontSize: 12 }}>
            {m.ai ? <Ic2 n="spark" s={16} sw={2.2} c="#fff"/> : m.a}
          </div>
          <div>
            <div className="lc-t">{m.f} {m.u && <span className="lp ok">NEW</span>}</div>
            <div className="lc-s">{m.p}</div>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{m.t}</div>
        </div>
      ))}
    </>
  );
}

function CareVisits({ nav, toast }) {
  const [sheet, setSheet] = React.useState(null);
  return (
    <>
      <AIcard tone="sched" tag="NEXT VISIT · JOINABLE"
        title="Dr. Mensah is ready at 10:30"
        body="Video call, 15-min follow-up. Pre-call device check available now."
        actions={["Prep now", "Reschedule"]}
        onAct={(a) => a === "Prep now" ? nav("visit-prep") : setSheet("reschedule")}/>
      <div className="section-h"><span>Upcoming</span></div>
      <Row icon="video" tone="teal" title="Dr. Mensah — video" sub="Today 10:30 · follow-up · GHS 120" onClick={() => nav("visit-prep")}/>
      <Row icon="lab" tone="gold" title="Home lab draw" sub="Thursday 08:00 · HbA1c + kidney panel" onClick={() => setSheet("lab")}/>
      <Row icon="calendar" tone="iris" title="Diabetes coaching · async" sub="Weekly · Nurse Adjoa · next Mon" onClick={() => nav("thread-nurse-adjoa")}/>
      <div className="section-h"><span>Past</span></div>
      <Row icon="video" tone="info" title="Dr. Mensah — video" sub="14 Mar · summary + notes available" pill={{label:"SUMMARY", tone:"ok"}} onClick={() => nav("visit-summary")}/>
      <Row icon="doc" tone="iris" title="Nurse Adjoa — async" sub="02 Mar · cough review" onClick={() => nav("visit-summary")}/>
      <Row icon="video" tone="info" title="Dr. Owusu — video" sub="18 Feb · BP review for Kofi" onClick={() => nav("visit-summary")}/>
      <div className="section-h"><span>Find care</span></div>
      <button className="cta" style={{ width: "100%", margin: 0 }} onClick={() => nav("doctor-search")}>Find a clinician</button>
      {sheet === "lab" && <LabDrawSheet onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
      {sheet === "reschedule" && <RescheduleSheet onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

function CarePrograms({ nav, toast }) {
  const [offer, setOffer] = React.useState(null);
  const [doc, setDoc] = React.useState(null);
  const offers = {
    "hypertension": { name: "Hypertension CCM", sub: "For Kofi · invite from Dr. Owusu", who: "Kofi Mensah (delegated)", by: "Dr. Owusu · cardiology", price: "GHS 180 / month", commit: "3 months · cancel anytime",
      includes: ["Weekly BP check-ins", "Monthly clinician review", "BP cuff provided", "Alert thresholds 160/100", "Family dashboard for you"] },
    "adherence": { name: "Medication adherence coach", sub: "GHS 40/mo · with Nurse Adjoa", who: "Ama Mensah (you)", by: "Nurse Adjoa Boateng", price: "GHS 40 / month", commit: "6 weeks minimum",
      includes: ["Daily reminder tuning", "Weekly async check-in", "Behavioral techniques (Twi + English)", "Shared log with Dr. Mensah"] },
    "pregnancy": { name: "Pregnancy tracker", sub: "Weekly tracking · visit cadence · med-safety flags", who: "Ama Mensah (you)", by: "Self-enrolled · Dr. Mensah reviews", price: "Included", commit: "Pause anytime",
      includes: ["Weekly milestones by gestational age", "Medication safety cross-check (GLP-1, ACE-I, NSAIDs flagged)", "Visit cadence ramp (monthly → weekly)", "Home BP + weight logs", "Family visibility toggle"] },
    "nutrition": { name: "Nutrition coach", sub: "Photo-log meals · Ghanaian-food aware · dietitian chat", who: "Ama Mensah (you)", by: "Nurse Adjoa · registered dietitian", price: "GHS 60 / month", commit: "Monthly · cancel anytime",
      includes: ["AI meal photo scan (jollof, banku, waakye)", "Daily carb + calorie targets", "Weekly plan from dietitian", "Shared with Dr. Mensah"] },
    "symptom-diary": { name: "Symptom diary", sub: "Track symptoms over time with AI pattern-finding", who: "Ama Mensah (you)", by: "Self-tracked · flagged to Dr. Mensah", price: "Free", commit: "No commitment",
      includes: ["Quick-log from Track tab or Home", "Severity + triggers + context", "AI pattern detection weekly", "Auto-attached to your next visit"] },
  };
  const docs = {
    "rpm": { title: "RPM care plan · Diabetes", sub: "Signed 14 Jan 2026 · Dr. Mensah", body: "This care plan sets out your remote monitoring objectives: weekly fasting glucose target 80–130 mg/dL, quarterly HbA1c target <7.5%, monthly weight check, evening metformin 500 mg at 19:00. Escalation: reading >250 for 2 consecutive days OR symptomatic hypoglycemia. Coach: Nurse Adjoa Boateng. Pharmacy: Mobipharm Osu. Family visible: Kojo Mensah (son). Duration: 12 weeks, reviewed week 6…" },
    "consent": { title: "RPM consent form", sub: "14 Jan 2026 · Ama Mensah", body: "I consent to Telecheck and my care team viewing my device readings and medication logs for the purposes of remote patient monitoring. I understand data stays in Ghana-resident storage per NDPR and PRD §9. I can revoke any scope at any time via Me → Privacy…" },
  };
  return (
    <>
      <div className="section-h"><span>Active</span></div>
      <div className="prog" onClick={() => nav("rpm")} style={{ cursor: "pointer" }}>
        <div className="prog-h">
          <div><div className="prog-t">Diabetes RPM</div><div className="prog-s">Dr. Mensah · adherence 92%</div></div>
          <div className="prog-wk">WEEK 12</div>
        </div>
        <div className="prog-bar"><div className="prog-bar-f" style={{ width: "46%" }}/></div>
        <div className="prog-milestones">
          <div className="prog-ms done">Onboard</div>
          <div className="prog-ms done">Stabilize</div>
          <div className="prog-ms now">Re-check</div>
          <div className="prog-ms">Graduate</div>
        </div>
      </div>
      <Row icon="heart" tone="iris" title="Diabetes RPM · check-in due today" sub="Takes 90 seconds" pill={{label:"DUE", tone:"warn"}} onClick={() => nav("rpm")}/>

      <div className="section-h"><span>Clinical programs</span></div>
      <Row icon="heart" tone="teal" title="Hypertension CCM" sub="For Kofi · invite from Dr. Owusu" pill={{label:"INVITE", tone:"warn"}} onClick={() => setOffer(offers.hypertension)}/>
      <Row icon="spark" tone="iris" title="Metabolic · GLP-1 program" sub="Weight & HbA1c · clinician-led" onClick={() => nav("program-glp1")}/>
      <Row icon="pill" tone="warn" title="Medication adherence coach" sub="GHS 40/mo · with Nurse Adjoa" onClick={() => setOffer(offers.adherence)}/>

      <div className="section-h"><span>Tracking programs</span></div>
      <Row icon="heart" tone="iris" title="Pregnancy tracker" sub="Weekly milestones · med-safety flags · visit cadence" onClick={() => setOffer(offers.pregnancy)}/>
      <Row icon="camera" tone="gold" title="Nutrition coach" sub="Photo-log meals · Ghanaian food · dietitian chat" onClick={() => setOffer(offers.nutrition)}/>
      <Row icon="flag" tone="info" title="Symptom diary" sub="Track symptoms · AI finds patterns" onClick={() => setOffer(offers["symptom-diary"])}/>

      <div className="section-h"><span>Documents</span></div>
      <Row icon="doc" tone="info" title="RPM care plan · PDF" sub="Signed 14 Jan 2026" onClick={() => setDoc(docs.rpm)}/>
      <Row icon="doc" tone="teal" title="RPM consent · PDF" sub="Revocable anytime · Me → Privacy" onClick={() => setDoc(docs.consent)}/>
      {offer && <ProgramOfferSheet program={offer} onClose={() => setOffer(null)} toast={toast}/>}
      {doc && <DocSheet doc={doc} onClose={() => setDoc(null)} toast={toast}/>}
    </>
  );
}

function CareTrack({ nav, toast, forcedSub, setForcedSub }) {
  const [localSub, setLocalSub] = React.useState("Today");
  const sub = forcedSub || localSub;
  const setSub = setForcedSub || setLocalSub;
  const [logSheet, setLogSheet] = React.useState(null);
  return (
    <>
      <SubTabs tabs={["Today","Trends","Devices"]} active={sub} onPick={setSub}/>
      {sub === "Today" && (
        <>
          {/* Quick log row — primary action for this screen */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, margin: "4px 0 4px" }}>
            {[
              { k: "Glucose", ic: "heart", tone: "teal", log: { title: "Log glucose", sub: "Fasting · mg/dL", kind: "value", placeholder: "e.g. 118", unit: "mg/dL", ranges: "80–130 fasting" } },
              { k: "BP", ic: "heart", tone: "iris", log: { title: "Log BP", sub: "Systolic / Diastolic", kind: "value", placeholder: "e.g. 124/78", unit: "mmHg", ranges: "< 130/80" } },
              { k: "Meal", ic: "camera", tone: "gold", go: () => nav("scan-start") },
              { k: "Symptom", ic: "flag", tone: "warn", log: { title: "Log a symptom", sub: "Pick & rate severity", kind: "taken" } },
            ].map((q, i) => (
              <button key={i} onClick={() => q.go ? q.go() : setLogSheet(q.log)} style={{ padding: "12px 6px 10px", borderRadius: 12, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", fontFamily: "inherit", cursor: "pointer", display: "grid", placeItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: `var(--${q.tone}-50)`, display: "grid", placeItems: "center" }}>
                  <Ic2 n={q.ic} s={16} c={`var(--${q.tone}-700)`}/>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-2)" }}>{q.k}</div>
              </button>
            ))}
          </div>

          <div className="section-h"><span>Vitals today</span></div>
          {[
            { k: "Blood glucose", v: "118 mg/dL", t: "07:42 · in range", i: "teal", go: () => nav("glucose") },
            { k: "Blood pressure", v: "124/78", t: "yesterday · stable", i: "iris", go: () => nav("device-omron-m2") },
            { k: "Weight", v: "68 kg", t: "Tuesday", i: "info", logAs: { title: "Log weight", sub: "Morning · kg", kind: "value", placeholder: "e.g. 68.4", unit: "kg" } },
            { k: "Sleep", v: "6h 42m", t: "last night", i: "gold", logAs: { title: "Log sleep", sub: "Hours", kind: "value", placeholder: "e.g. 7.0", unit: "hours" } },
          ].map((r, i) => (
            <Row key={i} icon="heart" tone={r.i} title={`${r.k} · ${r.v}`} sub={r.t} onClick={() => r.go ? r.go() : setLogSheet(r.logAs)}/>
          ))}

          <div className="section-h"><span>Today's log</span></div>
          <Row icon="pill" tone="teal" title="Metformin 500 mg" sub="07:24 · taken" onClick={() => setLogSheet({ title: "Metformin 500 mg", sub: "Evening dose · 19:00", kind: "taken" })}/>
          <Row icon="pill" tone="iris" title="Lisinopril 10 mg" sub="Not logged today" pill={{label: "DUE", tone: "warn"}} onClick={() => setLogSheet({ title: "Lisinopril 10 mg", sub: "Morning dose · 08:00", kind: "taken" })}/>
          <Row icon="camera" tone="gold" title="Jollof rice + chicken" sub="13:40 · 68g carbs · AI scanned" onClick={() => nav("scan-result")}/>
        </>
      )}
      {sub === "Trends" && (
        <>
          <AIcard tone="lab" tag="TREND · TELECHECK AI"
            title="Your fasting glucose is trending down · 6-week view"
            body="Average fasting has dropped from 142 to 118 mg/dL over 6 weeks. Evening metformin adherence at 94% is the likely driver."
            src="Analysed: 42 readings · 6 weeks"
            actions={["See chart", "Share with Dr. Mensah"]}
            onAct={(a) => toast(a)}/>
          <div className="section-h"><span>Vitals</span></div>
          <Row icon="trend" tone="teal" title="Fasting glucose · 6-week" sub="142 → 118 mg/dL · −24" onClick={() => nav("glucose")}/>
          <Row icon="trend" tone="iris" title="Blood pressure · 6-week" sub="132/84 → 124/78" onClick={() => toast("BP chart")}/>
          <Row icon="trend" tone="info" title="Weight · 3-month" sub="71 → 68 kg · steady" onClick={() => toast("Weight chart")}/>
          <Row icon="trend" tone="gold" title="Sleep · 30-day" sub="Avg 6h 32m · target 7h" onClick={() => toast("Sleep chart")}/>
          <div className="section-h"><span>Adherence & intake</span></div>
          <Row icon="pill" tone="teal" title="Medication adherence" sub="This week · 95% · 20 of 21 doses" onClick={() => toast("Adherence detail")}/>
          <Row icon="camera" tone="iris" title="Nutrition · carbs" sub="Avg 1,820/day · lunch carb-heavy" onClick={() => toast("Nutrition detail")}/>
        </>
      )}
      {sub === "Devices" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 10px" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--fg-1)" }}>Monitoring devices</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>2 connected · 2 synced today</div>
            </div>
            <button onClick={() => setLogSheet({ kind: "add-device" })} style={{ display: "flex", gap: 4, alignItems: "center", padding: "8px 12px 8px 10px", borderRadius: 9999, background: "var(--teal-500)", color: "#fff", border: 0, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em" }}>
              <Ic2 n="plus" s={14} c="#fff" sw={2.4}/> Add
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div onClick={() => nav("device-accu-chek")} style={{ cursor: "pointer", padding: 14, borderRadius: 14, background: "linear-gradient(140deg, var(--teal-600), var(--teal-500))", color: "#fff" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, opacity: 0.85 }}>GLUCOSE · LIVE</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10, fontVariantNumeric: "tabular-nums" }}>118</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>mg/dL · 07:42</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 10 }}>Accu-Chek · 72%</div>
            </div>
            <div onClick={() => nav("device-omron-m2")} style={{ cursor: "pointer", padding: 14, borderRadius: 14, background: "linear-gradient(140deg, var(--iris-600, #5559a6), var(--iris-500))", color: "#fff" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, opacity: 0.85 }}>BP · LAST</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10, fontVariantNumeric: "tabular-nums" }}>124<span style={{ opacity: 0.5 }}>/</span>78</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>mmHg · yesterday</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 10 }}>Omron M2 · 54%</div>
            </div>
          </div>

          <div className="section-h"><span>Manage</span></div>
          <Row icon="shield" tone="teal" title="Accu-Chek Guide · glucose" sub="Last sync 07:42 · 72% battery" pill={{label:"SYNCED", tone:"ok"}} onClick={() => nav("device-accu-chek")}/>
          <Row icon="shield" tone="iris" title="Omron M2 · BP cuff" sub="Last sync yesterday · 54% battery" pill={{label:"SYNCED", tone:"ok"}} onClick={() => nav("device-omron-m2")}/>

          <div className="section-h"><span>Shop devices</span></div>
          <Row icon="shop" tone="warn" title="Continuous glucose monitor" sub="For GLP-1 program · GHS 480" onClick={() => nav("pharmacy-shop")}/>
          <Row icon="shop" tone="info" title="Smart scale · Withings Body+" sub="Weight + body comp · GHS 620" onClick={() => nav("pharmacy-shop")}/>
          <Row icon="shop" tone="teal" title="Pulse oximeter" sub="SpO₂ + pulse · GHS 180" onClick={() => nav("pharmacy-shop")}/>
        </>
      )}
      {logSheet && logSheet.kind === "add-device" && <AddDeviceSheet onClose={() => setLogSheet(null)} toast={toast}/>}
      {logSheet && logSheet.kind !== "add-device" && <LogIntakeSheet log={logSheet} onClose={() => setLogSheet(null)} toast={toast}/>}
    </>
  );
}

function CareTeam({ nav, toast }) {
  const [member, setMember] = React.useState(null);
  return (
    <>
      <div className="section-h"><span>Your care team</span></div>
      <div className="lc" onClick={() => setMember("mensah")}>
        <div className="lc-ic teal" style={{ fontWeight: 700 }}>DM</div>
        <div><div className="lc-t">Dr. Akosua Mensah</div><div className="lc-s">Primary care · since Nov 2024 · 4.9★</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
      </div>
      <div className="lc" onClick={() => setMember("adjoa")}>
        <div className="lc-ic iris" style={{ fontWeight: 700 }}>NA</div>
        <div><div className="lc-t">Nurse Adjoa Boateng</div><div className="lc-s">Diabetes coach · async · replies 2h</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
      </div>
      <div className="lc" onClick={() => setMember("pharmacy")}>
        <div className="lc-ic warn" style={{ fontWeight: 700 }}>MP</div>
        <div><div className="lc-t">Mobipharm Osu</div><div className="lc-s">Pharmacy · dispatch M–Sat</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
      </div>
      <div className="lc" onClick={() => nav("ai-ws")}>
        <div className="lc-ic" style={{ background: "var(--iris-500)", color: "#fff" }}><Ic2 n="spark" s={18} sw={2.2} c="#fff"/></div>
        <div><div className="lc-t">Telecheck AI <span className="lp ok">AVAILABLE</span></div><div className="lc-s">Interpretation only · human review required</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
      </div>
      <div className="section-h"><span>Find & add</span></div>
      <Row icon="search" tone="teal" title="Find a specialist" sub="Cardiology, endocrine, dermatology…" onClick={() => nav("doctor-search")}/>
      <Row icon="users" tone="info" title="Add a caregiver or family" sub="Delegate access with scoped consent" onClick={() => nav("me-family")}/>
      <div className="section-h"><span>Permissions</span></div>
      <div className="lc" onClick={() => nav("me")}>
        <div className="lc-ic info"><Ic2 n="lock" s={18} sw={2}/></div>
        <div><div className="lc-t">Data access</div><div className="lc-s">Labs, meds, vitals · revoke any time</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
      </div>
      <Row icon="doc" tone="gold" title="Audit log · who saw what" sub="Last 30 days · 47 accesses" onClick={() => toast("Audit log · PRD §11")}/>
      {member && <TeamSheet memberId={member} onClose={() => setMember(null)} toast={toast} nav={nav}/>}
    </>
  );
}

Object.assign(window, { HomeV2, CareV2 });
