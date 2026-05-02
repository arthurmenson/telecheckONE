// ─────────────────────────────────────────────────────────────────
// Pharmacy Page — Tier-1 Redesign (overrides PharmacyV2)
// Hub landing → Rx · Programs · Shop · Orders · Safety inner pages
// ─────────────────────────────────────────────────────────────────

// ── Shared Hub back-to-Home pill ──────────────────────────────
// Shown at top of section hubs when origin === "Home"
function HubBackBar() {
  const [origin] = React.useState(() => window.__tcOrigin);
  if (origin !== "Home") return null;
  const handleBack = () => {
    window.__tcOrigin = null;
    if (window.__tcNav) window.__tcNav("home");
  };
  return (
    <button onClick={handleBack} style={{
      display:"flex", alignItems:"center", gap:4,
      background:"none", border:0,
      fontSize:12, fontWeight:500, color:"var(--fg-3)",
      padding:"10px 18px 0", cursor:"pointer", fontFamily:"inherit",
      width:"100%", textAlign:"left", justifyContent:"flex-start",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l-6 6 6 6"/>
      </svg>
      Home
    </button>
  );
}
window.HubBackBar = HubBackBar;

(function injectPhStyles() {
  if (document.getElementById("ph-styles")) return;
  const s = document.createElement("style");
  s.id = "ph-styles";
  s.textContent = `
    /* ── Hub hero ─────────────────────────────────────────── */
    .ph-hero {
      padding: 20px 18px 18px;
      background:
        radial-gradient(ellipse at 110% -10%, color-mix(in oklab,var(--iris-400) 20%,transparent) 0%, transparent 52%),
        radial-gradient(ellipse at -10% 110%, color-mix(in oklab,var(--gold-200) 45%,transparent) 0%, transparent 52%),
        linear-gradient(160deg, color-mix(in oklab,var(--iris-100) 45%,white), white 80%);
      border-bottom: 1px solid rgba(124,111,205,.1);
    }
    .ph-eyebrow { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--iris-700); margin-bottom:3px; }
    .ph-hero-h  { font-size:23px; font-weight:700; letter-spacing:-.02em; margin:0 0 2px; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .ph-hero-sub { font-size:12px; color:var(--fg-3); margin-bottom:14px; }

    /* Alert banner (refill in review) */
    .ph-alert {
      display:flex; align-items:center; gap:10px;
      background:#fff; border-radius:14px; padding:11px 13px;
      border:1px solid rgba(194,131,32,.25); box-shadow:0 2px 8px rgba(194,131,32,.08);
      cursor:pointer;
    }
    .ph-alert-dot { width:8px; height:8px; border-radius:50%; background:#c28320; flex-shrink:0; animation:ph-blink 2s ease-in-out infinite; }
    @keyframes ph-blink { 0%,100%{opacity:1} 50%{opacity:.4} }
    .ph-alert-text { flex:1; font-size:12.5px; font-weight:600; color:var(--fg-1); }
    .ph-alert-sub  { font-size:11px; color:var(--fg-3); font-weight:400; }
    .ph-alert-chip { font-size:9.5px; font-weight:700; color:#b45309; background:#fef3c7; padding:4px 9px; border-radius:9999px; flex-shrink:0; }

    /* ── Hub card grid ─────────────────────────────────────── */
    .ph-cards { padding:14px 14px 10px; display:grid; gap:10px; }

    .ph-prime {
      display:flex; align-items:center; gap:12px;
      background:#fff; border-radius:16px; padding:14px 14px 14px 0;
      border:1px solid rgba(0,0,0,.05); box-shadow:0 1px 5px rgba(0,0,0,.05);
      cursor:pointer; overflow:hidden; position:relative;
    }
    .ph-prime-stripe { width:4px; align-self:stretch; border-radius:0 3px 3px 0; flex-shrink:0; }
    .ph-prime-ico { width:40px; height:40px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .ph-prime-body { flex:1; min-width:0; }
    .ph-prime-section { font-size:9.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:2px; }
    .ph-prime-title { font-size:14px; font-weight:600; color:var(--fg-1); letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ph-prime-sub   { font-size:11.5px; color:var(--fg-3); margin-top:2px; line-height:1.3; }
    .ph-badge { min-width:20px; height:20px; border-radius:10px; background:#c28320; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 5px; flex-shrink:0; }

    .ph-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .ph-mini {
      background:#fff; border-radius:14px; padding:13px 13px 12px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; flex-direction:column; gap:10px;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .ph-mini:active { transform:scale(.98); }
    .ph-mini-top { display:flex; align-items:center; justify-content:space-between; }
    .ph-mini-ico { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .ph-mini-pill { font-size:8.5px; font-weight:700; padding:2px 7px; border-radius:9999px; }
    .ph-mini-section { font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:2px; }
    .ph-mini-val { font-size:22px; font-weight:700; letter-spacing:-.025em; color:var(--fg-1); line-height:1.05; }
    .ph-mini-lbl { font-size:10.5px; color:var(--fg-3); margin-top:1px; }

    /* ── Inner page header ─────────────────────────────────── */
    .ph-hdr { padding:10px 16px 14px; border-bottom:1px solid var(--border-subtle); display:flex; flex-direction:column; }
    .ph-hdr-back { display:flex; align-items:center; gap:4px; background:none; border:0; font-size:12px; font-weight:500; color:var(--fg-3); padding:4px 0 8px; cursor:pointer; font-family:inherit; align-self:flex-start; }
    .ph-hdr-title { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .ph-hdr-stat  { font-size:12px; color:var(--fg-3); margin-top:2px; }

    /* ── Rx prescription cards ─────────────────────────────── */
    .ph-rx-card {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); display:flex; gap:12px; align-items:flex-start;
      cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .ph-rx-card:active { transform:scale(.99); }
    .ph-rx-card.urgent { border-color:rgba(194,131,32,.3); background:#fffdf7; }
    .ph-rx-ico { width:40px; height:40px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .ph-rx-body { flex:1; min-width:0; }
    .ph-rx-name   { font-size:14px; font-weight:600; color:var(--fg-1); letter-spacing:-.01em; }
    .ph-rx-sub    { font-size:11.5px; color:var(--fg-3); margin-top:3px; }
    .ph-rx-status { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:3px 8px; border-radius:9999px; margin-top:7px; }
    .ph-rx-status.review  { background:#fef3c7; color:#b45309; }
    .ph-rx-status.active  { background:#dcfce7; color:#166534; }
    .ph-rx-status.proto   { background:color-mix(in oklab,var(--teal-100) 60%,white); color:var(--teal-700); }
    .ph-rx-status.info    { background:#e8f0fe; color:#1a56db; }
    .ph-rx-status.private { background:#f0eeff; color:var(--iris-700); }
    .ph-rx-refill { padding:6px 13px; border-radius:9px; background:var(--iris-500); color:#fff; font-size:11px; font-weight:700; border:0; font-family:inherit; cursor:pointer; white-space:nowrap; flex-shrink:0; align-self:center; }
    .ph-rx-refill.ghost { background:var(--n-50); color:var(--fg-3); border:1px solid var(--border-subtle); }

    /* ── Shop product cards ────────────────────────────────── */
    .ph-shop-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 16px; }
    .ph-product {
      background:#fff; border-radius:14px; padding:12px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .ph-product:active { transform:scale(.98); }
    .ph-product-img {
      aspect-ratio:1; border-radius:10px; margin-bottom:10px;
      background:linear-gradient(145deg,#f4f0ff,#ede9fa);
      display:flex; align-items:center; justify-content:center;
      position:relative; overflow:hidden;
    }
    .ph-product-img::after { content:''; position:absolute; inset:25%; border-radius:50%; background:linear-gradient(145deg,var(--iris-200),var(--iris-400)); opacity:.6; }
    .ph-product-safe { position:absolute; top:6px; right:6px; z-index:1; font-size:8px; font-weight:700; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:9999px; }
    .ph-product-name  { font-size:12.5px; font-weight:600; color:var(--fg-1); line-height:1.3; }
    .ph-product-price { font-size:14px; font-weight:700; color:var(--fg-1); margin-top:4px; letter-spacing:-.01em; }
    .ph-product-sup   { font-size:10.5px; color:var(--fg-3); margin-top:2px; }
    .ph-product-add   { margin-top:9px; width:100%; padding:7px; border-radius:9px; background:var(--iris-500); color:#fff; font-size:11px; font-weight:700; border:0; font-family:inherit; cursor:pointer; }

    /* ── Order timeline ────────────────────────────────────── */
    .ph-timeline { padding:0 16px; display:grid; gap:0; }
    .ph-step { display:flex; gap:14px; align-items:flex-start; position:relative; padding-bottom:18px; }
    .ph-step:last-child { padding-bottom:0; }
    .ph-step-track { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:24px; }
    .ph-step-dot { width:22px; height:22px; border-radius:50%; border:2px solid var(--n-200); background:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; z-index:1; }
    .ph-step-dot.done { background:var(--teal-500); border-color:var(--teal-500); }
    .ph-step-dot.now  { background:var(--fg-1); border-color:var(--fg-1); box-shadow:0 0 0 4px rgba(0,0,0,.08); }
    .ph-step-line { width:2px; flex:1; background:var(--n-100); margin:2px 0; min-height:20px; }
    .ph-step-line.done { background:var(--teal-500); }
    .ph-step-body { flex:1; padding-top:2px; }
    .ph-step-title { font-size:13.5px; font-weight:600; color:var(--fg-1); }
    .ph-step-title.dim { color:var(--fg-3); font-weight:500; }
    .ph-step-sub { font-size:11.5px; color:var(--fg-3); margin-top:2px; line-height:1.35; }
    .ph-step-time { font-size:10.5px; font-weight:700; color:var(--fg-4); margin-top:2px; font-variant-numeric:tabular-nums; }

    /* ── Safety dashboard ──────────────────────────────────── */
    .ph-safety-hero {
      margin:14px 16px 0; border-radius:16px; padding:16px;
      background:linear-gradient(135deg,#f0fdf4,#f7fef9);
      border:1px solid rgba(42,138,74,.18);
      display:flex; gap:14px; align-items:center;
    }
    .ph-safety-shield { width:48px; height:48px; border-radius:14px; background:var(--teal-500); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ph-safety-tag  { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#166534; margin-bottom:3px; }
    .ph-safety-title { font-size:15px; font-weight:700; color:var(--fg-1); letter-spacing:-.01em; }
    .ph-safety-sub   { font-size:11.5px; color:var(--fg-3); margin-top:2px; }

    .ph-check-card {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; gap:12px; align-items:center;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .ph-check-card:active { transform:scale(.99); }
    .ph-check-ico { width:38px; height:38px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .ph-check-body { flex:1; min-width:0; }
    .ph-check-title { font-size:13.5px; font-weight:600; color:var(--fg-1); }
    .ph-check-sub   { font-size:11.5px; color:var(--fg-3); margin-top:2px; }
    .ph-check-badge { font-size:10px; font-weight:700; padding:4px 10px; border-radius:9999px; flex-shrink:0; }
    .ph-check-badge.clear { background:#dcfce7; color:#166534; }
    .ph-check-badge.warn  { background:#fef3c7; color:#b45309; }
    .ph-check-badge.info  { background:#e8f0fe; color:#1a56db; }

    /* ── Program cards ─────────────────────────────────────── */
    .ph-prog-card {
      border-radius:16px; padding:16px; cursor:pointer;
      border:1px solid; position:relative; overflow:hidden;
      transition:transform .12s;
    }
    .ph-prog-card:active { transform:scale(.99); }
    .ph-prog-tag   { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; padding:3px 9px; border-radius:9999px; display:inline-block; margin-bottom:10px; }
    .ph-prog-name  { font-size:20px; font-weight:700; letter-spacing:-.015em; margin-bottom:4px; }
    .ph-prog-sub   { font-size:12.5px; line-height:1.45; margin-bottom:12px; }
    .ph-prog-price { font-size:15px; font-weight:700; letter-spacing:-.01em; }
    .ph-prog-price-s { font-size:11px; opacity:.7; margin-top:2px; }
    .ph-prog-cta   { margin-top:14px; padding:10px 16px; border-radius:9999px; font-size:13px; font-weight:700; border:0; cursor:pointer; font-family:inherit; display:inline-flex; gap:6px; align-items:center; }

    /* Section label */
    .ph-section { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--fg-4); margin-bottom:8px; padding-top:4px; }
  `;
  document.head.appendChild(s);
})();

// ── Back-button header shared by all inner pages ──────────────
function PhHdr({ color, title, stat, onBack, right }) {
  const bgs = {
    iris:   "linear-gradient(150deg, color-mix(in oklab,var(--iris-400) 15%,white), color-mix(in oklab,var(--iris-100) 28%,white))",
    teal:   "linear-gradient(150deg, color-mix(in oklab,var(--teal-400) 16%,white), color-mix(in oklab,var(--teal-100) 30%,white))",
    gold:   "linear-gradient(150deg, color-mix(in oklab,var(--gold-400) 18%,white), color-mix(in oklab,var(--gold-100) 32%,white))",
    blue:   "linear-gradient(150deg, color-mix(in oklab,#5b8dee 13%,white), color-mix(in oklab,#5b8dee 22%,white))",
    green:  "linear-gradient(150deg, color-mix(in oklab,#2a8a4a 13%,white), color-mix(in oklab,#2a8a4a 20%,white))",
  };
  const backLabel = window.__tcOrigin || "Pharmacy";
  const handleBack = () => {
    const origin = window.__tcOrigin;
    window.__tcOrigin = null;
    if (origin === "Home" && window.__tcNav) { window.__tcNav("home"); return; }
    onBack();
  };
  return (
    <div className="ph-hdr" style={{ background: bgs[color] || bgs.iris }}>
      <button className="ph-hdr-back" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        {backLabel}
      </button>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div>
          <div className="ph-hdr-title">{title}</div>
          {stat && <div className="ph-hdr-stat">{stat}</div>}
        </div>
        {right && <div style={{ flexShrink:0, paddingTop:4 }}>{right}</div>}
      </div>
    </div>
  );
}

// ── RX (PRESCRIPTIONS) ───────────────────────────────────────
function PhRxV2({ nav, toast, enrolledPrograms = [], protocolRefillsActive = false, goBack }) {
  const [ixn, setIxn] = React.useState(null);
  const rxs = [
    {
      id: "metformin", name: "Metformin 500 mg", sub: "Twice daily · morning & evening",
      iBg: "#fef3c7", iC: "#b45309",
      status: protocolRefillsActive ? "proto" : "review",
      statusLabel: protocolRefillsActive ? "Protocol-executed · delivering today" : "Refill in review · Dr. Mensah",
      urgent: !protocolRefillsActive, refillLabel: protocolRefillsActive ? null : "Request refill",
    },
    {
      id: "lisinopril", name: "Lisinopril 10 mg", sub: "Once daily · auto-refill on",
      iBg: "#f0eeff", iC: "var(--iris-600)",
      status: "active", statusLabel: "Auto-refill · next 02 May",
      urgent: false, refillLabel: null,
    },
    {
      id: "paracetamol", name: "Paracetamol 500 mg", sub: "As needed · 18 tablets left",
      iBg: "color-mix(in oklab,var(--teal-100) 50%,white)", iC: "var(--teal-700)",
      status: "active", statusLabel: "In stock · no refill needed",
      urgent: false, refillLabel: null,
    },
  ];

  return (
    <>
      <PhHdr color="iris" title="Prescriptions" stat="3 active · 1 needs attention" onBack={goBack}/>

      {/* AI interaction warning */}
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ background:"color-mix(in oklab,var(--gold-50) 60%,white)", borderRadius:13, padding:"12px 14px", border:"1px solid rgba(194,131,32,.22)", marginBottom:10, cursor:"pointer" }} onClick={() => setIxn("details")}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#b45309", marginBottom:4 }}>⚠ Interaction · heads up</div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--fg-1)", marginBottom:3 }}>Ibuprofen + lisinopril flagged in basket</div>
          <div style={{ fontSize:11.5, color:"var(--fg-2)", lineHeight:1.4 }}>Paracetamol is safer given your BP meds. Tap to swap.</div>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button onClick={e=>{e.stopPropagation();setIxn("swap")}} style={{ padding:"7px 14px", borderRadius:9, background:"#b45309", color:"#fff", border:0, fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer" }}>Swap to paracetamol</button>
            <button onClick={e=>{e.stopPropagation();setIxn("details")}} style={{ padding:"7px 14px", borderRadius:9, background:"var(--n-50)", color:"var(--fg-2)", border:"1px solid var(--border-subtle)", fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer" }}>Details</button>
          </div>
        </div>
      </div>

      <div style={{ padding:"0 16px", display:"grid", gap:10 }}>
        <div className="ph-section">Active prescriptions</div>
        {rxs.map(rx => (
          <div key={rx.id} className={`ph-rx-card${rx.urgent ? " urgent" : ""}`} onClick={() => nav(`rx-${rx.id}`)}>
            <div className="ph-rx-ico" style={{ background: rx.iBg }}>
              <Ic2 n="pill" s={19} sw={2} c={rx.iC}/>
            </div>
            <div className="ph-rx-body">
              <div className="ph-rx-name">{rx.name}</div>
              <div className="ph-rx-sub">{rx.sub}</div>
              <div className={`ph-rx-status ${rx.status}`}>{rx.statusLabel}</div>
            </div>
            {rx.refillLabel && (
              <button className="ph-rx-refill" onClick={e=>{e.stopPropagation();nav(`rx-${rx.id}`)}}>{rx.refillLabel}</button>
            )}
          </div>
        ))}

        {/* New prescription */}
        <div className="ph-section" style={{ marginTop:4 }}>From your doctor</div>
        <div className="ph-rx-card urgent" onClick={() => nav("rx-new")}>
          <div className="ph-rx-ico" style={{ background:"#e8f0fe" }}>
            <Ic2 n="doc" s={19} sw={2} c="#5b8dee"/>
          </div>
          <div className="ph-rx-body">
            <div className="ph-rx-name">New prescription</div>
            <div className="ph-rx-sub">Issued today 09:41 · GHS 55 pending</div>
            <div className="ph-rx-status info">Awaiting your action</div>
          </div>
          <button className="ph-rx-refill" onClick={e=>{e.stopPropagation();nav("rx-new")}}>Review</button>
        </div>

        {/* Programs */}
        {(enrolledPrograms.includes("glp1") || enrolledPrograms.includes("baltasar")) && (
          <>
            <div className="ph-section" style={{ marginTop:4 }}>Enrolled programs</div>
            {enrolledPrograms.includes("glp1") && (
              <div className="ph-rx-card" onClick={() => nav("program-glp1")}>
                <div className="ph-rx-ico" style={{ background:"color-mix(in oklab,var(--teal-100) 50%,white)" }}>
                  <Ic2 n="award" s={19} sw={2} c="var(--teal-700)"/>
                </div>
                <div className="ph-rx-body">
                  <div className="ph-rx-name">Semaglutide 0.5 mg</div>
                  <div className="ph-rx-sub">Weekly · GLP-1 program · next Sat 25 Apr</div>
                  <div className="ph-rx-status proto">Program medication</div>
                </div>
              </div>
            )}
            {enrolledPrograms.includes("baltasar") && (
              <div className="ph-rx-card" onClick={() => nav("program-baltasar")}>
                <div className="ph-rx-ico" style={{ background:"#f0eeff" }}>
                  <Ic2 n="shield" s={19} sw={2} c="var(--iris-600)"/>
                </div>
                <div className="ph-rx-body">
                  <div className="ph-rx-name">Sildenafil 50 mg</div>
                  <div className="ph-rx-sub">As needed · Baltasar · discreet</div>
                  <div className="ph-rx-status private">Private program</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Discover */}
        <div className="ph-section" style={{ marginTop:4 }}>Specialized programs</div>
        {[
          { icon:"award", iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", title:"Metabolic · GLP-1", sub:"Weight & HbA1c · clinician-led", go:"program-glp1" },
          { icon:"shield", iBg:"#f0eeff", iC:"var(--iris-600)", title:"Baltasar · men's health", sub:"Discreet ED treatment · from GHS 180", go:"program-baltasar" },
        ].map((p,i) => (
          <div key={i} className="ph-rx-card" onClick={() => nav(p.go)}>
            <div className="ph-rx-ico" style={{ background:p.iBg }}><Ic2 n={p.icon} s={19} sw={2} c={p.iC}/></div>
            <div className="ph-rx-body">
              <div className="ph-rx-name">{p.title}</div>
              <div className="ph-rx-sub">{p.sub}</div>
            </div>
            <Ic2 n="chev" s={16} c="var(--fg-4)"/>
          </div>
        ))}
      </div>
      {ixn && window.InteractionSheet && <window.InteractionSheet mode={ixn} onClose={() => setIxn(null)} toast={toast}/>}
    </>
  );
}

// ── PROGRAMS ─────────────────────────────────────────────────
function PhProgramsV2({ nav, toast, goBack }) {
  return (
    <>
      <PhHdr color="teal" title="Programs" stat="2 clinical programs available" onBack={goBack}/>
      <div style={{ padding:"14px 16px", display:"grid", gap:12 }}>
        {/* GLP-1 */}
        <div className="ph-prog-card" style={{ background:"linear-gradient(160deg,var(--teal-50),#e8f5f0 60%,#fff)", borderColor:"rgba(58,170,122,.2)" }} onClick={() => nav("program-glp1")}>
          <span className="ph-prog-tag" style={{ background:"color-mix(in oklab,var(--teal-500) 12%,white)", color:"var(--teal-700)" }}>Weight & Metabolic</span>
          <div className="ph-prog-name" style={{ color:"var(--teal-800)" }}>Metabolic · GLP-1</div>
          <div className="ph-prog-sub" style={{ color:"var(--teal-900,#1a3d30)" }}>Medically-supervised weight & glucose program. Clinician-led semaglutide, monthly review, quarterly labs.</div>
          <div style={{ display:"flex", gap:16, margin:"10px 0" }}>
            {[{ k:"Typical weight loss", v:"12–15%" },{ k:"HbA1c reduction", v:"1.4%" }].map((o,i) => (
              <div key={i}>
                <div style={{ fontSize:18, fontWeight:700, color:"var(--teal-700)", letterSpacing:"-.02em" }}>{o.v}</div>
                <div style={{ fontSize:10, color:"var(--teal-800,#1a5c3a)", marginTop:1 }}>{o.k}</div>
              </div>
            ))}
          </div>
          <div className="ph-prog-price" style={{ color:"var(--teal-800)" }}>GHS 690 <span style={{ fontSize:12, fontWeight:500 }}>/ month</span></div>
          <div className="ph-prog-price-s" style={{ color:"var(--teal-700)" }}>First month GHS 420 · screening + starter dose</div>
          <button className="ph-prog-cta" style={{ background:"var(--teal-500)", color:"#fff" }} onClick={e=>{e.stopPropagation();nav("program-glp1")}}>
            Start screening <Ic2 n="chev" s={14} c="#fff"/>
          </button>
        </div>

        {/* Baltasar */}
        <div className="ph-prog-card" style={{ background:"linear-gradient(165deg,#1b1d2b,#242840 55%,#1b1d2b)", borderColor:"rgba(124,111,205,.25)" }} onClick={() => nav("program-baltasar")}>
          <span className="ph-prog-tag" style={{ background:"rgba(124,111,205,.2)", color:"#c4b8ff" }}>Men's Health · Discreet</span>
          <div className="ph-prog-name" style={{ color:"#fff" }}>Baltasar</div>
          <div className="ph-prog-sub" style={{ color:"rgba(255,255,255,.75)" }}>ED treatment delivered privately. Plain packaging, no labels, clinician sign-off under 4h. Flexible strength.</div>
          <div style={{ display:"flex", gap:16, margin:"10px 0" }}>
            {[{ k:"Response on first dose", v:"68%" },{ k:"Clinician reply", v:"< 4h" }].map((o,i) => (
              <div key={i}>
                <div style={{ fontSize:18, fontWeight:700, color:"#a78bfa", letterSpacing:"-.02em" }}>{o.v}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", marginTop:1 }}>{o.k}</div>
              </div>
            ))}
          </div>
          <div className="ph-prog-price" style={{ color:"#fff" }}>from GHS 180 <span style={{ fontSize:12, fontWeight:400 }}>/ month</span></div>
          <div className="ph-prog-price-s" style={{ color:"rgba(255,255,255,.65)" }}>First order GHS 95 · consult + 4 tablets</div>
          <button className="ph-prog-cta" style={{ background:"rgba(124,111,205,.35)", color:"#e0d8ff", border:"1px solid rgba(124,111,205,.5)" }} onClick={e=>{e.stopPropagation();nav("program-baltasar")}}>
            Start privately <Ic2 n="chev" s={14} c="#e0d8ff"/>
          </button>
        </div>

        {/* Safety note */}
        <div style={{ background:"var(--n-50)", borderRadius:12, padding:"12px 14px", fontSize:11.5, color:"var(--fg-3)", lineHeight:1.5 }}>
          Every program enrollment goes through clinician review before any prescription is issued. You can pause or cancel any month.
        </div>
      </div>
    </>
  );
}

// ── SHOP ─────────────────────────────────────────────────────
function PhShopV2({ nav, toast, goBack }) {
  const [cat, setCat] = React.useState("All");
  const [sheet, setSheet] = React.useState(null);
  const cats = ["All", "Meds", "Devices"];
  const items = [
    { n:"Paracetamol 500 mg", p:"GHS 8",  s:"Mobipharm Osu",       cat:"Meds",    safe:true,  stock:"In stock",    desc:"Standard pain & fever relief. Max 4 tablets/24h. Safe with your current meds." },
    { n:"Vitamin D3 1000 IU", p:"GHS 42", s:"Verified supplier",   cat:"Meds",    safe:true,  stock:"In stock",    desc:"Supports bone health. Most Accra adults are mildly deficient. 1/day with food." },
    { n:"Glucose strips · 50", p:"GHS 95", s:"Accu-Chek compatible", cat:"Meds",  safe:true,  stock:"Low · 4 left",  desc:"Compatible with your Accu-Chek meter. Pack of 50 strips." },
    { n:"Oral rehydration salts", p:"GHS 6", s:"WHO formula",       cat:"Meds",   safe:true,  stock:"In stock",    desc:"WHO-standard formula. 1 sachet in 1L clean water." },
    { n:"Multivitamin · family", p:"GHS 58", s:"30 tablets",        cat:"Meds",   safe:true,  stock:"In stock",    desc:"Family formula · no allergen concerns for your profile." },
    { n:"Antiseptic hand gel", p:"GHS 18", s:"Ghana-made · 250ml",  cat:"Meds",   safe:true,  stock:"In stock",    desc:"70% alcohol. Safe for all ages." },
    { n:"Digital BP cuff",    p:"GHS 220", s:"Omron · 2yr warranty", cat:"Devices", safe:true, stock:"Ships 2 days", desc:"Omron M2 · upper arm · auto-syncs with your Telecheck record." },
    { n:"BP monitor · wrist", p:"GHS 180", s:"Beurer · compact",    cat:"Devices", safe:true, stock:"In stock",    desc:"Portable wrist monitor. Less accurate than upper arm — see Omron for clinical tracking." },
  ];
  const filtered = cat === "All" ? items : items.filter(i => i.cat === cat);
  const ShopSheet = window.ShopItemSheet;
  return (
    <>
      <PhHdr color="gold" title="Shop" stat="All items screened for your meds" onBack={goBack}/>

      {/* Safety banner */}
      <div style={{ margin:"12px 16px 0", padding:"10px 14px", borderRadius:12, background:"color-mix(in oklab,#dcfce7 60%,white)", border:"1px solid rgba(42,138,74,.2)", display:"flex", alignItems:"center", gap:10 }}>
        <Ic2 n="shield" s={16} sw={2} c="#166534"/>
        <div style={{ fontSize:12, color:"#166534", fontWeight:500, flex:1 }}>Every item is screened against your 3 active meds · last checked 09:41</div>
      </div>

      {/* Category filter */}
      <div style={{ padding:"10px 16px 0" }}>
        <SubTabs tabs={cats} active={cat} onPick={setCat}/>
      </div>

      <div className="ph-shop-grid" style={{ paddingTop:10, paddingBottom:16 }}>
        {filtered.map((item, i) => (
          <div key={i} className="ph-product" onClick={() => setSheet(item)}>
            <div className="ph-product-img">
              {item.safe && <span className="ph-product-safe">✓ Safe</span>}
            </div>
            <div className="ph-product-name">{item.n}</div>
            <div className="ph-product-price">{item.p}</div>
            <div className="ph-product-sup">{item.s}</div>
            <div style={{ fontSize:10, color:item.stock.includes("Low") ? "#b45309" : "var(--fg-4)", marginTop:3 }}>{item.stock}</div>
            <button className="ph-product-add" onClick={e=>{
              e.stopPropagation();
              const price = parseInt(item.p.replace(/\D/g,""),10) || 0;
              window.addToCart && window.addToCart({ id: item.n.toLowerCase().replace(/\W+/g,"-"), name: item.n, price, requiresRx: false });
              toast(`${item.n} · added to basket`);
            }}>Add to cart</button>
          </div>
        ))}
      </div>
      {sheet && ShopSheet && <ShopSheet item={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

// ── ORDERS ───────────────────────────────────────────────────
function PhOrdersV2({ nav, toast, goBack }) {
  const [sheet, setSheet] = React.useState(null);
  const steps = [
    { label:"Request sent",      sub:"You · today 09:28",                 time:"09:28", done:true  },
    { label:"Interaction check", sub:"Clear · Medication Engine",         time:"09:31", done:true  },
    { label:"Clinician review",  sub:"Dr. Mensah · ETA 2h · tap to message", time:"now", now:true, go:() => nav("thread-dr-mensah") },
    { label:"Dispensed",         sub:"Mobipharm Osu",                     time:"—",     pending:true },
    { label:"Delivered",         sub:"House 14 · Osu · 22 Apr 10–14",     time:"—",     pending:true },
  ];
  const OrderSh = window.OrderSheet;
  const orders = {
    "1042": { title:"Order #1042 · delivered", sub:"14 Apr · Mobipharm Osu", items:[{n:"Metformin 500 mg · 60 tab",p:"GHS 40"},{n:"Delivery · Osu",p:"GHS 15"}], total:"GHS 55", to:"House 14 · Osu · Accra", rider:"Jumia Logistics · Kofi", delivered:"14 Apr 11:42" },
    "1019": { title:"Order #1019 · delivered", sub:"28 Mar · Mobipharm Osu", items:[{n:"Lisinopril 10 mg · 30 tab",p:"GHS 28"},{n:"Paracetamol · 20 tab",p:"GHS 8"},{n:"Glucose strips · 50",p:"GHS 37"},{n:"Delivery",p:"GHS 15"}], total:"GHS 88", to:"House 14 · Osu · Accra", rider:"Jumia Logistics · Abena", delivered:"28 Mar 14:08" },
  };

  return (
    <>
      <PhHdr color="blue" title="Orders" stat="1 in progress · delivering soon" onBack={goBack}/>

      {/* Active order tracker */}
      <div style={{ margin:"14px 16px 0", background:"#fff", borderRadius:16, padding:"16px", border:"1px solid rgba(0,0,0,.05)", boxShadow:"0 1px 5px rgba(0,0,0,.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#5b8dee", marginBottom:3 }}>Order in progress</div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--fg-1)", letterSpacing:"-.01em" }}>Metformin 500 mg refill</div>
            <div style={{ fontSize:11.5, color:"var(--fg-3)", marginTop:2 }}>Mobipharm Osu · GHS 55</div>
          </div>
          <div style={{ fontSize:10.5, fontWeight:700, color:"#b45309", background:"#fef3c7", padding:"4px 9px", borderRadius:9999, flexShrink:0 }}>IN REVIEW</div>
        </div>
        <div className="ph-timeline">
          {steps.map((step, i) => (
            <div key={i} className="ph-step" onClick={step.go} style={step.go ? { cursor:"pointer" } : {}}>
              <div className="ph-step-track">
                <div className={`ph-step-dot${step.done ? " done" : step.now ? " now" : ""}`}>
                  {step.done && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {step.now && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }}/>}
                </div>
                {i < steps.length - 1 && <div className={`ph-step-line${step.done ? " done" : ""}`}/>}
              </div>
              <div className="ph-step-body">
                <div className={`ph-step-title${step.pending ? " dim" : ""}`}>{step.label}</div>
                <div className="ph-step-sub">{step.sub}</div>
                <div className="ph-step-time">{step.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"14px 16px 0", display:"grid", gap:10 }}>
        <div className="ph-section">Order history</div>
        {Object.entries(orders).map(([id, o]) => (
          <div key={id} className="ph-rx-card" onClick={() => setSheet(o)}>
            <div className="ph-rx-ico" style={{ background:"#e8f0fe" }}><Ic2 n="shop" s={19} sw={2} c="#5b8dee"/></div>
            <div className="ph-rx-body">
              <div className="ph-rx-name">{o.title}</div>
              <div className="ph-rx-sub">{o.sub} · {o.total}</div>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:"#166534", background:"#dcfce7", padding:"4px 9px", borderRadius:9999, flexShrink:0, alignSelf:"center" }}>Delivered</span>
          </div>
        ))}
      </div>
      {sheet && OrderSh && <OrderSh order={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

// ── SAFETY ───────────────────────────────────────────────────
function PhSafetyV2({ nav, toast, goBack }) {
  const [sheet, setSheet] = React.useState(null);
  const [pgxOpen, setPgxOpen] = React.useState(false);
  const [herbOpen, setHerbOpen] = React.useState(false);
  const SafetySh = window.SafetyCheckSheet;
  const checks = {
    dd: { title:"Drug–drug interactions", sub:"0 signals · last swept today 09:31", summary:"Metformin, lisinopril and paracetamol have been checked across 14 interaction dimensions. No contraindications.", checked:[{k:"Metformin × Lisinopril",v:"Safe"},{k:"Metformin × Paracetamol",v:"Safe"},{k:"Lisinopril × Paracetamol",v:"Safe"},{k:"Cumulative QT risk",v:"Low"}], note:"Medication Interaction Engine runs on every prescription change, refill and basket." },
    dc: { title:"Drug–condition", sub:"0 signals · 2 conditions reviewed", summary:"Your medications are appropriate for your conditions (type-2 diabetes, hypertension). No alerts.", checked:[{k:"Metformin × Diabetes",v:"Indicated"},{k:"Lisinopril × Hypertension",v:"Indicated"},{k:"Paracetamol × All",v:"Safe"},{k:"Kidney function guard",v:"eGFR 94 OK"}], note:"Re-checked every 72 hours or on any new diagnosis." },
    dl: { title:"Drug–lab", sub:"0 signals · 6 labs reviewed", summary:"Your latest labs are in safe ranges for your medications. No dose adjustments recommended.", checked:[{k:"eGFR (metformin)",v:"94 OK"},{k:"Potassium (lisinopril)",v:"4.1 OK"},{k:"ALT (metformin)",v:"22 OK"},{k:"HbA1c",v:"7.8% (tracked)"}], note:"Labs → med loop runs on every new result." },
  };
  const checkRows = [
    { key:"dd", icon:"shield", iBg:"#f0fdf4", iC:"#166534", title:"Drug–drug interactions", sub:"3 meds · 14 dimensions checked", badge:"clear" },
    { key:"dc", icon:"heart",  iBg:"#f0fdf4", iC:"#166634", title:"Drug–condition",         sub:"2 conditions · all appropriate",  badge:"clear" },
    { key:"dl", icon:"lab",    iBg:"#f0fdf4", iC:"#166534", title:"Drug–lab",               sub:"eGFR, ALT, AST, K+ all normal",   badge:"clear" },
    { key:"pgx", icon:"dna",   iBg:"#e8f0fe", iC:"#1a56db", title:"Pharmacogenomics",       sub:"Advisory only · clinician interprets", badge:"info" },
    { key:"dfpas", icon:"scan", iBg:"#fef3c7", iC:"#b45309", title:"Fake medication detection", sub:"Advisory · scan to check",    badge:"warn", go:() => nav("scan-start") },
  ];

  return (
    <>
      <PhHdr color="green" title="Safety" stat="Last sweep today 09:31 · all clear" onBack={goBack}/>

      {/* Hero status */}
      <div className="ph-safety-hero">
        <div className="ph-safety-shield"><Ic2 n="shield" s={24} sw={2} c="#fff"/></div>
        <div>
          <div className="ph-safety-tag">All clear</div>
          <div className="ph-safety-title">Your meds work safely together</div>
          <div className="ph-safety-sub">3 meds · 6 labs · 2 conditions reviewed · 0 signals</div>
        </div>
      </div>

      <div style={{ padding:"14px 16px", display:"grid", gap:10 }}>
        <div className="ph-section">Safety checks</div>
        {checkRows.map((c, i) => (
          <div key={i} className="ph-check-card" onClick={() => c.go ? c.go() : (c.key === "pgx" ? setPgxOpen(true) : (c.key === "dfpas" ? toast(`${c.title} · advisory`) : setSheet(checks[c.key])))}>
            <div className="ph-check-ico" style={{ background:c.iBg }}><Ic2 n={c.icon} s={18} sw={2} c={c.iC}/></div>
            <div className="ph-check-body">
              <div className="ph-check-title">{c.title}</div>
              <div className="ph-check-sub">{c.sub}</div>
            </div>
            <span className={`ph-check-badge ${c.badge}`}>
              {c.badge === "clear" ? "CLEAR" : c.badge === "warn" ? "ADVISORY" : "INFO"}
            </span>
          </div>
        ))}

        {/* Herb section */}
        <div className="ph-section" style={{ marginTop:4 }}>Herbal & traditional</div>
        <div style={{ background:"color-mix(in oklab,var(--iris-50) 55%,white)", borderRadius:14, padding:"14px", border:"1px solid color-mix(in oklab,var(--iris-300) 25%,transparent)" }}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--iris-700)", marginBottom:6 }}>Herb–drug engine · coming v1.5</div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--fg-1)", marginBottom:4 }}>Tell us what else you take</div>
          <div style={{ fontSize:12, color:"var(--fg-2)", lineHeight:1.45, marginBottom:12 }}>Bitter kola, moringa, ginger tea, ampesi supplements — we'll check against your meds when v1.5 ships.</div>
          <button onClick={() => setHerbOpen(true)} style={{ padding:"8px 14px", borderRadius:9, background:"var(--iris-500)", color:"#fff", border:0, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer" }}>Log an herb</button>
        </div>
      </div>
      {sheet && SafetySh && <SafetySh check={sheet} onClose={() => setSheet(null)} toast={toast}/>}
      {pgxOpen && window.PgxSheet && <window.PgxSheet onClose={() => setPgxOpen(false)} toast={toast}/>}
      {herbOpen && window.AddHerbSheet && <window.AddHerbSheet onClose={() => setHerbOpen(false)} toast={toast}/>}
    </>
  );
}

// ── HUB LANDING ───────────────────────────────────────────────
function PharmacyHubV2({ nav, toast, goTo, enrolledPrograms = [], protocolRefillsActive = false }) {
  return (
    <>
      {window.HubBackBar && <window.HubBackBar/>}
      <div className="ph-hero">
        <div className="ph-eyebrow">Pharmacy</div>
        <h2 className="ph-hero-h">1 refill needs attention</h2>
        <div className="ph-hero-sub">Metformin · in review · all other meds up to date</div>
        <div className="ph-alert" onClick={() => goTo("Rx")}>
          <div className="ph-alert-dot"/>
          <div>
            <div className="ph-alert-text">Metformin 500 mg · refill in review</div>
            <div className="ph-alert-sub">Dr. Mensah reviewing · ETA 2h</div>
          </div>
          <span className="ph-alert-chip">IN REVIEW</span>
        </div>
      </div>

      <div className="ph-cards">
        {/* Primary: Rx */}
        <div className="ph-prime" onClick={() => goTo("Rx")} style={{ background:"color-mix(in oklab,var(--iris-500) 8%,white)", borderColor:"color-mix(in oklab,var(--iris-500) 18%,transparent)" }}>
          <div className="ph-prime-stripe" style={{ background:"var(--iris-500)" }}/>
          <div className="ph-prime-ico" style={{ background:"color-mix(in oklab,var(--iris-500) 18%,white)" }}>
            <Ic2 n="pill" s={19} sw={2} c="var(--iris-700)"/>
          </div>
          <div className="ph-prime-body">
            <div className="ph-prime-section">Prescriptions</div>
            <div className="ph-prime-title">3 active · 1 in review</div>
            <div className="ph-prime-sub">Metformin refill · Dr. Mensah reviewing</div>
          </div>
          <div className="ph-badge" style={{ marginRight:14 }}>1</div>
        </div>

        {/* 2×2 grid */}
        <div className="ph-grid">
          {/* Programs */}
          <div className="ph-mini" onClick={() => goTo("Programs")}>
            <div className="ph-mini-top">
              <div className="ph-mini-ico" style={{ background:"color-mix(in oklab,var(--teal-100) 50%,white)" }}>
                <Ic2 n="award" s={14} sw={2} c="var(--teal-700)"/>
              </div>
              <Ic2 n="chev" s={13} c="var(--fg-4)"/>
            </div>
            <div>
              <div className="ph-mini-section">Programs</div>
              <div className="ph-mini-val">2</div>
              <div className="ph-mini-lbl">Clinical · available</div>
            </div>
          </div>

          {/* Shop */}
          <div className="ph-mini" onClick={() => goTo("Shop")}>
            <div className="ph-mini-top">
              <div className="ph-mini-ico" style={{ background:"color-mix(in oklab,var(--gold-200) 45%,white)" }}>
                <Ic2 n="shop" s={14} sw={2} c="var(--gold-700)"/>
              </div>
              <span className="ph-mini-pill" style={{ color:"#166534", background:"#dcfce7" }}>SAFE</span>
            </div>
            <div>
              <div className="ph-mini-section">Shop</div>
              <div className="ph-mini-val">8</div>
              <div className="ph-mini-lbl">Items · screened</div>
            </div>
          </div>

          {/* Orders */}
          <div className="ph-mini" onClick={() => goTo("Orders")}>
            <div className="ph-mini-top">
              <div className="ph-mini-ico" style={{ background:"#e8f0fe" }}>
                <Ic2 n="send" s={14} sw={2} c="#5b8dee"/>
              </div>
              <span className="ph-mini-pill" style={{ color:"#b45309", background:"#fef3c7" }}>ACTIVE</span>
            </div>
            <div>
              <div className="ph-mini-section">Orders</div>
              <div className="ph-mini-val">1</div>
              <div className="ph-mini-lbl">In progress</div>
            </div>
          </div>

          {/* Subscriptions (PRD §9.2) */}
          <div className="ph-mini" onClick={() => goTo("Subscriptions")}>
            <div className="ph-mini-top">
              <div className="ph-mini-ico" style={{ background:"color-mix(in oklab,#ede9fe 70%,white)" }}>
                <Ic2 n="refresh" s={14} sw={2} c="#5b21b6"/>
              </div>
              <span className="ph-mini-pill" style={{ color:"#5b21b6", background:"#ede9fe" }}>HIMS-CLASS</span>
            </div>
            <div>
              <div className="ph-mini-section">Subscriptions</div>
              <div className="ph-mini-val">3</div>
              <div className="ph-mini-lbl">Pause · switch · cancel</div>
            </div>
          </div>

          {/* Safety */}
          <div className="ph-mini" onClick={() => goTo("Safety")}>
            <div className="ph-mini-top">
              <div className="ph-mini-ico" style={{ background:"#f0fdf4" }}>
                <Ic2 n="shield" s={14} sw={2} c="#166534"/>
              </div>
              <span className="ph-mini-pill" style={{ color:"#166534", background:"#dcfce7" }}>ALL CLEAR</span>
            </div>
            <div>
              <div className="ph-mini-section">Safety</div>
              <div className="ph-mini-val">0</div>
              <div className="ph-mini-lbl">Signals · last 09:31</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── SUBSCRIPTIONS (PRD §9.2 Hims/Ro-class mechanics) ─────────
function PhSubscriptionsV2({ nav, toast, goBack }) {
  const subs = [
    { id:"metformin",  name:"Metformin 500 mg",  cadence:"30 days", nextShip:"12 May", preAuth:"5 of 6 mo left", price:"GHS 60/mo", state:"live" },
    { id:"lisinopril", name:"Lisinopril 10 mg",  cadence:"30 days", nextShip:"18 May", preAuth:"4 of 6 mo left", price:"GHS 32/mo", state:"live" },
    { id:"vitd",       name:"Vitamin D3 1000 IU",cadence:"60 days", nextShip:"02 Jun", preAuth:"OTC · no review", price:"GHS 42/2mo", state:"paused" },
  ];
  const handle = (rx, action) => {
    if (action === "cancel") {
      window.__tcCancelRx = rx;
      window.__tcSheet && window.__tcSheet("cancel-defl");
      return;
    }
    window.__tcSheet && window.__tcSheet(action);
  };
  return (
    <>
      <PhHdr color="iris" title="Subscriptions" stat="3 active · pause · switch · cancel · bridge supply" onBack={goBack}/>

      <div style={{ margin:"12px 16px 0", padding:"10px 14px", borderRadius:12, background:"linear-gradient(135deg, #ede9fe, #ddd6fe)", border:"1px solid rgba(91,33,182,.18)", display:"flex", alignItems:"center", gap:10 }}>
        <Ic2 n="refresh" s={16} sw={2} c="#5b21b6"/>
        <div style={{ fontSize:11.5, color:"#4c1d95", fontWeight:500, flex:1, lineHeight:1.5 }}><b>Hims/Ro-class subscription mechanics</b> · pause · switch · skip · cancel-with-deflection · 90-day bridge supply</div>
      </div>

      <div style={{padding:"14px 16px", display:"grid", gap:10}}>
        {subs.map(rx => (
          <SubscriptionCard key={rx.id} rx={rx} onAction={(a) => handle(rx, a)}/>
        ))}
      </div>

      <div className="section-h" style={{padding:"4px 16px"}}><span>How this works · honest status</span></div>
      <div style={{margin:"0 16px", padding:14, borderRadius:12, background:"var(--n-50)", display:"grid", gap:8, fontSize:11.5, color:"var(--fg-2)", lineHeight:1.5}}>
        <div><HonestStatus tone="green">PAUSE</HonestStatus> Holds shipments. One tap restarts within 90 days · no new clinician review.</div>
        <div><HonestStatus tone="blue">SWITCH</HonestStatus> Generic equivalents auto-approve. Different active ingredient routes to clinician.</div>
        <div><HonestStatus tone="amber">SKIP</HonestStatus> Skips one shipment. Cadence resumes after.</div>
        <div><HonestStatus tone="red">CANCEL</HonestStatus> Deflection sheet first (PRD §20.3 ≥30% target · audited if &gt;60%). Bridge supply ships on chronic meds.</div>
      </div>
    </>
  );
}

// ── PharmacyV2 OVERRIDE ───────────────────────────────────────
function PharmacyV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI,
  sub = "Hub", setSub, enrolledPrograms = [], protocolRefillsActive = false }) {

  const goTo   = (s) => setSub(s);
  const goBack = ()  => setSub("Hub");

  const inner = (() => {
    switch (sub) {
      case "Rx":            return <PhRxV2            nav={nav} toast={toast} enrolledPrograms={enrolledPrograms} protocolRefillsActive={protocolRefillsActive} goBack={goBack}/>;
      case "Programs":      return <PhProgramsV2      nav={nav} toast={toast} goBack={goBack}/>;
      case "Shop":          return <PhShopV2          nav={nav} toast={toast} goBack={goBack}/>;
      case "Orders":        return <PhOrdersV2        nav={nav} toast={toast} goBack={goBack}/>;
      case "Safety":        return <PhSafetyV2        nav={nav} toast={toast} goBack={goBack}/>;
      case "Subscriptions": return <PhSubscriptionsV2 nav={nav} toast={toast} goBack={goBack}/>;
      default:              return <PharmacyHubV2     nav={nav} toast={toast} goTo={goTo} enrolledPrograms={enrolledPrograms} protocolRefillsActive={protocolRefillsActive}/>;
    }
  })();

  return (
    <div className={`app has-topbar${delegate && delegate !== "me" ? " with-del" : ""}`}>
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">{inner}</div>
      <TabBar2 active="pharmacy" onTab={nav} care={2}/>
    </div>
  );
}
