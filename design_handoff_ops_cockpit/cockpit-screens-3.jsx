// cockpit-screens-3.jsx
// Inventory, Event Log, Chat, Settings, Mobile (read-only) screens.

const III = window.CockpitIcons;
const { Drawer: Dr3, Modal: Md3, AgentDot: AD3, FmtAge: FA3, Sparkline: Sp3 } = window;

/* =============================================================
   INVENTORY
   ============================================================= */
function InventoryScreen({ data }) {
  const [filterType, setFilterType] = React.useState('All');
  const [selected, setSelected] = React.useState(null);
  const types = ['All', 'Tool', 'Skill', 'MCP', 'Agent'];

  const counts = {
    Tool: data.INVENTORY.filter(x => x.type === 'Tool').length,
    Skill: data.INVENTORY.filter(x => x.type === 'Skill').length,
    MCP: data.INVENTORY.filter(x => x.type === 'MCP').length,
    Agent: data.INVENTORY.filter(x => x.type === 'Agent').length,
  };

  const rows = data.INVENTORY.filter(r => filterType === 'All' || r.type === filterType);

  const typeColors = {
    Tool: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
    Skill: { bg: 'var(--info-soft)', fg: 'var(--info)' },
    MCP: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
    Agent: { bg: 'var(--ai-soft)', fg: 'var(--ai)' },
  };

  return (
    <div className="page-inner" data-screen-label="Inventory">
      <div className="page-h">
        <span className="page-title">Inventory</span>
        <span className="page-sub mono">{data.INVENTORY.length} items · live registry</span>
        <span className="page-actions">
          <button className="btn btn-ghost btn-sm"><III.filter/> Filter</button>
          <button className="btn btn-secondary btn-sm"><III.copy/> Export CSV</button>
          <button className="btn btn-primary btn-sm"><III.plus/> Register tool</button>
        </span>
      </div>

      {/* Totals strip */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        {[
          { k: 'Tool', label: 'Tools', n: counts.Tool, icon: 'logs' },
          { k: 'Skill', label: 'Skills', n: counts.Skill, icon: 'zap' },
          { k: 'MCP', label: 'MCPs', n: counts.MCP, icon: 'link' },
          { k: 'Agent', label: 'Agents', n: counts.Agent, icon: 'agents' },
        ].map(c => {
          const I = III[c.icon];
          const col = typeColors[c.k];
          return (
            <div key={c.k} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:8, background: col.bg, color: col.fg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <I/>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:700, color:'var(--fg-1)', lineHeight:1 }}>{c.n}</div>
                <div className="mono" style={{ fontSize:10, color:'var(--fg-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="chips" style={{ marginBottom: 12 }}>
        {types.map(t => (
          <span key={t} className={`chip ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>{t}</span>
        ))}
        <span style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <span className="chip"><III.bullet/> active only</span>
          <span className="chip">owner: any</span>
        </span>
      </div>

      {/* Table */}
      <div className="card flush" style={{ overflow:'hidden' }}>
        <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ minWidth:200 }}>Name</th>
                <th>Type</th>
                <th>Owner agent</th>
                <th>Status</th>
                <th style={{ textAlign:'right' }}>24h</th>
                <th style={{ textAlign:'right' }}>7d</th>
                <th>Last used</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const col = typeColors[r.type];
                return (
                  <tr key={i} className={selected === r.name ? 'sel' : ''} onClick={() => setSelected(r.name)} style={{ cursor:'pointer' }}>
                    <td><strong className="mono">{r.name}</strong></td>
                    <td><span className="pill" style={{ background:col.bg, color:col.fg }}>{r.type}</span></td>
                    <td className="mono" style={{ fontSize:11 }}>{r.owner}</td>
                    <td>
                      {r.status === 'active'   && <span className="pill ok">active</span>}
                      {r.status === 'deprecated' && <span className="pill muted">deprecated</span>}
                      {r.status === 'stalled'  && <span className="pill bad">stalled</span>}
                    </td>
                    <td className="mono" style={{ textAlign:'right' }}>{r.d24 == null ? '—' : r.d24.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign:'right', color:'var(--fg-3)' }}>{r.d7d == null ? '—' : r.d7d.toLocaleString()}</td>
                    <td className="meta">{r.last}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* =============================================================
   EVENT LOG
   ============================================================= */
function EventLogScreen({ data }) {
  const [expanded, setExpanded] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const typeStyles = {
    'heartbeat':  { short:'HB' },
    'pr-open':    { short:'PR.OPEN' },
    'pr-merged':  { short:'PR.MERGED' },
    'codex':      { short:'CODEX' },
    'dep':        { short:'DEP' },
    'ratify':     { short:'RATIFY' },
    'hardstop':   { short:'HARDSTOP' },
    'dialogue':   { short:'DIALOGUE' },
  };

  const filters = [
    { id:'all',       label:'All',        n: data.EVENT_LOG.length },
    { id:'ratify',    label:'Ratify',     n: data.EVENT_LOG.filter(e=>e.type==='ratify').length },
    { id:'pr-merged', label:'Merges',     n: data.EVENT_LOG.filter(e=>e.type==='pr-merged').length },
    { id:'pr-open',   label:'PR opens',   n: data.EVENT_LOG.filter(e=>e.type==='pr-open').length },
    { id:'codex',     label:'Codex',      n: data.EVENT_LOG.filter(e=>e.type==='codex').length },
    { id:'dep',       label:'Deps',       n: data.EVENT_LOG.filter(e=>e.type==='dep').length },
    { id:'hardstop',  label:'Hardstops',  n: data.EVENT_LOG.filter(e=>e.type==='hardstop').length, danger:true },
    { id:'heartbeat', label:'Heartbeats', n: data.EVENT_LOG.filter(e=>e.type==='heartbeat').length },
    { id:'dialogue',  label:'Dialogue',   n: data.EVENT_LOG.filter(e=>e.type==='dialogue').length },
  ];

  const rows = data.EVENT_LOG.filter(e => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (search && !`${e.source} ${e.sum} ${e.type}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-inner" data-screen-label="Event Log">
      <div className="page-h">
        <span className="page-title">Event log</span>
        <span className="page-sub mono">canonical · append-only · {data.EVENT_LOG.length} of 24,182 today</span>
        <span className="page-actions">
          <span className="pill ok"><III.shield/> Integrity verified · 14:38 UTC</span>
          <button className="btn btn-secondary btn-sm"><III.refresh/> Verify integrity</button>
          <button className="btn btn-ghost btn-sm"><III.copy/> Export NDJSON</button>
        </span>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface-1)',
                      border:'1px solid var(--border-subtle)', borderRadius:6, padding:'5px 10px', minWidth:240 }}>
          <III.search/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search source, summary, type, JSON…"
            style={{ background:'transparent', border:0, outline:'none', flex:1, fontSize:12, color:'var(--fg-1)' }}/>
          {search && <III.x onClick={() => setSearch('')} style={{ cursor:'pointer', color:'var(--fg-3)' }}/>}
        </div>
        <div className="chips" style={{ flex:1, justifyContent:'flex-end' }}>
          {filters.map(f => (
            <span key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="mono" style={{ fontSize:10, color: filter === f.id ? 'inherit' : 'var(--fg-4)' }}>{f.n}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="card flush" style={{ overflow:'hidden' }}>
        <div style={{ maxHeight:'calc(100vh - 280px)', overflowY:'auto' }}>
          {rows.map((e, i) => {
            const s = typeStyles[e.type] || typeStyles.heartbeat;
            const open = expanded === i;
            return (
              <div key={i}>
                <div className="evt" onClick={() => setExpanded(open ? null : i)}>
                  <span className="e-when mono">{e.t}</span>
                  <span className={`e-type evt-type-${e.type}`}>{s.short}</span>
                  <span className="e-src">
                    {e.source === 'human' ? <III.user/> : <III.bot/>}
                    {e.source}
                  </span>
                  <span className="e-sum">{e.sum}</span>
                </div>
                {open && (
                  <div className="evt-expanded">
                    <div style={{ display:'flex', gap:24, marginBottom:8 }}>
                      <div><span style={{ color:'var(--fg-4)' }}>timestamp · </span>{e.ts}</div>
                      <div><span style={{ color:'var(--fg-4)' }}>type · </span>{e.type}</div>
                      <div><span style={{ color:'var(--fg-4)' }}>source · </span>{e.source}</div>
                    </div>
                    <div style={{ color:'var(--fg-2)' }}>{e.json}</div>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="empty">
              <h4>No events match</h4>
              <p>Try clearing filters or expanding the search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* =============================================================
   CHAT
   ============================================================= */
function ChatScreen({ data }) {
  const [messages, setMessages] = React.useState(data.CHAT_HISTORY);
  const [draft, setDraft] = React.useState('');
  const [voice, setVoice] = React.useState(false);
  const [routing, setRouting] = React.useState('orchestrator');
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages]);

  const send = (text) => {
    if (!text || !text.trim()) return;
    const stamp = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    setMessages(m => [...m, { from:'user', who:'You', av:'M', t: stamp, text: text.trim() }]);
    setDraft('');
    // Fake orchestrator reply
    setTimeout(() => {
      setMessages(m => [...m, {
        from:'orch', who: routing === 'orchestrator' ? 'Orchestrator' : `${routing} agent`, av:'O', ai:true, t: stamp,
        text: `Acknowledged. I'll route this through the appropriate agent and log a \`human_orchestrator_dialogue\` event. Anything else?`,
      }]);
    }, 600);
  };

  const chips = [
    "What needs my decision?",
    "How's the pilot going?",
    "Show me today's PRs",
    "Pause Clinical Agent",
    "Approve CR-094",
    "Why is PR #142 stalled?",
  ];

  return (
    <div className="chat-wrap" data-screen-label="Chat">
      <div className="chat-stream" ref={streamRef}>
        <div className="chat-inner">
          <div style={{ textAlign:'center', padding:'24px 0 12px' }}>
            <div className="ai-tag" style={{ display:'inline-flex' }}><III.sparkle/> Orchestrator · Telecheck</div>
            <div style={{ fontSize:20, fontWeight:700, marginTop:10, color:'var(--fg-1)', letterSpacing:'-0.01em' }}>How can I help today?</div>
            <div style={{ fontSize:12, color:'var(--fg-3)', marginTop:4 }}>I have full read access to the canonical event log and can act on your behalf across all agents.</div>
          </div>

          {messages.map((m, i) => (
            <div className="msg" key={i}>
              <div className={`msg-av ${m.from === 'user' ? 'user' : 'orch'}`}>{m.av}</div>
              <div className="msg-body">
                <div className="msg-who">
                  {m.who}
                  {m.ai && <span className="ai-tag"><III.sparkle/> AI</span>}
                  <span className="msg-when">{m.t}</span>
                </div>
                <div className="msg-text">
                  {m.text.split('\n\n').map((para, j) => (
                    <p key={j} dangerouslySetInnerHTML={{ __html:
                      para
                        .replace(/`([^`]+)`/g, '<code>$1</code>')
                        .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--fg-1)">$1</strong>')
                    }}/>
                  ))}
                  {m.callout && (
                    <div className="ai-callout">
                      <div className="ai-tag" style={{ marginBottom:4 }}><III.sparkle/> Heads up</div>
                      {m.callout}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-input-wrap">
        <div className="chat-chips">
          {chips.map(c => (
            <span key={c} className="chat-chip" onClick={() => send(c)}>
              <III.zap/> {c}
            </span>
          ))}
        </div>
        <div className="chat-input">
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 8px', background:'var(--ai-soft)', borderRadius:6, color:'var(--ai)', fontSize:11, fontWeight:600, alignSelf:'flex-start' }}>
            <III.sparkle/> @{routing}
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }}
            placeholder={voice ? "Voice input active — speak naturally" : "Ask anything, or @mention an agent. Enter to send."}
            rows={1}
          />
          <button className="voice" onClick={() => setVoice(v => !v)} style={voice ? { color:'var(--ai)', background:'var(--ai-soft)', borderColor:'var(--ai-border)' } : undefined}>
            <III.mic/>
          </button>
          <button className="send" onClick={() => send(draft)} disabled={!draft.trim()}><III.send/></button>
        </div>
      </div>
    </div>
  );
}


/* =============================================================
   SETTINGS / ACCESS (admin)
   ============================================================= */
function SettingsScreen({ data }) {
  const [tab, setTab] = React.useState('project');
  const tabs = [
    { id:'project',  label:'Project' },
    { id:'agents',   label:'Agents & roles' },
    { id:'keys',     label:'API keys' },
    { id:'access',   label:'Access & ratifiers' },
    { id:'audit',    label:'Audit log' },
  ];

  return (
    <div className="page-inner" data-screen-label="Settings">
      <div className="page-h">
        <span className="page-title">Settings</span>
        <span className="page-sub mono">admin · cockpit instance · v0.7</span>
      </div>

      <div className="settings-grid">
        <div className="settings-nav">
          {tabs.map(t => (
            <div key={t.id} className={`settings-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {tab === 'project' && (
            <>
              <div className="card">
                <div className="card-title" style={{ marginBottom:10 }}>Active project</div>
                <div className="kv">
                  <div className="k">Name</div><div className="v">Telecheck</div>
                  <div className="k">Stage</div><div className="v">pilot · Ghana</div>
                  <div className="k">Repos</div><div className="v mono">telecheck-clinical · telecheck-patient · telecheck-platform · telecheck-pharmacy</div>
                  <div className="k">Ratifier</div><div className="v">Maya Adjei (Founder)</div>
                  <div className="k">Eng lead</div><div className="v" style={{ color:'var(--fg-3)' }}>— unassigned —</div>
                  <div className="k">Created</div><div className="v mono">2026-03-14</div>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom:10 }}>All cockpit projects</div>
                <table className="tbl">
                  <thead><tr><th>Name</th><th>Stage</th><th>Agents</th><th>Last activity</th><th></th></tr></thead>
                  <tbody>
                    {data.PROJECTS.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span className="row" style={{ gap:8 }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background:p.accent }}/>
                            <strong>{p.name}</strong>
                          </span>
                        </td>
                        <td className="meta">{p.env}</td>
                        <td className="mono">{p.id === 'telecheck' ? 8 : p.id === 'orchard' ? 4 : 3}</td>
                        <td className="meta">{p.id === 'telecheck' ? '12s ago' : p.id === 'orchard' ? '4h ago' : '2d ago'}</td>
                        <td style={{ textAlign:'right' }}><button className="btn btn-ghost btn-sm">Switch</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:10 }}>
                  <button className="btn btn-secondary btn-sm"><III.plus/> New project</button>
                </div>
              </div>
            </>
          )}

          {tab === 'keys' && (
            <>
              <div className="card">
                <div className="card-title" style={{ marginBottom:10 }}>API credentials</div>
                <table className="tbl">
                  <thead><tr><th>Provider</th><th>Scope</th><th>Status</th><th>Rotated</th><th></th></tr></thead>
                  <tbody>
                    {[
                      { p:'Anthropic',   s:'Sonnet + Haiku · all agents', st:'active', r:'17 May' },
                      { p:'OpenAI',      s:'Codex Reviewer only',        st:'active', r:'21 May' },
                      { p:'Supabase',    s:'RBAC + audit',                st:'active', r:'8 Apr' },
                      { p:'GitHub App',  s:'all 4 repos',                 st:'active', r:'3 May' },
                      { p:'ElevenLabs',  s:'voice (v1.1, disabled)',      st:'idle',   r:'—' },
                      { p:'Twilio',      s:'SMS notifications',           st:'active', r:'12 Apr' },
                    ].map(k => (
                      <tr key={k.p}>
                        <td><strong>{k.p}</strong></td>
                        <td>{k.s}</td>
                        <td>{k.st === 'active' ? <span className="pill ok">active</span> : <span className="pill muted">{k.st}</span>}</td>
                        <td className="meta">{k.r}</td>
                        <td style={{ textAlign:'right' }}><button className="btn btn-ghost btn-sm"><III.key/> Rotate</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'agents' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom:10 }}>Agent roster</div>
              <table className="tbl">
                <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Model</th><th>Scope</th></tr></thead>
                <tbody>
                  {data.AGENTS.map(a => (
                    <tr key={a.id}>
                      <td><span className="row" style={{ gap:6 }}><AD3 status={a.status}/><strong>{a.name}</strong><III.sparkle/></span></td>
                      <td style={{ color:'var(--fg-3)', fontSize:11 }}>{a.role}</td>
                      <td><span className={`pill ${a.status === 'green' ? 'ok' : a.status === 'amber' ? 'warn' : a.status === 'red' ? 'bad' : 'muted'}`}>{a.status === 'green' ? 'active' : a.status === 'amber' ? 'idle' : a.status === 'red' ? 'stalled' : 'offline'}</span></td>
                      <td className="meta">claude-sonnet-4.5</td>
                      <td className="meta">{a.complete == null ? '—' : `${a.complete}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'access' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom:10 }}>Ratifier authority</div>
              <div className="kv" style={{ marginBottom:14 }}>
                <div className="k">Floor-6</div><div className="v">Founder only (Maya Adjei)</div>
                <div className="k">Floor-5</div><div className="v">Founder · delegated to Eng Lead</div>
                <div className="k">Floor-4</div><div className="v">Eng Lead</div>
                <div className="k">Floor-1–3</div><div className="v">Auto-approved if both Codex passes succeed</div>
              </div>
              <div className="card ai-band ai-bg" style={{ padding:'10px 12px' }}>
                <div className="ai-tag" style={{ marginBottom:4 }}><III.sparkle/> Telecheck AI</div>
                <div style={{ fontSize:12, color:'var(--fg-1)' }}>You have no Eng Lead assigned. Of the last 30 ratifications, 18 were floor-4 items that an Eng Lead could have handled, saving ~3.2 hours of your time.</div>
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="card flush">
              <div className="card-h" style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)' }}>
                <span className="card-title">Cockpit audit log</span>
                <span className="card-sub">last 24h · separate from canonical project log</span>
              </div>
              <table className="tbl">
                <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
                <tbody>
                  {[
                    { t:'14:39', who:'Maya Adjei', a:'ratify_approve', tg:'CR-094' },
                    { t:'14:00', who:'Maya Adjei', a:'ratify_approve', tg:'CR-085' },
                    { t:'13:14', who:'Maya Adjei', a:'agent_pause',    tg:'Doc Agent' },
                    { t:'13:12', who:'Maya Adjei', a:'agent_restart',  tg:'Doc Agent' },
                    { t:'11:08', who:'Maya Adjei', a:'login',          tg:'cockpit' },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td className="meta">{r.t}</td>
                      <td><strong>{r.who}</strong></td>
                      <td className="mono" style={{ fontSize:11 }}>{r.a}</td>
                      <td>{r.tg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* =============================================================
   MOBILE (read-only glance) — uses IOSDevice frame
   ============================================================= */
function MobileCockpit({ data }) {
  return (
    <div style={{ background: '#0a100f', color: '#e8efed', height: '100%', overflowY:'auto', padding: '54px 16px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:11, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Telecheck</div>
          <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>Cockpit</div>
        </div>
        <span style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#c88a2b,#7f5718)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12 }}>MA</span>
      </div>

      <div style={{ background:'#131a18', border:'1px solid #1f2826', borderRadius:14, padding:'18px 18px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 0 3px rgba(16,185,129,0.2)' }}/>
          <span style={{ fontSize:11, color:'#828b87', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.08em' }}>All systems nominal</span>
        </div>
        <div style={{ fontSize:11, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginTop:18 }}>Pilot progress</div>
        <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:6 }}>
          <span style={{ fontSize:64, fontWeight:800, lineHeight:1, color:'#fff', letterSpacing:'-0.03em' }}>47</span>
          <span style={{ fontSize:18, color:'#828b87', fontWeight:700 }}>%</span>
          <span style={{ marginLeft:'auto', fontSize:10, color:'#34c777', fontFamily:'var(--font-mono)' }}>▲ +4% wk</span>
        </div>
        <div style={{ height:4, background:'#1a2220', borderRadius:2, marginTop:10, overflow:'hidden' }}>
          <div style={{ width:'47%', height:'100%', background:'#23947e' }}/>
        </div>
        <div style={{ fontSize:11, color:'#828b87', marginTop:8 }}>~8 weeks to Ghana pilot</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
        <div style={{ background:'#131a18', border:'1px solid #1f2826', borderRadius:10, padding:'10px 12px' }}>
          <div style={{ fontSize:10, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>24h merges</div>
          <div style={{ fontSize:26, fontWeight:700, color:'#fff', marginTop:4 }}>18</div>
          <div style={{ fontSize:10, color:'#34c777' }}>▲ +5 vs 7d avg</div>
        </div>
        <div style={{ background:'#131a18', border:'1px solid #1f2826', borderRadius:10, padding:'10px 12px' }}>
          <div style={{ fontSize:10, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Queues</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:4 }}>
            <span style={{ fontSize:18, fontWeight:700, color:'#f0a73a' }}>5</span>
            <span style={{ fontSize:10, color:'#828b87' }}>codex</span>
            <span style={{ fontSize:18, fontWeight:700, color:'#9e92e3', marginLeft:6 }}>4</span>
            <span style={{ fontSize:10, color:'#828b87' }}>ratify</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:11, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:8 }}>Awaiting your decision · 3</div>
        {data.PENDING_RATIFICATIONS.slice(0,3).map(r => (
          <div key={r.id} style={{ background:'#131a18', border:'1px solid #1f2826', borderLeft:'2px solid #9e92e3', borderRadius:8, padding:'10px 12px', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10 }}>
              <span className="mono" style={{ color:'#fff', fontWeight:700 }}>{r.id}</span>
              <span style={{ padding:'1px 5px', borderRadius:3, background:'rgba(240,99,81,0.13)', color:'#f06351', fontWeight:700, letterSpacing:'0.04em' }}>{r.priority.toUpperCase()}</span>
              <span style={{ marginLeft:'auto', color:'#828b87', fontFamily:'var(--font-mono)' }}>{r.age}</span>
            </div>
            <div style={{ fontSize:12, color:'#e8efed', marginTop:4, lineHeight:1.4 }}>{r.title}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:11, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:8 }}>Last 5 events</div>
        {data.EVENT_LOG.slice(0,5).map((e, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'52px 76px 1fr', gap:6, padding:'7px 0', borderBottom:'1px solid #1f2826', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a6360' }}>{e.t}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color:'#828b87' }}>{e.type.toUpperCase()}</span>
            <span style={{ fontSize:11, color:'#c0c9c5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.sum}</span>
          </div>
        ))}
      </div>

      <button style={{
        marginTop:18, width:'100%', padding:'14px', background:'#23947e', color:'#fff', border:0,
        borderRadius:10, fontSize:13, fontWeight:700, fontFamily:'inherit', cursor:'pointer',
      }}>Open desktop for full control →</button>
    </div>
  );
}

function MobileAgents({ data }) {
  return (
    <div style={{ background: '#0a100f', color: '#e8efed', height:'100%', overflowY:'auto', padding: '54px 16px 24px' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:'#828b87', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Telecheck</div>
        <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>Agents</div>
      </div>

      {data.AGENTS.slice(0,6).map(a => (
        <div key={a.id} style={{ background:'#131a18', border:'1px solid #1f2826', borderLeft:`2px solid ${a.color}`, borderRadius:10, padding:'10px 12px', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className={`dot ${a.status} lg`}/>
            <span style={{ fontSize:13, fontWeight:700 }}>{a.name}</span>
            <III.sparkle/>
            <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:10, color:'#828b87' }}>{a.heartbeat}</span>
          </div>
          <div style={{ fontSize:11, color:'#828b87', marginTop:4, lineHeight:1.4 }}>{a.focus}</div>
          {a.complete != null && (
            <div style={{ height:3, background:'#1a2220', borderRadius:2, marginTop:8, overflow:'hidden' }}>
              <div style={{ width:`${a.complete}%`, height:'100%', background:a.color }}/>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MobileChat({ data }) {
  return (
    <div style={{ background:'#0a100f', color:'#e8efed', height:'100%', display:'flex', flexDirection:'column', padding:'54px 0 0' }}>
      <div style={{ padding:'0 16px 12px', borderBottom:'1px solid #1f2826', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#7e6fdc,#433390)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:11 }}>O</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>Orchestrator</div>
          <div style={{ fontSize:10, color:'#34c777' }}>● live</div>
        </div>
      </div>
      <div style={{ flex:1, padding:'14px 16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        {data.CHAT_HISTORY.slice(0,3).map((m,i) => (
          <div key={i} style={{ display:'flex', gap:8, flexDirection: m.from === 'user' ? 'row-reverse' : 'row' }}>
            <span style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
                          background: m.from === 'user' ? 'linear-gradient(135deg,#c88a2b,#7f5718)' : 'linear-gradient(135deg,#7e6fdc,#433390)',
                          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:10 }}>{m.av}</span>
            <div style={{ background: m.from === 'user' ? '#1a2220' : 'rgba(110,91,214,0.14)',
                          borderLeft: m.from === 'user' ? '0' : '2px solid #9e92e3',
                          padding:'8px 10px', borderRadius:10, fontSize:12, color:'#e8efed', lineHeight:1.45, maxWidth: '84%' }}>
              {m.text.split('\n\n')[0].slice(0, 160)}{m.text.length > 160 ? '…' : ''}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'10px 16px 18px', borderTop:'1px solid #1f2826' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#131a18', border:'1px solid #1f2826', borderRadius:20, padding:'8px 14px' }}>
          <span style={{ flex:1, fontSize:12, color:'#5a6360' }}>Ask the orchestrator…</span>
          <span style={{ color:'#828b87', display:'flex' }}><III.mic/></span>
        </div>
      </div>
    </div>
  );
}

function MobileScreen({ data }) {
  const { IOSDevice } = window;
  return (
    <div className="mobile-stage" data-screen-label="Mobile">
      <div className="mob-col">
        <IOSDevice dark={true} time="14:42" hideHomeIndicator={false}>
          <MobileCockpit data={data}/>
        </IOSDevice>
        <div className="mob-cap"><b>Cockpit</b> · read-only glance. Pilot progress, queues, last 5 events.</div>
      </div>
      <div className="mob-col">
        <IOSDevice dark={true} time="14:42" hideHomeIndicator={false}>
          <MobileAgents data={data}/>
        </IOSDevice>
        <div className="mob-cap"><b>Agents</b> · status dots, current focus, scope completion. Tap to drill.</div>
      </div>
      <div className="mob-col">
        <IOSDevice dark={true} time="14:42" hideHomeIndicator={false}>
          <MobileChat data={data}/>
        </IOSDevice>
        <div className="mob-cap"><b>Chat</b> · text + voice to orchestrator. Ratifier actions disabled on mobile.</div>
      </div>
    </div>
  );
}

Object.assign(window, { InventoryScreen, EventLogScreen, ChatScreen, SettingsScreen, MobileScreen });
