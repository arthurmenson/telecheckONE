// Patient app — all screens
const { useState: uS, useEffect: uE, useRef: uR } = React;

// ── HOME ─────────────────────────────────────────
function Home({ nav, toast, openSheet, delegate }) {
  return (
    <div className="app">
      <SB/>
      <div className="scroll">
        <div className="hero">
          <div className="hero-top">
            <div>
              <div className="hi-date">Monday · 20 April</div>
              <div className="hi-name">{delegate === "k" ? "Caring for Kofi" : "Ɛte sɛn, Ama?"}</div>
              <div className="hi-sub">2 care tasks today · feeling stable</div>
            </div>
            <div className="av" onClick={() => openSheet("account")}>
              {delegate === "k" ? "KO" : "AM"}
              <div className="dot-warn"/>
            </div>
          </div>
          <div className="focus-c">
            <div className="focus-k">TODAY'S FOCUS</div>
            <div className="focus-t">Evening metformin at 19:00</div>
            <div className="focus-b">Morning dose logged 07:24 · 2 of 5 tasks done</div>
            <div className="btn-row">
              <button className="btn-p" onClick={() => toast("Marked taken · 19:00")}>Mark taken</button>
              <button className="btn-g" onClick={() => toast("Snoozed 30 min")}>Snooze 30 min</button>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="section-h"><span>Lab results · 14 Apr</span><span className="section-link" onClick={() => nav("labs")}>All labs →</span></div>
          <div className="donuts">
            <Donut label="HbA1c" value="7.8" unit="%" pct={78} color="#c28320" target="≤7.0" delta="+0.2 ▲"/>
            <Donut label="Fasting glucose" value="132" unit="mg/dL" pct={82} color="#c8402f" target="70–100" delta="High"/>
            <Donut label="eGFR" value="94" unit="mL/min" pct={94} color="#2a8a4a" target="≥60" delta="Normal"/>
            <Donut label="Haemoglobin" value="11.2" unit="g/dL" pct={70} color="#2b6cb0" target="12–16" delta="Low"/>
          </div>

          <AI
            tone="lab"
            tag="LAB INTERPRETATION · TELECHECK AI"
            title="Small HbA1c rise — no urgent change needed"
            body="Three small increases over 4 months. Seasonal meals and 2 missed evening doses this month line up with the trend. Dr. Mensah suggests consistent evening metformin for 6 weeks, then re-check."
            src="Sources: HbA1c history · med log · Dr. Mensah review 14 Apr 08:12"
            actions={["Set evening reminder", "Message clinic"]}
            onAct={(a) => a.startsWith("Set") ? toast("Evening reminder on · 18:45") : nav("chat")}
          />

          <AI
            tone="inter"
            tag="DRUG INTERACTION · TELECHECK AI"
            title="Heads up: ibuprofen + your lisinopril"
            body="You added ibuprofen to your pharmacy basket. Taken with lisinopril it can reduce your blood pressure control and affect kidney function. Paracetamol is safer with your current regimen."
            src="Checked against: lisinopril 10 mg · eGFR 94 · recent BP 124/78"
            actions={["Swap to paracetamol", "See details"]}
            onAct={(a) => a.startsWith("Swap") ? toast("Swapped to paracetamol 500 mg") : openSheet("interaction")}
          />

          <AI
            tone="sched"
            tag="SCHEDULING · TELECHECK AI"
            title="Dr. Mensah has Thursday 23 Apr at 10:30 open"
            body="That matches your usual morning window and keeps your 6-week re-check on track. Home lab draw at 08:00 same day fits before the consult."
            src="Based on: your availability pattern · Dr. Mensah's calendar · lab scheduling rules"
            actions={["Book both", "See other times"]}
            onAct={(a) => a.startsWith("Book") ? nav("booking") : nav("booking")}
          />

          <div className="section-h"><span>Your numbers</span><span className="section-link" onClick={() => nav("health")}>See all →</span></div>
          <div className="metrics">
            <div className="m" onClick={() => nav("glucose")} style={{cursor:"pointer"}}>
              <div className="m-k">Blood glucose</div>
              <div className="m-v">118 <span className="m-u">mg/dL</span></div>
              <div className="m-t">07:42 · in range</div>
            </div>
            <div className="m">
              <div className="m-k">Blood pressure</div>
              <div className="m-v">124/78</div>
              <div className="m-t">Yesterday · stable</div>
            </div>
            <div className="m">
              <div className="m-k">Weight</div>
              <div className="m-v">68 <span className="m-u">kg</span></div>
              <div className="m-t">-0.4 kg / week</div>
            </div>
          </div>

          <div className="section-h"><span>Coming up</span></div>
          <div className="lc" onClick={() => nav("refill")}>
            <div className="lc-ic teal"><Ic n="pill" s={20} sw={2}/></div>
            <div>
              <div className="lc-t">Refill · metformin 500 mg <span className="lp warn">IN REVIEW</span></div>
              <div className="lc-s">With Dr. Mensah since 09:42 · pickup Thursday</div>
            </div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>
          <div className="lc" onClick={() => nav("rpm")}>
            <div className="lc-ic iris"><Ic n="heart" s={20} sw={2}/></div>
            <div>
              <div className="lc-t">Weekly diabetes check-in</div>
              <div className="lc-s">3 quick questions · due today</div>
            </div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>
          <div className="lc" onClick={() => nav("scan-start")}>
            <div className="lc-ic gold"><Ic n="scan" s={20} sw={2}/></div>
            <div>
              <div className="lc-t">Scan your meal</div>
              <div className="lc-s">Estimate carbs before lunch</div>
            </div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>
        </div>
      </div>
      <TabBar active="home" onTab={nav}/>
    </div>
  );
}

// ── REFILL ───────────────────────────────────────
function Refill({ nav, toast }) {
  return (
    <div className="app">
      <SB/>
      <Sub title="Refill" onBack={() => nav("home")}/>
      <div className="scroll">
        <div className="big-h">
          <h1>Metformin 500 mg</h1>
          <p>Twice daily · 30-day supply · Dr. A. Mensah</p>
        </div>
        <div className="content">
          <div className="steps">
            <div className="step done">
              <div className="b"/><div className="ln"/>
              <div><div className="st-t">Request sent</div><div className="st-s">You · today 09:28</div></div>
              <div className="tm">09:28</div>
            </div>
            <div className="step done">
              <div className="b"/><div className="ln"/>
              <div><div className="st-t">Pharmacy check</div><div className="st-s">Mobipharm Osu · interaction clear</div></div>
              <div className="tm">09:31</div>
            </div>
            <div className="step now">
              <div className="b"/><div className="ln"/>
              <div><div className="st-t">Clinician review</div><div className="st-s">Dr. Mensah · typical response in 2h</div></div>
              <div className="tm">now</div>
            </div>
            <div className="step pending">
              <div className="b"/><div className="ln"/>
              <div><div className="st-t">Dispensed</div><div className="st-s">Expected today</div></div>
              <div className="tm">—</div>
            </div>
            <div className="step pending">
              <div className="b"/>
              <div><div className="st-t">Delivered to Osu</div><div className="st-s">22 Apr window 10–14</div></div>
              <div className="tm">—</div>
            </div>
          </div>

          <AI tone="lab"
            tag="INTERACTION CHECK · CLEAR"
            title="No interaction issues flagged"
            body="Checked metformin against your 3 active meds, kidney and liver labs, and active conditions. No signals."
            src="Medication Interaction Engine · v2026.03"
            actions={["See what was checked"]}
            onAct={() => toast("3 meds · 6 labs · 2 conditions reviewed")}
          />

          <div className="section-h"><span>Delivery</span></div>
          <div className="lc">
            <div className="lc-ic info"><Ic n="home" s={20} sw={2}/></div>
            <div>
              <div className="lc-t">Home · Osu, Accra</div>
              <div className="lc-s">House 14, 2nd Ring Close · 22 Apr · GHS 10</div>
            </div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>

          <div className="section-h"><span>Prescription</span></div>
          <div className="lc" onClick={() => toast("Opening prescription PDF")}>
            <div className="lc-ic warn"><Ic n="doc" s={20} sw={2}/></div>
            <div>
              <div className="lc-t">View prescription</div>
              <div className="lc-s">Issued 14 Apr · expires 14 Oct</div>
            </div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>
        </div>
        <button className="cta" style={{ marginTop: 14 }} onClick={() => { toast("Paid GHS 55 · Receipt sent"); nav("home"); }}>Confirm &amp; pay GHS 55</button>
        <button className="cta g" onClick={() => nav("home")}>Cancel refill</button>
      </div>
      <TabBar active="meds" onTab={nav}/>
    </div>
  );
}

// ── CONSULT INTAKE (multi-step) ───────────────────
function Consult({ nav, step, setStep, toast }) {
  const questions = [
    { q: "What brings you in today?", opts: ["A new symptom", "Follow-up on a condition", "Medication question", "Something else"], key: "reason" },
    { q: "How long have you had this cough?", opts: ["Today", "A few days", "More than a week", "More than a month"], key: "dur" },
    { q: "Is there blood or rust-colored phlegm?", opts: ["No", "A little", "Yes — repeatedly"], key: "blood", safety: true },
    { q: "Any fever in the last 48 hours?", opts: ["No", "Yes — under 38°C", "Yes — 38°C or higher"], key: "fever" },
    { q: "Other symptoms you've noticed?", opts: ["Shortness of breath", "Chest tightness", "Night sweats", "None of these"], key: "other" },
    { q: "Anything else Dr. Mensah should know?", opts: ["Write a note", "Skip"], key: "note" },
  ];
  const [answers, setAns] = uS({});
  const cur = questions[step] || questions[0];
  const total = questions.length;

  const choose = (opt) => {
    setAns({ ...answers, [cur.key]: opt });
    if (step < total - 1) setStep(step + 1);
    else { toast("Submitted · Dr. Mensah notified"); nav("booking"); }
  };

  return (
    <div className="app">
      <SB/>
      <Sub title={`Question ${step + 1} of ${total}`} onBack={() => step > 0 ? setStep(step - 1) : nav("home")}/>
      <div className="scroll">
        <div className="big-h">
          <h1>{cur.q}</h1>
          <p>Your answers go to Dr. Mensah before the consult. Clinical terms are explained as they come up.</p>
        </div>
        <div className="content">
          {cur.opts.map((o, i) => (
            <div key={i} className={`choice ${answers[cur.key] === o ? "on" : ""}`} onClick={() => choose(o)}>
              <div className="radio"/>
              <div>{o}</div>
            </div>
          ))}

          {cur.safety && (
            <AI tone="safety"
              tag="SAFETY CHECK · TELECHECK AI"
              title="If you're coughing up blood right now, call 112"
              body="Ghana Ambulance Service on 112. Tap the red SOS on the avatar to open emergency options any time."
              src="Safety protocol · §13"
              actions={["Call 112", "I'm safe"]}
              onAct={(a) => a === "Call 112" ? toast("Dialing 112…") : null}
            />
          )}

          {step === 1 && (
            <AI tone="sched"
              tag="SCHEDULING · TELECHECK AI"
              title="Dr. Mensah has a video slot in 35 minutes"
              body="Based on your answers so far, this sounds urgent-ish. There's a 10:30 slot open — want it?"
              src="Based on: your answers so far · consult urgency model"
              actions={["Book 10:30", "Later this week"]}
              onAct={() => nav("booking")}
            />
          )}
        </div>
      </div>
      <TabBar active="home" onTab={nav}/>
    </div>
  );
}

// ── BOOKING ──────────────────────────────────────
function Booking({ nav, toast }) {
  const [slot, setSlot] = uS("10:30");
  const [day, setDay] = uS("Thu 23");
  const days = ["Wed 22", "Thu 23", "Fri 24", "Mon 27"];
  const times = ["08:00", "09:15", "10:30", "11:45", "14:00", "15:30"];
  return (
    <div className="app">
      <SB/>
      <Sub title="Book consult" onBack={() => nav("home")}/>
      <div className="scroll">
        <div className="big-h">
          <h1>Dr. Mensah — video</h1>
          <p>Primary care · typical cost GHS 120 · covered under your plan</p>
        </div>
        <div className="content">
          <div className="section-h"><span>Day</span></div>
          <div className="slot-grid">
            {days.map(d => (
              <div key={d} className={`slot ${day === d ? "on" : ""}`} onClick={() => setDay(d)}>
                <div className="tm">{d.split(" ")[1]}</div>
                <div className="lb">{d.split(" ")[0]}</div>
              </div>
            ))}
          </div>
          <div className="section-h"><span>Time</span></div>
          <div className="slot-grid">
            {times.map(t => (
              <div key={t} className={`slot ${slot === t ? "on" : ""}`} onClick={() => setSlot(t)}>
                <div className="tm">{t}</div>
                <div className="lb">{t < "12:00" ? "morning" : "afternoon"}</div>
              </div>
            ))}
          </div>
          <AI tone="sched"
            tag="SCHEDULING · TELECHECK AI"
            title={`${day} ${slot} · add home lab draw 08:00?`}
            body="Your 6-week re-check HbA1c + kidney panel is due. Home draw fits before the consult — results back same day."
            src="Based on: lab cadence · consult time · your postal code"
            actions={["Add lab draw", "Consult only"]}
            onAct={(a) => toast(a === "Add lab draw" ? "Lab draw added · 08:00" : "Consult only")}
          />
        </div>
        <button className="cta" onClick={() => { toast(`Booked · ${day} ${slot}`); nav("home"); }}>Confirm {day} {slot}</button>
      </div>
      <TabBar active="home" onTab={nav}/>
    </div>
  );
}

// ── GLUCOSE DETAIL ───────────────────────────────
function Glucose({ nav }) {
  const data = [118, 124, 108, 132, 119, 115, 128, 122, 118];
  const max = 160, min = 60;
  const points = data.map((v, i) => {
    const x = 20 + (i * (340 / (data.length - 1)));
    const y = 120 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="app">
      <SB/>
      <Sub title="Blood glucose" onBack={() => nav("home")} right={<button className="ic-btn"><Ic n="more" s={18}/></button>}/>
      <div className="scroll">
        <div className="content">
          <div className="chart">
            <h3>TODAY · FASTING + POSTPRANDIAL</h3>
            <div className="chart-big">118<span>mg/dL</span></div>
            <div className="chart-delta"><Ic n="trend" s={12} sw={2.2}/> 7-day avg 122 · target 80–130</div>
            <svg width="100%" height="140" viewBox="0 0 380 140" style={{ marginTop: 12 }}>
              <defs>
                <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--teal-500)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[40, 80, 120].map(y => <line key={y} x1="20" x2="360" y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 4"/>)}
              <rect x="20" y={120 - ((130-60)/100)*100} width="340" height={((130-80)/100)*100} fill="var(--teal-50)" opacity="0.6"/>
              <polyline points={points} fill="none" stroke="var(--teal-500)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
              <polyline points={`${points} 360,120 20,120`} fill="url(#gg)"/>
              {data.map((v, i) => {
                const x = 20 + (i * (340 / (data.length - 1)));
                const y = 120 - ((v - min) / (max - min)) * 100;
                return <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="var(--teal-500)" strokeWidth="2"/>;
              })}
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue"].map((d, i) => {
                const x = 20 + (i * (340 / 8));
                return <text key={i} x={x} y="134" textAnchor="middle" fontSize="9" fill="var(--fg-3)">{d}</text>;
              })}
            </svg>
          </div>

          <AI tone="lab"
            tag="GLUCOSE PATTERN · TELECHECK AI"
            title="Morning values creeping up Thursdays"
            body="Last 3 Thursdays ran 132, 128, 134. Thursday dinners at your sister's — rice + stew — likely the cause. Try half portion next Thursday and log result."
            src="Based on: 21 readings · meal notes · recent HbA1c 7.8"
            actions={["Remind me Thursday"]}
          />

          <div className="section-h"><span>Today's log</span><span className="section-link">Add reading</span></div>
          {[
            { t: "07:42", v: "118", tag: "Fasting", ok: true },
            { t: "09:15", v: "142", tag: "Post breakfast", ok: true },
            { t: "13:40", v: "138", tag: "Post lunch", ok: true },
          ].map((r, i) => (
            <div key={i} className="lc">
              <div className="lc-ic teal"><Ic n="heart" s={18} sw={2}/></div>
              <div><div className="lc-t">{r.v} mg/dL <span className="lp ok">IN RANGE</span></div><div className="lc-s">{r.tag} · {r.t}</div></div>
              <div className="lc-chev"><Ic n="chev" s={18}/></div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="health" onTab={nav}/>
    </div>
  );
}

window.Home = Home;
window.Refill = Refill;
window.Consult = Consult;
window.Booking = Booking;
window.Glucose = Glucose;
