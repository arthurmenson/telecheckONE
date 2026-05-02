/* Clinician console components */

const CSpark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3 L15 10 L22 12 L15 14 L13 21 L11 14 L4 12 L11 10 Z"/>
    <circle cx="19.5" cy="5.5" r="1.1" fill="currentColor" stroke="none"/>
  </svg>
);

const Sidebar = ({ active = 'queue' }) => (
  <div className="side">
    <div className="side-brand">
      <div className="side-brand-mark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13l4 0 2-5 4 10 2-5 4 0"/></svg>
      </div>
      <div className="side-brand-name">Telecheck</div>
    </div>
    <div className="side-section">Clinical</div>
    <div className={`side-item ${active==='queue'?'active':''}`}><span>Review queue</span><span className="side-badge">12</span></div>
    <div className="side-item"><span>Live consults</span></div>
    <div className="side-item"><span>My patients</span></div>
    <div className="side-item"><span>Messages</span><span className="side-badge" style={{background:'var(--warning)'}}>3</span></div>
    <div className="side-section">Programs</div>
    <div className="side-item">Diabetes · RPM</div>
    <div className="side-item">Hypertension · RPM</div>
    <div className="side-item">Refill programs</div>
    <div className="side-section">Oversight</div>
    <div className="side-item">AI signal log</div>
    <div className="side-item">Audit trail</div>
    <div className="side-user">
      <div className="side-av">AM</div>
      <div>
        <div className="side-user-name">Dr. A. Mensah</div>
        <div className="side-user-role">Attending · Accra</div>
      </div>
    </div>
  </div>
);

const Topbar = () => (
  <div className="topbar">
    <div className="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
      <span>Search patients, prescriptions, audit events…</span>
    </div>
    <div style={{display:'flex', gap:14, alignItems:'center', fontSize:13, color:'var(--fg-3)'}}>
      <span>Mon 20 Apr · 10:42 GMT</span>
      <span style={{padding:'4px 10px', background:'var(--primary-soft)', color:'var(--teal-700)', borderRadius:9999, fontSize:11, fontWeight:600}}>Ghana · Live</span>
    </div>
  </div>
);

const QUEUE = [
  { id:1, name:'Ama K. Owusu', kind:'Refill · metformin 500 mg BID', time:'12m', sigs:['sev','mod','mon'], ai:true, sel:true },
  { id:2, name:'Kojo Owusu', kind:'Async consult · persistent cough', time:'38m', sigs:['mon'], ai:true },
  { id:3, name:'Esi A. Tetteh', kind:'Refill · losartan 50 mg', time:'1h 4m', sigs:[] },
  { id:4, name:'Yaw Boateng', kind:'Lab review · HbA1c, lipid panel', time:'1h 22m', sigs:['mod'], ai:true },
  { id:5, name:'Adwoa N. Asante', kind:'RPM escalation · BP 168/102', time:'2h', sigs:['sev'] },
  { id:6, name:'Kwame Sarpong', kind:'Refill · atorvastatin', time:'2h 41m', sigs:[] },
];

const Queue = ({ selected, onSelect }) => (
  <div className="queue">
    <div className="queue-h">
      <div className="queue-title">Review queue</div>
      <div className="queue-count">12 open · 4 &gt; 2h</div>
    </div>
    <div className="queue-filter">
      <span className="qf active">All</span>
      <span className="qf">Refills</span>
      <span className="qf">Consults</span>
      <span className="qf">Labs</span>
      <span className="qf">RPM</span>
    </div>
    {QUEUE.map(q => (
      <div key={q.id} className={`q-item ${selected===q.id?'sel':''}`} onClick={()=>onSelect?.(q.id)}>
        <div className="q-head">
          <div className="q-name">{q.name}</div>
          <div className="q-time">{q.time}</div>
        </div>
        <div className="q-kind">{q.kind}</div>
        <div className="q-sigs">
          {q.sigs.map((s,i) => <span key={i} className={`q-sig ${s}`}>{s === 'sev' ? 'severe' : s === 'mod' ? 'moderate' : 'monitor'}</span>)}
          {q.ai && <span className="q-sig ai"><CSpark/> AI</span>}
        </div>
      </div>
    ))}
  </div>
);

const Detail = () => (
  <div className="detail">
    <div className="emer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      No emergency symptoms reported in this intake. Emergency override remains available (§13).
    </div>

    <div className="pt-hdr">
      <div>
        <div className="pt-name">Ama K. Owusu <span style={{fontSize:14, color:'var(--fg-3)', fontWeight:500}}>· 52 · F · patient ID pt_01HX</span></div>
        <div className="pt-meta">Accra · Diabetes T2 program · enrolled 18 Feb 2026 · eGFR 52 (stable)</div>
        <div className="pt-chips">
          <span className="pt-chip">Diabetes T2</span>
          <span className="pt-chip">Hypertension</span>
          <span className="pt-chip">CKD stage 3a</span>
          <span className="pt-chip" style={{background:'var(--gold-50)', color:'var(--gold-700)'}}>Delegate: Kojo</span>
        </div>
      </div>
      <div style={{display:'flex', gap:8}}>
        <button className="btn btn-secondary">Message patient</button>
        <button className="btn btn-secondary">View record</button>
      </div>
    </div>

    <div className="ai-panel">
      <div className="ai-panel-h"><CSpark/> Telecheck AI · refill assessment</div>
      <div className="ai-panel-title">Refill appropriate with monitoring — 1 severe signal needs action before approval</div>
      <div className="ai-panel-body">
        Metformin 500 mg BID has been tolerated since Feb. eGFR stable at 52 (last 3 readings: 54, 53, 52). No drug–drug conflicts with current regimen. One severe drug–lab signal: K⁺ trending up — see signals below.
      </div>
      <div className="ai-panel-source">Based on: medication list, labs from 14 Apr, condition list, refill history. Confidence: Moderate.</div>
    </div>

    <div className="panel">
      <div className="panel-h">Requested prescription</div>
      <div className="rx-row">
        <div><div className="rx-name">Metformin 500 mg</div><div className="rx-dose">oral tablet · BID · 30-day supply</div></div>
        <span className="pt-chip">refill · #4</span>
        <span className="rx-sig" style={{background:'var(--warning-50)', color:'var(--warning-700)'}}>1 moderate</span>
      </div>
    </div>

    <div className="panel">
      <div className="panel-h">Active medications &amp; interaction signals</div>
      <div className="rx-row">
        <div><div className="rx-name">Losartan 50 mg</div><div className="rx-dose">daily · hypertension</div></div>
        <span className="pt-chip">active</span><span></span>
      </div>
      <div className="rx-row">
        <div><div className="rx-name">Spironolactone 25 mg</div><div className="rx-dose">daily · hypertension · heart</div></div>
        <span className="pt-chip">active</span>
        <span className="rx-sig" style={{background:'var(--danger-50)', color:'var(--danger-700)'}}>severe drug–lab</span>
      </div>
      <div className="rx-row">
        <div><div className="rx-name">Atorvastatin 20 mg</div><div className="rx-dose">nightly</div></div>
        <span className="pt-chip">active</span><span></span>
      </div>
    </div>

    <div className="panel">
      <div className="panel-h">Signals from Medication Interaction Engine</div>
      <div className="sig-row">
        <span className="sig-pill sev">Severe</span>
        <div>
          <div className="sig-title">Spironolactone with K⁺ 5.6 mmol/L</div>
          <div className="sig-desc">Risk of hyperkalemia. Consider dose reduction or hold pending repeat K⁺ before refilling any potassium-sparing or ACE/ARB medication.</div>
          <div className="sig-mech">source: UpToDate 2026-03 · mechanism: reduced renal K⁺ excretion · eGFR 52</div>
        </div>
        <button className="sig-act primary">Hold &amp; message patient</button>
      </div>
      <div className="sig-row">
        <span className="sig-pill mod">Moderate</span>
        <div>
          <div className="sig-title">Metformin with eGFR 52</div>
          <div className="sig-desc">Dose acceptable at current eGFR. Re-check in 3 months; consider dose adjustment below 45.</div>
          <div className="sig-mech">source: ADA 2026 · mechanism: renal clearance</div>
        </div>
        <button className="sig-act">Acknowledge</button>
      </div>
      <div className="sig-row">
        <span className="sig-pill mon">Monitor</span>
        <div>
          <div className="sig-title">Losartan + spironolactone combination</div>
          <div className="sig-desc">Continue with K⁺ monitoring every 4 weeks while combination is active.</div>
          <div className="sig-mech">source: KDIGO 2025 · ongoing monitor</div>
        </div>
        <button className="sig-act">Acknowledge</button>
      </div>
    </div>

    <div className="actions">
      <button className="btn btn-secondary">Send to pharmacist</button>
      <button className="btn btn-danger">Block refill</button>
      <button className="btn btn-primary">Approve refill — pending K⁺ re-check</button>
    </div>

    <div style={{fontSize:11, color:'var(--fg-3)', textAlign:'right'}}>
      Every action here produces an audit artifact · v4.2 contracts pack
    </div>
  </div>
);

Object.assign(window, { CSpark, Sidebar, Topbar, Queue, Detail });
