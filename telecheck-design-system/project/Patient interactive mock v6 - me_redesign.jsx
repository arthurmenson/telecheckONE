// ─────────────────────────────────────────────────────────────────
// Me Page — Tier-1 Redesign  (overrides MeV2)
// Hub → Profile · Records · Account · Community inner pages
// ─────────────────────────────────────────────────────────────────

(function injectMeStyles() {
  if (document.getElementById("me-styles")) return;
  const s = document.createElement("style");
  s.id = "me-styles";
  s.textContent = `
    /* ── Hub hero ─────────────────────────────────────────── */
    .me-hero {
      padding: 20px 18px 18px;
      background:
        radial-gradient(ellipse at 110% -5%, color-mix(in oklab,var(--teal-400) 30%,transparent) 0%, transparent 50%),
        radial-gradient(ellipse at -10% 110%, color-mix(in oklab,var(--iris-200) 35%,transparent) 0%, transparent 50%),
        linear-gradient(155deg, color-mix(in oklab,var(--teal-100) 55%,white), white 75%);
      border-bottom: 1px solid rgba(58,170,122,.12);
    }

    /* Avatar + identity block */
    .me-identity { display:flex; gap:14px; align-items:center; margin-bottom:14px; }
    .me-av {
      width:56px; height:56px; border-radius:17px; background:var(--teal-500);
      color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center;
      justify-content:center; flex-shrink:0; box-shadow:0 3px 10px rgba(58,170,122,.3);
    }
    .me-name  { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .me-loc   { font-size:12px; color:var(--fg-3); margin-top:2px; }
    .me-badge { display:inline-flex; align-items:center; gap:4px; font-size:9.5px; font-weight:700; color:#166534; background:#dcfce7; padding:3px 8px; border-radius:9999px; margin-top:5px; }

    /* Health snapshot strip */
    .me-health {
      display:grid; grid-template-columns:repeat(3,1fr); gap:8px;
      background:#fff; border-radius:14px; padding:12px;
      border:1px solid rgba(0,0,0,.05); box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .me-health-cell { display:flex; flex-direction:column; align-items:center; gap:3px; }
    .me-health-cell + .me-health-cell { border-left:1px solid var(--border-subtle); }
    .me-health-val { font-size:16px; font-weight:700; color:var(--fg-1); letter-spacing:-.01em; }
    .me-health-lbl { font-size:9.5px; font-weight:600; color:var(--fg-3); text-align:center; }
    .me-health-sub { font-size:9px; color:var(--fg-4); text-align:center; line-height:1.3; }

    /* ── Hub cards ─────────────────────────────────────────── */
    .me-cards { padding:14px 14px 10px; display:grid; gap:10px; }
    .me-grid  { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

    .me-prime {
      display:flex; align-items:center; gap:12px;
      background:#fff; border-radius:16px; padding:14px 14px 14px 0;
      border:1px solid rgba(0,0,0,.05); box-shadow:0 1px 5px rgba(0,0,0,.05);
      cursor:pointer; overflow:hidden; position:relative;
    }
    .me-prime-stripe { width:4px; align-self:stretch; border-radius:0 3px 3px 0; flex-shrink:0; }
    .me-prime-ico  { width:40px; height:40px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .me-prime-body { flex:1; min-width:0; }
    .me-prime-section { font-size:9.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:2px; }
    .me-prime-title   { font-size:14px; font-weight:600; color:var(--fg-1); letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .me-prime-sub     { font-size:11.5px; color:var(--fg-3); margin-top:2px; }

    .me-mini {
      background:#fff; border-radius:14px; padding:13px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; flex-direction:column; gap:10px;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .me-mini:active { transform:scale(.98); }
    .me-mini-top { display:flex; align-items:center; justify-content:space-between; }
    .me-mini-ico { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .me-mini-section { font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:2px; }
    .me-mini-val { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); line-height:1.05; }
    .me-mini-lbl { font-size:10.5px; color:var(--fg-3); }

    /* ── Inner page header ─────────────────────────────────── */
    .me-hdr { padding:10px 16px 14px; border-bottom:1px solid var(--border-subtle); display:flex; flex-direction:column; }
    .me-hdr-back { display:flex; align-items:center; gap:4px; background:none; border:0; font-size:12px; font-weight:500; color:var(--fg-3); padding:4px 0 8px; cursor:pointer; font-family:inherit; align-self:flex-start; }
    .me-hdr-row  { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
    .me-hdr-title { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .me-hdr-stat  { font-size:12px; color:var(--fg-3); margin-top:2px; }

    /* ── Profile — health identity card ───────────────────── */
    .me-id-card {
      margin:14px 16px 0; border-radius:16px; padding:16px;
      background:linear-gradient(150deg,color-mix(in oklab,var(--teal-100) 55%,white),white);
      border:1px solid rgba(58,170,122,.18);
    }
    .me-id-top { display:flex; gap:13px; align-items:center; margin-bottom:14px; }
    .me-id-av  { width:48px; height:48px; border-radius:14px; background:var(--teal-500); color:#fff; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .me-id-name { font-size:17px; font-weight:700; letter-spacing:-.01em; color:var(--fg-1); }
    .me-id-sub  { font-size:11.5px; color:var(--fg-3); margin-top:2px; }
    .me-id-ver  { display:inline-flex; align-items:center; gap:3px; font-size:9px; font-weight:700; color:#166534; background:#dcfce7; padding:2px 7px; border-radius:9999px; margin-top:4px; }
    .me-id-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding-top:14px; border-top:1px solid rgba(58,170,122,.12); }
    .me-id-stat  { text-align:center; }
    .me-id-stat-val { font-size:15px; font-weight:700; color:var(--fg-1); }
    .me-id-stat-lbl { font-size:9px; font-weight:600; color:var(--fg-3); text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }

    /* ── Profile — family cards ────────────────────────────── */
    .me-fam-card {
      display:flex; align-items:center; gap:12px; padding:12px 14px;
      background:#fff; border-radius:13px; border:1px solid rgba(0,0,0,.05);
      cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .me-fam-card:active { transform:scale(.99); }
    .me-fam-av   { width:40px; height:40px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; }
    .me-fam-name { font-size:13.5px; font-weight:600; color:var(--fg-1); }
    .me-fam-sub  { font-size:11.5px; color:var(--fg-3); margin-top:2px; }
    .me-fam-role { font-size:9px; font-weight:700; padding:2px 7px; border-radius:9999px; flex-shrink:0; }

    /* ── Records — consent cards ───────────────────────────── */
    .me-consent-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .me-consent-card {
      background:#fff; border-radius:13px; padding:12px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .me-consent-card:active { transform:scale(.98); }
    .me-consent-num   { font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); margin-bottom:4px; }
    .me-consent-title { font-size:12.5px; font-weight:600; color:var(--fg-1); line-height:1.3; }
    .me-consent-sub   { font-size:10.5px; color:var(--fg-3); margin-top:3px; line-height:1.3; }
    .me-consent-chip  { display:inline-block; font-size:8.5px; font-weight:700; padding:2px 7px; border-radius:9999px; margin-top:7px; }
    .me-consent-chip.ok   { background:#dcfce7; color:#166534; }
    .me-consent-chip.info { background:#e8f0fe; color:#1a56db; }
    .me-consent-chip.warn { background:#fef3c7; color:#b45309; }

    /* ── Records — doc cards ───────────────────────────────── */
    .me-doc-card {
      display:flex; align-items:center; gap:12px; padding:12px 14px;
      background:#fff; border-radius:13px; border:1px solid rgba(0,0,0,.05);
      cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .me-doc-ico  { width:36px; height:36px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .me-doc-body { flex:1; min-width:0; }
    .me-doc-title { font-size:13.5px; font-weight:600; color:var(--fg-1); letter-spacing:-.005em; }
    .me-doc-sub   { font-size:11.5px; color:var(--fg-3); margin-top:2px; }

    /* ── Account — billing card ────────────────────────────── */
    .me-billing-card {
      background:linear-gradient(135deg,color-mix(in oklab,var(--iris-100) 45%,white),white);
      border-radius:16px; padding:16px; border:1px solid rgba(124,111,205,.18);
      margin:0 0 10px;
    }
    .me-billing-tag  { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--iris-700); margin-bottom:4px; }
    .me-billing-name { font-size:16px; font-weight:700; letter-spacing:-.01em; color:var(--fg-1); }
    .me-billing-sub  { font-size:12px; color:var(--fg-3); margin-top:2px; }
    .me-billing-row  { display:flex; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid rgba(124,111,205,.12); font-size:11.5px; color:var(--fg-3); }

    /* ── Account — notif toggles ───────────────────────────── */
    .me-notif-row { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; background:#fff; border-radius:12px; border:1px solid rgba(0,0,0,.05); }
    .me-notif-label { font-size:13px; font-weight:600; color:var(--fg-1); }
    .me-notif-sub   { font-size:11px; color:var(--fg-3); margin-top:1px; }
    .me-sw { width:38px; height:22px; border-radius:11px; background:var(--n-200); position:relative; cursor:pointer; transition:background .15s; flex-shrink:0; }
    .me-sw::after { content:''; position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.15); transition:left .15s; }
    .me-sw.on { background:var(--teal-500); }
    .me-sw.on::after { left:18px; }

    /* ── Community — event cards ───────────────────────────── */
    .me-event-card {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      display:flex; gap:12px; align-items:flex-start;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .me-event-card:active { transform:scale(.99); }
    .me-event-date { width:44px; text-align:center; border-radius:11px; background:color-mix(in oklab,var(--teal-100) 55%,white); padding:7px 0; flex-shrink:0; }
    .me-event-d    { font-size:20px; font-weight:700; color:var(--teal-700); line-height:1; }
    .me-event-m    { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--teal-600); margin-top:2px; }
    .me-event-body { flex:1; min-width:0; }
    .me-event-title { font-size:13.5px; font-weight:600; color:var(--fg-1); letter-spacing:-.005em; line-height:1.3; }
    .me-event-meta  { font-size:11.5px; color:var(--fg-3); margin-top:3px; }
    .me-event-rsvp  { padding:6px 13px; border-radius:9px; background:var(--teal-500); color:#fff; font-size:11px; font-weight:700; border:0; font-family:inherit; cursor:pointer; flex-shrink:0; align-self:center; }

    /* Section label */
    .me-section { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--fg-4); margin-bottom:8px; padding-top:4px; }

    /* Settings row */
    .me-setting-row { display:flex; align-items:center; gap:12px; padding:12px 14px; background:#fff; border-radius:12px; border:1px solid rgba(0,0,0,.05); cursor:pointer; }
    .me-setting-ico  { width:32px; height:32px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .me-setting-body { flex:1; min-width:0; }
    .me-setting-title { font-size:13px; font-weight:600; color:var(--fg-1); }
    .me-setting-sub   { font-size:11px; color:var(--fg-3); margin-top:1px; }
  `;
  document.head.appendChild(s);
})();

// ── Shared back-button header ─────────────────────────────────
function MeHdr({ color, title, stat, onBack, right }) {
  const bgs = {
    teal:  "linear-gradient(150deg, color-mix(in oklab,var(--teal-400) 18%,white), color-mix(in oklab,var(--teal-100) 32%,white))",
    blue:  "linear-gradient(150deg, color-mix(in oklab,#5b8dee 13%,white), color-mix(in oklab,#5b8dee 22%,white))",
    iris:  "linear-gradient(150deg, color-mix(in oklab,var(--iris-400) 13%,white), color-mix(in oklab,var(--iris-100) 24%,white))",
    gold:  "linear-gradient(150deg, color-mix(in oklab,var(--gold-400) 18%,white), color-mix(in oklab,var(--gold-100) 32%,white))",
    green: "linear-gradient(150deg, color-mix(in oklab,#2a8a4a 13%,white), color-mix(in oklab,#2a8a4a 20%,white))",
  };
  const backLabel = window.__tcOrigin || "Me";
  const handleBack = () => {
    const origin = window.__tcOrigin;
    window.__tcOrigin = null;
    if (origin === "Home" && window.__tcNav) { window.__tcNav("home"); return; }
    onBack();
  };
  return (
    <div className="me-hdr" style={{ background: bgs[color] || bgs.teal }}>
      <button className="me-hdr-back" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        {backLabel}
      </button>
      <div className="me-hdr-row">
        <div>
          <div className="me-hdr-title">{title}</div>
          {stat && <div className="me-hdr-stat">{stat}</div>}
        </div>
        {right && <div style={{ flexShrink:0, paddingTop:4 }}>{right}</div>}
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────
function MeProfileV2({ nav, toast, goBack, goTo }) {
  const [docSheet, setDocSheet] = React.useState(null);
  const [famSheet, setFamSheet] = React.useState(null);
  const RDS = window.RecordDocSheet;
  const FMS = window.FamilyMemberSheet;

  const healthRows = [
    { icon:"heart", iBg:"#f0eeff", iC:"var(--iris-600)", title:"Conditions", sub:"2 active", detail:{ title:"Conditions", sub:"Active · managed", rows:[{k:"Type-2 diabetes",v:"Diagnosed Jun 2023"},{k:"Mild hypertension",v:"Diagnosed Jan 2024"},{k:"Managed by",v:"Dr. Mensah"},{k:"Next review",v:"22 Apr 10:30"}] } },
    { icon:"pill",  iBg:"#fef3c7", iC:"#b45309",         title:"Medications", sub:"3 active", go:() => nav("pharmacy") },
    { icon:"flag",  iBg:"#fee2e2", iC:"#b91c1c",         title:"Allergies",  sub:"Penicillin", detail:{ title:"Allergies", sub:"1 active", rows:[{k:"Penicillin",v:"Moderate · rash"},{k:"First reaction",v:"Childhood"},{k:"Alternatives",v:"Amox-clavulanate also avoided"}] } },
  ];

  const family = [
    { id:"kofi",  name:"Kofi Mensah",  role:"Dad · 68",        rel:"You care for him",     bg:"var(--gold-500)",  av:"KO", chip:"3 permissions" },
    { id:"abena", name:"Abena Mensah", role:"Daughter · 8",     rel:"Full · minor default", bg:"var(--iris-500)", av:"AB", chip:"Full access" },
    { id:"kojo",  name:"Kojo Asare",   role:"Partner · 36",     rel:"Has access to you",    bg:"var(--teal-500)", av:"KJ", chip:"Labs + meds" },
  ];

  return (
    <>
      <MeHdr color="teal" title="Profile" stat="Identity, health summary, family" onBack={goBack}/>

      {/* Health identity card */}
      <div className="me-id-card">
        <div className="me-id-top">
          <div className="me-id-av">AM</div>
          <div>
            <div className="me-id-name">Ama Akosua Mensah</div>
            <div className="me-id-sub">House 14 · Osu · Accra · Ghana</div>
            <div className="me-id-ver">✓ Ghana ID verified</div>
          </div>
        </div>
        <div className="me-id-stats">
          {[{val:"34", lbl:"Age"},{val:"O+", lbl:"Blood"},{val:"2", lbl:"Conditions"},{val:"1", lbl:"Allergy"}].map((s,i) => (
            <div key={i} className="me-id-stat">
              <div className="me-id-stat-val">{s.val}</div>
              <div className="me-id-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"14px 16px", display:"grid", gap:8 }}>
        {/* Health rows */}
        {healthRows.map((r, i) => (
          <div key={i} className="me-doc-card" onClick={() => r.go ? r.go() : setDocSheet(r.detail)}>
            <div className="me-doc-ico" style={{ background:r.iBg }}><Ic2 n={r.icon} s={17} sw={2} c={r.iC}/></div>
            <div className="me-doc-body">
              <div className="me-doc-title">{r.title}</div>
              <div className="me-doc-sub">{r.sub}</div>
            </div>
            <Ic2 n="chev" s={16} c="var(--fg-4)"/>
          </div>
        ))}

        {/* Emergency card */}
        <div className="me-doc-card" style={{ background:"#fff5f5", borderColor:"rgba(200,64,47,.15)" }} onClick={() => setDocSheet({ title:"Emergency card", sub:"Visible on lock screen if enabled", rows:[{k:"Full name",v:"Ama Mensah"},{k:"Blood type",v:"O+"},{k:"Allergies",v:"Penicillin"},{k:"Conditions",v:"Type-2 diabetes, HTN"},{k:"Active meds",v:"Metformin, lisinopril"},{k:"Emergency contact",v:"Kojo Asare · +233 20… 319"},{k:"Clinician",v:"Dr. Mensah · +233 30… 780"}], actions:["Show on lock screen","Download PDF for wallet"] })}>
          <div className="me-doc-ico" style={{ background:"#fee2e2" }}><Ic2 n="sos" s={17} sw={2} c="#c8402f"/></div>
          <div className="me-doc-body">
            <div className="me-doc-title">Emergency card</div>
            <div className="me-doc-sub">O+ · Penicillin allergy · contact Kojo</div>
          </div>
          <Ic2 n="chev" s={16} c="var(--fg-4)"/>
        </div>

        {/* Family & delegates */}
        <div className="me-section" style={{ marginTop:6 }}>Family & delegates</div>
        {family.map(m => (
          <div key={m.id} className="me-fam-card" onClick={() => setFamSheet(m.id)}>
            <div className="me-fam-av" style={{ background:m.bg }}>{m.av}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="me-fam-name">{m.name}</div>
              <div className="me-fam-sub">{m.role} · {m.rel}</div>
            </div>
            <span className="me-fam-role" style={{ background:"var(--n-50)", color:"var(--fg-3)", border:"1px solid var(--border-subtle)" }}>{m.chip}</span>
          </div>
        ))}
        <button className="cta" style={{ marginTop:4 }} onClick={() => goTo && goTo("InviteFamily")}>Invite a family member</button>
      </div>
      {docSheet && RDS && <RDS doc={docSheet} onClose={() => setDocSheet(null)} toast={toast} nav={nav}/>}
      {famSheet && FMS && <FMS member={famSheet} onClose={() => setFamSheet(null)} toast={toast}/>}
    </>
  );
}

// ── RECORDS ───────────────────────────────────────────────────
function MeRecordsV2({ nav, toast, goBack, goTo, openEpisodeConsent, openEpisodeActive, episodeActive }) {
  const [sheet, setSheet] = React.useState(null);
  const RDS = window.RecordDocSheet;

  const consents = [
    { n:"1", title:"Platform",     sub:"Terms & identity",     chip:"ok",   chipLabel:"GRANTED", detail:{ title:"Platform consent", sub:"Using Telecheck at all", body:"Covers baseline contract: identity, terms, data handling. Revoking closes your account.", rows:[{k:"Granted",v:"14 Jan 2026"},{k:"Version",v:"Terms v1.2 Ghana"},{k:"Evidence",v:"Voice + tap"},{k:"Revocation",v:"Account closes · 30-day hold"}], actions:["Read terms v1.2","Revoke (close account)"] } },
    { n:"2", title:"Care",         sub:"Clinical care via app", chip:"ok",   chipLabel:"GRANTED", detail:{ title:"Care consent", sub:"Carry clinical legal weight in Ghana", body:"Lets clinicians consult, prescribe and monitor you. Revoking pauses all clinical services.", rows:[{k:"Granted",v:"14 Jan 2026"},{k:"Scope",v:"Consults · prescribing · RPM"},{k:"Revocation",v:"Pauses all clinical services"}], actions:["Download signed form","Revoke care consent"] } },
    { n:"3", title:"Data use",     sub:"AI · pharmacy · analytics", chip:"ok", chipLabel:"GRANULAR", detail:{ title:"Data-use consent", sub:"Per-flow · toggle any row", body:"Data-use consent is per flow. Granted ≠ all. Revoking stops it going forward.", rows:[{k:"AI interpretation",v:"Granted"},{k:"Pharmacy sharing",v:"Mobipharm only"},{k:"Hospital sharing",v:"Not granted"},{k:"Analytics",v:"Granted"},{k:"Research",v:"Not granted"}], actions:["Adjust each flow"], actionNavs:["data-use"] } },
    { n:"4", title:"Delegation",   sub:"3 active relationships",    chip:"ok", chipLabel:"3 ACTIVE", detail:{ title:"Delegation consent", sub:"You managing others or others managing you", rows:[{k:"Kofi (dad)",v:"3 permissions · expires Oct"},{k:"Abena (daughter)",v:"Full · minor default"},{k:"Kojo (partner)",v:"Labs + meds access"}], actions:["Open family & delegates","Revoke a relationship"], actionNavs:["me-family",null] } },
    { n:"5", title:"Jurisdiction", sub:"Ghana FDA · Data Protection Act", chip:"ok", chipLabel:"GHANA", detail:{ title:"Jurisdictional consent · Ghana", sub:"Market regulatory consents", rows:[{k:"Ghana FDA reporting",v:"Granted"},{k:"Data residency",v:"Accra (Lagos backup)"},{k:"DPA rights",v:"Acknowledged"},{k:"Country change",v:"Needs ID re-verify"}], actions:["Read DPA note","Request country change"], actionNavs:[null,"jurisdiction"] } },
    { n:"6", title:"Episode",      sub:episodeActive ? "1 active" : "0 active", chip:episodeActive ? "ok" : "info", chipLabel:episodeActive ? "1 ACTIVE" : "0 ACTIVE",
      go:() => episodeActive ? openEpisodeActive?.() : openEpisodeConsent?.() },
  ];

  const docs = [
    { icon:"doc", iBg:"#e8f0fe", iC:"#5b8dee", title:"Full medical record · PDF", sub:"Last generated 12 Apr · 42 pages", detail:{ title:"Full medical record", sub:"Generated on demand", body:"Complete longitudinal record: diagnoses, meds, all labs, visit notes. Emailed, downloaded or shared via a 72h secure link.", rows:[{k:"Last generated",v:"12 Apr 2026"},{k:"Pages",v:"42 · 3.1 MB"},{k:"Clinicians",v:"Dr. Mensah, Nurse Adjoa"}], actions:["Generate fresh PDF","Share via secure link"] } },
    { icon:"doc", iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", title:"Immunization record", sub:"9 vaccines · Ghana EPI", detail:{ title:"Immunization record", sub:"Ghana EPI compliant", rows:[{k:"BCG",v:"Mar 1991"},{k:"Yellow fever",v:"Aug 1992 · lifetime"},{k:"COVID-19",v:"2021 · 3 doses"},{k:"Tetanus",v:"Jan 2024"},{k:"HPV",v:"Not given"}], actions:["Download as PDF","Share with travel clinic"] } },
    { icon:"card", iBg:"color-mix(in oklab,var(--gold-100) 50%,white)", iC:"var(--gold-700)", title:"NHIS insurance card", sub:"Member 23** **** · expires Mar 2027", detail:{ title:"NHIS card", sub:"National Health Insurance · active", rows:[{k:"Member ID",v:"23** ****"},{k:"Status",v:"Active"},{k:"Expires",v:"14 Mar 2027"},{k:"Coverage",v:"Informal sector"}], actions:["Show card on screen","Renew NHIS"] } },
  ];

  return (
    <>
      <MeHdr color="blue" title="Records" stat="Consent · documents · audit trail" onBack={goBack}/>

      <div style={{ padding:"14px 16px", display:"grid", gap:14 }}>
        {/* Consent center */}
        <div>
          <div className="me-section">Consent center</div>
          <div className="me-consent-grid">
            {consents.map((c, i) => (
              <div key={i} className="me-consent-card" onClick={() => c.go ? c.go() : setSheet(c.detail)}>
                <div className="me-consent-num">{c.n} of 6</div>
                <div className="me-consent-title">{c.title}</div>
                <div className="me-consent-sub">{c.sub}</div>
                <div className={`me-consent-chip ${c.chip}`}>{c.chipLabel}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <div className="me-section">Documents</div>
          <div style={{ display:"grid", gap:8 }}>
            {docs.map((d, i) => (
              <div key={i} className="me-doc-card" onClick={() => setSheet(d.detail)}>
                <div className="me-doc-ico" style={{ background:d.iBg }}><Ic2 n={d.icon} s={17} sw={2} c={d.iC}/></div>
                <div className="me-doc-body">
                  <div className="me-doc-title">{d.title}</div>
                  <div className="me-doc-sub">{d.sub}</div>
                </div>
                <Ic2 n="upload" s={15} c="var(--fg-4)"/>
              </div>
            ))}
          </div>
        </div>

        {/* Data portability */}
        <div>
          <div className="me-section">Data & portability</div>
          <div style={{ display:"grid", gap:8 }}>
            {[
              { icon:"upload", iBg:"#f0eeff", iC:"var(--iris-600)", title:"Export my data", sub:"JSON + PDF · sent by email", detail:{ title:"Export your data", sub:"Full portability", body:"Everything Telecheck holds: labs, visits, messages, meds, AI chats, permissions log. JSON + PDF via email link, expires 72h.", rows:[{k:"Estimated size",v:"~8 MB"},{k:"Format",v:"JSON + PDF"},{k:"Delivery",v:"Email link · 72h"}], actions:["Queue export now"] } },
              { icon:"globe",  iBg:"#e8f0fe", iC:"#5b8dee", title:"Share with a hospital", sub:"Korle Bu, 37 Military, private clinics", route:"ShareHospital" },
            ].map((r, i) => (
              <div key={i} className="me-doc-card" onClick={() => r.route ? (goTo && goTo(r.route)) : setSheet(r.detail)}>
                <div className="me-doc-ico" style={{ background:r.iBg }}><Ic2 n={r.icon} s={17} sw={2} c={r.iC}/></div>
                <div className="me-doc-body">
                  <div className="me-doc-title">{r.title}</div>
                  <div className="me-doc-sub">{r.sub}</div>
                </div>
                <Ic2 n="chev" s={16} c="var(--fg-4)"/>
              </div>
            ))}
          </div>
        </div>

        {/* Audit trail */}
        <div>
          <div className="me-section">Audit trail</div>
          <div style={{ display:"grid", gap:8 }}>
            <div className="me-doc-card" onClick={() => nav("audit")}>
              <div className="me-doc-ico" style={{ background:"#f0fdf4" }}><Ic2 n="shield" s={17} sw={2} c="#166534"/></div>
              <div className="me-doc-body">
                <div className="me-doc-title">Access log</div>
                <div className="me-doc-sub">24 events · last 30 days · who touched your record</div>
              </div>
              <span style={{ fontSize:9, fontWeight:700, color:"#166534", background:"#dcfce7", padding:"3px 8px", borderRadius:9999, flexShrink:0 }}>LIVE</span>
            </div>
            <div className="me-doc-card" onClick={() => toast("Audit export queued · check your email")}>
              <div className="me-doc-ico" style={{ background:"#e8f0fe" }}><Ic2 n="doc" s={17} sw={2} c="#5b8dee"/></div>
              <div className="me-doc-body">
                <div className="me-doc-title">Signed audit export</div>
                <div className="me-doc-sub">Merkle-chained · tamper-evident · PDF + JSON</div>
              </div>
              <Ic2 n="upload" s={15} c="var(--fg-4)"/>
            </div>
          </div>
        </div>
      </div>
      {sheet && RDS && <RDS doc={sheet} onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
    </>
  );
}

// ── ACCOUNT ───────────────────────────────────────────────────
function MeAccountV2({ toast, openAI, goBack, goTo }) {
  const [notifs, setNotifs] = React.useState({ meds:true, labs:true, visits:true, ai:true, community:false, offers:false });
  const [lang, setLang] = React.useState("English");
  const [sheet, setSheet] = React.useState(null);
  const SDS = window.SettingsDetailSheet;

  const settingGroups = [
    { label:"Sign in & security", items:[
      { icon:"lock", iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", title:"Change password", sub:"Last changed 84 days ago", route:"ChangePassword" },
      { icon:"shield",  iBg:"#e8f0fe", iC:"#5b8dee", title:"Change app PIN", sub:"4-digit · used as Face ID fallback", detail:{ title:"Change app PIN", sub:"Used when Face ID fails", body:"You'll be asked for your current PIN, then to set and confirm a new 4-digit PIN. Avoid 1234, your year of birth, or repeats.", actions:["Change PIN now"] } },
      { icon:"shield", iBg:"#f0fdf4", iC:"#166534", title:"Two-factor authentication", sub:"On · SMS to +233 ··· 812", detail:{ title:"Two-factor authentication", sub:"On · SMS", rows:[{k:"Method",v:"SMS"},{k:"Number",v:"+233 ··· 812"},{k:"Backup codes",v:"5 of 10 unused"}], actions:["Switch to authenticator app","View backup codes","Turn off 2FA"] } },
      { icon:"phone", iBg:"#f0eeff", iC:"var(--iris-600)", title:"Phone & email", sub:"+233 ··· 812 · ama@mensah.gh", detail:{ title:"Phone & email", sub:"Used for sign-in and 2FA", rows:[{k:"Phone",v:"+233 24 ··· 812"},{k:"Email",v:"ama@mensah.gh"},{k:"Backup phone",v:"None"}], actions:["Change phone","Change email","Add backup phone"] } },
      { icon:"globe", iBg:"#fef3c7", iC:"#b45309", title:"Active sessions", sub:"This phone + 1 tablet (last active 2d ago)", detail:{ title:"Active sessions", sub:"2 devices", rows:[{k:"This phone",v:"iPhone · Accra · now"},{k:"Tablet",v:"iPad · home wifi · 2d ago"},{k:"Last unknown attempt",v:"None in 30d"}], actions:["Sign out other sessions","Sign out everywhere"] } },
    ]},
    { label:"Privacy & data", items:[
      { icon:"eye", iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", title:"Face ID lock", sub:"Required to open app & confirm payments", detail:{ title:"Face ID lock", sub:"On", rows:[{k:"App open",v:"Face ID"},{k:"Confirm prescriptions",v:"Face ID + tap"},{k:"Fallback",v:"4-digit PIN"}], actions:["Change PIN","Turn off Face ID"] } },
      { icon:"users",  iBg:"#f0eeff", iC:"var(--iris-600)", title:"Who sees what", sub:"Granular data sharing per category", detail:{ title:"Data sharing", sub:"Granular by category", rows:[{k:"Medications",v:"Dr. Mensah, Kojo, Mobipharm"},{k:"Labs",v:"Dr. Mensah, Kojo"},{k:"Visit notes",v:"Dr. Mensah only"},{k:"AI chats",v:"Private"},{k:"RPM readings",v:"Dr. Mensah, Nurse Adjoa"}], actions:["Adjust sharing"] } },
    ]},
    { label:"Language & region", items:[
      { icon:"globe", iBg:"#e8f0fe", iC:"#5b8dee", title:"Ghana · English", sub:"Country of care & app language", detail:{ title:"Country of care", sub:"Affects consent, clinicians, pharmacies", rows:[{k:"Country",v:"Ghana"},{k:"Data residency",v:"Accra (Lagos backup)"},{k:"Clinicians",v:"142 verified"},{k:"Language",v:"English (Twi, Ga available)"}], actions:["Request country change"] } },
      { icon:"mic",  iBg:"#f0eeff", iC:"var(--iris-600)", title:"Voice-first mode", sub:"Read screens aloud · dictate replies", detail:{ title:"Voice-first mode", sub:"Twi, English or Ga", body:"Every screen read aloud in your language. Reply by speaking. Designed for older caregivers and low-literacy contexts.", actions:["Turn on voice-first"] } },
    ]},
    { label:"Help & support", items:[
      { icon:"help",  iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", title:"Help center", sub:"120 articles · Ghana-specific", route:"HelpCenter" },
      { icon:"chat",  iBg:"color-mix(in oklab,var(--iris-100) 50%,white)", iC:"var(--iris-600)", title:"Contact support", sub:"Chat · typical reply 10 min", route:"Support" },
      { icon:"flag",  iBg:"#fee2e2", iC:"#c8402f", title:"Report a problem", sub:"AI error, wrong med, safety issue", detail:{ title:"Report a problem", sub:"Safety first · reviewed in 1h", body:"If something feels wrong — an AI answer looked unsafe, medication dispensed incorrectly, or a clinician interaction concerned you — we review safety reports within 1 hour.", actions:["Report an AI error","Report a medication issue","Something else"] } },
    ]},
  ];

  return (
    <>
      <MeHdr color="iris" title="Account" stat="Billing · notifications · privacy" onBack={goBack}/>
      <div style={{ padding:"14px 16px", display:"grid", gap:14 }}>

        {/* Billing */}
        <div>
          <div className="me-section">Plan & billing</div>
          <div className="me-billing-card">
            <div className="me-billing-tag">Active subscription</div>
            <div className="me-billing-name">Diabetes RPM</div>
            <div className="me-billing-sub">GHS 80 / month</div>
            <div className="me-billing-row">
              <span>Next charge <b style={{ color:"var(--fg-1)" }}>20 May</b></span>
              <span>MTN MoMo ···812</span>
            </div>
          </div>
          <div style={{ display:"grid", gap:8 }}>
            {[
              { icon:"card", iBg:"#e8f0fe", iC:"#5b8dee", title:"MTN MoMo · 0*** *** 812", sub:"Default · Ghana Cedi · auto-charge on", detail:{ title:"MTN Mobile Money", sub:"Default", rows:[{k:"Number",v:"0*** *** 812"},{k:"Status",v:"Verified"},{k:"Auto-charge",v:"On · monthly"}], actions:["Set as backup","Remove"] } },
              { icon:"card", iBg:"#f0eeff", iC:"var(--iris-600)", title:"Vodafone Cash · 0*** *** 319", sub:"Backup", detail:{ title:"Vodafone Cash", sub:"Backup", rows:[{k:"Number",v:"0*** *** 319"},{k:"Status",v:"Verified"}], actions:["Make default","Remove"] } },
            ].map((r,i) => (
              <div key={i} className="me-doc-card" onClick={() => setSheet(r.detail)}>
                <div className="me-doc-ico" style={{ background:r.iBg }}><Ic2 n={r.icon} s={17} sw={2} c={r.iC}/></div>
                <div className="me-doc-body"><div className="me-doc-title">{r.title}</div><div className="me-doc-sub">{r.sub}</div></div>
                <Ic2 n="chev" s={16} c="var(--fg-4)"/>
              </div>
            ))}
            <button className="cta g" onClick={() => goTo && goTo("AddPayment")}>+ Add a payment method</button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div className="me-section">Notifications</div>
          <div style={{ display:"grid", gap:8 }}>
            {[
              ["meds","Medication reminders","Doses, refills, pickups"],
              ["labs","Lab updates","New results + AI summaries"],
              ["visits","Visit reminders","Pre-call checks and follow-ups"],
              ["ai","AI nudges","Weekly brief, pattern alerts"],
              ["community","Community","Events, Q&As, groups"],
              ["offers","Offers","Shop promotions"],
            ].map(([k,t,s]) => (
              <div key={k} className="me-notif-row">
                <div>
                  <div className="me-notif-label">{t}</div>
                  <div className="me-notif-sub">{s}</div>
                </div>
                <div className={`me-sw${notifs[k] ? " on" : ""}`} onClick={() => setNotifs(n => ({...n,[k]:!n[k]}))}/>
              </div>
            ))}
          </div>
        </div>

        {/* Language toggle */}
        <div>
          <div className="me-section">Language</div>
          <div style={{ display:"flex", gap:8 }}>
            {["English","Twi","Ga"].map(l => (
              <button key={l} onClick={() => { setLang(l); toast(`Language: ${l}`); }} style={{ flex:1, padding:"10px 6px", borderRadius:11, border:`1px solid ${lang===l?"var(--teal-500)":"var(--border-subtle)"}`, background:lang===l?"var(--teal-500)":"#fff", color:lang===l?"#fff":"var(--fg-2)", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Settings groups */}
        {settingGroups.map((grp, gi) => (
          <div key={gi}>
            <div className="me-section">{grp.label}</div>
            <div style={{ display:"grid", gap:8 }}>
              {grp.items.map((r, ri) => (
                <div key={ri} className="me-setting-row" onClick={() => r.route ? (goTo && goTo(r.route)) : setSheet(r.detail)}>
                  <div className="me-setting-ico" style={{ background:r.iBg }}><Ic2 n={r.icon} s={16} sw={2} c={r.iC}/></div>
                  <div className="me-setting-body">
                    <div className="me-setting-title">{r.title}</div>
                    <div className="me-setting-sub">{r.sub}</div>
                  </div>
                  <Ic2 n="chev" s={16} c="var(--fg-4)"/>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display:"grid", gap:8, marginTop:6 }}>
          <button className="cta g" style={{ color:"#c8402f", borderColor:"color-mix(in oklab,#c8402f 20%,white)" }} onClick={() => setSheet({ title:"Sign out", sub:"You'll need your password to sign back in", body:"Signing out clears your session on this device only — your data stays safe. Family delegates and ongoing visits aren't affected.", actions:["Sign out","Sign out & clear cache","Cancel"] })}>Sign out</button>
          <button className="cta g" style={{ color:"#c8402f", borderColor:"color-mix(in oklab,#c8402f 20%,white)" }} onClick={() => setSheet({ title:"Delete my account", sub:"30-day recovery window", body:"Your record is locked for 30 days, then permanently deleted under Ghana Data Protection Act §28. Active prescriptions and consents are revoked. Family members managing your record will be notified.", rows:[{k:"What happens now",v:"Account locked"},{k:"After 30 days",v:"Record permanently deleted"},{k:"Reversible until",v:"30 May 2026"}], actions:["Continue to delete account","Cancel"] })}>Delete account</button>
        </div>

        <div style={{ padding:"10px 0 4px", textAlign:"center", fontSize:10.5, color:"var(--fg-4)" }}>
          Telecheck v2026.04 · Build 4a2 · Ghana pilot · <span style={{ color:"var(--teal-600)", cursor:"pointer" }} onClick={() => toast("Terms")}>Terms & Privacy</span>
        </div>
      </div>
      {sheet && SDS && <SDS item={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

// ── COMMUNITY ─────────────────────────────────────────────────
function MeCommunityV2({ toast, goBack }) {
  const [evtSheet, setEvtSheet] = React.useState(null);
  const [grpSheet, setGrpSheet] = React.useState(null);
  const EVT = window.EventSheet;
  const SDS = window.SettingsDetailSheet;

  const events = [
    { date:"24", month:"APR", title:"Living with type-2 · expert Q&A", host:"Nurse Adjoa", time:"18:00", going:"42", about:"A 45-minute live session with Nurse Adjoa taking your questions on living well with type-2 diabetes in Accra. Recording available 30 days.", need:[{k:"Join via",v:"Telecheck in-app"},{k:"Cost",v:"Free"},{k:"Language",v:"English + Twi"},{k:"Recorded",v:"Yes · 30 days"}] },
    { date:"30", month:"APR", title:"Ghana Heart Week · free BP screening", host:"Osu clinic · walk-in", time:"08:00–16:00", going:"218", about:"Free BP screening and short consultation. Results auto-sync to your Telecheck record.", need:[{k:"Location",v:"Osu clinic · Oxford St."},{k:"Cost",v:"Free"},{k:"Bring",v:"Ghana ID"},{k:"Duration",v:"~15 min"}] },
    { date:"12", month:"MAY", title:"Cooking for diabetes · live kitchen", host:"Chef Selorm", time:"19:00", going:"87", about:"Live cooking class making waakye, jollof and ampesi variations that fit a diabetic meal plan.", need:[{k:"Join via",v:"Telecheck in-app"},{k:"Cost",v:"GHS 20"},{k:"Duration",v:"90 min"}] },
  ];

  const groups = [
    { icon:"users", iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", title:"Type-2 Ghana", sub:"1,240 members · recipes, evening routines", members:"1,240", detail:{ title:"Type-2 Ghana", sub:"1,240 members · moderated by Nurse Adjoa", body:"Ghana's largest Telecheck community for type-2 diabetes. Focus topics rotate weekly — this week: evening carb swaps.", rows:[{k:"Members",v:"1,240"},{k:"Moderator",v:"Nurse Adjoa"},{k:"This week",v:"Evening carb swaps"}], actions:["Join group","Read guidelines"] } },
    { icon:"users", iBg:"#f0eeff", iC:"var(--iris-600)", title:"Caregivers circle", sub:"380 members · support for family caregivers", members:"380", detail:{ title:"Caregivers circle", sub:"380 members · moderated by Counselor Yaa", body:"A space for people caring for a parent, spouse or child with a chronic condition.", rows:[{k:"Members",v:"380"},{k:"Moderator",v:"Counselor Yaa"},{k:"Focus",v:"Emotional & practical support"}], actions:["Join group","Read guidelines"] } },
    { icon:"heart", iBg:"#fef3c7", iC:"#b45309", title:"Pregnancy · 2nd trimester", sub:"62 members · weekly milestone threads", members:"62", detail:{ title:"Pregnancy · 2nd trimester cohort", sub:"62 members", body:"Small cohort (your due month ±2 weeks) for weekly milestone threads and midwife Q&A.", rows:[{k:"Members",v:"62"},{k:"Moderator",v:"Midwife Akosua"},{k:"Format",v:"Weekly milestone threads"}], actions:["Join group"] } },
  ];

  return (
    <>
      <MeHdr color="gold" title="Community" stat="Events · groups · peer support" onBack={goBack}/>
      <div style={{ padding:"14px 16px", display:"grid", gap:14 }}>
        <div>
          <div className="me-section">Upcoming events</div>
          <div style={{ display:"grid", gap:10 }}>
            {events.map((e, i) => (
              <div key={i} className="me-event-card">
                <div className="me-event-date">
                  <div className="me-event-d">{e.date}</div>
                  <div className="me-event-m">{e.month}</div>
                </div>
                <div className="me-event-body" onClick={() => setEvtSheet(e)}>
                  <div className="me-event-title">{e.title}</div>
                  <div className="me-event-meta">{e.host} · {e.time} · {e.going} going</div>
                </div>
                <button className="me-event-rsvp" onClick={() => toast(`RSVP'd to ${e.title}`)}>RSVP</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="me-section">Groups</div>
          <div style={{ display:"grid", gap:8 }}>
            {groups.map((g, i) => (
              <div key={i} className="me-doc-card" onClick={() => setGrpSheet(g.detail)}>
                <div className="me-doc-ico" style={{ background:g.iBg }}><Ic2 n={g.icon} s={17} sw={2} c={g.iC}/></div>
                <div className="me-doc-body">
                  <div className="me-doc-title">{g.title}</div>
                  <div className="me-doc-sub">{g.sub}</div>
                </div>
                <Ic2 n="chev" s={16} c="var(--fg-4)"/>
              </div>
            ))}
          </div>
        </div>
      </div>
      {evtSheet && EVT && <EVT event={evtSheet} onClose={() => setEvtSheet(null)} toast={toast}/>}
      {grpSheet && SDS && <SDS item={grpSheet} onClose={() => setGrpSheet(null)} toast={toast}/>}
    </>
  );
}

// ── HUB LANDING ───────────────────────────────────────────────
function MeHubV2({ nav, toast, goTo, delegate }) {
  const name = delegate === "k" ? "Kofi Mensah" : delegate === "abena" ? "Abena Mensah" : "Ama Mensah";
  const initials = delegate === "k" ? "KO" : delegate === "abena" ? "AB" : "AM";
  const sub = delegate === "k" ? "Dad · 68 · Hypertension" : delegate === "abena" ? "Daughter · 8" : "34 · Osu, Accra";

  return (
    <>
      {window.HubBackBar && <window.HubBackBar/>}
      <div className="me-hero">
        <div className="me-identity">
          <div className="me-av">{initials}</div>
          <div>
            <div className="me-name">{name}</div>
            <div className="me-loc">{sub}</div>
            <div className="me-badge">✓ Ghana ID verified</div>
          </div>
        </div>
        <div className="me-health">
          <div className="me-health-cell">
            <div className="me-health-val">O+</div>
            <div className="me-health-lbl">Blood type</div>
          </div>
          <div className="me-health-cell">
            <div className="me-health-val">2</div>
            <div className="me-health-lbl">Conditions</div>
            <div className="me-health-sub">Type-2 · HTN</div>
          </div>
          <div className="me-health-cell">
            <div className="me-health-val">3</div>
            <div className="me-health-lbl">Medications</div>
            <div className="me-health-sub">1 refill pending</div>
          </div>
        </div>
      </div>

      <div className="me-cards">
        {/* Profile — full-width primary */}
        <div className="me-prime" onClick={() => goTo("Profile")}>
          <div className="me-prime-stripe" style={{ background:"var(--teal-500)" }}/>
          <div className="me-prime-ico" style={{ background:"color-mix(in oklab,var(--teal-500) 12%,white)" }}>
            <Ic2 n="user" s={19} sw={2} c="var(--teal-700)"/>
          </div>
          <div className="me-prime-body">
            <div className="me-prime-section">Profile</div>
            <div className="me-prime-title">Identity · health · family</div>
            <div className="me-prime-sub">3 family delegates · emergency card</div>
          </div>
          <Ic2 n="chev" s={16} c="var(--fg-4)" style={{ marginRight:14 }}/>
        </div>

        {/* 2×2 grid */}
        <div className="me-grid">
          {/* Records */}
          <div className="me-mini" onClick={() => goTo("Records")}>
            <div className="me-mini-top">
              <div className="me-mini-ico" style={{ background:"#e8f0fe" }}>
                <Ic2 n="shield" s={14} sw={2} c="#5b8dee"/>
              </div>
              <span style={{ fontSize:8.5, fontWeight:700, color:"#166534", background:"#dcfce7", padding:"2px 6px", borderRadius:9999 }}>6/6</span>
            </div>
            <div>
              <div className="me-mini-section">Records</div>
              <div className="me-mini-val" style={{ fontSize:15 }}>Consent</div>
              <div className="me-mini-lbl">All 6 granted</div>
            </div>
          </div>

          {/* Account */}
          <div className="me-mini" onClick={() => goTo("Account")}>
            <div className="me-mini-top">
              <div className="me-mini-ico" style={{ background:"color-mix(in oklab,var(--iris-100) 50%,white)" }}>
                <Ic2 n="gear" s={14} sw={2} c="var(--iris-600)"/>
              </div>
              <span style={{ fontSize:8.5, fontWeight:700, color:"var(--iris-700)", background:"color-mix(in oklab,var(--iris-100) 50%,white)", padding:"2px 6px", borderRadius:9999 }}>ACTIVE</span>
            </div>
            <div>
              <div className="me-mini-section">Account</div>
              <div className="me-mini-val" style={{ fontSize:15 }}>RPM</div>
              <div className="me-mini-lbl">GHS 80 / mo</div>
            </div>
          </div>

          {/* Community */}
          <div className="me-mini" onClick={() => goTo("Community")}>
            <div className="me-mini-top">
              <div className="me-mini-ico" style={{ background:"color-mix(in oklab,var(--gold-100) 50%,white)" }}>
                <Ic2 n="users" s={14} sw={2} c="var(--gold-700)"/>
              </div>
              <span style={{ fontSize:8.5, fontWeight:700, color:"#b45309", background:"#fef3c7", padding:"2px 6px", borderRadius:9999 }}>THU</span>
            </div>
            <div>
              <div className="me-mini-section">Community</div>
              <div className="me-mini-val" style={{ fontSize:15 }}>Q&A</div>
              <div className="me-mini-lbl">Type-2 · 18:00</div>
            </div>
          </div>

          {/* Data & audit */}
          <div className="me-mini" onClick={() => goTo("Records")}>
            <div className="me-mini-top">
              <div className="me-mini-ico" style={{ background:"#f0fdf4" }}>
                <Ic2 n="doc" s={14} sw={2} c="#166534"/>
              </div>
              <Ic2 n="chev" s={13} c="var(--fg-4)"/>
            </div>
            <div>
              <div className="me-mini-section">Audit</div>
              <div className="me-mini-val" style={{ fontSize:15 }}>24</div>
              <div className="me-mini-lbl">Events · 30 days</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── MeV2 OVERRIDE ─────────────────────────────────────────────
function MeV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI,
  openEpisodeConsent, openEpisodeActive, episodeActive,
  sub = "Hub", setSub }) {

  const goTo   = (s) => setSub(s);
  const goBack = ()  => setSub("Hub");

  const inner = (() => {
    switch (sub) {
      case "Profile":   return <MeProfileV2   nav={nav} toast={toast} goBack={goBack} goTo={goTo}/>;
      case "Records":   return <MeRecordsV2   nav={nav} toast={toast} goBack={goBack} goTo={goTo} openEpisodeConsent={openEpisodeConsent} openEpisodeActive={openEpisodeActive} episodeActive={episodeActive}/>;
      case "Account":   return <MeAccountV2   toast={toast} openAI={openAI} goBack={goBack} goTo={goTo}/>;
      case "Community": return <MeCommunityV2 toast={toast} goBack={goBack}/>;
      case "InviteFamily":     return <window.InviteFamily       onBack={() => goTo("Profile")} toast={toast}/>;
      case "ShareHospital":    return <window.ShareWithHospital  onBack={() => goTo("Records")} toast={toast}/>;
      case "AddPayment":       return <window.AddPaymentMethod   onBack={() => goTo("Account")} toast={toast}/>;
      case "ChangePassword":   return <window.ChangePasswordScreen onBack={() => goTo("Account")} toast={toast}/>;
      case "HelpCenter":       return <window.HelpCenter         onBack={() => goTo("Account")} onContact={() => goTo("Support")}/>;
      case "Support":          return <window.SupportChat        onBack={() => goTo("HelpCenter")} toast={toast}/>;
      default:          return <MeHubV2       nav={nav} toast={toast} goTo={goTo} delegate={delegate}/>;
    }
  })();

  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">{inner}</div>
      <TabBar2 active="me" onTab={nav} care={2}/>
    </div>
  );
}
