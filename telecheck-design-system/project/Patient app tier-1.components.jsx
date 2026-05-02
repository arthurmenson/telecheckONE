/* Patient app — Tier 1 components */

const { useState, useEffect, useRef } = React;

// ── Icons ─────────────────────────────────────────────
const Ic = ({ name, size = 20, stroke = 1.5 }) => {
  const p = {
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    pill: <><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></>,
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    chev: <path d="m9 18 6-6-6-6"/>,
    chevL: <path d="m15 18-6-6 6-6"/>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    video: <><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></>,
    flask: <><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    spark: <><path d="M9.94 14.34 12 22l2.06-7.66L22 12l-7.94-2.06L12 2l-2.06 7.94L2 12l7.94 2.34z"/></>,
    ai: <><path d="M9.94 14.34 12 22l2.06-7.66L22 12l-7.94-2.06L12 2l-2.06 7.94L2 12l7.94 2.34z"/><circle cx="19" cy="5" r="1.2"/></>,
    scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>,
    truck: <><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    mapPin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    swap: <><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
    lightbulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 0 0 18 8a6 6 0 0 0-12 0 5 5 0 0 0 1.5 3.5c.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    mic: <><rect width="6" height="11" x="9" y="2" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>,
    trend: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>
  );
};

// ── Statusbar + island + home indicator ─────────────
const StatusBar = () => (
  <div className="statusbar">
    <span>9:41</span>
    <div className="r">
      <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="currentColor"/></svg>
      <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 3C9.5 3 11.4 3.8 12.7 5.1L13.6 4.2C12 2.6 9.9 1.6 7.5 1.6S3 2.6 1.4 4.2l.9.9C3.6 3.8 5.5 3 7.5 3Z" fill="currentColor"/><path d="M7.5 6.3c1.2 0 2.3.4 3.1 1.2l.9-.9c-1.1-1.1-2.5-1.7-4-1.7s-2.9.6-4 1.7l.9.9c.8-.8 1.9-1.2 3.1-1.2Z" fill="currentColor"/><circle cx="7.5" cy="9.5" r="1.2" fill="currentColor"/></svg>
      <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0.5" y="0.5" width="20" height="11" rx="3" stroke="currentColor" strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor"/><path d="M22 4v4c.7-.2 1.2-1 1.2-2s-.5-1.8-1.2-2Z" fill="currentColor" fillOpacity="0.4"/></svg>
    </div>
  </div>
);

// ── Tab bar ────────────────────────────────────────
const TabBar = ({ active, onNav }) => (
  <div className="tabbar">
    <div className={`tab ${active==='home'?'active':''}`} onClick={()=>onNav('home')}><Ic name="home" size={22}/><span>Home</span></div>
    <div className={`tab ${active==='meds'?'active':''}`} onClick={()=>onNav('meds')}><Ic name="pill" size={22}/><span>Meds</span></div>
    <div className="tab" style={{opacity:0, pointerEvents:'none'}}><span>.</span></div>
    <div className={`tab ${active==='health'?'active':''}`} onClick={()=>onNav('health')}><Ic name="activity" size={22}/><span>Health</span></div>
    <div className={`tab ${active==='me'?'active':''}`} onClick={()=>onNav('me')}><Ic name="user" size={22}/><span>Account</span></div>
    <div className="tab-fab" onClick={()=>onNav('consult')}><Ic name="plus" size={22} stroke={2.2}/></div>
  </div>
);

// ── Back header ────────────────────────────────────
const SubHdr = ({ title, onBack, right }) => (
  <div className="subhdr">
    <div className="back-btn" onClick={onBack}><Ic name="chevL" size={18} stroke={1.8}/></div>
    <div className="subhdr-t">{title}</div>
    <div className="subhdr-r">{right}</div>
  </div>
);

// ── AI pocket card ──────────────────────────────────
const AIPocket = ({ kind, conf, title, body, source, actions = ['Ask a question', 'How?'] }) => (
  <div className="ai-pocket">
    <div className="ai-head">
      <span className="ai-badge"><Ic name="ai" size={10}/> Telecheck AI</span>
      {kind && <span className="ai-conf">{kind}</span>}
    </div>
    <div className="ai-t">{title}</div>
    <div className="ai-b">{body}</div>
    {source && <div className="ai-src">{source}</div>}
    <div className="ai-btns">
      <button className="ai-pri">{actions[0]}</button>
      <button className="ai-ghost">{actions[1]}</button>
    </div>
  </div>
);

// ── Metric card with tiny sparkline ─────────────────
const SparkSvg = ({ points, color }) => {
  const w=120, h=18;
  const vals = points;
  const min = Math.min(...vals), max = Math.max(...vals);
  const step = w / (vals.length - 1);
  const norm = v => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const d = vals.map((v,i) => `${i===0?'M':'L'}${(i*step).toFixed(1)} ${norm(v).toFixed(1)}`).join(' ');
  return <svg className="m-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
};
const Metric = ({ k, v, u, trend, trendDir, spark, color }) => (
  <div className="m-card">
    <div className="m-k">{k}</div>
    <div className="m-v">{v}{u && <span className="m-u">{u}</span>}</div>
    <SparkSvg points={spark} color={color}/>
    <div className="m-t">
      <span className={trendDir==='up'?'t-up':trendDir==='dn'?'t-dn':''}>
        {trendDir==='up'?'▲':trendDir==='dn'?'▼':'—'} {trend}
      </span>
    </div>
  </div>
);

// ── List card ──────────────────────────────────────
const ListCard = ({ icon, iconTone='teal', title, sub, pill, onClick }) => (
  <div className="l-card" onClick={onClick}>
    <div className={`l-ic ${iconTone}`}><Ic name={icon} size={20}/></div>
    <div>
      <div className="l-t">{title}{pill && <span className={`l-pill ${pill.tone}`}>{pill.text}</span>}</div>
      <div className="l-s">{sub}</div>
    </div>
    <div className="l-chev"><Ic name="chev" size={16} stroke={1.8}/></div>
  </div>
);

// Ring progress (today's focus)
const Ring = ({ pct = 65, color='var(--primary)' }) => {
  const r=22, c=2*Math.PI*r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--n-100)" strokeWidth="5"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} transform="rotate(-90 28 28)"/>
      <text x="28" y="32" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg-1)">{pct}%</text>
    </svg>
  );
};

Object.assign(window, { Ic, StatusBar, TabBar, SubHdr, AIPocket, Metric, ListCard, Ring, SparkSvg });
