// cockpit-shell.jsx
// Shared shell components: sidebar, topbar, sparkline, ribbon, drawer, modal.

const { useState, useEffect, useRef, useMemo } = React;
const I = window.CockpitIcons;

// ---------- Sparkline ----------
function Sparkline({ data, color, ai, fill, height = 28, width = 100, smooth = true }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = width, h = height, pad = 2;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const stroke = color || 'var(--primary)';

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * innerW;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });

  let d = '';
  if (smooth) {
    pts.forEach(([x, y], i) => {
      if (i === 0) d += `M ${x} ${y}`;
      else {
        const [px, py] = pts[i - 1];
        const cx = (px + x) / 2;
        d += ` Q ${px} ${py} ${cx} ${(py + y) / 2} T ${x} ${y}`;
      }
    });
  } else {
    d = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  }

  const areaD = `${d} L ${pad + innerW} ${pad + innerH} L ${pad} ${pad + innerH} Z`;
  const gradId = `spk-grad-${React.useId ? React.useId() : Math.random().toString(36).slice(2)}`;

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         style={{ width: '100%', height: h, overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.30" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill !== false && <path d={areaD} fill={`url(#${gradId})`} />}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && (() => {
        const [lx, ly] = pts[pts.length - 1];
        return <circle cx={lx} cy={ly} r="2" fill={stroke} />;
      })()}
    </svg>
  );
}

// ---------- Project switcher ----------
function ProjectSwitcher({ projects, current, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const cur = projects.find(p => p.id === current);
  return (
    <div className="proj-switch" ref={ref} onClick={() => setOpen(o => !o)}>
      <span className="proj-dot" style={{ background: cur.accent, boxShadow: `0 0 8px ${cur.accent}80` }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="proj-name">{cur.name}</div>
        <div className="proj-env">{cur.env}</div>
      </div>
      <span className="proj-chev"><I.chevDown size={14}/></span>
      {open && (
        <div className="proj-menu" onClick={e => e.stopPropagation()}>
          {projects.map(p => (
            <div key={p.id} className="proj-menu-item" onClick={() => { onChange(p.id); setOpen(false); }}>
              <span className="proj-dot" style={{ background: p.accent }}/>
              <span className="pm-name">{p.name}</span>
              <span className="pm-meta">{p.env}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', margin:'4px 0' }}/>
          <div className="proj-menu-item">
            <span style={{ width:8, height:8, border:'1px dashed rgba(255,255,255,0.3)', borderRadius:'50%' }}/>
            <span className="pm-name" style={{ color:'var(--side-fg-dim)' }}>New project…</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sidebar ----------
const NAV_ITEMS = [
  { id:'cockpit',   label:'Cockpit',     icon:'cockpit'   },
  { id:'agents',    label:'Agents',      icon:'agents'    },
  { id:'work',      label:'Work',        icon:'work'      },
  { id:'spec',      label:'Spec Corpus', icon:'spec'      },
  { id:'inventory', label:'Inventory',   icon:'inventory' },
  { id:'events',    label:'Event Log',   icon:'events'    },
  { id:'chat',      label:'Chat',        icon:'chat'      },
];

function Sidebar({ active, onNav, counts, project, projects, onProjectChange }) {
  const Spark = I.sparkle;
  return (
    <aside className="side" data-screen-label="Sidebar">
      <div className="side-brand">
        <div className="side-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12 4 4 12-12"/>
            <path d="M4 18h6"/>
          </svg>
        </div>
        <div>
          <div className="side-brand-name">Ops Cockpit</div>
          <div className="side-brand-sub">v0.7 · build 1428</div>
        </div>
      </div>

      <ProjectSwitcher projects={projects} current={project} onChange={onProjectChange} />

      <nav className="side-nav">
        <div className="side-section">Workspace</div>
        {NAV_ITEMS.map(it => {
          const IconC = I[it.icon];
          const ct = counts[it.id];
          return (
            <div key={it.id}
                 className={`side-item ${active === it.id ? 'active' : ''}`}
                 onClick={() => onNav(it.id)}>
              <IconC/>
              <span className="label">{it.label}</span>
              {ct != null && <span className={`ct ${ct.tone || ''}`}>{ct.v}</span>}
            </div>
          );
        })}
        <div className="side-section">Other</div>
        <div className={`side-item ${active === 'mobile' ? 'active' : ''}`}
             onClick={() => onNav('mobile')}>
          <I.mobile/>
          <span className="label">Mobile (read-only)</span>
        </div>
        <div className={`side-item ${active === 'settings' ? 'active' : ''}`}
             onClick={() => onNav('settings')}>
          <I.settings/>
          <span className="label">Settings</span>
        </div>
      </nav>

      <div className="side-user">
        <div className="side-av">MA</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="side-user-name">Maya Adjei</div>
          <div className="side-user-role">Founder · Ratifier</div>
        </div>
        <span className="dot green tip" data-tip="Online"></span>
      </div>
    </aside>
  );
}

// ---------- Topbar ----------
function Topbar({ now, density, onDensity, theme, onTheme, onOpenSearch }) {
  return (
    <header className="topbar" data-screen-label="Topbar">
      <div className="tb-pulse">
        <span className="pulse-dot"/> Live · WebSocket
      </div>
      <div className="sep"/>
      <div className="tb-search" onClick={onOpenSearch}>
        <I.search/>
        <span style={{ flex:1 }}>Jump to PR, agent, event, CR…</span>
        <span className="tb-kbd">⌘K</span>
      </div>

      <div className="tb-clock mono">
        <span>{now}</span>
        <span style={{ color:'var(--fg-4)' }}>UTC</span>
      </div>

      <button className="tb-iconbtn tip" data-tip="Refresh" onClick={() => location.reload()}>
        <I.refresh/>
      </button>
      <button className="tb-iconbtn tip has-badge" data-tip="Notifications">
        <I.bell/>
        <span className="bdg">3</span>
      </button>
      <button className="tb-iconbtn tip" data-tip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <I.sun/> : <I.moon/>}
      </button>
    </header>
  );
}

// ---------- Pulse ribbon (persistent activity bar) ----------
function PulseRibbon({ data, aiData, now }) {
  return (
    <div className="ribbon" data-screen-label="Activity ribbon">
      <div className="ribbon-row">
        <span className="ribbon-label">Activity 24h</span>
        <div className="ribbon-bars">
          {data.map((v, i) => {
            const max = Math.max(...data);
            const pct = (v / max) * 100;
            const ai = aiData[i] || 0;
            const aiPct = (ai / max) * 100;
            const isNow = i === data.length - 1;
            return (
              <div key={i} className={`ribbon-bar ${isNow ? 'now' : ''}`}
                   style={{ height: `${Math.max(2, pct)}%`, position:'relative' }}
                   title={`${v} events · ${ai} AI-authored`}>
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0,
                  background:'var(--ai)', height: `${(aiPct/pct)*100}%`,
                  opacity: 0.35, borderRadius:1,
                }}/>
              </div>
            );
          })}
        </div>
        <span className="ribbon-time">{now} UTC</span>
      </div>
    </div>
  );
}

// ---------- Drawer ----------
function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <>
      <div className={`drawer-scrim ${open ? 'open' : ''}`} onClick={onClose}/>
      <div className={`drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-h">
          <span className="drawer-title">{title}</span>
          <button className="tb-iconbtn drawer-x" onClick={onClose}><I.x/></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}

// ---------- Modal ----------
function Modal({ open, onClose, title, children, footer, width }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={width ? { width } : undefined} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <span className="t">{title}</span>
          <button className="tb-iconbtn" onClick={onClose} style={{ marginLeft:'auto' }}><I.x/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Status dot helper ----------
function AgentDot({ status, size }) {
  return <span className={`dot ${status} ${size === 'lg' ? 'lg' : ''}`} />;
}

// ---------- Agent badge (small chip with dot + name) ----------
function AgentBadge({ agent, ai = true }) {
  return (
    <span className="row" style={{ gap:6 }}>
      <AgentDot status={agent.status} />
      <span style={{ fontSize:11, fontWeight:600, color:'var(--fg-2)' }}>{agent.name.replace(' Agent','')}</span>
      {ai && <I.sparkle/>}
    </span>
  );
}

// ---------- Format helpers ----------
function FmtAge({ s }) { return <span className="mono" style={{ fontSize:11, color:'var(--fg-3)' }}>{s}</span>; }

// Export
Object.assign(window, {
  Sparkline, ProjectSwitcher, Sidebar, Topbar, PulseRibbon, Drawer, Modal,
  AgentDot, AgentBadge, FmtAge,
  NAV_ITEMS,
});
