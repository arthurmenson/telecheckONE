// v2 — CARE detail screens & sheets (wired to Care tab)
const { useState: uSCD } = React;

// ── Threaded chat detail (per-person) ──
const THREADS = {
  "dr-mensah": {
    name: "Dr. Akosua Mensah",
    role: "Primary care · responds ~12min",
    avatar: "DM", color: "teal",
    msgs: [
      { r: "them", t: "Let's plan a 6-week re-check. Lab draw Thursday 08:00 work for you?", tm: "09:12" },
      { r: "me",   t: "Yes, Thursday 08:00 is good. Will the home draw come to Osu?",        tm: "09:14" },
      { r: "them", t: "Yes — MobiLabs will be there. Kidney panel + HbA1c + lipids.",        tm: "09:15" },
    ],
    suggestions: ["Confirm Thursday", "Move to 09:00", "Ask about dose change"],
  },
  "nurse-adjoa": {
    name: "Nurse Adjoa Boateng",
    role: "Diabetes coach · replies within 2h",
    avatar: "NA", color: "iris",
    msgs: [
      { r: "them", t: "How are your evening readings this week?", tm: "Yesterday" },
      { r: "me",   t: "Better since I moved metformin to 19:00. 118 fasting today.", tm: "Yesterday" },
      { r: "them", t: "That's the trend we wanted. Keep it for 2 more weeks and we'll re-check.", tm: "Yesterday" },
    ],
    suggestions: ["Share this week's log", "Book a call", "Ask about diet"],
  },
  "pharmacy": {
    name: "Mobipharm Osu",
    role: "Pharmacy · M–Sat 08:00–20:00",
    avatar: "MP", color: "warn",
    msgs: [
      { r: "them", t: "Your metformin is being prepared. Dispatch ETA 11:30.", tm: "09:31" },
      { r: "them", t: "Rider Kofi is 6 min away.", tm: "11:24" },
    ],
    suggestions: ["Track rider", "Change delivery address", "Request pickup instead"],
  },
  "kojo": {
    name: "Kojo Mensah",
    role: "Son · shared care · caregiver",
    avatar: "KO", color: "info",
    msgs: [
      { r: "them", t: "Shared: dad's BP log from Sunday — 142/88.", tm: "Sun" },
      { r: "me",   t: "Thanks. I'll flag Dr. Owusu.", tm: "Sun" },
    ],
    suggestions: ["Message Dr. Owusu", "Start a family thread", "Ask Kojo for updated med list"],
  },
  "support": {
    name: "Telecheck support",
    role: "Support · 24/7 · English + Twi",
    avatar: "TC", color: "gold",
    msgs: [
      { r: "them", t: "New — Community events on your conditions. See schedule?", tm: "Mon" },
    ],
    suggestions: ["See events", "Pause these notifications", "Something else"],
  },
};

function ThreadScreen({ nav, toast, threadId = "dr-mensah" }) {
  const t = THREADS[threadId] || THREADS["dr-mensah"];
  const [draft, setDraft] = uSCD("");
  const [msgs, setMsgs] = uSCD(t.msgs);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { r: "me", t: text, tm: "now" }]);
    setDraft("");
    setTimeout(() => {
      setMsgs(m => [...m, { r: "them", t: "Got it — I'll get back to you shortly.", tm: "now" }]);
    }, 900);
  };

  return (
    <div className="app">
      <SB2/>
      <Sub2 title={t.name} onBack={() => nav("care")} right={
        <button className="ic-btn" onClick={() => toast("Call · voice")}><Ic2 n="phone" s={18}/></button>
      }/>
      <div style={{ padding: "0 16px 8px", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-1)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "4px 0 12px" }}>
          <div className={`lc-ic ${t.color}`} style={{ fontWeight: 700, fontSize: 13 }}>{t.avatar}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{t.role}</div>
          </div>
        </div>
      </div>
      <div className="scroll" style={{ padding: "16px", background: "var(--surface-0)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.r === "me" ? "flex-end" : "flex-start", maxWidth: "80%", padding: "10px 12px", borderRadius: 14, background: m.r === "me" ? "var(--teal-500)" : "var(--surface-1)", color: m.r === "me" ? "#fff" : "var(--fg-1)", fontSize: 13.5, lineHeight: 1.45, border: m.r === "me" ? "none" : "1px solid var(--border-subtle)", marginLeft: m.r === "me" ? "auto" : 0 }}>
              {m.t}
              <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{m.tm}</div>
            </div>
          ))}
        </div>
        {msgs.length === t.msgs.length && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.08em", fontWeight: 700, color: "var(--fg-3)", marginBottom: 8 }}>QUICK REPLIES</div>
            <div style={{ display: "grid", gap: 6 }}>
              {t.suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", color: "var(--fg-1)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-1)", display: "flex", gap: 8 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send(draft)} placeholder="Type a message…" style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid var(--border-subtle)", fontSize: 13, fontFamily: "inherit" }}/>
        <button onClick={() => send(draft)} style={{ padding: "0 16px", borderRadius: 20, background: "var(--teal-500)", color: "#fff", border: 0, fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Send</button>
      </div>
    </div>
  );
}

// ── Lab draw detail ──
function LabDrawSheet({ onClose, toast, nav }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Home lab draw · Thursday</div>
        <div className="sheet-s">08:00 · MobiLabs phlebotomist · 15 min</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div className="section-h"><span>Tests ordered</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">HbA1c</span><span className="v ok">Ordered</span></div>
            <div className="extract-row"><span className="k">Lipid panel</span><span className="v ok">Ordered</span></div>
            <div className="extract-row"><span className="k">Kidney function (eGFR, creatinine)</span><span className="v ok">Ordered</span></div>
            <div className="extract-row"><span className="k">Liver (ALT, AST)</span><span className="v ok">Ordered</span></div>
          </div>
          <div className="section-h"><span>Preparation</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">Fasting</span><span className="v" style={{ color: "var(--warning-700)", fontFamily: "inherit", fontWeight: 600 }}>12h required</span></div>
            <div className="extract-row"><span className="k">Water</span><span className="v ok">Allowed</span></div>
            <div className="extract-row"><span className="k">Medication</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>Take as normal</span></div>
          </div>
          <div className="section-h"><span>Address</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">House 14 · Osu · Accra</span><span className="v" style={{ color: "var(--teal-700)", fontFamily: "inherit", fontWeight: 500 }}>Edit</span></div>
          </div>
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "var(--n-50)", fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.5 }}>
            You'll get a text 30 min before arrival. Results land in your record within 24h and trigger an AI interpretation card you can review.
          </div>
          <button className="cta" style={{ marginTop: 18 }} onClick={() => { toast("Confirmed · reminder set"); onClose(); }}>Confirm appointment</button>
          <button className="cta g" onClick={() => { toast("Reschedule opened"); onClose(); }}>Reschedule</button>
        </div>
      </div>
    </>
  );
}

// ── Reschedule sheet ──
function RescheduleSheet({ onClose, toast }) {
  const slots = ["Today 14:00", "Today 16:30", "Tomorrow 09:00", "Tomorrow 11:00", "Thu 10:30", "Thu 15:00"];
  const [pick, setPick] = uSCD(null);
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Reschedule · Dr. Mensah</div>
        <div className="sheet-s">Pick a new time · current: today 10:30</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {slots.map((s, i) => (
              <button key={i} onClick={() => setPick(s)} style={{ padding: "14px 12px", borderRadius: 12, background: pick === s ? "var(--teal-50)" : "var(--surface-1)", border: `1px solid ${pick === s ? "var(--teal-500)" : "var(--border-subtle)"}`, color: "var(--fg-1)", fontSize: 13, fontWeight: pick === s ? 600 : 500, fontFamily: "inherit", cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--warning-50)", color: "var(--warning-700)", fontSize: 11.5, lineHeight: 1.45 }}>
            Cancelling within 2h of the slot incurs a GHS 30 fee.
          </div>
          <button className="cta" style={{ marginTop: 18, background: pick ? "var(--teal-500)" : "var(--n-200)", color: pick ? "#fff" : "var(--fg-3)" }} disabled={!pick} onClick={() => { toast(`Moved to ${pick}`); onClose(); }}>
            Move appointment
          </button>
          <button className="cta g" onClick={() => { toast("Appointment cancelled · GHS 0"); onClose(); }}>Cancel instead</button>
        </div>
      </div>
    </>
  );
}

// ── Team member profile sheet ──
const TEAM = {
  "mensah": { name: "Dr. Akosua Mensah", role: "Primary care physician", since: "November 2024", color: "teal", avatar: "DM",
    bio: "General practice with special interest in diabetes and cardiometabolic conditions. 12 years · Korle-Bu & Lagoon Hospital.",
    scopes: ["Full record", "Prescribing", "Lab ordering", "Refer out"],
    nextAvailable: "Today 10:30 (you're booked) · Thu 09:00", rating: "4.9 · 284 visits",
    threadId: "dr-mensah",
  },
  "adjoa": { name: "Nurse Adjoa Boateng", role: "Diabetes coach · async", since: "February 2025", color: "iris", avatar: "NA",
    bio: "RN, 8 years · diabetes education, lifestyle coaching in Twi & English. Async chat only — no direct prescribing.",
    scopes: ["Vitals", "Adherence logs", "Care plan comments"],
    nextAvailable: "Replies within 2h · Mon–Sat", rating: "4.8 · weekly check-ins",
    threadId: "nurse-adjoa",
  },
  "pharmacy": { name: "Mobipharm Osu", role: "Partner pharmacy", since: "November 2024", color: "warn", avatar: "MP",
    bio: "Licensed retail pharmacy · Osu branch. Dispenses, delivers, and flags interactions back to the clinician.",
    scopes: ["Active prescriptions", "Delivery address", "Insurance"],
    nextAvailable: "Mon–Sat 08:00–20:00", rating: "4.7 · 340 deliveries",
    threadId: "pharmacy",
  },
};

function TeamSheet({ memberId, onClose, toast, nav }) {
  const m = TEAM[memberId];
  if (!m) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "4px 0 14px" }}>
            <div className={`lc-ic ${m.color}`} style={{ width: 56, height: 56, fontSize: 18, fontWeight: 700 }}>{m.avatar}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.005em" }}>{m.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{m.role}</div>
              <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{m.rating}</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5, padding: "12px 14px", borderRadius: 12, background: "var(--n-50)" }}>{m.bio}</div>

          <div className="section-h"><span>Access they have</span></div>
          <div className="extract">
            {m.scopes.map((s, i) => (
              <div key={i} className="extract-row">
                <span className="k">{s}</span><span className="v ok">Granted</span>
              </div>
            ))}
            <div className="extract-row"><span className="k">On your record since</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{m.since}</span></div>
            <div className="extract-row"><span className="k">Next available</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{m.nextAvailable}</span></div>
          </div>

          <button className="cta" style={{ marginTop: 18 }} onClick={() => { onClose(); nav(`thread-${m.threadId}`); }}>Open conversation</button>
          <button className="cta g" onClick={() => { toast("Access revoked · audit log updated"); onClose(); }}>Revoke access</button>
        </div>
      </div>
    </>
  );
}

// ── Program offer sheet (enroll an available program) ──
function ProgramOfferSheet({ program, onClose, toast }) {
  if (!program) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">{program.name}</div>
        <div className="sheet-s">{program.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div className="section-h"><span>Invite details</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">For</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{program.who}</span></div>
            <div className="extract-row"><span className="k">Invited by</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{program.by}</span></div>
            <div className="extract-row"><span className="k">Monthly</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{program.price}</span></div>
            <div className="extract-row"><span className="k">Commitment</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{program.commit}</span></div>
          </div>
          <div className="section-h"><span>What's included</span></div>
          <div style={{ display: "grid", gap: 6 }}>
            {program.includes.map((x, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "var(--fg-2)", padding: "8px 12px", borderRadius: 8, background: "var(--n-50)" }}>• {x}</div>
            ))}
          </div>
          <button className="cta" style={{ marginTop: 18 }} onClick={() => { toast(`${program.name} enrolled · clinician notified`); onClose(); }}>Accept & enroll</button>
          <button className="cta g" onClick={() => { toast("Declined · invite archived"); onClose(); }}>Decline invite</button>
        </div>
      </div>
    </>
  );
}

// ── Log intake sheet (metformin, BP, etc.) ──
function LogIntakeSheet({ log, onClose, toast }) {
  if (!log) return null;
  const [val, setVal] = uSCD(log.defaultVal || "");
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">{log.title}</div>
        <div className="sheet-s">{log.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          {log.kind === "taken" ? (
            <div style={{ display: "grid", gap: 8 }}>
              {["Taken as scheduled", "Taken · late", "Skipped on purpose", "Missed"].map((opt, i) => (
                <button key={i} onClick={() => { toast(`${log.title} · ${opt}`); onClose(); }} style={{ textAlign: "left", padding: "14px 16px", borderRadius: 12, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", color: "var(--fg-1)", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer" }}>{opt}</button>
              ))}
            </div>
          ) : (
            <>
              <input value={val} onChange={e => setVal(e.target.value)} placeholder={log.placeholder} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border-strong)", fontSize: 18, fontFamily: "inherit", boxSizing: "border-box", textAlign: "center", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}/>
              <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--fg-3)", marginTop: 8 }}>{log.unit}</div>
            </>
          )}

          {log.ranges && (
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--n-50)", fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
              Target range: <b>{log.ranges}</b>
            </div>
          )}

          {log.kind !== "taken" && (
            <button className="cta" style={{ marginTop: 18, background: val ? "var(--teal-500)" : "var(--n-200)", color: val ? "#fff" : "var(--fg-3)" }} disabled={!val} onClick={() => { toast(`${log.title} logged · ${val}`); onClose(); }}>Save reading</button>
          )}
          <button className="cta g" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// ── Document viewer sheet ──
function DocSheet({ doc, onClose, toast }) {
  if (!doc) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">{doc.title}</div>
        <div className="sheet-s">{doc.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
          <div style={{ aspectRatio: "3/4", borderRadius: 12, background: "#fff", border: "1px solid var(--border-subtle)", padding: 18, fontSize: 10, color: "var(--fg-2)", lineHeight: 1.5, maxHeight: 220, overflow: "hidden", position: "relative" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-1)", marginBottom: 10 }}>{doc.title}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>TELECHECK · {doc.sub}</div>
            <div>{doc.body}</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, #fff, transparent)" }}/>
          </div>
          <button className="cta" style={{ marginTop: 18 }} onClick={() => { toast("PDF downloaded"); onClose(); }}>Download PDF</button>
          <button className="cta g" onClick={() => { toast("Shared with care team"); onClose(); }}>Share</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ThreadScreen, LabDrawSheet, RescheduleSheet, TeamSheet, ProgramOfferSheet, LogIntakeSheet, DocSheet, THREADS, TEAM });
