// Patient app v2 — shared helpers (icons, topbar, subtabs, tabbar, etc)

const Ic2 = ({ n, s = 22, c = "currentColor", sw = 1.8 }) => {
  const p = {
    home:<><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></>,
    pill:<><path d="M8.5 3.5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7-7z"/><path d="m7 8 7 7"/></>,
    lab:<><path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3"/><path d="M9 3h6"/><path d="M7 14h10"/></>,
    chat:<><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4z"/></>,
    user:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></>,
    heart:<><path d="M12 20s-7-4.5-9.3-9.2A5.1 5.1 0 0 1 7 4.1 5 5 0 0 1 12 7a5 5 0 0 1 5-2.9 5.1 5.1 0 0 1 4.3 6.7C19 15.5 12 20 12 20z"/></>,
    back:<><path d="M15 6l-6 6 6 6"/></>,
    chev:<><path d="m9 6 6 6-6 6"/></>,
    close:<><path d="M18 6 6 18M6 6l12 12"/></>,
    bell:<><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V10a6 6 0 1 0-12 0v4a2 2 0 0 1-.6 1.6L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></>,
    sos:<><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.01"/></>,
    spark:<><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/></>,
    scan:<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    video:<><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
    phone:<><path d="M5 3h4l2 5-3 2a13 13 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></>,
    search:<><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
    mic:<><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
    camera:<><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></>,
    send:<><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></>,
    upload:<><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></>,
    doc:<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
    shop:<><path d="M3 7h18l-2 13H5z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></>,
    shield:<><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z"/></>,
    trend:<><path d="M3 17 10 10l4 4 7-7"/><path d="M14 7h7v7"/></>,
    dna:<><path d="M4 4s4 2 8 2 8-2 8-2M4 20s4-2 8-2 8 2 8 2M6 6c0 4 12 8 12 12M18 6c0 4-12 8-12 12"/></>,
    users:<><circle cx="9" cy="8" r="4"/><path d="M2 20v-1a6 6 0 0 1 7-6M17 20v-1a4 4 0 0 0-4-4M15 11a3 3 0 1 0 0-6"/></>,
    gear:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    help:<><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4M12 17h.01"/></>,
    card:<><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></>,
    globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    check:<><path d="m5 12 5 5L20 7"/></>,
    more:<><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></>,
    filter:<><path d="M3 5h18M6 12h12M10 19h4"/></>,
    star:<><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></>,
    mute:<><path d="M3 3l18 18M17 11a5 5 0 0 1-8 4M12 18v3M9 4.5a3 3 0 0 1 6 1.5v4"/></>,
    camoff:<><path d="m3 3 18 18M18 10V8a1 1 0 0 0-1-1h-2m-4 0H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10"/><path d="m18 11 4-2v8l-4-2"/></>,
    flag:<><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></>,
    award:<><circle cx="12" cy="9" r="6"/><path d="m8 14-2 7 6-3 6 3-2-7"/></>,
    lock:<><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    eye:<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    bolt:<><path d="M13 3 4 14h7l-1 7 9-11h-7z"/></>,
  }[n];
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
};

const SB2 = () => (
  <div className="sb">
    <span>9:41</span>
    <span className="r">
      <svg width="18" height="10" viewBox="0 0 18 10" fill="currentColor"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="5" y="4" width="3" height="6" rx="0.5"/><rect x="10" y="2" width="3" height="8" rx="0.5"/><rect x="15" y="0" width="3" height="10" rx="0.5"/></svg>
      <svg width="24" height="10" viewBox="0 0 24 10" fill="none"><rect x="1" y="1" width="18" height="8" rx="2" stroke="currentColor"/><rect x="2.5" y="2.5" width="14" height="5" rx="1" fill="currentColor"/><rect x="20" y="3.5" width="1.5" height="3" fill="currentColor"/></svg>
    </span>
  </div>
);

// Persistent top chrome — global controls
// Persistent "Viewing: [delegate]" banner — renders only when delegate ≠ self (PRD §15)
const DELEGATE_META = {
  "k":     { name: "Kofi Mensah (dad)",                av: "KO" },
  "abena": { name: "Abena Mensah (daughter, 8)",        av: "AB" },
};
const DelegateBanner = ({ delegate, onTap }) => {
  if (delegate === "me") return null;
  const m = DELEGATE_META[delegate] || { name: "delegated account", av: "?" };
  return (
    <div className="del-banner" onClick={onTap} role="button">
      <div className="del-av">{m.av}</div>
      <div className="del-t">
        <span className="del-lbl">VIEWING</span>
        <span className="del-n">{m.name}</span>
      </div>
      <div className="del-s">Actions audit to their record · tap to switch</div>
      <Ic2 n="chev" s={16} c="#fff"/>
    </div>
  );
};

const TopBar = ({ delegate, onAccount, onNotifs, onEmergency, onAI, notifCount = 3 }) => (
  <div className="topbar">
    <div className="tb-brand" onClick={onAccount}>
      <svg className="tb-logo" viewBox="0 0 24 24" aria-label="Telecheck">
        <circle cx="12" cy="12" r="10" fill="none" stroke="var(--teal-500)" strokeWidth="1.6"/>
        <path d="M6.5 12.5 L9 12.5 L10.3 9.5 L12.8 15.5 L14 12 L17.5 12" stroke="var(--teal-500)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <span className="tb-wm">telecheck</span>
      {delegate === "k" && <span className="tb-del">· Kofi</span>}
      {delegate === "abena" && <span className="tb-del">· Abena</span>}
    </div>
    <div className="tb-ic" onClick={onAI}><Ic2 n="spark" s={17} sw={2} c="var(--iris-600)"/></div>
    <div className="tb-ic" onClick={onNotifs}>
      <Ic2 n="bell" s={17} sw={2}/>
      {notifCount > 0 && <div className="tb-badge">{notifCount}</div>}
    </div>
    <div className="tb-ic em" onClick={onEmergency}><Ic2 n="sos" s={15} sw={2.4} c="#fff"/></div>
    <div className="tb-ctx-av" onClick={onAccount} title={delegate === "k" ? "Viewing Kofi" : delegate === "abena" ? "Viewing Abena" : "Ama Mensah"}>{delegate === "k" ? "KO" : delegate === "abena" ? "AB" : "AM"}</div>
  </div>
);

const SubTabs = ({ tabs, active, onPick, cls = "" }) => (
  <div className={`subtabs ${cls}`}>
    {tabs.map(t => <div key={t} className={`subtab ${active === t ? "on" : ""}`} onClick={() => onPick(t)}>{t}</div>)}
  </div>
);

const BigH = ({ title, sub, right }) => (
  <div className="big-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
    <div style={{ flex: 1 }}>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {right}
  </div>
);

const Sub2 = ({ title, onBack, right, dark = false }) => (
  <div className="sub" style={dark ? { background: "#1b1d2b", borderBottomColor: "rgba(255,255,255,0.08)", color: "#fff" } : undefined}>
    <button className="ic-btn" onClick={onBack} style={dark ? { background: "rgba(255,255,255,0.08)", color: "#fff", border: 0 } : undefined}><Ic2 n="back" s={18} c={dark ? "#fff" : undefined}/></button>
    <div className="sub-t" style={dark ? { color: "#fff" } : undefined}>{title}</div>
    {right || <div style={{ width: 36 }}/>}
  </div>
);

// Bottom tabbar v2
const TabBar2 = ({ active, onTab, care = 0 }) => {
  const t = (key, n, l) => (
    <div className={`tb ${active === key ? "on" : ""}`} onClick={() => onTab(key)}>
      <Ic2 n={n} s={22} sw={active === key ? 2.2 : 1.7}/>
      {l}
      {key === "care" && care > 0 && <div className="badge">{care}</div>}
    </div>
  );
  return (
    <div className="tabbar">
      {t("home", "home", "Home")}
      {t("care", "heart", "Care")}
      {t("pharmacy", "pill", "Pharmacy")}
      {t("labs", "lab", "Labs")}
      {t("me", "user", "Me")}
    </div>
  );
};

// Small reusable bits
const AIcard = ({ tone = "lab", tag, title, body, src, actions = [], onAct = () => {} }) => (
  <div className={`ai ${tone}`}>
    <div className="ai-head"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/></svg> {tag}</div>
    <div className="ai-title">{title}</div>
    <div className="ai-body">{body}</div>
    {src && <div className="ai-src">{src}</div>}
    {actions.length > 0 && (
      <div className="ai-acts">
        {actions.map((a, i) => <button key={i} className={i === 0 ? "ai-p" : "ai-s"} onClick={() => onAct(a, i)}>{a}</button>)}
      </div>
    )}
  </div>
);

const Row = ({ icon, tone = "teal", title, sub, pill, onClick }) => (
  <div className="lc" onClick={onClick}>
    <div className={`lc-ic ${tone}`}><Ic2 n={icon} s={20} sw={2}/></div>
    <div><div className="lc-t">{title} {pill && <span className={`lp ${pill.tone || "warn"}`}>{pill.label}</span>}</div>{sub && <div className="lc-s">{sub}</div>}</div>
    <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
  </div>
);

const Donut2 = ({ label, value, unit, pct, color, target, delta }) => {
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

const Empty = ({ icon = "doc", title, sub }) => (
  <div className="empty">
    <div className="ic"><Ic2 n={icon} s={26}/></div>
    <div className="t">{title}</div>
    {sub && <div className="s">{sub}</div>}
  </div>
);

Object.assign(window, { Ic2, SB2, TopBar, SubTabs, BigH, Sub2, TabBar2, AIcard, Row, Donut2, Empty });
