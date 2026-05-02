/* Patient UI kit — screens with colorful lab donuts, AI-in-the-loop, richer home */

// ── Shared bits ────────────────────────────────────────────────
const PASpark = () => (
  <svg className="spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3 L15 10 L22 12 L15 14 L13 21 L11 14 L4 12 L11 10 Z"/>
    <circle cx="19.5" cy="5.5" r="1.1" fill="currentColor" stroke="none"/>
  </svg>
);

const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const paths = {
    pill: <><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></>,
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    calendar: <><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    chev: <path d="m9 18 6-6-6-6"/>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    flask: <><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></>,
    video: <><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></>,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" y2="13" x2="12"/><line x1="12" y1="17" y2="17.01" x2="12"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const TabBar = ({ active, onTab }) => (
  <div className="tabbar">
    {[
      { id: 'home', icon: 'home', label: 'Home' },
      { id: 'meds', icon: 'pill', label: 'Medications' },
      { id: 'health', icon: 'activity', label: 'Health' },
      { id: 'me', icon: 'user', label: 'Account' },
    ].map(t => (
      <div key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onTab?.(t.id)}>
        <Icon name={t.icon} size={22} />
        <span>{t.label}</span>
      </div>
    ))}
  </div>
);

const StatusChip = ({ kind, label }) => (
  <span className={`status s-${kind}`}><span className="dot" style={{ background: 'currentColor' }}></span>{label}</span>
);

// Colorful lab donut ring — big, readable
const LabDonut = ({ label, value, unit, pct, color, target, delta }) => {
  const r=26, c=2*Math.PI*r;
  return (
    <div className="lab-donut">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeOpacity="0.15" strokeWidth="7"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} transform="rotate(-90 36 36)"/>
        <text x="36" y="39" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--fg-1)" fontFamily="var(--font-sans)">{value}</text>
        <text x="36" y="51" textAnchor="middle" fontSize="8" fill="var(--fg-3)" fontFamily="var(--font-sans)">{unit}</text>
      </svg>
      <div className="lab-donut-meta">
        <div className="lab-donut-l">{label}</div>
        <div className="lab-donut-t" style={{color}}>{delta}</div>
        <div className="lab-donut-r">Target {target}</div>
      </div>
    </div>
  );
};

// AI-in-the-loop inline card — renders differently per kind
const AIInline = ({ kind, title, body, source, actions = [] }) => {
  const toneMap = {
    'interaction': { tag: 'DRUG INTERACTION · TELECHECK AI', bg: 'ai-inline ai-interaction' },
    'schedule':    { tag: 'SCHEDULING · TELECHECK AI',       bg: 'ai-inline ai-schedule' },
    'lab':         { tag: 'LAB INTERPRETATION · TELECHECK AI', bg: 'ai-inline ai-lab' },
    'safety':      { tag: 'SAFETY CHECK · TELECHECK AI',     bg: 'ai-inline ai-safety' },
    'default':     { tag: 'TELECHECK AI',                    bg: 'ai-inline' },
  };
  const t = toneMap[kind] || toneMap.default;
  return (
    <div className={t.bg}>
      <div className="ai-inline-head"><PASpark/> {t.tag}</div>
      <div className="ai-inline-title">{title}</div>
      <div className="ai-inline-body">{body}</div>
      {source && <div className="ai-inline-source">{source}</div>}
      {actions.length > 0 && (
        <div className="ai-inline-actions">
          {actions.map((a, i) => (
            <button key={i} className={i===0 ? 'ai-a-pri' : 'ai-a-sec'}>{a}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// Keep the old AICard for other screens that use it
const AICard = ({ kind, title, body, source }) => (
  <div className="pa-ai">
    <div className="pa-ai-head"><PASpark /> Telecheck AI {kind && `· ${kind}`}</div>
    <div className="pa-ai-title">{title}</div>
    <div className="pa-ai-body">{body}</div>
    {source && <div className="pa-ai-source">{source}</div>}
  </div>
);

// ── Screen: Home — redesigned for visual appeal ───────────────────────
const PAHome = ({ onNav }) => (
  <div className="pa">
    <div className="pa-hero">
      <div className="pa-hero-top">
        <div>
          <div className="pa-greet">Monday · 20 April</div>
          <div className="pa-name">Ɛte sɛn, Ama?</div>
          <div className="pa-sub">2 care tasks today · feeling stable</div>
        </div>
        <div className="pa-av">AM</div>
      </div>

      <div className="pa-focus-card">
        <div className="pa-focus-k">TODAY'S FOCUS</div>
        <div className="pa-focus-t">Evening metformin at 19:00</div>
        <div className="pa-focus-b">Morning dose logged 07:24 · 2 of 5 tasks done</div>
        <div style={{display:'flex', gap:8, marginTop:14}}>
          <button className="pa-btn-pri">Mark taken</button>
          <button className="pa-btn-ghost">Snooze 30 min</button>
        </div>
      </div>
    </div>

    <div className="pa-scroll">
      <div className="section-h"><span>Lab results · 14 Apr</span><span className="section-link">All labs →</span></div>
      <div className="lab-donut-grid">
        <LabDonut label="HbA1c" value="7.8" unit="%" pct={78} color="#c28320" target="≤7.0" delta="+0.2 ▲"/>
        <LabDonut label="Fasting glucose" value="132" unit="mg/dL" pct={82} color="#c8402f" target="70–100" delta="High"/>
        <LabDonut label="eGFR" value="94" unit="mL/min" pct={94} color="#2a8a4a" target="≥60" delta="Normal"/>
        <LabDonut label="Haemoglobin" value="11.2" unit="g/dL" pct={70} color="#2b6cb0" target="12–16" delta="Low"/>
      </div>

      <AIInline kind="lab"
        title="Small HbA1c rise — no urgent change needed"
        body="Three small increases over 4 months. Seasonal meals and 2 missed evening doses this month line up with the trend. Dr. Mensah suggests consistent evening metformin for 6 weeks, then re-check."
        source="Sources: HbA1c history · med log · Dr. Mensah review 14 Apr 08:12"
        actions={['Set evening reminder', 'Message clinic']}
      />

      <AIInline kind="interaction"
        title="Heads up: ibuprofen + your lisinopril"
        body="You added ibuprofen to your pharmacy basket. Taken with lisinopril it can reduce your blood pressure control and affect kidney function. Paracetamol is safer with your current regimen."
        source="Checked against: lisinopril 10 mg · eGFR 94 · recent BP 124/78"
        actions={['Swap to paracetamol', 'Keep ibuprofen']}
      />

      <AIInline kind="schedule"
        title="Dr. Mensah has Thursday 23 Apr at 10:30 open"
        body="That matches your usual morning window and keeps your 6-week re-check on track. Home lab draw at 08:00 same day fits before the consult."
        source="Based on: your availability pattern · Dr. Mensah's calendar · lab scheduling rules"
        actions={['Book both', 'See other times']}
      />

      <div className="section-h"><span>Your numbers</span><span className="section-link">See all →</span></div>
      <div className="hz-row">
        <div className="metric">
          <div className="k">Blood glucose</div>
          <div className="v">118 <span style={{fontSize:12, fontWeight:500, color:'var(--fg-3)'}}>mg/dL</span></div>
          <div className="t">Measured 07:42 · in range</div>
        </div>
        <div className="metric">
          <div className="k">Blood pressure</div>
          <div className="v">124/78</div>
          <div className="t">Yesterday 20:10 · stable</div>
        </div>
        <div className="metric">
          <div className="k">Weight</div>
          <div className="v">68 <span style={{fontSize:12, fontWeight:500, color:'var(--fg-3)'}}>kg</span></div>
          <div className="t">-0.4 kg / week</div>
        </div>
      </div>

      <div className="section-h"><span>Coming up</span></div>
      <div className="pa-card" onClick={() => onNav?.('refill')} style={{cursor:'pointer'}}>
        <div className="pa-card-head">
          <div>
            <div className="pa-card-title">Refill · metformin 500 mg</div>
            <div className="pa-card-body">With Dr. Mensah since 09:42. Notification when approved.</div>
          </div>
          <StatusChip kind="review" label="In review" />
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        <div className="pa-card" style={{display:'flex', gap:10, alignItems:'center', cursor:'pointer'}}><Icon name="chat" size={20} color="var(--primary)"/><div style={{fontSize:13, fontWeight:600}}>Ask a clinician</div></div>
        <div className="pa-card" style={{display:'flex', gap:10, alignItems:'center', cursor:'pointer'}}><Icon name="plus" size={20} color="var(--primary)"/><div style={{fontSize:13, fontWeight:600}}>Scan food</div></div>
      </div>
    </div>
    <TabBar active="home" onTab={onNav} />
  </div>
);

// ── Screen: Refill ─────────────────────────────────────────────
const PARefill = ({ onNav }) => (
  <div className="pa">
    <div className="pa-hdr">
      <div className="pa-greet" style={{cursor:'pointer'}} onClick={()=>onNav?.('home')}>← Home</div>
      <div className="pa-name" style={{fontSize:20, marginTop:4}}>Refill</div>
    </div>
    <div className="pa-scroll">
      <div className="pa-card">
        <div className="pa-card-head">
          <div>
            <div className="pa-card-title">Metformin 500 mg</div>
            <div className="pa-card-body">Twice daily · 30-day supply · Dr. A. Mensah</div>
          </div>
          <StatusChip kind="review" label="In review" />
        </div>
        <div style={{display:'flex', gap:12, marginTop:14, paddingTop:14, borderTop:'1px solid var(--border-subtle)'}}>
          <div style={{flex:1}}><div className="pa-card-meta" style={{marginTop:0}}>Last dispensed</div><div style={{fontSize:13, fontWeight:600}}>22 March</div></div>
          <div style={{flex:1}}><div className="pa-card-meta" style={{marginTop:0}}>Refills left</div><div style={{fontSize:13, fontWeight:600}}>2</div></div>
          <div style={{flex:1}}><div className="pa-card-meta" style={{marginTop:0}}>Price</div><div style={{fontSize:13, fontWeight:600}}>GHS 45</div></div>
        </div>
      </div>

      <AIInline kind="interaction"
        title="No interaction issues flagged"
        body="We checked metformin against your 3 active medications, kidney and liver labs, and active conditions. No signals."
        source="Medication Interaction Engine · v2026.03"
        actions={['See what was checked']}
      />

      <div className="section-h"><span>Delivery</span></div>
      <div className="pa-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:14, fontWeight:600}}>Home · Osu, Accra</div>
            <div style={{fontSize:12, color:'var(--fg-3)', marginTop:3}}>House 14, 2nd Ring Close</div>
          </div>
          <span className="pill">Change</span>
        </div>
        <div style={{fontSize:12, color:'var(--fg-3)', marginTop:10, display:'flex', gap:6, alignItems:'center'}}>
          <Icon name="clock" size={13}/> Estimated 22 Apr · GHS 10 delivery
        </div>
      </div>

      <button className="pa-btn" style={{marginTop:4}} onClick={()=>onNav?.('confirm')}>Confirm &amp; pay GHS 55</button>
      <button className="pa-btn pa-btn-sec">Cancel refill</button>
    </div>
    <TabBar active="meds" onTab={onNav} />
  </div>
);

// ── Screen: Consult intake ─────────────────────────────────────
const PAConsult = ({ onNav }) => (
  <div className="pa">
    <div className="pa-hdr">
      <div className="pa-greet" style={{cursor:'pointer'}} onClick={()=>onNav?.('home')}>← Home</div>
      <div className="pa-name" style={{fontSize:20, marginTop:4}}>Describe what's going on</div>
    </div>
    <div className="pa-scroll">
      <div style={{fontSize:13, color:'var(--fg-2)', lineHeight:1.5}}>
        Your answers go to Dr. Mensah before the consult. Clinical terms are explained as they come up.
      </div>

      <div className="pa-card">
        <div style={{fontSize:12, fontWeight:700, color:'var(--fg-3)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Question 2 of 6</div>
        <div style={{fontSize:16, fontWeight:600, margin:'6px 0 14px'}}>How long have you had this cough?</div>
        {['Today', 'A few days', 'More than a week', 'More than a month'].map((o, i) => (
          <label key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 2px', borderTop: i ? '1px solid var(--border-subtle)' : 0, cursor:'pointer'}}>
            <input type="radio" name="duration" style={{accentColor:'var(--primary)'}}/>
            <span style={{fontSize:14}}>{o}</span>
          </label>
        ))}
      </div>

      <AIInline kind="schedule"
        title="Dr. Mensah has a video slot in 35 minutes"
        body="Based on your answers, this sounds urgent-ish. There's a 10:30 slot open — want it?"
        source="Based on: your 2 answers so far · consult urgency model"
        actions={['Book 10:30', 'Later this week']}
      />

      <AIInline kind="safety"
        title="If you're coughing up blood, call 112 now"
        body="Ghana Ambulance Service on 112. Tap the red banner at the top of any screen for emergency options."
        source="Safety protocol · §13"
      />

      <button className="pa-btn" onClick={()=>onNav?.('home')}>Next question</button>
    </div>
    <TabBar active="home" onTab={onNav} />
  </div>
);

// ── Screen: RPM check-in ───────────────────────────────────────
const PARPM = ({ onNav }) => (
  <div className="pa">
    <div className="pa-hdr">
      <div className="pa-greet" style={{cursor:'pointer'}} onClick={()=>onNav?.('home')}>← Home</div>
      <div className="pa-name" style={{fontSize:20, marginTop:4}}>Weekly check-in</div>
    </div>
    <div className="pa-scroll">
      <div style={{fontSize:13, color:'var(--fg-2)', lineHeight:1.5}}>
        Three quick questions for your diabetes program. Takes about 90 seconds.
      </div>
      <div className="pa-card">
        <div style={{fontSize:15, fontWeight:600, marginBottom:12}}>Have you had any low-sugar episodes this week?</div>
        <div style={{display:'flex', gap:8}}>
          <button className="pa-btn pa-btn-sec pa-btn-sm" style={{flex:1}}>No</button>
          <button className="pa-btn pa-btn-sec pa-btn-sm" style={{flex:1}}>One</button>
          <button className="pa-btn pa-btn-sec pa-btn-sm" style={{flex:1}}>More than one</button>
        </div>
      </div>
      <div className="pa-card">
        <div style={{fontSize:15, fontWeight:600, marginBottom:12}}>How are you feeling overall?</div>
        <div style={{display:'flex', gap:8, justifyContent:'space-between'}}>
          {['Rough', 'Meh', 'OK', 'Good', 'Great'].map(m => (
            <button key={m} className="pa-btn pa-btn-sec pa-btn-sm" style={{flex:1, padding:'10px 4px'}}>{m}</button>
          ))}
        </div>
      </div>
      <AIInline kind="schedule"
        title="Your trend is stable — no extra consult needed"
        body="Glucose + BP averages in range this week. Your next 6-week re-check holds for 30 Jun."
        source="Based on: 7 readings this week, medication log"
        actions={['Confirm 30 Jun', 'Move it up']}
      />
      <button className="pa-btn" onClick={()=>onNav?.('home')}>Submit check-in</button>
    </div>
    <TabBar active="health" onTab={onNav} />
  </div>
);

Object.assign(window, { PAHome, PARefill, PAConsult, PARPM, Icon, PASpark, AICard, AIInline, LabDonut, StatusChip, TabBar });
