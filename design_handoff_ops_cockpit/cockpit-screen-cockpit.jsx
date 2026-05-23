// cockpit-screen-cockpit.jsx
// The Cockpit (default) tab — with three variants: dense / glance / hybrid.

const I_ = window.CockpitIcons;
const { Sparkline: Spk, AgentDot: ADot, FmtAge: FAge } = window;

// ---------- Hero metric primitives ----------
function MetricPilot({ pct, weeks, variant }) {
  const big = variant === 'glance' ? '64px' : variant === 'hybrid' ? '48px' : '32px';
  return (
    <div className="metric">
      <div className="metric-h">
        <I_.target/> Pilot progress
        <span className="meter-tag">target 70% by 30 Jun</span>
      </div>
      <div className="metric-value" style={{ fontSize: big }}>
        <span>{pct}</span><span className="unit">%</span>
      </div>
      <div className="metric-bar"><i style={{ width:`${pct}%` }}/></div>
      <div className="metric-sub">
        <span>~{weeks} weeks to Ghana pilot</span>
        <span style={{ marginLeft:'auto' }} className="delta up mono">+4% wk</span>
      </div>
    </div>
  );
}

function MetricThroughput({ n, avg, trend, variant }) {
  const delta = n - avg;
  const pct = Math.round((delta/avg)*100);
  const big = variant === 'glance' ? '64px' : variant === 'hybrid' ? '48px' : '32px';
  return (
    <div className="metric">
      <div className="metric-h">
        <I_.prMerge/> Throughput
        <span className="meter-tag">last 24h · merges</span>
      </div>
      <div className="metric-value" style={{ fontSize: big }}>
        <span>{n}</span><span className="unit">PRs</span>
      </div>
      <div style={{ marginTop:2 }}>
        <Spk data={trend} color="var(--primary)" height={28}/>
      </div>
      <div className="metric-sub">
        <span className={`delta ${delta>0?'up':delta<0?'dn':'flat'}`}>
          {delta>0?'▲':delta<0?'▼':'·'} {Math.abs(delta)} ({pct>0?'+':''}{pct}%)
        </span>
        <span style={{ color:'var(--fg-3)' }}>vs 7d avg ({avg})</span>
      </div>
    </div>
  );
}

function MetricQueues({ codex, ratifier, oldest, variant }) {
  const danger = oldest >= 5;
  const big = variant === 'glance' ? '52px' : variant === 'hybrid' ? '40px' : '28px';
  return (
    <div className={`metric ${danger ? 'danger' : ''}`}>
      <div className="metric-h">
        <I_.queue/> Queues
        <span className="meter-tag">oldest {oldest}d</span>
      </div>
      <div style={{ display:'flex', gap:18, alignItems:'baseline' }}>
        <div>
          <div className="metric-value" style={{ fontSize: big, color:'var(--warning)' }}>
            <span>{codex}</span>
          </div>
          <div className="metric-sub mono" style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Codex</div>
        </div>
        <div style={{ width:1, alignSelf:'stretch', background:'var(--border-subtle)' }}/>
        <div>
          <div className="metric-value" style={{ fontSize: big, color: danger ? 'var(--danger)' : 'var(--ai)' }}>
            <span>{ratifier}</span>
          </div>
          <div className="metric-sub mono" style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>Ratifier</div>
        </div>
      </div>
      <div className="metric-sub">
        <span className="pill bad" style={{ display: danger?'inline-flex':'none' }}>SLA breach</span>
        <span style={{ color:'var(--fg-3)' }}>{danger ? 'Oldest item past 5-day soft SLA' : `Oldest item ${oldest}d old`}</span>
      </div>
    </div>
  );
}

function MetricGates({ fired, variant }) {
  const big = variant === 'glance' ? '56px' : variant === 'hybrid' ? '40px' : '28px';
  return (
    <div className={`metric ${fired > 0 ? 'danger' : ''}`}>
      <div className="metric-h">
        <I_.gate/> Hard-stop gates
        <span className="meter-tag">6 gates monitored</span>
      </div>
      <div className="metric-value" style={{ fontSize: big, color: fired > 0 ? 'var(--danger)' : 'var(--success)' }}>
        {fired === 0 ? (
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <I_.checkCirc/> Clear
          </span>
        ) : (
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <I_.alert/> {fired}
          </span>
        )}
      </div>
      <div className="metric-sub">
        <span style={{ color:'var(--fg-3)' }}>{fired === 0 ? 'Last fire: 4d ago (Crisis Agent drill)' : `${fired} active`}</span>
      </div>
    </div>
  );
}

// ---------- Cards ----------
function BlockersCard({ blockers, agents }) {
  const byId = Object.fromEntries(agents.map(a => [a.id, a]));
  return (
    <div className="card">
      <div className="card-h">
        <span className="card-title"><I_.block style={{ width:11, height:11, display:'inline', verticalAlign:'-1px', marginRight:4 }}/> Active blockers</span>
        <span className="card-sub">{blockers.length} open · {'>'} 24h</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {blockers.map(b => (
          <div key={b.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'start' }}>
            <span className="mono" style={{ fontSize:10, color:'var(--fg-4)', paddingTop:2 }}>{b.id}</span>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, color:'var(--fg-1)', lineHeight:1.4 }}>{b.title}</div>
              <div style={{ fontSize:11, color:'var(--fg-3)', marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
                <ADot status={byId[b.waiting]?.status || 'gray'}/>
                <span>{byId[b.waiting]?.name.replace(' Agent','')} waits</span>
                <I_.chevRight style={{ width:10, height:10, color:'var(--fg-4)' }}/>
                <ADot status={byId[b.owner]?.status || 'gray'}/>
                <span>{byId[b.owner]?.name.replace(' Agent','')} owns</span>
              </div>
            </div>
            <span className="pill warn">{b.filed}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestonesCard({ milestones }) {
  return (
    <div className="card">
      <div className="card-h">
        <span className="card-title"><I_.rocket style={{ width:11, height:11, display:'inline', verticalAlign:'-1px', marginRight:4 }}/> Milestones</span>
        <span className="card-sub">3 upcoming</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:4 }}>
        {milestones.map(m => (
          <div key={m.id}>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:5 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--fg-1)' }}>{m.name}</span>
              <span style={{ fontSize:11, color:'var(--fg-3)', marginLeft:'auto' }}>{m.date}</span>
              <span className="mono" style={{ fontSize:11, color:'var(--fg-1)', fontWeight:600, minWidth:32, textAlign:'right' }}>{m.pct}%</span>
            </div>
            <div style={{ height:6, background:'var(--surface-3)', borderRadius:3, overflow:'hidden', position:'relative' }}>
              <div style={{ height:'100%', width:`${m.pct}%`, background: m.kind === 'pilot' ? 'var(--primary)' : 'var(--gold-400)', borderRadius:3 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionsCard({ decisions }) {
  const kindStyles = {
    approve: { bg:'var(--success-soft)', fg:'var(--success)', label:'APPROVED' },
    reject:  { bg:'var(--danger-soft)',  fg:'var(--danger)',  label:'REJECTED' },
    modify:  { bg:'var(--warning-soft)', fg:'var(--warning)', label:'MODIFIED' },
  };
  return (
    <div className="card">
      <div className="card-h">
        <span className="card-title"><I_.checkCirc style={{ width:11, height:11, display:'inline', verticalAlign:'-1px', marginRight:4 }}/> Recent ratifications</span>
        <span className="card-sub">last 5</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {decisions.map((d, i) => {
          const s = kindStyles[d.kind];
          return (
            <div key={d.id} style={{
              display:'grid', gridTemplateColumns:'70px auto 1fr auto',
              gap:10, padding:'7px 0', alignItems:'center',
              borderTop: i === 0 ? '0' : '1px solid var(--border-subtle)',
            }}>
              <span className="mono" style={{ fontSize:10, color:'var(--fg-4)' }}>{d.id}</span>
              <span className="pill" style={{ background:s.bg, color:s.fg }}>{s.label}</span>
              <span style={{ fontSize:12, color:'var(--fg-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</span>
              <span className="mono" style={{ fontSize:10, color:'var(--fg-3)' }}>{d.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Live event feed (compact) ----------
function LiveEventsCard({ events, max = 12 }) {
  const typeStyles = {
    'heartbeat':  { bg:'var(--surface-3)',  fg:'var(--fg-3)',   short:'HB' },
    'pr-open':    { bg:'var(--primary-soft)', fg:'var(--primary)', short:'PR.OPEN' },
    'pr-merged':  { bg:'var(--success-soft)', fg:'var(--success)', short:'PR.MERGED' },
    'codex':      { bg:'var(--warning-soft)', fg:'var(--warning)', short:'CODEX' },
    'dep':        { bg:'var(--info-soft)',    fg:'var(--info)',    short:'DEP' },
    'ratify':     { bg:'var(--ai-soft)',      fg:'var(--ai)',      short:'RATIFY' },
    'hardstop':   { bg:'var(--danger-soft)',  fg:'var(--danger)',  short:'HARDSTOP' },
    'dialogue':   { bg:'var(--ai-soft)',      fg:'var(--ai)',      short:'DIALOGUE' },
  };
  return (
    <div className="card flush" style={{ display:'flex', flexDirection:'column', maxHeight: 380 }}>
      <div className="card-h" style={{ padding:'12px 14px 8px', borderBottom:'1px solid var(--border-subtle)', margin:0 }}>
        <span className="card-title"><I_.zap style={{ width:11, height:11, display:'inline', verticalAlign:'-1px', marginRight:4 }}/> Live event feed</span>
        <span className="row" style={{ gap:8 }}>
          <span className="pulse-dot" style={{ width:6, height:6 }}/>
          <span className="card-sub">streaming</span>
        </span>
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {events.slice(0, max).map((e, i) => {
          const s = typeStyles[e.type] || typeStyles.heartbeat;
          return (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'60px 86px 88px 1fr',
              gap:10, padding:'6px 14px', alignItems:'center',
              borderTop: i === 0 ? 0 : '1px solid var(--border-subtle)',
              fontSize: 12,
            }}>
              <span className="mono" style={{ fontSize:10, color:'var(--fg-4)' }}>{e.t}</span>
              <span className="mono" style={{
                fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:3,
                background:s.bg, color:s.fg, textAlign:'center', letterSpacing:'0.02em',
              }}>{s.short}</span>
              <span style={{ fontSize:11, color:'var(--fg-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.source}</span>
              <span style={{ fontSize:11, color:'var(--fg-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.sum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Agent snapshot row (dense) ----------
function AgentSnapshotRow({ agents }) {
  return (
    <div className="card flush" style={{ padding:'10px 14px' }}>
      <div className="card-h" style={{ marginBottom:8 }}>
        <span className="card-title">Agents · live</span>
        <span className="card-sub">{agents.filter(a => a.status === 'green').length}/{agents.length} active</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(118px, 1fr))', gap:8 }}>
        {agents.map(a => (
          <div key={a.id} className="tip" data-tip={`${a.name} · heartbeat ${a.heartbeat} ago`}
               style={{ display:'flex', flexDirection:'column', gap:4, padding:'6px 8px',
                        background:'var(--surface-2)', border:'1px solid var(--border-subtle)',
                        borderLeft: `2px solid ${a.color}`, borderRadius:6 }}>
            <div className="row" style={{ gap:6 }}>
              <ADot status={a.status}/>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--fg-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {a.name.replace(' Agent','')}
              </span>
            </div>
            <div style={{ fontSize:10, color:'var(--fg-3)', display:'flex', justifyContent:'space-between', gap:6 }}>
              <span className="mono">{a.heartbeat}</span>
              <span>{a.prsActive}PR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- The Cockpit screens ----------
function CockpitScreen({ data, variant, onNav, headerExtra }) {
  const { AGENTS, BLOCKERS, MILESTONES, RECENT_DECISIONS, EVENT_LOG,
          PR_TREND_7D, THROUGHPUT_24H, THROUGHPUT_7D_AVG, PILOT_PCT, WEEKS_TO_PILOT } = data;
  // Variant config
  const isGlance = variant === 'glance';
  const isDense  = variant === 'dense';
  const isHybrid = variant === 'hybrid';

  return (
    <div className="page-inner" data-screen-label="Cockpit">
      {/* Header */}
      <div className="page-h">
        <span className="page-title">Cockpit</span>
        <span className="page-sub mono">Telecheck · {new Date().toISOString().slice(0,10)}</span>
        <span className="page-actions">
          {headerExtra}
          <span className="pill ok"><span className="dot green" style={{ width:6, height:6 }}/> All systems nominal</span>
          <button className="btn btn-ghost btn-sm"><I_.copy/> Share snapshot</button>
        </span>
      </div>

      {/* Hero metrics */}
      <div className={isDense ? 'grid-4' : 'grid-cockpit'}
           style={{ gap: isGlance ? 16 : 12, marginBottom: 14 }}>
        <MetricPilot pct={PILOT_PCT} weeks={WEEKS_TO_PILOT} variant={variant}/>
        <MetricThroughput n={THROUGHPUT_24H} avg={THROUGHPUT_7D_AVG} trend={PR_TREND_7D} variant={variant}/>
        <MetricQueues codex={5} ratifier={4} oldest={3} variant={variant}/>
        <MetricGates fired={0} variant={variant}/>
      </div>

      {/* Dense variant: extra row of agent snapshot strip */}
      {isDense && (
        <div style={{ marginBottom: 12 }}>
          <AgentSnapshotRow agents={AGENTS}/>
        </div>
      )}

      {/* Middle row */}
      <div className="grid-3" style={{ marginBottom: 14 }}>
        <BlockersCard blockers={BLOCKERS} agents={AGENTS}/>
        <MilestonesCard milestones={MILESTONES}/>
        <DecisionsCard decisions={RECENT_DECISIONS}/>
      </div>

      {/* Bottom: live feed (only on dense + hybrid; glance trims it) */}
      {(isDense || isHybrid) && (
        <LiveEventsCard events={EVENT_LOG} max={isDense ? 16 : 10}/>
      )}

      {/* Glance variant: a single CTA at the bottom */}
      {isGlance && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <I_.zap style={{ width:18, height:18, color:'var(--ai)' }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-1)' }}>Today's most-important next action</div>
            <div style={{ fontSize:12, color:'var(--fg-3)' }}>CR-094 awaits ratification — hard-floor #6, blocks PR #135 (Clinical).</div>
          </div>
          <button className="btn btn-secondary" onClick={() => onNav('spec')}>View queue</button>
          <button className="btn btn-primary">Open CR-094</button>
        </div>
      )}
    </div>
  );
}

window.CockpitScreen = CockpitScreen;
