// ─────────────────────────────────────────────────────────────────
// Home UX enhancements:
// 1. Bottom sheets for glance card taps (no navigation, stay on Home)
// 2. Bottom sheets for floating bar taps (read-only peek)
// 3. Scroll position restore on return
// 4. Origin-aware back labels via window.__tcOrigin
// ─────────────────────────────────────────────────────────────────

(function injectNavEnhStyles() {
  if (document.getElementById("nav-enh-styles")) return;
  const s = document.createElement("style");
  s.id = "nav-enh-styles";
  s.textContent = `
    /* ── Bottom sheet backdrop ─────────────────────────────── */
    .ne-scrim {
      position: absolute; inset: 0; background: rgba(0,0,0,0); z-index: 75;
      animation: ne-scrim-in 0.28s ease forwards;
    }
    @keyframes ne-scrim-in { to { background: rgba(0,0,0,0.38); } }

    /* ── Bottom sheet panel ────────────────────────────────── */
    .ne-sheet {
      position: absolute; left: 0; right: 0; bottom: 0;
      background: #fff;
      border-radius: 20px 20px 0 0;
      z-index: 76;
      max-height: 82%;
      overflow-y: auto;
      scrollbar-width: none;
      animation: ne-sheet-in 0.32s cubic-bezier(0.2,0,0,1) forwards;
      padding-bottom: 34px;
    }
    .ne-sheet::-webkit-scrollbar { display: none; }
    @keyframes ne-sheet-in {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    .ne-handle {
      width: 36px; height: 4px; border-radius: 2px;
      background: var(--n-200); margin: 10px auto 14px;
    }

    /* ── Sheet header ──────────────────────────────────────── */
    .ne-sheet-hd {
      padding: 0 18px 12px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
    }
    .ne-sheet-title { font-size: 17px; font-weight: 700; letter-spacing: -.015em; color: var(--fg-1); font-family: 'Space Grotesk', sans-serif; }
    .ne-sheet-sub   { font-size: 12px; color: var(--fg-3); margin-top: 3px; }
    .ne-sheet-go    {
      padding: 7px 14px; border-radius: 9px; background: var(--teal-500);
      color: #fff; font-size: 12px; font-weight: 700;
      border: 0; font-family: inherit; cursor: pointer; flex-shrink: 0; align-self: flex-start;
    }

    /* ── Metric row inside sheet ───────────────────────────── */
    .ne-metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 18px 0; }
    .ne-metric {
      background: var(--n-50); border-radius: 13px; padding: 12px 13px;
      border: 1px solid var(--border-subtle);
    }
    .ne-metric-lbl { font-size: 9.5px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--fg-4); margin-bottom: 6px; }
    .ne-metric-val  { font-size: 24px; font-weight: 700; letter-spacing: -.025em; color: var(--fg-1); line-height: 1; }
    .ne-metric-unit { font-size: 10px; color: var(--fg-4); margin-top: 2px; }
    .ne-metric-chip { display: inline-block; font-size: 8.5px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; margin-top: 7px; }
    .ne-metric-chip.warn { background: #fef3c7; color: #b45309; }
    .ne-metric-chip.bad  { background: #fee2e2; color: #b91c1c; }
    .ne-metric-chip.ok   { background: #dcfce7; color: #166534; }
    .ne-metric-chip.lo   { background: #e8f0fe; color: #1a56db; }

    /* ── Clinician note inside sheet ───────────────────────── */
    .ne-note {
      margin: 14px 18px 0;
      padding: 12px 14px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--teal-50) 50%, white);
      border: 1px solid var(--teal-100);
      font-size: 12.5px; color: var(--fg-2); line-height: 1.5;
    }
    .ne-note-tag { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--teal-700); margin-bottom: 5px; }

    /* ── AI note inside sheet ──────────────────────────────── */
    .ne-ai-note {
      margin: 10px 18px 0;
      padding: 12px 14px;
      border-radius: 12px;
      background: color-mix(in oklab, var(--iris-50) 55%, white);
      border: 1px solid color-mix(in oklab, var(--iris-200) 35%, transparent);
      font-size: 12.5px; color: var(--fg-2); line-height: 1.5;
    }
    .ne-ai-note-tag { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--iris-600); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }

    /* ── Trend sparkline in sheet ──────────────────────────── */
    .ne-spark { margin: 14px 18px 0; }
    .ne-spark-title { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--fg-4); margin-bottom: 8px; }

    /* ── Return toast / origin chip ───────────────────────── */
    .ne-origin-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 10.5px; font-weight: 600; color: var(--fg-3);
      background: var(--n-50); border: 1px solid var(--border-subtle);
      padding: 4px 10px; border-radius: 9999px;
      position: absolute; top: 98px; left: 50%; transform: translateX(-50%);
      z-index: 28; white-space: nowrap;
      animation: ne-chip-in 0.2s ease, ne-chip-out 0.3s ease 2s forwards;
      pointer-events: none;
    }
    @keyframes ne-chip-in  { from { opacity: 0; transform: translateX(-50%) translateY(-6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes ne-chip-out { to   { opacity: 0; transform: translateX(-50%) translateY(-6px); } }
  `;
  document.head.appendChild(s);
})();

// ── Glance sheet data ─────────────────────────────────────────
const GLANCE_SHEETS = {
  summary: {
    title: "At a glance",
    sub: "Your key numbers · today",
    goLabel: "All labs",
    goRoute: "labs",
    content: "summary",
  },
  vitals: {
    title: "Lab results",
    sub: "Latest reviewed · 14 Apr 2026",
    goLabel: "Open Labs",
    goRoute: "labs",
    content: "vitals",
    clinicianNote: "HbA1c up slightly — holding evening metformin timing for 6 weeks. Kidney and liver look solid.",
    aiNote: "Glucose spikes correlate with Tuesday/Thursday dinners. A half-portion swap could cut the spike by ~30 mg/dL.",
  },
  lipids: {
    title: "Lipid panel",
    sub: "28 Feb 2026 · Dr. Mensah reviewed",
    goLabel: "Open Labs",
    goRoute: "labs",
    content: "lipids",
    clinicianNote: "LDL borderline — let's try 2 fish-based meals per week and revisit in 3 months before considering a statin.",
  },
  liver: {
    title: "Liver & kidney",
    sub: "14 Apr 2026 · all normal",
    goLabel: "Open Labs",
    goRoute: "labs",
    content: "liver",
    clinicianNote: "Kidneys filtering well at eGFR 94. Liver enzymes (ALT/AST) normal. Keep up the hydration.",
  },
  meds: {
    title: "Medications today",
    sub: "2 taken · 2 pending",
    goLabel: "Pharmacy",
    goRoute: "pharmacy",
    content: "meds",
  },
  visit: {
    title: "Next visit",
    sub: "Dr. Mensah · video · Mon 20 Apr",
    goLabel: "Prep now",
    goRoute: "visit-prep",
    content: "visit",
    clinicianNote: "Pre-call checklist done. HbA1c result attached. One question flagged: evening dosing schedule.",
  },
  programs: {
    title: "RPM program",
    sub: "Diabetes · Week 12/26 · Dr. Mensah",
    goLabel: "Check-in",
    goRoute: "rpm",
    content: "programs",
    clinicianNote: "92% adherence — you're in the top 15% of the cohort. Re-check at week 18.",
  },
};

// ── Sheet content renderers ───────────────────────────────────
function GlanceSheetContent({ type }) {
  if (type === "summary") return (
    <div className="ne-metric-grid">
      {[
        { lbl:"Labs",     val:"2",  unit:"new results", chip:"warn" },
        { lbl:"Meds",     val:"3",  unit:"active",      chip:"ok"   },
        { lbl:"Orders",   val:"1",  unit:"in progress", chip:"warn" },
        { lbl:"Pharmacy", val:"1",  unit:"in review",   chip:"warn" },
      ].map((m,i) => (
        <div key={i} className="ne-metric">
          <div className="ne-metric-lbl">{m.lbl}</div>
          <div className="ne-metric-val">{m.val}</div>
          <div className="ne-metric-unit">{m.unit}</div>
          <span className={`ne-metric-chip ${m.chip}`}>{m.chip === "ok" ? "On track" : "Attention"}</span>
        </div>
      ))}
    </div>
  );

  if (type === "vitals") return (
    <div className="ne-metric-grid">
      {[
        { lbl:"HbA1c",   val:"7.8", unit:"%",      chip:"warn", chipLabel:"↑ High"   },
        { lbl:"Glucose", val:"132", unit:"mg/dL",  chip:"bad",  chipLabel:"↑ High"   },
        { lbl:"eGFR",    val:"94",  unit:"mL/min", chip:"ok",   chipLabel:"Normal"   },
        { lbl:"Haemog.", val:"11.2",unit:"g/dL",   chip:"lo",   chipLabel:"↓ Low"    },
      ].map((m,i) => (
        <div key={i} className="ne-metric">
          <div className="ne-metric-lbl">{m.lbl}</div>
          <div className="ne-metric-val">{m.val}</div>
          <div className="ne-metric-unit">{m.unit}</div>
          <span className={`ne-metric-chip ${m.chip}`}>{m.chipLabel}</span>
        </div>
      ))}
    </div>
  );

  if (type === "lipids") return (
    <div className="ne-metric-grid">
      {[
        { lbl:"LDL",   val:"142", unit:"mg/dL", chip:"warn", chipLabel:"↑ Borderline" },
        { lbl:"HDL",   val:"48",  unit:"mg/dL", chip:"ok",   chipLabel:"Normal"       },
        { lbl:"Total", val:"210", unit:"mg/dL", chip:"warn", chipLabel:"↑ Borderline" },
        { lbl:"Trig.", val:"148", unit:"mg/dL", chip:"ok",   chipLabel:"Normal"       },
      ].map((m,i) => (
        <div key={i} className="ne-metric">
          <div className="ne-metric-lbl">{m.lbl}</div>
          <div className="ne-metric-val">{m.val}</div>
          <div className="ne-metric-unit">{m.unit}</div>
          <span className={`ne-metric-chip ${m.chip}`}>{m.chipLabel}</span>
        </div>
      ))}
    </div>
  );

  if (type === "liver") return (
    <div className="ne-metric-grid">
      {[
        { lbl:"eGFR",       val:"94",  unit:"mL/min", chip:"ok", chipLabel:"Normal" },
        { lbl:"Creatinine", val:"0.9", unit:"mg/dL",  chip:"ok", chipLabel:"Normal" },
        { lbl:"ALT",        val:"22",  unit:"U/L",    chip:"ok", chipLabel:"Normal" },
        { lbl:"AST",        val:"24",  unit:"U/L",    chip:"ok", chipLabel:"Normal" },
      ].map((m,i) => (
        <div key={i} className="ne-metric">
          <div className="ne-metric-lbl">{m.lbl}</div>
          <div className="ne-metric-val">{m.val}</div>
          <div className="ne-metric-unit">{m.unit}</div>
          <span className={`ne-metric-chip ${m.chip}`}>{m.chipLabel}</span>
        </div>
      ))}
    </div>
  );

  if (type === "meds") return (
    <div style={{ padding: "14px 18px 0", display: "grid", gap: 10 }}>
      {[
        { name:"Metformin 500 mg",  time:"07:00", done:true,  color:"#7c6fcd" },
        { name:"Lisinopril 10 mg",  time:"07:00", done:true,  color:"#5b8dee" },
        { name:"Metformin 500 mg",  time:"19:00", done:false, color:"#7c6fcd" },
        { name:"Vitamin D 1000 IU", time:"19:00", done:false, color:"#3aaa7a" },
      ].map((m,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 13px", background:"var(--n-50)", borderRadius:12, border:"1px solid var(--border-subtle)" }}>
          <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${m.color}`, background:m.done?m.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {m.done && <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 5 L4 7.5 L8 2.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
          </div>
          <div style={{ flex:1, fontSize:13, fontWeight:600, color:m.done?"var(--fg-3)":"var(--fg-1)", textDecoration:m.done?"line-through":"none" }}>{m.name}</div>
          <div style={{ fontSize:11.5, fontWeight:700, color:m.done?"var(--fg-4)":m.color }}>{m.time}</div>
        </div>
      ))}
      <div style={{ fontSize:11, color:"var(--fg-3)", textAlign:"center", padding:"4px 0" }}>2 taken · 2 pending · 94% adherence ↑</div>
    </div>
  );

  if (type === "visit") return (
    <div style={{ padding:"14px 18px 0", display:"grid", gap:10 }}>
      <div style={{ background:"var(--n-50)", borderRadius:13, padding:"14px", border:"1px solid var(--border-subtle)" }}>
        <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#5b8dee", marginBottom:6 }}>Next video visit</div>
        <div style={{ fontSize:18, fontWeight:700, color:"var(--fg-1)", letterSpacing:"-.01em" }}>Dr. Akosua Mensah</div>
        <div style={{ fontSize:13, color:"var(--fg-3)", marginTop:4 }}>Mon 20 Apr · 10:30 · Video follow-up</div>
        <div style={{ fontSize:13, color:"var(--fg-3)", marginTop:2 }}>HbA1c discussion · 15 min</div>
      </div>
      {[
        { k:"Device check", v:"Done ✓" },
        { k:"HbA1c result", v:"Attached ✓" },
        { k:"Questions flagged", v:"1 · evening dosing" },
      ].map((r,i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 13px", background:"var(--n-50)", borderRadius:11, border:"1px solid var(--border-subtle)", fontSize:12.5 }}>
          <span style={{ color:"var(--fg-3)" }}>{r.k}</span>
          <span style={{ fontWeight:700, color:"var(--fg-1)" }}>{r.v}</span>
        </div>
      ))}
    </div>
  );

  if (type === "programs") return (
    <div style={{ padding:"14px 18px 0", display:"grid", gap:10 }}>
      <div style={{ background:"var(--n-50)", borderRadius:13, padding:"14px", border:"1px solid var(--border-subtle)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#e07b54", marginBottom:3 }}>RPM program</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--fg-1)" }}>Diabetes RPM</div>
            <div style={{ fontSize:12, color:"var(--fg-3)", marginTop:2 }}>Dr. Mensah · Adherence 92%</div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"#e07b54", background:"rgba(224,123,84,.12)", padding:"4px 9px", borderRadius:9999, alignSelf:"flex-start" }}>WK 12/26</div>
        </div>
        <div style={{ height:7, background:"rgba(224,123,84,.15)", borderRadius:4, overflow:"hidden" }}>
          <div style={{ width:"46%", height:"100%", background:"#e07b54", borderRadius:4 }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"var(--fg-3)" }}>
          <span>Onboard · Stabilize</span><span style={{ fontWeight:700, color:"var(--fg-1)" }}>Re-check →</span>
        </div>
      </div>
      <div style={{ padding:"10px 13px", background:"var(--n-50)", borderRadius:11, border:"1px solid var(--border-subtle)", fontSize:12.5, display:"flex", justifyContent:"space-between" }}>
        <span style={{ color:"var(--fg-3)" }}>Weekly check-in</span>
        <span style={{ fontWeight:700, color:"#e07b54" }}>Due today</span>
      </div>
    </div>
  );

  return null;
}

// ── Glance bottom sheet ───────────────────────────────────────
function GlanceSheet({ sheetId, onClose, onGoTo }) {
  const data = GLANCE_SHEETS[sheetId];
  if (!data) return null;
  return (
    <>
      <div className="ne-scrim" onClick={onClose}/>
      <div className="ne-sheet">
        <div className="ne-handle"/>
        <div className="ne-sheet-hd">
          <div>
            <div className="ne-sheet-title">{data.title}</div>
            <div className="ne-sheet-sub">{data.sub}</div>
          </div>
          <button className="ne-sheet-go" onClick={() => { onClose(); onGoTo(data.goRoute); }}>
            {data.goLabel} →
          </button>
        </div>
        <GlanceSheetContent type={data.content}/>
        {data.clinicianNote && (
          <div className="ne-note">
            <div className="ne-note-tag">Dr. Mensah · note</div>
            {data.clinicianNote}
          </div>
        )}
        {data.aiNote && (
          <div className="ne-ai-note">
            <div className="ne-ai-note-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2 2M17 17l2 2M17 7l2-2M5 19l2-2"/></svg>
              AI insight
            </div>
            {data.aiNote}
          </div>
        )}
        <div style={{ height:20 }}/>
      </div>
    </>
  );
}

// ── Floating bar peek sheet ───────────────────────────────────
const FLOAT_SHEETS = {
  "care-visits": {
    title:"Next visit", sub:"Dr. Mensah · today 10:30", goLabel:"Visit prep", goRoute:"visit-prep",
    content:"visit", clinicianNote:"Pre-call checklist done. HbA1c attached. Question flagged: evening dosing.",
  },
  "labs": {
    title:"Labs", sub:"3 flagged · last updated 20 Apr", goLabel:"Open Labs", goRoute:"labs",
    content:"vitals", clinicianNote:"HbA1c up slightly — holding metformin timing. Kidneys solid.",
    aiNote:"Glucose spikes on Tue/Thu dinners. Half-portion swap could cut spike ~30 mg/dL.",
  },
  "pharmacy": {
    title:"Medications", sub:"3 active · 1 refill in review", goLabel:"Pharmacy", goRoute:"pharmacy",
    content:"meds",
  },
  "care-track": {
    title:"Tracking", sub:"Glucose 132 · BP 124/78 · today", goLabel:"Log a reading", goRoute:"care-track",
    content:"vitals", clinicianNote:"Good trend on fasting glucose. Evening readings still the target window.",
  },
};

// ── Hub back-to-Home pill ─────────────────────────────────────
// Shown at top of section hubs when origin === "Home"
function HubBackBar() {
  const [origin, setOrigin] = React.useState(() => window.__tcOrigin);
  React.useEffect(() => {
    // Re-read on mount; also poll briefly in case origin changes after render
    setOrigin(window.__tcOrigin);
  }, []);
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

// ── Origin-aware back label helper ────────────────────────────
// Sets window.__tcOrigin so back buttons can read it
function useOriginNav(baseNav, currentScreen) {
  return React.useCallback((dest, origin) => {
    if (origin) window.__tcOrigin = origin;
    baseNav(dest);
  }, [baseNav, currentScreen]);
}

// Back label component — reads window.__tcOrigin
function OriginBackBtn({ defaultLabel, onBack, style }) {
  const label = window.__tcOrigin || defaultLabel;
  return (
    <button onClick={() => { window.__tcOrigin = null; onBack(); }} style={{
      display:"flex", alignItems:"center", gap:4, background:"none", border:0,
      fontSize:12, fontWeight:500, color:"var(--fg-3)", padding:"4px 0 8px",
      cursor:"pointer", fontFamily:"inherit", ...style
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l-6 6 6 6"/>
      </svg>
      {label}
    </button>
  );
}

// ── Scroll-restore wrapper ─────────────────────────────────────
// Patches the .scroll element to remember + restore position per screen
function useScrollRestore(scrollRef, screenKey) {
  const positions = React.useRef({});
  React.useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    // Restore saved position
    const saved = positions.current[screenKey] || 0;
    el.scrollTop = saved;
    const save = () => { positions.current[screenKey] = el.scrollTop; };
    el.addEventListener("scroll", save, { passive:true });
    return () => el.removeEventListener("scroll", save);
  }, [screenKey]);
}

// ── Enhanced GlanceCarousel wrapper ───────────────────────────
// Intercepts glance page clicks, opens bottom sheet instead of navigating
function GlanceCarouselEnhanced({ nav }) {
  const [sheet, setSheet] = React.useState(null);
  // Override child nav calls with sheet opener
  const interceptNav = (dest) => {
    // Map destination to a sheet ID
    const sheetMap = {
      "labs": "vitals", "labs-trends": "vitals",
      "pharmacy": "meds", "pharmacy-rx": "meds",
      "visit-prep": "visit",
      "care": "programs", "rpm": "programs",
    };
    const sheetId = sheetMap[dest];
    if (sheetId) { setSheet(sheetId); return; }
    nav(dest);
  };
  return (
    <>
      <GlanceCarousel nav={interceptNav}/>
      {sheet && (
        <GlanceSheet
          sheetId={sheet}
          onClose={() => setSheet(null)}
          onGoTo={(route) => { window.__tcOrigin = "Home"; nav(route); }}
        />
      )}
    </>
  );
}

// ── Enhanced floating bar with peek sheets ────────────────────
function FloatingGlanceBarEnhanced({ visible, nav, openAI }) {
  const [sheet, setSheet] = React.useState(null);
  const FLOAT_ITEMS_ENH = [
    { n:"video",  c:"#c8402f",          label:"Visit",  go:"care-visits" },
    { n:"lab",    c:"#c28320",          label:"Labs",   go:"labs"        },
    { n:"pill",   c:"#7c6fcd",          label:"Meds",   go:"pharmacy"    },
    { n:"heart",  c:"var(--teal-700)",  label:"Track",  go:"care-track"  },
  ];
  const handleTap = (item) => {
    const sheetData = FLOAT_SHEETS[item.go];
    if (sheetData) { setSheet(item.go); return; }
    nav(item.go);
  };
  return (
    <>
      <div style={{
        position:"absolute", top:94, left:0, right:0, zIndex:28,
        transform: visible ? "translateY(0)" : "translateY(-48px)",
        opacity: visible ? 1 : 0,
        transition:"transform 0.32s cubic-bezier(0.2,0,0,1), opacity 0.22s ease",
        pointerEvents: visible ? "auto" : "none",
        background:"rgba(251,252,251,0.94)",
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        borderBottom:"1px solid rgba(0,0,0,0.07)",
        padding:"8px 12px 10px",
        display:"flex", justifyContent:"space-around", alignItems:"center",
      }}>
        {FLOAT_ITEMS_ENH.map((item,i) => (
          <div key={i} onClick={() => handleTap(item)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
            <div style={{
              width:38, height:38, borderRadius:11, background:"#fff",
              border:"1px solid rgba(0,0,0,0.07)", boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Ic2 n={item.n} s={17} sw={1.8} c={item.c}/>
            </div>
            <div style={{ fontSize:8.5, fontWeight:600, color:"var(--fg-3)", letterSpacing:".02em" }}>{item.label}</div>
          </div>
        ))}
      </div>
      {sheet && (
        <GlanceSheet
          sheetId={sheet}
          onClose={() => setSheet(null)}
          onGoTo={(route) => { setSheet(null); window.__tcOrigin = "Home"; nav(route); }}
        />
      )}
    </>
  );
}

// ── Return origin chip (shown briefly after back-nav to home) ─
function ReturnOriginChip({ label }) {
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="ne-origin-chip">
      ← Back from {label}
    </div>
  );
}

// Export all for use in other files
Object.assign(window, {
  GlanceSheet,
  GlanceCarouselEnhanced,
  FloatingGlanceBarEnhanced,
  OriginBackBtn,
  ReturnOriginChip,
  useScrollRestore,
  useOriginNav,
  GLANCE_SHEETS,
  FLOAT_SHEETS,
});
