// v2 — PHARMACY + LABS + ME screens
const { useState: uSB, useEffect: uEB, useRef: uRB } = React;
const PhPrograms = window.PhPrograms;
const ShopItemSheet = window.ShopItemSheet;
const OrderSheet = window.OrderSheet;
const SafetyCheckSheet = window.SafetyCheckSheet;
const LabResultSheet = window.LabResultSheet;
const RecordDocSheet = window.RecordDocSheet;
const FamilyMemberSheet = window.FamilyMemberSheet;
const EventSheet = window.EventSheet;
const SettingsDetailSheet = window.SettingsDetailSheet;

// ────────── PHARMACY ──────────
function PharmacyV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI, sub = "Rx", setSub, enrolledPrograms = [], protocolRefillsActive = false }) {
  return (
    <div className={`app has-topbar${delegate && delegate !== "me" ? " with-del" : ""}`}>
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">
        <BigH title="Pharmacy" sub="Prescriptions, programs, shop, orders and safety"/>
        <SubTabs tabs={["Rx","Programs","Shop","Orders","Safety"]} active={sub} onPick={setSub}/>
        <div className="content">
          {sub === "Rx" && <PhRx nav={nav} toast={toast} enrolledPrograms={enrolledPrograms} protocolRefillsActive={protocolRefillsActive}/>}
          {sub === "Programs" && <PhPrograms nav={nav} toast={toast}/>}
          {sub === "Shop" && <PhShop nav={nav} toast={toast}/>}
          {sub === "Orders" && <PhOrders nav={nav} toast={toast}/>}
          {sub === "Safety" && <PhSafety nav={nav} toast={toast}/>}
        </div>
      </div>
      <TabBar2 active="pharmacy" onTab={nav} care={2}/>
    </div>
  );
}

function PhRx({ nav, toast, enrolledPrograms = [], protocolRefillsActive = false }) {
  return (
    <>
      <AIcard tone="inter" tag="INTERACTION · HEADS UP"
        title="Ibuprofen + lisinopril flagged in your basket"
        body="Taken together this can reduce your BP control and affect kidneys. Paracetamol is safer given your current regimen."
        src="Checked: lisinopril 10 mg · eGFR 94 · BP 124/78"
        actions={["Swap to paracetamol", "See details"]}
        onAct={(a) => toast(a.startsWith("Swap") ? "Swapped · paracetamol 500 mg" : "Interaction details")}/>
      <div className="section-h"><span>Active prescriptions</span></div>
      {protocolRefillsActive ? (
        <Row icon="pill" tone="teal" title="Metformin 500 mg" sub="Auto-approved via protocol · delivering today" pill={{label:"PROTOCOL-EXECUTED", tone:"ok"}} onClick={() => nav("rx-metformin")}/>
      ) : (
        <Row icon="pill" tone="warn" title="Metformin 500 mg" sub="Refill in review · Dr. Mensah" pill={{label:"IN REVIEW", tone:"warn"}} onClick={() => nav("rx-metformin")}/>
      )}
      <Row icon="pill" tone="iris" title="Lisinopril 10 mg" sub="Auto-refill on · next 02 May" onClick={() => nav("rx-lisinopril")}/>
      <Row icon="pill" tone="teal" title="Paracetamol 500 mg" sub="As needed · 18 tablets left" onClick={() => nav("rx-paracetamol")}/>
      {enrolledPrograms.includes("glp1") && (
        <Row icon="pill" tone="teal" title="semaglutide 0.5 mg · weekly" sub="GLP-1 program · next dose Sat 25 Apr" pill={{label:"PROGRAM", tone:"ok"}} onClick={() => nav("program-glp1")}/>
      )}
      {enrolledPrograms.includes("baltasar") && (
        <Row icon="pill" tone="iris" title="sildenafil 50 mg · as needed" sub="Baltasar program · discreet" pill={{label:"PRIVATE", tone:"ok"}} onClick={() => nav("program-baltasar")}/>
      )}
      <div className="section-h"><span>From your doctor</span></div>
      <Row icon="doc" tone="info" title="New prescription · view" sub="Issued today 09:41 · GHS 55 pending" onClick={() => nav("rx-new")}/>
      <div className="section-h"><span>Specialized programs</span></div>
      <Row icon="spark" tone="teal" title="Metabolic · GLP-1 program" sub="Weight & HbA1c · clinician-led" onClick={() => nav("program-glp1")}/>
      <Row icon="shield" tone="iris" title="Baltasar · men's health" sub="Discreet ED treatment" onClick={() => nav("program-baltasar")}/>
    </>
  );
}

function PhShop({ nav, toast }) {
  // Simplified: 3 categories instead of 6
  const cats = ["All","Meds","Devices"];
  const [cat, setCat] = uSB("All");
  const [sheet, setSheet] = uSB(null);
  const items = [
    { n: "Paracetamol 500 mg", p: "GHS 8", s: "Mobipharm Osu", cat: "Meds", stock: "In stock · 8 packs", desc: "Standard pain & fever relief. Max 4 tablets in 24 hours. Safe with your current meds." },
    { n: "Vitamin D3 1000 IU", p: "GHS 42", s: "Verified supplier", cat: "Meds", stock: "In stock · 22 bottles", desc: "Supports bone health. Most adults in Accra are mildly deficient. 1/day with food." },
    { n: "Glucose strips · 50", p: "GHS 95", s: "Accu-Chek compatible", cat: "Meds", stock: "Low · 4 boxes", desc: "Compatible with your Accu-Chek meter. Pack of 50 strips." },
    { n: "Oral rehydration salts", p: "GHS 6", s: "WHO formula", cat: "Meds", stock: "In stock", desc: "WHO-standard formula. 1 sachet in 1L clean water. Safe for all ages." },
    { n: "Multivitamin · family", p: "GHS 58", s: "30 tablets", cat: "Meds", stock: "In stock", desc: "Family formula · 30 tablets · no allergen concerns for your profile." },
    { n: "Antiseptic hand gel 250ml", p: "GHS 18", s: "Ghana-made", cat: "Meds", stock: "In stock", desc: "70% alcohol. Safe for all ages. No interactions." },
    { n: "Digital BP cuff", p: "GHS 220", s: "Omron · 2yr warranty", cat: "Devices", stock: "Ships in 2 days", desc: "Omron M2 · upper arm · clinically validated. Auto-sync with your Telecheck record." },
    { n: "BP monitor · wrist", p: "GHS 180", s: "Beurer · compact", cat: "Devices", stock: "In stock", desc: "Portable wrist monitor. Less accurate than upper arm for clinical use — consider the Omron cuff if you track trends." },
  ];
  const filtered = cat === "All" ? items : items.filter(i => i.cat === cat);
  return (
    <>
      <SubTabs tabs={cats} active={cat} onPick={setCat}/>
      <AIcard tone="safety" tag="SAFE FOR YOU · TELECHECK AI"
        title="Every item is screened against your meds"
        body="Filtered against your 3 active meds and conditions. Red = don't take; yellow = caution."
        src="Last check: today 09:41"
        actions={["How it works"]}
        onAct={() => toast("Medication Interaction Engine · §10")}/>
      <div className="shop-grid">
        {filtered.map((i, idx) => (
          <div className="shop-c" key={idx} onClick={() => setSheet(i)}>
            <div className="img"/>
            <div className="n">{i.n}</div>
            <div className="p">{i.p}</div>
            <div className="s">{i.s}</div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--fg-3)", fontSize: 13 }}>
          Nothing in {cat} right now. Try another category.
        </div>
      )}
      {sheet && <ShopItemSheet item={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

function PhOrders({ nav, toast }) {
  const [sheet, setSheet] = uSB(null);
  const orders = {
    "1042": { title: "Order #1042 · delivered", sub: "14 Apr · Mobipharm Osu", items: [{ n: "Metformin 500 mg · 60 tab", p: "GHS 40" }, { n: "Delivery · Osu", p: "GHS 15" }], total: "GHS 55", to: "House 14 · Osu · Accra", rider: "Jumia Logistics · Kofi", delivered: "14 Apr 11:42" },
    "1019": { title: "Order #1019 · delivered", sub: "28 Mar · Mobipharm Osu", items: [{ n: "Lisinopril 10 mg · 30 tab", p: "GHS 28" }, { n: "Paracetamol 500 mg · 20 tab", p: "GHS 8" }, { n: "Glucose strips · 50", p: "GHS 37" }, { n: "Delivery · Osu", p: "GHS 15" }], total: "GHS 88", to: "House 14 · Osu · Accra", rider: "Jumia Logistics · Abena", delivered: "28 Mar 14:08" },
  };
  return (
    <>
      <div className="section-h"><span>In progress</span></div>
      <div className="steps">
        <div className="step done" onClick={() => toast("Request · 09:28")} style={{ cursor: "pointer" }}><div className="b"/><div className="ln"/><div><div className="st-t">Request sent</div><div className="st-s">You · today 09:28</div></div><div className="tm">09:28</div></div>
        <div className="step done" onClick={() => nav("pharmacy-safety")} style={{ cursor: "pointer" }}><div className="b"/><div className="ln"/><div><div className="st-t">Interaction check</div><div className="st-s">Clear · tap to see sweep</div></div><div className="tm">09:31</div></div>
        <div className="step now" onClick={() => nav("chat")} style={{ cursor: "pointer" }}><div className="b"/><div className="ln"/><div><div className="st-t">Clinician review</div><div className="st-s">Dr. Mensah · ETA 2h · message</div></div><div className="tm">now</div></div>
        <div className="step pending"><div className="b"/><div className="ln"/><div><div className="st-t">Dispensed</div><div className="st-s">Mobipharm Osu</div></div><div className="tm">—</div></div>
        <div className="step pending"><div className="b"/><div><div className="st-t">Delivered</div><div className="st-s">Osu · 22 Apr 10–14</div></div><div className="tm">—</div></div>
      </div>
      <div className="section-h"><span>History</span></div>
      <Row icon="shop" tone="info" title="Order #1042 · delivered" sub="14 Apr · GHS 55 · receipt PDF" onClick={() => setSheet(orders["1042"])}/>
      <Row icon="shop" tone="info" title="Order #1019 · delivered" sub="28 Mar · GHS 88 · receipt PDF" onClick={() => setSheet(orders["1019"])}/>
      {sheet && <OrderSheet order={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

function PhSafety({ nav, toast }) {
  const [sheet, setSheet] = uSB(null);
  const checks = {
    "dd": { title: "Drug–drug interactions", sub: "0 signals · last swept today 09:31", summary: "Metformin, lisinopril and paracetamol have been checked against each other across 14 interaction dimensions. No contraindications, no adjustments needed.", checked: [{ k: "Metformin × Lisinopril", v: "Safe" }, { k: "Metformin × Paracetamol", v: "Safe" }, { k: "Lisinopril × Paracetamol", v: "Safe" }, { k: "Cumulative QT risk", v: "Low" }], note: "Medication Interaction Engine runs on every prescription change, refill and basket. PRD §10." },
    "dc": { title: "Drug–condition", sub: "0 signals · 2 conditions reviewed", summary: "Your medications are appropriate for your conditions (type-2 diabetes, hypertension). No alerts.", checked: [{ k: "Metformin × Diabetes", v: "Indicated" }, { k: "Lisinopril × Hypertension", v: "Indicated" }, { k: "Paracetamol × All", v: "Safe" }, { k: "Kidney function guard", v: "eGFR 94 OK" }], note: "Re-checked every 72 hours or on any new diagnosis." },
    "dl": { title: "Drug–lab", sub: "0 signals · 6 labs reviewed", summary: "Your latest labs are in safe ranges for your medications. No dose adjustments recommended.", checked: [{ k: "eGFR (metformin guard)", v: "94 OK" }, { k: "Potassium (lisinopril)", v: "4.1 OK" }, { k: "ALT (metformin)", v: "22 OK" }, { k: "AST", v: "24 OK" }, { k: "HbA1c", v: "7.8% (tracked)" }], note: "Labs → med loop runs on every new result. §10." },
  };
  return (
    <>
      <div className="shield">
        <div className="ic"><Ic2 n="shield" s={26} c="#fff"/></div>
        <div className="t">All clear — your meds work safely together</div>
        <div className="s">Last sweep today 09:31 · 3 meds · 6 labs · 2 conditions reviewed.</div>
      </div>
      <div className="section-h"><span>Checks</span></div>
      <Row icon="shield" tone="teal" title="Drug–drug interactions" sub="0 active signals · last 09:31" pill={{label:"CLEAR", tone:"ok"}} onClick={() => setSheet(checks.dd)}/>
      <Row icon="shield" tone="teal" title="Drug–condition" sub="0 signals · checked against 2 conditions" pill={{label:"CLEAR", tone:"ok"}} onClick={() => setSheet(checks.dc)}/>
      <Row icon="shield" tone="teal" title="Drug–lab" sub="0 signals · eGFR, ALT, AST, K+ normal" pill={{label:"CLEAR", tone:"ok"}} onClick={() => setSheet(checks.dl)}/>
      <Row icon="dna" tone="iris" title="Pharmacogenomics" sub="Sample data · advisory only — your clinician interprets" pill={{label:"ADVISORY", tone:"info"}} onClick={() => toast("Pharmacogenomics · advisory at launch")}/>
      <Row icon="flag" tone="warn" title="Fake medication detection" sub="Pharmacist reviews every scan · patient view activates after FPR validation" pill={{label:"ADVISORY", tone:"warn"}} onClick={() => nav("scan-start")}/>
      <div className="section-h"><span>Herbal / traditional</span></div>
      <AIcard tone="safety" tag="HERB–DRUG ENGINE · v1.5"
        title="Tell us what else you take"
        body="Bitter kola, moringa, ginger tea, ampesi supplements — anything traditional. We'll check against your meds when v1.5 ships."
        actions={["Log an herb"]}
        onAct={() => toast("Herb–drug engine · v1.5 roadmap")}/>
      {sheet && <SafetyCheckSheet check={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

// ────────── LABS ──────────
function LabsV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI, sub = "Results", setSub }) {
  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">
        <BigH title="Labs" sub="Results, uploads, trends and AI review"/>
        <SubTabs tabs={["Results","Upload","Trends","AI review","Advanced"]} active={sub} onPick={setSub}/>
        <div className="content">
          {sub === "Results" && <LabResults nav={nav} toast={toast}/>}
          {sub === "Upload" && <LabUpload nav={nav} toast={toast}/>}
          {sub === "Trends" && <LabTrends nav={nav} toast={toast}/>}
          {sub === "AI review" && <LabAI nav={nav} toast={toast} openAI={openAI}/>}
          {sub === "Advanced" && <LabAdvanced toast={toast}/>}
        </div>
      </div>
      <TabBar2 active="labs" onTab={nav} care={2}/>
    </div>
  );
}

function LabResults({ nav, toast }) {
  const [sheet, setSheet] = uSB(null);
  const results = {
    hba1c: {
      title: "HbA1c · 14 Apr 2026", sub: "Mobilabs Osu · verified by Dr. Mensah",
      tone: "gold", flagLabel: "SLIGHTLY ELEVATED",
      value: "7.8 %", target: "< 7.0% for you", delta: "+0.2 vs 28 Feb",
      values: [
        { k: "HbA1c", v: "7.8 %", flag: "hi" },
        { k: "Estimated avg glucose", v: "178 mg/dL", flag: "hi" },
        { k: "Fasting glucose", v: "132 mg/dL", flag: "hi" },
        { k: "Reference", v: "4.0–5.6 %" },
      ],
      summary: "HbA1c is your average glucose over ~3 months. 7.8% means you're running a bit higher than target — plan is to hold metformin evening timing and re-check in 6 weeks. Nothing urgent.",
      signedBy: "SIGNED OFF · DR. MENSAH · 14 APR 08:12",
      clinicianNote: "Let's stick with 500mg metformin with dinner for 6 weeks, then re-check. Keep logging evening meals — the trend from Feb → Apr tells me timing matters more than dose for you.",
    },
    kidney: {
      title: "Kidney panel · 14 Apr 2026", sub: "Mobilabs Osu · all values normal",
      tone: "iris", flagLabel: "NORMAL",
      value: "94", target: "eGFR > 60", delta: "Stable vs last",
      values: [
        { k: "eGFR", v: "94 mL/min", flag: "ok" },
        { k: "Creatinine", v: "0.9 mg/dL", flag: "ok" },
        { k: "BUN", v: "14 mg/dL", flag: "ok" },
        { k: "Sodium", v: "140 mmol/L", flag: "ok" },
        { k: "Potassium", v: "4.1 mmol/L", flag: "ok" },
      ],
      summary: "Your kidney function is healthy. eGFR of 94 means kidneys are filtering well — important since metformin and lisinopril both lean on this.",
      signedBy: "SIGNED OFF · DR. MENSAH · 14 APR 08:14",
      clinicianNote: "Kidneys look great — this is what I watch every 3 months to make sure we can keep metformin. Nothing to change.",
    },
    lipid: {
      title: "Lipid panel · 28 Feb 2026", sub: "Mobilabs Osu · LDL borderline",
      tone: "info", flagLabel: "BORDERLINE",
      value: "LDL 142", target: "< 130 mg/dL", delta: "+14 vs Nov",
      values: [
        { k: "Total cholesterol", v: "210 mg/dL", flag: "hi" },
        { k: "LDL", v: "142 mg/dL", flag: "hi" },
        { k: "HDL", v: "48 mg/dL", flag: "ok" },
        { k: "Triglycerides", v: "148 mg/dL", flag: "ok" },
      ],
      summary: "LDL (the 'watch' cholesterol) has crept up. Not urgent, but worth revisiting at the next visit — could be diet-driven or just seasonal. We may discuss a statin in 3–6 months if the trend continues.",
      signedBy: "SIGNED OFF · DR. MENSAH · 28 FEB 11:02",
      clinicianNote: "Let's revisit in 3 months. Try 2 more fish-based meals per week and we'll see where it lands before considering medication.",
    },
    cbc: {
      title: "Complete blood count · 28 Feb 2026", sub: "Mobilabs Osu · Hb slightly low",
      tone: "teal", flagLabel: "MOSTLY NORMAL",
      value: "Hb 11.2", target: "12.0–15.5 g/dL", delta: "Slightly low",
      values: [
        { k: "Haemoglobin", v: "11.2 g/dL", flag: "lo" },
        { k: "White blood cells", v: "6.4 × 10⁹/L", flag: "ok" },
        { k: "Platelets", v: "244 × 10⁹/L", flag: "ok" },
        { k: "Hematocrit", v: "34 %", flag: "lo" },
      ],
      summary: "Haemoglobin is slightly below target — could mean mild iron deficiency. Common and easy to address with food (leafy greens, lean red meat, legumes) or a supplement if needed.",
      signedBy: "SIGNED OFF · NURSE ADJOA · 28 FEB 14:40",
      clinicianNote: "Mild, very common. Try adding more leafy greens and palm nut soup with beans. We'll re-check at your next visit.",
    },
  };
  return (
    <>
      <AIcard tone="lab" tag="NEW RESULT · REVIEWED"
        title="HbA1c 7.8% — Dr. Mensah signed off this morning"
        body="Slightly above target. Plan is 6 weeks of consistent evening metformin, then re-check."
        src="Verified by Dr. Mensah 14 Apr 08:12"
        actions={["Read plain-language summary"]}
        onAct={() => setSheet(results.hba1c)}/>
      <div className="section-h"><span>Awaiting clinician review</span></div>
      <Row icon="lab" tone="iris" title="Thyroid panel · TSH 1.9" sub="20 Apr · uploaded today · AI summary ready" pill={{label:"AI ONLY", tone:"iris"}} onClick={() => setSheet({
        title: "Thyroid panel · 20 Apr 2026", sub: "Uploaded today · awaiting Dr. Mensah review",
        tone: "iris", flagLabel: "AI INTERPRETATION ONLY",
        value: "TSH 1.9", target: "0.4–4.0 mIU/L", delta: "Normal range",
        values: [{k:"TSH",v:"1.9 mIU/L",flag:"ok"},{k:"Free T4",v:"1.3 ng/dL",flag:"ok"},{k:"Free T3",v:"3.1 pg/mL",flag:"ok"},{k:"Reference TSH",v:"0.4–4.0"}],
        summary: "AI read: TSH, Free T4 and Free T3 all land inside normal adult ranges — no thyroid-function flags. This summary is from the AI; your clinician hasn't reviewed yet. Don't change any thyroid-affecting meds based on this alone.",
      })}/>
      <div className="section-h"><span>Recent</span></div>
      <Row icon="lab" tone="gold" title="HbA1c · 7.8%" sub="14 Apr · Mobilabs Osu" pill={{label:"REVIEWED", tone:"ok"}} onClick={() => setSheet(results.hba1c)}/>
      <Row icon="lab" tone="iris" title="Kidney panel · normal" sub="14 Apr · eGFR 94" pill={{label:"REVIEWED", tone:"ok"}} onClick={() => setSheet(results.kidney)}/>
      <Row icon="lab" tone="info" title="Lipid panel · borderline" sub="28 Feb · LDL 142" pill={{label:"REVIEWED", tone:"ok"}} onClick={() => setSheet(results.lipid)}/>
      <Row icon="lab" tone="teal" title="CBC · normal" sub="28 Feb · Hb 11.2 (low)" pill={{label:"REVIEWED", tone:"ok"}} onClick={() => setSheet(results.cbc)}/>
      <div className="section-h"><span>Older</span></div>
      <Row icon="lab" tone="info" title="HbA1c · 7.6%" sub="28 Feb 2026" onClick={() => setSheet({ ...results.hba1c, title: "HbA1c · 28 Feb 2026", value: "7.6 %", delta: "+0.1 vs 02 Jan", values: [{k:"HbA1c",v:"7.6 %",flag:"hi"},{k:"Estimated avg glucose",v:"171 mg/dL",flag:"hi"},{k:"Reference",v:"4.0–5.6 %"}] })}/>
      <Row icon="lab" tone="info" title="HbA1c · 7.5%" sub="02 Jan 2026" onClick={() => setSheet({ ...results.hba1c, title: "HbA1c · 02 Jan 2026", value: "7.5 %", delta: "+0.0 vs Nov", values: [{k:"HbA1c",v:"7.5 %",flag:"hi"},{k:"Estimated avg glucose",v:"168 mg/dL",flag:"hi"},{k:"Reference",v:"4.0–5.6 %"}] })}/>
      {sheet && <LabResultSheet result={sheet} onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
    </>
  );
}

function LabUpload({ nav, toast }) {
  const [step, setStep] = uSB(0);
  return (
    <>
      {step === 0 && (
        <>
          <div className="upload-drop" onClick={() => setStep(1)}>
            <div className="ic"><Ic2 n="upload" s={24} sw={2}/></div>
            <div className="t">Upload a lab report</div>
            <div className="s">PDF, JPG, or photo of paper report. AI extracts values, you confirm, clinician reviews.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="btn-p" onClick={() => setStep(1)} style={{ padding: 14, fontSize: 13 }}>📷 Photo</button>
            <button className="btn-g" onClick={() => setStep(1)} style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", padding: 14, fontSize: 13 }}>📄 Browse files</button>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <div style={{ aspectRatio: "4/3", borderRadius: 14, background: "linear-gradient(160deg, #f4ecd7, #e8dcb5)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 20, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 8px)"}}/>
            <div style={{ position: "absolute", top: 16, left: 20, fontSize: 10, fontWeight: 700, color: "#6b5a28", letterSpacing: "0.08em" }}>MOBILABS OSU · 14 APR 2026</div>
          </div>
          <AIcard tone="lab" tag="AI EXTRACTED · REVIEW BEFORE SUBMIT"
            title="We read 6 values from this report"
            body="Confirm they're right. If a value looks wrong, tap to correct it."
            src="Confidence 96% · reference intervals applied"/>
          <div className="extract">
            <div className="extract-row"><span className="k">HbA1c</span><span className="v hi">7.8 %</span></div>
            <div className="extract-row"><span className="k">Fasting glucose</span><span className="v hi">132 mg/dL</span></div>
            <div className="extract-row"><span className="k">Creatinine</span><span className="v ok">0.9 mg/dL</span></div>
            <div className="extract-row"><span className="k">eGFR</span><span className="v ok">94 mL/min</span></div>
            <div className="extract-row"><span className="k">ALT</span><span className="v ok">22 U/L</span></div>
            <div className="extract-row"><span className="k">Haemoglobin</span><span className="v lo">11.2 g/dL</span></div>
          </div>
          <button className="cta" style={{ width: "100%", margin: 0 }} onClick={() => { toast("Submitted · Dr. Mensah notified"); setStep(0); nav("labs"); }}>Submit for clinician review</button>
          <button className="cta g" onClick={() => setStep(0)}>Start over</button>
        </>
      )}
    </>
  );
}

function LabTrends({ nav, toast }) {
  const [sheet, setSheet] = uSB(null);
  const trends = {
    egfr: { title: "eGFR · kidney filter", sub: "Stable · 6 months", tone: "iris", flagLabel: "STABLE", value: "94", target: "> 60 mL/min", delta: "92–96 range",
      values: [{k:"14 Apr",v:"94"},{k:"28 Feb",v:"92"},{k:"02 Jan",v:"96"},{k:"15 Nov",v:"94"},{k:"Reference",v:"> 60 mL/min"}],
      summary: "Kidney filter function has stayed healthy over 6 months. This is what clears metformin from your body, so it's the key lab to watch.",
      signedBy: "AUTO-TRACKED · DR. MENSAH REVIEWS MONTHLY", clinicianNote: "Keep doing what you're doing — hydration and avoiding NSAIDs is working." },
    ldl: { title: "LDL cholesterol", sub: "Slowly rising · 6 months", tone: "info", flagLabel: "TRENDING UP", value: "142", target: "< 130 mg/dL", delta: "+14 since Nov",
      values: [{k:"28 Feb",v:"142 mg/dL",flag:"hi"},{k:"15 Nov",v:"128 mg/dL",flag:"ok"},{k:"20 Aug",v:"124 mg/dL",flag:"ok"},{k:"Target",v:"< 130 mg/dL"}],
      summary: "LDL has crept up over 6 months. Still borderline — not a crisis, but we want to see it come back down. Diet is the first lever.",
      signedBy: "SIGNED OFF · DR. MENSAH · 28 FEB", clinicianNote: "Let's try food changes first. If it's still > 140 in 3 months, we'll discuss a statin." },
    glucose: { title: "Fasting glucose · 7-day", sub: "Home meter · Accu-Chek", tone: "teal", flagLabel: "TRACKED DAILY", value: "122", target: "80–130 mg/dL", delta: "7-day avg",
      values: [{k:"Today",v:"118 mg/dL"},{k:"Yesterday",v:"132 mg/dL"},{k:"2 days ago",v:"119 mg/dL"},{k:"3 days ago",v:"124 mg/dL"},{k:"7-day avg",v:"122 mg/dL"}],
      summary: "You're landing in target most mornings. Highs tend to follow rice-heavy dinners — worth noting for timing your metformin.",
      signedBy: "AUTO-TRACKED FROM HOME METER", clinicianNote: "Reviewed weekly — current trend is good." },
  };
  return (
    <>
      <div className="chart">
        <h3>HBA1C · 18 MONTHS</h3>
        <div className="chart-big">7.8<span>%</span></div>
        <div className="chart-delta"><Ic2 n="trend" s={12} sw={2.2}/> +0.5 vs. last year</div>
        <svg width="100%" height="130" viewBox="0 0 380 130" style={{ marginTop: 12 }}>
          <line x1="20" x2="360" y1="70" y2="70" stroke="var(--gold-500)" strokeDasharray="4 4" opacity="0.5"/>
          <text x="365" y="74" fontSize="9" fill="var(--gold-700)">7.0</text>
          <polyline points="20,95 90,88 160,82 230,72 300,67 360,58" fill="none" stroke="var(--gold-500)" strokeWidth="2.5"/>
          {[{x:20,y:95},{x:90,y:88},{x:160,y:82},{x:230,y:72},{x:300,y:67},{x:360,y:58}].map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="var(--gold-500)" strokeWidth="2"/>)}
        </svg>
      </div>
      <div className="section-h"><span>Other trends</span></div>
      <Row icon="trend" tone="iris" title="eGFR · kidney function" sub="Stable 92–96 · 6 months" onClick={() => setSheet(trends.egfr)}/>
      <Row icon="trend" tone="info" title="LDL cholesterol" sub="142 ▲ from 128 (Nov)" onClick={() => setSheet(trends.ldl)}/>
      <Row icon="trend" tone="teal" title="Fasting glucose" sub="7-day avg 122" onClick={() => nav("glucose")}/>
      {sheet && <LabResultSheet result={sheet} onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
    </>
  );
}

function LabAI({ toast, openAI }) {
  return (
    <>
      <AIcard tone="lab" tag="PATIENT-FACING EXPLAINER · AI"
        title="What does 'HbA1c 7.8%' actually mean for me?"
        body="HbA1c is your average glucose over ~3 months. 7.8% means about 55% of the time you're running higher than target. Small changes to evening meals & timing usually matter most."
        src="Tied to: your labs · meds · food logs"
        actions={["Ask a follow-up", "Share with family"]}
        onAct={(a) => a.startsWith("Ask") ? openAI() : toast("Share panel")}/>
      <div className="section-h"><span>Saved explanations</span></div>
      <Row icon="doc" tone="iris" title="What is eGFR?" sub="Saved 12 Apr · 2 min read" onClick={openAI}/>
      <Row icon="doc" tone="iris" title="Why is my haemoglobin low?" sub="Saved 28 Feb · 3 min read" onClick={openAI}/>
      <div className="section-h"><span>Questions I might ask</span></div>
      {["Should I worry about LDL 142?","Is 7.8% dangerous short-term?","How do I bring HbA1c down?"].map((q, i) => (
        <div key={i} className="lc" onClick={openAI}>
          <div className="lc-ic iris"><Ic2 n="spark" s={18} sw={2.2}/></div>
          <div><div className="lc-t">{q}</div></div>
          <div className="lc-chev"><Ic2 n="chev" s={18}/></div>
        </div>
      ))}
    </>
  );
}

function LabAdvanced({ toast }) {
  const [sheet, setSheet] = uSB(null);
  return (
    <>
      <Row icon="dna" tone="iris" title="Pharmacogenomics" sub="Sample data · advisory — your clinician interprets before any dosing change" pill={{label:"LAUNCH · SAMPLE · ADVISORY", tone:"info"}} onClick={() => setSheet({ title: "Pharmacogenomics · launch / advisory", sub: "Sample genetic report · clinician-interpreted", body: "At launch Telecheck ships pharmacogenomics as an advisory overlay with sample data. We flag medications that may be metabolized differently by your CYP genes — warfarin, clopidogrel, certain SSRIs — for your clinician to interpret before any dosing change. You will not see dose recommendations from the system directly; every PGx signal passes through your clinician.", rows: [{k:"Status",v:"Launch · sample data"},{k:"Who sees it",v:"You + your clinician"},{k:"Who acts on it",v:"Your clinician only"},{k:"Upload real report",v:"Post-FDA validation"}], actions: ["See your sample profile", "Learn how PGx works"] })}/>
      <Row icon="eye" tone="info" title="DFPAS scan · v2" sub="Lower-limb circulation biometrics" pill={{label:"v2", tone:"warn"}} onClick={() => setSheet({ title: "DFPAS · digital foot / peripheral arterial scan", sub: "Coming in v2", body: "A low-cost screening using your phone camera to detect reduced circulation in your feet — a key early warning for diabetic foot complications. Will be free for enrolled diabetes patients. Planned for v2.", actions: ["Notify me when this ships"] })}/>
      <Row icon="bolt" tone="warn" title="AI second opinion · v2" sub="AI review + specialist network" pill={{label:"v2", tone:"warn"}} onClick={() => setSheet({ title: "AI second opinion", sub: "Coming in v2", body: "Request an independent review of any diagnosis or treatment plan. AI screens first, then routes to a matching specialist in the Telecheck network. Flat fee, 48-hour turnaround.", actions: ["Notify me when this ships"] })}/>
      <Row icon="heart" tone="teal" title="Pregnancy tracking" sub="Weekly milestones · AI Q&A" onClick={() => setSheet({ title: "Pregnancy tracking program", sub: "Available now · enroll in Care → Programs", rows: [{k:"Weekly milestones",v:"From conception to delivery"},{k:"AI Q&A",v:"24/7 answers, culturally tuned"},{k:"Symptom diary",v:"Track nausea, BP, fetal kicks"},{k:"Danger signs",v:"Auto-alert midwife"},{k:"Cost",v:"Free during Ghana pilot"}], actions: ["Enroll now", "Learn more"] })}/>
      {sheet && <SettingsDetailSheet item={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

// ────────── ME (simplified: 7 → 4 subtabs) ──────────
function MeV2({ nav, toast, delegate, openAccount, openNotifs, openEmergency, openAI, openEpisodeConsent, openEpisodeActive, episodeActive, sub = "Profile", setSub }) {
  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar delegate={delegate} onAccount={openAccount} onNotifs={openNotifs} onEmergency={openEmergency} onAI={openAI}/>
      <div className="scroll">
        <BigH title={delegate === "k" ? "Kofi Mensah" : "Ama Mensah"} sub={delegate === "k" ? "Caregiver view · 3 permissions" : "Your profile, records, account and community"}/>
        <SubTabs tabs={["Profile","Records","Account","Community"]} active={sub} onPick={setSub}/>
        <div className="content">
          {sub === "Profile" && <MeProfile toast={toast} nav={nav} openAccount={openAccount}/>}
          {sub === "Records" && <MeRecords toast={toast} nav={nav} openEpisodeConsent={openEpisodeConsent} openEpisodeActive={openEpisodeActive} episodeActive={episodeActive}/>}
          {sub === "Account" && <MeAccount toast={toast} openAI={openAI}/>}
          {sub === "Community" && <MeCommunity toast={toast}/>}
        </div>
      </div>
      <TabBar2 active="me" onTab={nav} care={2}/>
    </div>
  );
}

// Profile merges old Profile + Family (it's really "who am I + who's around me")
function MeProfile({ toast, nav, openAccount }) {
  const [docSheet, setDocSheet] = uSLM(null);
  const [famSheet, setFamSheet] = uSLM(null);
  return (
    <>
      <div className="section-h"><span>You</span></div>
      <Row icon="user" tone="teal" title="Ama Mensah · 34" sub="Osu, Accra · Ghana ID verified" pill={{label:"VERIFIED", tone:"ok"}} onClick={() => setDocSheet({ title: "Ama Mensah", sub: "Verified identity", rows: [{k:"Full name",v:"Ama Akosua Mensah"},{k:"Date of birth",v:"14 Mar 1991"},{k:"Ghana ID",v:"GHA-732****17"},{k:"Phone",v:"+233 20 4** ****"},{k:"Email",v:"a.mensah@…"},{k:"Address",v:"House 14, Osu, Accra"},{k:"Blood type",v:"O+"},{k:"Primary language",v:"English (Twi secondary)"}] })}/>
      <Row icon="heart" tone="iris" title="Conditions · 2" sub="Type-2 diabetes · mild hypertension" onClick={() => setDocSheet({ title: "Conditions", sub: "Active · managed", rows: [{k:"Type-2 diabetes",v:"Diagnosed Jun 2023"},{k:"Mild hypertension",v:"Diagnosed Jan 2024"},{k:"Managed by",v:"Dr. Kwame Mensah"},{k:"Next review",v:"22 Apr 10:30"}] })}/>
      <Row icon="pill" tone="warn" title="Medications · 3 active" sub="Metformin · lisinopril · paracetamol PRN" onClick={() => nav("pharmacy")}/>
      <Row icon="flag" tone="info" title="Allergies · 1" sub="Penicillin · moderate rash" onClick={() => setDocSheet({ title: "Allergies", sub: "1 active", rows: [{k:"Penicillin",v:"Moderate · rash"},{k:"First reaction",v:"Childhood (age 8)"},{k:"Alternatives",v:"Amoxicillin-clavulanate also avoided"},{k:"Emergency card",v:"Flagged on your profile"}] })}/>
      <Row icon="doc" tone="teal" title="Emergency info card" sub="O+ · contact Kojo +233… · tap to view" onClick={() => setDocSheet({ title: "Emergency card", sub: "Visible on lock screen if enabled", rows: [{k:"Full name",v:"Ama Mensah"},{k:"Blood type",v:"O+"},{k:"Allergies",v:"Penicillin"},{k:"Conditions",v:"Type-2 diabetes, HTN"},{k:"Active meds",v:"Metformin, lisinopril"},{k:"Emergency contact 1",v:"Kojo Asare · +233 20 … 319"},{k:"Emergency contact 2",v:"Dr. Mensah · +233 30 … 780"}], actions: ["Show on lock screen", "Download PDF for wallet"] })}/>

      <div className="section-h"><span>Family &amp; delegates</span></div>
      <AIcard tone="sched" tag="DELEGATED CARE · CONSENT-BOUND"
        title="Every action under delegation is audited in the target account"
        body="You have your own Telecheck account. When you act for someone, every step is logged in their record with your name."
        src="PRD §14 · v4.2 contracts"/>
      <div className="fam" onClick={() => setFamSheet("kofi")} style={{ cursor: "pointer" }}>
        <div className="fam-av" style={{ background: "var(--gold-500)" }}>KO</div>
        <div style={{ flex: 1 }}>
          <div className="lc-t">Kofi Mensah · dad</div>
          <div className="lc-s">Hypertension · 3 permissions · expires 12 Oct</div>
        </div>
        <Ic2 n="chev" s={18} c="var(--fg-4)"/>
      </div>
      <div className="fam" onClick={() => setFamSheet("abena")} style={{ cursor: "pointer" }}>
        <div className="fam-av" style={{ background: "var(--iris-500)" }}>AB</div>
        <div style={{ flex: 1 }}>
          <div className="lc-t">Abena · daughter · 8</div>
          <div className="lc-s">Pediatric · full delegate · minor default</div>
        </div>
        <Ic2 n="chev" s={18} c="var(--fg-4)"/>
      </div>
      <div className="fam" onClick={() => setFamSheet("kojo")} style={{ cursor: "pointer" }}>
        <div className="fam-av" style={{ background: "var(--teal-500)" }}>KJ</div>
        <div style={{ flex: 1 }}>
          <div className="lc-t">Kojo Asare · partner</div>
          <div className="lc-s">Has access to your labs + meds · since 14 Jan</div>
        </div>
        <Ic2 n="chev" s={18} c="var(--fg-4)"/>
      </div>
      <button className="cta" style={{ width: "100%", margin: "6px 0 0" }} onClick={() => toast("Invite sent · +233…")}>Invite a family member</button>

      {docSheet && <RecordDocSheet doc={docSheet} onClose={() => setDocSheet(null)} toast={toast}/>}
      {famSheet && <FamilyMemberSheet member={famSheet} onClose={() => setFamSheet(null)} toast={toast} onSwitch={openAccount}/>}
    </>
  );
}

function MeRecords({ toast, nav, openEpisodeConsent, openEpisodeActive, episodeActive }) {
  const [sheet, setSheet] = uSLM(null);
  return (
    <>
      <div className="section-h"><span>Consent center</span></div>
      <AIcard tone="sched" tag="6 CONSENT TYPES · GRANULAR &amp; REVOCABLE"
        title="Everything you've agreed to — reviewable, revocable"
        body="Telecheck separates what you've consented to. Revoke any of them here; the change takes effect immediately and is audited in your record."
        src="PRD §15 · consent &amp; delegated access model"/>
      <Row icon="shield" tone="teal" title="1 · Platform consent" sub="Terms, baseline data handling, identity · granted 14 Jan 2026" pill={{label:"GRANTED", tone:"ok"}} onClick={() => setSheet({ title: "Platform consent", sub: "Using Telecheck at all", body: "Covers the baseline contract: you use Telecheck under its terms of service, we handle identity verification and baseline record-keeping. Revoking this closes your account. No partial revocation.", rows: [{k:"Granted",v:"14 Jan 2026 · in-app signed"},{k:"Version",v:"Terms v1.2 · Ghana edition"},{k:"Evidence",v:"Voice + tap affirmation"},{k:"Duration",v:"Perpetual until revoked"},{k:"Revocation effect",v:"Account closes · 30-day data hold"}], actions: ["Read terms v1.2", "Revoke (close account)"] })}/>
      <Row icon="heart" tone="iris" title="2 · Care consent" sub="Receive clinical care via Telecheck · granted 14 Jan" pill={{label:"GRANTED", tone:"ok"}} onClick={() => setSheet({ title: "Care consent", sub: "Receive clinical care via the platform — carries clinical legal weight", body: "Lets Telecheck clinicians consult you, prescribe, monitor your conditions, and carry out protocolized actions on your behalf. This consent has real clinical legal weight in Ghana. Revoking it pauses all clinical services — refills, visits, RPM — until re-granted.", rows: [{k:"Granted",v:"14 Jan 2026"},{k:"Scope",v:"Consults · prescribing · monitoring · protocolized"},{k:"Evidence",v:"Signed form + clinician attestation"},{k:"Version",v:"v1.1"},{k:"Revocation effect",v:"Pauses all clinical services"}], actions: ["Download signed form", "Revoke care consent"] })}/>
      <Row icon="eye" tone="info" title="3 · Data-use consent" sub="AI interpretation · pharmacy sharing · analytics · community" pill={{label:"GRANULAR", tone:"ok"}} onClick={() => setSheet({ title: "Data-use consent", sub: "Per-flow, toggle any row", body: "Data-use consent isn't one switch — it's one per data flow. Granted ≠ all. Revoking a flow stops it going forward; past flows are auditable.", rows: [{k:"AI interpretation of your data",v:"Granted"},{k:"Pharmacy partner sharing",v:"Granted · Mobipharm Osu only"},{k:"Hospital sharing (Korle Bu, 37 Military)",v:"Not granted"},{k:"Anonymized analytics",v:"Granted"},{k:"Community participation",v:"Granted"},{k:"Research dataset inclusion",v:"Not granted"}], actions: ["Adjust each flow"], actionNavs: ["data-use"] })}/>
      <Row icon="users" tone="gold" title="4 · Delegation consent" sub="3 delegates · 1 inbound (Kojo), 2 outbound (Kofi, Abena)" pill={{label:"3 ACTIVE", tone:"ok"}} onClick={() => setSheet({ title: "Delegation consent", sub: "You granting access to others · others granting access to you", body: "Covers every delegation relationship. Every action under a delegation is logged in the target account with the delegate's identity attached (PRD §15).", rows: [{k:"Kofi Mensah (dad) — you manage him",v:"3 permissions · expires 12 Oct"},{k:"Abena (daughter, 8) — you manage her",v:"Full · parent-of-minor default"},{k:"Kojo Asare (partner) — has access to you",v:"Labs + meds · since 14 Jan"}], actions: ["Open family &amp; delegates", "Revoke a relationship"], actionNavs: ["me-family"] })}/>
      <Row icon="globe" tone="info" title="5 · Jurisdictional consent" sub="Ghana FDA reporting · Data Protection Act rights" pill={{label:"GHANA", tone:"ok"}} onClick={() => setSheet({ title: "Jurisdictional consent · Ghana", sub: "Market-specific regulatory consents", body: "The Ghana regulatory consents that unlock care here: adverse-event reporting to the Ghana FDA, data residency in Accra (backup in Lagos), and your rights under the Ghana Data Protection Act. These are tied to your country of care.", rows: [{k:"Ghana FDA adverse-event reporting",v:"Granted"},{k:"Data residency · Accra (Lagos backup)",v:"Granted"},{k:"Data Protection Act rights",v:"Acknowledged"},{k:"Changing country of care",v:"Requires identity re-verification"}], actions: ["Read DPA compliance note", "Request country change"], actionNavs: [null, "jurisdiction"] })}/>
      <Row icon="bolt" tone={episodeActive ? "iris" : "warn"} title="6 · Episode consent" sub={episodeActive ? "1 active · AI second opinion" : "Per specific clinical episode (e.g., second opinion)"} pill={{label: episodeActive ? "1 ACTIVE" : "0 ACTIVE", tone: episodeActive ? "ok" : "info"}} onClick={() => episodeActive ? openEpisodeActive?.() : openEpisodeConsent?.()}/>

      <div className="section-h"><span>Documents</span></div>
      <Row icon="doc" tone="info" title="Full medical record · PDF" sub="Generated on demand · last: 12 Apr" onClick={() => setSheet({ title: "Full medical record", sub: "Generated on demand · PDF", body: "A complete longitudinal record: diagnoses, medications, all labs, visit notes from every clinician on Telecheck. Takes ~30 seconds to generate. Can be emailed, downloaded, or shared via secure link that expires in 72 hours.", rows: [{k:"Last generated",v:"12 Apr 2026"},{k:"Pages",v:"42 · 3.1 MB"},{k:"Clinicians included",v:"Dr. Mensah, Nurse Adjoa, Dr. Osei"},{k:"Date range",v:"Jun 2023 – present"}], actions: ["Generate fresh PDF", "Share via secure link"] })}/>
      <Row icon="doc" tone="teal" title="Immunization record" sub="9 vaccines · Ghana EPI" onClick={() => setSheet({ title: "Immunization record", sub: "Ghana EPI compliant", rows: [{k:"BCG",v:"Mar 1991"},{k:"Polio (IPV)",v:"1991–1992"},{k:"DPT-HepB-Hib",v:"1991–1992"},{k:"Measles",v:"Aug 1992"},{k:"Yellow fever",v:"Aug 1992 · lifetime"},{k:"Meningitis A",v:"Nov 2015"},{k:"COVID-19",v:"2021 · 3 doses"},{k:"Tetanus booster",v:"Jan 2024"},{k:"HPV",v:"Not given"}], actions: ["Download as PDF", "Share with travel clinic"] })}/>
      <Row icon="doc" tone="gold" title="Insurance card" sub="NHIS · member 23** ****" onClick={() => setSheet({ title: "NHIS card", sub: "National Health Insurance · active", rows: [{k:"Member ID",v:"23** ****"},{k:"Status",v:"Active"},{k:"Expires",v:"14 Mar 2027"},{k:"Coverage tier",v:"Informal sector"},{k:"Private top-up",v:"None"}], actions: ["Show card on screen", "Renew NHIS"] })}/>
      <div className="section-h"><span>Data &amp; portability</span></div>
      <Row icon="upload" tone="iris" title="Export my data" sub="JSON + PDF · sent by email" onClick={() => setSheet({ title: "Export your data", sub: "Full portability · PRD §11", body: "Download everything Telecheck has stored about you — labs, visits, messages, medications, AI conversations, permissions log. Delivered as JSON (for transfer to another system) plus a human-readable PDF.", rows: [{k:"Estimated size",v:"~8 MB"},{k:"Delivery",v:"Email link · expires 72h"},{k:"Format",v:"JSON + PDF"}], actions: ["Queue export now"] })}/>
      <Row icon="globe" tone="info" title="Share with a hospital" sub="Korle Bu, 37 Military, private clinics" onClick={() => setSheet({ title: "Share record with a hospital", sub: "One-time, time-bound", body: "Create a time-limited link with exactly the sections you want shared. Receiving clinic sees only those sections, for only the duration you set. All access is logged.", actions: ["Pick sections to share", "See who I've shared with"] })}/>
      <div className="section-h"><span>Audit trail</span></div>
      <Row icon="shield" tone="teal" title="Access log — who touched your record" sub="24 events · last 30 days · tap to see timeline" pill={{label:"LIVE", tone:"ok"}} onClick={() => nav?.("audit")}/>
      <Row icon="doc" tone="info" title="Signed audit export" sub="Email yourself a chronological PDF" onClick={() => setSheet({ title: "Signed audit export", sub: "Merkle-chained · tamper-evident", body: "A signed chronological record of every access and consent change. Useful if you need to show what's happened with your data to a hospital, lawyer, or regulator. Telecheck keeps the same log on its side for 7 years per Ghana DPA requirements.", rows: [{k:"Format",v:"PDF + signed JSON"},{k:"Delivery",v:"Email · 72h link"},{k:"Integrity",v:"sha256 chain · verifiable"}], actions: ["Queue export now"] })}/>
      {sheet && <RecordDocSheet doc={sheet} onClose={() => setSheet(null)} toast={toast} nav={nav}/>}
    </>
  );
}

// Account merges old Billing + Preferences + Support
function MeAccount({ toast, openAI }) {
  const [sheet, setSheet] = uSLM(null);
  const [n, setN] = uSB({ meds: true, labs: true, visits: true, ai: true, community: false, offers: false });
  const [lang, setLang] = uSB("English");
  return (
    <>
      {/* Billing section */}
      <div className="section-h"><span>Plan &amp; billing</span></div>
      <div className="prog">
        <div className="prog-h">
          <div><div className="prog-t">Diabetes RPM subscription</div><div className="prog-s">GHS 80/mo · next charge 20 May</div></div>
          <div className="prog-wk">ACTIVE</div>
        </div>
      </div>
      <Row icon="card" tone="info" title="MTN MoMo · 0*** *** 812" sub="Default · Ghana Cedi" onClick={() => setSheet({ title: "MTN Mobile Money", sub: "Default payment method", rows: [{k:"Number",v:"0*** *** 812"},{k:"Status",v:"Verified"},{k:"Added",v:"14 Jan 2026"},{k:"Auto-charge",v:"On · monthly subscription"}], actions: ["Set as backup instead", "Remove this method"] })}/>
      <Row icon="card" tone="iris" title="Vodafone Cash · 0*** *** 319" sub="Backup" onClick={() => setSheet({ title: "Vodafone Cash", sub: "Backup payment method", rows: [{k:"Number",v:"0*** *** 319"},{k:"Status",v:"Verified"},{k:"Added",v:"22 Mar 2026"}], actions: ["Make default", "Remove"] })}/>
      <Row icon="plus" tone="teal" title="Add a method" sub="Card, mobile money, or bank" onClick={() => setSheet({ title: "Add payment method", sub: "Secure · processed by Paystack", body: "We accept MTN MoMo, Vodafone Cash, AirtelTigo Money, Visa/Mastercard, and bank transfer (GCB, Ecobank, Fidelity). All payments are processed by Paystack — we never see your full card/account numbers.", actions: ["Add mobile money", "Add card", "Add bank transfer"] })}/>
      <Row icon="doc" tone="info" title="Payment history" sub="Metformin, RPM subscription, visits" onClick={() => setSheet({ title: "Payment history", sub: "Last 90 days", rows: [{k:"Metformin refill",v:"GHS 55 · 14 Apr · MoMo"},{k:"RPM subscription",v:"GHS 80 · 20 Apr · auto"},{k:"Dr. Mensah visit",v:"GHS 120 · 28 Feb · MoMo"},{k:"Metformin refill",v:"GHS 48 · 15 Feb · MoMo"},{k:"RPM subscription",v:"GHS 80 · 20 Feb · auto"},{k:"Lab work · Mobilabs",v:"GHS 95 · 28 Feb · MoMo"}], actions: ["Download 90-day statement"] })}/>

      {/* Preferences — notifications */}
      <div className="section-h"><span>Notifications</span></div>
      {[
        ["meds","Medication reminders","Doses, refills, pickups"],
        ["labs","Lab updates","New results + AI summaries"],
        ["visits","Visit reminders","Pre-call checks and follow-ups"],
        ["ai","AI nudges","Weekly brief, pattern alerts"],
        ["community","Community","Events, Q&As, groups"],
        ["offers","Offers","Shop promotions"],
      ].map(([k, t, s]) => (
        <div className="pref" key={k}>
          <div className="pref-l"><div className="t">{t}</div><div className="s">{s}</div></div>
          <div className={`sw ${n[k] ? "on" : ""}`} onClick={() => setN({ ...n, [k]: !n[k] })}/>
        </div>
      ))}

      {/* Language & region */}
      <div className="section-h"><span>Language &amp; region</span></div>
      <div className="pref">
        <div className="pref-l"><div className="t">Language</div><div className="s">Content and clinician messages</div></div>
        <div className="tw-opts" style={{ display: "flex", gap: 4 }}>
          {["English","Twi","Ga"].map(l => <button key={l} className={`tw-opt ${lang === l ? "on" : ""}`} onClick={() => { setLang(l); toast(`Language: ${l}`); }}>{l}</button>)}
        </div>
      </div>
      <Row icon="globe" tone="info" title="Ghana" sub="Country of care · affects jurisdiction rules" onClick={() => setSheet({ title: "Country of care · Ghana", sub: "Affects consent, pricing, clinician network", body: "Your country determines which regulatory framework applies, which clinicians are in-network, which pharmacies can fulfill, and which languages are available. Changing country requires identity re-verification.", rows: [{k:"Country",v:"Ghana"},{k:"Data residency",v:"Accra (primary), Lagos (backup)"},{k:"Clinician network",v:"142 verified"},{k:"Pharmacy network",v:"38 verified"}], actions: ["Request country change"] })}/>

      {/* Privacy & security */}
      <div className="section-h"><span>Privacy &amp; security</span></div>
      <Row icon="lock" tone="teal" title="Lock with Face ID" sub="Required to open app and confirm actions" onClick={() => setSheet({ title: "Face ID lock", sub: "On", rows: [{k:"App open",v:"Face ID required"},{k:"Confirm prescriptions",v:"Face ID + explicit tap"},{k:"Pay / checkout",v:"Face ID"},{k:"Fallback",v:"4-digit PIN"}], actions: ["Change PIN", "Turn off Face ID"] })}/>
      <Row icon="eye" tone="iris" title="Who sees what" sub="Granular data sharing per category" onClick={() => setSheet({ title: "Data sharing", sub: "Granular by category", rows: [{k:"Medications",v:"Dr. Mensah, Kojo, Mobipharm"},{k:"Labs",v:"Dr. Mensah, Kojo"},{k:"Visit notes",v:"Dr. Mensah only"},{k:"AI conversations",v:"Private · not shared"},{k:"RPM readings",v:"Dr. Mensah, Nurse Adjoa"},{k:"Messages",v:"Recipient only"}], actions: ["Adjust sharing"] })}/>
      <Row icon="shield" tone="info" title="Offline / low-connectivity mode" sub="Cache prescriptions + emergency info" onClick={() => setSheet({ title: "Offline mode", sub: "For low / no connectivity", body: "Keep a cached copy of your active prescriptions, emergency card, and last 7 days of AI guidance available without network. Updates whenever you're back online.", rows: [{k:"Storage used",v:"~3 MB"},{k:"Last synced",v:"Today 09:41"}], actions: ["Turn on offline mode"] })}/>

      {/* Accessibility */}
      <div className="section-h"><span>Accessibility</span></div>
      <Row icon="eye" tone="info" title="Larger text" sub="Increase across the app" onClick={() => setSheet({ title: "Text size", sub: "Bigger, more legible", rows: [{k:"Current",v:"Default"}], actions: ["Default", "Large", "Extra large"] })}/>
      <Row icon="mic" tone="iris" title="Voice-first mode" sub="Read screens aloud, dictate replies" onClick={() => setSheet({ title: "Voice-first mode", sub: "For low-literacy / low-vision use", body: "Telecheck will read every screen aloud in your chosen language (English, Twi, or Ga) and let you reply by speaking. Especially useful for older caregivers.", actions: ["Turn on voice-first"] })}/>

      {/* Support */}
      <div className="section-h"><span>Get help</span></div>
      <AIcard tone="sched" tag="NEED HELP? TELECHECK AI"
        title="Ask me anything about your account"
        body="Billing, refills, or how to delegate — I'll answer. Clinical questions get routed to your nurse."
        actions={["Ask"]}
        onAct={openAI}/>
      <Row icon="help" tone="teal" title="Help center" sub="Guides + FAQ · 120 articles" onClick={() => setSheet({ title: "Help center", sub: "120 articles · Ghana-specific", body: "Searchable guides covering every feature. Most-read right now: 'Setting up delegation for a parent,' 'Reading your lab report,' 'What NHIS covers on Telecheck.'", actions: ["Open help center"] })}/>
      <Row icon="chat" tone="iris" title="Contact support" sub="Chat · typical reply 10 min" onClick={() => setSheet({ title: "Contact support", sub: "Live chat · 7am–10pm daily", body: "Telecheck support answers in English, Twi, or Ga. For anything clinical, we'll route you to your care team instead.", actions: ["Start chat"] })}/>
      <Row icon="phone" tone="info" title="Call support" sub="+233 20 000 0000 · Mon–Sat" onClick={() => setSheet({ title: "Call support", sub: "Mon–Sat · 7am–8pm", rows: [{k:"Main line",v:"+233 20 000 0000"},{k:"Emergency (clinical)",v:"Use red emergency button"},{k:"Typical wait",v:"< 3 minutes"}], actions: ["Dial now"] })}/>
      <Row icon="flag" tone="warn" title="Report a problem" sub="AI error, wrong med, safety issue" onClick={() => setSheet({ title: "Report a problem", sub: "Safety first", body: "If something feels wrong — an AI answer looked unsafe, a medication was dispensed incorrectly, a clinician said something that worried you — tell us. Safety reports are reviewed within 1 hour by a clinical lead.", actions: ["Report an AI error", "Report a medication issue", "Report a clinician interaction", "Something else"] })}/>

      {/* About */}
      <div className="section-h"><span>About</span></div>
      <Row icon="doc" tone="info" title="Terms · Privacy · Ghana" sub="v1.2 · 20 Apr 2026" onClick={() => setSheet({ title: "Terms &amp; Privacy", sub: "Ghana edition · v1.2", body: "Last updated 20 Apr 2026. Covers data residency in Accra, the Ghana Data Protection Act, clinical safety boundaries, and how delegation works under Ghanaian family law.", actions: ["Read full terms", "Read privacy policy", "Data Protection Act compliance"] })}/>
      <Row icon="shield" tone="teal" title="What Telecheck can and can't do" sub="Clinical boundaries · PRD §13" onClick={() => setSheet({ title: "Clinical boundaries", sub: "What we will and won't do", body: "Telecheck provides clinician-reviewed care, AI assistance on top of clinicians (never replacing them for prescribing decisions), and medication safety checks. We do NOT prescribe controlled substances without in-person review, diagnose mental health conditions via AI alone, or provide emergency surgical intervention — for those you need a hospital.", actions: ["Read full boundary doc"] })}/>
      <Row icon="award" tone="iris" title="Telecheck v2026.04" sub="Build 4a2 · Ghana pilot" onClick={() => setSheet({ title: "About Telecheck", sub: "Ghana pilot · v2026.04", rows: [{k:"Build",v:"4a2"},{k:"Released",v:"20 Apr 2026"},{k:"Pilot cohort",v:"Accra, Kumasi, Tema"},{k:"Clinicians",v:"142 verified"},{k:"Pharmacies",v:"38 verified"},{k:"Users",v:"2,840 patients"}], actions: ["Changelog", "Credits"] })}/>

      {sheet && <SettingsDetailSheet item={sheet} onClose={() => setSheet(null)} toast={toast}/>}
    </>
  );
}

function MeCommunity({ toast }) {
  const [evt, setEvt] = uSLM(null);
  const [grp, setGrp] = uSLM(null);
  const events = [
    { date: "24", month: "APR", title: "Living with type-2 · expert Q&A", host: "Nurse Adjoa", time: "18:00", going: "42",
      about: "A 45-minute live session with Nurse Adjoa from Mobipharm Osu, taking your questions on living well with type-2 diabetes in Accra. Recording available for 30 days.",
      need: [{k:"Join via",v:"Telecheck in-app"},{k:"Cost",v:"Free"},{k:"Language",v:"English + Twi interpreter"},{k:"Recorded",v:"Yes · available 30 days"}] },
    { date: "30", month: "APR", title: "Ghana Heart Week · free BP screening", host: "Osu clinic · walk-in", time: "08:00–16:00", going: "218",
      about: "Free blood pressure screening and short consultation. Walk-in only, no booking needed. Results auto-sync to your Telecheck record.",
      need: [{k:"Location",v:"Osu clinic, Oxford St."},{k:"Cost",v:"Free"},{k:"Bring",v:"Ghana ID"},{k:"Duration",v:"~15 minutes"}] },
    { date: "12", month: "MAY", title: "Cooking for diabetes · live kitchen", host: "Chef Selorm", time: "19:00", going: "87",
      about: "A live cooking class with Chef Selorm making waakye, jollof and ampesi variations that fit a diabetic meal plan. Ingredient list sent 48h before.",
      need: [{k:"Join via",v:"Telecheck in-app"},{k:"Cost",v:"GHS 20"},{k:"Duration",v:"90 min"},{k:"Ingredients",v:"Sent 48h before"}] },
  ];
  const groups = {
    t2: { title: "Type-2 Ghana · 1,240 members", sub: "Most active · recipes, evening routines", body: "Ghana's largest Telecheck community for type-2 diabetes. Moderated by Nurse Adjoa. Focus topics rotate weekly — this week: evening carb swaps.", rows: [{k:"Members",v:"1,240"},{k:"Moderator",v:"Nurse Adjoa"},{k:"Active threads",v:"23 this week"},{k:"This week's topic",v:"Evening carb swaps"}], actions: ["Join group", "Read community guidelines"] },
    cg: { title: "Caregivers circle · 380 members", sub: "Support for family caregivers", body: "A space for people caring for a parent, spouse or child with a chronic condition. Judgment-free; moderated by a licensed counselor.", rows: [{k:"Members",v:"380"},{k:"Moderator",v:"Counselor Yaa"},{k:"Focus",v:"Emotional & practical support"}], actions: ["Join group", "Read community guidelines"] },
    pg: { title: "Pregnancy · 2nd trimester", sub: "Weekly milestone threads", body: "Small cohort (your due month ± 2 weeks) for weekly milestone threads, common-concern check-ins, and midwife Q&A.", rows: [{k:"Members",v:"62"},{k:"Moderator",v:"Midwife Akosua"},{k:"Format",v:"Weekly milestone threads"}], actions: ["Join group"] },
  };
  return (
    <>
      <div className="section-h"><span>Events</span></div>
      {events.map((e, i) => (
        <div className="evt" key={i} onClick={() => setEvt(e)} style={{ cursor: "pointer" }}>
          <div className="evt-date"><div className="d">{e.date}</div><div className="m">{e.month}</div></div>
          <div style={{ flex: 1 }}><div className="evt-t">{e.title}</div><div className="evt-s">{e.host} · {e.time} · {e.going} going</div></div>
          <Ic2 n="chev" s={18} c="var(--fg-4)"/>
        </div>
      ))}
      <div className="section-h"><span>Groups</span></div>
      <Row icon="users" tone="teal" title="Type-2 Ghana · 1,240 members" sub="Most active: recipes, evening routines" onClick={() => setGrp(groups.t2)}/>
      <Row icon="users" tone="iris" title="Caregivers circle · 380 members" sub="Support for family caregivers" onClick={() => setGrp(groups.cg)}/>
      <Row icon="users" tone="gold" title="Pregnancy · 2nd trimester" sub="Weekly milestone threads" onClick={() => setGrp(groups.pg)}/>
      <div className="section-h"><span>Expert voices</span></div>
      <Row icon="star" tone="info" title="Dr. Mensah · weekly note" sub="4 posts · last Sat 'Evening routine matters'" onClick={() => setGrp({ title: "Dr. Kwame Mensah", sub: "Your primary clinician · weekly notes", body: "Dr. Mensah posts a short weekly note to his diabetes patients — habits, seasonal considerations, myth-busting. Not medical advice; questions get a separate thread.", rows: [{k:"Latest",v:"'Evening routine matters' · Sat"},{k:"Posts",v:"4 so far in April"},{k:"Followers",v:"142"}], actions: ["Read latest post", "Follow"] })}/>
      {evt && <EventSheet event={evt} onClose={() => setEvt(null)} toast={toast}/>}
      {grp && <SettingsDetailSheet item={grp} onClose={() => setGrp(null)} toast={toast}/>}
    </>
  );
}

Object.assign(window, { PharmacyV2, LabsV2, MeV2 });
