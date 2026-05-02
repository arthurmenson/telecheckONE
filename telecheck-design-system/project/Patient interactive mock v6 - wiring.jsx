// ─────────────────────────────────────────────────────────────────
// Wiring patch — fills every dead-end button in Care + Pharmacy with a
// real screen or sheet. Loaded AFTER care_redesign + pharmacy_redesign
// so its components are available, and AFTER pharmacy_programs so it
// can reuse DocSheet/etc. via window.*.
// ─────────────────────────────────────────────────────────────────

const { useState: uSWi } = React;

/* ── Shared sheet styles (scoped, additive) ─────────────────── */
(function injectWiringStyles() {
  if (document.getElementById("wir-styles")) return;
  const s = document.createElement("style");
  s.id = "wir-styles";
  s.textContent = `
    .wr-empty {
      padding: 36px 24px; text-align:center; color:var(--fg-3);
      display:flex; flex-direction:column; align-items:center; gap:14px;
    }
    .wr-empty-ico { width:56px; height:56px; border-radius:18px; background:var(--n-50); display:flex; align-items:center; justify-content:center; }
    .wr-empty-t   { font-size:15px; font-weight:600; color:var(--fg-1); margin-top:2px; }
    .wr-empty-s   { font-size:12px; color:var(--fg-3); line-height:1.5; max-width:240px; }

    .wr-loading {
      padding: 32px 16px; display:flex; flex-direction:column; align-items:center; gap:12px;
    }
    .wr-spin {
      width:32px; height:32px; border-radius:50%;
      border:2.5px solid var(--n-100); border-top-color:var(--teal-500);
      animation:wr-spin .8s linear infinite;
    }
    @keyframes wr-spin { to { transform: rotate(360deg); } }

    .wr-success-icon {
      width:56px; height:56px; border-radius:50%; background:var(--teal-500); color:#fff;
      display:flex; align-items:center; justify-content:center; margin:0 auto 14px;
      animation:wr-pop .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes wr-pop {
      0%   { transform:scale(.4); opacity:0; }
      60%  { transform:scale(1.1); }
      100% { transform:scale(1); opacity:1; }
    }
    .wr-success-t { font-size:17px; font-weight:700; text-align:center; color:var(--fg-1); }
    .wr-success-s { font-size:12.5px; text-align:center; color:var(--fg-3); margin-top:6px; line-height:1.5; }

    .wr-pick-row {
      display:flex; align-items:center; gap:12px;
      padding:13px 14px; border-radius:12px;
      background:var(--surface-1); border:1px solid var(--border-subtle);
      cursor:pointer; transition:transform .1s, border-color .1s;
    }
    .wr-pick-row:active { transform:scale(.99); }
    .wr-pick-row.on { border-color:var(--teal-500); background:var(--teal-50); }
    .wr-pick-ico { width:38px; height:38px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .wr-pick-body { flex:1; min-width:0; }
    .wr-pick-t   { font-size:13.5px; font-weight:600; color:var(--fg-1); }
    .wr-pick-s   { font-size:11.5px; color:var(--fg-3); margin-top:2px; line-height:1.35; }
    .wr-pick-tag { font-size:9.5px; font-weight:700; letter-spacing:.06em; padding:3px 8px; border-radius:9999px; background:var(--n-50); color:var(--fg-3); }
  `;
  document.head.appendChild(s);
})();

/* ─────────────────────────────────────────────────────────────
 * 1. ADD DEVICE — Care › Track › Devices › "+ Add device"
 * ──────────────────────────────────────────────────────────── */
function AddDeviceSheet({ onClose, toast }) {
  const [stage, setStage] = uSWi("pick"); // pick → scanning → paired
  const [picked, setPicked] = uSWi(null);

  const candidates = [
    { id: "omron-m7",   name: "Omron M7 Intelli IT",  sub: "Blood pressure · Bluetooth · already discovered", iBg: "#e8f0fe", iC: "#5b8dee", icon: "heart", tag: "NEARBY" },
    { id: "freestyle",  name: "FreeStyle Libre 3",    sub: "Continuous glucose monitor · NFC pair",            iBg: "#f0fdf4", iC: "#2a8a4a", icon: "heart", tag: "NEW" },
    { id: "withings",   name: "Withings Body+",        sub: "Smart scale · Wi-Fi",                              iBg: "color-mix(in oklab,var(--gold-200) 50%,white)", iC: "var(--gold-700)", icon: "heart", tag: "NEW" },
    { id: "pulse",      name: "Beurer pulse oximeter", sub: "SpO₂ + heart rate · Bluetooth",                    iBg: "#f0eeff", iC: "var(--iris-600)", icon: "heart", tag: "NEW" },
    { id: "manual",     name: "I'll log readings manually", sub: "No device · just track values yourself",      iBg: "var(--n-50)", iC: "var(--fg-3)", icon: "plus", tag: "MANUAL" },
  ];

  const pair = (d) => {
    setPicked(d);
    setStage("scanning");
    setTimeout(() => setStage("paired"), 1600);
  };
  const finish = () => {
    toast(`${picked.name} paired · syncing`);
    onClose();
  };

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        {stage === "pick" && (
          <>
            <div className="sheet-t">Add a device</div>
            <div className="sheet-s">Pick what you have. We'll guide you through pairing — no app downloads needed.</div>
            <div className="sheet-body" style={{ padding: "4px 18px 18px", display:"grid", gap:8 }}>
              {candidates.map(d => (
                <div key={d.id} className="wr-pick-row" onClick={() => pair(d)}>
                  <div className="wr-pick-ico" style={{ background:d.iBg }}><Ic2 n={d.icon} s={17} sw={2} c={d.iC}/></div>
                  <div className="wr-pick-body">
                    <div className="wr-pick-t">{d.name}</div>
                    <div className="wr-pick-s">{d.sub}</div>
                  </div>
                  <span className="wr-pick-tag" style={ d.tag === "NEARBY" ? { background:"var(--teal-50)", color:"var(--teal-700)" } : {} }>{d.tag}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {stage === "scanning" && (
          <>
            <div className="sheet-t">Pairing {picked.name}</div>
            <div className="sheet-s">Hold the device near your phone…</div>
            <div className="sheet-body" style={{ padding: "12px 18px 24px" }}>
              <div className="wr-loading">
                <div className="wr-spin"/>
                <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>Scanning Bluetooth…</div>
              </div>
            </div>
          </>
        )}
        {stage === "paired" && (
          <>
            <div className="sheet-body" style={{ padding: "8px 18px 18px" }}>
              <div className="wr-success-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
              <div className="wr-success-t">{picked.name} paired</div>
              <div className="wr-success-s">First sync starts when a reading comes in. Future readings flow into your record automatically.</div>
              <button className="cta" style={{ marginTop:18 }} onClick={finish}>Done</button>
              <button className="cta g" onClick={() => { onClose(); window.__tcNav && window.__tcNav("care-track-devices"); }}>See my devices</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 2. TRACKING PROGRAM DETAIL — Care › Programs › "Tracking programs"
 *    (Pregnancy / Nutrition coach / Symptom diary)
 * ──────────────────────────────────────────────────────────── */
const TRACK_PROGRAMS = {
  pregnancy: {
    name: "Pregnancy tracker", tag: "Free · self-tracked",
    summary: "Weekly milestones, symptoms diary, and medication-safety flags. Works with or without a clinician.",
    accent: "var(--iris-500)", accentSoft: "color-mix(in oklab,var(--iris-100) 60%,white)",
    bullets: [
      "Weekly fetal milestones · plain-language",
      "Med-safety flags against your active prescriptions",
      "Symptom check-ins · 30 sec a day",
      "Optional clinician share with Dr. Mensah",
    ],
    primary: "Start tracking",
    secondary: "Learn more",
  },
  nutrition: {
    name: "Nutrition coach", tag: "GHS 60 / month · with dietitian",
    summary: "Photo-log meals, get carb estimates against your glucose response, and a weekly call with a Ghanaian dietitian.",
    accent: "#b45309", accentSoft: "#fef3c7",
    bullets: [
      "Scan meals → AI estimates · regional foods",
      "Weekly 20-min call with dietitian Akua Ofori",
      "Plan tuned to your HbA1c & meds",
      "Cancel any month",
    ],
    primary: "Start screening",
    secondary: "See sample plan",
  },
  symptom: {
    name: "Symptom diary", tag: "Free · AI patterns",
    summary: "Log how you feel each day. Telecheck AI surfaces patterns and pre-fills questions for your next visit.",
    accent: "#5b8dee", accentSoft: "#e8f0fe",
    bullets: [
      "30-second daily check-in",
      "Pattern detection across 14+ symptoms",
      "Auto-generates pre-visit summaries",
      "Private until you choose to share",
    ],
    primary: "Start diary",
    secondary: "Sample report",
  },
};

function TrackingProgramSheet({ programId, onClose, toast }) {
  const p = TRACK_PROGRAMS[programId];
  const [stage, setStage] = uSWi("intro"); // intro → enrolled
  if (!p) return null;

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        {stage === "intro" ? (
          <>
            <div className="sheet-body" style={{ padding: "4px 18px 18px" }}>
              <div style={{ display:"inline-block", fontSize:9.5, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:p.accent, background:p.accentSoft, padding:"4px 10px", borderRadius:9999 }}>{p.tag}</div>
              <h2 style={{ fontSize:21, fontWeight:700, letterSpacing:"-.015em", margin:"10px 0 6px", color:"var(--fg-1)" }}>{p.name}</h2>
              <div style={{ fontSize:13, color:"var(--fg-2)", lineHeight:1.5, marginBottom:14 }}>{p.summary}</div>

              <div className="section-h"><span>What you get</span></div>
              <div style={{ display:"grid", gap:6 }}>
                {p.bullets.map((b,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 12px", borderRadius:8, background:"var(--n-50)", fontSize:12.5, color:"var(--fg-2)", lineHeight:1.4 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:p.accent, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>{b}</div>
                  </div>
                ))}
              </div>

              <button className="cta" style={{ marginTop:18, background:p.accent }} onClick={() => setStage("enrolled")}>{p.primary}</button>
              <button className="cta g" onClick={() => toast(`${p.name} · sample shared`)}>{p.secondary}</button>
            </div>
          </>
        ) : (
          <div className="sheet-body" style={{ padding: "20px 18px 22px" }}>
            <div className="wr-success-icon" style={{ background:p.accent }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
            <div className="wr-success-t">You're in {p.name}</div>
            <div className="wr-success-s">First check-in available now · we'll nudge you tomorrow at 08:00.</div>
            <button className="cta" style={{ marginTop:18, background:p.accent }} onClick={() => { toast(`${p.name} · first check-in opened`); onClose(); }}>Start first check-in</button>
            <button className="cta g" onClick={onClose}>Later</button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 3. INTERACTION DETAIL & SWAP — Pharmacy › Rx › "Interaction" alert
 * ──────────────────────────────────────────────────────────── */
function InteractionSheet({ onClose, toast, mode = "details" }) {
  // mode: 'details' → just the why; 'swap' → confirm swap flow
  const [stage, setStage] = uSWi(mode === "swap" ? "confirm" : "details");

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        {stage === "details" && (
          <>
            <div className="sheet-t" style={{ color:"#b45309" }}>Ibuprofen × Lisinopril</div>
            <div className="sheet-s">Moderate · NSAID + ACE inhibitor</div>
            <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
              <div style={{ padding:14, borderRadius:12, background:"#fffbeb", border:"1px solid rgba(194,131,32,.25)", color:"var(--fg-2)", fontSize:12.5, lineHeight:1.55, marginBottom:14 }}>
                Combining ibuprofen with lisinopril can blunt the BP-lowering effect and stresses the kidneys when used regularly. Occasional one-off doses are usually fine; your refill flagged because you're stocking ≥ 30 tablets.
              </div>

              <div className="section-h"><span>What we checked</span></div>
              <div className="extract">
                <div className="extract-row"><span className="k">Severity</span><span className="v" style={{ color:"#b45309", fontFamily:"inherit", fontWeight:600 }}>Moderate</span></div>
                <div className="extract-row"><span className="k">Mechanism</span><span className="v" style={{ color:"var(--fg-1)", fontFamily:"inherit", fontWeight:500 }}>Renal prostaglandin · ACE</span></div>
                <div className="extract-row"><span className="k">Your kidney fn</span><span className="v ok">eGFR 94 · normal</span></div>
                <div className="extract-row"><span className="k">Source</span><span className="v" style={{ color:"var(--fg-1)", fontFamily:"inherit", fontWeight:500 }}>Lexicomp · BNF</span></div>
              </div>

              <div className="section-h"><span>Safer alternative</span></div>
              <div className="extract">
                <div className="extract-row"><span className="k">Paracetamol 500 mg</span><span className="v ok">No interaction</span></div>
                <div className="extract-row"><span className="k">Same price band</span><span className="v ok">GHS 8 · in stock</span></div>
              </div>

              <button className="cta" style={{ marginTop:18, background:"#b45309" }} onClick={() => setStage("confirm")}>Swap to paracetamol</button>
              <button className="cta g" onClick={() => { toast("Keeping ibuprofen · noted in chart"); onClose(); }}>Keep ibuprofen anyway</button>
            </div>
          </>
        )}
        {stage === "confirm" && (
          <>
            <div className="sheet-t">Confirm swap</div>
            <div className="sheet-s">Replace ibuprofen with paracetamol in this basket?</div>
            <div className="sheet-body" style={{ padding:"4px 18px 18px" }}>
              <div className="extract">
                <div className="extract-row"><span className="k">Remove · ibuprofen 400 mg ×30</span><span className="v" style={{ color:"#b91c1c", fontFamily:"inherit", fontWeight:600 }}>− GHS 22</span></div>
                <div className="extract-row"><span className="k">Add · paracetamol 500 mg ×20</span><span className="v" style={{ color:"#166534", fontFamily:"inherit", fontWeight:600 }}>+ GHS 8</span></div>
                <div className="extract-row" style={{ borderTop:"2px solid var(--border-subtle)", paddingTop:10 }}><span className="k" style={{ fontWeight:700, color:"var(--fg-1)" }}>Saves you</span><span className="v" style={{ color:"var(--fg-1)" }}>GHS 14</span></div>
              </div>
              <div style={{ marginTop:14, padding:"10px 12px", borderRadius:10, background:"var(--n-50)", fontSize:11.5, color:"var(--fg-3)", lineHeight:1.45 }}>
                Your clinician sees this swap in your chart at next visit.
              </div>
              <button className="cta" style={{ marginTop:16 }} onClick={() => setStage("done")}>Confirm swap</button>
              <button className="cta g" onClick={onClose}>Back</button>
            </div>
          </>
        )}
        {stage === "done" && (
          <div className="sheet-body" style={{ padding:"20px 18px 22px" }}>
            <div className="wr-success-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
            <div className="wr-success-t">Swapped · paracetamol in basket</div>
            <div className="wr-success-s">No new clinician review needed for this swap. Resume shopping anytime.</div>
            <button className="cta" style={{ marginTop:18 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 4. PHARMACOGENOMICS — Pharmacy › Safety › "Pharmacogenomics"
 * ──────────────────────────────────────────────────────────── */
function PgxSheet({ onClose, toast }) {
  const [hasResults] = uSWi(false); // empty state for prototype
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Pharmacogenomics · advisory</div>
        <div className="sheet-s">Match your DNA to how you metabolize meds. Clinician interprets — never auto-prescribed.</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          {!hasResults ? (
            <>
              <div className="wr-empty" style={{ padding:"22px 8px 8px" }}>
                <div className="wr-empty-ico"><Ic2 n="dna" s={28} sw={1.8} c="var(--fg-3)"/></div>
                <div className="wr-empty-t">No PGx panel on file</div>
                <div className="wr-empty-s">A pharmacogenomic panel maps how you process common meds (warfarin, codeine, statins). Order at home or at any partner lab.</div>
              </div>

              <div className="section-h"><span>What we'd check</span></div>
              <div className="extract">
                <div className="extract-row"><span className="k">CYP2C9 · NSAIDs</span><span className="v" style={{ color:"var(--fg-3)", fontFamily:"inherit", fontWeight:500 }}>Not measured</span></div>
                <div className="extract-row"><span className="k">CYP2C19 · clopidogrel</span><span className="v" style={{ color:"var(--fg-3)", fontFamily:"inherit", fontWeight:500 }}>Not measured</span></div>
                <div className="extract-row"><span className="k">CYP2D6 · codeine, SSRIs</span><span className="v" style={{ color:"var(--fg-3)", fontFamily:"inherit", fontWeight:500 }}>Not measured</span></div>
                <div className="extract-row"><span className="k">SLCO1B1 · statins</span><span className="v" style={{ color:"var(--fg-3)", fontFamily:"inherit", fontWeight:500 }}>Not measured</span></div>
              </div>

              <div style={{ marginTop:14, padding:"12px 14px", borderRadius:12, background:"#e8f0fe", border:"1px solid rgba(91,141,238,.2)", fontSize:11.5, color:"var(--fg-2)", lineHeight:1.5 }}>
                <b>GHS 480 · home cheek-swab kit.</b> Result in 14 days, valid for life. Discreet packaging.
              </div>

              <button className="cta" style={{ marginTop:16 }} onClick={() => { toast("PGx kit ordered · ETA 3 days"); onClose(); }}>Order PGx kit</button>
              <button className="cta g" onClick={() => { onClose(); window.__tcNav && window.__tcNav("doctor-search"); }}>Talk to a clinician first</button>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 5. ADD HERB — Pharmacy › Safety › "Log an herb"
 * ──────────────────────────────────────────────────────────── */
function AddHerbSheet({ onClose, toast }) {
  const [picked, setPicked] = uSWi([]);
  const [stage, setStage]   = uSWi("pick"); // pick → done
  const herbs = [
    { id:"bitter-kola", n:"Bitter kola",          s:"Garcinia kola · cardiovascular folk use" },
    { id:"moringa",     n:"Moringa",              s:"Drumstick tree · supplement" },
    { id:"ginger",      n:"Ginger tea",            s:"Daily · 1–2 cups" },
    { id:"prekese",     n:"Prekese (Aidan)",       s:"Decoction · cold relief" },
    { id:"neem",        n:"Neem leaf",             s:"Bitter leaf tea" },
    { id:"tumeric",     n:"Turmeric supplement",   s:"Capsule · 500 mg" },
    { id:"ginseng",     n:"Ginseng",               s:"Tonic" },
    { id:"st-johns",    n:"St. John's wort",       s:"Mood support" },
  ];
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        {stage === "pick" && (
          <>
            <div className="sheet-t">What else are you taking?</div>
            <div className="sheet-s">Tell us what you regularly use — we'll add the herb–drug engine in v1.5 and check against your meds when it ships.</div>
            <div className="sheet-body" style={{ padding: "4px 18px 18px" }}>
              <div style={{ display:"grid", gap:6, marginBottom:14 }}>
                {herbs.map(h => {
                  const on = picked.includes(h.id);
                  return (
                    <div key={h.id} className={`wr-pick-row ${on ? "on" : ""}`} onClick={() => toggle(h.id)}>
                      <div className="wr-pick-ico" style={{ background:on ? "var(--teal-500)" : "var(--n-50)" }}>
                        {on ? <svg width="14" height="14" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> : <Ic2 n="plus" s={14} c="var(--fg-3)"/>}
                      </div>
                      <div className="wr-pick-body">
                        <div className="wr-pick-t">{h.n}</div>
                        <div className="wr-pick-s">{h.s}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="cta" disabled={picked.length === 0} style={{ background:picked.length === 0 ? "var(--n-200)" : "var(--iris-500)", color:picked.length === 0 ? "var(--fg-3)" : "#fff" }} onClick={() => setStage("done")}>
                Save {picked.length > 0 ? `(${picked.length})` : ""}
              </button>
              <button className="cta g" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
        {stage === "done" && (
          <div className="sheet-body" style={{ padding:"20px 18px 22px" }}>
            <div className="wr-success-icon" style={{ background:"var(--iris-500)" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
            <div className="wr-success-t">Saved to your record</div>
            <div className="wr-success-s">When v1.5 ships, we'll check these against every refill, prescription and basket.</div>
            <button className="cta" style={{ marginTop:18, background:"var(--iris-500)" }} onClick={() => { toast(`${picked.length} herb${picked.length === 1 ? "" : "s"} logged`); onClose(); }}>Done</button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 6. SCHEDULE LAB / HBA1C — Care › Track › Today › HbA1c tile
 *    HbA1c can't be self-logged — it's a blood draw. Open a real
 *    "Schedule lab draw" path instead of a dead toast.
 * ──────────────────────────────────────────────────────────── */
function ScheduleLabSheet({ onClose, toast, nav }) {
  const [picked, setPicked] = uSWi(null);
  const slots = [
    { id:"thu-08", l:"Thu 23 Apr · 08:00",  s:"Home draw · MobiLabs", tag:"BOOKED" },
    { id:"fri-08", l:"Fri 24 Apr · 08:00",  s:"Home draw · MobiLabs", tag:null },
    { id:"sat-09", l:"Sat 25 Apr · 09:30",  s:"In-clinic · Lagoon",   tag:null },
    { id:"mon-08", l:"Mon 27 Apr · 08:00",  s:"Home draw · MobiLabs", tag:null },
  ];
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">HbA1c · schedule lab draw</div>
        <div className="sheet-s">HbA1c needs a blood sample — it can't be self-logged. Pick a slot or check Thursday's existing booking.</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div style={{ display:"grid", gap:8 }}>
            {slots.map(sl => (
              <div key={sl.id} className={`wr-pick-row ${picked === sl.id ? "on" : ""}`} onClick={() => setPicked(sl.id)}>
                <div className="wr-pick-ico" style={{ background:sl.tag ? "var(--teal-50)" : "var(--n-50)" }}>
                  <Ic2 n="lab" s={16} sw={2} c={sl.tag ? "var(--teal-700)" : "var(--fg-3)"}/>
                </div>
                <div className="wr-pick-body">
                  <div className="wr-pick-t">{sl.l}</div>
                  <div className="wr-pick-s">{sl.s}</div>
                </div>
                {sl.tag && <span className="wr-pick-tag" style={{ background:"var(--teal-50)", color:"var(--teal-700)" }}>{sl.tag}</span>}
              </div>
            ))}
          </div>
          <button className="cta" style={{ marginTop:18, background: picked ? "var(--teal-500)" : "var(--n-200)", color: picked ? "#fff" : "var(--fg-3)" }} disabled={!picked} onClick={() => { toast("Lab draw confirmed · reminder set"); onClose(); }}>Confirm slot</button>
          <button className="cta g" onClick={() => { onClose(); nav && nav("labs"); }}>See past HbA1c results</button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 7. DOCUMENT VIEWER — Care › Programs › Documents
 *    Reuses the existing DocSheet (window.DocSheet from care_detail).
 *    Adds a thin wrapper so we can pass the right doc.
 * ──────────────────────────────────────────────────────────── */
const DOCS = {
  "rpm-care-plan": {
    title: "RPM care plan",
    sub: "Signed 14 Jan 2026 · Dr. Mensah · Ama Mensah",
    body: "12-week diabetes RPM plan. Targets: HbA1c < 7.5 within 6 months, fasting glucose < 130 mg/dL on 5/7 mornings. Devices: Accu-Chek Guide, Omron M2. Touchpoints: weekly async check-in, monthly clinician review. Escalation: any reading > 200 fasting, any BP > 160/100, any reported chest pain → immediate contact. This document is part of the patient record and revocable at any time.",
  },
  "rpm-consent": {
    title: "RPM consent",
    sub: "Revocable · Me → Privacy",
    body: "I, Ama Mensah, consent to remote patient monitoring under the care of Dr. Akosua Mensah. I understand that device readings, manual logs and visit notes are visible to my care team. I may revoke this consent at any time from Me → Privacy → Consents, after which no further data is shared. Existing records remain unless I separately request deletion. Consent valid for 12 months from signature, auto-renewed unless I opt out.",
  },
};
function DocOpener({ docId, onClose, toast }) {
  const Sheet = window.DocSheet;
  const doc = DOCS[docId];
  if (!Sheet || !doc) return null;
  return <Sheet doc={doc} onClose={onClose} toast={toast}/>;
}

/* Expose globally */
Object.assign(window, {
  AddDeviceSheet, TrackingProgramSheet, InteractionSheet,
  PgxSheet, AddHerbSheet, ScheduleLabSheet, DocOpener,
  TRACK_PROGRAMS, DOCS,
});
