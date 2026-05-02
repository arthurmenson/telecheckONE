// v2 — PHARMACY programs (GLP-1 metabolic, Baltasar men's ED) + detail screens + sheets
const { useState: uSP, useEffect: uEP, useRef: uRP } = React;

// ── Program catalogue ──
const PROGRAMS = {
  "glp1": {
    id: "glp1",
    name: "Metabolic · GLP-1",
    tag: "WEIGHT & METABOLIC",
    sub: "Medically-supervised weight & glucose program",
    accent: "teal",
    gradient: "linear-gradient(160deg, var(--teal-50), #e8f5f0 60%, #fff)",
    hero: "linear-gradient(160deg, var(--teal-600), var(--teal-700))",
    price: "GHS 690 / month",
    priceSub: "Clinician review + medication + monthly labs",
    month1: "First month GHS 420 · screening, labs, starter dose",
    eligibility: {
      must: ["BMI ≥ 27 with a metabolic condition, or BMI ≥ 30", "Age 18–75", "No personal/family history of medullary thyroid cancer or MEN2", "Not pregnant or planning pregnancy in the next 6 months"],
      help: "You'll re-confirm these on a short screening form. A clinician reviews every enrollment before any prescription is issued.",
    },
    outcomes: [
      { k: "Typical 6-mo weight loss", v: "12–15%" },
      { k: "HbA1c reduction (diabetic cohort)", v: "1.4%" },
      { k: "Clinician-led titration", v: "Every 4 wks" },
    ],
    includes: [
      { i: "pill", t: "Weekly GLP-1 injection", s: "semaglutide · delivered monthly · cold chain" },
      { i: "video", t: "Monthly clinician review", s: "Dose titration, side effects, adherence" },
      { i: "lab", t: "Quarterly labs", s: "HbA1c, lipids, kidney, thyroid — sample at home" },
      { i: "activity", t: "RPM weight + waist", s: "Weekly log · connected scale supported" },
      { i: "users", t: "Dietitian chat", s: "Ghanaian food-first plans · Twi/English" },
      { i: "shield", t: "Interaction sweep", s: "Auto-checks every time you add a med" },
    ],
    intakeSteps: [
      { q: "What's your main goal?", k: "goal", opts: ["Lose weight", "Lower my HbA1c", "Both", "Something else"] },
      { q: "Your current weight (kg)", k: "weight", input: "number", placeholder: "e.g. 92" },
      { q: "Your height (cm)", k: "height", input: "number", placeholder: "e.g. 168" },
      { q: "Have you taken a GLP-1 before?", k: "prior", opts: ["No, this is my first", "Yes, currently", "Yes, in the past"] },
      { q: "Any of these apply to you?", k: "flags", opts: ["None of these", "Thyroid cancer in my family", "Pancreatitis history", "Pregnant / trying to conceive"] },
    ],
    safetyNotes: [
      "Not a vanity drug. If your BMI is under 27 we won't enroll you, even if you ask — that's our floor.",
      "Common side-effects in month 1: nausea, reflux, constipation. We start low and titrate slow to minimise them.",
      "You can pause or stop any month. No auto-renewal traps.",
    ],
    faq: [
      { q: "Can I take it with metformin?", a: "Yes — they're often paired. Our interaction engine will re-verify every time you add or change a medication." },
      { q: "What if I miss a dose?", a: "Take it as soon as you remember if within 5 days of the missed dose; otherwise skip and resume on your regular day." },
      { q: "Is this branded semaglutide?", a: "Yes — supplied through a verified cold-chain partner. Every pen is barcode-verified on delivery." },
    ],
  },
  "baltasar": {
    id: "baltasar",
    name: "Baltasar",
    tag: "MEN'S HEALTH · DISCREET",
    sub: "ED treatment, delivered privately",
    accent: "iris",
    discreet: true,
    gradient: "linear-gradient(165deg, #1b1d2b, #242840 55%, #1b1d2b)",
    hero: "linear-gradient(160deg, #242840, #1b1d2b)",
    price: "from GHS 180 / month",
    priceSub: "Plain packaging · no labels · flexible strength",
    month1: "First order GHS 95 · includes consult + 4 tablets",
    eligibility: {
      must: ["Men 18+ in Ghana", "Not currently taking nitrates (e.g. for chest pain)", "No recent heart attack, stroke or severe heart failure", "Blood pressure under control"],
      help: "A clinician reviews every order before any medication ships. Your consult, meds and deliveries are kept separate from your main care record by default — you choose what, if anything, gets shared.",
    },
    outcomes: [
      { k: "Typical response on first dose", v: "68%" },
      { k: "Median time to clinician decision", v: "< 4h" },
      { k: "Discreet plain packaging", v: "100%" },
    ],
    includes: [
      { i: "pill", t: "sildenafil · 50 mg tablets", s: "Start dose · titrate up or down · 4, 8 or 12/mo" },
      { i: "pill", t: "tadalafil daily · 5 mg", s: "Alt · once-daily option after clinician review" },
      { i: "chat", t: "Async chat with a clinician", s: "Typically answered under 4h · no video required" },
      { i: "shop", t: "Plain, unlabelled delivery", s: "No Telecheck branding on the package" },
      { i: "shield", t: "Interaction + cardiac safety check", s: "Checked against your BP, meds and heart history" },
      { i: "users", t: "Optional partner notes", s: "You choose · never shared without your tap" },
    ],
    intakeSteps: [
      { q: "How would you describe what's going on?", k: "desc", opts: ["Trouble getting an erection", "Trouble keeping an erection", "Both", "I want to explore options"] },
      { q: "How long has this been going on?", k: "dur", opts: ["Less than 3 months", "3–12 months", "Over a year"] },
      { q: "Are you on any nitrate medication (e.g. for chest pain)?", k: "nitrates", opts: ["No", "Yes", "Not sure"] },
      { q: "Any of these in the last 6 months?", k: "cardiac", opts: ["None of these", "Heart attack", "Stroke", "Severe heart failure"] },
      { q: "Blood pressure — last reading you know", k: "bp", input: "text", placeholder: "e.g. 128/82 or 'don't know'" },
    ],
    safetyNotes: [
      "If you're on nitrates (common for chest pain), this combination can be life-threatening. We will not ship in that case.",
      "Don't take more than one tablet in 24 hours.",
      "Very rare: painful erection lasting more than 4 hours — stop and go to emergency.",
    ],
    faq: [
      { q: "Will anyone see this on my Telecheck record?", a: "By default, only you and the clinician reviewing. You can share with your primary clinician in one tap — but you don't have to." },
      { q: "How is it delivered?", a: "Plain, unmarked packaging. No mention of 'Telecheck', 'Baltasar' or the medication on the label or shipping manifest." },
      { q: "Can my partner be involved?", a: "Optional — you can add partner notes inside the program. Nothing is shared without an explicit action from you." },
    ],
  },
};

// ── PROGRAMS subtab content ──
function PhPrograms({ nav, toast }) {
  return (
    <>
      <AIcard tone="safety" tag="PROGRAMS · PROTOCOLIZED"
        title="Structured care for specific conditions"
        body="Programs bundle the consult, medication, labs and follow-up into one monthly flow — with a clinician reviewing every step. You can pause or cancel anytime."
        src="Aligned to PRD §8 · clinician sign-off required to start"
        actions={["How programs work"]}
        onAct={() => toast("Programs · protocolized care pathways")}/>

      <div className="section-h"><span>Available programs</span></div>

      <ProgramCard program={PROGRAMS.glp1} onOpen={() => nav("program-glp1")}/>
      <ProgramCard program={PROGRAMS.baltasar} onOpen={() => nav("program-baltasar")}/>

      <div className="section-h"><span>Coming soon</span></div>
      <Row icon="heart" tone="warn" title="Hypertension · protocolized refills" sub="Clinician oversight · RPM included · Q3" onClick={() => toast("Hypertension program · Q3 2026")}/>
      <Row icon="lab" tone="iris" title="PCOS care" sub="Labs, metformin pathway, nutrition · Q3" onClick={() => toast("PCOS program · Q3 2026")}/>
      <Row icon="pill" tone="info" title="Smoking cessation" sub="NRT + behavioral coach · Q4" onClick={() => toast("Smoking cessation · Q4 2026")}/>
    </>
  );
}

function ProgramCard({ program, onOpen }) {
  const p = program;
  const dark = p.discreet;
  return (
    <div className="pg-card" onClick={onOpen} style={{ background: p.gradient, color: dark ? "#fff" : "var(--fg-1)", borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}>
      <div className="pg-tag" style={{ color: dark ? "rgba(255,255,255,0.7)" : `var(--${p.accent}-700)`, background: dark ? "rgba(255,255,255,0.08)" : `var(--${p.accent}-50)` }}>{p.tag}</div>
      <div className="pg-name" style={{ color: dark ? "#fff" : "var(--fg-1)" }}>{p.name}</div>
      <div className="pg-sub" style={{ color: dark ? "rgba(255,255,255,0.72)" : "var(--fg-2)" }}>{p.sub}</div>
      <div className="pg-price" style={{ color: dark ? "#fff" : "var(--fg-1)" }}>{p.price}</div>
      <div className="pg-price-s" style={{ color: dark ? "rgba(255,255,255,0.6)" : "var(--fg-3)" }}>{p.priceSub}</div>
      <div className="pg-cta" style={{ background: dark ? "#fff" : `var(--${p.accent}-500)`, color: dark ? "#1b1d2b" : "#fff" }}>
        {p.discreet ? "See Baltasar" : "Learn more & enroll"}
        <Ic2 n="chev" s={14} sw={2.4}/>
      </div>
    </div>
  );
}

// ── Program detail + enrollment ──
function ProgramDetail({ nav, toast, programId, enrolled, onEnroll }) {
  const p = PROGRAMS[programId];
  if (!p) return null;
  const dark = p.discreet;
  const [step, setStep] = uSP(enrolled ? "dashboard" : "overview"); // overview | safety | intake | review | dashboard
  const [ans, setAns] = uSP({});
  const [qIdx, setQIdx] = uSP(0);

  // Content-only body (iOS-style app chrome is handled by screen shell)
  return (
    <div className="app" style={{ background: dark ? "#1b1d2b" : "var(--surface-0)" }}>
      <SB2/>
      <Sub2 title={p.name} onBack={() => nav("pharmacy")} right={
        <button className="ic-btn" onClick={() => toast("Share · plain link")} style={dark ? { background: "rgba(255,255,255,0.08)", color: "#fff", border: 0 } : {}}>
          <Ic2 n="more" s={18} c={dark ? "#fff" : undefined}/>
        </button>
      } dark={dark}/>
      <div className="scroll" style={dark ? { background: "#1b1d2b", color: "#fff" } : {}}>
        {step === "overview" && <ProgramOverview p={p} onStart={() => setStep("safety")} onSkipToDashboard={enrolled ? () => setStep("dashboard") : null}/>}
        {step === "safety" && <ProgramSafety p={p} onBack={() => setStep("overview")} onAccept={() => { setStep("intake"); setQIdx(0); }}/>}
        {step === "intake" && <ProgramIntake p={p} qIdx={qIdx} setQIdx={setQIdx} ans={ans} setAns={setAns} onBack={() => setStep("safety")} onDone={() => setStep("review")}/>}
        {step === "review" && <ProgramReview p={p} ans={ans} onBack={() => setStep("intake")} onSubmit={() => { onEnroll(p.id); toast(`Enrolled · ${p.name} · clinician review in progress`); setStep("dashboard"); }}/>}
        {step === "dashboard" && <ProgramDashboard p={p} nav={nav} toast={toast}/>}
      </div>
    </div>
  );
}

function ProgramOverview({ p, onStart, onSkipToDashboard }) {
  const dark = p.discreet;
  const fgMuted = dark ? "rgba(255,255,255,0.68)" : "var(--fg-2)";
  const fgDim = dark ? "rgba(255,255,255,0.5)" : "var(--fg-3)";
  const surf = dark ? "rgba(255,255,255,0.04)" : "var(--surface-1)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";

  return (
    <>
      <div className="v2-hero" style={{ margin: "0 -16px", padding: "18px 18px 24px", background: p.hero, color: "#fff" }}>
        <div className="sub-lbl" style={{ color: "rgba(255,255,255,0.8)" }}>{p.tag}</div>
        <h1 style={{ marginTop: 6, fontSize: 26, color: "#fff", letterSpacing: "-0.01em" }}>{p.name}</h1>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)", marginTop: 6, lineHeight: 1.45 }}>{p.sub}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {p.outcomes.map((o, i) => (
            <div key={i} style={{ flex: "1 1 30%", padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", fontVariantNumeric: "tabular-nums" }}>{o.v}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", marginTop: 3, lineHeight: 1.3 }}>{o.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="content">
        {onSkipToDashboard && (
          <div className="lc" onClick={onSkipToDashboard} style={{ background: dark ? "rgba(255,255,255,0.04)" : undefined, borderColor: border }}>
            <div className={`lc-ic ${p.accent}`}><Ic2 n="chart" s={18} sw={2}/></div>
            <div><div className="lc-t" style={{ color: dark ? "#fff" : undefined }}>Open my dashboard</div><div className="lc-s" style={{ color: fgDim }}>You're enrolled · view progress, dose, orders</div></div>
            <Ic2 n="chev" s={18} c={dark ? "#fff" : undefined}/>
          </div>
        )}

        <div className="section-h" style={{ color: fgMuted }}><span>What's included</span></div>
        <div style={{ display: "grid", gap: 8 }}>
          {p.includes.map((x, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, background: surf, border: `1px solid ${border}` }}>
              <div className={`lc-ic ${p.accent}`} style={{ flexShrink: 0 }}><Ic2 n={x.i} s={18} sw={2}/></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: dark ? "#fff" : "var(--fg-1)" }}>{x.t}</div>
                <div style={{ fontSize: 11.5, color: fgDim, marginTop: 2, lineHeight: 1.4 }}>{x.s}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-h" style={{ color: fgMuted }}><span>Pricing</span></div>
        <div style={{ padding: 16, borderRadius: 14, background: surf, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: dark ? "#fff" : "var(--fg-1)", letterSpacing: "-0.01em" }}>{p.price}</div>
          <div style={{ fontSize: 12, color: fgDim, marginTop: 4 }}>{p.priceSub}</div>
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: dark ? "rgba(255,255,255,0.06)" : `var(--${p.accent}-50)`, fontSize: 11.5, color: dark ? "rgba(255,255,255,0.85)" : `var(--${p.accent}-700)`, fontWeight: 600 }}>
            {p.month1}
          </div>
        </div>

        <div className="section-h" style={{ color: fgMuted }}><span>Common questions</span></div>
        <div style={{ display: "grid", gap: 8 }}>
          {p.faq.map((f, i) => (
            <details key={i} style={{ padding: "12px 14px", borderRadius: 12, background: surf, border: `1px solid ${border}` }}>
              <summary style={{ fontSize: 13, fontWeight: 600, color: dark ? "#fff" : "var(--fg-1)", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                {f.q}<span style={{ fontSize: 16, color: fgDim }}>+</span>
              </summary>
              <div style={{ fontSize: 12.5, color: fgMuted, marginTop: 8, lineHeight: 1.5 }}>{f.a}</div>
            </details>
          ))}
        </div>

        <button className="cta" style={{ marginTop: 22, background: dark ? "#fff" : `var(--${p.accent}-500)`, color: dark ? "#1b1d2b" : "#fff" }} onClick={onStart}>
          {onSkipToDashboard ? "Restart enrollment" : p.discreet ? "Start private consult" : "Enroll & start screening"}
        </button>
        <div style={{ textAlign: "center", fontSize: 11, color: fgDim, marginTop: 10, lineHeight: 1.4 }}>
          A clinician reviews every enrollment. Nothing ships until they sign off.
        </div>
      </div>
    </>
  );
}

function ProgramSafety({ p, onBack, onAccept }) {
  const dark = p.discreet;
  const [checked, setChecked] = uSP(p.eligibility.must.map(() => false));
  const allOk = checked.every(Boolean);
  return (
    <div className="content">
      <BigH title="Before you enroll" sub="A clinician will re-verify all of this on review."/>
      <div style={{ display: "grid", gap: 10 }}>
        {p.eligibility.must.map((m, i) => (
          <label key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.04)" : "var(--surface-1)", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}`, cursor: "pointer", alignItems: "flex-start" }}>
            <input type="checkbox" checked={checked[i]} onChange={e => setChecked(c => c.map((v, j) => j === i ? e.target.checked : v))} style={{ marginTop: 3, width: 18, height: 18, accentColor: `var(--${p.accent}-500)`, cursor: "pointer" }}/>
            <div style={{ fontSize: 13, color: dark ? "#fff" : "var(--fg-1)", lineHeight: 1.4 }}>{m}</div>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.04)" : "var(--n-50)", fontSize: 12, color: dark ? "rgba(255,255,255,0.7)" : "var(--fg-2)", lineHeight: 1.5 }}>
        {p.eligibility.help}
      </div>

      <div className="section-h" style={{ color: dark ? "rgba(255,255,255,0.68)" : "var(--fg-2)" }}><span>Safety notes</span></div>
      <div style={{ display: "grid", gap: 8 }}>
        {p.safetyNotes.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: dark ? "rgba(255,255,255,0.04)" : "var(--warning-50)", fontSize: 12, color: dark ? "rgba(255,255,255,0.85)" : "var(--warning-700)", lineHeight: 1.45 }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}><Ic2 n="flag" s={14} sw={2.2} c={dark ? "#ffd081" : undefined}/></div>
            <div>{n}</div>
          </div>
        ))}
      </div>

      <button className="cta" style={{ marginTop: 22, background: allOk ? (dark ? "#fff" : `var(--${p.accent}-500)`) : (dark ? "rgba(255,255,255,0.15)" : "var(--n-200)"), color: allOk ? (dark ? "#1b1d2b" : "#fff") : (dark ? "rgba(255,255,255,0.4)" : "var(--fg-3)"), cursor: allOk ? "pointer" : "not-allowed" }} onClick={() => allOk && onAccept()} disabled={!allOk}>
        {allOk ? "I confirm · continue" : "Check each item to continue"}
      </button>
      <button className="cta g" style={{ color: dark ? "rgba(255,255,255,0.6)" : undefined }} onClick={onBack}>Back</button>
    </div>
  );
}

function ProgramIntake({ p, qIdx, setQIdx, ans, setAns, onBack, onDone }) {
  const dark = p.discreet;
  const q = p.intakeSteps[qIdx];
  const total = p.intakeSteps.length;
  const current = ans[q.k];
  const [txt, setTxt] = uSP(current || "");
  uEP(() => setTxt(ans[q.k] || ""), [qIdx]);

  const advance = (val) => {
    const next = { ...ans, [q.k]: val };
    setAns(next);
    if (qIdx < total - 1) setQIdx(qIdx + 1);
    else onDone();
  };

  return (
    <div className="content">
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {p.intakeSteps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= qIdx ? (dark ? "#fff" : `var(--${p.accent}-500)`) : (dark ? "rgba(255,255,255,0.15)" : "var(--n-100)") }}/>
        ))}
      </div>
      <div style={{ fontSize: 10.5, letterSpacing: "0.1em", fontWeight: 700, color: dark ? "rgba(255,255,255,0.55)" : "var(--fg-3)", textTransform: "uppercase" }}>Question {qIdx + 1} of {total}</div>
      <h2 style={{ fontSize: 22, marginTop: 8, color: dark ? "#fff" : "var(--fg-1)", letterSpacing: "-0.01em", lineHeight: 1.25 }}>{q.q}</h2>

      {q.opts && (
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {q.opts.map((o, i) => (
            <button key={i} onClick={() => advance(o)} style={{ textAlign: "left", padding: "14px 16px", borderRadius: 12, background: current === o ? (dark ? "rgba(255,255,255,0.12)" : `var(--${p.accent}-50)`) : (dark ? "rgba(255,255,255,0.04)" : "var(--surface-1)"), border: `1px solid ${current === o ? (dark ? "rgba(255,255,255,0.25)" : `var(--${p.accent}-500)`) : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)")}`, color: dark ? "#fff" : "var(--fg-1)", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", fontWeight: 500 }}>
              {o}
            </button>
          ))}
        </div>
      )}

      {q.input && (
        <div style={{ marginTop: 16 }}>
          <input type={q.input} value={txt} onChange={e => setTxt(e.target.value)} placeholder={q.placeholder} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--border-strong)"}`, background: dark ? "rgba(255,255,255,0.04)" : "var(--surface-1)", color: dark ? "#fff" : "var(--fg-1)", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box" }}/>
          <button className="cta" style={{ marginTop: 14, background: txt ? (dark ? "#fff" : `var(--${p.accent}-500)`) : (dark ? "rgba(255,255,255,0.15)" : "var(--n-200)"), color: txt ? (dark ? "#1b1d2b" : "#fff") : (dark ? "rgba(255,255,255,0.4)" : "var(--fg-3)") }} disabled={!txt} onClick={() => txt && advance(txt)}>
            {qIdx < total - 1 ? "Next question" : "Review my answers"}
          </button>
        </div>
      )}

      <button className="cta g" style={{ marginTop: 12, color: dark ? "rgba(255,255,255,0.6)" : undefined }} onClick={() => qIdx > 0 ? setQIdx(qIdx - 1) : onBack()}>
        ← Back
      </button>
    </div>
  );
}

function ProgramReview({ p, ans, onBack, onSubmit }) {
  const dark = p.discreet;
  // eligibility heuristic
  const flags = [];
  if (p.id === "glp1") {
    const w = parseFloat(ans.weight), h = parseFloat(ans.height);
    if (w && h) {
      const bmi = w / Math.pow(h / 100, 2);
      if (bmi < 27) flags.push({ t: "BMI appears below 27", s: `Estimated ${bmi.toFixed(1)} · clinician may not prescribe.`, tone: "warn" });
      else flags.push({ t: `BMI ${bmi.toFixed(1)} · eligible`, s: "Within program range.", tone: "ok" });
    }
    if (ans.flags && ans.flags !== "None of these") flags.push({ t: "Safety flag raised", s: `${ans.flags} · clinician will contact you first.`, tone: "danger" });
  }
  if (p.id === "baltasar") {
    if (ans.nitrates === "Yes") flags.push({ t: "Nitrates — we can't ship this", s: "Combining nitrates + sildenafil is life-threatening. A clinician will reach out with safer options.", tone: "danger" });
    else if (ans.nitrates === "Not sure") flags.push({ t: "Clinician needs to confirm nitrates", s: "We'll pause the order until that's clear.", tone: "warn" });
    if (ans.cardiac && ans.cardiac !== "None of these") flags.push({ t: "Recent cardiac event", s: `${ans.cardiac} · clinician will review your case individually.`, tone: "warn" });
    if (!flags.length) flags.push({ t: "No hard blockers in your answers", s: "A clinician will still verify before shipping.", tone: "ok" });
  }

  const toneColor = (t) => t === "danger" ? "var(--danger-700)" : t === "warn" ? "var(--warning-700)" : "var(--success-700)";
  const toneBg = (t) => t === "danger" ? "var(--danger-50)" : t === "warn" ? "var(--warning-50)" : "var(--success-50)";

  return (
    <div className="content">
      <BigH title="Review and submit" sub={`${p.discreet ? "Private" : "Your"} answers go to a clinician. Nothing ships until they sign off.`}/>

      <div className="section-h" style={{ color: dark ? "rgba(255,255,255,0.68)" : undefined }}><span>AI pre-check</span></div>
      <div style={{ display: "grid", gap: 8 }}>
        {flags.map((f, i) => (
          <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.04)" : toneBg(f.tone), border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "transparent"}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: dark ? (f.tone === "danger" ? "#ff9985" : f.tone === "warn" ? "#ffcf8a" : "#9be0c4") : toneColor(f.tone) }}>{f.t}</div>
            <div style={{ fontSize: 11.5, color: dark ? "rgba(255,255,255,0.7)" : "var(--fg-2)", marginTop: 4, lineHeight: 1.45 }}>{f.s}</div>
          </div>
        ))}
      </div>

      <div className="section-h" style={{ color: dark ? "rgba(255,255,255,0.68)" : undefined }}><span>Your answers</span></div>
      <div className="extract" style={dark ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" } : {}}>
        {p.intakeSteps.map((q, i) => (
          <div key={i} className="extract-row">
            <span className="k" style={dark ? { color: "rgba(255,255,255,0.7)" } : {}}>{q.q}</span>
            <span className="v" style={dark ? { color: "#fff" } : {}}>{ans[q.k] || "—"}</span>
          </div>
        ))}
      </div>

      <button className="cta" style={{ marginTop: 22, background: dark ? "#fff" : `var(--${p.accent}-500)`, color: dark ? "#1b1d2b" : "#fff" }} onClick={onSubmit}>
        Submit for clinician review
      </button>
      <button className="cta g" style={{ color: dark ? "rgba(255,255,255,0.6)" : undefined }} onClick={onBack}>
        ← Change my answers
      </button>
    </div>
  );
}

function ProgramDashboard({ p, nav, toast }) {
  const dark = p.discreet;
  const fgMuted = dark ? "rgba(255,255,255,0.68)" : "var(--fg-2)";
  const fgDim = dark ? "rgba(255,255,255,0.5)" : "var(--fg-3)";
  const surf = dark ? "rgba(255,255,255,0.04)" : "var(--surface-1)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";

  const isGlp = p.id === "glp1";

  return (
    <>
      <div className="v2-hero" style={{ margin: "0 -16px", padding: "16px 18px 20px", background: p.hero, color: "#fff" }}>
        <div className="sub-lbl" style={{ color: "rgba(255,255,255,0.8)" }}>{isGlp ? "WEEK 6 · DOSE 0.5 MG" : "ACTIVE · DISCREET MODE ON"}</div>
        <h1 style={{ marginTop: 6, fontSize: 22, color: "#fff", letterSpacing: "-0.01em" }}>{p.name}</h1>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>
          {isGlp ? "Next injection Sat 25 Apr · 08:00 · delivered 18 Apr" : "Last order 10 Apr · 4 tablets · plain packaging"}
        </div>

        {isGlp && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <div style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>−4.2 <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.75 }}>kg</span></div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>Since start · 6 wks</div>
            </div>
            <div style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>7.4 <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.75 }}>%</span></div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>HbA1c · est.</div>
            </div>
            <div style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>94<span style={{ fontSize: 11, fontWeight: 500, opacity: 0.75 }}>%</span></div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>Adherence</div>
            </div>
          </div>
        )}
      </div>

      <div className="content">
        <AIcard tone={isGlp ? "lab" : "safety"} tag={isGlp ? "TITRATION · TELECHECK AI" : "DISCREET · TELECHECK AI"}
          title={isGlp ? "Ready to step up to 1.0 mg next cycle" : "All clear — no interaction or cardiac flags"}
          body={isGlp ? "Nausea reports are mild and trending down. Dr. Mensah has pre-approved the titration — confirm on your Saturday injection day." : "Your BP has been steady at 128/82 over 3 weeks. No new meds since last order."}
          src={isGlp ? "Based on: symptom logs · weight trend · adherence" : "Checked: BP log · medication list · last order"}
          actions={isGlp ? ["Confirm titration", "Message Dr. Mensah"] : ["Reorder · 4 tablets", "Message clinician"]}
          onAct={(a) => toast(a)}/>

        <div className="section-h" style={{ color: fgMuted }}><span>{isGlp ? "This week" : "Your orders"}</span></div>

        {isGlp ? (
          <>
            <Row icon="pill" tone="teal" title="Sat 25 Apr · weekly injection" sub="0.5 mg · abdomen · rotate site" pill={{label: "UPCOMING", tone: "warn"}} onClick={() => toast("Injection reminder set")}/>
            <Row icon="lab" tone="gold" title="Thu 01 May · home lab kit" sub="HbA1c + lipids · scheduled 09:30" onClick={() => nav("labs-upload")}/>
            <Row icon="video" tone="iris" title="Fri 09 May · 15-min check-in" sub="Dr. Mensah · dose review" onClick={() => nav("visit-prep")}/>
          </>
        ) : (
          <>
            <Row icon="shop" tone="iris" title="Order #B-042 · in transit" sub="Plain packaging · ETA 24 Apr" pill={{label: "ON WAY", tone: "warn"}} onClick={() => nav("pharmacy")}/>
            <Row icon="shop" tone="info" title="Order #B-038 · delivered" sub="10 Apr · 4 tablets · receipt" onClick={() => toast("Receipt · plain")}/>
            <Row icon="chat" tone="teal" title="Async chat · Dr. Osei" sub="Last reply 12 Apr · you're up to date" onClick={() => nav("chat")}/>
          </>
        )}

        <div className="section-h" style={{ color: fgMuted }}><span>Settings</span></div>
        <Row icon={isGlp ? "users" : "shield"} tone={p.accent} title={isGlp ? "Share progress with Kojo" : "Discreet mode"} sub={isGlp ? "Weekly summary · he can cheer you on" : "Plain packaging · hidden from main record · on"} onClick={() => toast(isGlp ? "Sharing toggled" : "Discreet mode is on")}/>
        <Row icon="calendar" tone="info" title={isGlp ? "Pause or stop program" : "Pause deliveries"} sub="Resume anytime · no cancellation fees" onClick={() => toast("Pause options")}/>
        <Row icon="doc" tone="gold" title="Receipts & invoices" sub={isGlp ? "Monthly · GHS 690 · PDF" : "Plain-label receipts · PDF"} onClick={() => toast("Opening receipts")}/>

        <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: surf, border: `1px solid ${border}`, fontSize: 11.5, color: fgDim, lineHeight: 1.5 }}>
          This program is clinician-supervised. Every dose change, refill, and lab is reviewed before it ships. Telecheck AI surfaces patterns — it never prescribes on its own.
        </div>
      </div>
    </>
  );
}

// ── Per-medication Rx detail (generalised) ──
const RX_DB = {
  "metformin": { name: "Metformin 500 mg", sub: "60 tablets · BID with meals · Dr. Mensah", status: "IN CLINICIAN REVIEW · ETA 2H", tone: "warn", body: "Checked against lisinopril, paracetamol · eGFR 94 · ALT 22. Continue as prescribed.", take: "Taken by 2,400 people in Ghana · 92% adherence · community tips", inReview: true },
  "lisinopril": { name: "Lisinopril 10 mg", sub: "30 tablets · once daily · Dr. Mensah", status: "ACTIVE · AUTO-REFILL ON", tone: "info", body: "Checked against metformin, paracetamol · eGFR 94 · K+ 4.1. No interactions. BP trend: 124/78 → 120/76 over 6 weeks.", take: "Next auto-refill: 02 May · delivered Osu", inReview: false },
  "paracetamol": { name: "Paracetamol 500 mg", sub: "As needed · max 4/day · 18 tablets left", status: "ACTIVE · AS NEEDED", tone: "teal", body: "No interactions with your other meds. Safe with metformin and lisinopril. Don't exceed 4g/day.", take: "Used ~6×/month on average · OTC", inReview: false },
  "new": { name: "New prescription · follow-up", sub: "Issued today 09:41 · Dr. Mensah", status: "AWAITING YOUR CONFIRMATION", tone: "warn", body: "New 7-day course based on your 14 Apr visit. Review the leaflet and confirm to send to Mobipharm Osu.", take: "GHS 55 on confirmation · delivered next business day", inReview: false },
};

function PharmacyRxV2({ nav, toast, rxId = "metformin", protocolRefillsActive = false }) {
  const baseRx = RX_DB[rxId] || RX_DB.metformin;
  // When protocol-authorized refills are activated and this is metformin,
  // flip status to PROTOCOL-EXECUTED (auto-approved, on its way to dispense).
  const rx = (protocolRefillsActive && rxId === "metformin") ? {
    ...baseRx,
    status: "PROTOCOL-EXECUTED · AUTO-APPROVED · DISPENSING",
    tone: "teal",
    inReview: false,
    protocolExecuted: true,
  } : baseRx;
  const toneMap = { warn: "warning", info: "info", teal: "teal" };
  const toneKey = toneMap[rx.tone] || "warning";
  return (
    <div className="app">
      <SB2/>
      <Sub2 title={rx.name.split(" ").slice(0, 2).join(" ")} onBack={() => nav("pharmacy")} right={
        <button className="ic-btn" onClick={() => toast("Rx options · share, pause, cancel")}><Ic2 n="more" s={18}/></button>
      }/>
      <div className="scroll">
        <div className="content">
          <div className="v2-hero" style={{ margin: "0 -16px", padding: "14px 18px 18px", background: `linear-gradient(160deg, var(--${toneKey}-50), #fff)` }}>
            <div className="sub-lbl" style={{ color: `var(--${toneKey}-700)` }}>{rx.status}</div>
            <h1 style={{ marginTop: 4, fontSize: 22 }}>{rx.name}</h1>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 6 }}>{rx.sub}</div>
            {rx.protocolExecuted && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.7)", border: "1px solid var(--teal-200)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--teal-500)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Ic2 n="shield" s={14} sw={2.2} c="#fff"/></div>
                <div style={{ fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, color: "var(--teal-700)", letterSpacing: "0.06em", fontSize: 10 }}>AUTO-APPROVED UNDER PROTOCOL</div>
                  <div style={{ marginTop: 3 }}>GH-Metformin-Refill-v2.1 · approved by Ghana MDC. No new safety signal detected. Reviewed by Dr. Mensah within 24h.</div>
                </div>
              </div>
            )}
          </div>

          {rx.protocolExecuted && (
            <>
              <div className="section-h"><span>Status</span></div>
              <div className="steps">
                <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Request sent</div><div className="st-s">You · 09:28</div></div><div className="tm">09:28</div></div>
                <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Protocol gates passed</div><div className="st-s">Interactions · labs · eligibility</div></div><div className="tm">09:31</div></div>
                <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Auto-approved</div><div className="st-s">GH-Metformin-Refill-v2.1 · no clinician queue</div></div><div className="tm">09:31</div></div>
                <div className="step now"><div className="b"/><div className="ln"/><div><div className="st-t">Dispensing</div><div className="st-s">Mobipharm Osu · 2 of 3 complete</div></div><div className="tm">now</div></div>
                <div className="step pending"><div className="b"/><div><div className="st-t">Delivered</div><div className="st-s">Osu · today 14:00–16:00</div></div><div className="tm">—</div></div>
              </div>
            </>
          )}

          {rx.inReview && (
            <>
              <div className="section-h"><span>Status</span></div>
              <div className="steps">
                <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Request sent</div><div className="st-s">You · 09:28</div></div><div className="tm">09:28</div></div>
                <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Interaction sweep</div><div className="st-s">Clear · 3 meds checked</div></div><div className="tm">09:31</div></div>
                <div className="step now"><div className="b"/><div className="ln"/><div><div className="st-t">Clinician review</div><div className="st-s">Dr. Mensah · ETA 2h</div></div><div className="tm">now</div></div>
                <div className="step pending"><div className="b"/><div className="ln"/><div><div className="st-t">Dispensed</div><div className="st-s">Mobipharm Osu</div></div><div className="tm">—</div></div>
                <div className="step pending"><div className="b"/><div><div className="st-t">Delivered</div><div className="st-s">Osu · 22 Apr 10–14</div></div><div className="tm">—</div></div>
              </div>
            </>
          )}

          <AIcard tone="inter" tag="AI SAFETY CHECK · CLEARED"
            title="No interactions with your other meds or labs"
            body={rx.body}
            src="Sweep today 09:31"
            actions={rxId === "new" ? ["Confirm & pay GHS 55", "See leaflet first"] : ["See full sweep"]}
            onAct={(a) => {
              if (a.startsWith("Confirm")) { toast("Paid GHS 55 · order placed"); nav("pharmacy"); }
              else toast(a);
            }}/>

          <div className="section-h"><span>About this medicine</span></div>
          <Row icon="doc" tone="iris" title="Plain-language leaflet" sub="Why you take it · side effects · Twi + English" onClick={() => toast("Leaflet")}/>
          <Row icon="shield" tone="teal" title="Verify the pack" sub="Scan the barcode on delivery" onClick={() => nav("scan-start")}/>
          <Row icon="users" tone="info" title={rx.take} sub="Community tips" onClick={() => nav("me-community")}/>

          <div className="section-h"><span>Actions</span></div>
          {rxId !== "new" && <Row icon="calendar" tone="gold" title="Request refill" sub="Next: 02 May · or request now" onClick={() => toast("Refill request sent · under review")}/>}
          <Row icon="chat" tone="teal" title="Ask your clinician" sub="Typically answered in 2h" onClick={() => nav("chat")}/>
          <Row icon="flag" tone="warn" title="Report a side effect" sub="Logged to your record · clinician alerted" onClick={() => toast("Side effect form")}/>
        </div>
      </div>
    </div>
  );
}

// ── Shop item detail sheet ──
function ShopItemSheet({ item, onClose, toast }) {
  if (!item) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div style={{ aspectRatio: "16/9", borderRadius: 14, background: "linear-gradient(160deg, var(--teal-50), var(--iris-200))", marginBottom: 14, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: "25% 30%", borderRadius: "50%", background: "linear-gradient(160deg, var(--iris-200), var(--iris-500))", opacity: 0.85 }}/>
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: "0.1em", fontWeight: 700, color: "var(--success-700)", background: "var(--success-50)", padding: "3px 8px", borderRadius: 9999, display: "inline-block" }}>
            SAFE FOR YOU · AI-CHECKED
          </div>
          <h2 style={{ fontSize: 19, marginTop: 8, letterSpacing: "-0.005em" }}>{item.n}</h2>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 4 }}>{item.s}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginTop: 14 }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.015em" }}>{item.p}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{item.stock || "In stock · Accra"}</div>
          </div>

          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "var(--n-50)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
            {item.desc || "Verified supplier. Screened against your 3 active medications and your conditions. No interactions detected."}
          </div>

          <div className="section-h" style={{ marginTop: 18 }}><span>Against your record</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">Interactions</span><span className="v ok">None</span></div>
            <div className="extract-row"><span className="k">Condition-safe</span><span className="v ok">Diabetes · hypertension</span></div>
            <div className="extract-row"><span className="k">Supplier verified</span><span className="v ok">Yes · FDA Ghana</span></div>
          </div>

          <button className="cta" style={{ marginTop: 18 }} onClick={() => { toast(`${item.n} added · GHS ${item.p.replace(/[^\d]/g, '')}`); onClose(); }}>Add to basket · {item.p}</button>
          <button className="cta g" onClick={onClose}>Keep browsing</button>
        </div>
      </div>
    </>
  );
}

// ── Order detail sheet ──
function OrderSheet({ order, onClose, toast }) {
  if (!order) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">{order.title}</div>
        <div className="sheet-s">{order.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div className="section-h"><span>Receipt</span></div>
          <div className="extract">
            {order.items.map((it, i) => (
              <div key={i} className="extract-row">
                <span className="k">{it.n}</span>
                <span className="v" style={{ color: "var(--fg-1)" }}>{it.p}</span>
              </div>
            ))}
            <div className="extract-row" style={{ borderTop: "2px solid var(--border-subtle)", paddingTop: 12 }}>
              <span className="k" style={{ fontWeight: 700, color: "var(--fg-1)" }}>Total</span>
              <span className="v" style={{ color: "var(--fg-1)" }}>{order.total}</span>
            </div>
          </div>
          <div className="section-h"><span>Delivery</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">To</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{order.to}</span></div>
            <div className="extract-row"><span className="k">Rider</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{order.rider}</span></div>
            <div className="extract-row"><span className="k">Delivered</span><span className="v ok">{order.delivered}</span></div>
          </div>
          <button className="cta" style={{ marginTop: 18 }} onClick={() => { toast("Receipt PDF downloaded"); onClose(); }}>Download PDF</button>
          <button className="cta g" onClick={() => { toast("Re-order placed · under review"); onClose(); }}>Re-order the same</button>
        </div>
      </div>
    </>
  );
}

// ── Safety check detail sheet ──
function SafetyCheckSheet({ check, onClose, toast }) {
  if (!check) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">{check.title}</div>
        <div className="sheet-s">{check.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--success-50)", color: "var(--success-700)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Ic2 n="shield" s={18} sw={2}/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>No signals found</div>
              <div style={{ fontSize: 12, marginTop: 4, color: "var(--fg-2)", lineHeight: 1.45 }}>{check.summary}</div>
            </div>
          </div>

          <div className="section-h"><span>What we checked</span></div>
          <div className="extract">
            {check.checked.map((c, i) => (
              <div key={i} className="extract-row">
                <span className="k">{c.k}</span>
                <span className="v ok">{c.v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "var(--n-50)", fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.5 }}>
            {check.note}
          </div>

          <button className="cta" style={{ marginTop: 18 }} onClick={() => { toast("Re-run · sweep complete"); onClose(); }}>Re-run sweep now</button>
          <button className="cta g" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  PROGRAMS, PhPrograms, ProgramDetail, PharmacyRxV2,
  ShopItemSheet, OrderSheet, SafetyCheckSheet,
});
