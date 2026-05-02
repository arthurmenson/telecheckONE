// ─────────────────────────────────────────────────────────────────
// Telecheck AI — adapted from reference (centered hero · stacked cards)
// Symbol: Telecheck logo (circle + EKG)
// ─────────────────────────────────────────────────────────────────

(function injectAIStyles() {
  const old = document.getElementById("ai-redesign-styles");
  if (old) old.remove();
  const s = document.createElement("style");
  s.id = "ai-redesign-styles";
  s.textContent = `
    /* Container — soft lilac wash */
    .ai2 {
      display:flex; flex-direction:column; height:100%;
      background:
        radial-gradient(120% 60% at 50% 0%, #ece8f7 0%, #f3f0fa 45%, #f7f5fb 100%);
    }
    .ai2 ::-webkit-scrollbar { display:none; }

    /* ── Header bar ─────────────────────────────────────── */
    .ai2-hdr {
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 16px 6px;
      position:relative;
    }
    .ai2-hdr-btn {
      width:36px; height:36px; border-radius:50%;
      background:rgba(255,255,255,.72);
      border:1px solid rgba(94,82,180,.08);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--fg-1);
      backdrop-filter:blur(8px);
    }
    .ai2-hdr-title {
      display:flex; align-items:center; gap:8px;
      font-size:15px; font-weight:600; color:var(--fg-1);
      letter-spacing:-.01em;
    }
    .ai2-hdr-beta {
      font-size:9.5px; font-weight:700; letter-spacing:.06em;
      text-transform:uppercase;
      padding:2px 7px; border-radius:5px;
      background:#e8e3f5; color:#5e52b4;
    }

    /* ── Date pill ───────────────────────────────────────── */
    .ai2-date {
      align-self:center;
      margin:6px auto 18px;
      background:#fff;
      padding:8px 16px; border-radius:14px;
      box-shadow:
        0 1px 2px rgba(60,40,140,.06),
        0 4px 14px rgba(60,40,140,.05);
      text-align:center;
    }
    .ai2-date-d { font-size:13px; font-weight:600; color:var(--fg-1); letter-spacing:-.01em; }
    .ai2-date-t { font-size:11px; color:var(--fg-3); margin-top:1px; }

    /* ── Body scrolls ──────────────────────────────────── */
    .ai2-body {
      flex:1; overflow-y:auto;
      padding:0 22px 14px;
    }

    /* ── Centered hero ──────────────────────────────────── */
    .ai2-hero {
      display:flex; flex-direction:column; align-items:center;
      text-align:center;
      padding:8px 8px 28px;
    }
    .ai2-orb {
      width:56px; height:56px; border-radius:14px;
      background:linear-gradient(135deg,#7e6ad4,#5e52b4);
      box-shadow:
        0 8px 24px rgba(94,82,180,.32),
        0 0 0 1px rgba(255,255,255,.3) inset;
      display:flex; align-items:center; justify-content:center;
      margin-bottom:18px;
    }
    .ai2-greet {
      width:100%;
      font-family:'Space Grotesk', sans-serif;
      font-size:26px; font-weight:600;
      letter-spacing:-.025em; color:var(--fg-1);
      line-height:1.2;
    }
    .ai2-sub {
      width:100%;
      margin-top:10px;
      font-size:14.5px; line-height:1.5;
      color:var(--fg-2);
    }

    /* ── Capability cards (stacked) ─────────────────────── */
    .ai2-caps {
      display:flex; flex-direction:column; gap:11px;
    }
    .ai2-cap {
      background:#fff;
      border-radius:14px;
      padding:18px 18px;
      display:flex; align-items:center; gap:16px;
      cursor:pointer;
      box-shadow:
        0 1px 2px rgba(60,40,140,.04),
        0 6px 20px rgba(60,40,140,.05);
      border:1px solid rgba(94,82,180,.04);
      transition:transform .12s ease, box-shadow .12s ease;
    }
    .ai2-cap:active {
      transform:scale(.985);
      box-shadow:0 1px 2px rgba(60,40,140,.04);
    }
    .ai2-cap-ico {
      color:#5e52b4;
      flex-shrink:0;
    }
    .ai2-cap-label {
      font-size:14.5px; font-weight:500;
      color:var(--fg-1); line-height:1.35;
      letter-spacing:-.01em;
    }

    /* ── Disclaimer + composer + utility bar ────────────── */
    .ai2-foot {
      padding:10px 16px 12px;
      background:transparent;
    }
    .ai2-composer {
      display:flex; align-items:center; gap:8px;
      background:#fff;
      border-radius:9999px;
      padding:6px 6px 6px 18px;
      box-shadow:
        0 1px 2px rgba(60,40,140,.04),
        0 6px 16px rgba(60,40,140,.05);
    }
    .ai2-composer input {
      flex:1; border:0; background:transparent;
      font-size:14px; font-family:inherit;
      color:var(--fg-1); outline:none;
      padding:8px 0;
    }
    .ai2-composer input::placeholder { color:var(--fg-3); }
    .ai2-composer-mic {
      width:32px; height:32px; border:0; border-radius:50%;
      background:transparent; color:var(--fg-2); cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .ai2-composer-send {
      width:34px; height:34px; border:0; border-radius:50%;
      background:#5e52b4; color:#fff; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 10px rgba(94,82,180,.3);
    }
    .ai2-composer-scan {
      position:absolute;
      transform:translate(108%, -110%);
      width:28px; height:28px; border-radius:50%;
      background:#fff;
      box-shadow:0 4px 12px rgba(60,40,140,.15);
      display:flex; align-items:center; justify-content:center;
      color:var(--fg-2);
      cursor:pointer;
    }

    .ai2-disc {
      display:flex; align-items:flex-start; gap:8px;
      margin:12px 4px 0;
      font-size:11.5px; color:var(--fg-3); line-height:1.4;
    }
    .ai2-disc svg { flex-shrink:0; margin-top:1px; color:var(--fg-3); }
    .ai2-disc strong { color:var(--fg-2); font-weight:500; }

    .ai2-util {
      display:flex; align-items:center; justify-content:space-between;
      margin:14px 0 0;
      padding:0 4px;
    }
    .ai2-util-btn {
      width:36px; height:36px; border-radius:50%;
      background:rgba(255,255,255,.7);
      border:1px solid rgba(94,82,180,.06);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--fg-2);
    }
    .ai2-util-mid {
      display:flex; align-items:center; gap:14px;
    }
    .ai2-util-btn.danger { color:#b8453d; }

    /* ──── CHAT MODE ──────────────────────────────────────── */
    .ai2-chat-body {
      flex:1; overflow-y:auto;
      padding:8px 18px 8px;
    }
    .ai2-msg-ai {
      max-width:92%;
      font-size:14px; line-height:1.6; color:var(--fg-1);
      margin-bottom:18px;
    }
    .ai2-msg-me {
      align-self:flex-end;
      max-width:80%;
      background:#5e52b4;
      color:#fff;
      border-radius:14px 14px 4px 14px;
      padding:10px 14px;
      margin-bottom:18px;
      margin-left:auto;
      font-size:13.5px; line-height:1.5;
    }
    .ai2-cite {
      display:inline;
      color:#5e52b4; font-weight:500;
      border-bottom:1px dotted rgba(94,82,180,.5);
      cursor:pointer;
    }
    .ai2-msg-foot {
      display:flex; flex-wrap:wrap; gap:8px;
      margin-top:14px;
    }
    .ai2-msg-act {
      font-size:12.5px; font-weight:500;
      padding:8px 14px; border-radius:9999px;
      background:#fff; color:var(--fg-1);
      border:1px solid rgba(94,82,180,.18);
      cursor:pointer; font-family:inherit;
    }
    .ai2-msg-act.primary {
      background:#5e52b4; color:#fff; border-color:#5e52b4;
    }
    .ai2-msg-srcs {
      font-size:11.5px; color:var(--fg-4);
      margin-top:10px;
    }
    .ai2-msg-srcs strong { color:var(--fg-3); font-weight:500; }
    .ai2-sugs {
      display:flex; gap:8px; flex-wrap:wrap;
      margin-top:14px;
    }
    .ai2-sug {
      font-size:13px;
      padding:8px 14px; border-radius:9999px;
      background:rgba(255,255,255,.85);
      border:1px solid rgba(94,82,180,.15);
      color:var(--fg-1); cursor:pointer; font-family:inherit;
    }
    .ai2-typing {
      display:inline-flex; gap:4px;
      background:#fff;
      border-radius:14px 14px 14px 4px;
      padding:12px 14px;
      margin-bottom:18px;
      box-shadow:0 1px 2px rgba(60,40,140,.04);
    }
    .ai2-typing span {
      width:6px; height:6px; border-radius:50%;
      background:#5e52b4;
      animation: ai2-bounce 1.2s infinite ease-in-out;
    }
    .ai2-typing span:nth-child(2) { animation-delay:.15s; }
    .ai2-typing span:nth-child(3) { animation-delay:.3s; }
    @keyframes ai2-bounce {
      0%,80%,100% { transform:translateY(0); opacity:.4; }
      40% { transform:translateY(-3px); opacity:1; }
    }
  `;
  document.head.appendChild(s);
})();

// Telecheck mark — circle + EKG path, white on iris
function TelecheckMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Telecheck">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#fff" strokeWidth="1.7"/>
      <path d="M6.5 12.5 L9 12.5 L10.3 9.5 L12.8 15.5 L14 12 L17.5 12"
            stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Capability config
const AI_CAPS = [
  {
    id:"explain",
    label:"Explain my lab results",
    icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3v6.5L4 18a2 2 0 001.7 3h12.6A2 2 0 0020 18l-5-8.5V3"/>
        <path d="M8 3h8M7 14h10"/>
      </svg>
    ),
  },
  {
    id:"meds",
    label:"I have a question about my medication",
    icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-30 12 12)"/>
        <path d="M9.5 6.5l8 8" transform="rotate(-30 12 12)"/>
      </svg>
    ),
  },
  {
    id:"nutrition",
    label:"Help with nutrition",
    icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7c-3-3-7-2-7 3 0 4 3 9 7 11 4-2 7-7 7-11 0-5-4-6-7-3z"/>
        <path d="M12 7c.5-2 1.5-3 3-3.5"/>
      </svg>
    ),
  },
  {
    id:"unwell",
    label:"I'm not feeling well",
    icon:(
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 11.6a5.5 5.5 0 00-9.5-3.8 5.5 5.5 0 00-9.3 3.8c0 5.6 9.3 10.4 9.3 10.4s9.5-4.7 9.5-10.4z"/>
        <path d="M7 12l2.5-1.5L12 13l2.5-2 2.5 1"/>
      </svg>
    ),
  },
];

function todayLabel() {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const d = new Date();
  const hh = d.getHours().toString().padStart(2,"0");
  const mm = d.getMinutes().toString().padStart(2,"0");
  return { day: days[d.getDay()], time: `${hh}:${mm}` };
}

// ── HUB ───────────────────────────────────────────────────────
function AIHub({ delegate, goBack, openChat, openCapability, toast }) {
  const [draft, setDraft] = React.useState("");
  const name = delegate === "k" ? "Kofi" : delegate === "abena" ? "Abena" : "Ama";
  const { day, time } = todayLabel();

  const submit = () => {
    if (!draft.trim()) return;
    openChat(draft);
    setDraft("");
  };

  return (
    <>
      <div className="ai2-hdr">
        <button className="ai2-hdr-btn" onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div className="ai2-hdr-title">
          AI Consult
          <span className="ai2-hdr-beta">Beta</span>
        </div>
        <button className="ai2-hdr-btn" onClick={() => toast("Menu")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
          </svg>
        </button>
      </div>

      <div className="ai2-date">
        <div className="ai2-date-d">{day}</div>
        <div className="ai2-date-t">{time}</div>
      </div>

      <div className="ai2-body">
        <div className="ai2-hero">
          <div className="ai2-orb">
            <TelecheckMark size={28}/>
          </div>
          <div className="ai2-greet">Hello, {name}</div>
          <div className="ai2-sub">
            I'm your AI health assistant.<br/>How can I help you today?
          </div>
        </div>

        <div className="ai2-caps">
          {AI_CAPS.map(c => (
            <div key={c.id} className="ai2-cap" onClick={() => openCapability(c.id)}>
              <div className="ai2-cap-ico">{c.icon}</div>
              <div className="ai2-cap-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ai2-foot">
        <div className="ai2-composer" style={{position:"relative"}}>
          <input
            placeholder="Type your message…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          <button className="ai2-composer-mic" onClick={() => toast("Voice")}>
            <Ic2 n="mic" s={16} c="currentColor"/>
          </button>
          <button className="ai2-composer-send" onClick={submit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
          <button className="ai2-composer-scan" onClick={() => toast("Scan")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2M21 7V5a2 2 0 00-2-2h-2M21 17v2a2 2 0 01-2 2h-2"/>
            </svg>
          </button>
        </div>

        <div className="ai2-disc">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>
          </svg>
          <span>AI responses can make mistakes. <strong>Important info is reviewed by Dr. Mensah.</strong></span>
        </div>

        <div className="ai2-util">
          <button className="ai2-util-btn" onClick={() => toast("Share")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M8 8l4-4 4 4M5 20h14"/>
            </svg>
          </button>
          <div className="ai2-util-mid">
            <button className="ai2-util-btn" onClick={() => toast("Saved")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 8.6c0-2.7-2.2-4.6-4.6-4.6-1.7 0-3.3 1-4.2 2.5-1-1.5-2.5-2.5-4.2-2.5-2.4 0-4.6 1.9-4.6 4.6 0 5.4 8.8 11.4 8.8 11.4s8.8-6 8.8-11.4z"/>
              </svg>
            </button>
            <button className="ai2-util-btn" onClick={() => toast("How AI works")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
            </button>
            <button className="ai2-util-btn" onClick={() => toast("Settings")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M18 18h2"/>
                <circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
              </svg>
            </button>
          </div>
          <button className="ai2-util-btn danger" onClick={() => toast("Conversation cleared")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ── CHAT ──────────────────────────────────────────────────────
function AIChat({ initialQuery, contextId, goBack, toast }) {
  const [msgs, setMsgs] = React.useState(() => {
    if (initialQuery) return [{r:"me", t:initialQuery}, {r:"thinking"}];
    return [{
      r:"ai", t:"What's on your mind?",
      sugs:["Why did my HbA1c go up?","Is 132 mg/dL dangerous?","Summarize my week"],
    }];
  });
  const [draft, setDraft] = React.useState("");
  const endRef = React.useRef(null);
  const { day, time } = todayLabel();

  React.useEffect(() => { endRef.current?.scrollIntoView?.({block:"end"}); }, [msgs]);

  React.useEffect(() => {
    if (!initialQuery) return;
    const t = setTimeout(() => {
      setMsgs(m => m.filter(x => x.r !== "thinking").concat([{
        r:"ai",
        body:[
          {type:"text", t:"Your "}, {type:"cite", t:"HbA1c"}, {type:"text", t:" rose "}, {type:"cite", t:"+0.2"}, {type:"text", t:" over 4 months. "},
          {type:"cite", t:"3 missed evening doses"}, {type:"text", t:" in March line up with the rise."},
          {type:"text", t:" A consistent 19:00 metformin for 6 weeks usually re-settles it before your next check."},
        ],
        srcs:["last 6 HbA1c","med log","March pattern"],
        actions:[
          {label:"Set 19:00 reminder", primary:true, fn:() => toast("Reminder set")},
          {label:"Tell Dr. Mensah", fn:() => toast("Sent to Dr. Mensah")},
        ],
      }]));
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  const send = (text) => {
    const v = (text || draft).trim();
    if (!v) return;
    setDraft("");
    setMsgs(m => m.concat([{r:"me", t:v}, {r:"thinking"}]));
    setTimeout(() => {
      setMsgs(m => m.filter(x => x.r !== "thinking").concat([{
        r:"ai",
        body:[
          {type:"text", t:"Late "}, {type:"cite", t:"complex carbs after 19:00"}, {type:"text", t:" are the biggest lever. Two of your three highest morning readings followed late jollof or rice dinners."},
          {type:"text", t:" Try keeping rice/yam to lunch, with protein and greens for dinner. Most see 8–15 mg/dL drop within 2 weeks."},
        ],
        srcs:["7-day food log","fasting glucose pattern"],
        actions:[{label:"Show meal plan", primary:true, fn:() => toast("Meal plan opened")}],
      }]));
    }, 1100);
  };

  const renderBody = (body) => body.map((b,i) =>
    b.type === "cite"
      ? <span key={i} className="ai2-cite" onClick={() => toast(`Source: ${b.t}`)}>{b.t}</span>
      : <span key={i}>{b.t}</span>
  );

  return (
    <>
      <div className="ai2-hdr">
        <button className="ai2-hdr-btn" onClick={goBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div className="ai2-hdr-title">
          AI Consult
          <span className="ai2-hdr-beta">Beta</span>
        </div>
        <button className="ai2-hdr-btn" onClick={() => toast("Menu")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
          </svg>
        </button>
      </div>

      <div className="ai2-date">
        <div className="ai2-date-d">{day}</div>
        <div className="ai2-date-t">{time}</div>
      </div>

      <div className="ai2-chat-body">
        {msgs.map((m, i) => {
          if (m.r === "thinking") return <div key={i} className="ai2-typing"><span/><span/><span/></div>;
          if (m.r === "me") return <div key={i} className="ai2-msg-me">{m.t}</div>;
          return (
            <div key={i} className="ai2-msg-ai">
              {m.body ? renderBody(m.body) : m.t}
              {m.srcs && (
                <div className="ai2-msg-srcs">
                  <strong>Sources:</strong> {m.srcs.join(" · ")}
                </div>
              )}
              {m.actions && (
                <div className="ai2-msg-foot">
                  {m.actions.map((a,j) => (
                    <button key={j} className={`ai2-msg-act ${a.primary ? "primary" : ""}`} onClick={a.fn}>{a.label}</button>
                  ))}
                </div>
              )}
              {m.sugs && (
                <div className="ai2-sugs">
                  {m.sugs.map((s,j) => (
                    <button key={j} className="ai2-sug" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>

      <div className="ai2-foot">
        <div className="ai2-composer" style={{position:"relative"}}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type your message…"
          />
          <button className="ai2-composer-mic" onClick={() => toast("Voice")}>
            <Ic2 n="mic" s={16} c="currentColor"/>
          </button>
          <button className="ai2-composer-send" onClick={() => send()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
        <div className="ai2-disc">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>
          </svg>
          <span>AI responses can make mistakes. <strong>Important info is reviewed by Dr. Mensah.</strong></span>
        </div>
      </div>
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
function AIWorkspace({ nav, toast, goBack, delegate }) {
  const [view, setView] = React.useState("hub");
  const [chatQuery, setChatQuery] = React.useState(null);
  const [chatContext, setChatContext] = React.useState(null);

  const openChat = (q, ctx) => { setChatQuery(q || null); setChatContext(ctx || null); setView("chat"); };
  const openCapability = (id) => {
    const m = {
      explain:"Explain my latest lab results",
      meds:"I have a question about my medication",
      nutrition:"Help me with nutrition for my diabetes",
      unwell:"I'm not feeling well — can you help?",
    };
    openChat(m[id] || "Hi");
  };
  const closeChat = () => { setView("hub"); setChatQuery(null); setChatContext(null); };

  return (
    <div className="app ai2">
      <SB2/>
      {view === "hub" && <AIHub delegate={delegate} goBack={goBack} openChat={openChat} openCapability={openCapability} toast={toast}/>}
      {view === "chat" && <AIChat initialQuery={chatQuery} contextId={chatContext} goBack={closeChat} toast={toast}/>}
    </div>
  );
}

window.AIWorkspace = AIWorkspace;
