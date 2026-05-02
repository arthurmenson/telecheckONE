// Patient app — interactive mock (shared helpers only; no hook aliases here)

// ── Icons ─────────────────────────────────────────
const Ic = ({ n, s = 22, c = "currentColor", sw = 1.8 }) => {
  const p = {
    home:   <><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></>,
    pill:   <><path d="M8.5 3.5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7-7z"/><path d="m7 8 7 7"/></>,
    heart:  <><path d="M12 20s-7-4.5-9.3-9.2A5.1 5.1 0 0 1 7 4.1 5 5 0 0 1 12 7a5 5 0 0 1 5-2.9 5.1 5.1 0 0 1 4.3 6.7C19 15.5 12 20 12 20z"/></>,
    chat:   <><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4z"/></>,
    user:   <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></>,
    plus:   <><path d="M12 5v14M5 12h14"/></>,
    back:   <><path d="M15 6l-6 6 6 6"/></>,
    chev:   <><path d="m9 6 6 6-6 6"/></>,
    close:  <><path d="M18 6 6 18M6 6l12 12"/></>,
    bell:   <><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V10a6 6 0 1 0-12 0v4a2 2 0 0 1-.6 1.6L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></>,
    clock:  <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    lab:    <><path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3"/><path d="M9 3h6"/><path d="M7 14h10"/></>,
    camera: <><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></>,
    lock:   <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    check:  <><path d="m5 12 5 5L20 7"/></>,
    phone:  <><path d="M5 3h4l2 5-3 2a13 13 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
    sos:    <><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.01"/></>,
    trend:  <><path d="M3 17 10 10l4 4 7-7"/><path d="M14 7h7v7"/></>,
    doc:    <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
    spark:  <><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/></>,
    send:   <><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></>,
    scan:   <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></>,
    more:   <><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></>,
  }[n];
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
};

const Spark = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/>
  </svg>
);

// ── Status Bar / Home Indicator ────────────────────
const SB = () => (
  <div className="sb">
    <span>9:41</span>
    <span className="r">
      <svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="5" y="4" width="3" height="6" rx="0.5"/><rect x="10" y="2" width="3" height="8" rx="0.5"/><rect x="15" y="0" width="3" height="10" rx="0.5"/></svg>
      <svg width="24" height="10" viewBox="0 0 24 10" fill="none"><rect x="1" y="1" width="18" height="8" rx="2" stroke="currentColor"/><rect x="2.5" y="2.5" width="14" height="5" rx="1" fill="currentColor"/><rect x="20" y="3.5" width="1.5" height="3" fill="currentColor"/></svg>
    </span>
  </div>
);

// ── Donut ─────────────────────────────────────────
const Donut = ({ label, value, unit, pct, color, target, delta }) => {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="donut">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeOpacity="0.15" strokeWidth="7"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct/100)} transform="rotate(-90 36 36)"/>
        <text x="36" y="39" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--fg-1)" fontFamily="var(--font-sans)">{value}</text>
        <text x="36" y="51" textAnchor="middle" fontSize="8" fill="var(--fg-3)" fontFamily="var(--font-sans)">{unit}</text>
      </svg>
      <div className="donut-meta">
        <div className="donut-l">{label}</div>
        <div className="donut-t" style={{ color }}>{delta}</div>
        <div className="donut-r">Target {target}</div>
      </div>
    </div>
  );
};

// ── AI card ───────────────────────────────────────
const AI = ({ tone = "lab", tag, title, body, src, actions = [], onAct = () => {} }) => (
  <div className={`ai ${tone}`}>
    <div className="ai-head"><Spark/> {tag}</div>
    <div className="ai-title">{title}</div>
    <div className="ai-body">{body}</div>
    {src && <div className="ai-src">{src}</div>}
    {actions.length > 0 && (
      <div className="ai-acts">
        {actions.map((a, i) => (
          <button key={i} className={i === 0 ? "ai-p" : "ai-s"} onClick={() => onAct(a, i)}>{a}</button>
        ))}
      </div>
    )}
  </div>
);

// ── Sub header ────────────────────────────────────
const Sub = ({ title, onBack, right }) => (
  <div className="sub">
    <button className="ic-btn" onClick={onBack}><Ic n="back" s={18}/></button>
    <div className="sub-t">{title}</div>
    {right || <div style={{ width: 36 }}/>}
  </div>
);

// ── Tabbar ────────────────────────────────────────
const TabBar = ({ active, onTab }) => (
  <div className="tabbar">
    <div className={`tb ${active === "home" ? "on" : ""}`} onClick={() => onTab("home")}><Ic n="home" s={22} sw={active === "home" ? 2.2 : 1.7}/>Home</div>
    <div className={`tb ${active === "meds" ? "on" : ""}`} onClick={() => onTab("meds")}><Ic n="pill" s={22} sw={active === "meds" ? 2.2 : 1.7}/>Meds</div>
    <div className="tb" style={{ visibility: "hidden" }}>—</div>
    <div className={`tb ${active === "health" ? "on" : ""}`} onClick={() => onTab("health")}><Ic n="heart" s={22} sw={active === "health" ? 2.2 : 1.7}/>Health</div>
    <div className={`tb ${active === "care" ? "on" : ""}`} onClick={() => onTab("care")}><Ic n="chat" s={22} sw={active === "care" ? 2.2 : 1.7}/>Care</div>
    <div className="fab" onClick={() => onTab("consult-start")}><Ic n="plus" s={24} sw={2.4} c="#fff"/></div>
  </div>
);

window.Ic = Ic;
window.Spark = Spark;
window.SB = SB;
window.Donut = Donut;
window.AI = AI;
window.Sub = Sub;
window.TabBar = TabBar;
