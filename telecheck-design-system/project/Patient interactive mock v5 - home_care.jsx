// v2 — HOME + CARE screens
const { useState: uSA, useEffect: uEA, useRef: uRA } = React;

// ── Swipeable vitals carousel (Latest / Trends / Today) ──
function Donut({ label, value, unit, pct, color, delta, deltaCls, target, sub }) {
  const r = 24, c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  return (
    <div className="gl">
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

function GlanceCarousel() {
  const trackRef = uRA(null);
  const [page, setPage] = uSA(0);
  const labels = ["At a glance", "Lipid panel · last draw", "Liver & kidney · 6 mo"];
  const hints = ["swipe for trends →", "← latest · more →", "← previous"];

  const onScroll = () => {
    const el = trackRef.current; if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    if (p !== page) setPage(p);
  };
  const go = (i) => {
    const el = trackRef.current; if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="gl-carousel">
      <div className="gl-label">
        <span>{labels[page]}</span>
        <span className="hint">· {hints[page]}</span>
      </div>
      <div className="gl-track" ref={trackRef} onScroll={onScroll}>
        {/* PAGE 1 — Latest (4 tiles) */}
        <div className="gl-page grid">
          <Donut label="HbA1c"             value={7.8}  unit="%"     pct={62} color="#c28320" delta="+0.2 ▲"  deltaCls="warn" target="Target ≤7.0"/>
          <Donut label="Fasting" sub="glucose" value={132} unit="mg/dL" pct={82} color="#d69339" delta="High"     deltaCls="bad"  target="Target 70–100"/>
          <Donut label="eGFR"              value={94}   unit="mL/min" pct={94} color="#2a8a4a" delta="Normal"   deltaCls="ok"   target="Target ≥60"/>
          <Donut label="Haemoglobin"       value={11.2} unit="g/dL"  pct={70} color="#2b6cb0" delta="Low"      deltaCls="info" target="Target 12–16"/>
        </div>

        {/* PAGE 2 — Lipid panel: Total / LDL / HDL / Triglycerides with target ranges */}
        <div className="gl-page">
          <div className="lab-card full tint-amber">
            <div className="lab-head">
              <div>
                <div className="lab-k">Lipid panel · 4 Apr</div>
                <div className="lab-v">
                  <span className="num" style={{color:"#b8852e"}}>LDL 142</span>
                  <span className="u">mg/dL</span>
                  <span className="lab-chip warn" style={{marginLeft:4}}>above target</span>
                </div>
              </div>
              <div className="lab-legend">
                <span className="sw band"/><span>target</span>
              </div>
            </div>

            {/* Horizontal bars — each metric in its own row with target band */}
            <div className="lab-chart">
              <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lip-high" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#eec089" stopOpacity="0.75"/>
                    <stop offset="100%" stopColor="#f4d4a8" stopOpacity="0.75"/>
                  </linearGradient>
                  <linearGradient id="lip-ok" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#a8cdb5" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#c4dcc8" stopOpacity="0.7"/>
                  </linearGradient>
                </defs>
                {/* Row layout: y 8, 28, 48, 68; row height 12 */}
                {/* TOTAL 220 mg/dL · target <200 · scale 0-300 → x 0-300 */}
                <text x="0" y="6" fontSize="7" fontWeight="600" fill="#a0a0a0" letterSpacing="0.5">TOTAL</text>
                <rect x="0" y="9" width="300" height="10" rx="5" fill="#00000008"/>
                <rect x="0" y="9" width="200" height="10" rx="5" fill="#7ab890" fillOpacity="0.10"/>
                <rect x="0" y="9" width="220" height="10" rx="5" fill="url(#lip-high)"/>
                <line x1="200" y1="6" x2="200" y2="22" stroke="#7ab890" strokeDasharray="2 2" strokeWidth="0.8"/>
                <text x="295" y="17" fontSize="7" fontWeight="600" fill="#a87a2a" textAnchor="end">220</text>

                {/* LDL 142 · target <100 · scale 0-200 → * 1.5 */}
                <text x="0" y="26" fontSize="7" fontWeight="600" fill="#a0a0a0" letterSpacing="0.5">LDL</text>
                <rect x="0" y="29" width="300" height="10" rx="5" fill="#00000008"/>
                <rect x="0" y="29" width="150" height="10" rx="5" fill="#7ab890" fillOpacity="0.10"/>
                <rect x="0" y="29" width="213" height="10" rx="5" fill="url(#lip-high)"/>
                <line x1="150" y1="26" x2="150" y2="42" stroke="#7ab890" strokeDasharray="2 2" strokeWidth="0.8"/>
                <text x="295" y="37" fontSize="7" fontWeight="600" fill="#a87a2a" textAnchor="end">142</text>

                {/* HDL 48 · target >40 · scale 0-100 → *3 */}
                <text x="0" y="46" fontSize="7" fontWeight="600" fill="#a0a0a0" letterSpacing="0.5">HDL</text>
                <rect x="0" y="49" width="300" height="10" rx="5" fill="#00000008"/>
                <rect x="120" y="49" width="180" height="10" rx="5" fill="#7ab890" fillOpacity="0.10"/>
                <rect x="0" y="49" width="144" height="10" rx="5" fill="url(#lip-ok)"/>
                <line x1="120" y1="46" x2="120" y2="62" stroke="#7ab890" strokeDasharray="2 2" strokeWidth="0.8"/>
                <text x="295" y="57" fontSize="7" fontWeight="600" fill="#6a9d7e" textAnchor="end">48</text>

                {/* TRIG 168 · target <150 · scale 0-250 → *1.2 */}
                <text x="0" y="66" fontSize="7" fontWeight="600" fill="#a0a0a0" letterSpacing="0.5">TRIG</text>
                <rect x="0" y="69" width="300" height="10" rx="5" fill="#00000008"/>
                <rect x="0" y="69" width="180" height="10" rx="5" fill="#7ab890" fillOpacity="0.10"/>
                <rect x="0" y="69" width="202" height="10" rx="5" fill="url(#lip-high)"/>
                <line x1="180" y1="66" x2="180" y2="82" stroke="#7ab890" strokeDasharray="2 2" strokeWidth="0.8"/>
                <text x="295" y="77" fontSize="7" fontWeight="600" fill="#a87a2a" textAnchor="end">168</text>
              </svg>
            </div>
            <div className="lab-foot">
              <div><b>2</b> above target</div>
              <div>HDL <b className="lab-delta dn">↑ +3</b></div>
              <div>next draw · <b>Jul</b></div>
            </div>
          </div>
        </div>

        {/* PAGE 3 — Liver (ALT/AST) + Kidney (Creatinine) */}
        <div className="gl-page">
          <div className="lab-row" style={{"--n": 2}}>
            {/* Liver: ALT + AST combined */}
            <div className="lab-card tint-amber">
              <div className="lab-head">
                <div>
                  <div className="lab-k">Liver · ALT/AST</div>
                  <div className="lab-v">
                    <span className="num" style={{color:"#8a5a1f"}}>28</span>
                    <span className="u">U/L</span>
                  </div>
                </div>
                <span className="lab-chip ok">normal</span>
              </div>
              <div className="lab-chart">
                <svg viewBox="0 0 120 60" preserveAspectRatio="none">
                  {/* upper limit band: y 0-18 is >45 U/L (high) — keep below */}
                  <rect x="0" y="30" width="120" height="30" fill="#2a8a4a" opacity="0.08"/>
                  <line x1="0" y1="30" x2="120" y2="30" stroke="#2a8a4a" strokeDasharray="2 3" strokeWidth="0.7" opacity="0.5"/>
                  {/* ALT: 24, 26, 30, 28, 27, 28 — scale 0-60 → y 60-0 */}
                  <path d="M0,36 L20,34 L40,30 L60,32 L80,33 L100,32 L120,32"
                        fill="none" stroke="#c28320" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  {[[0,36],[20,34],[40,30],[60,32],[80,33],[100,32],[120,32]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r="1.5" fill="#c28320"/>
                  ))}
                  {/* AST: 22, 23, 25, 24, 23, 24 */}
                  <path d="M0,38 L20,37 L40,35 L60,36 L80,37 L100,36 L120,36"
                        fill="none" stroke="#e0a85a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  {[[0,38],[20,37],[40,35],[60,36],[80,37],[100,36],[120,36]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r="1.3" fill="#e0a85a"/>
                  ))}
                  <circle cx="120" cy="32" r="6" fill="#c28320" opacity="0.18"/>
                  <circle cx="120" cy="32" r="2.6" fill="#c28320"/>
                </svg>
              </div>
              <div className="lab-axis">
                <span>Oct</span><span>Jan</span><span>Mar</span>
              </div>
              <div className="lab-foot">
                <div><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#c28320",marginRight:3}}/>ALT 28</div>
                <div><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#e0a85a",marginRight:3}}/>AST 24</div>
              </div>
            </div>

            {/* Kidney: Creatinine */}
            <div className="lab-card tint-green">
              <div className="lab-head">
                <div>
                  <div className="lab-k">Kidney · Creatinine</div>
                  <div className="lab-v">
                    <span className="num" style={{color:"#2a8a4a"}}>0.9</span>
                    <span className="u">mg/dL</span>
                  </div>
                </div>
                <span className="lab-delta dn">-0.1</span>
              </div>
              <div className="lab-chart">
                <svg viewBox="0 0 120 60" preserveAspectRatio="none">
                  {/* target 0.6-1.2 mg/dL mapped to 0-2.0 scale → y 60→0 */}
                  <rect x="0" y="18" width="120" height="24" fill="#2a8a4a" opacity="0.08"/>
                  <line x1="0" y1="18" x2="120" y2="18" stroke="#2a8a4a" strokeDasharray="2 3" strokeWidth="0.7" opacity="0.5"/>
                  <line x1="0" y1="42" x2="120" y2="42" stroke="#2a8a4a" strokeDasharray="2 3" strokeWidth="0.7" opacity="0.5"/>
                  {/* values: 1.0, 1.0, 1.1, 1.0, 0.9, 0.9 */}
                  <defs>
                    <linearGradient id="kid-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2a8a4a" stopOpacity="0.22"/>
                      <stop offset="100%" stopColor="#2a8a4a" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L24,30 L48,27 L72,30 L96,33 L120,33 L120,60 L0,60 Z" fill="url(#kid-fill)"/>
                  <path d="M0,30 L24,30 L48,27 L72,30 L96,33 L120,33"
                        fill="none" stroke="#2a8a4a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  {[[0,30],[24,30],[48,27],[72,30],[96,33],[120,33]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" stroke="#2a8a4a" strokeWidth="1.1"/>
                  ))}
                  <circle cx="120" cy="33" r="6" fill="#2a8a4a" opacity="0.18"/>
                  <circle cx="120" cy="33" r="2.6" fill="#2a8a4a"/>
                </svg>
              </div>
              <div className="lab-axis">
                <span>Oct</span><span>Jan</span><span>Mar</span>
              </div>
              <div className="lab-foot">
                <div>target <b>0.6–1.2</b></div>
                <div>eGFR <b>94</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gl-dots">
        {[0,1,2].map(i => (
          <div key={i} className={`gl-dot ${page === i ? "on" : ""}`} onClick={() => go(i)}/>
        ))}
      </div>
    </div>
  );
}

// ────────── HOME ──────────
function HomeV2({ nav, toast, openAccount, openAI, openNotifs, openEmergency, delegate, openFAB }) {
  const kofi = delegate === "k";
  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI} notifCount={3}/>
      <div className="scroll">
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
          <GlanceCarousel/>

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
            <div className="td" onClick={() => toast("Marked taken · 19:00")}>
              <div className="td-ic teal"><Ic2 n="pill" s={18} sw={2}/></div>
              <div style={{flex:1, minWidth:0}}>
                <div className="td-t">Evening metformin</div>
                <div className="td-s">19:00</div>
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

          {/* FOOTER row — quiet, secondary */}
          <div className="home-foot">
            <div className="hf" onClick={() => nav("pharmacy-rx")}>
              <div className="hf-k">Pharmacy</div>
              <div className="hf-t">1 in review</div>
              <div className="hf-s">Metformin · ETA 2h</div>
            </div>
            <div className="hf" onClick={() => nav("me-community")}>
              <div className="hf-k">Community</div>
              <div className="hf-t">Thu · Q&amp;A</div>
              <div className="hf-s">Type-2 · 18:00</div>
            </div>
          </div>
        </div>
      </div>
      <TabBar2 active="home" onTab={nav} care={2}/>
    </div>
  );
}

// ────────── CARE (redesigned for engagement) ──────────
function CareV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI, sub = "Feed", setSub, trackSub, setTrackSub }) {
  const tabs = ["Feed", "Visits", "Team"];
  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">
        {/* Personal hero — replaces generic "Care" title */}
        <div className="care-hero">
          <div className="care-date">Wednesday · 23 Apr</div>
          <div className="care-greeting">Good morning, <em>Ama.</em></div>
          <div className="care-status">Dr. Mensah is ready at 10:30 · 3 things to do today</div>

          {/* Care team strip — visible, human, tappable */}
          <div className="care-team-strip">
            <div className="care-team-label">Your team</div>
            <div className="care-team-row">
              {[
                { id: "dr-mensah",   av: "DM", color: "var(--teal-500)",  name: "Dr. Mensah",   badge: 1,  online: true  },
                { id: "nurse-adjoa", av: "NA", color: "var(--iris-500)",  name: "Nurse Adjoa",  badge: 0,  online: false },
                { id: "pharmacy",    av: "MP", color: "var(--gold-500)",  name: "Mobipharm",    badge: 0,  online: true  },
                { id: null,          av: null, color: null,               name: "AI",           badge: 0,  ai: true       },
              ].map((m, i) => (
                <button key={i} onClick={() => m.ai ? openAI() : nav(`thread-${m.id}`)} style={{ background: "none", border: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0, fontFamily: "inherit" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: m.ai ? "var(--iris-500)" : m.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, border: "2.5px solid rgba(255,255,255,0.85)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                      {m.ai ? <Ic2 n="spark" s={18} sw={2} c="#fff"/> : m.av}
                    </div>
                    {m.online && <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, background: "#2ec27e", border: "2px solid #fff" }}/>}
                    {m.badge > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: "#e8402f", color: "#fff", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center", border: "2px solid #fff" }}>{m.badge}</div>}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.01em", maxWidth: 44, textAlign: "center", lineHeight: 1.2 }}>{m.name}</div>
                </button>
              ))}
              <button onClick={() => nav("doctor-search")} style={{ background: "rgba(255,255,255,0.12)", border: "1.5px dashed rgba(255,255,255,0.35)", borderRadius: 22, width: 44, height: 44, cursor: "pointer", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.7)", flexShrink: 0, alignSelf: "flex-start", marginTop: 0 }}>
                <Ic2 n="plus" s={16} sw={2} c="rgba(255,255,255,0.75)"/>
              </button>
            </div>
          </div>

          {/* Adherence streak */}
          <div className="care-streak">
            <div className="care-streak-dots">
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} className={`care-dot ${i < 3 ? "done" : i === 3 ? "today" : ""}`}>
                  <div className="care-dot-ring"/>
                  <span>{d}</span>
                </div>
              ))}
            </div>
            <div className="care-streak-label">3-day streak · meds + glucose logged</div>
          </div>
        </div>

        <SubTabs tabs={tabs} active={sub} onPick={setSub} cls="v3"/>
        <div className="content">
          {sub === "Feed"   && <CareFeed nav={nav} toast={toast} openAI={openAI}/>}
          {sub === "Visits" && <CareVisits nav={nav} toast={toast}/>}
          {sub === "Team"   && <CareTeam nav={nav} toast={toast}/>}
        </div>
      </div>
      <TabBar2 active="care" onTab={nav} care={2}/>
    </div>
  );
}

/* Unified feed — messages + visits + results + reminders in one stream */
function CareFeed({ nav, toast, openAI }) {
  const [logSheet, setLogSheet] = React.useState(null);

  return (
    <>
      {/* Primary action card — the one thing to do NOW */}
      <div className="care-action-card" onClick={() => nav("visit-prep")}>
        <div className="cac-left">
          <div className="cac-eyebrow"><span className="cac-dot live"/> TODAY · 10:30</div>
          <div className="cac-title">Video visit · Dr. Mensah</div>
          <div className="cac-sub">15-min follow-up · GHS 120 · device check ready</div>
        </div>
        <button className="cac-btn">Join</button>
      </div>

      {/* Quick log strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, margin: "16px 0 4px" }}>
        {[
          { k: "Glucose", ic: "heart", tone: "teal", log: { title: "Log glucose", sub: "Fasting · mg/dL", kind: "value", placeholder: "e.g. 118", unit: "mg/dL", ranges: "80–130 fasting" } },
          { k: "BP", ic: "heart", tone: "iris", log: { title: "Log BP", sub: "Systolic / Diastolic", kind: "value", placeholder: "e.g. 124/78", unit: "mmHg", ranges: "< 130/80" } },
          { k: "Meal", ic: "camera", tone: "gold", go: () => nav("scan-start") },
          { k: "Symptom", ic: "flag", tone: "warn", log: { title: "Log a symptom", sub: "Pick & rate severity", kind: "taken" } },
        ].map((q, i) => (
          <button key={i} onClick={() => q.go ? q.go() : setLogSheet(q.log)} style={{ padding: "10px 4px 8px", borderRadius: 12, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", fontFamily: "inherit", cursor: "pointer", display: "grid", placeItems: "center", gap: 5 }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: `var(--${q.tone}-50)`, display: "grid", placeItems: "center" }}><Ic2 n={q.ic} s={14} c={`var(--${q.tone}-700)`}/></div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-2)" }}>{q.k}</div>
          </button>
        ))}
      </div>

      {/* Unified activity feed */}
      <div className="section-h"><span>Today</span></div>

      {/* RPM check-in nudge */}
      <div className="care-feed-item nudge" onClick={() => nav("rpm")}>
        <div className="cfi-ic" style={{ background: "var(--iris-50)" }}><Ic2 n="heart" s={16} c="var(--iris-600)"/></div>
        <div className="cfi-body">
          <div className="cfi-t">Diabetes check-in · 90 seconds <span className="lp warn">DUE</span></div>
          <div className="cfi-s">Week 12 · quick pulse before your visit</div>
        </div>
        <Ic2 n="chev" s={16} c="var(--fg-4)"/>
      </div>

      {/* Message from Dr. Mensah */}
      <div className="care-feed-item message unread" onClick={() => nav("thread-dr-mensah")}>
        <div className="cfi-av teal">DM</div>
        <div className="cfi-body">
          <div className="cfi-meta">Dr. Mensah · <span>09:12</span></div>
          <div className="cfi-t">Let's plan a 6-week re-check. Lab draw Thursday?</div>
        </div>
        <div className="cfi-unread-dot"/>
      </div>

      {/* AI nudge */}
      <div className="care-feed-item ai" onClick={openAI}>
        <div className="cfi-ic ai-ic"><Ic2 n="spark" s={15} sw={2.2} c="var(--iris-600)"/></div>
        <div className="cfi-body">
          <div className="cfi-meta" style={{ color: "var(--iris-600)" }}>Telecheck AI · 09:08</div>
          <div className="cfi-t">Noticed your Thursday glucose pattern — want to discuss?</div>
        </div>
        <Ic2 n="chev" s={16} c="var(--fg-4)"/>
      </div>

      {/* Metformin refill status */}
      <div className="care-feed-item" onClick={() => nav("rx-metformin")}>
        <div className="cfi-ic" style={{ background: "var(--warning-50)" }}><Ic2 n="pill" s={16} c="var(--warning-700)"/></div>
        <div className="cfi-body">
          <div className="cfi-meta">Mobipharm Osu · 09:31</div>
          <div className="cfi-t">Metformin being prepared · dispatch ETA 11:30</div>
        </div>
        <Ic2 n="chev" s={16} c="var(--fg-4)"/>
      </div>

      <div className="section-h"><span>Coming up</span></div>

      {/* Lab draw Thursday */}
      <div className="care-feed-item" onClick={() => toast("Lab draw details")}>
        <div className="cfi-ic" style={{ background: "var(--gold-50)" }}><Ic2 n="lab" s={16} c="var(--gold-700)"/></div>
        <div className="cfi-body">
          <div className="cfi-t">Home lab draw · Thursday 08:00</div>
          <div className="cfi-s">HbA1c + kidney panel · fasting required</div>
        </div>
        <span className="lp info">THU</span>
      </div>

      {/* Nurse Adjoa coaching */}
      <div className="care-feed-item" onClick={() => nav("thread-nurse-adjoa")}>
        <div className="cfi-av iris">NA</div>
        <div className="cfi-body">
          <div className="cfi-meta">Nurse Adjoa · Yesterday</div>
          <div className="cfi-t">How are your evening readings this week?</div>
        </div>
        <Ic2 n="chev" s={16} c="var(--fg-4)"/>
      </div>

      {/* Programs nudge */}
      <div className="section-h"><span>Your programs</span></div>
      <div className="care-prog-card" onClick={() => nav("rpm")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-1)" }}>Diabetes RPM · Week 12</div><div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Dr. Mensah · adherence 92%</div></div>
          <span className="lp ok">ACTIVE</span>
        </div>
        <div style={{ marginTop: 12, background: "var(--n-100)", borderRadius: 4, height: 5, overflow: "hidden" }}>
          <div style={{ width: "46%", height: "100%", background: "var(--teal-500)", borderRadius: 4 }}/>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {["Onboard","Stabilize","Re-check","Graduate"].map((m, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9.5, fontWeight: 600, padding: "5px 2px", borderRadius: 5, background: i < 2 ? "var(--success-50)" : i === 2 ? "var(--teal-500)" : "var(--n-50)", color: i < 2 ? "var(--success-700)" : i === 2 ? "#fff" : "var(--fg-3)" }}>{m}</div>
          ))}
        </div>
      </div>

      {logSheet && logSheet.kind !== "add-device" && <LogIntakeSheet log={logSheet} onClose={() => setLogSheet(null)} toast={toast}/>}
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
