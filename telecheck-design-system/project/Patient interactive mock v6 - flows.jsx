// v2 — global overlays + deep-link flows
const { useState: uSC, useEffect: uEC, useRef: uRC } = React;

// ────────── ACCOUNT SWITCHER ──────────
function AccountSheetV2({ onClose, onPick, delegate }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Who are you caring for?</div>
        <div className="sheet-s">Switch between your own profile and people who delegated care to you. Every action is logged in their record.</div>
        <div className="sheet-body">
          <div className={`acct ${delegate === "me" ? "on" : ""}`} onClick={() => onPick("me")}>
            <div className="acct-av me">AM</div>
            <div><div className="n">Ama Mensah · you</div><div className="r">Diabetes · 3 meds · HbA1c 7.8%</div></div>
            {delegate === "me" && <div className="acct-dot"/>}
          </div>
          <div className={`acct ${delegate === "k" ? "on" : ""}`} onClick={() => onPick("k")}>
            <div className="acct-av k">KO</div>
            <div><div className="n">Kofi Mensah · dad · 68</div><div className="r">Caregiver · 3 scopes · expires 12 Oct</div></div>
            {delegate === "k" && <div className="acct-dot"/>}
          </div>
          <div className="acct">
            <div className="acct-av" style={{ background: "var(--iris-500)", color: "#fff" }}>AB</div>
            <div><div className="n">Abena · daughter · 8</div><div className="r">Full delegate · minor default</div></div>
          </div>
          <div className="acct" onClick={onClose}>
            <div className="acct-av" style={{ background: "var(--n-100)", color: "var(--fg-3)" }}>+</div>
            <div><div className="n">Invite a family member</div><div className="r">By phone number · consent sent via SMS</div></div>
          </div>
        </div>
      </div>
    </>
  );
}

// ────────── NOTIFICATIONS ──────────
function NotifsSheet({ onClose, nav }) {
  const items = [
    { i: "lab", c: "gold", t: "HbA1c result available", s: "Dr. Mensah signed off · 14 Apr 08:12", tm: "09:12", u: true, go: "labs" },
    { i: "pill", c: "warn", t: "Refill in clinician review", s: "Metformin 500 mg · ETA 2h", tm: "09:31", u: true, go: "pharmacy-rx" },
    { i: "spark", c: "iris", t: "Telecheck AI nudge", s: "Evening metformin pattern — want to chat?", tm: "09:08", u: true, go: "ai-ws" },
    { i: "video", c: "teal", t: "Dr. Mensah visit at 10:30", s: "Pre-call check available", tm: "08:50", u: false, go: "visit-prep" },
    { i: "users", c: "info", t: "Kojo shared a BP log", s: "Sunday reading · 142/88", tm: "Sun", u: false, go: "care" },
    { i: "calendar", c: "gold", t: "Community event Thursday", s: "Living with type-2 · Q&A at 18:00", tm: "Mon", u: false, go: "me-community" },
  ];
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Notifications</div>
        <div className="sheet-s">3 unread · pinned shows at top</div>
        <div className="sheet-body" style={{ padding: "0 12px 18px" }}>
          {items.map((n, i) => (
            <div key={i} className={`nt ${n.u ? "unread" : ""}`} onClick={() => { onClose(); nav(n.go); }}>
              <div className={`nt-ic ${n.c}`} style={{ background: `var(--${n.c === "warn" ? "warning" : n.c === "iris" ? "iris" : n.c === "teal" ? "teal" : n.c === "gold" ? "gold" : "info"}-50)`, color: `var(--${n.c === "warn" ? "warning" : n.c === "iris" ? "iris" : n.c === "teal" ? "teal" : n.c === "gold" ? "gold" : "info"}-700)` }}>
                <Ic2 n={n.i} s={15} sw={2}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nt-t">{n.t}</div>
                <div className="nt-s">{n.s}</div>
              </div>
              <div className="nt-tm">{n.tm}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ────────── EMERGENCY ──────────
function EmergencySheet({ onClose, toast }) {
  return (
    <>
      <div className="scrim" style={{ background: "rgba(200,64,47,0.45)" }} onClick={onClose}/>
      <div className="sheet" style={{ background: "linear-gradient(180deg, #fff 0%, #fff2ef 100%)" }}>
        <div className="sheet-handle"/>
        <div className="sheet-t" style={{ color: "var(--danger-700)" }}>Emergency</div>
        <div className="sheet-s">We're with you. Pick one — or do all three.</div>
        <div className="sheet-body" style={{ padding: "0 16px 24px", display: "grid", gap: 10 }}>
          <div className="lc" style={{ background: "var(--danger)", color: "#fff", borderColor: "transparent" }} onClick={() => toast("Dialing 112…")}>
            <div className="lc-ic" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}><Ic2 n="phone" s={18} sw={2}/></div>
            <div><div className="lc-t" style={{ color: "#fff" }}>Call 112 · Ghana emergency</div><div className="lc-s" style={{ color: "rgba(255,255,255,0.85)" }}>Voice call · tap to dial</div></div>
            <Ic2 n="chev" s={18} c="#fff"/>
          </div>
          <Row icon="phone" tone="warn" title="Call Dr. Mensah" sub="Primary · typical answer 3 min" onClick={() => toast("Calling Dr. Mensah…")}/>
          <Row icon="globe" tone="info" title="Share live location" sub="With Dr. Mensah, Kojo, Adjoa" onClick={() => toast("Sharing location…")}/>
          <Row icon="doc" tone="teal" title="Show emergency card" sub="O+ · diabetes · penicillin allergy · contact Kojo" onClick={() => toast("Emergency card")}/>
          <Row icon="pill" tone="iris" title="Bystander instructions" sub="For the person helping you right now" onClick={() => toast("Opening…")}/>
        </div>
      </div>
    </>
  );
}

// ────────── AI WORKSPACE ──────────
function AIWorkspace({ nav, toast, goBack }) {
  const [msgs, setMsgs] = uSC([
    { r: "ai", t: "Hi Ama — I'm Telecheck AI. I can explain labs, suggest questions for Dr. Mensah, and watch for patterns. I can't diagnose or prescribe. What would you like to talk about?" },
    { r: "sug", opts: ["Why did my HbA1c go up?", "Is 132 mg/dL dangerous?", "Summarize my week"] },
  ]);
  const [draft, setDraft] = uSC("");
  const endRef = uRC(null);
  uEC(() => { endRef.current?.scrollIntoView?.({ block: "end" }); }, [msgs]);

  const send = (text) => {
    if (!text.trim()) return;
    const next = [...msgs.filter(m => m.r !== "sug"), { r: "me", t: text }];
    setMsgs(next);
    setDraft("");
    setTimeout(() => {
      setMsgs(m => [...m, {
        r: "ai",
        t: "Your HbA1c ticked up 0.2 over 4 months. Three missed evening doses in March line up with the rise. Short answer: a consistent 19:00 metformin for 6 weeks usually re-settles it before your next check.",
        src: "Looked at: your last 6 HbA1c · medication logs · Mar pattern",
      }]);
      setTimeout(() => setMsgs(m => [...m, { r: "sug", opts: ["Set 19:00 reminder", "Tell Dr. Mensah", "What about diet?"] }]), 400);
    }, 700);
  };

  return (
    <div className="app ai-ws">
      <SB2/>
      <div className="ai-ws-hdr">
        <button className="ic-btn" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: 0 }} onClick={goBack}><Ic2 n="back" s={18} c="#fff"/></button>
        <div className="av"><Ic2 n="spark" s={20} sw={2.2} c="#fff"/></div>
        <div style={{ flex: 1 }}>
          <div className="t">Telecheck AI</div>
          <div className="s">Interpretation only · human review required · no diagnosis, no prescribing</div>
        </div>
        <button className="ic-btn" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: 0 }} onClick={() => toast("Voice mode")}><Ic2 n="mic" s={16} c="#fff"/></button>
      </div>
      <div className="ai-ws-qa">
        {["Explain HbA1c","Compare my labs","Questions for doctor","Meal idea","Medication safety","Summarize visit"].map(x => <span key={x} onClick={() => send(x)}>{x}</span>)}
      </div>
      <div className="scroll" style={{ padding: 14, flex: 1, background: "var(--n-25)" }}>
        {msgs.map((m, i) => {
          if (m.r === "sug") {
            return <div key={i} style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 10px" }}>
              {m.opts.map(o => <button key={o} onClick={() => send(o)} style={{ fontSize: 12, padding: "7px 11px", borderRadius: 9999, background: "#fff", border: "1px solid var(--border-strong)", color: "var(--iris-700)", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>{o}</button>)}
            </div>;
          }
          return (
            <div key={i} style={{ display: "flex", justifyContent: m.r === "me" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{
                maxWidth: "82%",
                padding: "10px 13px",
                borderRadius: 14,
                background: m.r === "me" ? "var(--teal-500)" : "#fff",
                color: m.r === "me" ? "#fff" : "var(--fg-1)",
                fontSize: 13.5, lineHeight: 1.5,
                border: m.r === "me" ? 0 : "1px solid var(--border-subtle)",
              }}>
                {m.t}
                {m.src && <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 8, fontStyle: "italic" }}>{m.src}</div>}
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>
      <div style={{ padding: 12, background: "#fff", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8, alignItems: "center" }}>
        <button className="ic-btn" onClick={() => toast("Attach lab / photo")}><Ic2 n="plus" s={18}/></button>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send(draft)} placeholder="Ask about your health…" style={{ flex: 1, padding: "10px 14px", background: "var(--n-50)", border: 0, borderRadius: 9999, fontSize: 13.5, fontFamily: "var(--font-sans)" }}/>
        <button className="ic-btn" style={{ background: "var(--iris-500)", color: "#fff", border: 0 }} onClick={() => send(draft)}><Ic2 n="send" s={16} c="#fff"/></button>
      </div>
    </div>
  );
}

// ────────── VISIT PREP ──────────
function VisitPrep({ nav, toast }) {
  const [ck, setCk] = uSC({ cam: false, mic: false, net: true });
  uEC(() => { const t = setTimeout(() => setCk({ cam: true, mic: true, net: true }), 900); return () => clearTimeout(t); }, []);
  const allOk = ck.cam && ck.mic && ck.net;
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Video visit · prep" onBack={() => nav("care")}/>
      <div className="scroll">
        <div className="content">
          <div className="live-visit">
            <div className="lv-row">
              <div className="lv-av">AM</div>
              <div style={{ flex: 1 }}>
                <div className="lv-t">Dr. Akosua Mensah</div>
                <div className="lv-s">10:30 · 15-min follow-up · GHS 120</div>
              </div>
            </div>
          </div>
          <div className="section-h"><span>Device check</span></div>
          <div className="dv-ck">
            <div className={`dv-ic ${ck.cam ? "" : "warn"}`}><Ic2 n={ck.cam ? "check" : "camera"} s={18} sw={2.2}/></div>
            <div style={{ flex: 1 }}><div className="dv-t">Camera</div><div className="dv-s">{ck.cam ? "Working · front camera" : "Checking…"}</div></div>
          </div>
          <div className="dv-ck">
            <div className={`dv-ic ${ck.mic ? "" : "warn"}`}><Ic2 n={ck.mic ? "check" : "mic"} s={18} sw={2.2}/></div>
            <div style={{ flex: 1 }}><div className="dv-t">Microphone</div><div className="dv-s">{ck.mic ? "Clear · -18 dB noise floor" : "Checking…"}</div></div>
          </div>
          <div className="dv-ck">
            <div className="dv-ic"><Ic2 n="check" s={18} sw={2.2}/></div>
            <div style={{ flex: 1 }}><div className="dv-t">Connection</div><div className="dv-s">MTN 4G · 12 Mbps · good for video</div></div>
          </div>
          <div className="section-h"><span>Intake — Telecheck AI drafted</span></div>
          <AIcard tone="lab" tag="AI INTAKE · REVIEW BEFORE SENDING"
            title="Here's what I'll share with Dr. Mensah"
            body="Last HbA1c 7.8% (+0.2). Fasting glucose 7-day avg 122. 3 missed evening doses in past 30 days. Sleep averaging 6h40. Topics to cover: metformin timing, LDL recheck."
            src="Compiled from your labs · meds · track data"
            actions={["Edit before send", "Looks right"]}
            onAct={() => toast("Sent to Dr. Mensah")}/>
          <div className="section-h"><span>Questions I want to ask</span></div>
          {["Why is my HbA1c creeping up?","Should I change metformin dose?","Is 142 LDL worth treating now?"].map((q, i) => (
            <Row key={i} icon="chat" tone="iris" title={q} onClick={() => toast("Added to visit notes")}/>
          ))}
          <button className={`cta ${allOk ? "" : "g"}`} style={{ width: "100%", margin: 0 }} disabled={!allOk} onClick={() => nav("video")}>
            {allOk ? "Join visit now" : "Running checks…"}
          </button>
          <button className="cta g" onClick={() => toast("Joining audio only")}>Join with audio only</button>
        </div>
      </div>
    </div>
  );
}

// ────────── VIDEO CALL ──────────
function VideoCall({ nav, toast }) {
  const [sec, setSec] = uSC(0);
  const [mut, setMut] = uSC(false);
  const [cam, setCam] = uSC(true);
  uEC(() => { const i = setInterval(() => setSec(s => s + 1), 1000); return () => clearInterval(i); }, []);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0"), ss = String(sec % 60).padStart(2, "0");
  return (
    <div className="app" style={{ background: "#0a0d0c" }}>
      <SB2/>
      <div className="vc">
        <div className="vc-main">
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(160deg, #3a8475, #1a5950)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 700, color: "#fff", border: "3px solid rgba(255,255,255,0.2)" }}>DM</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 14 }}>Dr. Akosua Mensah</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Speaking · camera off</div>
          </div>
          <div className="vc-timer"><span className="p"/>REC · {mm}:{ss}</div>
          <div className="vc-self">
            {!cam && <div style={{ position: "absolute", inset: 0, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, borderRadius: 12 }}>AM</div>}
          </div>
          <div className="vc-name">You</div>
          <div className="vc-transcript">
            <span className="w">LIVE TRANSCRIPT · TWI + ENGLISH</span>
            "…so your A1c came back at 7.8, which is a little higher than where we want to be. Let's talk about your evening routine — that's where I think the gap is."
          </div>
        </div>
        <div className="vc-bar">
          <div className="vc-btn" onClick={() => setMut(!mut)}><Ic2 n={mut ? "mute" : "mic"} s={20} c="#fff"/></div>
          <div className="vc-btn" onClick={() => setCam(!cam)}><Ic2 n={cam ? "video" : "camoff"} s={20} c="#fff"/></div>
          <div className="vc-btn" onClick={() => toast("Showing labs on shared screen")}><Ic2 n="doc" s={20} c="#fff"/></div>
          <div className="vc-btn" onClick={() => toast("AI caption: on")}><Ic2 n="spark" s={20} c="#fff"/></div>
          <div className="vc-btn end" onClick={() => nav("visit-summary")}><Ic2 n="phone" s={20} c="#fff"/></div>
        </div>
      </div>
    </div>
  );
}

// ────────── VISIT SUMMARY ──────────
function VisitSummary({ nav, toast }) {
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Visit summary" onBack={() => nav("care")}/>
      <div className="scroll">
        <div className="content">
          <div className="v2-hero" style={{ margin: "0 -16px", padding: "14px 18px 18px" }}>
            <div className="sub-lbl">20 APR · 10:30–10:46 · DR. MENSAH</div>
            <h1 style={{ marginTop: 4, fontSize: 24 }}>Follow-up · diabetes</h1>
          </div>
          <AIcard tone="lab" tag="AI SUMMARY · APPROVED BY DR. MENSAH"
            title="Plan for the next 6 weeks"
            body="Keep metformin 500 mg BID. Add a consistent 19:00 evening dose reminder. Recheck HbA1c in 6 weeks. Lab draw Thursday 08:00. If fasting glucose stays above 140 for 5 days, message Dr. Mensah."
            src="Signed 10:46 · Dr. Akosua Mensah"
            actions={["Save to records","Share with Kojo"]}
            onAct={() => toast("Shared")}/>
          <div className="section-h"><span>Action items</span></div>
          <Row icon="pill" tone="teal" title="Evening metformin reminder · 19:00" sub="Starts tonight · 6 weeks" pill={{label:"DONE", tone:"ok"}} onClick={() => {}}/>
          <Row icon="lab" tone="gold" title="Home lab draw Thursday 08:00" sub="HbA1c + kidney panel · booked" pill={{label:"BOOKED", tone:"ok"}} onClick={() => {}}/>
          <Row icon="doc" tone="info" title="Prescription updated" sub="Metformin 500 mg BID · sent to Mobipharm" onClick={() => nav("pharmacy-rx")}/>
          <div className="section-h"><span>Transcript</span></div>
          <Row icon="doc" tone="iris" title="Full transcript · 16 min" sub="Twi + English · redacted on request" onClick={() => toast("Transcript")}/>
          <Row icon="video" tone="info" title="Recording · 16 min" sub="Expires 20 May · your choice to keep" onClick={() => toast("Recording")}/>
          <div className="section-h"><span>After-visit</span></div>
          <Row icon="card" tone="info" title="Billed · GHS 120" sub="MTN MoMo · charged 10:46 · receipt" onClick={() => toast("Receipt")}/>
          <Row icon="star" tone="gold" title="Rate this visit" sub="Help Dr. Mensah and Telecheck" onClick={() => toast("Thanks!")}/>
        </div>
      </div>
      <TabBar2 active="care" onTab={nav} care={2}/>
    </div>
  );
}

// ────────── DOCTOR SEARCH ──────────
function DoctorSearch({ nav, toast }) {
  const docs = [
    { i: "AO", n: "Dr. Afua Owusu", sp: "Cardiology · Accra", r: "4.8", slots: ["Today 14:00","16:00","Tomorrow 09:30"] },
    { i: "SB", n: "Dr. Samuel Boateng", sp: "Endocrinology · Kumasi", r: "4.9", slots: ["Tomorrow 11:00","13:00"] },
    { i: "NA", n: "Nurse Adjoa Boateng", sp: "Diabetes coach · async", r: "4.9", slots: ["Today async","Tomorrow async"] },
  ];
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Find care" onBack={() => nav("care")} right={<button className="ic-btn"><Ic2 n="filter" s={18}/></button>}/>
      <div className="scroll">
        <div className="content">
          <div style={{ position: "relative" }}>
            <input placeholder="Search by condition, name or specialty" style={{ width: "100%", padding: "11px 14px 11px 38px", background: "var(--n-50)", border: 0, borderRadius: 12, fontSize: 13.5, fontFamily: "var(--font-sans)" }}/>
            <div style={{ position: "absolute", left: 12, top: 10 }}><Ic2 n="search" s={18} c="var(--fg-3)"/></div>
          </div>
          <SubTabs tabs={["All","Video","In-person","Async","Home visit"]} active="All" onPick={() => {}}/>
          {docs.map((d, i) => (
            <div key={i} className="doc-c" onClick={() => toast(`Booking ${d.n}`)}>
              <div className="doc-row">
                <div className="doc-av">{d.i}</div>
                <div style={{ flex: 1 }}>
                  <div className="doc-n">{d.n}</div>
                  <div className="doc-sp">{d.sp}</div>
                  <div className="doc-star"><Ic2 n="star" s={12} c="var(--gold-500)"/>{d.r} · 240 visits</div>
                </div>
                <div className="doc-pill">Available</div>
              </div>
              <div className="doc-slot">{d.slots.map(s => <span key={s}>{s}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────── PHARMACY RX DETAIL ──────────
function PharmacyRx({ nav, toast }) {
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Metformin 500 mg" onBack={() => nav("pharmacy")}/>
      <div className="scroll">
        <div className="content">
          <div className="v2-hero" style={{ margin: "0 -16px", padding: "14px 18px 18px", background: "linear-gradient(160deg, var(--warning-50), #fff)" }}>
            <div className="sub-lbl" style={{ color: "var(--warning-700)" }}>IN CLINICIAN REVIEW · ETA 2H</div>
            <h1 style={{ marginTop: 4, fontSize: 22 }}>Metformin 500 mg · refill</h1>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 6 }}>60 tablets · BID with meals · Dr. Mensah</div>
          </div>
          <div className="section-h"><span>Status</span></div>
          <div className="steps">
            <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Request sent</div><div className="st-s">You · 09:28</div></div><div className="tm">09:28</div></div>
            <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Interaction sweep</div><div className="st-s">Clear · 3 meds checked</div></div><div className="tm">09:31</div></div>
            <div className="step now"><div className="b"/><div className="ln"/><div><div className="st-t">Clinician review</div><div className="st-s">Dr. Mensah · ETA 2h</div></div><div className="tm">now</div></div>
            <div className="step pending"><div className="b"/><div className="ln"/><div><div className="st-t">Dispensed</div><div className="st-s">Mobipharm Osu</div></div><div className="tm">—</div></div>
            <div className="step pending"><div className="b"/><div><div className="st-t">Delivered</div><div className="st-s">Osu · 22 Apr 10–14</div></div><div className="tm">—</div></div>
          </div>
          <AIcard tone="inter" tag="AI SAFETY CHECK · CLEARED"
            title="No interactions with your other meds or labs"
            body="Checked against lisinopril, paracetamol · eGFR 94 · ALT 22. Continue as prescribed."
            src="Sweep today 09:31"/>
          <div className="section-h"><span>About this medicine</span></div>
          <Row icon="doc" tone="iris" title="Plain-language leaflet" sub="Why you take it · side effects · Twi + English" onClick={() => toast("Leaflet")}/>
          <Row icon="shield" tone="teal" title="Verify the pack" sub="Scan the barcode on delivery" onClick={() => toast("Coming in v1.5")}/>
          <Row icon="users" tone="info" title="Taken by 2,400 people in Ghana" sub="92% adherence · community tips" onClick={() => toast("Community")}/>
        </div>
      </div>
    </div>
  );
}

// ────────── SCAN FLOW ──────────
function ScanStartV2({ nav }) {
  return (
    <div className="app" style={{ background: "#0a0d0c" }}>
      <SB2/>
      <Sub2 title="Scan" onBack={() => nav("home")} right={<button className="ic-btn" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: 0 }}><Ic2 n="more" s={18} c="#fff"/></button>}/>
      <div style={{ flex: 1, background: "radial-gradient(circle, #2a2a2a, #0a0d0c 70%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 240, height: 240, borderRadius: 20, border: "2px solid rgba(255,255,255,0.6)", position: "relative" }}>
          <div style={{ position: "absolute", top: -1, left: -1, width: 26, height: 26, borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderTopLeftRadius: 20 }}/>
          <div style={{ position: "absolute", top: -1, right: -1, width: 26, height: 26, borderTop: "3px solid #fff", borderRight: "3px solid #fff", borderTopRightRadius: 20 }}/>
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 26, height: 26, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff", borderBottomLeftRadius: 20 }}/>
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 26, height: 26, borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderBottomRightRadius: 20 }}/>
        </div>
        <div style={{ position: "absolute", bottom: 120, left: 20, right: 20, textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Point at a meal, medicine pack or barcode</div>
          <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 6 }}>Telecheck AI will estimate nutrition or verify the medicine.</div>
        </div>
      </div>
      <div style={{ padding: "18px 20px 36px", background: "#0a0d0c", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        <SubTabs tabs={["Meal","Medicine","Barcode","Lab report"]} active="Meal" onPick={() => {}}/>
      </div>
      <div style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", width: 66, height: 66, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.4)", cursor: "pointer" }} onClick={() => nav("scan-result")}/>
    </div>
  );
}

function ScanResultV2({ nav, toast }) {
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Meal detected" onBack={() => nav("home")}/>
      <div className="scroll">
        <div className="content">
          <div style={{ aspectRatio: "4/3", borderRadius: 14, background: "linear-gradient(160deg, #d97706, #92400e)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 35% 40%, #fbbf24 0 15%, transparent 16%), radial-gradient(circle at 60% 60%, #dc2626 0 18%, transparent 19%)" }}/>
            <div style={{ position: "absolute", bottom: 12, left: 14, color: "#fff", fontSize: 14, fontWeight: 700, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>Jollof rice + chicken</div>
          </div>
          <AIcard tone="lab" tag="AI ESTIMATE · 96% CONFIDENCE"
            title="~640 calories · 68g carbs · 32g protein"
            body="Portion looks standard. For your diabetes target, this fits best at lunch, not dinner. A smaller portion after 18:00 keeps fasting glucose in range."
            src="USDA + regional portion dataset"
            actions={["Log to today", "Adjust portion"]}
            onAct={(a) => a.startsWith("Log") ? (toast("Logged · 13:40"), nav("care")) : toast("Adjust")}/>
          <div className="section-h"><span>Macros</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[["Carbs","68g","#c28320"],["Protein","32g","#2b6cb0"],["Fat","22g","#2a8a4a"]].map(([l,v,c]) => (
              <div key={l} style={{ padding: 12, background: "var(--surface-1)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 10.5, color: "var(--fg-3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
          <Row icon="heart" tone="iris" title="Check impact on my glucose" sub="Based on your last 30 days' response to similar meals" onClick={() => toast("Expected +45 mg/dL at 2h")}/>
        </div>
      </div>
    </div>
  );
}

// ────────── RPM check-in ──────────
function RPMCheckin({ nav, toast }) {
  const [step, setStep] = uSC(0);
  const qs = [
    { q: "How have you felt this week?", opts: ["Great","OK","Not great"] },
    { q: "Any missed doses?", opts: ["None","1–2","3 or more"] },
    { q: "Fasting glucose this morning?", opts: ["<120","120–140",">140"] },
  ];
  if (step >= qs.length) {
    return (
      <div className="app">
        <SB2/>
        <Sub2 title="Week 12 check-in" onBack={() => nav("care")}/>
        <div className="scroll">
          <div className="content" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px", background: "var(--success-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic2 n="check" s={32} sw={2.4} c="#fff"/></div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Thanks, Ama.</div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 8, lineHeight: 1.5 }}>Dr. Mensah sees this before your visit. If anything changes before then, you can send an update anytime.</div>
            <button className="cta" style={{ marginTop: 20 }} onClick={() => nav("care")}>Back to Care</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="app">
      <SB2/>
      <Sub2 title={`Week 12 · ${step + 1} of ${qs.length}`} onBack={() => step > 0 ? setStep(step - 1) : nav("care")}/>
      <div className="scroll">
        <div className="content">
          <div className="prog-bar"><div className="prog-bar-f" style={{ width: `${((step + 1) / qs.length) * 100}%` }}/></div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em", marginTop: 20 }}>{qs[step].q}</div>
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            {qs[step].opts.map(o => (
              <button key={o} className="cta g" style={{ textAlign: "left", padding: 16, fontSize: 14 }} onClick={() => setStep(step + 1)}>{o}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────── FAB MENU ──────────
function FabMenu({ onClose, nav }) {
  const items = [
    { i: "video", c: "teal", t: "Start a visit", s: "Video, phone or async", go: "doctor-search" },
    { i: "scan", c: "gold", t: "Scan a meal", s: "AI nutrition estimate", go: "scan-start" },
    { i: "camera", c: "iris", t: "Log a vital", s: "BP, glucose, weight", go: "care" },
    { i: "upload", c: "info", t: "Upload a lab", s: "PDF or photo", go: "labs-upload" },
    { i: "pill", c: "warn", t: "Log a dose", s: "Now or earlier", go: "pharmacy" },
    { i: "spark", c: "iris", t: "Ask Telecheck AI", s: "Any health question", go: "ai-ws" },
  ];
  return (
    <>
      <div className="fab-menu-scrim" onClick={onClose}/>
      <div className="fab-menu">
        {items.map((it, i) => (
          <div key={i} className="fab-m-i" onClick={() => { onClose(); nav(it.go); }}>
            <div className="ic" style={{ background: `var(--${it.c === "warn" ? "warning" : it.c === "iris" ? "iris" : it.c === "teal" ? "teal" : it.c === "gold" ? "gold" : "info"}-50)`, color: `var(--${it.c === "warn" ? "warning" : it.c === "iris" ? "iris" : it.c === "teal" ? "teal" : it.c === "gold" ? "gold" : "info"}-700)` }}>
              <Ic2 n={it.i} s={18} sw={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div className="t">{it.t}</div>
              <div className="s">{it.s}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { AccountSheetV2, NotifsSheet, EmergencySheet, AIWorkspace, VisitPrep, VideoCall, VisitSummary, DoctorSearch, PharmacyRx, ScanStartV2, ScanResultV2, RPMCheckin, FabMenu });
