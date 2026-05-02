// v2 — PRD §15 follow-through: episode consent, delegate switcher,
// granular data-use toggles, jurisdiction change, audit log

const { useState: uSCA, useEffect: uECA } = React;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Delegate quick-switcher (replaces direct-toggle behaviour of the banner)
// ─────────────────────────────────────────────────────────────────────────────
function DelegateSwitcherSheet({ current, onPick, onClose }) {
  const opts = [
    { id: "me",    label: "Ama (you)",         sub: "Your own Telecheck account",    av: "AK", color: "var(--teal-500)", tag: "SELF" },
    { id: "k",     label: "Kofi Mensah — dad",  sub: "Delegate · 3 permissions · expires 12 Oct", av: "KO", color: "var(--gold-500)", tag: "DELEGATE" },
    { id: "abena", label: "Abena Mensah — daughter (8)", sub: "Parent-of-minor · full access", av: "AB", color: "var(--iris-500)", tag: "MINOR" },
  ];
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Who are you acting as?</div>
        <div className="sheet-s">Every action is logged in the target account with your identity attached · PRD §15</div>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          {opts.map(o => {
            const active = o.id === current;
            return (
              <button key={o.id} className="lc" style={{
                width: "100%", textAlign: "left", border: active ? "1.5px solid var(--teal-500)" : "1px solid var(--border-subtle)",
                background: active ? "var(--teal-50)" : "var(--surface-1)",
                marginBottom: 8, cursor: "pointer",
              }} onClick={() => onPick(o.id)}>
                <div className="lc-ic" style={{ background: o.color, color: "#fff" }}>{o.av}</div>
                <div>
                  <div className="lc-t">{o.label} {active && <span className="lp ok">CURRENT</span>}</div>
                  <div className="lc-s">{o.sub}</div>
                </div>
                <div className="lc-chev"><Ic2 n={active ? "check" : "chev"} s={18} c={active ? "var(--teal-500)" : undefined}/></div>
              </button>
            );
          })}
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 12, lineHeight: 1.5 }}>
            Delegates are configured in Me → Family &amp; delegates. When acting as someone else, a persistent banner reminds you and your actions are audited in <em>their</em> record.
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Episode-consent flow — triggered by AI Second Opinion
// ─────────────────────────────────────────────────────────────────────────────
function EpisodeConsentSheet({ onClose, onGrant, episode }) {
  const [stage, setStage] = uSCA("review"); // review → granted
  const ep = episode || {
    title: "AI second opinion · on Dr. Mensah's HbA1c plan",
    clinician: "Dr. Adwoa Mensah",
    data: ["HbA1c trend (last 12 mo)", "Current prescription list", "Clinician note from 14 Apr"],
    duration: "Single episode · closes after you read the opinion (max 14 days)",
    output: "A second AI-generated interpretation, clearly marked AI-only.",
  };
  if (stage === "granted") {
    return (
      <>
        <div className="scrim" onClick={onClose}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-body" style={{ padding: "24px 22px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, margin: "0 auto 12px", borderRadius: 16, background: "var(--success-50)", display: "grid", placeItems: "center" }}>
              <Ic2 n="check" s={28} c="var(--success-700)" sw={2.4}/>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Episode consent granted</div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 6, lineHeight: 1.5 }}>
              This consent applies only to this AI second-opinion episode. It expires when the episode closes, or in 14 days.
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--n-50)", marginTop: 16, textAlign: "left", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--fg-1)" }}>Audit entry written:</strong><br/>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>ep_01HX9K2F8Z · consent.episode.grant · Ama K. · 22 Apr 2026, 09:14</span>
            </div>
            <button className="cta" style={{ marginTop: 18 }} onClick={() => { onGrant?.(); onClose(); }}>See the opinion</button>
            <button className="cta g" onClick={onClose}>Close</button>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "92vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-t">Episode consent</div>
        <div className="sheet-s">One-off consent scoped to this clinical episode · PRD §15 type 6</div>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          <div style={{ padding: 14, borderRadius: 14, background: "var(--iris-50, #f1f0ff)", border: "1px solid var(--iris-200)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--iris-600)" }}>EPISODE</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>{ep.title}</div>
            <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>Alongside care from {ep.clinician}</div>
          </div>

          <div className="section-h"><span>What the AI will see</span></div>
          <div className="extract">
            {ep.data.map((d, i) => (
              <div className="extract-row" key={i}>
                <span className="k" style={{ display: "flex", alignItems: "center", gap: 6 }}><Ic2 n="check" s={12} c="var(--success-700)"/>{d}</span>
              </div>
            ))}
          </div>

          <div className="section-h"><span>Scope of this consent</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">Duration</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{ep.duration}</span></div>
            <div className="extract-row"><span className="k">Output</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500, textAlign: "right" }}>{ep.output}</span></div>
            <div className="extract-row"><span className="k">Revocable</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>Any time · revokes future access</span></div>
            <div className="extract-row"><span className="k">Separate from</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>Your ongoing care consent</span></div>
          </div>

          <div style={{ padding: 12, borderRadius: 10, background: "#fbf1de", border: "1px solid var(--warning-500, #c28320)", marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--warning-700)" }}>THIS IS AI-ONLY</div>
            <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.5 }}>
              A second opinion from an AI is not a clinician review. Don't change medication or skip a visit based on it. Use it as a conversation-starter with Dr. Mensah.
            </div>
          </div>

          <button className="cta" style={{ marginTop: 18 }} onClick={() => setStage("granted")}>Grant episode consent</button>
          <button className="cta g" onClick={onClose}>Not now</button>
        </div>
      </div>
    </>
  );
}

// Read-only view for an active episode + revoke
function EpisodeActiveSheet({ onClose, onRevoke, toast }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Active episode · AI second opinion</div>
        <div className="sheet-s">Granted 22 Apr · closes when you read the opinion</div>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--teal-50)", border: "1px solid var(--teal-200)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--teal-700)" }}>CONSENT ACTIVE</div>
            <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5, color: "var(--fg-1)" }}>
              The AI has read your HbA1c trend, current prescriptions, and Dr. Mensah's clinical note. It's drafting a second-opinion interpretation now.
            </div>
          </div>
          <div className="extract" style={{ marginTop: 14 }}>
            <div className="extract-row"><span className="k">Episode ID</span><span className="v">ep_01HX9K2F8Z</span></div>
            <div className="extract-row"><span className="k">Granted</span><span className="v" style={{ fontFamily: "inherit", fontWeight: 500, color: "var(--fg-1)" }}>22 Apr 2026, 09:14</span></div>
            <div className="extract-row"><span className="k">Expires</span><span className="v" style={{ fontFamily: "inherit", fontWeight: 500, color: "var(--fg-1)" }}>On episode close · max 6 May</span></div>
            <div className="extract-row"><span className="k">Reversible</span><span className="v" style={{ fontFamily: "inherit", fontWeight: 500, color: "var(--fg-1)" }}>Yes · past reads are audited</span></div>
          </div>
          <button className="cta" onClick={() => toast("Opening second opinion…")}>Read the opinion</button>
          <button className="cta g" style={{ color: "#b84240", border: "1px solid #e8cdc9" }} onClick={() => { onRevoke(); onClose(); }}>Revoke episode consent</button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Granular data-use toggle screen
// ─────────────────────────────────────────────────────────────────────────────
const DATA_FLOWS = [
  { id: "ai-interp", name: "AI interpretation of your data", sub: "Let Telecheck AI read your labs, vitals, and messages to draft summaries for your clinician", pii: "High — medical history", on: true, required: false },
  { id: "pharm-partner", name: "Pharmacy partner sharing · Mobipharm Osu", sub: "Share current prescriptions with your chosen pharmacy to enable pickup &amp; refill", pii: "Medications only", on: true, required: false },
  { id: "hospital-korlebu", name: "Hospital sharing · Korle Bu", sub: "Share your summary record with Korle Bu Teaching Hospital on ER presentation", pii: "Full emergency card", on: false, required: false },
  { id: "hospital-37mil", name: "Hospital sharing · 37 Military Hospital", sub: "Share your summary record on ER presentation", pii: "Full emergency card", on: false, required: false },
  { id: "analytics", name: "Anonymized analytics", sub: "Aggregated, de-identified usage data helps us improve the product", pii: "None (k-anonymized)", on: true, required: false },
  { id: "community", name: "Community participation", sub: "Your public community posts are visible to other Telecheck patients", pii: "Chosen display name only", on: true, required: false },
  { id: "research", name: "Research dataset inclusion", sub: "De-identified medical record included in IRB-approved Ghana diabetes research", pii: "De-identified record", on: false, required: false },
];

function DataUseScreen({ nav, toast }) {
  const [flows, setFlows] = uSCA(() => {
    try { return JSON.parse(localStorage.getItem("pt-v2-dataflows") || "null") || Object.fromEntries(DATA_FLOWS.map(f => [f.id, f.on])); }
    catch { return Object.fromEntries(DATA_FLOWS.map(f => [f.id, f.on])); }
  });
  uECA(() => { localStorage.setItem("pt-v2-dataflows", JSON.stringify(flows)); }, [flows]);
  const toggle = (id) => {
    setFlows(prev => ({ ...prev, [id]: !prev[id] }));
    const f = DATA_FLOWS.find(x => x.id === id);
    toast(`${f.name.split(" · ")[0]} ${!flows[id] ? "enabled" : "disabled"} · audited`);
  };
  const activeCount = Object.values(flows).filter(Boolean).length;
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Data-use consent" onBack={() => nav("me-records")}/>
      <div className="scroll">
        <div className="content" style={{ padding: "6px 18px 40px" }}>
        <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 14 }}>
          Each data flow is its own switch. Changes are effective immediately and written to your audit log · PRD §15 type 3.
        </div>
        <div className="extract" style={{ marginBottom: 14 }}>
          <div className="extract-row"><span className="k">Active flows</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 600 }}>{activeCount} of {DATA_FLOWS.length}</span></div>
          <div className="extract-row"><span className="k">Last change</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>14 Jan 2026</span></div>
        </div>

        {DATA_FLOWS.map(f => (
          <div key={f.id} style={{
            padding: "14px 14px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)",
            borderRadius: 14, marginBottom: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start",
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "-0.005em" }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.45 }} dangerouslySetInnerHTML={{ __html: f.sub }}/>
              <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 6, display: "flex", gap: 8 }}>
                <span style={{ background: "var(--n-50)", padding: "2px 6px", borderRadius: 4, fontWeight: 600, letterSpacing: "0.02em" }}>DATA: {f.pii.toUpperCase()}</span>
                <span style={{ color: flows[f.id] ? "var(--success-700)" : "var(--fg-3)", fontWeight: 600 }}>{flows[f.id] ? "● active" : "○ paused"}</span>
              </div>
            </div>
            <button
              onClick={() => toggle(f.id)}
              style={{
                width: 40, height: 24, borderRadius: 9999, border: 0, padding: 0, cursor: "pointer", position: "relative",
                background: flows[f.id] ? "var(--teal-500)" : "var(--n-200, #d9dddb)",
                transition: "background .15s", flexShrink: 0,
              }}
              aria-label={`Toggle ${f.name}`}
            >
              <span style={{
                position: "absolute", top: 2, left: flows[f.id] ? 18 : 2, width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}/>
            </button>
          </div>
        ))}

        <div style={{ padding: 12, borderRadius: 10, background: "var(--n-50)", marginTop: 12, fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--fg-1)" }}>Revoking a flow</strong> stops it going forward. Past data already shared under a previously-active flow is auditable in your access log but can't be recalled from partner systems that held it.
        </div>
        <button className="cta g" onClick={() => nav("me-records")}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Jurisdictional consent · country-change flow
// ─────────────────────────────────────────────────────────────────────────────
const COUNTRIES = [
  { id: "GH", flag: "🇬🇭", name: "Ghana", status: "Live", sub: "Ghana FDA · DPA compliance · data in Accra", active: true },
  { id: "NG", flag: "🇳🇬", name: "Nigeria", status: "Coming 2026", sub: "NAFDAC reporting · NDPR compliance · Lagos region", active: false },
  { id: "KE", flag: "🇰🇪", name: "Kenya", status: "Coming 2027", sub: "PPB reporting · DPA Kenya · Nairobi region", active: false },
];

function JurisdictionScreen({ nav, toast }) {
  const [sel, setSel] = uSCA("GH");
  const [confirming, setConfirming] = uSCA(false);
  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Country of care" onBack={() => nav("me-records")}/>
      <div className="scroll">
        <div className="content" style={{ padding: "6px 18px 40px" }}>
        <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 14 }}>
          Your country of care determines which regulator you report adverse events to, where your data lives, and which legal rights apply · PRD §15 type 5.
        </div>
        <div className="extract" style={{ marginBottom: 14 }}>
          <div className="extract-row"><span className="k">Current country</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 600 }}>🇬🇭 Ghana</span></div>
          <div className="extract-row"><span className="k">Since</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>14 Jan 2026</span></div>
          <div className="extract-row"><span className="k">Data residency</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>Accra (Lagos backup)</span></div>
        </div>

        <div className="section-h"><span>Change country of care</span></div>
        {COUNTRIES.map(c => {
          const active = sel === c.id;
          const current = c.id === "GH";
          return (
            <button key={c.id} disabled={!c.active} onClick={() => c.active && setSel(c.id)} style={{
              width: "100%", textAlign: "left", padding: "12px 14px",
              background: active ? "var(--teal-50)" : "var(--surface-1)",
              border: active ? "1.5px solid var(--teal-500)" : "1px solid var(--border-subtle)",
              borderRadius: 14, marginBottom: 8, cursor: c.active ? "pointer" : "not-allowed", opacity: c.active ? 1 : 0.6,
              display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 28 }}>{c.flag}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {c.name}
                  {current && <span className="lp ok">CURRENT</span>}
                  {!c.active && <span className="lp iris">{c.status.toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 3 }}>{c.sub}</div>
              </div>
              {c.active && !current && <Ic2 n={active ? "check" : "chev"} s={18} c={active ? "var(--teal-500)" : "var(--fg-3)"}/>}
            </button>
          );
        })}

        <div style={{ padding: 12, borderRadius: 10, background: "#fbf1de", border: "1px solid var(--warning-500)", marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--warning-700)" }}>WHAT CHANGES</div>
          <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 6, lineHeight: 1.5 }}>
            Changing country pauses care for up to 48 hours while we re-verify your identity against the new jurisdiction, migrate your record to in-country storage, and re-issue regulatory consents. Your clinical history is preserved.
          </div>
        </div>

        {sel !== "GH" && !confirming && (
          <button className="cta" onClick={() => setConfirming(true)}>Request change to {COUNTRIES.find(c => c.id === sel).name}</button>
        )}
        {confirming && (
          <div style={{ padding: 14, borderRadius: 12, background: "var(--danger-50, #fbebe9)", border: "1px solid var(--danger-500, #c8402f)", marginTop: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger-700, #c8402f)" }}>{COUNTRIES.find(c => c.id === sel).name} isn't live yet</div>
            <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.5 }}>
              Telecheck launches there {COUNTRIES.find(c => c.id === sel).status.replace("Coming ", "in Q3 ")}. We'll email you when it's live and your request can be processed.
            </div>
            <button className="cta" style={{ marginTop: 12 }} onClick={() => { toast("Waitlist joined · we'll email when it opens"); nav("me-records"); }}>Join the waitlist</button>
            <button className="cta g" onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        )}
        {!confirming && <button className="cta g" onClick={() => nav("me-records")}>Done</button>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Audit log screen — who touched your record, when, under what consent
// ─────────────────────────────────────────────────────────────────────────────
const AUDIT_EVENTS = [
  { day: "Today · 22 Apr", items: [
    { t: "09:14", a: "Ama K.",         ev: "consent.episode.grant",       d: "AI second-opinion episode consent granted",        src: "self",     tone: "iris",    id: "ep_01HX9K2F8Z" },
    { t: "08:30", a: "Dr. Adwoa Mensah", ev: "clinical.note.write",        d: "Added note to HbA1c result · visible to patient",  src: "care",     tone: "teal",    id: "nt_01HX9JRR2P" },
    { t: "07:02", a: "Telecheck AI",   ev: "ai.summary.draft",            d: "Drafted plain-language summary of thyroid panel",  src: "ai-interp",tone: "info",    id: "ai_01HX9JE5FK" },
  ]},
  { day: "Yesterday · 21 Apr", items: [
    { t: "18:47", a: "Mobipharm Osu",  ev: "pharmacy.dispense",           d: "Metformin 500mg dispensed · batch TC-20260421",     src: "pharm-partner", tone: "gold", id: "rx_01HX7Z2KA1" },
    { t: "11:22", a: "Kojo Asare",     ev: "record.read.labs",            d: "Viewed your lab results (delegation · Kojo)",       src: "delegation", tone: "teal", id: "au_01HX7M8HX9" },
    { t: "09:58", a: "Ama K.",         ev: "consent.dataflow.update",     d: "Anonymized analytics re-enabled",                   src: "self",     tone: "iris", id: "cn_01HX7K1AB2" },
  ]},
  { day: "20 Apr", items: [
    { t: "14:33", a: "Mobilabs Osu",   ev: "lab.result.upload",           d: "Uploaded thyroid panel · awaiting clinician review", src: "care",     tone: "teal", id: "lb_01HX5RT8KL" },
    { t: "10:02", a: "Telecheck AI",   ev: "ai.interpretation.draft",     d: "Thyroid panel · AI summary generated (not reviewed)", src: "ai-interp", tone: "info", id: "ai_01HX5Q6VXZ" },
  ]},
  { day: "19 Apr", items: [
    { t: "16:08", a: "Korle Bu ER (req)", ev: "record.share.attempt",     d: "Emergency card share requested · you declined",      src: "self",     tone: "warn", id: "sh_01HX3NH7MC" },
  ]},
];

const FILTER_TABS = [
  { id: "all",        label: "All" },
  { id: "self",       label: "Me" },
  { id: "delegation", label: "Delegates" },
  { id: "ai-interp",  label: "AI" },
  { id: "care",       label: "Clinical" },
  { id: "pharm-partner", label: "Pharmacy" },
];

function AuditLogScreen({ nav, toast }) {
  const [filter, setFilter] = uSCA("all");
  const [sheet, setSheet] = uSCA(null);
  const filtered = AUDIT_EVENTS.map(day => ({
    ...day,
    items: day.items.filter(i => filter === "all" || i.src === filter),
  })).filter(day => day.items.length > 0);

  return (
    <div className="app">
      <SB2/>
      <Sub2 title="Access log" onBack={() => nav("me-records")}/>
      <div className="scroll">
        <div className="content" style={{ padding: "6px 18px 40px" }}>
        <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 10 }}>
          Every read, every write, every consent change. This is what "audited" means in Telecheck · PRD §15.
        </div>
        <div className="subtabs" style={{ marginBottom: 8, overflowX: "auto", display: "flex", gap: 4 }}>
          {FILTER_TABS.map(t => (
            <div key={t.id} className={`subtab ${filter === t.id ? "on" : ""}`} onClick={() => setFilter(t.id)} style={{ cursor: "pointer" }}>{t.label}</div>
          ))}
        </div>

        {filtered.map(day => (
          <div key={day.day}>
            <div className="section-h"><span>{day.day}</span></div>
            {day.items.map(it => (
              <button key={it.id} onClick={() => setSheet(it)} style={{
                width: "100%", textAlign: "left", padding: "12px 12px",
                background: "var(--surface-1)", border: "1px solid var(--border-subtle)",
                borderRadius: 12, marginBottom: 6, cursor: "pointer",
                display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "start",
              }}>
                <div style={{ fontSize: 10.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)", paddingTop: 2, minWidth: 36 }}>{it.t}</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.35 }}>{it.d}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: `var(--${it.tone}-700, var(--fg-2))`, background: `var(--${it.tone}-50, var(--n-50))`, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.02em" }}>
                      {it.a}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{it.ev}</span>
                  </div>
                </div>
                <Ic2 n="chev" s={16} c="var(--fg-4)"/>
              </button>
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--fg-3)", fontSize: 12 }}>No events match this filter.</div>
        )}

        <div style={{ padding: 12, borderRadius: 10, background: "var(--n-50)", marginTop: 14, fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5 }}>
          Every action also writes an immutable audit artifact on Telecheck's side. You can request a signed export at any time.
        </div>
        <button className="cta g" onClick={() => toast("Export requested · emailed within 24h")}>Export signed audit log</button>
        </div>
      </div>

      {sheet && (
        <>
          <div className="scrim" onClick={() => setSheet(null)}/>
          <div className="sheet">
            <div className="sheet-handle"/>
            <div className="sheet-t">Audit entry</div>
            <div className="sheet-s">{sheet.d}</div>
            <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
              <div className="extract">
                <div className="extract-row"><span className="k">Actor</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{sheet.a}</span></div>
                <div className="extract-row"><span className="k">Event</span><span className="v">{sheet.ev}</span></div>
                <div className="extract-row"><span className="k">Time</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{sheet.t} · 22 Apr 2026 GMT</span></div>
                <div className="extract-row"><span className="k">Consent basis</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{sheet.src}</span></div>
                <div className="extract-row"><span className="k">Artifact ID</span><span className="v">{sheet.id}</span></div>
                <div className="extract-row"><span className="k">Hash</span><span className="v">sha256:9f2c…4a21</span></div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "var(--n-50)", marginTop: 12, fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
                This entry is part of a Merkle-chained audit log. Any tampering invalidates all subsequent entries. Telecheck keeps a signed copy for 7 years per Ghana DPA requirements.
              </div>
              <button className="cta" onClick={() => { toast("Entry exported · PDF downloaded"); setSheet(null); }}>Export this entry</button>
              <button className="cta g" onClick={() => setSheet(null)}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Expose
Object.assign(window, {
  DelegateSwitcherSheet, EpisodeConsentSheet, EpisodeActiveSheet,
  DataUseScreen, JurisdictionScreen, AuditLogScreen,
});
