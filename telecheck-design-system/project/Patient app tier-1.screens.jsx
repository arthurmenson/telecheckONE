/* Patient app — Tier 1 screens */

// ── HOME ─────────────────────────────────────────────
const Home = ({ onNav, openDelegate, delegateMode }) => (
  <div className="app">
    <StatusBar/>
    <div className="content">
      <div className="h-top">
        <div className="h-date">MON · 20 APR</div>
        <div className="h-actions">
          <div className="h-ic"><Ic name="bell" size={18}/><span className="dot"/></div>
          <div className={`h-av ${delegateMode ? 'delegate' : ''}`} onClick={openDelegate}>
            {delegateMode ? 'KA' : 'AM'}
          </div>
        </div>
      </div>
      <div className="greet">
        <div className="greet-hello">Good morning,</div>
        <div className="greet-name">{delegateMode ? 'Kojo Asare' : 'Ama'}</div>
      </div>

      {delegateMode && (
        <div className="del-bar" onClick={openDelegate}>
          <span className="del-dot"/>
          <span className="del-text">You're acting for <b>Kojo Asare</b> · father · tap to switch</span>
          <span className="del-chev"><Ic name="chev" size={14} stroke={2}/></span>
        </div>
      )}

      <div className="focus">
        <Ring pct={40} />
        <div className="focus-k">Today's focus</div>
        <div className="focus-t">Take your evening metformin at 19:00</div>
        <div className="focus-b">Morning dose logged at 07:24. 2 of 5 care tasks done today — one refill in review, one lab scheduled Thursday.</div>
        <div className="focus-cta">
          <button className="btn-pri" onClick={()=>onNav('meds')}>Mark taken</button>
          <button className="btn-sec">Snooze 30 min</button>
        </div>
      </div>

      <div className="sect"><span className="sect-t">Your numbers</span><span className="sect-a">See all</span></div>
      <div className="metrics">
        <Metric k="Glucose" v="118" u="mg/dL" trend="-6 vs avg" trendDir="dn" color="var(--success-500)" spark={[132,128,140,119,122,116,118]}/>
        <Metric k="Blood pressure" v="124/78" u="" trend="Stable 7d" trendDir="flat" color="var(--info-500)" spark={[120,123,126,121,124,125,124]}/>
        <Metric k="Weight" v="68" u="kg" trend="-0.4 / wk" trendDir="dn" color="var(--teal-500)" spark={[70,69.5,69,68.8,68.4,68.2,68]}/>
        <Metric k="HbA1c" v="7.8" u="%" trend="Above 7.0" trendDir="up" color="var(--warning-500)" spark={[7.2,7.3,7.5,7.6,7.7,7.8,7.8]}/>
      </div>

      <AIPocket
        kind="LAB INTERPRETATION · 14 APR"
        title="Your HbA1c came back at 7.8%"
        body="Slightly above your 7.0% target. Dr. Mensah reviewed it this morning and suggests keeping your current dose and checking in at the 30 June appointment. No urgent action needed."
        source="Sources: labs from 14 Apr · diabetes program notes · Dr. Mensah review at 08:12"
        actions={['Open lab', 'What can I do?']}
      />

      <div className="sect"><span className="sect-t">Coming up</span></div>
      <div className="list-col" style={{marginBottom:16}}>
        <ListCard icon="pill" iconTone="teal" title="Metformin 500 mg · refill" sub="With Dr. Mensah · submitted 09:42" pill={{text:'In review', tone:'warn'}} onClick={()=>onNav('refill')} />
        <ListCard icon="video" iconTone="iris" title="Video consult · Dr. A. Mensah" sub="Wed 22 Apr · 10:30 · about your cough" onClick={()=>onNav('consult')}/>
        <ListCard icon="flask" iconTone="info" title="Lipid panel — home draw" sub="Thu 23 Apr · morning · fasting required" onClick={()=>onNav('labs')}/>
        <ListCard icon="heart" iconTone="gold" title="Weekly diabetes check-in" sub="Due today · 90 seconds" pill={{text:'Due', tone:'warn'}} onClick={()=>onNav('rpm')}/>
      </div>

      <div className="sect"><span className="sect-t">Tools</span></div>
      <div className="list-col">
        <ListCard icon="scan" iconTone="teal" title="Scan a meal" sub="Log carbs and calories with your camera" onClick={()=>onNav('scan')}/>
        <ListCard icon="chat" iconTone="iris" title="Ask a clinician" sub="Reply within 2 hours · typically faster" />
      </div>
    </div>
    <TabBar active="home" onNav={onNav}/>
  </div>
);

// ── REFILL ────────────────────────────────────────
const Refill = ({ onNav, onConfirm }) => (
  <div className="app">
    <StatusBar/>
    <div className="content">
      <SubHdr title="Refill" onBack={()=>onNav('home')} right={<div className="back-btn"><Ic name="phone" size={16}/></div>}/>
      <div className="big-title">
        <h1>Metformin 500 mg</h1>
        <p>Twice daily · 30-day supply · prescribed by Dr. A. Mensah</p>
      </div>

      <div className="med-hero">
        <div className="med-pill"><Ic name="pill" size={26}/></div>
        <div className="med-name">Request received</div>
        <div className="med-dose">Submitted today at 09:42 · est. 2 hours for review</div>
        <div className="med-stat"><span className="p-dot"/>In clinician review</div>
      </div>

      <div className="steps">
        <h4>Progress</h4>
        <div className="step done">
          <div><div className="bullet"/><div className="line"/></div>
          <div><div className="t">Request submitted</div><div className="st">Your order is in</div></div>
          <div className="time">09:42</div>
        </div>
        <div className="step current">
          <div><div className="bullet"/><div className="line"/></div>
          <div><div className="t">Dr. Mensah reviewing</div><div className="st">Checking your labs + interactions</div></div>
          <div className="time">~ 11:30</div>
        </div>
        <div className="step pending">
          <div><div className="bullet"/><div className="line"/></div>
          <div><div className="t">Pharmacy dispenses</div><div className="st">Payment on approval</div></div>
          <div className="time">—</div>
        </div>
        <div className="step pending">
          <div><div className="bullet"/></div>
          <div><div className="t">Delivered to your door</div><div className="st">Courier update on the day</div></div>
          <div className="time">22 Apr</div>
        </div>
      </div>

      <AIPocket
        kind="SAFETY CHECK"
        title="No interaction issues flagged"
        body="We checked metformin against your 3 active medications, your kidney and liver labs, and your active conditions. No signals raised."
        source="Medication Interaction Engine · model v2026.03 · 09:43"
        actions={['See detail', 'What was checked?']}
      />

      <div className="sum-row">
        <div><div className="k">Last dispensed</div><div className="v">22 Mar</div></div>
        <div><div className="k">Refills left</div><div className="v">2 of 5</div></div>
        <div><div className="k">Price</div><div className="v">GHS 45</div></div>
      </div>

      <div className="sect"><span className="sect-t">Delivering to</span><span className="sect-a">Change</span></div>
      <div className="list-col" style={{marginBottom:18}}>
        <ListCard icon="mapPin" iconTone="info" title="Home · Osu, Accra" sub="House 14, 2nd Ring Close · est. 22 Apr · GHS 10 delivery"/>
      </div>

      <button className="cta" onClick={onConfirm}>Confirm & pay GHS 55 on approval</button>
      <button className="cta ghost">Cancel refill</button>
      <div style={{fontSize:10.5, color:'var(--fg-3)', textAlign:'center', margin:'12px 24px 0', lineHeight:1.5}}>
        You'll be charged only after Dr. Mensah approves the request. Cancel any time before the pharmacy dispatches.
      </div>
    </div>
  </div>
);

// ── CONSULT INTAKE ──────────────────────────────────
const Consult = ({ onNav }) => {
  const [sel, setSel] = useState(2);
  const opts = [
    { t: 'Just today', sub: 'Started in the last 24 hours' },
    { t: 'A few days', sub: '2 to 6 days' },
    { t: 'More than a week', sub: '7 days or longer' },
    { t: 'More than a month', sub: 'Chronic or recurring' },
  ];
  return (
    <div className="app">
      <StatusBar/>
      <div className="content">
        <SubHdr title="Intake · question 2 of 6" onBack={()=>onNav('home')} right={<div className="back-btn"><Ic name="x" size={16} stroke={2}/></div>}/>
        <div className="progress-bar"><div style={{width: '33%'}}/></div>
        <div className="q-kicker">About your cough</div>
        <div className="q-title">How long have you been coughing?</div>
        {opts.map((o, i) => (
          <div key={i} className={`choice ${sel===i?'selected':''}`} onClick={()=>setSel(i)}>
            <div className="radio"/>
            <div>
              <div>{o.t}</div>
              <div style={{fontSize:11.5, color:'var(--fg-3)', marginTop:2, fontWeight:400}}>{o.sub}</div>
            </div>
          </div>
        ))}

        <div style={{marginTop: 14}}>
          <AIPocket
            kind="SAFETY REMINDER"
            title="If you're coughing up blood, call emergency now"
            body="You can reach Ghana Ambulance Service on 112 or tap the red banner that appears on your home screen."
            source="Safety protocol · §13 Emergency escalation"
            actions={['Call 112', 'Not applicable']}
          />
        </div>

        <button className="cta" style={{marginTop:16}} onClick={()=>onNav('home')}>Next question</button>
        <button className="cta ghost">Save draft for later</button>
      </div>
    </div>
  );
};

// ── LABS ──────────────────────────────────────────
const LabsChart = () => {
  const pts = [
    { x: 0,   y: 7.1 }, { x: 20,  y: 7.2 }, { x: 40, y: 7.3 },
    { x: 60,  y: 7.5 }, { x: 80,  y: 7.6 }, { x: 100, y: 7.8 },
  ];
  const W=320, H=110, pad=20;
  const minY = 6.5, maxY = 8.5;
  const norm = v => H - pad - ((v-minY)/(maxY-minY))*(H-2*pad);
  const mapX = x => pad + (x/100)*(W-2*pad);
  // Target band 6.5-7.0
  const y70 = norm(7.0), y65 = norm(6.5);
  const d = pts.map((p,i)=>`${i===0?'M':'L'}${mapX(p.x).toFixed(1)} ${norm(p.y).toFixed(1)}`).join(' ');
  const a = pts.map(p=>`${mapX(p.x).toFixed(1)},${norm(p.y).toFixed(1)}`).join(' ');
  return (
    <svg className="lab-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {/* target band */}
      <rect x={pad} y={y70} width={W-2*pad} height={y65-y70} fill="var(--success-50)" opacity="0.8"/>
      <line x1={pad} y1={y70} x2={W-pad} y2={y70} stroke="var(--success-500)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>
      <path d={`M${pad} ${H-pad} L${pad} ${pad} M${pad} ${H-pad} L${W-pad} ${H-pad}`} stroke="var(--border-subtle)" strokeWidth="1" fill="none"/>
      <path d={d} fill="none" stroke="var(--warning-500)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <circle key={i} cx={mapX(p.x)} cy={norm(p.y)} r={i===pts.length-1?4:2.8} fill={i===pts.length-1?'var(--warning-500)':'#fff'} stroke="var(--warning-500)" strokeWidth="2"/>
      ))}
      {/* axis labels */}
      {['Oct','Dec','Feb','Apr'].map((m,i)=>(
        <text key={m} x={pad + i*(W-2*pad)/3} y={H-4} fontSize="9" fontFamily="var(--font-sans)" fill="var(--fg-3)" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
};

const Labs = ({ onNav }) => (
  <div className="app">
    <StatusBar/>
    <div className="content">
      <SubHdr title="Labs" onBack={()=>onNav('home')} right={<div className="back-btn"><Ic name="plus" size={16} stroke={2}/></div>}/>
      <div className="big-title">
        <h1>HbA1c</h1>
        <p>Glycated haemoglobin · 6 results over 9 months</p>
      </div>

      <div className="lab-chart">
        <h3>Most recent · 14 Apr 2026</h3>
        <div className="lab-big">7.8<span className="unit">%</span></div>
        <div className="lab-delta"><Ic name="trend" size={12}/> +0.2 vs. last · target ≤ 7.0</div>
        <LabsChart/>
        <div className="lab-legend">
          <span className="lg"><span className="sw" style={{background:'var(--warning-500)'}}/>Your result</span>
          <span className="lg"><span className="sw" style={{background:'var(--success-500)'}}/>Target range</span>
        </div>
      </div>

      <AIPocket
        kind="WHAT THIS MEANS"
        title="Small rise, no urgent change"
        body="Three small increases over 4 months. Dr. Mensah noted that seasonal meals and a missed week of evening doses line up with the trend. Next step: consistent evening metformin for 6 weeks, then re-check."
        source="Based on: HbA1c history · medication log · Dr. Mensah's review 14 Apr 08:12"
        actions={['Set reminder', 'Message clinic']}
      />

      <div className="sect"><span className="sect-t">Full panel · 14 Apr</span><span className="sect-a">Share</span></div>
      <div className="lab-item"><div><div className="n">Fasting glucose</div><div className="s">Ref: 70–100 mg/dL</div></div><div className="val">132</div><div className="flag f-high">High</div></div>
      <div className="lab-item"><div><div className="n">Creatinine</div><div className="s">Ref: 0.6–1.2 mg/dL</div></div><div className="val">0.9</div><div className="flag f-ok">Normal</div></div>
      <div className="lab-item"><div><div className="n">eGFR</div><div className="s">Ref: ≥ 60 mL/min</div></div><div className="val">94</div><div className="flag f-ok">Normal</div></div>
      <div className="lab-item"><div><div className="n">ALT</div><div className="s">Ref: 7–56 U/L</div></div><div className="val">28</div><div className="flag f-ok">Normal</div></div>
      <div className="lab-item" style={{marginBottom:18}}><div><div className="n">Haemoglobin</div><div className="s">Ref: 12–16 g/dL</div></div><div className="val">11.2</div><div className="flag f-low">Low</div></div>
    </div>
  </div>
);

// ── RPM check-in ─────────────────────────────────
const RPM = ({ onNav }) => {
  const [lows, setLows] = useState('None');
  const [mood, setMood] = useState(3);
  const [missed, setMissed] = useState('0');
  const moods = [
    { e:'😟', l:'Rough' }, { e:'😕', l:'Meh' }, { e:'🙂', l:'OK' }, { e:'😊', l:'Good' }, { e:'😁', l:'Great' },
  ];
  return (
    <div className="app">
      <StatusBar/>
      <div className="content">
        <SubHdr title="Weekly check-in" onBack={()=>onNav('home')} right={<div className="back-btn"><Ic name="x" size={16} stroke={2}/></div>}/>
        <div className="big-title">
          <h1>This week in your diabetes care</h1>
          <p>Three quick questions. Takes about 90 seconds. Goes straight to Dr. Mensah's next review.</p>
        </div>

        <div className="rpm-q">
          <h4>Any low-sugar episodes this week?</h4>
          <div className="rpm-opts">
            {['None','One','More than one','Not sure'].map(o=>(
              <button key={o} className={`rpm-opt ${lows===o?'selected':''}`} onClick={()=>setLows(o)}>{o}</button>
            ))}
          </div>
        </div>

        <div className="rpm-q">
          <h4>Missed any doses this week?</h4>
          <div className="rpm-opts">
            {['0','1-2','3-4','5+'].map(o=>(
              <button key={o} className={`rpm-opt ${missed===o?'selected':''}`} onClick={()=>setMissed(o)}>{o}</button>
            ))}
          </div>
        </div>

        <div className="sect" style={{paddingTop:0}}><span className="sect-t">How are you feeling overall?</span></div>
        <div className="scale">
          {moods.map((m,i)=>(
            <div key={i} className={`scale-opt ${mood===i?'selected':''}`} onClick={()=>setMood(i)}>
              <div className="face">{m.e}</div><div>{m.l}</div>
            </div>
          ))}
        </div>

        <AIPocket
          kind="FOR YOUR CLINICIAN"
          title="Your trend looks stable"
          body="7 glucose readings this week in range. BP stable. With 2 missed evening doses, Dr. Mensah may suggest a reminder. Your answers are not shown to anyone else."
          source="Based on: 7 glucose + 5 BP readings · med log · last consult"
          actions={['Submit check-in', 'See what\u2019s shared']}
        />

        <button className="cta" style={{marginTop:16}} onClick={()=>onNav('home')}>Submit check-in</button>
      </div>
    </div>
  );
};

// ── SCAN ──────────────────────────────────────────
const Scan = ({ onNav }) => (
  <div className="app">
    <StatusBar/>
    <div className="content">
      <SubHdr title="Scan your meal" onBack={()=>onNav('home')} right={<div className="back-btn"><Ic name="mic" size={16}/></div>}/>
      <div className="big-title">
        <h1>Point at your plate</h1>
        <p>Results are best with good light. Carbs show up first — that's what matters for your glucose.</p>
      </div>
      <div className="scan-frame">
        <div className="scan-corners">
          <div className="sc-c tl"/><div className="sc-c tr"/><div className="sc-c bl"/><div className="sc-c br"/>
        </div>
        <div className="scan-line"/>
        <div className="scan-hint">Detecting: <b style={{color:'#fff'}}>Jollof rice with chicken</b></div>
      </div>

      <div className="result-card">
        <div className="result-t">Jollof rice with chicken</div>
        <div className="result-s">About 1 plate · 380g · confidence 86%</div>
        <div className="result-nuts">
          <div className="nut"><div className="k">Carbs</div><div className="v">72<span style={{fontSize:11, color:'var(--fg-3)', fontWeight:500}}>g</span></div></div>
          <div className="nut"><div className="k">Protein</div><div className="v">28<span style={{fontSize:11, color:'var(--fg-3)', fontWeight:500}}>g</span></div></div>
          <div className="nut"><div className="k">Fat</div><div className="v">18<span style={{fontSize:11, color:'var(--fg-3)', fontWeight:500}}>g</span></div></div>
          <div className="nut"><div className="k">kcal</div><div className="v">562</div></div>
        </div>
      </div>

      <AIPocket
        kind="FOR YOUR GLUCOSE"
        title="Expect a glucose bump around 14:30"
        body="This is a higher-carb plate. If you normally take metformin at lunch, keep to your usual dose — we'll watch your next reading."
        source="Based on: your last 30 days' glucose after similar meals"
        actions={['Log this meal', 'Adjust portion']}
      />

      <button className="cta" style={{marginTop:10}} onClick={()=>onNav('home')}>Log meal & set glucose reminder</button>
      <button className="cta ghost">Retake photo</button>
    </div>
  </div>
);

// ── MEDS (list) ──────────────────────────────────
const Meds = ({ onNav }) => (
  <div className="app">
    <StatusBar/>
    <div className="content">
      <div className="h-top">
        <div className="h-date">YOUR MEDS</div>
        <div className="h-actions">
          <div className="h-ic"><Ic name="plus" size={18} stroke={2}/></div>
        </div>
      </div>
      <div className="big-title">
        <h1>Medications</h1>
        <p>3 active · 1 in refill review · next dose 19:00</p>
      </div>

      <div className="sect"><span className="sect-t">Today</span><span className="sect-a">Schedule</span></div>
      <div className="list-col" style={{marginBottom:18}}>
        <ListCard icon="pill" iconTone="teal" title="Metformin 500 mg · evening" sub="Due 19:00 · with food" pill={{text:'Due 2h', tone:'warn'}} onClick={()=>onNav('refill')}/>
        <ListCard icon="pill" iconTone="teal" title="Metformin 500 mg · morning" sub="Taken 07:24 · on time" pill={{text:'Done', tone:'ok'}}/>
        <ListCard icon="pill" iconTone="gold" title="Lisinopril 10 mg" sub="Taken 07:22 · on time" pill={{text:'Done', tone:'ok'}}/>
      </div>

      <div className="sect"><span className="sect-t">Active prescriptions</span></div>
      <div className="list-col" style={{marginBottom:18}}>
        <ListCard icon="pill" iconTone="teal" title="Metformin 500 mg" sub="Twice daily · 3 refills left · Dr. Mensah" onClick={()=>onNav('refill')}/>
        <ListCard icon="pill" iconTone="gold" title="Lisinopril 10 mg" sub="Once daily · 4 refills left · Dr. Mensah"/>
        <ListCard icon="pill" iconTone="info" title="Atorvastatin 20 mg" sub="Once daily · 2 refills left · Dr. Owusu"/>
      </div>

      <AIPocket
        kind="TIP FOR THIS WEEK"
        title="Your evening doses are slipping a bit"
        body="5 of 7 evenings on time over the last week. Want to move your reminder from 20:00 to 19:00, closer to when you usually eat?"
        source="Based on: your med log · reminder settings"
        actions={['Move to 19:00', 'Keep as is']}
      />
    </div>
    <TabBar active="meds" onNav={onNav}/>
  </div>
);

// ── Delegate sheet ─────────────────────────────────
const DelegateSheet = ({ active, onPick, onClose }) => (
  <>
    <div className="sheet-scrim" onClick={onClose}/>
    <div className="sheet">
      <div className="sheet-handle"/>
      <div className="sheet-title">Who are you caring for?</div>
      <div className="sheet-sub">Switch context to see that person's health, meds and messages. They're notified each time you switch in.</div>
      <div className={`acct-row ${active==='me'?'active':''}`} onClick={()=>onPick('me')}>
        <div className="acct-av me">AM</div>
        <div className="main"><div className="n">Ama Mensah · myself</div><div className="r">Primary account</div></div>
        {active==='me' && <div className="active-dot"/>}
      </div>
      <div className={`acct-row ${active==='kojo'?'active':''}`} onClick={()=>onPick('kojo')}>
        <div className="acct-av k1">KA</div>
        <div className="main"><div className="n">Kojo Asare · father</div><div className="r">Full access · granted 12 Jan</div></div>
        {active==='kojo' && <div className="active-dot"/>}
      </div>
      <div className={`acct-row ${active==='esi'?'active':''}`} onClick={()=>onPick('esi')}>
        <div className="acct-av k2">EA</div>
        <div className="main"><div className="n">Esi Asare · daughter, 7</div><div className="r">Paediatric mode · granted 3 Mar</div></div>
        {active==='esi' && <div className="active-dot"/>}
      </div>
      <div className="sheet-add">+ Add a family member</div>
    </div>
  </>
);

Object.assign(window, { Home, Refill, Consult, Labs, RPM, Scan, Meds, DelegateSheet });
