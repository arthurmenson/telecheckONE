// ─────────────────────────────────────────────────────────────────
// Care Page — Tier-1 Redesign  (overrides CareV2 from home_care.jsx)
// Hub landing → Inbox · Visits · Programs · Track · Team inner pages
// ─────────────────────────────────────────────────────────────────

(function injectCareStyles() {
  if (document.getElementById("cr-styles")) return;
  const s = document.createElement("style");
  s.id = "cr-styles";
  s.textContent = `
    /* ── Hub hero ─────────────────────────────────────────── */
    .cr-hero {
      padding: 20px 18px 18px;
      background:
        radial-gradient(ellipse at 110% -10%, color-mix(in oklab,var(--teal-400) 28%,transparent) 0%, transparent 55%),
        radial-gradient(ellipse at -10% 110%, color-mix(in oklab,var(--gold-200) 40%,transparent) 0%, transparent 55%),
        linear-gradient(160deg, color-mix(in oklab,var(--teal-100) 60%,white), white 80%);
      border-bottom: 1px solid rgba(58,170,122,.12);
    }
    .cr-eyebrow { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--teal-700); margin-bottom:3px; }
    .cr-hero-h { font-size:23px; font-weight:700; letter-spacing:-.02em; margin:0 0 2px; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .cr-hero-sub { font-size:12px; color:var(--fg-3); margin-bottom:16px; }
    .cr-live {
      display:flex; align-items:center; gap:10px;
      background:#fff; border-radius:14px; padding:11px 13px;
      border:1px solid rgba(0,0,0,.05); box-shadow:0 3px 10px rgba(0,0,0,.07);
      cursor:pointer;
    }
    .cr-live-dot {
      width:9px; height:9px; border-radius:50%; background:#ef4444; flex-shrink:0;
      animation:cr-pulse 1.5s ease-in-out infinite;
    }
    @keyframes cr-pulse {
      0%,100% { box-shadow:0 0 0 3px rgba(239,68,68,.22); }
      50%      { box-shadow:0 0 0 7px rgba(239,68,68,.06); }
    }
    .cr-live-text { flex:1; font-size:13px; font-weight:600; color:var(--fg-1); line-height:1.25; }
    .cr-live-sub  { font-size:11px; color:var(--fg-3); font-weight:400; }
    .cr-live-btn  {
      padding:7px 15px; border-radius:9px; background:var(--teal-500);
      color:#fff; font-size:12.5px; font-weight:700; border:0;
      font-family:inherit; cursor:pointer; flex-shrink:0;
    }

    /* ── Hub card grid ─────────────────────────────────────── */
    .cr-cards { padding:14px 14px 10px; display:grid; gap:10px; }

    /* Primary full-width card */
    .cr-prime {
      display:flex; align-items:center; gap:12px;
      background:#fff; border-radius:16px; padding:14px 14px 14px 0;
      border:1px solid rgba(0,0,0,.05); box-shadow:0 1px 5px rgba(0,0,0,.05);
      cursor:pointer; overflow:hidden; position:relative;
    }
    .cr-prime-stripe {
      width:4px; align-self:stretch; border-radius:0 3px 3px 0; flex-shrink:0;
    }
    .cr-prime-ico {
      width:40px; height:40px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .cr-prime-body { flex:1; min-width:0; }
    .cr-prime-section { font-size:9.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:2px; }
    .cr-prime-title  { font-size:14px; font-weight:600; color:var(--fg-1); letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cr-prime-sub    { font-size:11.5px; color:var(--fg-3); margin-top:2px; line-height:1.3; }
    .cr-badge {
      min-width:20px; height:20px; border-radius:10px; background:#ef4444;
      color:#fff; font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center; padding:0 5px; flex-shrink:0;
    }

    /* 2-column mini cards */
    .cr-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .cr-mini {
      background:#fff; border-radius:14px; padding:13px 13px 12px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; flex-direction:column; gap:10px;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
      transition:transform .1s;
    }
    .cr-mini:active { transform:scale(.98); }
    .cr-mini-top { display:flex; align-items:center; justify-content:space-between; }
    .cr-mini-ico { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .cr-mini-pill { font-size:8.5px; font-weight:700; padding:2px 7px; border-radius:9999px; }
    .cr-mini-section { font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:2px; }
    .cr-mini-val { font-size:22px; font-weight:700; letter-spacing:-.025em; color:var(--fg-1); line-height:1.05; }
    .cr-mini-lbl { font-size:10.5px; color:var(--fg-3); margin-top:1px; }

    /* AI shortcut row */
    .cr-ai-row {
      display:flex; align-items:center; gap:10px; padding:12px 14px;
      background:color-mix(in oklab,var(--iris-50) 60%,white);
      border-radius:13px; border:1px solid color-mix(in oklab,var(--iris-300) 30%,transparent);
      cursor:pointer;
    }
    .cr-ai-ico { width:28px; height:28px; border-radius:8px; background:color-mix(in oklab,var(--iris-500) 13%,white); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .cr-ai-label { flex:1; font-size:13px; font-weight:500; color:var(--fg-2); }

    /* ── Inner page shared header ──────────────────────────── */
    .cr-hdr {
      padding:10px 16px 14px; border-bottom:1px solid var(--border-subtle);
      display:flex; flex-direction:column; gap:0;
    }
    .cr-hdr-back {
      display:flex; align-items:center; gap:4px; background:none; border:0;
      font-size:12px; font-weight:500; color:var(--fg-3); padding:4px 0 8px;
      cursor:pointer; font-family:inherit; align-self:flex-start;
    }
    .cr-hdr-back svg { opacity:.7; }
    .cr-hdr-title { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .cr-hdr-stat  { font-size:12px; color:var(--fg-3); margin-top:2px; }

    /* ── Inbox ─────────────────────────────────────────────── */
    .cr-msg {
      display:flex; gap:11px; align-items:flex-start; padding:13px 16px;
      border-bottom:1px solid var(--border-subtle); cursor:pointer; transition:background .1s;
    }
    .cr-msg:active { background:var(--n-50); }
    .cr-msg.unread { background:color-mix(in oklab,var(--teal-50) 45%,#fff); }
    .cr-av {
      width:42px; height:42px; border-radius:13px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700;
    }
    .cr-msg-body { flex:1; min-width:0; }
    .cr-msg-from {
      font-size:13px; font-weight:600; color:var(--fg-1);
      display:flex; align-items:center; gap:6px; flex-wrap:wrap;
    }
    .cr-new-pill {
      font-size:8.5px; font-weight:700; letter-spacing:.06em;
      background:var(--teal-500); color:#fff;
      padding:1px 6px; border-radius:9999px;
    }
    .cr-msg-preview {
      font-size:12px; color:var(--fg-3); margin-top:3px; line-height:1.4;
      overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
    }
    .cr-msg.unread .cr-msg-preview { color:var(--fg-2); font-weight:500; }
    .cr-msg-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }
    .cr-msg-time  { font-size:10.5px; color:var(--fg-4); }
    .cr-unread-dot { width:8px; height:8px; border-radius:50%; background:var(--teal-500); }

    /* ── Visit cards ───────────────────────────────────────── */
    .cr-vcard {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; gap:12px; align-items:flex-start;
      box-shadow:0 1px 5px rgba(0,0,0,.04); transition:transform .1s;
    }
    .cr-vcard:active { transform:scale(.99); }
    .cr-vcard.live { border-color:rgba(239,68,68,.22); background:#fffbfb; }
    .cr-vcard-ico { width:38px; height:38px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .cr-vcard-body { flex:1; min-width:0; }
    .cr-vcard-title { font-size:13.5px; font-weight:600; color:var(--fg-1); letter-spacing:-.005em; }
    .cr-vcard-sub   { font-size:11.5px; color:var(--fg-3); margin-top:3px; line-height:1.35; }
    .cr-vcard-live  { display:inline-flex; align-items:center; gap:5px; margin-top:6px; font-size:10.5px; font-weight:700; color:#ef4444; }
    .cr-vcard-live span { width:6px; height:6px; border-radius:50%; background:#ef4444; animation:cr-pulse 1.5s ease-in-out infinite; }
    .cr-vcard-right { text-align:right; flex-shrink:0; }
    .cr-vcard-time  { font-size:14px; font-weight:700; color:var(--fg-1); font-variant-numeric:tabular-nums; }
    .cr-vcard-day   { font-size:10.5px; color:var(--fg-3); margin-top:2px; }

    /* ── Program hero ──────────────────────────────────────── */
    .cr-prog-hero {
      margin:14px 16px 0; border-radius:16px; padding:16px;
      background:linear-gradient(135deg,#fff6f2,#fff9f6);
      border:1px solid rgba(224,123,84,.2);
    }
    .cr-prog-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .cr-prog-tag { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#e07b54; margin-bottom:3px; }
    .cr-prog-name { font-size:17px; font-weight:700; letter-spacing:-.01em; color:var(--fg-1); }
    .cr-prog-sub  { font-size:12px; color:var(--fg-3); margin-top:2px; }
    .cr-prog-wk { font-size:11px; font-weight:700; color:#e07b54; background:rgba(224,123,84,.12); padding:4px 9px; border-radius:9999px; flex-shrink:0; }
    .cr-prog-bar { height:7px; background:rgba(224,123,84,.15); border-radius:4px; overflow:hidden; margin:12px 0 10px; }
    .cr-prog-fill { height:100%; background:linear-gradient(90deg,#e07b54,#e8956a); border-radius:4px; }
    .cr-prog-milestones { display:flex; position:relative; margin-bottom:2px; }
    .cr-prog-milestones::before { content:''; position:absolute; top:4px; left:12%; right:12%; height:2px; background:rgba(224,123,84,.15); z-index:0; }
    .cr-ms { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; position:relative; z-index:1; }
    .cr-ms-dot { width:10px; height:10px; border-radius:50%; background:var(--n-200); }
    .cr-ms.done .cr-ms-dot { background:#e07b54; }
    .cr-ms.now  .cr-ms-dot { background:var(--fg-1); box-shadow:0 0 0 3px rgba(0,0,0,.1); }
    .cr-ms-lbl { font-size:8.5px; font-weight:600; color:var(--fg-4); text-align:center; }
    .cr-ms.done .cr-ms-lbl, .cr-ms.now .cr-ms-lbl { color:var(--fg-2); font-weight:700; }

    /* ── Track ─────────────────────────────────────────────── */
    .cr-metric {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .cr-metric-lbl  { font-size:9.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--fg-4); margin-bottom:7px; }
    .cr-metric-val  { font-size:28px; font-weight:700; letter-spacing:-.03em; line-height:1; }
    .cr-metric-unit { font-size:11px; color:var(--fg-4); margin-top:3px; }
    .cr-metric-chip { display:inline-flex; align-items:center; font-size:10px; font-weight:700; padding:3px 8px; border-radius:9999px; margin-top:8px; }
    .cr-metric-chip.warn { background:#fef3c7; color:#b45309; }
    .cr-metric-chip.bad  { background:#fee2e2; color:#b91c1c; }
    .cr-metric-chip.ok   { background:#dcfce7; color:#166534; }
    .cr-log-btn { margin-top:10px; width:100%; padding:8px; border-radius:9px; background:var(--n-50); border:1px solid var(--border-subtle); font-family:inherit; font-size:11px; font-weight:600; color:var(--fg-3); cursor:pointer; }
    .cr-log-btn:hover { background:var(--n-100,#eee); }

    /* ── Team cards ────────────────────────────────────────── */
    .cr-tcard {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; gap:13px; align-items:center;
      box-shadow:0 1px 5px rgba(0,0,0,.04); transition:transform .1s;
    }
    .cr-tcard:active { transform:scale(.99); }
    .cr-tav { width:46px; height:46px; border-radius:14px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; color:#fff; }
    .cr-tcard-body { flex:1; min-width:0; }
    .cr-tcard-name { font-size:14px; font-weight:600; color:var(--fg-1); letter-spacing:-.01em; }
    .cr-tcard-role { font-size:11.5px; color:var(--fg-3); margin-top:2px; }
    .cr-tcard-avail { font-size:10.5px; color:var(--fg-4); margin-top:4px; display:flex; align-items:center; gap:4px; }
    .cr-avail-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; flex-shrink:0; }
    .cr-tmsg-btn { padding:7px 13px; border-radius:9px; border:1px solid var(--border-subtle); background:var(--n-50); font-size:11.5px; font-weight:600; color:var(--fg-2); font-family:inherit; cursor:pointer; white-space:nowrap; flex-shrink:0; }

    /* ── Trends chart cards ────────────────────────────────── */
    .cr-chart-card { background:#fff; border-radius:14px; padding:14px 14px 10px; border:1px solid rgba(0,0,0,.05); margin-bottom:10px; }
    .cr-chart-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .cr-chart-title { font-size:12.5px; font-weight:700; color:var(--fg-1); }
    .cr-chart-val   { font-size:18px; font-weight:700; letter-spacing:-.02em; }
    .cr-chart-axis  { display:flex; justify-content:space-between; margin-top:5px; font-size:9.5px; color:var(--fg-4); }

    /* ── Section label ─────────────────────────────────────── */
    .cr-section-lbl { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--fg-4); margin-bottom:8px; padding-top:4px; }
  `;
  document.head.appendChild(s);
})();

// ── Shared back-button header for all inner pages ─────────────
function CareHdr({ color, title, stat, onBack, right }) {
  const bgs = {
    teal:   "linear-gradient(150deg, color-mix(in oklab,var(--teal-400) 18%,white), color-mix(in oklab,var(--teal-100) 35%,white))",
    blue:   "linear-gradient(150deg, color-mix(in oklab,#5b8dee 14%,white), color-mix(in oklab,#5b8dee 24%,white))",
    orange: "linear-gradient(150deg, color-mix(in oklab,#e07b54 14%,white), color-mix(in oklab,#e07b54 22%,white))",
    green:  "linear-gradient(150deg, color-mix(in oklab,#2a8a4a 13%,white), color-mix(in oklab,#2a8a4a 20%,white))",
    iris:   "linear-gradient(150deg, color-mix(in oklab,var(--iris-500) 12%,white), color-mix(in oklab,var(--iris-500) 20%,white))",
  };
  const backLabel = window.__tcOrigin || "Care";
  const handleBack = () => {
    const origin = window.__tcOrigin;
    window.__tcOrigin = null;
    if (origin === "Home" && window.__tcNav) { window.__tcNav("home"); return; }
    onBack();
  };
  return (
    <div className="cr-hdr" style={{ background: bgs[color] || bgs.teal }}>
      <button className="cr-hdr-back" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        {backLabel}
      </button>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div className="cr-hdr-title">{title}</div>
          {stat && <div className="cr-hdr-stat">{stat}</div>}
        </div>
        {right && <div style={{ flexShrink: 0, paddingTop: 4 }}>{right}</div>}
      </div>
    </div>
  );
}

// ── INBOX ─────────────────────────────────────────────────────
function CareInboxV2({ nav, openAI, goBack }) {
  const msgs = [
    { f: "Dr. A. Mensah",    p: "Let's plan a 6-week re-check. Lab draw Thursday 08:00 work for you?", t: "09:12", u: true,  av: "DM", bg: "var(--teal-500)",   thread: "dr-mensah"   },
    { f: "Telecheck AI",     p: "Noticed your Thursday glucose pattern — want to discuss?",            t: "09:08", u: true,  av: null, bg: "var(--iris-500)",   ai: true              },
    { f: "Mobipharm Osu",    p: "Your metformin is being prepared. Dispatch ETA 11:30.",              t: "09:31", u: false, av: "MP", bg: "#c28320",           thread: "pharmacy"    },
    { f: "Nurse Adjoa",      p: "How are your evening readings this week?",                           t: "Yesterday", u: false, av: "NA", bg: "var(--iris-500)", thread: "nurse-adjoa" },
    { f: "Kojo (shared)",    p: "Shared: dad's BP log from Sunday.",                                  t: "Sun",   u: false, av: "KO", bg: "#5b8dee",           thread: "kojo"        },
    { f: "Telecheck",        p: "New — Community events on your conditions.",                         t: "Mon",   u: false, av: "TC", bg: "#6b7280",           thread: "support"     },
  ];
  return (
    <>
      <CareHdr color="teal" title="Messages" stat="2 unread" onBack={goBack}/>
      {msgs.map((m, i) => (
        <div key={i} className={`cr-msg${m.u ? " unread" : ""}`} onClick={() => m.ai ? openAI() : nav(`thread-${m.thread}`)}>
          <div className="cr-av" style={{ background: m.bg, color: "#fff" }}>
            {m.ai ? <Ic2 n="spark" s={16} sw={2.2} c="#fff"/> : m.av}
          </div>
          <div className="cr-msg-body">
            <div className="cr-msg-from">
              {m.f}
              {m.u && <span className="cr-new-pill">NEW</span>}
            </div>
            <div className="cr-msg-preview">{m.p}</div>
          </div>
          <div className="cr-msg-right">
            <div className="cr-msg-time">{m.t}</div>
            {m.u && <div className="cr-unread-dot"/>}
          </div>
        </div>
      ))}
    </>
  );
}

// ── VISITS ────────────────────────────────────────────────────
function CareVisitsV2({ nav, toast, goBack }) {
  const [sheet, setSheet] = React.useState(null);
  const upcoming = [
    { live: true,  iBg: "#fee2e2", iC: "#ef4444", icon: "video",    title: "Dr. Mensah — video",    sub: "Follow-up · HbA1c & meds",   time: "10:30", day: "Today", go: () => nav("visit-prep")            },
    { live: false, iBg: "#fef3c7", iC: "#b45309", icon: "lab",      title: "Home lab draw",          sub: "HbA1c + lipids + kidney",    time: "08:00", day: "Thu",   go: () => setSheet("lab")              },
    { live: false, iBg: "#f0eeff", iC: "var(--iris-500)", icon: "calendar", title: "Diabetes coaching", sub: "Async · Nurse Adjoa",    time: "Weekly", day: "Mon",  go: () => nav("thread-nurse-adjoa")    },
  ];
  const past = [
    { iBg: "#e8f0fe", iC: "#5b8dee", icon: "video", title: "Dr. Mensah — video", sub: "14 Mar · summary available", go: () => nav("visit-summary") },
    { iBg: "#f0eeff", iC: "var(--iris-500)", icon: "doc", title: "Nurse Adjoa — async", sub: "02 Mar · cough review", go: () => nav("visit-summary") },
  ];
  return (
    <>
      <CareHdr color="blue" title="Visits" stat="Next: today at 10:30" onBack={goBack}/>
      <div style={{ padding: "14px 16px 0", display: "grid", gap: 10 }}>
        <div className="cr-section-lbl">Upcoming</div>
        {upcoming.map((v, i) => (
          <div key={i} className={`cr-vcard${v.live ? " live" : ""}`} onClick={v.go}>
            <div className="cr-vcard-ico" style={{ background: v.iBg }}>
              <Ic2 n={v.icon} s={18} sw={2} c={v.iC}/>
            </div>
            <div className="cr-vcard-body">
              <div className="cr-vcard-title">{v.title}</div>
              <div className="cr-vcard-sub">{v.sub}</div>
              {v.live && <div className="cr-vcard-live"><span/>Live now · tap to join</div>}
            </div>
            <div className="cr-vcard-right">
              <div className="cr-vcard-time">{v.time}</div>
              <div className="cr-vcard-day">{v.day}</div>
            </div>
          </div>
        ))}

        <div className="cr-section-lbl" style={{ marginTop: 4 }}>Past visits</div>
        {past.map((v, i) => (
          <div key={i} className="cr-vcard" style={{ opacity: .88 }} onClick={v.go}>
            <div className="cr-vcard-ico" style={{ background: v.iBg }}>
              <Ic2 n={v.icon} s={18} sw={2} c={v.iC}/>
            </div>
            <div className="cr-vcard-body">
              <div className="cr-vcard-title">{v.title}</div>
              <div className="cr-vcard-sub">{v.sub}</div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--teal-700)", background: "var(--teal-50)", padding: "5px 10px", borderRadius: 8, flexShrink: 0, alignSelf: "center" }}>Summary</span>
          </div>
        ))}

        <button className="cta" onClick={() => nav("doctor-search")} style={{ marginTop: 4 }}>Find a clinician</button>
      </div>
      {sheet === "lab" && <LabDrawSheet onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
    </>
  );
}

// ── PROGRAMS ─────────────────────────────────────────────────
function CareProgramsV2({ nav, toast, goBack }) {
  const [offer, setOffer] = React.useState(null);
  const [trackProg, setTrackProg] = React.useState(null);
  const [docId, setDocId]         = React.useState(null);
  const offers = {
    hypertension: { name: "Hypertension CCM", sub: "For Kofi · Dr. Owusu", who: "Kofi (delegated)", by: "Dr. Owusu · cardiology", price: "GHS 180 / month", commit: "3 months · cancel anytime", includes: ["Weekly BP check-ins", "Monthly clinician review", "BP cuff provided", "Alert thresholds 160/100", "Family dashboard"] },
    adherence:    { name: "Medication adherence", sub: "GHS 40/mo · Nurse Adjoa", who: "Ama (you)", by: "Nurse Adjoa Boateng", price: "GHS 40 / month", commit: "6 weeks minimum", includes: ["Daily reminder tuning", "Weekly async check-in", "Behavioral techniques", "Shared log with Dr. Mensah"] },
  };
  const tracking = [
    { id: "pregnancy", icon: "heart", iBg: "#f0eeff", iC: "var(--iris-500)", title: "Pregnancy tracker", sub: "Weekly milestones · med-safety flags" },
    { id: "nutrition", icon: "camera", iBg: "#fef3c7", iC: "#b45309", title: "Nutrition coach", sub: "Photo-log meals · Ghanaian food · dietitian" },
    { id: "symptom",   icon: "flag", iBg: "#e8f0fe", iC: "#5b8dee", title: "Symptom diary", sub: "Track symptoms · AI finds patterns · free" },
  ];
  return (
    <>
      <CareHdr color="orange" title="Programs" stat="1 active · 2 invites" onBack={goBack}/>

      {/* Active program hero */}
      <div className="cr-prog-hero">
        <div className="cr-prog-top">
          <div>
            <div className="cr-prog-tag">Active program</div>
            <div className="cr-prog-name">Diabetes RPM</div>
            <div className="cr-prog-sub">Dr. Mensah · adherence 92%</div>
          </div>
          <div className="cr-prog-wk">WK 12/26</div>
        </div>
        <div className="cr-prog-bar">
          <div className="cr-prog-fill" style={{ width: "46%" }}/>
        </div>
        <div className="cr-prog-milestones">
          {[{ l: "Onboard", s: "done" }, { l: "Stabilize", s: "done" }, { l: "Re-check", s: "now" }, { l: "Graduate", s: "" }].map((m, i) => (
            <div key={i} className={`cr-ms ${m.s}`}>
              <div className="cr-ms-dot"/>
              <div className="cr-ms-lbl">{m.l}</div>
            </div>
          ))}
        </div>
        <button className="cta" style={{ marginTop: 14, background: "#e07b54" }} onClick={() => nav("rpm")}>Weekly check-in due</button>
      </div>

      <div style={{ padding: "14px 16px 0", display: "grid", gap: 10 }}>
        <div className="cr-section-lbl">Invites</div>
        <div className="cr-vcard" onClick={() => setOffer(offers.hypertension)}>
          <div className="cr-vcard-ico" style={{ background: "#fef3c7" }}><Ic2 n="heart" s={18} sw={2} c="#b45309"/></div>
          <div className="cr-vcard-body">
            <div className="cr-vcard-title">Hypertension CCM</div>
            <div className="cr-vcard-sub">For Kofi · invite from Dr. Owusu</div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "4px 9px", borderRadius: 9999, flexShrink: 0, alignSelf: "center" }}>INVITE</span>
        </div>
        <div className="cr-vcard" onClick={() => nav("program-glp1")}>
          <div className="cr-vcard-ico" style={{ background: "#f0eeff" }}><Ic2 n="spark" s={18} sw={2} c="var(--iris-500)"/></div>
          <div className="cr-vcard-body">
            <div className="cr-vcard-title">GLP-1 metabolic</div>
            <div className="cr-vcard-sub">Weight & HbA1c · clinician-led</div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--iris-600)", background: "color-mix(in oklab,var(--iris-100) 60%,white)", padding: "4px 9px", borderRadius: 9999, flexShrink: 0, alignSelf: "center" }}>VIEW</span>
        </div>
        <div className="cr-vcard" onClick={() => setOffer(offers.adherence)}>
          <div className="cr-vcard-ico" style={{ background: "color-mix(in oklab,var(--teal-100) 50%,white)" }}><Ic2 n="pill" s={18} sw={2} c="var(--teal-700)"/></div>
          <div className="cr-vcard-body">
            <div className="cr-vcard-title">Medication adherence</div>
            <div className="cr-vcard-sub">GHS 40/mo · Nurse Adjoa</div>
          </div>
        </div>

        <div className="cr-section-lbl" style={{ marginTop: 4 }}>Tracking programs</div>
        {tracking.map((p, i) => (
          <div key={i} className="cr-vcard" onClick={() => setTrackProg(p.id)}>
            <div className="cr-vcard-ico" style={{ background: p.iBg }}><Ic2 n={p.icon} s={18} sw={2} c={p.iC}/></div>
            <div className="cr-vcard-body">
              <div className="cr-vcard-title">{p.title}</div>
              <div className="cr-vcard-sub">{p.sub}</div>
            </div>
          </div>
        ))}

        <div className="cr-section-lbl" style={{ marginTop: 4 }}>Documents</div>
        {[
          { id: "rpm-care-plan", icon: "doc", iBg: "#e8f0fe", iC: "#5b8dee", title: "RPM care plan · PDF", sub: "Signed 14 Jan 2026" },
          { id: "rpm-consent",   icon: "doc", iBg: "color-mix(in oklab,var(--teal-50) 60%,white)", iC: "var(--teal-700)", title: "RPM consent · PDF", sub: "Revocable · Me → Privacy" },
        ].map((d, i) => (
          <div key={i} className="cr-vcard" onClick={() => setDocId(d.id)}>
            <div className="cr-vcard-ico" style={{ background: d.iBg }}><Ic2 n={d.icon} s={18} sw={2} c={d.iC}/></div>
            <div className="cr-vcard-body">
              <div className="cr-vcard-title">{d.title}</div>
              <div className="cr-vcard-sub">{d.sub}</div>
            </div>
            <Ic2 n="upload" s={16} c="var(--fg-4)"/>
          </div>
        ))}
      </div>
      {offer && <ProgramOfferSheet program={offer} onClose={() => setOffer(null)} toast={toast}/>}
      {trackProg && window.TrackingProgramSheet && <window.TrackingProgramSheet programId={trackProg} onClose={() => setTrackProg(null)} toast={toast}/>}
      {docId && window.DocOpener && <window.DocOpener docId={docId} onClose={() => setDocId(null)} toast={toast}/>}
    </>
  );
}

// ── TRACK ─────────────────────────────────────────────────────
function CareTrackV2({ nav, toast, forcedSub, setForcedSub, goBack }) {
  const [localSub, setLocalSub] = React.useState("Today");
  const sub = forcedSub || localSub;
  const [addDevOpen, setAddDevOpen] = React.useState(false);
  const [labOpen, setLabOpen]       = React.useState(false);
  const setSub = (s) => { setLocalSub(s); if (setForcedSub) setForcedSub(s); };
  const [logSheet, setLogSheet] = React.useState(null);

  const metrics = [
    { label: "Glucose",  val: "132", unit: "mg/dL",   cls: "bad",  color: "#d4742a", status: "↑ High",  log: { title: "Log glucose", sub: "mg/dL", kind: "value", placeholder: "e.g. 118", unit: "mg/dL", ranges: "80–130 fasting" } },
    { label: "HbA1c",    val: "7.8", unit: "%",        cls: "warn", color: "#c28320", status: "High",    log: null },
    { label: "BP",       val: "124", unit: "/78 mmHg", cls: "ok",   color: "#2a8a4a", status: "Normal",  log: { title: "Log BP", sub: "Systolic/Diastolic", kind: "value", placeholder: "e.g. 124/78", unit: "mmHg", ranges: "< 130/80" } },
    { label: "Weight",   val: "72",  unit: "kg",       cls: "ok",   color: "#5b8dee", status: "Stable",  log: { title: "Log weight", sub: "kg", kind: "value", placeholder: "e.g. 72.1", unit: "kg", ranges: "Target < 75" } },
  ];
  const quickLog = [
    { k: "Glucose", ic: "heart", tone: "teal", log: metrics[0].log },
    { k: "BP",      ic: "heart", tone: "iris", log: metrics[2].log },
    { k: "Meal",    ic: "camera", tone: "gold", go: () => nav("scan-start") },
    { k: "Symptom", ic: "flag",  tone: "warn", log: { title: "Log symptom", sub: "Pick & rate severity", kind: "taken" } },
  ];

  return (
    <>
      <CareHdr color="green" title="Track" stat="Last reading · today 08:30" onBack={goBack}
        right={<button className="ic-btn" onClick={() => (setForcedSub ? setForcedSub("Devices") : setLocalSub("Devices"))}><Ic2 n="more" s={18}/></button>}/>
      <SubTabs tabs={["Today", "Trends", "Devices"]} active={sub} onPick={setSub}/>

      {sub === "Today" && (
        <>
          <div style={{ padding: "12px 16px 0", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {quickLog.map((q, i) => (
              <button key={i} onClick={() => q.go ? q.go() : setLogSheet(q.log)}
                style={{ padding: "11px 5px 9px", borderRadius: 13, background: "#fff", border: "1px solid rgba(0,0,0,.05)", fontFamily: "inherit", cursor: "pointer", display: "grid", placeItems: "center", gap: 5, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `var(--${q.tone}-50)`, display: "grid", placeItems: "center" }}>
                  <Ic2 n={q.ic} s={15} c={`var(--${q.tone}-700)`}/>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--fg-2)" }}>{q.k}</div>
              </button>
            ))}
          </div>
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {metrics.map((m, i) => (
              <div key={i} className="cr-metric" onClick={() => m.log ? setLogSheet(m.log) : (m.label === "HbA1c" ? setLabOpen(true) : toast(`${m.label} — no manual entry`))}>
                <div className="cr-metric-lbl">{m.label}</div>
                <div className="cr-metric-val" style={{ color: m.color }}>{m.val}</div>
                <div className="cr-metric-unit">{m.unit}</div>
                <div className={`cr-metric-chip ${m.cls}`}>{m.status}</div>
                {m.log && <button className="cr-log-btn" onClick={e => { e.stopPropagation(); setLogSheet(m.log); }}>+ Log reading</button>}
              </div>
            ))}
          </div>
          {logSheet && <LogIntakeSheet log={logSheet} onClose={() => setLogSheet(null)} toast={toast}/>}
        </>
      )}
      {addDevOpen && window.AddDeviceSheet && <window.AddDeviceSheet onClose={() => setAddDevOpen(false)} toast={toast}/>}
      {labOpen && window.ScheduleLabSheet && <window.ScheduleLabSheet onClose={() => setLabOpen(false)} toast={toast} nav={nav}/>}

      {sub === "Trends" && (
        <div style={{ padding: "14px 16px" }}>
          <div className="cr-chart-card">
            <div className="cr-chart-head">
              <div className="cr-chart-title">HbA1c</div>
              <div className="cr-chart-val" style={{ color: "#c28320" }}>7.8%</div>
            </div>
            <svg viewBox="0 0 280 70" style={{ width: "100%", height: 70, display: "block" }}>
              <defs><linearGradient id="hba-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c28320" stopOpacity=".2"/><stop offset="100%" stopColor="#c28320" stopOpacity="0"/></linearGradient></defs>
              <path d="M0,52 L46,47 L93,42 L139,45 L186,38 L232,34 L280,28 L280,70 L0,70Z" fill="url(#hba-g)"/>
              <path d="M0,52 L46,47 L93,42 L139,45 L186,38 L232,34 L280,28" fill="none" stroke="#c28320" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {[[0,52],[46,47],[93,42],[139,45],[186,38],[232,34],[280,28]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke="#c28320" strokeWidth="1.8"/>
              ))}
            </svg>
            <div className="cr-chart-axis"><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--fg-3)" }}>
              <span>Target <b style={{ color: "var(--fg-1)" }}>{"<"}7.5%</b></span>
              <span style={{ color: "#c28320", fontWeight: 700 }}>↑ Trending high</span>
            </div>
          </div>
          <div className="cr-chart-card">
            <div className="cr-chart-head">
              <div className="cr-chart-title">Glucose · 7-day fasting</div>
              <div className="cr-chart-val" style={{ color: "#d4742a" }}>132 <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-4)" }}>mg/dL</span></div>
            </div>
            <svg viewBox="0 0 280 60" style={{ width: "100%", height: 60, display: "block" }}>
              <line x1="0" y1={60-((130-100)/80)*60} x2="280" y2={60-((130-100)/80)*60} stroke="#2a8a4a" strokeWidth="1" strokeDasharray="3 4" opacity=".5"/>
              {[118,142,132,155,127,145,132].map((v, i) => {
                const x = (i/6)*280, y = 60-((v-100)/80)*60;
                return <circle key={i} cx={x} cy={y} r="5" fill="#d4742a" opacity=".85"/>;
              })}
              <path d={[118,142,132,155,127,145,132].map((v, i) => { const x=(i/6)*280, y=60-((v-100)/80)*60; return `${i===0?"M":"L"}${x},${y}`; }).join(" ")} fill="none" stroke="#d4742a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
            </svg>
            <div className="cr-chart-axis"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
          </div>
        </div>
      )}

      {sub === "Devices" && (
        <div style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
          {[
            { id: "accu-chek", name: "Accu-Chek Guide", sub: "Glucometer · last sync 08:30 today", iBg: "#f0fdf4", iC: "#2a8a4a" },
            { id: "omron-m2",  name: "Omron M2",        sub: "Blood pressure · last sync 08:35 today", iBg: "#e8f0fe", iC: "#5b8dee" },
          ].map(d => (
            <div key={d.id} className="cr-vcard" onClick={() => nav(`device-${d.id}`)}>
              <div className="cr-vcard-ico" style={{ background: d.iBg }}><Ic2 n="heart" s={18} sw={2} c={d.iC}/></div>
              <div className="cr-vcard-body">
                <div className="cr-vcard-title">{d.name}</div>
                <div className="cr-vcard-sub">{d.sub}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "4px 8px", borderRadius: 9999, flexShrink: 0, alignSelf: "center" }}>Connected</span>
            </div>
          ))}
          <button className="cta g" onClick={() => setAddDevOpen(true)}>+ Add device</button>
        </div>
      )}
    </>
  );
}

// ── TEAM ──────────────────────────────────────────────────────
function CareTeamV2({ nav, toast, goBack }) {
  const [member, setMember] = React.useState(null);
  const members = [
    { id: "mensah",   name: "Dr. Akosua Mensah",  role: "Primary care physician",  avail: "Today · responds in ~12 min", av: "DM", bg: "var(--teal-500)"  },
    { id: "adjoa",    name: "Nurse Adjoa Boateng", role: "Diabetes coach · async",  avail: "Replies within 2h",           av: "NA", bg: "var(--iris-500)" },
    { id: "pharmacy", name: "Mobipharm Osu",       role: "Partner pharmacy",        avail: "Mon–Sat 08:00–20:00",         av: "MP", bg: "#c28320"         },
  ];
  return (
    <>
      <CareHdr color="iris" title="Care team" stat="4 members · all active" onBack={goBack}/>
      <div style={{ padding: "14px 16px", display: "grid", gap: 10 }}>
        {members.map(m => (
          <div key={m.id} className="cr-tcard" onClick={() => setMember(m.id)}>
            <div className="cr-tav" style={{ background: m.bg }}>{m.av}</div>
            <div className="cr-tcard-body">
              <div className="cr-tcard-name">{m.name}</div>
              <div className="cr-tcard-role">{m.role}</div>
              <div className="cr-tcard-avail"><div className="cr-avail-dot"/>{m.avail}</div>
            </div>
            <button className="cr-tmsg-btn" onClick={e => { e.stopPropagation(); nav(`thread-${m.id}`); }}>Message</button>
          </div>
        ))}
        <button className="cta g" style={{ marginTop: 4 }} onClick={() => nav("doctor-search")}>Find a clinician</button>
      </div>
      {member && <TeamSheet memberId={member} onClose={() => setMember(null)} toast={toast} nav={nav}/>}
    </>
  );
}

// ── HUB LANDING ───────────────────────────────────────────────
function CareHubV2({ nav, toast, goTo, openAI }) {
  return (
    <>
      {window.HubBackBar && <window.HubBackBar/>}
      <div className="cr-hero">
        <div className="cr-eyebrow">Care</div>
        <h2 className="cr-hero-h">2 things need attention</h2>
        <div className="cr-hero-sub">Dr. Mensah replied · Weekly check-in due</div>
        <div className="cr-live" onClick={() => nav("visit-prep")}>
          <div className="cr-live-dot"/>
          <div>
            <div className="cr-live-text">Dr. Mensah · video call joinable</div>
            <div className="cr-live-sub">Follow-up · HbA1c · 10:30</div>
          </div>
          <button className="cr-live-btn">Join</button>
        </div>
      </div>

      <div className="cr-cards">
        {/* Inbox — full-width primary */}
        <div className="cr-prime" onClick={() => goTo("Inbox")} style={{ background: "color-mix(in oklab,var(--teal-500) 8%,white)", borderColor: "color-mix(in oklab,var(--teal-500) 18%,transparent)" }}>
          <div className="cr-prime-stripe" style={{ background: "var(--teal-500)" }}/>
          <div className="cr-prime-ico" style={{ background: "color-mix(in oklab,var(--teal-500) 18%,white)" }}>
            <Ic2 n="chat" s={19} sw={2} c="var(--teal-700)"/>
          </div>
          <div className="cr-prime-body">
            <div className="cr-prime-section">Messages</div>
            <div className="cr-prime-title">Dr. Mensah replied</div>
            <div className="cr-prime-sub">09:12 · Let's plan a 6-week re-check…</div>
          </div>
          <div className="cr-badge" style={{ marginRight: 14 }}>2</div>
        </div>

        {/* 2×2 mini grid */}
        <div className="cr-grid">
          {/* Visits */}
          <div className="cr-mini" onClick={() => goTo("Visits")}>
            <div className="cr-mini-top">
              <div className="cr-mini-ico" style={{ background: "#e8f0fe" }}>
                <Ic2 n="video" s={14} sw={2} c="#5b8dee"/>
              </div>
              <span className="cr-mini-pill" style={{ color: "#ef4444", background: "#fee2e2" }}>LIVE</span>
            </div>
            <div>
              <div className="cr-mini-section">Visits</div>
              <div className="cr-mini-val" style={{ fontSize: 18 }}>10:30</div>
              <div className="cr-mini-lbl">Today · Dr. Mensah</div>
            </div>
          </div>

          {/* Programs */}
          <div className="cr-mini" onClick={() => goTo("Programs")}>
            <div className="cr-mini-top">
              <div className="cr-mini-ico" style={{ background: "#fff0eb" }}>
                <Ic2 n="award" s={14} sw={2} c="#e07b54"/>
              </div>
              <span className="cr-mini-pill" style={{ color: "#e07b54", background: "rgba(224,123,84,.12)" }}>WK 12</span>
            </div>
            <div>
              <div className="cr-mini-section">Programs</div>
              <div className="cr-mini-val">92%</div>
              <div className="cr-mini-lbl">Adherence · RPM</div>
            </div>
          </div>

          {/* Track */}
          <div className="cr-mini" onClick={() => goTo("Track")}>
            <div className="cr-mini-top">
              <div className="cr-mini-ico" style={{ background: "#f0fdf4" }}>
                <Ic2 n="trend" s={14} sw={2} c="#2a8a4a"/>
              </div>
              <span className="cr-mini-pill" style={{ color: "#b91c1c", background: "#fee2e2" }}>HIGH</span>
            </div>
            <div>
              <div className="cr-mini-section">Track</div>
              <div className="cr-mini-val">132</div>
              <div className="cr-mini-lbl">mg/dL · glucose</div>
            </div>
          </div>

          {/* Team */}
          <div className="cr-mini" onClick={() => goTo("Team")}>
            <div className="cr-mini-top">
              <div className="cr-mini-ico" style={{ background: "#f0eeff" }}>
                <Ic2 n="users" s={14} sw={2} c="var(--iris-600)"/>
              </div>
              <Ic2 n="chev" s={13} c="var(--fg-4)"/>
            </div>
            <div>
              <div className="cr-mini-section">Team</div>
              <div className="cr-mini-val">4</div>
              <div className="cr-mini-lbl">Members · active</div>
            </div>
          </div>
        </div>

        {/* AI shortcut */}
        <div className="cr-ai-row" onClick={openAI}>
          <div className="cr-ai-ico"><Ic2 n="spark" s={15} sw={2.2} c="var(--iris-500)"/></div>
          <div className="cr-ai-label">Ask Telecheck AI about your care</div>
          <Ic2 n="chev" s={14} c="var(--iris-400)"/>
        </div>
      </div>
    </>
  );
}

// ── CareV2 OVERRIDE ───────────────────────────────────────────
function CareV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI,
  sub = "Hub", setSub, trackSub, setTrackSub }) {

  const goTo   = (s) => setSub(s);
  const goBack = ()  => setSub("Hub");

  const inner = (() => {
    switch (sub) {
      case "Inbox":    return <CareInboxV2    nav={nav} toast={toast} openAI={openAI} goBack={goBack}/>;
      case "Visits":   return <CareVisitsV2   nav={nav} toast={toast} goBack={goBack}/>;
      case "Programs": return <CareProgramsV2 nav={nav} toast={toast} goBack={goBack}/>;
      case "Track":    return <CareTrackV2    nav={nav} toast={toast} forcedSub={trackSub} setForcedSub={setTrackSub} goBack={goBack}/>;
      case "Team":     return <CareTeamV2     nav={nav} toast={toast} goBack={goBack}/>;
      default:         return <CareHubV2      nav={nav} toast={toast} goTo={goTo} openAI={openAI}/>;
    }
  })();

  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">{inner}</div>
      <TabBar2 active="care" onTab={nav} care={2}/>
    </div>
  );
}
