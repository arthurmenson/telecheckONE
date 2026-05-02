// Patient app — secondary screens (labs, meds, care, chat, scan, rpm, account)
const { useState: uS2, useEffect: uE2, useRef: uR2 } = React;

// ── LABS DETAIL ──────────────────────────────────
function Labs({ nav, openSheet }) {
  const hist = [
    { d: "14 Apr 2026", v: "7.8", t: "+0.2", up: true },
    { d: "28 Feb 2026", v: "7.6", t: "+0.1", up: true },
    { d: "02 Jan 2026", v: "7.5", t: "+0.1", up: true },
    { d: "15 Nov 2025", v: "7.4", t: "—", up: false },
    { d: "20 Sep 2025", v: "7.3", t: "-0.1", up: false },
  ];
  return (
    <div className="app">
      <SB/>
      <Sub title="Lab history" onBack={() => nav("home")}/>
      <div className="scroll">
        <div className="big-h">
          <h1>HbA1c</h1>
          <p>Average glucose over the last 3 months. Target ≤ 7.0%. Higher means less-controlled diabetes.</p>
        </div>
        <div className="content">
          <div className="chart">
            <h3>LAST 18 MONTHS</h3>
            <div className="chart-big">7.8<span>%</span></div>
            <div className="chart-delta"><Ic n="trend" s={12} sw={2.2}/> Up 0.5 from last year</div>
            <svg width="100%" height="120" viewBox="0 0 380 120" style={{ marginTop: 12 }}>
              <line x1="20" x2="360" y1="70" y2="70" stroke="var(--gold-500)" strokeDasharray="4 4" opacity="0.5"/>
              <text x="365" y="74" fontSize="9" fill="var(--gold-700)">7.0</text>
              <polyline points="20,90 90,85 160,80 230,70 300,65 360,55" fill="none" stroke="var(--gold-500)" strokeWidth="2.5"/>
              {[{x:20,y:90},{x:90,y:85},{x:160,y:80},{x:230,y:70},{x:300,y:65},{x:360,y:55}].map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="var(--gold-500)" strokeWidth="2"/>)}
            </svg>
          </div>
          <AI tone="lab"
            tag="LAB INTERPRETATION · TELECHECK AI"
            title="What does this mean for you?"
            body="Your HbA1c reflects the last 3 months of glucose control. It's slowly ticking up, not dangerous, but worth acting on before it crosses 8%. Dr. Mensah added a coach session focused on evening meals."
            src="Based on: lab trend · med adherence · food logs"
            actions={["Ask a question", "Book coach session"]}
            onAct={() => nav("chat")}
          />
          <div className="section-h"><span>All results</span></div>
          {hist.map((h, i) => (
            <div key={i} className="lc" onClick={() => openSheet("lab-detail")}>
              <div className="lc-ic gold"><Ic n="lab" s={20} sw={2}/></div>
              <div><div className="lc-t">HbA1c {h.v}%</div><div className="lc-s">{h.d} · {h.t}</div></div>
              <div className="lc-chev"><Ic n="chev" s={18}/></div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="health" onTab={nav}/>
    </div>
  );
}

// ── MEDS LIST ────────────────────────────────────
function Meds({ nav, toast }) {
  const meds = [
    { n: "Metformin 500 mg", d: "Twice daily · with meals", next: "Next: 19:00 today", tone: "teal", status: "active" },
    { n: "Lisinopril 10 mg", d: "Once daily · morning", next: "Taken 07:24", tone: "iris", status: "active" },
    { n: "Paracetamol 500 mg", d: "As needed · pain", next: "Last used 3 days ago", tone: "info", status: "prn" },
  ];
  return (
    <div className="app">
      <SB/>
      <Sub title="Medications" onBack={() => nav("home")} right={<button className="ic-btn" onClick={() => toast("Add med")}><Ic n="plus" s={18}/></button>}/>
      <div className="scroll">
        <div className="big-h"><h1>Your medications</h1><p>3 active · 1 refill in review</p></div>
        <div className="content">
          <AI tone="inter"
            tag="INTERACTION SWEEP · TELECHECK AI"
            title="All clear across your 3 meds"
            body="Last sweep: today 09:31. No interactions, kidney safe, liver safe at current doses."
            src="Against: eGFR 94 · ALT/AST normal · active conditions"
            actions={["See what was checked"]}
          />
          <div className="section-h"><span>Active</span></div>
          {meds.map((m, i) => (
            <div key={i} className="lc" onClick={() => i === 0 ? nav("refill") : toast(m.n)}>
              <div className={`lc-ic ${m.tone}`}><Ic n="pill" s={20} sw={2}/></div>
              <div><div className="lc-t">{m.n} {i === 0 && <span className="lp warn">REFILL SOON</span>}</div><div className="lc-s">{m.d} · {m.next}</div></div>
              <div className="lc-chev"><Ic n="chev" s={18}/></div>
            </div>
          ))}
          <div className="section-h"><span>Archive</span></div>
          <div className="lc">
            <div className="lc-ic"><Ic n="pill" s={20} sw={2} c="var(--fg-4)"/></div>
            <div><div className="lc-t" style={{color:"var(--fg-3)"}}>Amlodipine 5 mg</div><div className="lc-s">Stopped 14 Feb · replaced with lisinopril</div></div>
          </div>
        </div>
      </div>
      <TabBar active="meds" onTab={nav}/>
    </div>
  );
}

// ── CARE (inbox-style) ───────────────────────────
function Care({ nav }) {
  const msgs = [
    { f: "Dr. A. Mensah", p: "Let's plan a 6-week re-check…", t: "09:12", u: true, a: "DM" },
    { f: "Mobipharm Osu", p: "Your metformin is being prepared.", t: "09:31", u: true, a: "MP" },
    { f: "Nurse Adjoa", p: "How are your evening readings?", t: "Yesterday", u: false, a: "NA" },
    { f: "Telecheck support", p: "New: track meals by photo →", t: "Monday", u: false, a: "TC" },
  ];
  return (
    <div className="app">
      <SB/>
      <div className="sub">
        <div style={{ width: 36 }}/>
        <div className="sub-t">Care</div>
        <button className="ic-btn"><Ic n="search" s={18}/></button>
      </div>
      <div className="scroll">
        <div className="big-h"><h1>Care inbox</h1><p>Doctors, nurses, pharmacy and coaches · all in one thread</p></div>
        <div className="content">
          {msgs.map((m, i) => (
            <div key={i} className="lc" onClick={() => nav("chat")}>
              <div className="lc-ic" style={{ background: "var(--teal-500)", color: "#fff", fontWeight: 700, fontSize: 12 }}>{m.a}</div>
              <div><div className="lc-t">{m.f} {m.u && <span className="lp ok">NEW</span>}</div><div className="lc-s">{m.p}</div></div>
              <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{m.t}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="care" onTab={nav}/>
    </div>
  );
}

// ── CHAT ─────────────────────────────────────────
function Chat({ nav, toast }) {
  const [msgs, setMsgs] = uS2([
    { who: "them", t: "Hi Ama — saw your HbA1c came back at 7.8. How are you feeling overall?", tm: "09:12" },
    { who: "me", t: "Fine mostly, evenings I feel tired sometimes.", tm: "09:13" },
    { who: "ai", t: "AI draft reply: Would adding a coach session on evening meals help?" },
    { who: "them", t: "Let's plan a 6-week re-check and lock in evening metformin. Can you add a home lab draw on Thursday 08:00?", tm: "09:14" },
  ]);
  const [val, setVal] = uS2("");
  const ref = uR2();
  uE2(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);
  const send = () => {
    if (!val.trim()) return;
    setMsgs([...msgs, { who: "me", t: val, tm: "now" }]);
    setVal("");
    setTimeout(() => setMsgs(m => [...m, { who: "ai", t: "AI summary sent to Dr. Mensah · reply expected in 2h" }]), 600);
  };
  return (
    <div className="app">
      <SB/>
      <Sub title="Dr. A. Mensah" onBack={() => nav("care")} right={<button className="ic-btn" onClick={() => toast("Calling…")}><Ic n="phone" s={18}/></button>}/>
      <div className="chat-body" ref={ref}>
        {msgs.map((m, i) => (
          <React.Fragment key={i}>
            <div className={`bub ${m.who}`}>{m.t}</div>
            {m.tm && <div className="bub-meta" style={{ alignSelf: m.who === "me" ? "flex-end" : "flex-start" }}>{m.tm}</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="chat-entry">
        <input placeholder="Write a reply…" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}/>
        <button onClick={send}><Ic n="send" s={18} c="#fff"/></button>
      </div>
      <TabBar active="care" onTab={nav}/>
    </div>
  );
}

// ── SCAN ─────────────────────────────────────────
function ScanStart({ nav }) {
  return (
    <div className="app" style={{ background: "#0a0d0c", color: "#fff" }}>
      <SB/>
      <div className="sub">
        <button className="ic-btn" onClick={() => nav("home")} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: 0 }}><Ic n="close" s={18} c="#fff"/></button>
        <div className="sub-t" style={{ color: "#fff" }}>Scan meal</div>
        <div style={{ width: 36 }}/>
      </div>
      <div className="scroll" style={{ paddingBottom: 120 }}>
        <div className="scan-f">
          <div className="scan-corners">
            <div className="sc-c tl"/><div className="sc-c tr"/><div className="sc-c bl"/><div className="sc-c br"/>
          </div>
          <div className="scan-ln"/>
          <div className="scan-h">Point at your plate · hold steady</div>
        </div>
        <div style={{ padding: "14px 16px", color: "rgba(255,255,255,0.7)", fontSize: 12.5, lineHeight: 1.5 }}>
          AI estimates carbs, protein and fat from the photo. Always an estimate — confirm before logging.
        </div>
        <div style={{ padding: "0 16px" }}>
          <button className="cta" onClick={() => nav("scan-result")}>Capture</button>
          <button className="cta g" style={{ color: "rgba(255,255,255,0.6)" }}>Log manually</button>
        </div>
      </div>
    </div>
  );
}

function ScanResult({ nav, toast }) {
  return (
    <div className="app">
      <SB/>
      <Sub title="Meal detected" onBack={() => nav("scan-start")}/>
      <div className="scroll">
        <div style={{ margin: "4px 16px", height: 180, borderRadius: 20, background: "linear-gradient(135deg, #c28320, #d4a04a 70%, #e5c37a)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 70% 60%, rgba(139,94,47,0.4), transparent 45%)" }}/>
          <div style={{ position: "absolute", bottom: 12, left: 14, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)" }}>94% confident</div>
        </div>
        <div className="content">
          <div className="big-h" style={{ padding: "0 0 6px" }}>
            <h1>Jollof rice with chicken</h1>
            <p>About 1 plate · cooked at home based on your last logs</p>
          </div>
          <div className="pa-card" style={{ background: "var(--surface-1)", borderRadius: 14, padding: 16, border: "1px solid rgba(0,0,0,0.04)" }}>
            <div className="nut">
              <div><div className="k">Carbs</div><div className="v">68g</div></div>
              <div><div className="k">Protein</div><div className="v">26g</div></div>
              <div><div className="k">Fat</div><div className="v">18g</div></div>
              <div><div className="k">kcal</div><div className="v">560</div></div>
            </div>
          </div>
          <AI tone="lab"
            tag="GLUCOSE IMPACT · TELECHECK AI"
            title="Expect a 30–50 mg/dL rise in 60–90 min"
            body="Based on your response to rice meals this month. A 10-min walk after lunch typically knocks 15–20 off the peak."
            src="Based on: 11 similar meals · meds timing · 7-day trend"
            actions={["Log &amp; remind me to walk", "Just log"]}
            onAct={(a) => { toast(a.startsWith("Log &amp;") ? "Logged · walk reminder set 14:30" : "Meal logged"); nav("home"); }}
          />
        </div>
      </div>
    </div>
  );
}

// ── RPM WEEKLY CHECK-IN ──────────────────────────
function RPM({ nav, toast }) {
  const [a1, setA1] = uS2(null);
  const [a2, setA2] = uS2(null);
  const [a3, setA3] = uS2(null);
  return (
    <div className="app">
      <SB/>
      <Sub title="Weekly check-in" onBack={() => nav("home")}/>
      <div className="scroll">
        <div className="big-h"><h1>Three quick questions</h1><p>For your diabetes program with Dr. Mensah. About 90 seconds.</p></div>
        <div className="content">
          <div className="pa-card" style={{ background: "var(--surface-1)", borderRadius: 16, padding: 16, border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Any low-sugar episodes this week?</div>
            <div className="rpm-opts">
              {["No", "One", "More than one"].map(o => (
                <div key={o} className={`rpm-o ${a1 === o ? "on" : ""}`} onClick={() => setA1(o)}>{o}</div>
              ))}
            </div>
          </div>
          <div className="pa-card" style={{ background: "var(--surface-1)", borderRadius: 16, padding: 16, border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>How are you feeling overall?</div>
            <div className="scale">
              {[["😞","Rough"],["😐","Meh"],["🙂","OK"],["😊","Good"],["🤩","Great"]].map(([f, l]) => (
                <div key={l} className={`scale-o ${a2 === l ? "on" : ""}`} onClick={() => setA2(l)}>
                  <div className="face">{f}</div><div>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pa-card" style={{ background: "var(--surface-1)", borderRadius: 16, padding: 16, border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Medication adherence this week?</div>
            <div className="rpm-opts">
              {["All doses", "Missed 1–2", "Missed more"].map(o => (
                <div key={o} className={`rpm-o ${a3 === o ? "on" : ""}`} onClick={() => setA3(o)}>{o}</div>
              ))}
            </div>
          </div>
          {(a1 && a2 && a3) && (
            <AI tone="sched"
              tag="PROGRAM · TELECHECK AI"
              title={a3 === "All doses" && a1 === "No" ? "Looking stable — no extra consult needed" : "Heads up — Dr. Mensah will reach out"}
              body={a3 === "All doses" && a1 === "No" ? "Averages in range, adherence perfect, mood fine. Your 6-week re-check holds for 30 Jun." : "Your pattern this week suggests a 15-min check-in would help. We'll propose a time."}
              src="Based on: 7 readings · med log · your answers just now"
              actions={["Submit"]}
              onAct={() => { toast("Check-in submitted"); nav("home"); }}
            />
          )}
        </div>
      </div>
      <TabBar active="health" onTab={nav}/>
    </div>
  );
}

// ── HEALTH TAB (overview) ────────────────────────
function Health({ nav }) {
  return (
    <div className="app">
      <SB/>
      <div className="sub">
        <div style={{ width: 36 }}/>
        <div className="sub-t">Health</div>
        <button className="ic-btn"><Ic n="plus" s={18}/></button>
      </div>
      <div className="scroll">
        <div className="big-h"><h1>Your health</h1><p>Readings, labs and programs · updated 07:42</p></div>
        <div className="content">
          <div className="donuts">
            <Donut label="HbA1c" value="7.8" unit="%" pct={78} color="#c28320" target="≤7.0" delta="+0.2 ▲"/>
            <Donut label="Fasting glucose" value="132" unit="mg/dL" pct={82} color="#c8402f" target="70–100" delta="High"/>
            <Donut label="eGFR" value="94" unit="mL/min" pct={94} color="#2a8a4a" target="≥60" delta="Normal"/>
            <Donut label="Haemoglobin" value="11.2" unit="g/dL" pct={70} color="#2b6cb0" target="12–16" delta="Low"/>
          </div>
          <div className="section-h"><span>Programs</span></div>
          <div className="lc" onClick={() => nav("rpm")}>
            <div className="lc-ic iris"><Ic n="heart" s={20} sw={2}/></div>
            <div><div className="lc-t">Diabetes RPM · week 12</div><div className="lc-s">Next check-in due today · with Dr. Mensah</div></div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>
          <div className="section-h"><span>Vitals</span></div>
          {[
            { k: "Blood glucose", v: "118 mg/dL", t: "07:42 today", i: "teal" },
            { k: "Blood pressure", v: "124/78", t: "Yesterday 20:10", i: "iris" },
            { k: "Weight", v: "68 kg", t: "Tuesday", i: "info" },
            { k: "Sleep", v: "6h 42m", t: "Last night", i: "gold" },
          ].map((r, i) => (
            <div key={i} className="lc" onClick={() => r.k === "Blood glucose" && nav("glucose")}>
              <div className={`lc-ic ${r.i}`}><Ic n="heart" s={20} sw={2}/></div>
              <div><div className="lc-t">{r.k}</div><div className="lc-s">{r.v} · {r.t}</div></div>
              <div className="lc-chev"><Ic n="chev" s={18}/></div>
            </div>
          ))}
          <div className="section-h"><span>Labs</span></div>
          <div className="lc" onClick={() => nav("labs")}>
            <div className="lc-ic gold"><Ic n="lab" s={20} sw={2}/></div>
            <div><div className="lc-t">HbA1c history</div><div className="lc-s">5 results · last 14 Apr</div></div>
            <div className="lc-chev"><Ic n="chev" s={18}/></div>
          </div>
        </div>
      </div>
      <TabBar active="health" onTab={nav}/>
    </div>
  );
}

window.Labs = Labs;
window.Meds = Meds;
window.Care = Care;
window.Chat = Chat;
window.ScanStart = ScanStart;
window.ScanResult = ScanResult;
window.RPM = RPM;
window.Health = Health;
