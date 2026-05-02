// Patient app v3 — minimalist tier-1

const { useState: uSV3, useEffect: uEV3, useMemo: uMV3 } = React;

// ── Icons ─────────────────────────────────────────
const I = ({ n, s = 20, c = "currentColor", sw = 1.6 }) => {
  const p = {
    home:    <><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></>,
    heart:   <><path d="M12 20s-7-4.5-9.3-9.2A5.1 5.1 0 0 1 7 4.1 5 5 0 0 1 12 7a5 5 0 0 1 5-2.9 5.1 5.1 0 0 1 4.3 6.7C19 15.5 12 20 12 20z"/></>,
    lab:     <><path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3"/><path d="M9 3h6M7 14h10"/></>,
    user:    <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></>,
    spark:   <><path d="M12 3c.3 3.6 2 5.5 5.5 6-3.5.5-5.2 2.4-5.5 6-.3-3.6-2-5.5-5.5-6 3.5-.5 5.2-2.4 5.5-6z"/></>,
    bell:    <><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V10a6 6 0 1 0-12 0v4a2 2 0 0 1-.6 1.6L4 17h5"/><path d="M9 17a3 3 0 0 0 6 0"/></>,
    chev:    <><path d="m9 6 6 6-6 6"/></>,
    arrow:   <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    pill:    <><path d="M8.5 3.5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7-7z"/><path d="m7 8 7 7"/></>,
    clock:   <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    scan:    <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></>,
    doc:     <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
    chat:    <><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4z"/></>,
    back:    <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
    plus:    <><path d="M12 5v14M5 12h14"/></>,
    shop:    <><path d="M3 7h18l-1.5 11a2 2 0 0 1-2 1.8H6.5a2 2 0 0 1-2-1.8zM8 7a4 4 0 0 1 8 0"/></>,
    shield:  <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></>,
    truck:   <><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
    search:  <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    edit:    <><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    phone:   <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></>,
    lock:    <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    bolt:    <><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></>,
    check:   <><path d="m5 12 5 5L20 7"/></>,
    x:       <><path d="M6 6l12 12M18 6 6 18"/></>,
    video:   <><rect x="2" y="6" width="15" height="12" rx="2"/><path d="m22 8-5 4 5 4z"/></>,
    rx:      <><path d="M6 3h5a3 3 0 0 1 0 6H6V3zM6 9v12M6 13h4l6 8M14 15l7-7"/></>,
    form:    <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h4"/></>,
  }[n];
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
};

// ── Sparkline ─────────────────────────────────────
const Spark = ({ data, color = "var(--teal)", fill = true }) => {
  const w = 100, h = 32, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (v - min) / range) * (h - 2 * pad);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const lastX = pts[pts.length - 1][0], lastY = pts[pts.length - 1][1];
  const area = fill ? `${d} L ${lastX} ${h - pad} L ${pad} ${h - pad} Z` : "";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 32 }}>
      {fill && <path d={area} fill={color} fillOpacity="0.08"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastX} cy={lastY} r="2.5" fill={color}/>
    </svg>
  );
};

// ── Donut ─────────────────────────────────────────
const Donut = ({ pct, color = "var(--teal)", size = 120, stroke = 9, label, value, unit }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 - 2} textAnchor="middle" fontFamily="var(--font-serif)" fontSize="26" fontWeight="400" fill="var(--ink-1)" letterSpacing="-1">{value}</text>
      <text x={size/2} y={size/2 + 18} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="10" fill="var(--ink-3)" letterSpacing="0.5">{unit}</text>
    </svg>
  );
};

// ── Status bar + home indicator ───────────────────
const SB = () => (
  <div className="sb">
    <span>9:41</span>
    <span className="r">
      <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" width="3" height="10" rx="0.5"/></svg>
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="17" height="9" rx="2" stroke="currentColor"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="18.5" y="3" width="1.5" height="4" fill="currentColor"/></svg>
    </span>
  </div>
);

// ── Top bar ───────────────────────────────────────
const TopBar = ({ onAI, unread = true }) => (
  <div className="tb">
    <div className="av">AM</div>
    <div className="actions">
      <button className="ico-btn" onClick={onAI} aria-label="AI"><I n="spark" s={20} sw={1.8}/></button>
      <button className="ico-btn" aria-label="Notifications"><I n="bell" s={20} sw={1.6}/>{unread && <span className="dot"/>}</button>
    </div>
  </div>
);

// ── Bottom tabs ───────────────────────────────────
const Tabs = ({ active, onTab }) => (
  <div className="tabs">
    {[
      ["home","Home","home"],
      ["care","Care","heart"],
      ["labs","Labs","lab"],
      ["pharmacy","Pharmacy","pill"],
      ["you","You","user"],
    ].map(([k, l, ic]) => (
      <div key={k} className={`tab ${active === k ? "on" : ""}`} onClick={() => onTab(k)}>
        <span className="glyph"><I n={ic} s={20} sw={active === k ? 1.9 : 1.5}/></span>
        {l}
      </div>
    ))}
  </div>
);

// ── Sub-tabs (segmented) ──────────────────────────
const SubTabs = ({ items, active, onPick }) => (
  <div className="subtabs">
    {items.map(x => (
      <button key={x} className={active === x ? "on" : ""} onClick={() => onPick(x)}>{x}</button>
    ))}
  </div>
);

// ── Page header (with back) ───────────────────────
const PageHdr = ({ title, sub, onBack, right }) => (
  <div className="phdr">
    {onBack && <button className="ico-btn" onClick={onBack} aria-label="Back"><I n="back" s={18} sw={1.8}/></button>}
    <div className="phdr-body">
      <div className="phdr-t">{title}</div>
      {sub && <div className="phdr-s">{sub}</div>}
    </div>
    {right}
  </div>
);

Object.assign(window, { I, Spark, Donut, SB, TopBar, Tabs, SubTabs, PageHdr });
