// ─────────────────────────────────────────────────────────────────
// PRD v1.9 ALIGNMENT LAYER
// Loaded LAST. Adds PRD-mandated capabilities the v6 mock missed,
// wires new sheets, and exposes them globally so existing screens
// can call them. Does NOT replace the 5 bottom tabs.
//
// Capabilities added (mapped to PRD):
//   §7.1  Honest-status copy badges
//   §7.3  Crisis (988 / 112) helpline floor
//   §8 J2 Bridge-supply on consent revoke
//   §9.1  Forms/Intake — save & resume + A/B variant indicator
//   §9.2  Subscription mechanics — pause / resume / switch / cancel-with-deflection
//   §9.2  Multi-product cart + checkout
//   §9.3  Affiliate attribution display
//   §9.4  Tenant + country chip (ADR-023/024)
//   §11.7 #12 Adverse Event reporting (FDA / FDA-Ghana)
//   §11.7 #14 Fake-medication detection (advisory, deep)
//   §11.7 #13 Herb-drug check at refill time
//   §20.4 Audit chain integrity viewer (immutable)
//   §17 Honest design rules — copy posture utilities
// ─────────────────────────────────────────────────────────────────

const { useState: usP, useEffect: ueP } = React;

(function injectPrdStyles() {
  if (document.getElementById("prd-styles")) return;
  const s = document.createElement("style");
  s.id = "prd-styles";
  s.textContent = `
    /* ── Tenant / country chip ── */
    .prd-tenant {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 8px; border-radius:9999px;
      background:color-mix(in oklab, var(--iris-100) 50%, white);
      border:1px solid color-mix(in oklab, var(--iris-300) 30%, transparent);
      font-size:9.5px; font-weight:700; letter-spacing:.04em; color:var(--iris-700);
      font-family:'JetBrains Mono', monospace;
    }
    .prd-tenant .dot { width:5px; height:5px; border-radius:50%; background:#10b981; }

    /* ── Honest-status badge ── */
    .prd-honest {
      display:inline-flex; align-items:center; gap:4px;
      padding:2px 7px; border-radius:6px;
      background:#f1f5f9; color:#334155;
      font-size:9.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
      font-family:'JetBrains Mono', monospace;
    }
    .prd-honest.amber { background:#fef3c7; color:#92400e; }
    .prd-honest.red   { background:#fee2e2; color:#991b1b; }
    .prd-honest.green { background:#dcfce7; color:#166534; }
    .prd-honest.blue  { background:#dbeafe; color:#1e40af; }

    /* ── Cart bar ── */
    .prd-cart-bar {
      position:absolute; left:14px; right:14px; bottom:84px; z-index:60;
      background:#0f172a; color:#fff; border-radius:14px;
      padding:11px 14px; display:flex; align-items:center; gap:10px;
      box-shadow:0 8px 24px rgba(15,23,42,.32);
      cursor:pointer;
      animation: prd-slideup .25s cubic-bezier(.2,0,0,1);
    }
    @keyframes prd-slideup { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
    .prd-cart-count { background:#fff; color:#0f172a; font-size:11px; font-weight:800; padding:2px 8px; border-radius:9999px; }
    .prd-cart-total { font-size:13px; font-weight:700; }
    .prd-cart-cta   { margin-left:auto; background:var(--teal-500,#3aaa7a); color:#fff; padding:6px 12px; border-radius:9px; font-size:11.5px; font-weight:700; }

    /* ── Crisis sheet ── */
    .prd-crisis-card {
      background:#7f1d1d; color:#fff; border-radius:14px; padding:14px 16px;
      display:flex; align-items:center; gap:12px; cursor:pointer;
    }
    .prd-crisis-num { font-family:'Space Grotesk', sans-serif; font-size:26px; font-weight:700; letter-spacing:-.02em; }

    /* ── Audit row ── */
    .prd-audit-row {
      display:flex; gap:10px; padding:10px 0; border-top:1px solid var(--border-subtle);
      font-family:'JetBrains Mono', monospace; font-size:10.5px;
    }
    .prd-audit-row:first-child { border-top:0; }
    .prd-audit-hash { color:var(--fg-4); font-size:9.5px; word-break:break-all; }
    .prd-audit-time { color:var(--fg-3); flex-shrink:0; width:78px; }
    .prd-audit-act  { color:var(--fg-1); font-weight:700; }
    .prd-audit-meta { color:var(--fg-3); margin-top:2px; line-height:1.45; }

    /* ── Subscription card ── */
    .prd-sub-card {
      background:#fff; border:1px solid var(--border-subtle); border-radius:14px;
      padding:14px; display:flex; flex-direction:column; gap:10px;
    }
    .prd-sub-head { display:flex; align-items:flex-start; gap:10px; }
    .prd-sub-title { font-size:14px; font-weight:700; color:var(--fg-1); letter-spacing:-.01em; }
    .prd-sub-sub   { font-size:11px; color:var(--fg-3); margin-top:2px; }
    .prd-sub-state { padding:3px 8px; border-radius:9999px; font-size:9.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
    .prd-sub-state.live   { background:#dcfce7; color:#166534; }
    .prd-sub-state.paused { background:#fef3c7; color:#92400e; }
    .prd-sub-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
    .prd-sub-actions button {
      padding:8px 0; border-radius:9px; border:1px solid var(--border-subtle);
      background:#fff; font-size:10.5px; font-weight:600; color:var(--fg-2);
      font-family:inherit; cursor:pointer;
      display:flex; flex-direction:column; align-items:center; gap:3px;
    }
    .prd-sub-actions button:active { transform:scale(.97); }
    .prd-sub-meta {
      display:flex; justify-content:space-between; gap:10px;
      padding:8px 10px; background:var(--n-50); border-radius:9px;
      font-size:10.5px; color:var(--fg-3);
    }

    /* ── Affiliate strip ── */
    .prd-aff {
      display:flex; align-items:center; gap:8px;
      padding:8px 12px; background:#f1f5f9; border-radius:9px;
      font-size:10.5px; color:var(--fg-3);
    }
    .prd-aff b { color:var(--fg-1); font-weight:700; }

    /* ── Variant chip ── */
    .prd-variant {
      display:inline-flex; align-items:center; gap:4px;
      padding:2px 6px; border-radius:5px;
      background:#ede9fe; color:#5b21b6;
      font-family:'JetBrains Mono', monospace; font-size:9px; font-weight:700;
    }
  `;
  document.head.appendChild(s);
})();

// ── Tenant / country / region context (ADR-023, ADR-024) ──
const TENANT_CTX = {
  id: "telecheck-ghana",
  brand: "Telecheck",
  country: "GH",
  flag: "🇬🇭",
  emergency: "112",
  crisis: "Mental Health Authority · 050 162 6444",
  currency: "GHS",
  payment: "Paystack · MTN MoMo",
  channel: "WhatsApp-primary",
};

function TenantChip({ onClick }) {
  return (
    <span className="prd-tenant" onClick={onClick} role="button" style={{cursor:"pointer"}}>
      <span className="dot"/>{TENANT_CTX.brand} · {TENANT_CTX.country}
    </span>
  );
}

// ── Honest-status helper (§7.1) ──
function HonestStatus({ tone = "blue", children }) {
  return <span className={`prd-honest ${tone}`}>{children}</span>;
}

// ── Crisis helpline sheet (FLOOR-021) ──
function CrisisSheet({ onClose, toast }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t" style={{color:"#7f1d1d"}}>You're not alone</div>
        <div className="sheet-s">If you're in immediate danger or thinking of harming yourself, please reach out now. Telecheck cannot replace emergency services.</div>
        <div className="sheet-body" style={{padding:"4px 18px 22px"}}>
          <div className="prd-crisis-card" onClick={() => { window.location.href = "tel:112"; toast("Calling 112"); }}>
            <div style={{flex:1}}>
              <div style={{fontSize:10, fontWeight:700, letterSpacing:".1em", opacity:.85}}>EMERGENCY · GHANA</div>
              <div className="prd-crisis-num">112</div>
              <div style={{fontSize:11.5, opacity:.9, marginTop:2}}>Police · Ambulance · Fire</div>
            </div>
            <Ic2 n="phone" s={28} c="#fff" sw={2}/>
          </div>
          <div className="prd-crisis-card" style={{background:"#1e293b", marginTop:10}} onClick={() => { window.location.href = "tel:0501626444"; toast("Calling Mental Health Authority"); }}>
            <div style={{flex:1}}>
              <div style={{fontSize:10, fontWeight:700, letterSpacing:".1em", opacity:.85}}>MENTAL HEALTH · 24/7</div>
              <div style={{fontSize:18, fontWeight:700, marginTop:2}}>Mental Health Authority</div>
              <div style={{fontSize:11.5, opacity:.9, marginTop:1, fontFamily:"'JetBrains Mono',monospace"}}>050 162 6444</div>
            </div>
            <Ic2 n="phone" s={24} c="#fff" sw={2}/>
          </div>
          <div style={{marginTop:14, padding:"12px 14px", background:"var(--n-50)", borderRadius:10, fontSize:11.5, color:"var(--fg-2)", lineHeight:1.5}}>
            Telecheck AI runs <b>crisis detection</b> on every conversation and community post (FLOOR-021). When triggered, your message is paused and a clinician is notified within 5 minutes.
          </div>
          <div style={{marginTop:10, fontSize:10.5, color:"var(--fg-4)", textAlign:"center"}}>This screen is the same in every Telecheck region · numbers swap by country.</div>
        </div>
      </div>
    </>
  );
}

// ── Subscription card (Hims/Ro-class mechanics §9.2) ──
function SubscriptionCard({ rx, onAction }) {
  return (
    <div className="prd-sub-card">
      <div className="prd-sub-head">
        <div style={{flex:1, minWidth:0}}>
          <div className="prd-sub-title">{rx.name}</div>
          <div className="prd-sub-sub">Auto-refill every {rx.cadence} · next ship {rx.nextShip}</div>
        </div>
        <span className={`prd-sub-state ${rx.state === "paused" ? "paused" : "live"}`}>{rx.state === "paused" ? "Paused" : "Active"}</span>
      </div>
      <div className="prd-sub-meta">
        <span>Pre-auth window · <b style={{color:"var(--fg-1)"}}>{rx.preAuth}</b></span>
        <span>{rx.price}</span>
      </div>
      <div className="prd-sub-actions">
        <button onClick={() => onAction("pause")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
          Pause
        </button>
        <button onClick={() => onAction("switch")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16h13M7 16l3-3M7 16l3 3M17 8H4M17 8l-3-3M17 8l-3 3"/></svg>
          Switch
        </button>
        <button onClick={() => onAction("skip")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          Skip
        </button>
        <button onClick={() => onAction("cancel")} style={{color:"#991b1b"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Cancel-with-deflection sheet (§9.2 / §20.3) ──
function CancelDeflectionSheet({ rx, onClose, toast, nav }) {
  const [stage, setStage] = usP("reason");
  const [reason, setReason] = usP(null);

  const reasons = [
    { id: "side-fx",  l: "Side effects",            d: "We can lower the dose or switch you to a different option · clinician reviews same day." },
    { id: "cost",     l: "It costs too much",       d: "We have a generic at 60% the price. Same active ingredient." },
    { id: "feel-ok",  l: "I feel better, I'm done", d: "Stopping a chronic medication suddenly can rebound. Pause for 4 weeks instead?" },
    { id: "moving",   l: "Going abroad / travel",   d: "We can ship a 90-day bridge supply before you go." },
    { id: "other",    l: "Other / I just want to stop", d: null },
  ];

  if (stage === "reason") {
    return (
      <>
        <div className="scrim" onClick={onClose}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-t">Before you cancel {rx.name}</div>
          <div className="sheet-s">Help us understand — there may be a better answer than stopping.</div>
          <div className="sheet-body" style={{padding:"4px 18px 18px", display:"grid", gap:8}}>
            {reasons.map(r => (
              <div key={r.id} className="wr-pick-row" onClick={() => { setReason(r); setStage("offer"); }}>
                <div className="wr-pick-body">
                  <div className="wr-pick-t">{r.l}</div>
                  {r.d && <div className="wr-pick-s">{r.d}</div>}
                </div>
                <Ic2 n="chev" s={14} c="var(--fg-4)"/>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (stage === "offer" && reason && reason.id !== "other") {
    const offers = {
      "side-fx": { title: "Talk to a clinician — free", body: "We'll set up a 10-min async review of your side effects. No charge for this consult.", cta: "Book free review", action: () => { nav && nav("doctor-search"); onClose(); } },
      "cost":    { title: "Switch to generic — same medicine, GHS 28/mo", body: "Metformin 500 mg generic from Pharmacy Direct. Identical active ingredient.", cta: "Switch to generic", action: () => { toast("Switched to generic · saves GHS 32/mo"); onClose(); } },
      "feel-ok": { title: "Pause for 4 weeks — keep the option open", body: "We'll hold your subscription. If symptoms return, one tap restarts shipments. No new clinician review needed within 90 days.", cta: "Pause 4 weeks", action: () => { toast(`${rx.name} paused · resumes in 28 days`); onClose(); } },
      "moving":  { title: "Ship 90-day bridge supply", body: "We can ship a 90-day supply before you travel. Clinician auto-approves bridge requests within pre-auth window.", cta: "Request bridge supply", action: () => { toast("90-day bridge requested · ETA 48h"); onClose(); } },
    }[reason.id];
    return (
      <>
        <div className="scrim" onClick={onClose}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-t">{offers.title}</div>
          <div className="sheet-s">{offers.body}</div>
          <div className="sheet-body" style={{padding:"4px 18px 18px"}}>
            <button className="cta" onClick={offers.action}>{offers.cta}</button>
            <button className="cta g" onClick={() => setStage("confirm")}>No thanks · still cancel</button>
          </div>
        </div>
      </>
    );
  }

  // Final confirm + bridge supply on consent revoke (§8 Job 2)
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t" style={{color:"#991b1b"}}>Cancel {rx.name}?</div>
        <div className="sheet-s">Reason: {reason?.l || "Other"}. Cancellation is final and audited.</div>
        <div className="sheet-body" style={{padding:"4px 18px 18px"}}>
          <div style={{padding:"12px 14px", borderRadius:10, background:"#fffbeb", border:"1px solid rgba(194,131,32,.25)", fontSize:12, color:"var(--fg-2)", lineHeight:1.5, marginBottom:14}}>
            <b style={{color:"#b45309"}}>Bridge supply offered.</b> We'll ship a final 14-day supply so you don't run out abruptly. PRD §8 Job-2: stopping chronic meds without taper can rebound BP / glucose.
          </div>
          <button className="cta" style={{background:"#991b1b"}} onClick={() => { toast(`${rx.name} cancelled · bridge ships tomorrow · audited #cnc-7421`); onClose(); }}>Cancel + ship bridge supply</button>
          <button className="cta g" onClick={onClose}>Keep my subscription</button>
        </div>
      </div>
    </>
  );
}

// ── Multi-product cart (§9.2) ──
const _CART = { items: [], listeners: new Set() };
function addToCart(item) {
  _CART.items = [..._CART.items.filter(i => i.id !== item.id), item];
  _CART.listeners.forEach(fn => fn(_CART.items));
}
function removeFromCart(id) {
  _CART.items = _CART.items.filter(i => i.id !== id);
  _CART.listeners.forEach(fn => fn(_CART.items));
}
function CartBar({ onOpen }) {
  const [items, setItems] = usP(_CART.items);
  ueP(() => { _CART.listeners.add(setItems); return () => _CART.listeners.delete(setItems); }, []);
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + (i.price || 0), 0);
  return (
    <div className="prd-cart-bar" onClick={onOpen}>
      <Ic2 n="shop" s={18} c="#fff"/>
      <span className="prd-cart-count">{items.length}</span>
      <span style={{fontSize:12, opacity:.85}}>{items.length === 1 ? items[0].name : `${items.length} items in basket`}</span>
      <span className="prd-cart-total">GHS {total}</span>
      <span className="prd-cart-cta">Checkout →</span>
    </div>
  );
}

function CartSheet({ onClose, toast, nav }) {
  const [items, setItems] = usP(_CART.items);
  const [stage, setStage] = usP("review");
  const [code, setCode] = usP("");
  const [discount, setDiscount] = usP(0);
  ueP(() => { _CART.listeners.add(setItems); return () => _CART.listeners.delete(setItems); }, []);
  const subtotal = items.reduce((s, i) => s + (i.price || 0), 0);
  const ship = subtotal > 100 ? 0 : 12;
  const total = subtotal - discount + ship;

  const apply = () => {
    if (code.toUpperCase() === "TC10") { setDiscount(Math.round(subtotal * 0.1)); toast("Discount applied · 10% off"); }
    else { toast("Code not valid"); }
  };

  if (stage === "review") {
    return (
      <>
        <div className="scrim" onClick={onClose}/>
        <div className="sheet" style={{maxHeight:"80%"}}>
          <div className="sheet-handle"/>
          <div className="sheet-t">Your basket</div>
          <div className="sheet-s">Multi-product cart · per-tenant pricing in {TENANT_CTX.currency} · paid via {TENANT_CTX.payment}</div>
          <div className="sheet-body" style={{padding:"0 18px 22px"}}>
            <div style={{display:"grid", gap:8}}>
              {items.map(i => (
                <div key={i.id} style={{display:"flex", gap:10, padding:10, borderRadius:10, background:"var(--n-50)"}}>
                  <div style={{width:36, height:36, borderRadius:8, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Ic2 n="pill" s={16} c="var(--iris-600)"/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12.5, fontWeight:600, color:"var(--fg-1)"}}>{i.name}</div>
                    <div style={{fontSize:10.5, color:"var(--fg-3)", marginTop:2}}>{i.qty || "1× pack"} · {i.requiresRx ? "Rx · clinician review" : "OTC"}</div>
                  </div>
                  <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
                    <div style={{fontSize:13, fontWeight:700, color:"var(--fg-1)"}}>GHS {i.price}</div>
                    <button onClick={() => removeFromCart(i.id)} style={{background:"none", border:0, color:"var(--fg-4)", fontSize:11, cursor:"pointer"}}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{display:"flex", gap:8, marginTop:12}}>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="Discount code (try TC10)"
                style={{flex:1, padding:"10px 12px", borderRadius:10, border:"1px solid var(--border-subtle)", fontFamily:"inherit", fontSize:12}}/>
              <button onClick={apply} style={{padding:"0 14px", borderRadius:10, border:"1px solid var(--border-subtle)", background:"#fff", fontSize:11.5, fontWeight:600, cursor:"pointer"}}>Apply</button>
            </div>

            <div style={{marginTop:14, padding:"10px 12px", borderRadius:10, background:"var(--n-50)", display:"grid", gap:5, fontSize:12, color:"var(--fg-2)"}}>
              <div style={{display:"flex", justifyContent:"space-between"}}><span>Subtotal</span><span>GHS {subtotal}</span></div>
              {discount > 0 && <div style={{display:"flex", justifyContent:"space-between", color:"#166534"}}><span>Discount · TC10</span><span>− GHS {discount}</span></div>}
              <div style={{display:"flex", justifyContent:"space-between"}}><span>Delivery</span><span>{ship === 0 ? "Free" : `GHS ${ship}`}</span></div>
              <div style={{display:"flex", justifyContent:"space-between", borderTop:"1px solid var(--border-subtle)", paddingTop:6, fontWeight:700, color:"var(--fg-1)"}}>
                <span>Total</span><span>GHS {total}</span>
              </div>
            </div>

            {items.some(i => i.requiresRx) && (
              <div style={{marginTop:10, padding:"10px 12px", borderRadius:10, background:"#fffbeb", border:"1px solid rgba(194,131,32,.25)", fontSize:11, color:"var(--fg-2)", lineHeight:1.45}}>
                <HonestStatus tone="amber">CLINICIAN REVIEW</HonestStatus>{" "}<b>One or more items need a prescription.</b> A clinician reviews your basket within 24 hours before fulfillment. You're not charged until they sign off.
              </div>
            )}

            <div className="prd-aff" style={{marginTop:10}}>
              <Ic2 n="users" s={14} c="var(--fg-4)"/>
              <span>Affiliate · referred by <b>@nurseadjoa</b> · code applied</span>
            </div>

            <button className="cta" style={{marginTop:14}} onClick={() => setStage("paying")}>Pay GHS {total} via MoMo</button>
            <button className="cta g" onClick={onClose}>Keep shopping</button>
          </div>
        </div>
      </>
    );
  }

  if (stage === "paying") {
    setTimeout(() => setStage("done"), 1400);
    return (
      <>
        <div className="scrim"/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-body" style={{padding:"32px 18px"}}>
            <div className="wr-loading"><div className="wr-spin"/><div style={{fontSize:12.5, color:"var(--fg-3)"}}>Charging Paystack · MTN MoMo …</div></div>
          </div>
        </div>
      </>
    );
  }

  // done
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-body" style={{padding:"22px 18px 24px"}}>
          <div className="wr-success-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
          <div className="wr-success-t">Paid · GHS {total}</div>
          <div className="wr-success-s">Receipt sent on WhatsApp · clinician review queued for Rx items · pharmacy dispatch ETA 4h.</div>
          <button className="cta" style={{marginTop:18}} onClick={() => { _CART.items = []; _CART.listeners.forEach(fn => fn([])); onClose(); nav && nav("pharmacy-orders"); }}>Track my order</button>
        </div>
      </div>
    </>
  );
}

// ── Adverse Event reporting (§11.7 #12) ──
function AdverseEventSheet({ onClose, toast }) {
  const [stage, setStage] = usP("intro");
  const [med, setMed] = usP(null);
  const [severity, setSeverity] = usP(null);
  const [text, setText] = usP("");

  const meds = ["Metformin 500 mg", "Lisinopril 10 mg", "Vitamin D 1000 IU", "Other / not listed"];
  const sev = [
    { id: "mild", l: "Mild · noticed but didn't change my day", color: "#10b981" },
    { id: "mod",  l: "Moderate · disrupted activities",          color: "#c28320" },
    { id: "sev",  l: "Severe · needed care",                     color: "#dc2626" },
    { id: "hosp", l: "Hospitalised / life-threatening",          color: "#7f1d1d" },
  ];

  if (stage === "intro") {
    return (
      <>
        <div className="scrim" onClick={onClose}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-t">Report a side effect</div>
          <div className="sheet-s">We forward this to <b>FDA Ghana</b> and Telecheck pharmacovigilance per PRD §11.7 #12. Your name stays out unless you opt in.</div>
          <div className="sheet-body" style={{padding:"0 18px 18px", display:"grid", gap:8}}>
            <div style={{fontSize:11, fontWeight:700, color:"var(--fg-3)", letterSpacing:".06em", textTransform:"uppercase", marginTop:6}}>Which medication?</div>
            {meds.map(m => (
              <div key={m} className={`wr-pick-row ${med === m ? "on" : ""}`} onClick={() => setMed(m)}>
                <div className="wr-pick-body"><div className="wr-pick-t">{m}</div></div>
              </div>
            ))}
            <button className="cta" disabled={!med} style={{marginTop:10, background: med ? "var(--teal-500)" : "var(--n-200)", color: med ? "#fff" : "var(--fg-3)"}} onClick={() => setStage("sev")}>Continue</button>
          </div>
        </div>
      </>
    );
  }

  if (stage === "sev") {
    return (
      <>
        <div className="scrim" onClick={onClose}/>
        <div className="sheet">
          <div className="sheet-handle"/>
          <div className="sheet-t">How severe?</div>
          <div className="sheet-s">If life-threatening, call 112 first. We can still report after.</div>
          <div className="sheet-body" style={{padding:"0 18px 18px", display:"grid", gap:8}}>
            {sev.map(s => (
              <div key={s.id} className={`wr-pick-row ${severity === s.id ? "on" : ""}`} onClick={() => setSeverity(s.id)}>
                <div style={{width:8, height:32, borderRadius:4, background:s.color}}/>
                <div className="wr-pick-body"><div className="wr-pick-t">{s.l}</div></div>
              </div>
            ))}
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="What happened? When did it start?"
              style={{width:"100%", marginTop:6, padding:"10px 12px", borderRadius:10, border:"1px solid var(--border-subtle)", fontFamily:"inherit", fontSize:12, resize:"none"}}/>
            <button className="cta" disabled={!severity} style={{marginTop:6, background: severity ? "var(--teal-500)" : "var(--n-200)", color: severity ? "#fff" : "var(--fg-3)"}} onClick={() => setStage("done")}>Submit report</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-body" style={{padding:"22px 18px 24px"}}>
          <div className="wr-success-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
          <div className="wr-success-t">Report filed · #ae-{Math.floor(Math.random()*9000+1000)}</div>
          <div className="wr-success-s">Forwarded to FDA Ghana within 24 hours. Dr. Mensah will review at your next visit. You can revoke or amend in <b>Me → Privacy → My reports</b>.</div>
          <button className="cta" style={{marginTop:18}} onClick={() => { toast("AE report filed · audited"); onClose(); }}>Done</button>
        </div>
      </div>
    </>
  );
}

// ── Audit chain viewer (ADR-013) ──
function AuditSheet({ onClose }) {
  const events = [
    { t: "10:32:18", a: "video.consult.joined",        m: "Dr. Mensah · LiveKit room rm_8a2f",         h: "0x4f7c8a91…2d3e" },
    { t: "10:31:02", a: "ai.scribe.started",           m: "guardrail v3.1 · provider claude-3.7",      h: "0x9a1c4f8d…b6e2" },
    { t: "10:28:11", a: "consent.episode.granted",     m: "scope: visit-2026-04-20 · 15 min",          h: "0xe4d2c91a…7f88" },
    { t: "09:31:44", a: "pharmacy.refill.dispatched",  m: "Mobipharm Osu · order #ord-7421 · ETA 4h",  h: "0x3b8c2e7f…a5d1" },
    { t: "09:08:55", a: "ai.mode1.message",            m: "thread tc-ai · guardrail-clean",            h: "0x6f1d8e22…c4a9" },
    { t: "08:14:22", a: "rpm.reading.ingested",        m: "Accu-Chek Guide · 122 mg/dL fasting",       h: "0x1c5a7e3b…9d8f" },
  ];
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{maxHeight:"82%"}}>
        <div className="sheet-handle"/>
        <div className="sheet-t">Audit log · today</div>
        <div className="sheet-s">Hash-chained · append-only · ADR-013. You can read every action ever taken on your record but never edit or delete it.</div>
        <div className="sheet-body" style={{padding:"0 18px 22px"}}>
          <div style={{padding:"10px 12px", borderRadius:10, background:"var(--n-50)", display:"flex", gap:10, alignItems:"center", marginBottom:10}}>
            <Ic2 n="shield" s={18} c="#10b981"/>
            <div style={{flex:1, fontSize:11.5, color:"var(--fg-2)"}}>
              <b>Chain integrity verified</b> · 6 events today · 0 silent corruption events platform-wide
            </div>
          </div>
          {events.map((e, i) => (
            <div key={i} className="prd-audit-row">
              <div className="prd-audit-time">{e.t}</div>
              <div style={{flex:1, minWidth:0}}>
                <div className="prd-audit-act">{e.a}</div>
                <div className="prd-audit-meta">{e.m}</div>
                <div className="prd-audit-hash">{e.h}</div>
              </div>
            </div>
          ))}
          <div style={{marginTop:14, fontSize:10.5, color:"var(--fg-4)", textAlign:"center"}}>Per ADR-013: no UPDATE, no DELETE on this table — ever.</div>
        </div>
      </div>
    </>
  );
}

// ── Fake-medication scan result (deep advisory, §11.7 #14) ──
function FakeMedSheet({ onClose, toast, nav }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Authenticity check</div>
        <div className="sheet-s"><HonestStatus tone="blue">ADVISORY ONLY</HonestStatus> Telecheck never confiscates or blocks meds — we surface signals so you can decide.</div>
        <div className="sheet-body" style={{padding:"0 18px 22px"}}>
          <div style={{padding:14, borderRadius:14, background:"linear-gradient(135deg,#fef3c7,#fed7aa)", border:"1px solid rgba(194,131,32,.3)", marginBottom:12}}>
            <div style={{fontSize:10, fontWeight:700, letterSpacing:".1em", color:"#92400e", marginBottom:4}}>SIGNAL · MODERATE CONCERN</div>
            <div style={{fontSize:15, fontWeight:700, color:"#7c2d12", letterSpacing:"-.01em"}}>Metformin 500 mg · pack from Maxmart Pharmacy</div>
            <div style={{fontSize:11.5, color:"var(--fg-2)", marginTop:6, lineHeight:1.5}}>Batch number doesn't match FDA Ghana register. <b>2 of 3 authentication checks passed.</b></div>
          </div>

          <div className="extract">
            <div className="extract-row"><span className="k">Holographic seal</span><span className="v ok">✓ Genuine</span></div>
            <div className="extract-row"><span className="k">QR · FDA Ghana register</span><span className="v" style={{color:"#b45309", fontFamily:"inherit", fontWeight:600}}>✗ Not found</span></div>
            <div className="extract-row"><span className="k">Pill imprint</span><span className="v ok">✓ Matches</span></div>
            <div className="extract-row"><span className="k">Source pharmacy</span><span className="v" style={{color:"var(--fg-1)", fontFamily:"inherit", fontWeight:500}}>Maxmart · not in partner network</span></div>
          </div>

          <div className="section-h"><span>What to do</span></div>
          <div style={{display:"grid", gap:8}}>
            <button className="cta" style={{margin:0}} onClick={() => { toast("Reported to FDA Ghana · #fmd-3812"); onClose(); }}>Report to FDA Ghana</button>
            <button className="cta g" onClick={() => { onClose(); nav && nav("pharmacy-shop"); }}>Order from Telecheck pharmacy instead</button>
            <button className="cta g" onClick={onClose}>Keep using anyway</button>
          </div>
          <div style={{marginTop:12, fontSize:10.5, color:"var(--fg-4)", textAlign:"center"}}>Per I-008: this is advisory. Final decision is yours.</div>
        </div>
      </div>
    </>
  );
}

// ── Save-and-resume intake banner (§9.1) ──
function ResumeIntakeBanner({ onResume, onDismiss }) {
  return (
    <div style={{
      margin: "10px 14px 0", padding:"12px 14px", borderRadius:12,
      background:"linear-gradient(135deg, #f0f9ff, #e0f2fe)",
      border:"1px solid rgba(14,165,233,.25)",
      display:"flex", alignItems:"center", gap:10,
    }}>
      <div style={{width:32, height:32, borderRadius:9, background:"#0ea5e9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
        <Ic2 n="doc" s={16} c="#fff"/>
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:12, fontWeight:700, color:"var(--fg-1)"}}>Resume GLP-1 intake · 60% done</div>
        <div style={{fontSize:10.5, color:"var(--fg-3)", marginTop:1}}>Saved 2 days ago · 4 of 10 steps left · <span className="prd-variant">VAR_B</span></div>
      </div>
      <button onClick={onResume} style={{background:"#0ea5e9", color:"#fff", border:0, padding:"6px 12px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer"}}>Resume</button>
      <button onClick={onDismiss} style={{background:"none", border:0, color:"var(--fg-4)", fontSize:14, cursor:"pointer", padding:4}}>×</button>
    </div>
  );
}

// ── PRD Alignment hub screen ──
function PrdAlignmentHub({ nav, openSheet }) {
  return (
    <div style={{padding:"4px 14px 22px"}}>
      <div style={{padding:"14px 16px", background:"linear-gradient(135deg,#1e293b,#0f172a)", borderRadius:14, color:"#fff", marginBottom:14}}>
        <div style={{fontSize:9.5, fontWeight:700, letterSpacing:".12em", color:"#94a3b8", marginBottom:4}}>PRD v1.9 · ALIGNMENT MAP</div>
        <div style={{fontSize:17, fontWeight:700, letterSpacing:"-.015em"}}>Patient app conformance</div>
        <div style={{fontSize:11.5, color:"#cbd5e1", marginTop:4, lineHeight:1.5}}>Every screen below ties to a PRD section. Tap to walk the mandatory flows that v6 was missing.</div>
        <div style={{display:"flex", gap:6, marginTop:10, flexWrap:"wrap"}}>
          <TenantChip onClick={() => openSheet("tenant")}/>
          <span className="prd-honest blue">EN-GH</span>
          <span className="prd-honest green">CRISIS-ON</span>
          <span className="prd-honest blue">AUDIT-OK</span>
        </div>
      </div>

      <div className="section-h"><span>§9.2 Subscription mechanics</span></div>
      <SubscriptionCard
        rx={{ name: "Metformin 500 mg", cadence: "30 days", nextShip: "12 May", preAuth: "5 of 6 mo left", price: "GHS 60/mo", state: "live" }}
        onAction={(a) => openSheet(a === "cancel" ? "cancel-defl" : a)}
      />

      <div className="section-h"><span>§9.2 Multi-product cart</span></div>
      <div style={{display:"grid", gap:8}}>
        <div className="lc" onClick={() => { addToCart({ id:"para", name:"Paracetamol 500 mg ×20", price:8, requiresRx:false }); }}>
          <div className="lc-ic teal"><Ic2 n="pill" s={18}/></div>
          <div><div className="lc-t">Add Paracetamol · GHS 8</div><div className="lc-s">OTC · no review</div></div>
          <div className="lc-chev"><Ic2 n="plus" s={16}/></div>
        </div>
        <div className="lc" onClick={() => { addToCart({ id:"vitd", name:"Vitamin D 1000 IU ×60", price:35, requiresRx:false }); }}>
          <div className="lc-ic gold"><Ic2 n="pill" s={18}/></div>
          <div><div className="lc-t">Add Vitamin D · GHS 35</div><div className="lc-s">OTC · supplement</div></div>
          <div className="lc-chev"><Ic2 n="plus" s={16}/></div>
        </div>
        <div className="lc" onClick={() => { addToCart({ id:"glp1", name:"Semaglutide 0.25 mg pen", price:480, requiresRx:true }); }}>
          <div className="lc-ic iris"><Ic2 n="pill" s={18}/></div>
          <div><div className="lc-t">Add Semaglutide · GHS 480</div><div className="lc-s">Rx · clinician review required</div></div>
          <div className="lc-chev"><Ic2 n="plus" s={16}/></div>
        </div>
      </div>

      <div className="section-h"><span>§11.7 Safety mandates</span></div>
      <div className="lc" onClick={() => openSheet("ae")}>
        <div className="lc-ic warn"><Ic2 n="flag" s={18}/></div>
        <div><div className="lc-t">Report a side effect <span className="lp warn">FDA-GH</span></div><div className="lc-s">Adverse event · pharmacovigilance</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={16}/></div>
      </div>
      <div className="lc" onClick={() => openSheet("fakemed")}>
        <div className="lc-ic warn"><Ic2 n="scan" s={18}/></div>
        <div><div className="lc-t">Fake-med scan result</div><div className="lc-s">Advisory only · FDA Ghana register</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={16}/></div>
      </div>
      <div className="lc" onClick={() => openSheet("crisis")}>
        <div className="lc-ic" style={{background:"#7f1d1d", color:"#fff"}}><Ic2 n="sos" s={18} c="#fff"/></div>
        <div><div className="lc-t">Crisis helpline · 112 / Mental Health</div><div className="lc-s">FLOOR-021 · always-on</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={16}/></div>
      </div>

      <div className="section-h"><span>§20.4 Audit & trust</span></div>
      <div className="lc" onClick={() => openSheet("audit")}>
        <div className="lc-ic info"><Ic2 n="lock" s={18}/></div>
        <div><div className="lc-t">My audit log <HonestStatus tone="green">IMMUTABLE</HonestStatus></div><div className="lc-s">Hash-chained · ADR-013 · readable, never editable</div></div>
        <div className="lc-chev"><Ic2 n="chev" s={16}/></div>
      </div>

      <div className="section-h"><span>§9.1 Forms / Intake</span></div>
      <ResumeIntakeBanner
        onResume={() => { window.__tcNav && window.__tcNav("visit-prep"); }}
        onDismiss={() => {}}
      />

      <div className="section-h"><span>§9.3 Tenant + commerce</span></div>
      <div style={{padding:14, borderRadius:12, background:"#fff", border:"1px solid var(--border-subtle)"}}>
        <div style={{fontSize:11, fontWeight:700, color:"var(--fg-3)", letterSpacing:".06em", textTransform:"uppercase", marginBottom:8}}>Country profile · ADR-024</div>
        <div className="extract">
          <div className="extract-row"><span className="k">Tenant</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:600}}>Telecheck-Ghana 🇬🇭</span></div>
          <div className="extract-row"><span className="k">Currency</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>GHS · Paystack</span></div>
          <div className="extract-row"><span className="k">Payment</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>MTN MoMo · Vodafone Cash · card</span></div>
          <div className="extract-row"><span className="k">Channel</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>WhatsApp-primary · SMS fallback</span></div>
          <div className="extract-row"><span className="k">AE destination</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>FDA Ghana / WHO VigiBase</span></div>
          <div className="extract-row"><span className="k">Emergency</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>112 · Mental Health Authority</span></div>
        </div>
        <div className="prd-aff" style={{marginTop:10}}>
          <Ic2 n="users" s={14} c="var(--fg-4)"/>
          <span>Affiliate referral tracked · <b>@nurseadjoa</b> · attribution window 30 days</span>
        </div>
      </div>
    </div>
  );
}

// ── Wrap PrdAlignmentHub in app chrome (uses 5-tab bottom nav) ──
function PrdAlignScreen(props) {
  const [sheet, setSheet] = usP(null);
  return (
    <div className="app has-topbar">
      <SB2/>
      <TopBar
        delegate={props.delegate}
        onAccount={props.openAccount}
        onNotifs={props.openNotifs}
        onEmergency={() => setSheet("crisis")}
        onAI={props.openAI}
      />
      <div className="scroll">
        <BigH title="PRD alignment" sub="Every PRD-mandated capability mapped to this app · v1.9"/>
        <div className="content">
          <PrdAlignmentHub nav={props.nav} openSheet={setSheet}/>
        </div>
      </div>
      <CartBar onOpen={() => setSheet("cart")}/>
      <TabBar2 active={props.nav ? "" : ""} onTab={props.nav}/>

      {sheet === "crisis"     && <CrisisSheet onClose={() => setSheet(null)} toast={props.toast}/>}
      {sheet === "audit"      && <AuditSheet onClose={() => setSheet(null)}/>}
      {sheet === "ae"         && <AdverseEventSheet onClose={() => setSheet(null)} toast={props.toast}/>}
      {sheet === "fakemed"    && <FakeMedSheet onClose={() => setSheet(null)} toast={props.toast} nav={props.nav}/>}
      {sheet === "cart"       && <CartSheet onClose={() => setSheet(null)} toast={props.toast} nav={props.nav}/>}
      {sheet === "cancel-defl"&& <CancelDeflectionSheet rx={{name:"Metformin 500 mg"}} onClose={() => setSheet(null)} toast={props.toast} nav={props.nav}/>}
      {sheet === "pause"      && <SubActionSheet action="pause" onClose={() => setSheet(null)} toast={props.toast}/>}
      {sheet === "switch"     && <SubActionSheet action="switch" onClose={() => setSheet(null)} toast={props.toast}/>}
      {sheet === "skip"       && <SubActionSheet action="skip" onClose={() => setSheet(null)} toast={props.toast}/>}
      {sheet === "tenant"     && <TenantSheet onClose={() => setSheet(null)}/>}
    </div>
  );
}

function SubActionSheet({ action, onClose, toast }) {
  const meta = {
    pause:  { t: "Pause Metformin?",  s: "Holds shipments. One tap restarts within 90 days · no new clinician review.", cta: "Pause 4 weeks", done: "Paused · resumes 18 May" },
    switch: { t: "Switch to generic", s: "Same active ingredient · GHS 28/mo (vs GHS 60). Clinician auto-approves equivalent generics.", cta: "Switch to generic", done: "Switched to generic · saves GHS 32/mo" },
    skip:   { t: "Skip next ship?",    s: "Skips 12 May · resumes 12 Jun. Useful if you've stockpiled.",                cta: "Skip this ship", done: "Skipped · next ship 12 Jun" },
  }[action];
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">{meta.t}</div>
        <div className="sheet-s">{meta.s}</div>
        <div className="sheet-body" style={{padding:"4px 18px 18px"}}>
          <button className="cta" onClick={() => { toast(meta.done); onClose(); }}>{meta.cta}</button>
          <button className="cta g" onClick={onClose}>Back</button>
        </div>
      </div>
    </>
  );
}

function TenantSheet({ onClose }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-t">Tenant context</div>
        <div className="sheet-s">Per ADR-023, you're inside the Telecheck-Ghana tenant. Your data never crosses to Heros Health or any other tenant — three-layer enforcement (RLS + app filter + per-tenant KMS).</div>
        <div className="sheet-body" style={{padding:"0 18px 22px"}}>
          <div className="extract">
            <div className="extract-row"><span className="k">Tenant ID</span><span className="v" style={{fontFamily:"'JetBrains Mono',monospace", color:"var(--fg-1)"}}>telecheck-ghana</span></div>
            <div className="extract-row"><span className="k">Operator</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>Telecheck team</span></div>
            <div className="extract-row"><span className="k">Country</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>Ghana 🇬🇭 (GH)</span></div>
            <div className="extract-row"><span className="k">Region</span><span className="v" style={{fontFamily:"inherit", color:"var(--fg-1)", fontWeight:500}}>AWS us-east-1 · DR us-west-2</span></div>
            <div className="extract-row"><span className="k">Isolation</span><span className="v ok">3-layer · verified</span></div>
            <div className="extract-row"><span className="k">Encryption</span><span className="v ok">Per-tenant KMS · ADR-024</span></div>
          </div>
          <div style={{marginTop:14, fontSize:11, color:"var(--fg-3)", lineHeight:1.5}}>Sister tenant <b>Heros Health (US)</b> shares the same platform code but never sees this data. Cross-border processing disclosed in your privacy notice.</div>
        </div>
      </div>
    </>
  );
}

// ── Expose globally so any existing screen can summon these ──
Object.assign(window, {
  TenantChip, HonestStatus, CrisisSheet, SubscriptionCard, CancelDeflectionSheet,
  CartBar, CartSheet, addToCart, removeFromCart,
  AdverseEventSheet, AuditSheet, FakeMedSheet, ResumeIntakeBanner, PrdAlignScreen,
  TenantSheet, SubActionSheet, TENANT_CTX,
});
