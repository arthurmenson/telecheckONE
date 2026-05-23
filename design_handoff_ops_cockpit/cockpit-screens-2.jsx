// cockpit-screens-2.jsx
// Agents, Work (kanban), Spec Corpus screens.

const II = window.CockpitIcons;
const { Sparkline: Sp2, AgentDot: AD2, Drawer: Drw, Modal: Mdl, FmtAge: FA } = window;

/* =============================================================
   AGENTS
   ============================================================= */

function AgentCard({ a, onOpen }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:10, borderLeft: `2px solid ${a.color}` }}
         onClick={() => onOpen(a)}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{
          width:36, height:36, borderRadius:'50%',
          background: `linear-gradient(135deg, ${a.color}, ${a.color}cc)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:13, flexShrink:0,
        }}>{a.name.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--fg-1)' }}>{a.name}</span>
            <II.sparkle/>
          </div>
          <div style={{ fontSize:11, color:'var(--fg-3)', marginTop:2, lineHeight:1.3 }}>{a.role}</div>
        </div>
        <div className="row" style={{ gap:6 }}>
          <AD2 status={a.status} size="lg"/>
        </div>
      </div>

      <div style={{ fontSize:11, color:'var(--fg-2)', lineHeight:1.35, background:'var(--surface-2)', padding:'7px 9px', borderRadius:6 }}>
        <span className="mono" style={{ color:'var(--fg-4)', marginRight:6 }}>focus</span>{a.focus}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, fontSize:11 }}>
        <div>
          <div className="mono" style={{ fontSize:10, color:'var(--fg-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Heartbeat</div>
          <div style={{ fontSize:13, fontWeight:600, color: a.status === 'red' ? 'var(--danger)' : a.status === 'amber' ? 'var(--warning)' : 'var(--fg-1)' }}>{a.heartbeat}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize:10, color:'var(--fg-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>PRs · Codex</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-1)' }}>{a.prsActive} · {a.codexQ}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize:10, color:'var(--fg-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Scope</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-1)' }}>{a.complete == null ? '—' : `${a.complete}%`}</div>
        </div>
      </div>

      {a.complete != null && (
        <div style={{ height:4, background:'var(--surface-3)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${a.complete}%`, background: a.color, borderRadius:2 }}/>
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginTop:2 }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-secondary btn-sm" disabled={a.status === 'gray'}><II.pause/> Pause</button>
        <button className="btn btn-secondary btn-sm"><II.restart/> Restart</button>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={() => onOpen(a)}><II.logs/> View logs</button>
      </div>
    </div>
  );
}

function AgentDrawer({ open, agent, onClose, prs }) {
  if (!agent) return null;
  const agentPrs = prs.filter(p => p.agent === agent.id);
  return (
    <Drw open={open} onClose={onClose} title={agent.name}
         footer={
           <>
             <button className="btn btn-ghost"><II.logs/> Full log</button>
             <button className="btn btn-secondary"><II.pause/> Pause</button>
             <button className="btn btn-primary"><II.restart/> Restart agent</button>
           </>
         }>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{
          width:48, height:48, borderRadius:'50%',
          background: `linear-gradient(135deg, ${agent.color}, ${agent.color}cc)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:18,
        }}>{agent.name.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
        <div style={{ flex:1 }}>
          <div className="row" style={{ gap:6 }}>
            <AD2 status={agent.status} size="lg"/>
            <span style={{ fontSize:15, fontWeight:700 }}>{agent.name}</span>
            <span className="pill ai" style={{ marginLeft:'auto' }}><II.sparkle/> AI</span>
          </div>
          <div style={{ fontSize:12, color:'var(--fg-3)', marginTop:4 }}>{agent.role}</div>
        </div>
      </div>

      <div className="card" style={{ background:'var(--surface-2)' }}>
        <div className="kv">
          <div className="k">Heartbeat</div><div className="v mono">{agent.heartbeat} ago</div>
          <div className="k">Current focus</div><div className="v">{agent.focus}</div>
          <div className="k">Active PRs</div><div className="v">{agent.prsActive}</div>
          <div className="k">Codex queue</div><div className="v">{agent.codexQ}</div>
          <div className="k">Scope complete</div><div className="v">{agent.complete == null ? '—' : `${agent.complete}%`}</div>
          <div className="k">Model</div><div className="v mono">claude-sonnet-4.5</div>
          <div className="k">Started</div><div className="v mono">2026-05-18 09:14:02 UTC</div>
        </div>
      </div>

      <div>
        <div className="card-title" style={{ marginBottom:8 }}>Recent PRs ({agentPrs.length})</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {agentPrs.length === 0 && <div className="empty"><p>No active PRs</p></div>}
          {agentPrs.slice(0,5).map(p => (
            <div key={p.id} className="pr-card ai">
              <div className="pr-meta">#{p.id} · {p.repo} · {p.age}</div>
              <div className="pr-title">{p.title}</div>
              <div className="pr-foot">
                <span className="pill teal">codex r{p.codex}</span>
                <span className="mono">{p.lines}</span>
                <span style={{ marginLeft:'auto' }}><II.external/></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="card-title" style={{ marginBottom:8 }}>Reasoning trace (latest)</div>
        <div className="card ai-band ai-bg" style={{ fontFamily:'var(--font-mono)', fontSize:11, lineHeight:1.55 }}>
          <div className="ai-tag" style={{ marginBottom:6 }}><II.sparkle/> Telecheck AI · live</div>
          <div style={{ color:'var(--fg-2)' }}>
            <strong style={{ color:'var(--ai)' }}>14:42:14</strong>  · reading contracts_pack/refill.contract@v5.2 …<br/>
            <strong style={{ color:'var(--ai)' }}>14:42:11</strong>  · checking dep ledger: DEP-201 (pharmacist-hold) …<br/>
            <strong style={{ color:'var(--ai)' }}>14:42:09</strong>  · drafting state-machine transition: <em>HELD_BY_PHARMACIST → AWAITING_CLINICIAN</em><br/>
            <strong style={{ color:'var(--ai)' }}>14:42:04</strong>  · running med-int sim: 14 panels, 0 conflicts<br/>
            <strong style={{ color:'var(--ai)' }}>14:41:48</strong>  · proposing PR #142 author: clinical-agent
          </div>
        </div>
      </div>
    </Drw>
  );
}

function AgentsScreen({ data, onSpawn, addOpen, setAddOpen }) {
  const [openAgent, setOpenAgent] = React.useState(null);
  return (
    <div className="page-inner" data-screen-label="Agents">
      <div className="page-h">
        <span className="page-title">Agents</span>
        <span className="page-sub mono">{data.AGENTS.length} active · 1 stalled</span>
        <span className="page-actions">
          <div className="chips">
            <span className="chip active">All</span>
            <span className="chip">Active</span>
            <span className="chip">Stalled</span>
            <span className="chip">Offline</span>
          </div>
          <button className="btn btn-secondary btn-sm"><II.refresh/> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}><II.plus/> Add agent</button>
        </span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
        {data.AGENTS.map(a => <AgentCard key={a.id} a={a} onOpen={setOpenAgent}/>)}
      </div>

      <AgentDrawer open={!!openAgent} agent={openAgent} onClose={() => setOpenAgent(null)} prs={data.PRS}/>

      <Mdl open={addOpen} onClose={() => setAddOpen(false)} title="Spawn new agent"
           footer={<>
             <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
             <button className="btn btn-primary" onClick={() => setAddOpen(false)}><II.plus/> Create agent</button>
           </>}>
        <div className="field">
          <label>Name</label>
          <input className="input" placeholder="e.g. Lab Agent" defaultValue=""/>
        </div>
        <div className="field">
          <label>Role / scope</label>
          <textarea className="input" rows={3} placeholder="Owns lab panel CRUD, normal-range schema, lab interpretation surfaces."/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="field">
            <label>Model</label>
            <select className="input" defaultValue="claude-sonnet-4.5">
              <option>claude-sonnet-4.5</option>
              <option>claude-opus-4.1</option>
              <option>claude-haiku-4.5</option>
            </select>
          </div>
          <div className="field">
            <label>Spawn behaviour</label>
            <select className="input" defaultValue="warm">
              <option value="warm">Warm start (with onboarding pack)</option>
              <option value="cold">Cold start (no context)</option>
            </select>
          </div>
        </div>
        <div className="card" style={{ background:'var(--ai-soft)', borderLeft:'2px solid var(--ai)', padding:'10px 12px' }}>
          <div className="ai-tag" style={{ marginBottom:4 }}><II.sparkle/> Telecheck AI</div>
          <div style={{ fontSize:12, color:'var(--fg-1)' }}>Recommendation: warm-start with Clinical Agent onboarding pack, then narrow scope to lab panels. Estimated time-to-first-PR: ~14 min.</div>
        </div>
      </Mdl>
    </div>
  );
}


/* =============================================================
   WORK (Kanban)
   ============================================================= */

const REPO_COLORS = {
  'telecheck-clinical':  '#23947e',
  'telecheck-patient':   '#5fb3a0',
  'telecheck-platform':  '#6e5bd6',
  'telecheck-pharmacy':  '#dcaa50',
};

function PrCard({ pr, agents }) {
  const agent = agents.find(a => a.id === pr.agent);
  return (
    <div className={`pr-card ${pr.ai ? 'ai' : ''}`}>
      <div className="pr-meta">
        <span style={{ width:6, height:6, borderRadius:2, background: REPO_COLORS[pr.repo] || 'var(--fg-4)' }}/>
        <span>#{pr.id}</span>
        <span style={{ color:'var(--fg-4)' }}>·</span>
        <span>{pr.repo}</span>
        <span style={{ marginLeft:'auto' }}>{pr.age}</span>
      </div>
      <div className="pr-title">{pr.title}</div>
      <div className="pr-foot">
        {agent && (
          <span className="row" style={{ gap:4 }}>
            <AD2 status={agent.status}/>
            <span style={{ color:'var(--fg-2)' }}>{agent.name.replace(' Agent','')}</span>
            <II.sparkle/>
          </span>
        )}
        {pr.codex > 0 && <span className="pill warn">codex r{pr.codex}</span>}
        {pr.cr && <span className="pill ai">{pr.cr}</span>}
        <span className="mono" style={{ marginLeft:'auto', color:'var(--fg-3)' }}>{pr.lines}</span>
      </div>
    </div>
  );
}

function WorkScreen({ data }) {
  const cols = [
    { id:'progress', title:'In Progress',         status:'progress', sub:'agent authoring' },
    { id:'review',   title:'In Codex Review',     status:'review',   sub:'adversarial pass' },
    { id:'ratify',   title:'Awaiting Ratifier',   status:'ratify',   sub:'hard-floor #6 escalations' },
    { id:'merged',   title:'Merged Today',        status:'merged',   sub:'shipped to canonical' },
  ];

  return (
    <div className="page-inner" data-screen-label="Work">
      <div className="page-h">
        <span className="page-title">Work</span>
        <span className="page-sub mono">{data.PRS.length} PRs across 4 repos</span>
        <span className="page-actions">
          <div className="chips">
            <span className="chip active">All repos</span>
            <span className="chip"><span style={{ width:6, height:6, borderRadius:2, background:REPO_COLORS['telecheck-clinical'] }}/> clinical</span>
            <span className="chip"><span style={{ width:6, height:6, borderRadius:2, background:REPO_COLORS['telecheck-patient'] }}/> patient</span>
            <span className="chip"><span style={{ width:6, height:6, borderRadius:2, background:REPO_COLORS['telecheck-platform'] }}/> platform</span>
            <span className="chip"><span style={{ width:6, height:6, borderRadius:2, background:REPO_COLORS['telecheck-pharmacy'] }}/> pharmacy</span>
          </div>
          <div className="sep"/>
          <button className="btn btn-ghost btn-sm"><II.filter/> Filter</button>
          <button className="btn btn-secondary btn-sm"><II.github/> Open in GitHub</button>
        </span>
      </div>

      <div className="kanban">
        {cols.map(c => {
          const prs = data.PRS.filter(p => p.status === c.status);
          return (
            <div className="kanban-col" key={c.id}>
              <div className="kanban-h">
                <span className={`dot ${c.status === 'merged' ? 'green' : c.status === 'ratify' ? 'red' : c.status === 'review' ? 'amber' : 'gray'}`}/>
                <div>
                  <div className="kt">{c.title}</div>
                  <div style={{ fontSize:10, color:'var(--fg-4)' }}>{c.sub}</div>
                </div>
                <span className="ct mono">{prs.length}</span>
              </div>
              <div className="kanban-body">
                {prs.map(pr => <PrCard key={pr.id} pr={pr} agents={data.AGENTS}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* =============================================================
   SPEC CORPUS
   ============================================================= */

function SpecTree({ tree, sel, onSel }) {
  const [exp, setExp] = React.useState({ contracts: true, adrs: false, slices: false });
  const Item = ({ node, depth = 0 }) => {
    const hasKids = node.children && node.children.length > 0;
    const open = exp[node.id];
    return (
      <>
        <div className={`tree-item ${sel === node.id ? 'sel' : ''} ${node.cr > 0 ? 'has-cr' : ''}`}
             style={{ paddingLeft: 6 + depth * 12 }}
             onClick={() => { if (hasKids) setExp(s => ({ ...s, [node.id]: !s[node.id] })); onSel(node.id); }}>
          {hasKids
            ? (open ? <II.chevDown size={12}/> : <II.chevRight size={12}/>)
            : <span style={{ width:12 }}/>}
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{node.name}</span>
          <span className="v">{node.v}</span>
        </div>
        {hasKids && open && node.children.map(c => <Item key={c.id} node={c} depth={depth + 1}/>)}
      </>
    );
  };
  return (
    <div>
      <div className="tree-h">Canonical artifacts</div>
      {tree.map(n => <Item key={n.id} node={n}/>)}
    </div>
  );
}

function SpecMain({ artifact }) {
  return (
    <div>
      <div className="page-h" style={{ marginBottom:12 }}>
        <span className="page-title" style={{ fontSize:16 }}>{artifact.name}</span>
        <span className="pill teal">{artifact.v}</span>
        {artifact.cr > 0 && <span className="pill warn">{artifact.cr} pending CR</span>}
        <span style={{ marginLeft:'auto' }}>
          <button className="btn btn-secondary btn-sm"><II.copy/> Copy path</button>
        </span>
      </div>

      <div className="kv" style={{ marginBottom:18 }}>
        <div className="k">Path</div><div className="v mono">spec_corpus/{artifact.id}.md</div>
        <div className="k">Last commit</div><div className="v mono">3a8f1c7 · 2h ago · Platform Agent</div>
        <div className="k">Promoted via</div><div className="v">Ledger entry P-046 · ratified by You · 22 May 09:14</div>
        <div className="k">Cross-refs</div><div className="v">14 contracts · 7 ADRs · 4 slice PRDs</div>
      </div>

      <div className="card-title" style={{ marginBottom:8 }}>Recent promotion ledger</div>
      <div className="card flush" style={{ marginBottom:16 }}>
        {[
          { id:'P-046', t:'22 May', who:'You', kind:'approve', note:'Add lab_value.unit_system enum' },
          { id:'P-044', t:'19 May', who:'You', kind:'modify',  note:'Tighten consult.scheduled_at timezone handling' },
          { id:'P-039', t:'14 May', who:'You', kind:'approve', note:'Introduce refill.auto_decline_window' },
        ].map((p, i) => (
          <div key={p.id} style={{ display:'grid', gridTemplateColumns:'56px 80px 1fr auto', gap:10, alignItems:'center',
                                    padding:'10px 14px', borderTop: i === 0 ? '0' : '1px solid var(--border-subtle)' }}>
            <span className="mono" style={{ fontSize:11, color:'var(--fg-3)' }}>{p.id}</span>
            <span className={`pill ${p.kind === 'approve' ? 'ok' : 'warn'}`}>{p.kind.toUpperCase()}</span>
            <span style={{ fontSize:12, color:'var(--fg-1)' }}>{p.note}</span>
            <span style={{ fontSize:11, color:'var(--fg-3)' }}>{p.t} · {p.who}</span>
          </div>
        ))}
      </div>

      <div className="card ai-band ai-bg">
        <div className="ai-tag" style={{ marginBottom:6 }}><II.sparkle/> Telecheck AI · summary</div>
        <div style={{ fontSize:13, color:'var(--fg-1)', lineHeight:1.5 }}>
          Two pending change requests on this artifact. CR-091 (RBAC role expansion) blocks 3 downstream slice PRDs; Codex pass-2 recommends a hold pending legal review.
          The second CR is low-risk and unblocked.
        </div>
        <div style={{ fontSize:11, color:'var(--ai)', fontStyle:'italic', marginTop:6 }}>
          Based on: dep ledger, last 30d promotion ledger, Codex transcripts.
        </div>
      </div>
    </div>
  );
}

function SpecAside({ ratifications, onSel }) {
  const pStyles = { p0:{ bg:'var(--danger-soft)', fg:'var(--danger)' }, p1:{ bg:'var(--warning-soft)', fg:'var(--warning)' }, p2:{ bg:'var(--info-soft)', fg:'var(--info)' } };
  return (
    <div>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)' }}>
        <div className="card-title">Pending ratifications</div>
        <div className="page-sub mono" style={{ marginTop:3 }}>{ratifications.length} in queue · oldest 3d</div>
      </div>
      <div>
        {ratifications.map((r, i) => (
          <div key={r.id} onClick={() => onSel(r)}
               style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-subtle)', cursor:'pointer', display:'flex', flexDirection:'column', gap:6 }}>
            <div className="row" style={{ gap:6 }}>
              <span className="mono" style={{ fontSize:11, fontWeight:600, color:'var(--fg-1)' }}>{r.id}</span>
              <span className="pill" style={{ background: pStyles[r.priority].bg, color: pStyles[r.priority].fg }}>{r.priority.toUpperCase()}</span>
              <span className="pill muted">floor-{r.floor}</span>
              <span className="mono" style={{ marginLeft:'auto', fontSize:10, color:'var(--fg-3)' }}>{r.age}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--fg-1)', lineHeight:1.4 }}>{r.title}</div>
            <div className="row" style={{ gap:6, fontSize:10, color:'var(--fg-3)' }}>
              <II.sparkle/> {r.agent} · {r.diff}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecRatifyModal({ open, onClose, item }) {
  if (!item) return null;
  return (
    <Mdl open={open} onClose={onClose} width={720} title={`Ratify · ${item.id}`}
         footer={<>
           <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
           <button className="btn btn-secondary"><II.alertCirc/> Modify</button>
           <button className="btn btn-danger"><II.x/> Reject</button>
           <button className="btn btn-primary"><II.check/> Approve</button>
         </>}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-1)' }}>{item.title}</div>
        <div className="row" style={{ gap:6, marginTop:5, fontSize:11, color:'var(--fg-3)' }}>
          <II.sparkle/> {item.agent}
          <span>· filed {item.age} ago</span>
          <span>· diff {item.diff}</span>
          <span className="pill muted" style={{ marginLeft:'auto' }}>floor-{item.floor}</span>
        </div>
      </div>

      <div className="card ai-band ai-bg" style={{ padding:'10px 12px' }}>
        <div className="ai-tag" style={{ marginBottom:4 }}><II.sparkle/> Claude recommendation</div>
        <div style={{ fontSize:13, color:'var(--fg-1)' }}>{item.claudeRec}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div className="card" style={{ padding:'10px 12px', background:'var(--surface-2)' }}>
          <div className="card-title" style={{ marginBottom:4 }}>Codex pass 1</div>
          <div style={{ fontSize:12, color:'var(--fg-1)' }}>{item.codex1}</div>
        </div>
        <div className="card" style={{ padding:'10px 12px', background:'var(--surface-2)' }}>
          <div className="card-title" style={{ marginBottom:4 }}>Codex pass 2</div>
          <div style={{ fontSize:12, color:'var(--fg-1)' }}>{item.codex2}</div>
        </div>
      </div>

      <div>
        <div className="card-title" style={{ marginBottom:6 }}>Diff preview</div>
        <pre className="card" style={{ background:'var(--surface-2)', fontFamily:'var(--font-mono)', fontSize:11, padding:'10px 12px', margin:0, color:'var(--fg-2)', overflow:'auto', maxHeight:160 }}>
{`+ role: delegated_caregiver
+   scope: [read, request_refill, view_labs]
+   requires:
+     - consent.delegate_grant
+     - audit.delegate_action
-   admin: false`}
        </pre>
      </div>
    </Mdl>
  );
}

function SpecScreen({ data }) {
  const [sel, setSel] = React.useState('contracts');
  const [ratifyItem, setRatifyItem] = React.useState(null);

  // Find the selected node
  const findNode = (nodes, id) => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) { const f = findNode(n.children, id); if (f) return f; }
    }
    return null;
  };
  const artifact = findNode(data.SPEC_TREE, sel) || data.SPEC_TREE[0];

  return (
    <div className="page-inner" data-screen-label="Spec Corpus">
      <div className="page-h">
        <span className="page-title">Spec Corpus</span>
        <span className="page-sub mono">canonical · v∞ append-only</span>
        <span className="page-actions">
          <button className="btn btn-ghost btn-sm"><II.refresh/> Verify integrity</button>
          <button className="btn btn-secondary btn-sm"><II.copy/> Export bundle</button>
        </span>
      </div>

      <div className="spec-wrap">
        <div className="spec-side">
          <SpecTree tree={data.SPEC_TREE} sel={sel} onSel={setSel}/>
        </div>
        <div className="spec-main">
          <SpecMain artifact={artifact}/>
        </div>
        <div className="spec-aside">
          <SpecAside ratifications={data.PENDING_RATIFICATIONS} onSel={setRatifyItem}/>
        </div>
      </div>

      <SpecRatifyModal open={!!ratifyItem} onClose={() => setRatifyItem(null)} item={ratifyItem}/>
    </div>
  );
}

Object.assign(window, { AgentsScreen, WorkScreen, SpecScreen });
