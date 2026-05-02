// Patient app v3 — screens

const { useState: uS3, useEffect: uE3 } = React;

// ── HOME ──────────────────────────────────────────
function HomeV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <TopBar onAI={() => nav("ai")}/>
        <div className="hero">
          <div className="lbl">Monday, 20 April</div>
          <h1>Good morning, Ama. Your numbers are <em>mostly steady</em>.</h1>
          <div className="sub">One reminder for tonight, and a call with Dr. Mensah at 10:30.</div>
        </div>

        <div className="action" onClick={() => nav("visit")}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="when"><span className="d"/>IN 49 MINUTES</div>
            <div className="t">Dr. Akosua Mensah · video follow-up</div>
            <div className="s">HbA1c discussion · 15 min</div>
          </div>
          <div className="go"><I n="arrow" s={16} sw={2}/></div>
        </div>

        <div className="sect"><div className="t">This week</div><span className="link" onClick={() => nav("labs")}>All labs</span></div>
        <div className="metrics">
          <div className="mt" onClick={() => nav("labs")}>
            <div className="mt-k">HbA1c</div>
            <div className="mt-row"><div className="mt-v">7.8</div><div className="mt-u">%</div></div>
            <div className="mt-d warn">+0.2 vs last</div>
            <div className="mt-spark"><Spark data={[7.2, 7.3, 7.4, 7.4, 7.6, 7.8]} color="#c26a00"/></div>
          </div>
          <div className="mt" onClick={() => nav("labs")}>
            <div className="mt-k">Fasting glucose</div>
            <div className="mt-row"><div className="mt-v">132</div><div className="mt-u">mg/dL</div></div>
            <div className="mt-d warn">above target</div>
            <div className="mt-spark"><Spark data={[118, 124, 128, 122, 130, 132]} color="#c26a00"/></div>
          </div>
          <div className="mt" onClick={() => nav("labs")}>
            <div className="mt-k">Blood pressure</div>
            <div className="mt-row"><div className="mt-v">124</div><div className="mt-u">/ 78</div></div>
            <div className="mt-d ok">in range</div>
            <div className="mt-spark"><Spark data={[122, 126, 124, 120, 125, 124]}/></div>
          </div>
          <div className="mt" onClick={() => nav("labs")}>
            <div className="mt-k">Resting HR</div>
            <div className="mt-row"><div className="mt-v">68</div><div className="mt-u">bpm</div></div>
            <div className="mt-d ok">steady</div>
            <div className="mt-spark"><Spark data={[72, 70, 68, 69, 67, 68]}/></div>
          </div>
        </div>

        <div className="ai-whisper">
          <div className="ic"><I n="spark" s={12} sw={2} c="currentColor"/></div>
          <div style={{ flex: 1 }}>
            <div className="t">Your HbA1c ticked up 0.2 — likely tied to <em>three missed evening doses</em> in March. A steady 19:00 reminder usually re-settles it.</div>
            <div className="acts">
              <a onClick={() => toast("Reminder set · 19:00")}>Set 19:00 reminder</a>
              <a className="sec" onClick={() => nav("ai")}>Ask follow-up</a>
            </div>
          </div>
        </div>

        <div className="sect"><div className="t">Today</div></div>
        <div className="tl">
          <div className="tl-r" onClick={() => toast("Marked taken")}>
            <div className="tl-tm">19:00</div>
            <div className="tl-body">
              <div className="tl-t">Metformin · 500 mg</div>
              <div className="tl-s">Evening dose, with food</div>
              <span className="tl-tag neutral">Reminder</span>
            </div>
            <div className="chev"><I n="chev" s={16} sw={1.8}/></div>
          </div>
          <div className="tl-r" onClick={() => nav("care")}>
            <div className="tl-tm">Any</div>
            <div className="tl-body">
              <div className="tl-t">Weekly diabetes check-in</div>
              <div className="tl-s">3 questions · 90 seconds</div>
              <span className="tl-tag warn">Due today</span>
            </div>
            <div className="chev"><I n="chev" s={16} sw={1.8}/></div>
          </div>
        </div>

        <div className="sect"><div className="t">Your program</div></div>
        <div className="prog" onClick={() => nav("care")}>
          <div className="prog-h">
            <div className="prog-t">Diabetes RPM · Dr. Mensah</div>
            <div className="prog-w">WEEK 12 / 26</div>
          </div>
          <div className="prog-s">Adherence 92% · re-check in 6 weeks</div>
          <div className="prog-bar"><div className="prog-fill" style={{ width: "46%" }}/></div>
        </div>

        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="home" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── CARE ──────────────────────────────────────────
function CareV3({ nav, toast }) {
  const [sub, setSub] = uS3("Timeline");
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <TopBar onAI={() => nav("ai")}/>
        <div className="hero">
          <div className="lbl">Care</div>
          <h1>Your plan, visits <em>and team</em>.</h1>
          <div className="sub">Dr. Mensah replies within the hour. Nurse Adjoa is on async support.</div>
        </div>

        <div className="mini-lbl">Current plan</div>
        <div className="plan-card" onClick={() => toast("Care plan details")}>
          <div className="pc-body">
            <div className="pc-t">Diabetes RPM Program</div>
            <div className="pc-s">Glucose management · started 18 Jan 2025 · week 12 / 26</div>
          </div>
          <span className="pc-badge">Active</span>
        </div>

        <SubTabs items={["Timeline","Care team"]} active={sub} onPick={setSub}/>

        {sub === "Timeline" && <>
          <div className="ev">
            <div className="ev-r" onClick={() => nav("visit")}>
              <div className="ev-ic teal"><I n="phone" s={17} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Consultation</div>
                <div className="ev-d">20 Apr · 10:30</div>
                <div className="ev-s">Dr. Akosua Mensah · video follow-up</div>
              </div>
              <span className="ev-tag ok">Upcoming</span>
            </div>

            <div className="ev-r" onClick={() => toast("Home lab draw · Thu 24 Apr")}>
              <div className="ev-ic"><I n="lab" s={18} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Lab draw</div>
                <div className="ev-d">24 Apr · 08:00</div>
                <div className="ev-s">HbA1c + kidney panel · home visit</div>
              </div>
              <span className="ev-tag neutral">Booked</span>
            </div>

            <div className="ev-r" onClick={() => nav("pharmacy-rx")}>
              <div className="ev-ic"><I n="pill" s={18} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Prescription</div>
                <div className="ev-d">14 Apr</div>
                <div className="ev-s">Metformin 500 mg · 2× daily</div>
              </div>
              <span className="ev-tag ok">Dispensed</span>
            </div>

            <div className="ev-r" onClick={() => toast("Visit notes · 14 Apr")}>
              <div className="ev-ic"><I n="phone" s={17} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Consultation</div>
                <div className="ev-d">14 Apr · 10:15</div>
                <div className="ev-s">Dr. Mensah · quarterly review</div>
              </div>
              <span className="ev-tag done">Completed</span>
            </div>

            <div className="ev-r" onClick={() => nav("labs-detail")}>
              <div className="ev-ic"><I n="lab" s={18} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Lab results</div>
                <div className="ev-d">14 Apr · 08:30</div>
                <div className="ev-s">HbA1c, BP, lipid panel · 8 values</div>
              </div>
              <span className="ev-tag done">Completed</span>
            </div>

            <div className="ev-r" onClick={() => toast("Intake form · 15 Mar")}>
              <div className="ev-ic"><I n="doc" s={18} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Intake submitted</div>
                <div className="ev-d">15 Mar</div>
                <div className="ev-s">Monthly check-in · 12 questions</div>
              </div>
              <span className="ev-tag done">Completed</span>
            </div>

            <div className="ev-r" onClick={() => toast("Nurse note · 02 Mar")}>
              <div className="ev-ic"><I n="chat" s={18} sw={1.7}/></div>
              <div className="ev-body">
                <div className="ev-t">Nurse note</div>
                <div className="ev-d">02 Mar</div>
                <div className="ev-s">Adjoa Boateng · diet check-in</div>
              </div>
              <span className="ev-tag done">Completed</span>
            </div>
          </div>

          <div className="ai-whisper">
            <div className="ic"><I n="spark" s={12} sw={2}/></div>
            <div style={{ flex: 1 }}>
              <div className="t">Your <em>HbA1c re-check</em> is 10 weeks away. Dr. Mensah usually adjusts dosing once a 0.3% shift is confirmed.</div>
              <div className="acts">
                <a onClick={() => toast("Added reminder")}>Remind me</a>
                <a className="sec" onClick={() => nav("ai")}>Explain</a>
              </div>
            </div>
          </div>

          <button className="cta-primary" onClick={() => toast("Opening care plan…")}>View care plan</button>
          <button className="cta-ghost" onClick={() => nav("care-messages")}>Message your team</button>
        </>}

        {sub === "Care team" && <>
          <div style={{ height: 8 }}/>
          <div className="team-card" onClick={() => nav("care-team")}>
            <div className="team-av">AM</div>
            <div className="team-body">
              <div className="team-n">Dr. Akosua Mensah</div>
              <div className="team-r">Endocrinology · primary clinician</div>
              <div className="team-meta">Replies &lt; 1h · on video today 10:30</div>
            </div>
            <div className="chev"><I n="chev" s={16} sw={1.8}/></div>
          </div>
          <div className="team-card" onClick={() => nav("care-team")}>
            <div className="team-av">AB</div>
            <div className="team-body">
              <div className="team-n">Nurse Adjoa Boateng</div>
              <div className="team-r">Diabetes coach · async support</div>
              <div className="team-meta">Last message · Sun 11:14</div>
            </div>
            <div className="chev"><I n="chev" s={16} sw={1.8}/></div>
          </div>
          <div className="team-card" onClick={() => nav("care-team")}>
            <div className="team-av">KO</div>
            <div className="team-body">
              <div className="team-n">Dr. Kwame Owusu</div>
              <div className="team-r">General practice · referrals</div>
              <div className="team-meta">Ad-hoc · replies within a day</div>
            </div>
            <div className="chev"><I n="chev" s={16} sw={1.8}/></div>
          </div>
          <div className="team-card" onClick={() => nav("care-team")}>
            <div className="team-av">KM</div>
            <div className="team-body">
              <div className="team-n">Kojo Mensah</div>
              <div className="team-r">Family delegate · brother</div>
              <div className="team-meta">3 scopes shared</div>
            </div>
            <div className="chev"><I n="chev" s={16} sw={1.8}/></div>
          </div>

          <button className="cta-ghost" onClick={() => toast("Invite a provider…")} style={{ marginTop: 14 }}>+ Invite a provider</button>
        </>}

        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="care" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── LABS ──────────────────────────────────────────
function LabsV3({ nav, toast }) {
  const [sub, setSub] = uS3("Summary");
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <TopBar onAI={() => nav("ai")}/>
        <div className="hero">
          <div className="lbl">Labs</div>
          <h1>HbA1c is <em>7.8%</em>.</h1>
          <div className="sub">Slightly above your 7.0% target. Dr. Mensah signed these off 14 April.</div>
        </div>
        <SubTabs items={["Summary","Results","Trends","Orders"]} active={sub} onPick={setSub}/>

        {sub === "Summary" && <>
          <div className="donut-wrap">
            <Donut pct={78} color="#c26a00" value="7.8" unit="PERCENT"/>
            <div className="txt">
              <div className="k">HbA1c target ≤ 7.0%</div>
              <div className="t">Trending up — <em>gently</em>.</div>
              <div className="s">Up 0.2 since January. Most patients in your program re-settle within 6 weeks of a steady evening routine.</div>
            </div>
          </div>
          <div className="ai-whisper">
            <div className="ic"><I n="spark" s={12} sw={2}/></div>
            <div style={{ flex: 1 }}>
              <div className="t"><em>Haemoglobin</em> slipped below your range. Often tied to iron — worth asking Dr. Mensah about today.</div>
              <div className="acts">
                <a onClick={() => toast("Added to visit notes")}>Add to visit</a>
                <a className="sec" onClick={() => nav("ai")}>Explain</a>
              </div>
            </div>
          </div>
        </>}

        {sub === "Results" && <>
          <div className="sect"><div className="t">All results · 14 April</div><span className="link" onClick={() => toast("Exporting PDF…")}>Export</span></div>
          <div>
            {[
              ["HbA1c", "7.8 %", "High", "warn"],
              ["Fasting glucose", "132 mg/dL", "High", "warn"],
              ["eGFR", "94 mL/min", "Normal", "ok"],
              ["LDL cholesterol", "118 mg/dL", "In range", "ok"],
              ["Haemoglobin", "11.2 g/dL", "Low", "warn"],
              ["ALT", "22 U/L", "Normal", "ok"],
              ["TSH", "2.1 mIU/L", "Normal", "ok"],
              ["Urine ACR", "18 mg/g", "Normal", "ok"],
            ].map((r, i) => (
              <div key={i} className="row" onClick={() => nav("labs-detail")}>
                <div className="row-body">
                  <div className="row-t">{r[0]}</div>
                  <div className="row-s">{r[1]}</div>
                </div>
                <span className={`tl-tag ${r[3]}`}>{r[2]}</span>
                <div className="chev" style={{ marginLeft: 10 }}><I n="chev" s={16}/></div>
              </div>
            ))}
          </div>
        </>}

        {sub === "Trends" && <>
          <div className="sect"><div className="t">HbA1c · 12 months</div></div>
          <div style={{ padding: "0 24px" }}><Spark data={[7.2, 7.1, 7.2, 7.3, 7.3, 7.4, 7.4, 7.5, 7.6, 7.6, 7.7, 7.8]} color="#c26a00"/></div>
          <div className="sect"><div className="t">Fasting glucose</div></div>
          <div style={{ padding: "0 24px" }}><Spark data={[110, 118, 122, 120, 124, 126, 128, 122, 130, 132]} color="#c26a00"/></div>
          <div className="sect"><div className="t">Blood pressure · systolic</div></div>
          <div style={{ padding: "0 24px" }}><Spark data={[128, 126, 124, 122, 124, 122, 120, 125, 124]}/></div>
          <div className="sect"><div className="t">Resting heart rate</div></div>
          <div style={{ padding: "0 24px" }}><Spark data={[72, 70, 68, 69, 67, 68, 70, 68]}/></div>
        </>}

        {sub === "Orders" && <>
          <div className="sect"><div className="t">Scheduled</div><span className="link" onClick={() => toast("Request lab")}>+ Request</span></div>
          <div>
            <div className="row" onClick={() => toast("Order detail")}>
              <div className="row-ic"><I n="lab" s={18}/></div>
              <div className="row-body"><div className="row-t">HbA1c + kidney panel</div><div className="row-s">Home draw · Thu 24 Apr · 08:00</div></div>
              <span className="tl-tag neutral">Booked</span>
            </div>
            <div className="row" onClick={() => toast("Order detail")}>
              <div className="row-ic"><I n="lab" s={18}/></div>
              <div className="row-body"><div className="row-t">Lipid panel</div><div className="row-s">Awaiting Dr. Mensah approval</div></div>
              <span className="tl-tag warn">Review</span>
            </div>
          </div>
          <div className="sect"><div className="t">Past orders</div></div>
          <div>
            <div className="row" onClick={() => toast("Receipt")}>
              <div className="row-ic"><I n="doc" s={18}/></div>
              <div className="row-body"><div className="row-t">Quarterly panel</div><div className="row-s">14 Apr · Korle-Bu · GHS 280</div></div>
            </div>
            <div className="row" onClick={() => toast("Receipt")}>
              <div className="row-ic"><I n="doc" s={18}/></div>
              <div className="row-body"><div className="row-t">Baseline labs</div><div className="row-s">18 Jan · Korle-Bu · GHS 540</div></div>
            </div>
          </div>
        </>}

        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="labs" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── AI ────────────────────────────────────────────
function AIV3({ nav, toast }) {
  const [msgs, setMsgs] = uS3([
    { r: "ai", t: "Hi Ama. I can explain labs, prep questions for Dr. Mensah, and watch for patterns. I can't diagnose or prescribe. What's on your mind?" },
  ]);
  const [v, setV] = uS3("");
  const send = (t) => {
    if (!t.trim()) return;
    setMsgs(x => [...x, { r: "me", t }]);
    setV("");
    setTimeout(() => setMsgs(x => [...x, { r: "ai", t: "Three missed evening doses in March line up with the bump. A steady 19:00 reminder for 6 weeks usually resets it before the next check." }]), 600);
  };
  return (
    <div className="scr">
      <SB/>
      <div className="scroll" style={{ padding: "0" }}>
        <TopBar onAI={() => nav("home")}/>
        <div className="hero">
          <div className="lbl">AI Consult</div>
          <h1>What would you like to <em>understand</em>?</h1>
          <div className="sub">Educational only. Clinical actions go through Dr. Mensah.</div>
        </div>

        <div style={{ padding: "0 24px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Why did HbA1c go up?", "Is 132 fasting dangerous?", "Summarize my week", "Questions for Dr. Mensah"].map(q => (
            <button key={q} onClick={() => send(q)} style={{ fontSize: 11.5, padding: "6px 12px", borderRadius: 9999, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink-2)", cursor: "pointer", fontFamily: "inherit" }}>{q}</button>
          ))}
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.r === "me" ? "flex-end" : "flex-start", maxWidth: "85%",
              padding: "11px 14px", borderRadius: 14,
              background: m.r === "me" ? "var(--teal)" : "var(--surface)",
              color: m.r === "me" ? "#fff" : "var(--ink-1)",
              fontSize: 13, lineHeight: 1.5,
              border: m.r === "me" ? 0 : "1px solid var(--border)" }}>
              {m.t}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center" }}>
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === "Enter" && send(v)} placeholder="Ask about your health…" style={{ flex: 1, padding: "10px 14px", background: "var(--surface)", border: 0, borderRadius: 9999, fontSize: 13, fontFamily: "inherit" }}/>
        <button onClick={() => send(v)} style={{ width: 36, height: 36, borderRadius: "50%", border: 0, background: "var(--teal)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><I n="arrow" s={16} sw={2} c="#fff"/></button>
      </div>
      <Tabs active="ai" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── YOU ───────────────────────────────────────────
function YouV3({ nav, toast }) {
  const [sub, setSub] = uS3("Profile");
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <TopBar onAI={() => nav("ai")}/>
        <div className="hero">
          <div className="lbl">You</div>
          <h1>Ama Mensah · <em>34</em></h1>
          <div className="sub">Type-2 diabetes · O+ · penicillin allergy</div>
        </div>
        <SubTabs items={["Profile","Family","Privacy","Settings"]} active={sub} onPick={setSub}/>

        {sub === "Profile" && <>
          <div className="sect"><div className="t">About you</div></div>
          <div>
            <div className="row" onClick={() => nav("you-profile")}><div className="row-ic"><I n="user" s={18}/></div><div className="row-body"><div className="row-t">Personal details</div><div className="row-s">Name, DOB, contact</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => toast("Conditions & allergies")}><div className="row-ic"><I n="heart" s={18}/></div><div className="row-body"><div className="row-t">Conditions & allergies</div><div className="row-s">2 conditions · 1 allergy</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => nav("you-meds")}><div className="row-ic"><I n="pill" s={18}/></div><div className="row-body"><div className="row-t">Medications</div><div className="row-s">3 active · metformin, lisinopril, vitamin D</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => toast("Insurance")}><div className="row-ic"><I n="doc" s={18}/></div><div className="row-body"><div className="row-t">Insurance</div><div className="row-s">NHIS · valid until 31 Dec</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          </div>
        </>}

        {sub === "Family" && <>
          <div className="sect"><div className="t">Family & delegates</div><span className="link" onClick={() => toast("Invite delegate")}>+ Invite</span></div>
          <div>
            <div className="row" onClick={() => nav("you-delegates")}><div className="row-ic"><I n="user" s={18}/></div><div className="row-body"><div className="row-t">Kojo Mensah · brother</div><div className="row-s">Delegate · expires 12 Oct</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => nav("you-delegates")}><div className="row-ic"><I n="user" s={18}/></div><div className="row-body"><div className="row-t">Kofi Mensah · father · 68</div><div className="row-s">You care for · full delegate</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          </div>
          <div className="sect"><div className="t">Emergency contacts</div></div>
          <div>
            <div className="row" onClick={() => toast("Call Kojo")}><div className="row-ic" style={{ background: "#fef2f2", color: "var(--danger)" }}><I n="phone" s={18}/></div><div className="row-body"><div className="row-t">Kojo Mensah</div><div className="row-s">+233 24 555 0101 · primary</div></div></div>
            <div className="row" onClick={() => toast("Call Dr. Mensah")}><div className="row-ic"><I n="phone" s={18}/></div><div className="row-body"><div className="row-t">Dr. Akosua Mensah</div><div className="row-s">Clinical line · 24/7</div></div></div>
          </div>
        </>}

        {sub === "Privacy" && <>
          <div className="sect"><div className="t">Records</div></div>
          <div>
            <div className="row" onClick={() => toast("Downloading record…")}><div className="row-ic"><I n="doc" s={18}/></div><div className="row-body"><div className="row-t">Download my record</div><div className="row-s">PDF · encrypted</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => nav("you-privacy")}><div className="row-ic"><I n="doc" s={18}/></div><div className="row-body"><div className="row-t">Consent log</div><div className="row-s">12 events · last 30 days</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => nav("you-privacy")}><div className="row-ic"><I n="shield" s={18}/></div><div className="row-body"><div className="row-t">Data sharing</div><div className="row-s">4 apps connected</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          </div>
          <div className="sect"><div className="t">Security</div></div>
          <div>
            <div className="row" onClick={() => toast("Change PIN")}><div className="row-ic"><I n="lock" s={18}/></div><div className="row-body"><div className="row-t">App PIN & biometrics</div><div className="row-s">Face ID on · PIN required after 5 min</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => toast("Sessions")}><div className="row-ic"><I n="scan" s={18}/></div><div className="row-body"><div className="row-t">Devices & sessions</div><div className="row-s">2 devices active</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          </div>
        </>}

        {sub === "Settings" && <>
          <div className="sect"><div className="t">Preferences</div></div>
          <div>
            <div className="row" onClick={() => nav("you-notifs")}><div className="row-ic"><I n="bell" s={18}/></div><div className="row-body"><div className="row-t">Notifications</div><div className="row-s">Reminders, messages, orders</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => nav("you-settings")}><div className="row-ic"><I n="edit" s={18}/></div><div className="row-body"><div className="row-t">Language & region</div><div className="row-s">English · Ghana</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row" onClick={() => nav("you-settings")}><div className="row-ic"><I n="edit" s={18}/></div><div className="row-body"><div className="row-t">Appearance</div><div className="row-s">Light · serif on</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          </div>
          <div className="sect"><div className="t">About</div></div>
          <div>
            <div className="row"><div className="row-ic"><I n="doc" s={18}/></div><div className="row-body"><div className="row-t">Terms & policies</div></div><div className="chev"><I n="chev" s={16}/></div></div>
            <div className="row"><div className="row-ic"><I n="doc" s={18}/></div><div className="row-body"><div className="row-t">App version</div><div className="row-s">v3.2.1 · build 412</div></div></div>
            <div className="row" onClick={() => toast("Signed out")}><div className="row-ic" style={{ color: "var(--danger)" }}><I n="x" s={18}/></div><div className="row-body"><div className="row-t" style={{ color: "var(--danger)" }}>Sign out</div></div></div>
          </div>
        </>}
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── VISIT (detail screen, reached from Home) ──────
function VisitV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <TopBar onAI={() => nav("ai")}/>
        <div className="hero">
          <div className="lbl" style={{ color: "var(--teal)" }}>READY IN 49 MINUTES</div>
          <h1>Dr. Mensah · <em>video follow-up</em></h1>
          <div className="sub">15 minutes · HbA1c discussion · GHS 120</div>
        </div>

        <div className="sect"><div className="t">Prep</div></div>
        <div>
          <div className="row"><div className="row-ic"><I n="scan" s={18}/></div><div className="row-body"><div className="row-t">Camera and mic</div><div className="row-s">Tap to test before joining</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          <div className="row"><div className="row-ic"><I n="doc" s={18}/></div><div className="row-body"><div className="row-t">AI brief for Dr. Mensah</div><div className="row-s">HbA1c 7.8% · 3 missed doses · review before sending</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          <div className="row"><div className="row-ic"><I n="chat" s={18}/></div><div className="row-body"><div className="row-t">Your questions</div><div className="row-s">3 drafted · edit anytime</div></div><div className="chev"><I n="chev" s={16}/></div></div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <button onClick={() => toast("Joining video…")} style={{ width: "100%", padding: "14px", borderRadius: 9999, background: "var(--teal)", color: "#fff", border: 0, fontWeight: 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.005em" }}>Join video now</button>
          <button onClick={() => nav("home")} style={{ width: "100%", padding: "12px", marginTop: 8, borderRadius: 9999, background: "transparent", color: "var(--ink-2)", border: "1px solid var(--border)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Reschedule</button>
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <div className="home-ind"/>
    </div>
  );
}

Object.assign(window, { HomeV3, CareV3, LabsV3, AIV3, YouV3, VisitV3 });
