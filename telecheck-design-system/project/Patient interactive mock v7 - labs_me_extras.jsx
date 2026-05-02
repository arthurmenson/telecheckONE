// ─────────────────────────────────────────────────────────────────
// v6 — extra inner screens for Labs + Me (wires up dead-ends)
//   Labs: Repository · Trend detail · Generate report · Share report · Upload success
//   Me:   Invite family · Share-with-hospital wizard · Add payment · Help center · Support chat
// ─────────────────────────────────────────────────────────────────

(function injectExtraStyles() {
  if (document.getElementById("lme-extra-styles")) return;
  const s = document.createElement("style");
  s.id = "lme-extra-styles";
  s.textContent = `
    /* shared inner-page header (matches labs/me redesign) */
    .lme-hdr { padding:10px 16px 14px; border-bottom:1px solid var(--border-subtle); display:flex; flex-direction:column; }
    .lme-hdr-back { display:flex; align-items:center; gap:4px; background:none; border:0; font-size:12px; font-weight:500; color:var(--fg-3); padding:4px 0 8px; cursor:pointer; font-family:inherit; align-self:flex-start; }
    .lme-hdr-row { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
    .lme-hdr-title { font-size:20px; font-weight:700; letter-spacing:-.02em; color:var(--fg-1); font-family:'Space Grotesk',sans-serif; }
    .lme-hdr-stat { font-size:12px; color:var(--fg-3); margin-top:2px; }

    /* search field */
    .lme-search { display:flex; align-items:center; gap:8px; background:#fff; border-radius:11px; padding:9px 12px; border:1px solid var(--border-subtle); }
    .lme-search input { flex:1; border:0; outline:0; background:transparent; font-family:inherit; font-size:13px; color:var(--fg-1); }
    .lme-search input::placeholder { color:var(--fg-4); }

    /* chip filters */
    .lme-chips { display:flex; gap:6px; overflow-x:auto; padding:2px 0; scrollbar-width:none; }
    .lme-chips::-webkit-scrollbar { display:none; }
    .lme-chip { padding:6px 11px; border-radius:9999px; background:#fff; border:1px solid var(--border-subtle); font-size:11.5px; font-weight:600; color:var(--fg-2); cursor:pointer; white-space:nowrap; flex-shrink:0; }
    .lme-chip.on { background:var(--fg-1); color:#fff; border-color:var(--fg-1); }

    /* archive row */
    .lme-arch-row { display:flex; gap:12px; align-items:center; background:#fff; border-radius:13px; padding:12px 13px; border:1px solid rgba(0,0,0,.05); cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .lme-arch-bar { width:3px; align-self:stretch; border-radius:2px; flex-shrink:0; }
    .lme-arch-body { flex:1; min-width:0; }
    .lme-arch-t { font-size:13px; font-weight:600; color:var(--fg-1); }
    .lme-arch-s { font-size:11px; color:var(--fg-3); margin-top:2px; }
    .lme-arch-r { text-align:right; flex-shrink:0; }
    .lme-arch-v { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; }
    .lme-arch-d { font-size:10px; color:var(--fg-4); margin-top:2px; }

    /* skeleton */
    .lme-skel { background:linear-gradient(90deg,var(--n-100) 0%,var(--n-50) 50%,var(--n-100) 100%); background-size:200% 100%; animation:lmeShim 1.4s linear infinite; border-radius:7px; }
    @keyframes lmeShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* big trend card */
    .lme-trend-big { background:#fff; border-radius:18px; padding:18px; border:1px solid rgba(0,0,0,.05); box-shadow:0 1px 6px rgba(0,0,0,.04); }
    .lme-trend-big-val { font-size:42px; font-weight:700; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums; }
    .lme-trend-big-unit { font-size:13px; color:var(--fg-3); margin-top:4px; }

    /* mini stat tile */
    .lme-stat { background:#fff; border-radius:12px; padding:11px 12px; border:1px solid rgba(0,0,0,.05); }
    .lme-stat-lbl { font-size:9.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--fg-4); }
    .lme-stat-val { font-size:16px; font-weight:700; color:var(--fg-1); margin-top:3px; }

    /* wizard step pip */
    .lme-pips { display:flex; gap:6px; margin-bottom:14px; }
    .lme-pip { flex:1; height:4px; border-radius:2px; background:var(--n-200); }
    .lme-pip.on { background:var(--teal-500); }

    /* picker row (toggle list) */
    .lme-pick { display:flex; align-items:center; gap:12px; padding:13px 14px; background:#fff; border-radius:12px; border:1px solid var(--border-subtle); cursor:pointer; }
    .lme-pick-cb { width:22px; height:22px; border-radius:7px; border:1.8px solid var(--n-300); display:grid; place-items:center; flex-shrink:0; }
    .lme-pick.on .lme-pick-cb { background:var(--teal-500); border-color:var(--teal-500); }
    .lme-pick.on .lme-pick-cb svg { display:block; }
    .lme-pick-cb svg { display:none; }
    .lme-pick-t { font-size:13px; font-weight:600; color:var(--fg-1); }
    .lme-pick-s { font-size:11px; color:var(--fg-3); margin-top:2px; }

    /* radio-style row */
    .lme-radio { display:flex; align-items:center; gap:12px; padding:13px 14px; background:#fff; border-radius:12px; border:1px solid var(--border-subtle); cursor:pointer; }
    .lme-radio.on { border-color:var(--teal-500); background:color-mix(in oklab,var(--teal-100) 25%,white); }
    .lme-radio-dot { width:18px; height:18px; border-radius:50%; border:2px solid var(--n-300); flex-shrink:0; position:relative; }
    .lme-radio.on .lme-radio-dot { border-color:var(--teal-500); }
    .lme-radio.on .lme-radio-dot::after { content:''; position:absolute; inset:3px; border-radius:50%; background:var(--teal-500); }

    /* form input */
    .lme-input { width:100%; padding:12px 14px; border-radius:11px; background:#fff; border:1px solid var(--border-subtle); font-family:inherit; font-size:14px; color:var(--fg-1); outline:0; box-sizing:border-box; }
    .lme-input:focus { border-color:var(--teal-500); }
    .lme-label { font-size:11px; font-weight:600; color:var(--fg-3); margin-bottom:6px; display:block; text-transform:uppercase; letter-spacing:.06em; }

    /* success scrim */
    .lme-success { padding:32px 22px; text-align:center; }
    .lme-success-ic { width:74px; height:74px; border-radius:50%; background:#dcfce7; margin:0 auto 16px; display:grid; place-items:center; }
    .lme-success-t { font-size:20px; font-weight:700; color:var(--fg-1); letter-spacing:-.01em; }
    .lme-success-s { font-size:13px; color:var(--fg-3); margin-top:6px; line-height:1.45; }

    /* chat bubble */
    .lme-bubble { max-width:78%; padding:10px 13px; border-radius:14px; font-size:13px; line-height:1.45; }
    .lme-bubble.me { background:var(--teal-500); color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
    .lme-bubble.them { background:#fff; color:var(--fg-1); align-self:flex-start; border:1px solid var(--border-subtle); border-bottom-left-radius:4px; }
    .lme-bubble-meta { font-size:9.5px; opacity:.8; margin-top:3px; }

    /* article row */
    .lme-art { padding:13px 14px; background:#fff; border-radius:12px; border:1px solid rgba(0,0,0,.05); cursor:pointer; }
    .lme-art-t { font-size:13.5px; font-weight:600; color:var(--fg-1); }
    .lme-art-s { font-size:11.5px; color:var(--fg-3); margin-top:3px; line-height:1.4; }

    /* generic primary CTA in extras */
    .lme-cta { width:100%; padding:14px; border-radius:12px; background:var(--fg-1); color:#fff; border:0; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; }
    .lme-cta.g { background:var(--n-50); color:var(--fg-1); border:1px solid var(--border-subtle); }
    .lme-cta:disabled { opacity:.4; cursor:not-allowed; }
  `;
  document.head.appendChild(s);
})();

// ── shared header ─────────────────────────────────────────────
function LmeHdr({ title, stat, onBack, backLabel = "Back", color = "teal", right }) {
  const bgs = {
    teal: "linear-gradient(150deg,color-mix(in oklab,var(--teal-400) 18%,white),color-mix(in oklab,var(--teal-100) 32%,white))",
    iris: "linear-gradient(150deg,color-mix(in oklab,var(--iris-400) 13%,white),color-mix(in oklab,var(--iris-100) 24%,white))",
    gold: "linear-gradient(150deg,color-mix(in oklab,var(--gold-400) 18%,white),color-mix(in oklab,var(--gold-100) 32%,white))",
    blue: "linear-gradient(150deg,color-mix(in oklab,#5b8dee 13%,white),color-mix(in oklab,#5b8dee 22%,white))",
  };
  return (
    <div className="lme-hdr" style={{ background: bgs[color] || bgs.teal }}>
      <button className="lme-hdr-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        {backLabel}
      </button>
      <div className="lme-hdr-row">
        <div>
          <div className="lme-hdr-title">{title}</div>
          {stat && <div className="lme-hdr-stat">{stat}</div>}
        </div>
        {right && <div style={{ flexShrink:0, paddingTop:4 }}>{right}</div>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// LAB REPOSITORY — searchable archive of every result
// ═════════════════════════════════════════════════════════════
function LabRepository({ onBack, onPickResult }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("All");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);

  const cats = (window.LAB_CATS) || [];
  const all = cats.flatMap(c => c.results.map(r => ({ ...r, catLabel: c.label, catId: c.id })));
  const filtered = all.filter(r => {
    if (filter !== "All" && r.catLabel !== filter) return false;
    if (q && !(r.title.toLowerCase().includes(q.toLowerCase()) || (r.catLabel || "").toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const colorOf = s => ({ ok:"#2a8a4a", warn:"#c28320", bad:"#c8402f", lo:"#2b6cb0", pend:"#888" }[s] || "#888");

  return (
    <>
      <LmeHdr color="gold" title="Lab repository" stat={`${all.length} results across ${cats.length} categories`} onBack={onBack} backLabel="Labs"/>
      <div style={{ padding:"14px 16px", display:"grid", gap:12 }}>
        <div className="lme-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
          <input placeholder="Search HbA1c, malaria, kidney…" value={q} onChange={e => setQ(e.target.value)}/>
          {q && <span style={{ fontSize:12, color:"var(--fg-3)", cursor:"pointer" }} onClick={() => setQ("")}>Clear</span>}
        </div>
        <div className="lme-chips">
          {["All", ...cats.map(c => c.label)].map(c => (
            <span key={c} className={`lme-chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</span>
          ))}
        </div>

        {loading && (
          <div style={{ display:"grid", gap:8 }}>
            {[0,1,2,3].map(i => <div key={i} className="lme-skel" style={{ height:60 }}/>)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding:"32px 18px", textAlign:"center", background:"#fff", borderRadius:14, border:"1px dashed var(--border-strong)" }}>
            <div style={{ fontSize:30, marginBottom:8 }}>🔎</div>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--fg-1)" }}>No results match</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginTop:4 }}>Try clearing the search or pick a different category.</div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display:"grid", gap:8 }}>
            {filtered.map(r => (
              <div key={r.id + r.date} className="lme-arch-row" onClick={() => onPickResult(r.result)}>
                <div className="lme-arch-bar" style={{ background:colorOf(r.status) }}/>
                <div className="lme-arch-body">
                  <div className="lme-arch-t">{r.title}</div>
                  <div className="lme-arch-s">{r.catLabel} · {r.statusLabel} · {r.reviewed ? "Reviewed" : "AI only"}</div>
                </div>
                <div className="lme-arch-r">
                  <div className="lme-arch-v" style={{ color: colorOf(r.status) }}>{r.val}<span style={{ fontSize:10, color:"var(--fg-4)", fontWeight:500 }}>{r.unit ? " " + r.unit : ""}</span></div>
                  <div className="lme-arch-d">{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// TREND DETAIL — single metric deep view
// ═════════════════════════════════════════════════════════════
function LabTrendDetail({ metric, onBack, toast }) {
  const [range, setRange] = React.useState("12m");
  const ranges = [["3m","3 mo"],["6m","6 mo"],["12m","12 mo"],["all","All"]];
  const m = metric || { title:"HbA1c", val:"7.8", unit:"%", color:"#c28320", target:"< 7.0%",
    pts:[[0,52],[40,48],[80,42],[120,45],[160,38],[200,34],[240,28],[280,30]],
    axis:["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Apr"],
    history:[
      { d:"14 Apr 2026", v:"7.8 %", flag:"warn" },
      { d:"28 Feb 2026", v:"7.6 %", flag:"warn" },
      { d:"05 Jan 2026", v:"7.9 %", flag:"warn" },
      { d:"08 Nov 2025", v:"7.5 %", flag:"warn" },
      { d:"02 Aug 2025", v:"6.9 %", flag:"ok" },
    ],
    summary:"Up about 0.9% from Aug. Trend is shallow but steady — likely diet + missed evening doses. Worth a fasting-glucose week to confirm.",
  };

  return (
    <>
      <LmeHdr color="iris" title={m.title} stat={`Target ${m.target}`} onBack={onBack} backLabel="Trends"/>
      <div style={{ padding:"14px 16px", display:"grid", gap:14 }}>

        <div className="lme-trend-big">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:14 }}>
            <div>
              <div className="lme-trend-big-val" style={{ color:m.color }}>{m.val}</div>
              <div className="lme-trend-big-unit">{m.unit} · last 14 Apr</div>
            </div>
            <span style={{ fontSize:9.5, fontWeight:700, padding:"3px 9px", borderRadius:9999, background:"#fef3c7", color:"#b45309" }}>↑ ABOVE TARGET</span>
          </div>
          <svg viewBox="0 0 280 80" style={{ width:"100%", height:120, display:"block" }}>
            <defs><linearGradient id="lme-td" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={m.color} stopOpacity=".22"/><stop offset="100%" stopColor={m.color} stopOpacity="0"/></linearGradient></defs>
            {/* target line */}
            <line x1="0" y1="55" x2="280" y2="55" stroke={m.color} strokeWidth="0.8" strokeDasharray="3 3" opacity=".4"/>
            <text x="276" y="52" fontSize="7" fill={m.color} textAnchor="end" opacity=".7">target</text>
            <path d={`${m.pts.map((p,i) => `${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ")} L${m.pts[m.pts.length-1][0]},80 L0,80 Z`} fill="url(#lme-td)"/>
            <path d={m.pts.map((p,i) => `${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ")} fill="none" stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {m.pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke={m.color} strokeWidth="1.5"/>)}
          </svg>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--fg-4)", marginTop:6 }}>{m.axis.map((a,i) => <span key={i}>{a}</span>)}</div>
        </div>

        <div className="lme-chips" style={{ justifyContent:"center" }}>
          {ranges.map(([k,l]) => <span key={k} className={`lme-chip ${range === k ? "on" : ""}`} onClick={() => setRange(k)}>{l}</span>)}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <div className="lme-stat"><div className="lme-stat-lbl">Latest</div><div className="lme-stat-val" style={{ color:m.color }}>{m.val}</div></div>
          <div className="lme-stat"><div className="lme-stat-lbl">Δ 6 mo</div><div className="lme-stat-val">+0.3</div></div>
          <div className="lme-stat"><div className="lme-stat-lbl">Avg 12 mo</div><div className="lme-stat-val">7.5</div></div>
        </div>

        <div>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--fg-4)", marginBottom:8 }}>What this means</div>
          <div style={{ padding:14, borderRadius:12, background:"var(--n-50)", fontSize:13, lineHeight:1.5, color:"var(--fg-2)" }}>{m.summary}</div>
        </div>

        <div>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--fg-4)", marginBottom:8 }}>History</div>
          <div style={{ background:"#fff", borderRadius:13, border:"1px solid rgba(0,0,0,.05)", padding:"0 14px" }}>
            {m.history.map((h,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderTop:i>0?"1px solid var(--border-subtle)":"none", fontSize:12.5 }}>
                <span style={{ color:"var(--fg-2)" }}>{h.d}</span>
                <span style={{ fontWeight:700, color: h.flag === "warn" ? "#c28320" : h.flag === "ok" ? "#2a8a4a" : "var(--fg-1)" }}>{h.v}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="lme-cta" onClick={() => toast("Opened in AI workspace")}>Ask AI about this trend</button>
        <button className="lme-cta g" onClick={() => toast("Trend exported · check email")}>Export this trend</button>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// GENERATE REPORT WIZARD — pick scope · period · purpose
// ═════════════════════════════════════════════════════════════
function GenerateReportWizard({ onBack, toast }) {
  const [step, setStep] = React.useState(0);
  const [scope, setScope] = React.useState({ Infection:true, Metabolic:true, Kidney:true, Lipids:true, Blood:true, Thyroid:false });
  const [period, setPeriod] = React.useState("12m");
  const [purpose, setPurpose] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const cats = (window.LAB_CATS) || [];
  const selectedCount = Object.values(scope).filter(Boolean).length;

  const purposes = [
    { id:"travel", t:"Travel clinic", s:"For a yellow-fever or visa appointment" },
    { id:"hospital", t:"Hospital referral", s:"For a specialist or admission" },
    { id:"insurance", t:"Insurance claim", s:"NHIS or private insurer" },
    { id:"personal", t:"Personal record", s:"Just for me" },
  ];

  if (done) return (
    <>
      <LmeHdr color="iris" title="Report ready" onBack={onBack} backLabel="Reports"/>
      <div className="lme-success">
        <div className="lme-success-ic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div className="lme-success-t">Report generated</div>
        <div className="lme-success-s">{selectedCount} categories · {period === "all" ? "all-time" : period} period · queued for Dr. Mensah's review (typical 24h). You can download the AI-only draft now.</div>
        <div style={{ display:"grid", gap:10, padding:"24px 18px 0", maxWidth:340, margin:"0 auto" }}>
          <button className="lme-cta" onClick={() => { toast("PDF downloaded"); onBack(); }}>Download PDF draft</button>
          <button className="lme-cta g" onClick={onBack}>Done</button>
        </div>
      </div>
    </>
  );

  if (generating) return (
    <>
      <LmeHdr color="iris" title="Generating…" onBack={onBack} backLabel="Reports"/>
      <div style={{ padding:"40px 22px", textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:18, background:"color-mix(in oklab,var(--iris-100) 50%,white)", margin:"0 auto 18px", display:"grid", placeItems:"center" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--iris-600)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" opacity=".25"/>
            <path d="M21 12a9 9 0 0 1-9 9"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/></path>
          </svg>
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:"var(--fg-1)" }}>AI is compiling your report</div>
        <div style={{ fontSize:12, color:"var(--fg-3)", marginTop:6 }}>Pulling {selectedCount} categories · {period} window</div>
        <div style={{ display:"grid", gap:6, marginTop:24, maxWidth:280, marginLeft:"auto", marginRight:"auto", textAlign:"left" }}>
          {["Reading lab results","Summarising trends","Drafting plain-language notes","Queuing for clinician review"].map((s,i) => (
            <div key={i} style={{ fontSize:12, color:"var(--fg-2)", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--iris-500)", animation:`lmeShim ${1+i*0.3}s linear infinite alternate` }}/>
              {s}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <LmeHdr color="iris" title="Generate a report" stat={`Step ${step + 1} of 3`} onBack={onBack} backLabel="Reports"/>
      <div style={{ padding:"14px 16px" }}>
        <div className="lme-pips">
          {[0,1,2].map(i => <div key={i} className={`lme-pip ${i <= step ? "on" : ""}`}/>)}
        </div>

        {step === 0 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>What's it for?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>Helps us tailor the language and what to highlight.</div>
            <div style={{ display:"grid", gap:8 }}>
              {purposes.map(p => (
                <div key={p.id} className={`lme-radio ${purpose === p.id ? "on" : ""}`} onClick={() => setPurpose(p.id)}>
                  <div className="lme-radio-dot"/>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{p.t}</div>
                    <div className="lme-pick-s">{p.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>Which categories?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>{selectedCount} of {cats.length} selected.</div>
            <div style={{ display:"grid", gap:8 }}>
              {cats.map(c => (
                <div key={c.id} className={`lme-pick ${scope[c.id] ? "on" : ""}`} onClick={() => setScope(s => ({ ...s, [c.id]: !s[c.id] }))}>
                  <div className="lme-pick-cb"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg></div>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{c.label}</div>
                    <div className="lme-pick-s">{c.results.length} results · latest {c.results[0]?.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>Time period</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>Limits which results AI includes in the report.</div>
            <div style={{ display:"grid", gap:8 }}>
              {[["3m","Last 3 months","Most recent results only"],["6m","Last 6 months","Recent + last clinic visit"],["12m","Last 12 months","Recommended for most uses"],["all","All-time","Everything Telecheck holds"]].map(([k,t,s]) => (
                <div key={k} className={`lme-radio ${period === k ? "on" : ""}`} onClick={() => setPeriod(k)}>
                  <div className="lme-radio-dot"/>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{t}</div>
                    <div className="lme-pick-s">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          {step > 0 && <button className="lme-cta g" onClick={() => setStep(s => s - 1)} style={{ flex:1 }}>Back</button>}
          {step < 2 && <button className="lme-cta" onClick={() => setStep(s => s + 1)} disabled={step === 0 && !purpose} style={{ flex:2 }}>Next</button>}
          {step === 2 && (
            <button className="lme-cta" style={{ flex:2 }} onClick={() => {
              setGenerating(true);
              setTimeout(() => { setGenerating(false); setDone(true); }, 1800);
            }}>Generate report</button>
          )}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// SHARE REPORT SHEET — secure link with expiry
// ═════════════════════════════════════════════════════════════
function ShareReportSheet({ report, onClose, toast }) {
  if (!report) return null;
  const [expiry, setExpiry] = React.useState("72h");
  const [recipient, setRecipient] = React.useState("");
  const [created, setCreated] = React.useState(false);
  const fakeLink = `telecheck.gh/r/${(report.id || "rx") + Math.random().toString(36).slice(2,7)}`;

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight:"86vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-t">{created ? "Link ready" : "Share this report"}</div>
        <div className="sheet-s">{report.title}</div>
        <div className="sheet-body" style={{ padding:"0 18px 22px" }}>
          {!created ? (
            <>
              <label className="lme-label">Send to</label>
              <input className="lme-input" placeholder="Phone, email, or paste a clinician code" value={recipient} onChange={e => setRecipient(e.target.value)}/>

              <label className="lme-label" style={{ marginTop:14 }}>Link expires after</label>
              <div style={{ display:"grid", gap:6 }}>
                {[["24h","24 hours · safest"],["72h","72 hours · default"],["7d","7 days · for hospital admission"],["30d","30 days · long form"]].map(([k,l]) => (
                  <div key={k} className={`lme-radio ${expiry === k ? "on" : ""}`} onClick={() => setExpiry(k)}>
                    <div className="lme-radio-dot"/>
                    <div className="lme-pick-t">{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding:12, borderRadius:11, background:"var(--n-50)", fontSize:12, color:"var(--fg-3)", lineHeight:1.45, marginTop:14 }}>
                Recipients see only this report — not your full record. Every open is logged in your audit trail.
              </div>
              <button className="lme-cta" style={{ marginTop:14 }} onClick={() => setCreated(true)}>Create secure link</button>
              <button className="lme-cta g" style={{ marginTop:8 }} onClick={onClose}>Cancel</button>
            </>
          ) : (
            <>
              <div style={{ padding:14, borderRadius:13, background:"color-mix(in oklab,var(--teal-100) 35%,white)", border:"1px solid color-mix(in oklab,var(--teal-300) 30%,transparent)" }}>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--teal-700)" }}>SECURE LINK · expires in {expiry}</div>
                <div style={{ fontSize:13.5, fontWeight:600, color:"var(--fg-1)", marginTop:6, fontFamily:"'JetBrains Mono',monospace", wordBreak:"break-all" }}>{fakeLink}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
                <button className="lme-cta g" onClick={() => toast("Link copied to clipboard")}>Copy link</button>
                <button className="lme-cta g" onClick={() => toast(recipient ? "Sent to " + recipient : "Pick a recipient first")}>{recipient ? "Send via SMS" : "Add recipient"}</button>
              </div>
              <button className="lme-cta" style={{ marginTop:10 }} onClick={() => { toast("Link saved · in your audit trail"); onClose(); }}>Done</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// LAB UPLOAD SUCCESS — replaces just-toast on submit
// ═════════════════════════════════════════════════════════════
function LabUploadSuccess({ onBack, onViewQueue }) {
  return (
    <>
      <LmeHdr color="teal" title="Submitted" onBack={onBack} backLabel="Labs"/>
      <div className="lme-success">
        <div className="lme-success-ic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div className="lme-success-t">Sent for clinician review</div>
        <div className="lme-success-s">Dr. Mensah has been notified. Typical review window is under 24 hours — you'll get a notification when it's signed off.</div>

        <div style={{ display:"grid", gap:8, marginTop:24, textAlign:"left", maxWidth:320, marginLeft:"auto", marginRight:"auto" }}>
          {[
            ["📤", "Upload received", "Just now"],
            ["🔍", "AI extraction complete", "6 values · 96% confidence"],
            ["⏳", "Awaiting clinician sign-off", "Typically < 24h"],
          ].map(([e,t,s],i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", background:"#fff", borderRadius:11, border:"1px solid var(--border-subtle)" }}>
              <span style={{ fontSize:18 }}>{e}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:"var(--fg-1)" }}>{t}</div>
                <div style={{ fontSize:11, color:"var(--fg-3)" }}>{s}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gap:10, padding:"24px 18px 0", maxWidth:340, margin:"0 auto" }}>
          <button className="lme-cta" onClick={onBack}>Back to labs</button>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// INVITE FAMILY — name, phone, role, permissions
// ═════════════════════════════════════════════════════════════
function InviteFamily({ onBack, toast }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("");
  const [perms, setPerms] = React.useState({ meds:true, labs:true, refill:false, schedule:false, emergency:true });
  const [sent, setSent] = React.useState(false);

  const roles = [
    { id:"parent", t:"Parent or in-law", s:"You care for them" },
    { id:"child", t:"Child (under 16)", s:"Full access by default" },
    { id:"partner", t:"Partner or spouse", s:"They have access to you" },
    { id:"sibling", t:"Sibling or other", s:"Custom permissions" },
  ];

  if (sent) return (
    <>
      <LmeHdr color="teal" title="Invite sent" onBack={onBack} backLabel="Profile"/>
      <div className="lme-success">
        <div className="lme-success-ic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div className="lme-success-t">SMS sent to {phone || "+233 …"}</div>
        <div className="lme-success-s">{name || "Your invitee"} has 7 days to accept. Once they do, your selected permissions activate. You'll see them in your family list.</div>
        <div style={{ display:"grid", gap:10, padding:"24px 18px 0", maxWidth:340, margin:"0 auto" }}>
          <button className="lme-cta" onClick={onBack}>Back to family</button>
          <button className="lme-cta g" onClick={() => { setSent(false); setStep(0); setName(""); setPhone(""); setRole(""); }}>Invite someone else</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <LmeHdr color="teal" title="Invite family" stat={`Step ${step + 1} of 3`} onBack={onBack} backLabel="Profile"/>
      <div style={{ padding:"14px 16px" }}>
        <div className="lme-pips">
          {[0,1,2].map(i => <div key={i} className={`lme-pip ${i <= step ? "on" : ""}`}/>)}
        </div>

        {step === 0 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>Who are you inviting?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:16 }}>Their phone number gets an SMS with a 7-day join link.</div>

            <label className="lme-label">Full name</label>
            <input className="lme-input" placeholder="e.g. Esi Mensah" value={name} onChange={e => setName(e.target.value)}/>

            <label className="lme-label" style={{ marginTop:14 }}>Phone number (Ghana)</label>
            <input className="lme-input" placeholder="+233 24 …" value={phone} onChange={e => setPhone(e.target.value)} type="tel"/>

            <label className="lme-label" style={{ marginTop:14 }}>Their relationship to you</label>
            <div style={{ display:"grid", gap:8 }}>
              {roles.map(r => (
                <div key={r.id} className={`lme-radio ${role === r.id ? "on" : ""}`} onClick={() => setRole(r.id)}>
                  <div className="lme-radio-dot"/>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{r.t}</div>
                    <div className="lme-pick-s">{r.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>What can {name.split(" ")[0] || "they"} do?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>You can change this any time from the family screen.</div>
            <div style={{ display:"grid", gap:8 }}>
              {[
                ["meds","See medications","Active doses, refill dates"],
                ["labs","See labs","All results + summaries"],
                ["refill","Approve refills","Confirm pharmacy orders"],
                ["schedule","Schedule visits","Book or reschedule"],
                ["emergency","Emergency contact","Called if you trigger SOS"],
              ].map(([k,t,s]) => (
                <div key={k} className={`lme-pick ${perms[k] ? "on" : ""}`} onClick={() => setPerms(p => ({ ...p, [k]: !p[k] }))}>
                  <div className="lme-pick-cb"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg></div>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{t}</div>
                    <div className="lme-pick-s">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>Review</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>Make sure this is right before sending.</div>
            <div style={{ background:"#fff", borderRadius:13, border:"1px solid var(--border-subtle)", padding:"4px 14px" }}>
              {[
                ["Name", name || "—"],
                ["Phone", phone || "—"],
                ["Role", roles.find(r => r.id === role)?.t || "—"],
                ["Permissions", Object.values(perms).filter(Boolean).length + " of 5 granted"],
                ["Invite expires", "7 days"],
              ].map(([k,v],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderTop:i>0?"1px solid var(--border-subtle)":"none", fontSize:12.5 }}>
                  <span style={{ color:"var(--fg-3)" }}>{k}</span>
                  <span style={{ fontWeight:600, color:"var(--fg-1)", textAlign:"right", maxWidth:"60%" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:12, borderRadius:11, background:"color-mix(in oklab,var(--teal-100) 30%,white)", fontSize:12, color:"var(--teal-700)", lineHeight:1.45, marginTop:14 }}>
              ✓ All actions {name.split(" ")[0] || "they"} take will be logged to your record. You can revoke access at any time.
            </div>
          </>
        )}

        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          {step > 0 && <button className="lme-cta g" onClick={() => setStep(s => s - 1)} style={{ flex:1 }}>Back</button>}
          {step < 2 && <button className="lme-cta" style={{ flex:2 }} disabled={step === 0 && (!name || !phone || !role)} onClick={() => setStep(s => s + 1)}>Next</button>}
          {step === 2 && <button className="lme-cta" style={{ flex:2 }} onClick={() => setSent(true)}>Send invite</button>}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// SHARE WITH HOSPITAL — wizard
// ═════════════════════════════════════════════════════════════
function ShareWithHospital({ onBack, toast }) {
  const [step, setStep] = React.useState(0);
  const [hospital, setHospital] = React.useState("");
  const [sections, setSections] = React.useState({ labs:true, meds:true, conditions:true, visits:false, allergies:true, immunizations:false });
  const [duration, setDuration] = React.useState("72h");
  const [done, setDone] = React.useState(false);

  const hospitals = [
    { id:"korlebu", t:"Korle Bu Teaching Hospital", s:"Accra · public · 2,000 beds" },
    { id:"37", t:"37 Military Hospital", s:"Accra · public · 500 beds" },
    { id:"nyaho", t:"Nyaho Medical Centre", s:"Accra · private · cardiology" },
    { id:"trust", t:"Trust Hospital Osu", s:"Accra · private · GP referrals" },
  ];

  if (done) return (
    <>
      <LmeHdr color="blue" title="Shared" onBack={onBack} backLabel="Records"/>
      <div className="lme-success">
        <div className="lme-success-ic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div className="lme-success-t">Record shared</div>
        <div className="lme-success-s">{hospitals.find(h => h.id === hospital)?.t} can view {Object.values(sections).filter(Boolean).length} sections of your record for {duration}. Every open is logged.</div>
        <div style={{ display:"grid", gap:10, padding:"24px 18px 0", maxWidth:340, margin:"0 auto" }}>
          <button className="lme-cta" onClick={onBack}>Done</button>
          <button className="lme-cta g" onClick={() => toast("Audit log opened")}>See who's accessed it</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <LmeHdr color="blue" title="Share with a hospital" stat={`Step ${step + 1} of 3`} onBack={onBack} backLabel="Records"/>
      <div style={{ padding:"14px 16px" }}>
        <div className="lme-pips">
          {[0,1,2].map(i => <div key={i} className={`lme-pip ${i <= step ? "on" : ""}`}/>)}
        </div>

        {step === 0 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>Which hospital?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>Only hospitals verified by the Ghana Health Service appear here.</div>
            <div style={{ display:"grid", gap:8 }}>
              {hospitals.map(h => (
                <div key={h.id} className={`lme-radio ${hospital === h.id ? "on" : ""}`} onClick={() => setHospital(h.id)}>
                  <div className="lme-radio-dot"/>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{h.t}</div>
                    <div className="lme-pick-s">{h.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>What should they see?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>Pick only what's relevant for the visit.</div>
            <div style={{ display:"grid", gap:8 }}>
              {[
                ["labs","Lab results","All categories · 11 results"],
                ["meds","Active medications","3 active prescriptions"],
                ["conditions","Conditions","Type-2 diabetes, hypertension"],
                ["allergies","Allergies","Penicillin"],
                ["visits","Visit notes","12 past visits"],
                ["immunizations","Immunizations","9 vaccines · Ghana EPI"],
              ].map(([k,t,s]) => (
                <div key={k} className={`lme-pick ${sections[k] ? "on" : ""}`} onClick={() => setSections(p => ({ ...p, [k]: !p[k] }))}>
                  <div className="lme-pick-cb"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5 9-11"/></svg></div>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{t}</div>
                    <div className="lme-pick-s">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:4 }}>For how long?</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:14 }}>Access auto-revokes after this. You can revoke earlier from Records.</div>
            <div style={{ display:"grid", gap:8 }}>
              {[["24h","24 hours","Same-day visit"],["72h","72 hours","Recommended"],["7d","7 days","Multi-day inpatient"],["30d","30 days","Surgical workup"]].map(([k,t,s]) => (
                <div key={k} className={`lme-radio ${duration === k ? "on" : ""}`} onClick={() => setDuration(k)}>
                  <div className="lme-radio-dot"/>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{t}</div>
                    <div className="lme-pick-s">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          {step > 0 && <button className="lme-cta g" onClick={() => setStep(s => s - 1)} style={{ flex:1 }}>Back</button>}
          {step < 2 && <button className="lme-cta" style={{ flex:2 }} disabled={step === 0 && !hospital} onClick={() => setStep(s => s + 1)}>Next</button>}
          {step === 2 && <button className="lme-cta" style={{ flex:2 }} onClick={() => setDone(true)}>Share record</button>}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// ADD PAYMENT METHOD
// ═════════════════════════════════════════════════════════════
function AddPaymentMethod({ onBack, toast }) {
  const [provider, setProvider] = React.useState("");
  const [num, setNum] = React.useState("");
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const providers = [
    { id:"mtn", t:"MTN Mobile Money", s:"Most common in Accra" },
    { id:"voda", t:"Vodafone Cash", s:"Vodafone numbers" },
    { id:"airtel", t:"AirtelTigo Money", s:"AirtelTigo numbers" },
    { id:"card", t:"Visa or Mastercard", s:"Add a debit or credit card" },
  ];

  if (done) return (
    <>
      <LmeHdr color="iris" title="Added" onBack={onBack} backLabel="Account"/>
      <div className="lme-success">
        <div className="lme-success-ic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div className="lme-success-t">Payment method added</div>
        <div className="lme-success-s">{providers.find(p => p.id === provider)?.t} ending in {num.slice(-3) || "…"} is saved as a backup. Make it your default from Account → Plan & billing.</div>
        <div style={{ display:"grid", gap:10, padding:"24px 18px 0", maxWidth:340, margin:"0 auto" }}>
          <button className="lme-cta" onClick={onBack}>Back to billing</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <LmeHdr color="iris" title="Add payment" stat={`Step ${step + 1} of 2`} onBack={onBack} backLabel="Account"/>
      <div style={{ padding:"14px 16px" }}>
        <div className="lme-pips">
          {[0,1].map(i => <div key={i} className={`lme-pip ${i <= step ? "on" : ""}`}/>)}
        </div>

        {step === 0 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:14 }}>Pick a provider</div>
            <div style={{ display:"grid", gap:8 }}>
              {providers.map(p => (
                <div key={p.id} className={`lme-radio ${provider === p.id ? "on" : ""}`} onClick={() => setProvider(p.id)}>
                  <div className="lme-radio-dot"/>
                  <div style={{ flex:1 }}>
                    <div className="lme-pick-t">{p.t}</div>
                    <div className="lme-pick-s">{p.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)", marginBottom:14 }}>{providers.find(p => p.id === provider)?.t}</div>
            <label className="lme-label">{provider === "card" ? "Card number" : "Mobile number"}</label>
            <input className="lme-input" placeholder={provider === "card" ? "•••• •••• •••• ••••" : "+233 24 …"} value={num} onChange={e => setNum(e.target.value)}/>
            {provider !== "card" && (
              <div style={{ padding:12, borderRadius:11, background:"color-mix(in oklab,var(--iris-100) 30%,white)", fontSize:12, color:"var(--iris-700)", lineHeight:1.45, marginTop:14 }}>
                You'll get a USSD prompt on your phone to confirm. Telecheck never stores your PIN.
              </div>
            )}
          </>
        )}

        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          {step > 0 && <button className="lme-cta g" onClick={() => setStep(s => s - 1)} style={{ flex:1 }}>Back</button>}
          {step < 1 && <button className="lme-cta" style={{ flex:2 }} disabled={!provider} onClick={() => setStep(1)}>Next</button>}
          {step === 1 && <button className="lme-cta" style={{ flex:2 }} disabled={!num} onClick={() => setDone(true)}>Add method</button>}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// HELP CENTER
// ═════════════════════════════════════════════════════════════
function HelpCenter({ onBack, onContact }) {
  const [q, setQ] = React.useState("");
  const articles = [
    { t:"Setting up delegation for a parent", s:"Add a family member, choose what they can do, send the SMS invite.", cat:"Family" },
    { t:"Reading your lab report", s:"What 'reviewed' vs 'AI only' means, and how to interpret flagged values.", cat:"Labs" },
    { t:"What NHIS covers on Telecheck", s:"Which visits, prescriptions and labs are covered or co-paid.", cat:"Billing" },
    { t:"Switching to Twi or Ga", s:"Voice-first mode, language settings, and translated lab reports.", cat:"Account" },
    { t:"Sharing your record with a hospital", s:"Time-bound access, picking sections, revoking early.", cat:"Privacy" },
    { t:"What to do if your medication looks wrong", s:"Use Pharmacy → Safety to scan your dispensed pack.", cat:"Pharmacy" },
    { t:"Using video visits with poor connection", s:"Audio-only fallback, retry strategy, when to call 112.", cat:"Visits" },
  ];
  const filtered = articles.filter(a => !q || a.t.toLowerCase().includes(q.toLowerCase()) || a.s.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <LmeHdr color="teal" title="Help center" stat={`${articles.length} articles · Ghana-specific`} onBack={onBack} backLabel="Account"/>
      <div style={{ padding:"14px 16px", display:"grid", gap:12 }}>
        <div className="lme-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
          <input placeholder="Search help articles" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <button className="lme-cta" onClick={onContact}>Chat with support</button>
        {filtered.length === 0 && (
          <div style={{ padding:"32px 18px", textAlign:"center", background:"#fff", borderRadius:14, border:"1px dashed var(--border-strong)" }}>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--fg-1)" }}>Nothing matches "{q}"</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginTop:4 }}>Try a different word, or chat with support.</div>
          </div>
        )}
        {filtered.length > 0 && (
          <div style={{ display:"grid", gap:8 }}>
            {filtered.map((a, i) => (
              <div key={i} className="lme-art">
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--teal-700)", marginBottom:4 }}>{a.cat}</div>
                <div className="lme-art-t">{a.t}</div>
                <div className="lme-art-s">{a.s}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// SUPPORT CHAT
// ═════════════════════════════════════════════════════════════
function SupportChat({ onBack }) {
  const [msgs, setMsgs] = React.useState([
    { who:"them", t:"Akwaaba — I'm Esi from Telecheck support. I can see your account. What's going on?", at:"now" },
  ]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef();

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    setMsgs(m => [...m, { who:"me", t, at:"now" }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { who:"them", t:"Got it — I'm pulling that up now. Give me 30s.", at:"now" }]);
    }, 1400);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <LmeHdr color="iris" title="Support · Esi" stat="Online · usually replies within 10 min" onBack={onBack} backLabel="Help"
        right={<span style={{ fontSize:9, fontWeight:700, color:"#166534", background:"#dcfce7", padding:"3px 8px", borderRadius:9999 }}>● LIVE</span>}/>
      <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:8, background:"var(--n-50)" }}>
        {msgs.map((m, i) => (
          <div key={i} className={`lme-bubble ${m.who}`}>
            {m.t}
            <div className="lme-bubble-meta">{m.at}</div>
          </div>
        ))}
        {typing && (
          <div className="lme-bubble them" style={{ display:"flex", gap:4, padding:"12px 14px" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--fg-3)", animation:"lmeShim 0.9s linear infinite alternate" }}/>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--fg-3)", animation:"lmeShim 0.9s linear .15s infinite alternate" }}/>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--fg-3)", animation:"lmeShim 0.9s linear .3s infinite alternate" }}/>
          </div>
        )}
      </div>
      <div style={{ padding:"10px 14px 14px", display:"flex", gap:8, background:"#fff", borderTop:"1px solid var(--border-subtle)" }}>
        <input className="lme-input" placeholder="Type a message…" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}/>
        <button onClick={send} disabled={!draft.trim()} style={{ padding:"0 16px", borderRadius:11, background:"var(--teal-500)", color:"#fff", border:0, fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Send</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// CHANGE PASSWORD — current → new → confirm with strength meter
// ═════════════════════════════════════════════════════════════
function ChangePasswordScreen({ onBack, toast }) {
  const [step, setStep] = React.useState(0);
  const [cur, setCur] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // strength: 0..4
  const strength = (() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  })();
  const strengthLabel = ["Too short","Weak","OK","Strong","Very strong"][strength];
  const strengthColor = ["#c8402f","#c8402f","#c28320","#2a8a4a","#166534"][strength];

  const checks = [
    { ok:pw.length >= 8, t:"At least 8 characters" },
    { ok:/[A-Z]/.test(pw) && /[a-z]/.test(pw), t:"Upper & lower case" },
    { ok:/[0-9]/.test(pw), t:"At least one number" },
    { ok:/[^A-Za-z0-9]/.test(pw), t:"At least one symbol" },
    { ok:pw.length > 0 && pw === pw2, t:"Passwords match" },
  ];
  const canSave = checks.every(c => c.ok) && cur.length > 0;

  if (done) return (
    <>
      <LmeHdr color="iris" title="Password updated" onBack={onBack} backLabel="Account"/>
      <div className="lme-success">
        <div className="lme-success-ic">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
        </div>
        <div className="lme-success-t">Password changed</div>
        <div className="lme-success-s">Other devices have been signed out as a safety measure. You'll need to sign in again on your tablet.</div>
        <div style={{ display:"grid", gap:10, padding:"24px 18px 0", maxWidth:340, margin:"0 auto" }}>
          <button className="lme-cta" onClick={onBack}>Back to account</button>
        </div>
      </div>
    </>
  );

  if (step === 0) return (
    <>
      <LmeHdr color="iris" title="Change password" stat="Confirm it's you" onBack={onBack} backLabel="Account"/>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ padding:14, borderRadius:12, background:"color-mix(in oklab,var(--iris-100) 25%,white)", fontSize:12.5, color:"var(--fg-2)", lineHeight:1.45, marginBottom:18 }}>
          For your safety, we'll ask for your current password before letting you change it. You can also reset via SMS if you've forgotten it.
        </div>
        <label className="lme-label">Current password</label>
        <div style={{ position:"relative" }}>
          <input className="lme-input" type={show ? "text" : "password"} placeholder="Enter your current password" value={cur} onChange={e => setCur(e.target.value)} style={{ paddingRight:60 }}/>
          <span onClick={() => setShow(s => !s)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:600, color:"var(--teal-600)", cursor:"pointer" }}>{show ? "Hide" : "Show"}</span>
        </div>
        <div style={{ textAlign:"right", marginTop:8 }}>
          <span onClick={() => toast("Reset code sent to +233 ··· 812")} style={{ fontSize:12, fontWeight:600, color:"var(--teal-600)", cursor:"pointer" }}>Forgot password?</span>
        </div>
        <button className="lme-cta" style={{ marginTop:18 }} disabled={cur.length < 4} onClick={() => setStep(1)}>Continue</button>
      </div>
    </>
  );

  return (
    <>
      <LmeHdr color="iris" title="New password" stat="Pick something hard to guess" onBack={() => setStep(0)} backLabel="Back"/>
      <div style={{ padding:"14px 16px" }}>
        <label className="lme-label">New password</label>
        <div style={{ position:"relative" }}>
          <input className="lme-input" type={show ? "text" : "password"} placeholder="At least 8 characters" value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight:60 }}/>
          <span onClick={() => setShow(s => !s)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:600, color:"var(--teal-600)", cursor:"pointer" }}>{show ? "Hide" : "Show"}</span>
        </div>

        {/* strength meter */}
        <div style={{ display:"flex", gap:4, marginTop:10 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i < strength ? strengthColor : "var(--n-200)", transition:"background .2s" }}/>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11 }}>
          <span style={{ color:"var(--fg-3)" }}>Strength</span>
          <span style={{ fontWeight:600, color: pw.length === 0 ? "var(--fg-4)" : strengthColor }}>{pw.length === 0 ? "—" : strengthLabel}</span>
        </div>

        <label className="lme-label" style={{ marginTop:18 }}>Confirm new password</label>
        <input className="lme-input" type={show ? "text" : "password"} placeholder="Re-enter new password" value={pw2} onChange={e => setPw2(e.target.value)}/>

        <div style={{ marginTop:16, padding:14, borderRadius:12, background:"#fff", border:"1px solid var(--border-subtle)" }}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--fg-4)", marginBottom:10 }}>Requirements</div>
          {checks.map((c, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", fontSize:12.5, color: c.ok ? "#166534" : "var(--fg-3)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.ok ? "#166534" : "var(--fg-4)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {c.ok ? <path d="M5 12l5 5 9-11"/> : <circle cx="12" cy="12" r="9"/>}
              </svg>
              {c.t}
            </div>
          ))}
        </div>

        <button className="lme-cta" style={{ marginTop:18 }} disabled={!canSave} onClick={() => { setDone(true); }}>Update password</button>
      </div>
    </>
  );
}

// expose
Object.assign(window, {
  LabRepository, LabTrendDetail, GenerateReportWizard, ShareReportSheet, LabUploadSuccess,
  InviteFamily, ShareWithHospital, AddPaymentMethod, HelpCenter, SupportChat,
  ChangePasswordScreen,
});
