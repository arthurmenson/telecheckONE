// ─────────────────────────────────────────────────────────────────
// Labs Page — Clean Redesign v2
// Dashboard (category cards) → Category detail · Trends · Upload
// · AI Review · Medical Reports
// ─────────────────────────────────────────────────────────────────

(function injectLabStyles2() {
  const old = document.getElementById("lb-styles");
  if (old) old.remove();
  const s = document.createElement("style");
  s.id = "lb-styles";
  s.textContent = `
    /* ── Hub hero ─────────────────────────────────────────── */
    .lb-hero {
      padding: 20px 18px 18px;
      background:
        radial-gradient(ellipse at 110% -10%, color-mix(in oklab,var(--gold-400) 28%,transparent) 0%, transparent 52%),
        radial-gradient(ellipse at -10% 110%, color-mix(in oklab,var(--teal-200) 40%,transparent) 0%, transparent 52%),
        linear-gradient(160deg, color-mix(in oklab,var(--gold-100) 55%,white), white 78%);
      border-bottom: 1px solid rgba(194,131,32,.12);
    }
    .lb-eyebrow  { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold-700); margin-bottom:3px; }
    .lb-hero-h   { font-size:23px; font-weight:700; letter-spacing:-.02em; margin:0 0 2px; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .lb-hero-sub { font-size:12px; color:var(--fg-3); margin-bottom:14px; }

    /* ── Flag strip ────────────────────────────────────────── */
    .lb-flag-strip {
      display:flex; flex-direction:column; gap:7px;
    }
    .lb-flag {
      display:flex; align-items:center; gap:10px;
      background:#fff; border-radius:13px; padding:10px 13px;
      border-left:3px solid; cursor:pointer;
    }
    .lb-flag-ico   { width:28px; height:28px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .lb-flag-body  { flex:1; min-width:0; }
    .lb-flag-title { font-size:13px; font-weight:600; color:var(--fg-1); }
    .lb-flag-sub   { font-size:11px; color:var(--fg-3); margin-top:2px; }
    .lb-flag-right { text-align:right; flex-shrink:0; }
    .lb-flag-val   { font-size:16px; font-weight:700; font-variant-numeric:tabular-nums; }
    .lb-flag-chip  { font-size:8.5px; font-weight:700; padding:2px 7px; border-radius:9999px; display:inline-block; margin-top:3px; }
    .lb-flag-chip.warn { background:#fef3c7; color:#b45309; }
    .lb-flag-chip.bad  { background:#fee2e2; color:#b91c1c; }
    .lb-flag-chip.lo   { background:#e8f0fe; color:#1a56db; }

    /* ── Category cards ────────────────────────────────────── */
    .lb-cat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .lb-cat-card {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
      box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
      position:relative; overflow:hidden;
    }
    .lb-cat-card:active { transform:scale(.98); }
    .lb-cat-card-stripe { position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
    .lb-cat-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .lb-cat-ico    { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .lb-cat-count  { font-size:10px; font-weight:700; color:var(--fg-4); }
    .lb-cat-name   { font-size:9.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--fg-4); margin-bottom:4px; }
    .lb-cat-val    { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); line-height:1; }
    .lb-cat-sub    { font-size:10.5px; color:var(--fg-3); margin-top:3px; }
    .lb-cat-chip   { display:inline-block; font-size:8.5px; font-weight:700; padding:2px 7px; border-radius:9999px; margin-top:7px; }
    .lb-cat-chip.ok   { background:#dcfce7; color:#166534; }
    .lb-cat-chip.warn { background:#fef3c7; color:#b45309; }
    .lb-cat-chip.bad  { background:#fee2e2; color:#b91c1c; }
    .lb-cat-chip.lo   { background:#e8f0fe; color:#1a56db; }
    .lb-cat-chip.pend { background:var(--n-100); color:var(--fg-3); }

    /* ── Quick action row ──────────────────────────────────── */
    .lb-quick { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .lb-quick-btn {
      display:flex; flex-direction:column; align-items:center; gap:6px;
      padding:12px 6px; background:#fff; border-radius:12px;
      border:1px solid rgba(0,0,0,.05); cursor:pointer;
    }
    .lb-quick-ico { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
    .lb-quick-lbl { font-size:10px; font-weight:600; color:var(--fg-2); text-align:center; line-height:1.2; }

    /* ── Inner page header ─────────────────────────────────── */
    .lb-hdr { padding:10px 16px 14px; border-bottom:1px solid var(--border-subtle); display:flex; flex-direction:column; }
    .lb-hdr-back { display:flex; align-items:center; gap:4px; background:none; border:0; font-size:12px; font-weight:500; color:var(--fg-3); padding:4px 0 8px; cursor:pointer; font-family:inherit; align-self:flex-start; }
    .lb-hdr-row  { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
    .lb-hdr-title { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .lb-hdr-stat  { font-size:12px; color:var(--fg-3); margin-top:2px; }

    /* ── Result rows in category detail ───────────────────── */
    .lb-result {
      display:flex; gap:0; align-items:stretch; background:#fff;
      border-radius:14px; overflow:hidden; border:1px solid rgba(0,0,0,.05);
      cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .1s;
    }
    .lb-result:active { transform:scale(.99); }
    .lb-result-bar      { width:4px; flex-shrink:0; }
    .lb-result-bar.ok   { background:#2a8a4a; }
    .lb-result-bar.warn { background:#c28320; }
    .lb-result-bar.bad  { background:#c8402f; }
    .lb-result-bar.lo   { background:#2b6cb0; }
    .lb-result-bar.pend { background:var(--n-300); }
    .lb-result-body     { flex:1; padding:12px 13px; min-width:0; }
    .lb-result-title    { font-size:13.5px; font-weight:600; color:var(--fg-1); }
    .lb-result-sub      { font-size:11px; color:var(--fg-3); margin-top:2px; }
    .lb-result-tags     { display:flex; gap:5px; flex-wrap:wrap; margin-top:6px; }
    .lb-result-chip     { font-size:8.5px; font-weight:700; padding:2px 7px; border-radius:9999px; }
    .lb-result-chip.ok    { background:#dcfce7; color:#166534; }
    .lb-result-chip.warn  { background:#fef3c7; color:#b45309; }
    .lb-result-chip.bad   { background:#fee2e2; color:#b91c1c; }
    .lb-result-chip.lo    { background:#e8f0fe; color:#1a56db; }
    .lb-result-chip.pend  { background:var(--n-100); color:var(--fg-3); }
    .lb-result-chip.rev   { background:color-mix(in oklab,var(--teal-100) 55%,white); color:var(--teal-700); }
    .lb-result-chip.ai    { background:color-mix(in oklab,var(--iris-100) 55%,white); color:var(--iris-700); }
    .lb-result-right    { padding:12px 13px 12px 0; display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between; flex-shrink:0; }
    .lb-result-val      { font-size:18px; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums; line-height:1; }
    .lb-result-unit     { font-size:10px; color:var(--fg-4); margin-top:2px; }
    .lb-result-date     { font-size:10.5px; color:var(--fg-4); margin-top:6px; }

    /* ── Trend charts ──────────────────────────────────────── */
    .lb-chart-card { background:#fff; border-radius:14px; padding:14px 14px 10px; border:1px solid rgba(0,0,0,.05); cursor:pointer; }
    .lb-chart-hd   { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .lb-chart-name { font-size:13px; font-weight:700; color:var(--fg-1); }
    .lb-chart-big  { font-size:22px; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
    .lb-chart-axis { display:flex; justify-content:space-between; font-size:9px; color:var(--fg-4); margin-top:5px; }
    .lb-chart-foot { display:flex; justify-content:space-between; margin-top:8px; font-size:11px; color:var(--fg-3); padding-top:8px; border-top:1px solid rgba(0,0,0,.05); }

    /* ── Upload drop ───────────────────────────────────────── */
    .lb-drop { border:2px dashed var(--border-strong); border-radius:16px; background:var(--surface-1); padding:28px 20px; text-align:center; cursor:pointer; }
    .lb-drop-ico { width:52px; height:52px; border-radius:14px; background:color-mix(in oklab,var(--gold-100) 60%,white); margin:0 auto 12px; display:flex; align-items:center; justify-content:center; }
    .lb-drop-t   { font-size:14px; font-weight:700; color:var(--fg-1); }
    .lb-drop-s   { font-size:12px; color:var(--fg-3); margin-top:4px; line-height:1.45; }

    /* ── Medical Reports ───────────────────────────────────── */
    .lb-report-card {
      background:#fff; border-radius:14px; padding:14px;
      border:1px solid rgba(0,0,0,.05); box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .lb-report-tag   { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--iris-600); margin-bottom:5px; display:flex; align-items:center; gap:5px; }
    .lb-report-title { font-size:14px; font-weight:700; color:var(--fg-1); letter-spacing:-.01em; margin-bottom:3px; }
    .lb-report-sub   { font-size:11.5px; color:var(--fg-3); line-height:1.4; margin-bottom:10px; }
    .lb-report-meta  { display:flex; gap:6px; flex-wrap:wrap; }
    .lb-report-pill  { font-size:9.5px; font-weight:600; padding:3px 8px; border-radius:9999px; background:var(--n-50); color:var(--fg-3); border:1px solid var(--border-subtle); }
    .lb-report-actions { display:flex; gap:8px; margin-top:12px; }
    .lb-report-dl    { flex:1; padding:8px; border-radius:9px; background:var(--fg-1); color:#fff; border:0; font-family:inherit; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; }
    .lb-report-share { flex:1; padding:8px; border-radius:9px; background:var(--n-50); color:var(--fg-2); border:1px solid var(--border-subtle); font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; }

    .lb-ai-gen {
      background:linear-gradient(150deg,color-mix(in oklab,var(--iris-50) 55%,white),white);
      border-radius:14px; padding:14px; border:1px solid color-mix(in oklab,var(--iris-200) 35%,transparent);
      cursor:pointer;
    }
    .lb-ai-gen-tag   { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--iris-600); margin-bottom:5px; display:flex; align-items:center; gap:5px; }
    .lb-ai-gen-title { font-size:13.5px; font-weight:600; color:var(--fg-1); margin-bottom:4px; }
    .lb-ai-gen-sub   { font-size:12px; color:var(--fg-2); line-height:1.45; margin-bottom:12px; }

    /* Section label */
    .lb-section { font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--fg-4); margin-bottom:8px; padding-top:4px; }

    /* ── Print layout ──────────────────────────────────────── */
    @media print {
      body * { visibility:hidden; }
      #lb-print-report, #lb-print-report * { visibility:visible; }
      #lb-print-report {
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:#fff; padding:32px 36px;
        font-family:'Space Grotesk',sans-serif; font-size:11px; color:#1a1a1a; z-index:99999;
      }
      .lb-pr-header { border-bottom:2px solid #1a1a1a; padding-bottom:12px; margin-bottom:18px; }
      .lb-pr-logo   { font-size:18px; font-weight:700; letter-spacing:-.02em; }
      .lb-pr-meta   { display:flex; justify-content:space-between; font-size:10px; color:#555; margin-top:4px; }
      .lb-pr-cat    { margin-bottom:20px; break-inside:avoid; }
      .lb-pr-cat-h  { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; border-bottom:1px solid #ddd; padding-bottom:5px; margin-bottom:8px; color:#444; }
      .lb-pr-row    { display:grid; grid-template-columns:2fr 1fr 1fr 2fr; gap:6px; padding:5px 0; border-bottom:1px solid #f0f0f0; font-size:10.5px; }
      .lb-pr-row .lbl { color:#333; font-weight:500; }
      .lb-pr-row .val { font-weight:700; }
      .lb-pr-row .stat.ok   { color:#166534; font-weight:700; }
      .lb-pr-row .stat.warn { color:#b45309; font-weight:700; }
      .lb-pr-row .stat.bad  { color:#b91c1c; font-weight:700; }
      .lb-pr-row .stat.lo   { color:#1a56db; font-weight:700; }
      .lb-pr-row .date { color:#888; }
      .lb-pr-note { font-size:9px; color:#888; margin-top:16px; border-top:1px solid #eee; padding-top:8px; }
    }
  `;
  document.head.appendChild(s);
})();

// ── Data ──────────────────────────────────────────────────────
const LAB_CATS = [
  { id:"Infection",  label:"Infection",  ico:"shield",  color:"#c8402f", bg:"#fee2e2",
    latest:"Typhoid +", sub:"Widal · 08 Apr", chip:"bad",
    results:[
      { id:"typhoid",   title:"Typhoid · Widal",              val:"1:160", unit:"H ag",   status:"bad",  statusLabel:"↑ Positive",     date:"08 Apr", reviewed:true,  result:{ title:"Typhoid Widal · 08 Apr 2026", sub:"Mobilabs Osu · Dr. Mensah reviewed", tone:"info", flagLabel:"POSITIVE H ANTIGEN", value:"1:160", target:"< 1:80 negative", delta:"Positive titre", values:[{k:"H antigen",v:"1:160",flag:"hi"},{k:"O antigen",v:"1:40",flag:"ok"},{k:"Cut-off",v:"≥ 1:80"}], summary:"H antigen titre 1:160 is above the positive cut-off — suggests typhoid infection or recent exposure.", signedBy:"SIGNED OFF · DR. MENSAH · 08 APR 11:05", clinicianNote:"Starting ciprofloxacin 500mg BD for 7 days. Rest, hydration. Re-check in 2 weeks." }},
      { id:"malaria",   title:"Malaria RDT",                  val:"NEG",   unit:"",        status:"ok",   statusLabel:"✓ Negative",     date:"08 Apr", reviewed:true,  result:{ title:"Malaria RDT · 08 Apr 2026", sub:"Rapid antigen test · reviewed", tone:"teal", flagLabel:"NEGATIVE", value:"NEG", target:"Negative", delta:"No change", values:[{k:"P. falciparum",v:"Negative",flag:"ok"},{k:"P. vivax",v:"Negative",flag:"ok"}], summary:"Rapid malaria antigen test is negative. No antimalarial treatment needed.", signedBy:"SIGNED OFF · DR. MENSAH · 08 APR 10:22", clinicianNote:"RDT negative. Return if fever persists beyond 48h." }},
      { id:"hepb",      title:"Hepatitis B surface antigen",   val:"NEG",   unit:"HBsAg",  status:"ok",   statusLabel:"✓ Non-reactive", date:"08 Apr", reviewed:true,  result:{ title:"Hepatitis B · 08 Apr 2026", sub:"HBsAg screening", tone:"teal", flagLabel:"NON-REACTIVE", value:"NEG", target:"Non-reactive", delta:"No change", values:[{k:"HBsAg",v:"Non-reactive",flag:"ok"}], summary:"No active HBV infection. Consider vaccination if not previously done.", signedBy:"SIGNED OFF · DR. MENSAH · 08 APR 11:07", clinicianNote:"Consider HBV vaccine." }},
      { id:"malaria-f", title:"Malaria thick film",            val:"NEG",   unit:"",        status:"ok",   statusLabel:"✓ Negative",     date:"15 Feb", reviewed:true,  result:{ title:"Malaria thick film · 15 Feb 2026", sub:"Microscopy", tone:"teal", flagLabel:"NEGATIVE", value:"NEG", target:"No parasites", delta:"No change", values:[{k:"P. falciparum",v:"Not seen",flag:"ok"},{k:"P. vivax",v:"Not seen",flag:"ok"},{k:"Parasitaemia",v:"0%",flag:"ok"}], summary:"No malaria parasites found on thick film.", signedBy:"SIGNED OFF · DR. MENSAH · 15 FEB 09:44", clinicianNote:"Negative. Fever was likely viral." }},
      { id:"hiv",       title:"HIV rapid test",                val:"NR",    unit:"",        status:"ok",   statusLabel:"✓ Non-reactive", date:"15 Feb", reviewed:true,  result:{ title:"HIV rapid test · 15 Feb 2026", sub:"Confidential result", tone:"teal", flagLabel:"NON-REACTIVE", value:"NR", target:"Non-reactive", delta:"No change", values:[{k:"HIV-1/2 antibody",v:"Non-reactive",flag:"ok"}], summary:"HIV antibody test non-reactive. Annual testing recommended.", signedBy:"SIGNED OFF · DR. MENSAH · 15 FEB 09:46", clinicianNote:"Non-reactive. Annual test recommended." }},
    ]},
  { id:"Metabolic", label:"Metabolic", ico:"lab",    color:"#c28320", bg:"#fef3c7",
    latest:"HbA1c 7.8%", sub:"Fasting glucose 132 · 14 Apr", chip:"warn",
    results:[
      { id:"hba1c",   title:"HbA1c",            val:"7.8",  unit:"%",      status:"warn", statusLabel:"↑ Elevated",    date:"14 Apr", reviewed:true, result:{ title:"HbA1c · 14 Apr 2026", sub:"Mobilabs Osu · Dr. Mensah", tone:"gold", flagLabel:"SLIGHTLY ELEVATED", value:"7.8 %", target:"< 7.0%", delta:"+0.2 vs Feb", values:[{k:"HbA1c",v:"7.8 %",flag:"hi"},{k:"Est. avg glucose",v:"178 mg/dL",flag:"hi"},{k:"Fasting glucose",v:"132 mg/dL",flag:"hi"},{k:"Reference",v:"4.0–5.6 %"}], summary:"7.8% means running higher than target. Evening metformin timing for 6 weeks.", signedBy:"SIGNED OFF · DR. MENSAH · 14 APR 08:12", clinicianNote:"500mg metformin with dinner, 6 weeks, then re-check." }},
      { id:"hba1c-f", title:"HbA1c",            val:"7.6",  unit:"%",      status:"warn", statusLabel:"↑ Elevated",    date:"28 Feb", reviewed:true, result:{ title:"HbA1c · 28 Feb 2026", sub:"Mobilabs Osu", tone:"gold", flagLabel:"ELEVATED", value:"7.6 %", target:"< 7.0%", delta:"-0.2 vs Jan", values:[{k:"HbA1c",v:"7.6 %",flag:"hi"},{k:"Est. avg glucose",v:"171 mg/dL",flag:"hi"}], summary:"Improving trend. Evening metformin timing working.", signedBy:"SIGNED OFF · DR. MENSAH · 28 FEB", clinicianNote:"Good progress." }},
    ]},
  { id:"Kidney",    label:"Kidney & Liver", ico:"heart",  color:"#2a8a4a", bg:"#f0fdf4",
    latest:"eGFR 94", sub:"Creatinine 0.9 · 14 Apr", chip:"ok",
    results:[
      { id:"kidney", title:"Kidney panel",       val:"94",   unit:"mL/min", status:"ok",   statusLabel:"✓ Normal",       date:"14 Apr", reviewed:true, result:{ title:"Kidney panel · 14 Apr 2026", sub:"All values normal", tone:"iris", flagLabel:"NORMAL", value:"94", target:"eGFR > 60", delta:"Stable", values:[{k:"eGFR",v:"94 mL/min",flag:"ok"},{k:"Creatinine",v:"0.9 mg/dL",flag:"ok"},{k:"BUN",v:"14 mg/dL",flag:"ok"},{k:"Potassium",v:"4.1 mmol/L",flag:"ok"}], summary:"Kidney function healthy. eGFR 94 means kidneys are filtering well.", signedBy:"SIGNED OFF · DR. MENSAH · 14 APR 08:14", clinicianNote:"Kidneys look great." }},
    ]},
  { id:"Lipids",    label:"Lipids",         ico:"trend",  color:"#5b8dee", bg:"#e8f0fe",
    latest:"LDL 142", sub:"HDL 48 · 28 Feb", chip:"warn",
    results:[
      { id:"lipid", title:"Lipid panel",         val:"142",  unit:"mg/dL",  status:"warn", statusLabel:"↑ Borderline",  date:"28 Feb", reviewed:true, result:{ title:"Lipid panel · 28 Feb 2026", sub:"LDL borderline", tone:"info", flagLabel:"BORDERLINE", value:"LDL 142", target:"< 130 mg/dL", delta:"+14 vs Nov", values:[{k:"Total cholesterol",v:"210 mg/dL",flag:"hi"},{k:"LDL",v:"142 mg/dL",flag:"hi"},{k:"HDL",v:"48 mg/dL",flag:"ok"},{k:"Triglycerides",v:"148 mg/dL",flag:"ok"}], summary:"LDL borderline high. Diet-first approach, revisit in 3 months.", signedBy:"SIGNED OFF · DR. MENSAH · 28 FEB 11:02", clinicianNote:"2 fish meals per week." }},
    ]},
  { id:"Blood",     label:"Blood count",    ico:"bolt",   color:"#7c6fcd", bg:"#f0eeff",
    latest:"Hb 11.2", sub:"WBC normal · 28 Feb", chip:"lo",
    results:[
      { id:"cbc",   title:"Complete blood count", val:"11.2", unit:"g/dL",  status:"lo",   statusLabel:"↓ Slightly low", date:"28 Feb", reviewed:true, result:{ title:"CBC · 28 Feb 2026", sub:"Hb slightly low", tone:"teal", flagLabel:"MOSTLY NORMAL", value:"Hb 11.2", target:"12.0–15.5 g/dL", delta:"Slightly low", values:[{k:"Haemoglobin",v:"11.2 g/dL",flag:"lo"},{k:"WBC",v:"6.4 × 10⁹/L",flag:"ok"},{k:"Platelets",v:"244 × 10⁹/L",flag:"ok"}], summary:"Mild anaemia — likely iron deficiency. Leafy greens or supplement.", signedBy:"SIGNED OFF · NURSE ADJOA · 28 FEB 14:40", clinicianNote:"Try leafy greens, palm nut soup, beans." }},
    ]},
  { id:"Thyroid",   label:"Thyroid",        ico:"dna",    color:"#6b7280", bg:"var(--n-100)",
    latest:"TSH 1.9", sub:"AI only · pending review", chip:"pend",
    results:[
      { id:"thyroid-p", title:"Thyroid panel",   val:"1.9",  unit:"mIU/L",  status:"pend", statusLabel:"Pending review", date:"20 Apr", reviewed:false, result:{ title:"Thyroid panel · 20 Apr 2026", sub:"AI interpretation only — awaiting Dr. Mensah", tone:"iris", flagLabel:"AI INTERPRETATION ONLY", value:"TSH 1.9", target:"0.4–4.0 mIU/L", delta:"Normal range", values:[{k:"TSH",v:"1.9 mIU/L",flag:"ok"},{k:"Free T4",v:"1.3 ng/dL",flag:"ok"},{k:"Free T3",v:"3.1 pg/mL",flag:"ok"}], summary:"All thyroid values in normal range per AI read. Clinician review pending." }},
    ]},
];

const FLAGGED_RESULTS = LAB_CATS.flatMap(c => c.results.filter(r => r.status !== "ok"));
window.LAB_CATS = LAB_CATS;

// ── Print ─────────────────────────────────────────────────────
function LabPrintReport() {
  const [rows, setRows] = React.useState([]);
  const [meta, setMeta] = React.useState({});
  React.useEffect(() => {
    window.__lbSetPrintData = (r, m) => { setRows(r); setMeta(m); };
    return () => { delete window.__lbSetPrintData; };
  }, []);
  const groups = rows.reduce((a, r) => { const k = r.cat || "Other"; if (!a[k]) a[k] = []; a[k].push(r); return a; }, {});
  return (
    <div id="lb-print-report" style={{ display:"none" }}>
      <div className="lb-pr-header">
        <div className="lb-pr-logo">Telecheck · {meta.title || "Lab Report"}</div>
        <div className="lb-pr-meta"><span>Patient: Ama Mensah · Accra, Ghana</span><span>Generated: {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</span></div>
        <div className="lb-pr-meta" style={{ marginTop:2 }}><span>Clinician: Dr. Akosua Mensah · GMA-2019-1847</span><span>{meta.subtitle || ""}</span></div>
      </div>
      {Object.entries(groups).map(([cat, catRows], i) => (
        <div key={i} className="lb-pr-cat">
          <div className="lb-pr-cat-h">{cat}</div>
          <div className="lb-pr-row" style={{ fontWeight:700, fontSize:9, color:"#888", borderBottom:"1px solid #ccc" }}><span>Test</span><span>Result</span><span>Status</span><span>Date</span></div>
          {catRows.map((r, j) => (
            <div key={j} className="lb-pr-row">
              <span className="lbl">{r.title}</span>
              <span className="val">{r.val}{r.unit ? " " + r.unit : ""}</span>
              <span className={`stat ${r.status}`}>{r.statusLabel}</span>
              <span className="date">{r.date} 2026</span>
            </div>
          ))}
        </div>
      ))}
      <div className="lb-pr-note">Results reviewed by a licensed clinician unless marked pending. Telecheck is not a diagnostic service — interpret with your clinician.</div>
    </div>
  );
}

function triggerPDF(rows, meta) {
  const flat = rows.map(r => ({ ...r, cat: LAB_CATS.find(c => c.results.some(x => x.id === r.id))?.label || "Other" }));
  if (window.__lbSetPrintData) window.__lbSetPrintData(flat, meta || {});
  const el = document.getElementById("lb-print-report");
  if (el) el.style.display = "block";
  setTimeout(() => { window.print(); setTimeout(() => { if (el) el.style.display = "none"; }, 500); }, 150);
}

// ── Shared header ─────────────────────────────────────────────
function LabsHdr({ color, title, stat, onBack, right }) {
  const bgs = {
    gold:  "linear-gradient(150deg,color-mix(in oklab,var(--gold-400) 18%,white),color-mix(in oklab,var(--gold-100) 32%,white))",
    iris:  "linear-gradient(150deg,color-mix(in oklab,var(--iris-400) 13%,white),color-mix(in oklab,var(--iris-100) 24%,white))",
    teal:  "linear-gradient(150deg,color-mix(in oklab,var(--teal-400) 15%,white),color-mix(in oklab,var(--teal-100) 28%,white))",
    red:   "linear-gradient(150deg,color-mix(in oklab,#c8402f 12%,white),color-mix(in oklab,#c8402f 20%,white))",
    blue:  "linear-gradient(150deg,color-mix(in oklab,#5b8dee 12%,white),color-mix(in oklab,#5b8dee 20%,white))",
    green: "linear-gradient(150deg,color-mix(in oklab,#2a8a4a 12%,white),color-mix(in oklab,#2a8a4a 20%,white))",
    gray:  "linear-gradient(150deg,var(--n-50),var(--n-25,#fafafa))",
  };
  const backLabel = window.__tcOrigin || "Labs";
  const handleBack = () => {
    const origin = window.__tcOrigin;
    window.__tcOrigin = null;
    if (origin === "Home" && window.__tcNav) { window.__tcNav("home"); return; }
    onBack();
  };
  return (
    <div className="lb-hdr" style={{ background: bgs[color] || bgs.gold }}>
      <button className="lb-hdr-back" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        {backLabel}
      </button>
      <div className="lb-hdr-row">
        <div>
          <div className="lb-hdr-title">{title}</div>
          {stat && <div className="lb-hdr-stat">{stat}</div>}
        </div>
        {right && <div style={{ flexShrink:0, paddingTop:4 }}>{right}</div>}
      </div>
    </div>
  );
}

// ── CATEGORY DETAIL ───────────────────────────────────────────
function LabCatDetail({ catId, goBack, nav, toast, overrideResults, overrideTitle, overrideStat }) {
  const [sheet, setSheet] = React.useState(null);
  const cat = LAB_CATS.find(c => c.id === catId);
  const results = overrideResults || cat?.results || [];
  const title = overrideTitle || cat?.label || catId;
  const stat = overrideStat || (results.length + " result" + (results.length !== 1 ? "s" : "") + " · latest " + (results[0]?.date || ""));
  const colorMap = { Infection:"red", Metabolic:"gold", Kidney:"green", Lipids:"blue", Blood:"iris", Thyroid:"gray" };
  const color = overrideResults ? "gold" : (colorMap[catId] || "gold");
  const allRows = results.map(r => ({ ...r, cat: LAB_CATS.find(c => c.results.some(x => x.id === r.id))?.label || title }));
  return (
    <>
      <LabsHdr color={color} title={title} stat={stat} onBack={goBack}
        right={
          <button onClick={() => triggerPDF(allRows, { title: title + " Report", subtitle: results.length + " results" })}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:9, background:"var(--fg-1)", color:"#fff", border:0, fontFamily:"inherit", fontSize:11, fontWeight:700, cursor:"pointer" }}>
            <Ic2 n="upload" s={13} c="#fff"/> PDF
          </button>
        }/>
      <div style={{ padding:"14px 16px", display:"grid", gap:8 }}>
        {results.map(r => (
          <div key={r.id} className="lb-result" onClick={() => setSheet(r.result)}>
            <div className={`lb-result-bar ${r.status}`}/>
            <div className="lb-result-body">
              <div className="lb-result-title">{r.title}</div>
              <div className="lb-result-sub">{r.sub || cat.label}</div>
              <div className="lb-result-tags">
                <span className={`lb-result-chip ${r.status}`}>{r.statusLabel}</span>
                <span className={`lb-result-chip ${r.reviewed ? "rev" : "ai"}`}>{r.reviewed ? "✓ Reviewed" : "AI only"}</span>
              </div>
            </div>
            <div className="lb-result-right">
              <div>
                <div className="lb-result-val" style={{ color: r.status==="warn"?"#c28320":r.status==="bad"?"#c8402f":r.status==="lo"?"#2b6cb0":"var(--fg-1)" }}>{r.val}</div>
                <div className="lb-result-unit">{r.unit}</div>
              </div>
              <div className="lb-result-date">{r.date}</div>
            </div>
          </div>
        ))}
      </div>
      {sheet && <LabResultSheet result={sheet} onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
    </>
  );
}

// ── TRENDS ────────────────────────────────────────────────────
function LabTrendsV2({ goBack, toast, goTo }) {
  const trends = [
    { title:"HbA1c", val:"7.8", unit:"%", color:"#c28320", chip:"warn", chipLabel:"↑ High",
      pts:[[0,52],[46,47],[93,42],[139,45],[186,38],[232,34],[280,28]], axis:["Oct","Nov","Dec","Jan","Feb","Apr"], footer:["Target < 7.5%", "↑ Trending up"], gradId:"lb2-hba" },
    { title:"eGFR · Kidney", val:"94", unit:"mL/min", color:"#2a8a4a", chip:"ok", chipLabel:"✓ Normal",
      pts:[[0,28],[56,30],[112,25],[168,28],[224,30],[280,29]], axis:["Oct","Dec","Jan","Feb","Mar","Apr"], footer:["Target > 60", "Stable"], gradId:"lb2-egfr" },
    { title:"LDL Cholesterol", val:"142", unit:"mg/dL", color:"#5b8dee", chip:"warn", chipLabel:"↑ Borderline",
      pts:[[0,44],[93,38],[186,34],[280,28]], axis:["Aug","Nov","Feb","Apr"], footer:["Target < 130", "↑ +14 since Nov"], gradId:"lb2-ldl" },
    { title:"Haemoglobin", val:"11.2", unit:"g/dL", color:"#7c6fcd", chip:"lo", chipLabel:"↓ Slightly low",
      pts:[[0,32],[93,28],[186,30],[280,34]], axis:["Aug","Nov","Feb","Apr"], footer:["Target 12–15.5 g/dL", "Stable · monitor"], gradId:"lb2-hb" },
  ];
  return (
    <>
      <LabsHdr color="iris" title="Trends" stat="Key metrics over time" onBack={goBack}/>
      <div style={{ padding:"14px 16px", display:"grid", gap:12 }}>
        {trends.map((t, i) => (
          <div key={i} className="lb-chart-card" onClick={() => { window.__tcTrendMetric = t; goTo && goTo("trend-" + i); }}>
            <div className="lb-chart-hd">
              <div>
                <div className="lb-chart-name">{t.title}</div>
                <span style={{ display:"inline-block", fontSize:8.5, fontWeight:700, padding:"2px 7px", borderRadius:9999, marginTop:3, background:t.chip==="ok"?"#dcfce7":t.chip==="warn"?"#fef3c7":"#e8f0fe", color:t.chip==="ok"?"#166534":t.chip==="warn"?"#b45309":"#1a56db" }}>{t.chipLabel}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div className="lb-chart-big" style={{ color:t.color }}>{t.val}</div>
                <div style={{ fontSize:10, color:"var(--fg-4)", marginTop:2 }}>{t.unit}</div>
              </div>
            </div>
            <svg viewBox="0 0 280 60" style={{ width:"100%", height:60, display:"block", marginTop:4 }}>
              <defs><linearGradient id={t.gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.color} stopOpacity=".18"/><stop offset="100%" stopColor={t.color} stopOpacity="0"/></linearGradient></defs>
              <path d={`${t.pts.map((p,pi)=>`${pi===0?"M":"L"}${p[0]},${p[1]}`).join(" ")} L${t.pts[t.pts.length-1][0]},70 L0,70 Z`} fill={`url(#${t.gradId})`}/>
              <path d={t.pts.map((p,pi)=>`${pi===0?"M":"L"}${p[0]},${p[1]}`).join(" ")} fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {t.pts.map((p,pi) => <circle key={pi} cx={p[0]} cy={p[1]} r="3.5" fill="#fff" stroke={t.color} strokeWidth="1.8"/>)}
            </svg>
            <div className="lb-chart-axis">{t.axis.map((a,ai) => <span key={ai}>{a}</span>)}</div>
            <div className="lb-chart-foot"><span>{t.footer[0]}</span><span style={{ color:t.color, fontWeight:600 }}>{t.footer[1]}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── UPLOAD ────────────────────────────────────────────────────
function LabUploadV2({ goBack, nav, toast, goTo }) {
  const [step, setStep] = React.useState(0);
  return (
    <>
      <LabsHdr color="teal" title="Upload a lab" stat="AI extracts values · clinician reviews" onBack={goBack}/>
      <div style={{ padding:"14px 16px" }}>
        {step === 0 && (
          <>
            <div className="lb-drop" onClick={() => setStep(1)}>
              <div className="lb-drop-ico"><Ic2 n="upload" s={24} sw={2} c="var(--gold-700)"/></div>
              <div className="lb-drop-t">Upload a lab report</div>
              <div className="lb-drop-s">PDF, JPG, or photo. AI extracts values · you confirm · clinician reviews within 24h.</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
              <button onClick={() => setStep(1)} style={{ padding:14, borderRadius:12, background:"var(--fg-1)", color:"#fff", border:0, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" }}>📷 Take photo</button>
              <button onClick={() => setStep(1)} style={{ padding:14, borderRadius:12, background:"var(--n-50)", color:"var(--fg-1)", border:"1px solid var(--border-subtle)", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" }}>📄 Browse files</button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div style={{ aspectRatio:"4/3", borderRadius:14, background:"linear-gradient(160deg,#f4ecd7,#e8dcb5)", position:"relative", overflow:"hidden", marginBottom:12 }}>
              <div style={{ position:"absolute", inset:20, background:"repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 1px,transparent 1px 8px)" }}/>
              <div style={{ position:"absolute", top:16, left:20, fontSize:10, fontWeight:700, color:"#6b5a28" }}>MOBILABS OSU · 14 APR 2026</div>
            </div>
            <div style={{ background:"color-mix(in oklab,var(--gold-50) 60%,white)", borderRadius:13, padding:"12px 14px", border:"1px solid rgba(194,131,32,.2)", marginBottom:12 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#b45309", marginBottom:5 }}>AI extracted · confirm before submit</div>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--fg-1)", marginBottom:3 }}>6 values read · confidence 96%</div>
            </div>
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid rgba(0,0,0,.05)", padding:"0 14px", marginBottom:12 }}>
              {[["HbA1c","7.8 %","hi"],["Fasting glucose","132 mg/dL","hi"],["Creatinine","0.9 mg/dL","ok"],["eGFR","94 mL/min","ok"],["ALT","22 U/L","ok"],["Haemoglobin","11.2 g/dL","lo"]].map(([k,v,flag],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:i>0?"1px solid var(--border-subtle)":"none", fontSize:12.5 }}>
                  <span style={{ color:"var(--fg-2)" }}>{k}</span>
                  <span style={{ fontWeight:700, color:flag==="hi"?"#c28320":flag==="lo"?"#2b6cb0":"#166534" }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="cta" onClick={() => { goTo ? goTo("UploadDone") : (toast("Submitted · Dr. Mensah notified"), setStep(0), goBack()); }}>Submit for clinician review</button>
            <button className="cta g" onClick={() => setStep(0)}>Start over</button>
          </>
        )}
      </div>
    </>
  );
}

// ── MEDICAL REPORTS ───────────────────────────────────────────
const SAMPLE_REPORTS = [
  { id:"r1", tag:"AI GENERATED · REVIEWED", title:"Comprehensive health summary", sub:"All categories · 11 results · Apr 2026", date:"20 Apr 2026", by:"Dr. Mensah + Telecheck AI",
    pills:["All categories","11 results","Clinician reviewed"],
    rows: LAB_CATS.flatMap(c => c.results) },
  { id:"r2", tag:"AI GENERATED · PENDING REVIEW", title:"Infection panel report", sub:"Malaria · Typhoid · HBsAg · HIV · Apr 2026", date:"08 Apr 2026", by:"Telecheck AI · Dr. Mensah reviewing",
    pills:["Infection only","5 results","Pending review"],
    rows: LAB_CATS.find(c => c.id === "Infection")?.results || [] },
];

function MedicalReportsV2({ goBack, toast, openAI, goTo }) {
  const [shareReport, setShareReport] = React.useState(null);
  return (
    <>
      <LabsHdr color="iris" title="Medical Reports" stat="AI-generated · downloadable" onBack={goBack}/>
      <div style={{ padding:"14px 16px", display:"grid", gap:12 }}>

        {/* AI generate CTA */}
        <div className="lb-ai-gen" onClick={() => goTo && goTo("Generate")}>
          <div className="lb-ai-gen-tag"><Ic2 n="spark" s={12} sw={2.2} c="var(--iris-600)"/>Ask AI to generate a report</div>
          <div className="lb-ai-gen-title">Tell AI what to include</div>
          <div className="lb-ai-gen-sub">Ask for a report for a doctor visit, a travel clinic, a hospital referral, or a specific period. AI compiles it from your record — clinician reviews before it's finalised.</div>
          <button style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:9, background:"var(--iris-500)", color:"#fff", border:0, fontFamily:"inherit", fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
            Generate report <Ic2 n="chev" s={13} c="#fff"/>
          </button>
        </div>

        {/* Saved reports */}
        <div className="lb-section">Saved reports</div>
        {SAMPLE_REPORTS.map(r => (
          <div key={r.id} className="lb-report-card">
            <div className="lb-report-tag"><Ic2 n="doc" s={12} sw={2} c="var(--iris-600)"/>{r.tag}</div>
            <div className="lb-report-title">{r.title}</div>
            <div className="lb-report-sub">{r.sub}</div>
            <div className="lb-report-meta">
              {r.pills.map((p,i) => <span key={i} className="lb-report-pill">{p}</span>)}
              <span className="lb-report-pill">{r.date}</span>
            </div>
            <div className="lb-report-actions">
              <button className="lb-report-dl" onClick={() => { const rows = r.rows.map(x => ({ ...x, cat: LAB_CATS.find(c => c.results.some(y => y.id === x.id))?.label || "Other" })); if (window.__lbSetPrintData) window.__lbSetPrintData(rows, { title:r.title, subtitle:r.by }); const el = document.getElementById("lb-print-report"); if (el) el.style.display = "block"; setTimeout(() => { window.print(); setTimeout(() => { if (el) el.style.display = "none"; }, 500); }, 150); }}>
                <Ic2 n="upload" s={13} c="#fff"/> Download PDF
              </button>
              <button className="lb-report-share" onClick={() => setShareReport(r)}>Share</button>
            </div>
          </div>
        ))}

        <div style={{ padding:"10px 0", fontSize:11.5, color:"var(--fg-3)", lineHeight:1.5 }}>
          Reports are generated by Telecheck AI from your record and reviewed by your clinician before finalisation. They can be shared with hospitals, travel clinics or specialists via a secure link that expires in 72 hours.
        </div>
      </div>
      {shareReport && <window.ShareReportSheet report={shareReport} onClose={() => setShareReport(null)} toast={toast}/>}
    </>
  );
}

// ── HUB ───────────────────────────────────────────────────────
const SEVERITY = { bad:0, warn:1, lo:2, pend:3, ok:4 };

function LabsHubV2({ goTo, toast, openAI, nav }) {
  const allFlagged = FLAGGED_RESULTS.slice().sort((a,b) =>
    (SEVERITY[a.status] ?? 5) - (SEVERITY[b.status] ?? 5)
  );
  const shown  = allFlagged.slice(0, 3);
  const hidden = allFlagged.length - shown.length;
  const totalResults = LAB_CATS.reduce((a,c) => a + c.results.length, 0);

  const statusColor = { bad:"#c8402f", warn:"#c28320", lo:"#2b6cb0" };

  return (
    <>
      {window.HubBackBar && <window.HubBackBar/>}
      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{
        padding:"20px 18px 20px",
        background:"linear-gradient(160deg,color-mix(in oklab,var(--gold-100) 50%,white),white 72%)",
        borderBottom:"1px solid rgba(194,131,32,.1)",
      }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"var(--gold-700)", marginBottom:4 }}>Labs</div>
        <div style={{ fontSize:24, fontWeight:700, letterSpacing:"-.02em", color:"var(--fg-1)", marginBottom:2, fontFamily:"'Space Grotesk',sans-serif" }}>
          {allFlagged.length > 0 ? `${allFlagged.length} results need attention` : "All results normal"}
        </div>
        <div style={{ fontSize:12, color:"var(--fg-3)" }}>
          {totalResults} total · {LAB_CATS.length} categories · last updated 20 Apr
        </div>
      </div>

      <div style={{ padding:"14px 16px", display:"grid", gap:16 }}>

        {/* ── Flagged (max 3) ────────────────────────────── */}
        {shown.length > 0 && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--fg-4)" }}>Needs attention</div>
              {hidden > 0 && (
                <button onClick={() => goTo("cat-all-flagged")} style={{ fontSize:11.5, fontWeight:600, color:"var(--teal-700)", background:"none", border:0, cursor:"pointer", fontFamily:"inherit" }}>
                  +{hidden} more →
                </button>
              )}
            </div>
            <div style={{ display:"grid", gap:8 }}>
              {shown.map(r => {
                const cat = LAB_CATS.find(c => c.results.some(x => x.id === r.id));
                const col = statusColor[r.status] || "#888";
                return (
                  <div key={r.id} onClick={() => goTo("cat-" + (cat?.id || ""))}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#fff", borderRadius:14, border:`1px solid ${col}22`, borderLeft:`3px solid ${col}`, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:col+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Ic2 n={cat?.ico || "lab"} s={17} sw={2} c={col}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:"var(--fg-1)", letterSpacing:"-.005em" }}>{r.title}</div>
                      <div style={{ fontSize:11, color:"var(--fg-3)", marginTop:2 }}>{cat?.label} · {r.date}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:18, fontWeight:700, color:col, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>{r.val}</div>
                      <div style={{ fontSize:9.5, fontWeight:700, color:col, marginTop:3 }}>{r.statusLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Category grid ──────────────────────────────── */}
        <div>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--fg-4)", marginBottom:10 }}>Categories</div>
          <div className="lb-cat-grid">
            {LAB_CATS.map(cat => (
              <div key={cat.id} className="lb-cat-card" onClick={() => goTo("cat-" + cat.id)}>
                <div className="lb-cat-card-stripe" style={{ background:cat.color }}/>
                <div className="lb-cat-header">
                  <div className="lb-cat-ico" style={{ background:cat.bg }}><Ic2 n={cat.ico} s={14} sw={2} c={cat.color}/></div>
                  <div className="lb-cat-count">{cat.results.length}</div>
                </div>
                <div className="lb-cat-name">{cat.label}</div>
                <div className="lb-cat-val">{cat.latest}</div>
                <div className="lb-cat-sub">{cat.sub}</div>
                <span className={`lb-cat-chip ${cat.chip}`}>
                  {cat.chip==="ok"?"Normal":cat.chip==="warn"?"Flagged":cat.chip==="bad"?"Positive":cat.chip==="lo"?"Low":"Pending"}
                </span>
              </div>
            ))}
          </div>
          {/* Repository entry — full archive */}
          <div onClick={() => goTo("Repository")} style={{ marginTop:10, display:"flex", alignItems:"center", gap:12, background:"#fff", border:"1px solid rgba(0,0,0,.05)", borderRadius:13, padding:"13px 14px", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ width:36, height:36, borderRadius:11, background:"color-mix(in oklab,var(--gold-100) 60%,white)", display:"grid", placeItems:"center", flexShrink:0 }}>
              <Ic2 n="search" s={16} sw={2} c="var(--gold-700)"/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:600, color:"var(--fg-1)" }}>Lab repository</div>
              <div style={{ fontSize:11.5, color:"var(--fg-3)", marginTop:2 }}>Search every result · filter by category, date or flag</div>
            </div>
            <Ic2 n="chev" s={16} c="var(--fg-4)"/>
          </div>
        </div>

        {/* ── Quick actions ──────────────────────────────── */}
        <div className="lb-quick">
          {[
            { icon:"upload", iBg:"color-mix(in oklab,var(--teal-100) 50%,white)", iC:"var(--teal-700)", label:"Upload",  go:() => goTo("Upload")  },
            { icon:"trend",  iBg:"#f0eeff",                                        iC:"var(--iris-600)", label:"Trends",  go:() => goTo("Trends")  },
            { icon:"doc",    iBg:"color-mix(in oklab,var(--iris-100) 50%,white)",  iC:"var(--iris-600)", label:"Reports", go:() => goTo("Reports") },
            { icon:"spark",  iBg:"color-mix(in oklab,var(--gold-100) 50%,white)",  iC:"var(--gold-700)", label:"Ask AI",  go:openAI                },
          ].map((a, i) => (
            <div key={i} className="lb-quick-btn" onClick={a.go}>
              <div className="lb-quick-ico" style={{ background:a.iBg }}><Ic2 n={a.icon} s={15} sw={2} c={a.iC}/></div>
              <div className="lb-quick-lbl">{a.label}</div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

// ── LabsV2 OVERRIDE ───────────────────────────────────────────
function LabsV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI, sub = "Hub", setSub }) {
  const goTo   = (s) => setSub(s);
  const goBack = ()  => setSub("Hub");

  const inner = (() => {
    if (sub === "cat-all-flagged") {
      // Show all flagged across all categories as a flat list
      const allFlagged = FLAGGED_RESULTS.slice().sort((a,b) => (SEVERITY[a.status]??5)-(SEVERITY[b.status]??5));
      return <LabCatDetail catId="__flagged__" goBack={goBack} nav={nav} toast={toast} overrideResults={allFlagged} overrideTitle="All flagged" overrideStat={`${allFlagged.length} results need attention`}/>;
    }
    if (sub.startsWith("cat-")) return <LabCatDetail catId={sub.slice(4)} goBack={goBack} nav={nav} toast={toast}/>;
    switch (sub) {
      case "Trends":  return <LabTrendsV2    goBack={goBack} toast={toast} goTo={goTo}/>;
      case "Upload":  return <LabUploadV2    goBack={goBack} nav={nav} toast={toast} goTo={goTo}/>;
      case "Reports": return <MedicalReportsV2 goBack={goBack} toast={toast} openAI={openAI} goTo={goTo}/>;
      case "Repository": return <window.LabRepository onBack={goBack} onPickResult={(r) => { /* open detail sheet via cat */ const c = LAB_CATS.find(c => c.results.some(x => x.id === (r && r.id))); if (c) goTo("cat-" + c.id); else goBack(); }}/>;
      case "Generate": return <window.GenerateReportWizard onBack={() => goTo("Reports")} toast={toast}/>;
      case "UploadDone": return <window.LabUploadSuccess onBack={goBack} onViewQueue={goBack}/>;
      default:
        if (sub.startsWith("trend-")) return <window.LabTrendDetail metric={window.__tcTrendMetric} onBack={() => goTo("Trends")} toast={toast}/>;
        return <LabsHubV2 goTo={goTo} toast={toast} openAI={openAI} nav={nav}/>;
    }
  })();

  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">{inner}</div>
      <TabBar2 active="labs" onTab={nav} care={2}/>
      <LabPrintReport/>
    </div>
  );
}
