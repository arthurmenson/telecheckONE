// Patient v3 — Pharmacy + inner pages

const { useState: uSP3 } = React;

// ── PHARMACY ──────────────────────────────────────
function PharmacyV3({ nav, toast }) {
  const [sub, setSub] = uSP3("Rx");
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <TopBar onAI={() => nav("ai")}/>
        <div className="hero">
          <div className="lbl">Pharmacy</div>
          <h1>Refill, shop, <em>safely</em>.</h1>
          <div className="sub">Screened against your 3 active meds and conditions.</div>
        </div>
        <SubTabs items={["Rx","Shop","Orders","Safety"]} active={sub} onPick={setSub}/>

        {sub === "Rx" && <PhRx nav={nav} toast={toast}/>}
        {sub === "Shop" && <PhShop nav={nav} toast={toast}/>}
        {sub === "Orders" && <PhOrders nav={nav} toast={toast}/>}
        {sub === "Safety" && <PhSafety nav={nav} toast={toast}/>}

        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="pharmacy" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

function PhRx({ nav, toast }) {
  return (
    <>
      <div className="sect"><div className="t">Active prescriptions</div></div>
      <div>
        <div className="row" onClick={() => nav("pharmacy-rx")}>
          <div className="row-ic" style={{ background: "var(--warn-50)", color: "var(--warn)" }}><I n="pill" s={18}/></div>
          <div className="row-body">
            <div className="row-t">Metformin · 500 mg</div>
            <div className="row-s">2× daily · 4 days until refill</div>
          </div>
          <span className="tl-tag warn" style={{ margin: 0 }}>In review</span>
          <div className="chev" style={{ marginLeft: 10 }}><I n="chev" s={16}/></div>
        </div>
        <div className="row" onClick={() => nav("pharmacy-rx")}>
          <div className="row-ic"><I n="pill" s={18}/></div>
          <div className="row-body">
            <div className="row-t">Lisinopril · 10 mg</div>
            <div className="row-s">1× daily · auto-refill 02 May</div>
          </div>
          <span className="tl-tag ok" style={{ margin: 0 }}>On auto</span>
          <div className="chev" style={{ marginLeft: 10 }}><I n="chev" s={16}/></div>
        </div>
        <div className="row" onClick={() => nav("pharmacy-rx")}>
          <div className="row-ic"><I n="pill" s={18}/></div>
          <div className="row-body">
            <div className="row-t">Vitamin D3 · 1000 IU</div>
            <div className="row-s">1× daily · 28 tablets left</div>
          </div>
          <div className="chev"><I n="chev" s={16}/></div>
        </div>
      </div>

      <div className="ai-whisper">
        <div className="ic"><I n="spark" s={12} sw={2}/></div>
        <div style={{ flex: 1 }}>
          <div className="t">A steady <em>19:00 evening dose</em> of metformin usually resettles HbA1c within 6 weeks.</div>
          <div className="acts">
            <a onClick={() => toast("Reminder set · 19:00")}>Set reminder</a>
            <a className="sec" onClick={() => nav("ai")}>Ask follow-up</a>
          </div>
        </div>
      </div>

      <div className="sect"><div className="t">This week · adherence</div></div>
      <div className="dose-strip">
        {[
          ["Mon","14","taken"],["Tue","15","taken"],["Wed","16","taken"],
          ["Thu","17","missed"],["Fri","18","taken"],["Sat","19","taken"],
          ["Sun","20","taken"],["Mon","21",""],
        ].map(([dow, d, st], i) => (
          <div key={i} className={`dose-pill ${st}`}>
            <div className="dow">{dow}</div>
            <div className="d">{d}</div>
            <div className="st">{st === "taken" ? "✓" : st === "missed" ? "—" : "···"}</div>
          </div>
        ))}
      </div>

      <div className="sect"><div className="t">From your doctor</div></div>
      <div>
        <div className="row" onClick={() => nav("pharmacy-rx")}>
          <div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="doc" s={18}/></div>
          <div className="row-body">
            <div className="row-t">New prescription · review</div>
            <div className="row-s">Dr. Mensah · today 09:41</div>
          </div>
          <div className="chev"><I n="chev" s={16}/></div>
        </div>
      </div>
    </>
  );
}

function PhShop({ nav, toast }) {
  const [cat, setCat] = uSP3("All");
  const items = [
    { n: "Paracetamol 500 mg", p: "GHS 8", s: "Mobipharm Osu", saf: "safe" },
    { n: "Vitamin D3 1000 IU", p: "GHS 42", s: "Already on your list", saf: "safe" },
    { n: "Ibuprofen 400 mg", p: "GHS 12", s: "Flagged with lisinopril", saf: "warn" },
    { n: "Glucose strips · 50", p: "GHS 95", s: "In stock · Accra", saf: "safe" },
    { n: "Digital BP cuff", p: "GHS 220", s: "Omron · 2-yr warranty", saf: "" },
    { n: "Oral rehydration salts", p: "GHS 6", s: "WHO formula", saf: "safe" },
  ];
  return (
    <>
      <div className="searchbar"><I n="search" s={16} c="var(--ink-3)"/><input placeholder="Search meds, devices, vitamins…"/></div>
      <div className="subtabs" style={{ padding: "0 24px 4px", borderBottom: 0, marginTop: 4 }}>
        {["All","OTC","Vitamins","Condition","Devices","Hygiene"].map(c => (
          <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="shop-grid">
        {items.map((i, idx) => (
          <div className="shop-c" key={idx} onClick={() => nav("pharmacy-product")}>
            <div className="img" data-label="PRODUCT"/>
            <div className="n">{i.n}</div>
            <div className="p">{i.p}</div>
            <div className="s">{i.s}</div>
            {i.saf === "safe" && <div className="saf">✓ Safe for you</div>}
            {i.saf === "warn" && <div className="saf warn">⚠ Caution</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function PhOrders({ nav, toast }) {
  return (
    <>
      <div className="sect"><div className="t">In progress</div></div>
      <div className="steps">
        <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Request sent</div><div className="st-s">You · today 09:28</div></div><div className="tm">09:28</div></div>
        <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Interaction check</div><div className="st-s">Clear · no conflicts</div></div><div className="tm">09:31</div></div>
        <div className="step now"><div className="b"/><div className="ln"/><div><div className="st-t">Clinician review</div><div className="st-s">Dr. Mensah · ETA 2h</div></div><div className="tm">now</div></div>
        <div className="step pending"><div className="b"/><div className="ln"/><div><div className="st-t">Dispensed</div><div className="st-s">Mobipharm Osu</div></div><div className="tm">—</div></div>
        <div className="step pending"><div className="b"/><div><div className="st-t">Delivered</div><div className="st-s">Osu · 22 Apr · 10–14</div></div><div className="tm">—</div></div>
      </div>

      <div className="sect"><div className="t">History</div></div>
      <div>
        <div className="row" onClick={() => nav("pharmacy-order")}>
          <div className="row-ic"><I n="truck" s={18}/></div>
          <div className="row-body"><div className="row-t">Order #1042 · delivered</div><div className="row-s">14 Apr · GHS 55 · receipt</div></div>
          <div className="chev"><I n="chev" s={16}/></div>
        </div>
        <div className="row" onClick={() => nav("pharmacy-order")}>
          <div className="row-ic"><I n="truck" s={18}/></div>
          <div className="row-body"><div className="row-t">Order #1019 · delivered</div><div className="row-s">28 Mar · GHS 88 · receipt</div></div>
          <div className="chev"><I n="chev" s={16}/></div>
        </div>
        <div className="row" onClick={() => nav("pharmacy-order")}>
          <div className="row-ic"><I n="truck" s={18}/></div>
          <div className="row-body"><div className="row-t">Order #0988 · delivered</div><div className="row-s">10 Mar · GHS 42 · receipt</div></div>
          <div className="chev"><I n="chev" s={16}/></div>
        </div>
      </div>
    </>
  );
}

function PhSafety({ nav, toast }) {
  return (
    <>
      <div className="shield-card">
        <div className="ic"><I n="shield" s={20} c="#fff"/></div>
        <div className="t">Every order is screened against <em style={{ color: "var(--teal-600)", fontStyle: "normal", fontWeight: 500 }}>your regimen</em>.</div>
        <div className="s">Your 3 active meds and 2 conditions are compared with anything you add — over-the-counter included. Last check today at 09:41.</div>
        <div className="list">
          <div className="list-r"><span className="ck"><I n="check" s={14} sw={2.2}/></span> Interactions with metformin, lisinopril, vitamin D</div>
          <div className="list-r"><span className="ck"><I n="check" s={14} sw={2.2}/></span> Kidney-safe dosing · eGFR 94</div>
          <div className="list-r"><span className="ck"><I n="check" s={14} sw={2.2}/></span> Penicillin allergy filter</div>
          <div className="list-r"><span className="ck"><I n="check" s={14} sw={2.2}/></span> Pregnancy & breastfeeding flags</div>
        </div>
      </div>

      <div className="sect"><div className="t">Recent checks</div></div>
      <div className="inter-card">
        <div className="tag">Caution · flagged 09:38</div>
        <div className="t">Ibuprofen + lisinopril reduces BP control</div>
        <div className="s">Taken together can affect kidney function. Paracetamol is safer given your current regimen.</div>
        <div className="src">Source: lisinopril 10 mg · eGFR 94 · BP 124/78</div>
        <div className="acts">
          <button className="primary" onClick={() => toast("Swapped · paracetamol")}>Swap to paracetamol</button>
          <button onClick={() => toast("Details")}>Details</button>
        </div>
      </div>

      <div className="sect"><div className="t">Pharmacies you trust</div></div>
      <div>
        <div className="row"><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Mobipharm Osu</div><div className="row-s">Verified · 1.2 km · GPCP licence 4421</div></div><div className="chev"><I n="chev" s={16}/></div></div>
        <div className="row"><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Ernest Chemists · Airport</div><div className="row-s">Verified · 3.4 km · GPCP licence 2103</div></div><div className="chev"><I n="chev" s={16}/></div></div>
      </div>
    </>
  );
}

// ── INNER: Rx detail ──────────────────────────────
function RxDetailV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("pharmacy")} title="Prescription" sub="Dr. A. Mensah · 14 Apr"/>
        <div className="hero tight">
          <div className="lbl">Active prescription</div>
          <h1>Metformin · <em>500 mg</em></h1>
          <div className="sub">2× daily · morning and evening · with food</div>
        </div>
        <div className="tagrow">
          <span className="chip warn">In review</span>
          <span className="chip">30-day supply</span>
          <span className="chip">Refill × 3</span>
        </div>

        <div className="sect"><div className="t">Dosing</div></div>
        <div>
          <div className="kv"><span className="k">Strength</span><span className="v">500 mg tablet</span></div>
          <div className="kv"><span className="k">Frequency</span><span className="v">2× daily</span></div>
          <div className="kv"><span className="k">Duration</span><span className="v">30 days</span></div>
          <div className="kv"><span className="k">Refills left</span><span className="v">3 of 5</span></div>
          <div className="kv"><span className="k">Next refill</span><span className="v">24 Apr</span></div>
        </div>

        <div className="sect"><div className="t">How to take</div></div>
        <div style={{ padding: "0 24px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Take with your morning and evening meal. Swallow whole with water — don't crush. If you miss a dose, skip it; don't double up.
        </div>

        <div className="sect"><div className="t">Side effects to watch</div></div>
        <div>
          <div className="row"><div className="row-body"><div className="row-t">Nausea · mild</div><div className="row-s">Usually settles in 1–2 weeks</div></div></div>
          <div className="row"><div className="row-body"><div className="row-t">Lactic acidosis · rare</div><div className="row-s">Call Dr. Mensah if unusual fatigue or breath shortness</div></div></div>
        </div>

        <button className="btn-primary teal" onClick={() => toast("Refill requested")}>Request refill</button>
        <button className="btn-ghost" onClick={() => toast("Message sent to Dr. Mensah")}>Ask Dr. Mensah</button>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="pharmacy" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Product detail ─────────────────────────
function ProductV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("pharmacy")} title="Product" right={<button className="ico-btn" onClick={() => nav("pharmacy-cart")}><I n="shop" s={18}/></button>}/>
        <div className="product-img" data-label="PARACETAMOL 500MG · 20 TAB"/>
        <div className="hero tight">
          <div className="lbl">Mobipharm Osu · in stock</div>
          <h1>Paracetamol · <em>500 mg</em></h1>
          <div className="sub" style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink-1)", marginTop: 4 }}>GHS 8</div>
        </div>
        <div className="tagrow">
          <span className="chip teal">✓ Safe for you</span>
          <span className="chip">OTC</span>
          <span className="chip">Pack of 20</span>
        </div>

        <div className="sect"><div className="t">Safety check for Ama</div></div>
        <div>
          <div className="row"><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="check" s={18}/></div><div className="row-body"><div className="row-t">No interactions with your 3 meds</div></div></div>
          <div className="row"><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Kidney-safe at recommended dose</div></div></div>
          <div className="row"><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Not on your allergy list</div></div></div>
        </div>

        <div className="sect"><div className="t">About</div></div>
        <div style={{ padding: "0 24px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
          For mild to moderate pain and fever. Max 4 g per day for adults. Do not combine with other paracetamol-containing products.
        </div>

        <button className="btn-primary" onClick={() => { toast("Added to cart"); nav("pharmacy-cart"); }}>Add to cart · GHS 8</button>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="pharmacy" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Cart / checkout ────────────────────────
function CartV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("pharmacy")} title="Your basket" sub="2 items · Mobipharm Osu"/>

        <div>
          <div className="cart-item">
            <div className="thumb"/>
            <div className="body">
              <div className="n">Paracetamol 500 mg · 20 tab</div>
              <div className="s">Mobipharm Osu</div>
              <div className="p">GHS 8</div>
              <div className="qty"><button>−</button><span>1</span><button>+</button></div>
            </div>
          </div>
          <div className="cart-item">
            <div className="thumb"/>
            <div className="body">
              <div className="n">Glucose strips · 50</div>
              <div className="s">Mobipharm Osu · in stock</div>
              <div className="p">GHS 95</div>
              <div className="qty"><button>−</button><span>1</span><button>+</button></div>
            </div>
          </div>
        </div>

        <div className="shield-card" style={{ margin: "18px 24px", padding: 14 }}>
          <div className="list-r" style={{ color: "var(--teal-600)", fontSize: 12.5, fontWeight: 500 }}>
            <span className="ck"><I n="shield" s={16}/></span>
            Safety cleared · no interactions with your meds
          </div>
        </div>

        <div className="sect"><div className="t">Summary</div></div>
        <div className="sum">
          <div className="sum-r"><span>Subtotal</span><span>GHS 103</span></div>
          <div className="sum-r"><span>Delivery · Osu</span><span>GHS 15</span></div>
          <div className="sum-r"><span>NHIS discount</span><span>− GHS 20</span></div>
          <div className="sum-r total"><span>Total</span><span>GHS 98</span></div>
        </div>

        <div className="sect"><div className="t">Delivery</div></div>
        <div>
          <div className="row"><div className="row-ic"><I n="truck" s={18}/></div><div className="row-body"><div className="row-t">Home · Cantonments</div><div className="row-s">Tomorrow · 10–14</div></div><div className="chev"><I n="chev" s={16}/></div></div>
          <div className="row"><div className="row-ic"><I n="user" s={18}/></div><div className="row-body"><div className="row-t">Payment · MTN MoMo</div><div className="row-s">•• 0142</div></div><div className="chev"><I n="chev" s={16}/></div></div>
        </div>

        <button className="btn-primary teal" onClick={() => { toast("Order placed"); nav("pharmacy"); }}>Place order · GHS 98</button>
        <div style={{ height: 24 }}/>
      </div>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Order detail ───────────────────────────
function OrderDetailV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("pharmacy")} title="Order #1042" sub="Delivered · 14 Apr"/>
        <div className="hero tight">
          <div className="lbl">Mobipharm Osu</div>
          <h1><em>2 items</em> · GHS 55</h1>
          <div className="sub">Delivered to Cantonments · 14 Apr 12:08</div>
        </div>

        <div className="sect"><div className="t">Items</div></div>
        <div>
          <div className="cart-item">
            <div className="thumb"/>
            <div className="body">
              <div className="n">Metformin 500 mg · 60 tab</div>
              <div className="s">1-month supply · refill 3 of 5</div>
              <div className="p">GHS 40</div>
            </div>
          </div>
          <div className="cart-item">
            <div className="thumb"/>
            <div className="body">
              <div className="n">Vitamin D3 · 1000 IU</div>
              <div className="s">30 tablets</div>
              <div className="p">GHS 15</div>
            </div>
          </div>
        </div>

        <div className="sect"><div className="t">Timeline</div></div>
        <div className="steps">
          <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Ordered</div><div className="st-s">14 Apr · 09:04</div></div><div className="tm">09:04</div></div>
          <div className="step done"><div className="b"/><div className="ln"/><div><div className="st-t">Dispensed</div><div className="st-s">Mobipharm Osu</div></div><div className="tm">10:22</div></div>
          <div className="step done"><div className="b"/><div><div className="st-t">Delivered</div><div className="st-s">Cantonments · signed by Ama</div></div><div className="tm">12:08</div></div>
        </div>

        <button className="btn-primary" onClick={() => toast("Reordered")}>Reorder</button>
        <button className="btn-ghost" onClick={() => toast("Receipt downloaded")}>Download receipt</button>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="pharmacy" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Thread (messages) ──────────────────────
function ThreadV3({ nav, toast }) {
  const [v, setV] = uSP3("");
  const [msgs, setMsgs] = uSP3([
    { r: "them", t: "Saw your evening log — let's talk about timing at 10:30.", tm: "09:08" },
    { r: "me", t: "Sounds good. I missed three doses last month — that's probably part of it.", tm: "09:11" },
    { r: "them", t: "Yes, that lines up. Let's set a 19:00 reminder together during the call.", tm: "09:12" },
  ]);
  const send = (t) => {
    if (!t.trim()) return;
    setMsgs(x => [...x, { r: "me", t, tm: "now" }]);
    setV("");
  };
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("care")} title="Dr. A. Mensah" sub="Endocrinology · replies <1h"
          right={<button className="ico-btn" onClick={() => toast("Calling…")}><I n="phone" s={18}/></button>}/>
        <div className="thread">
          {msgs.map((m, i) => <div key={i} className={`msg ${m.r}`}>{m.t}</div>)}
        </div>
      </div>
      <div className="composer">
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === "Enter" && send(v)} placeholder="Message Dr. Mensah…"/>
        <button className="send" onClick={() => send(v)}><I n="arrow" s={16} sw={2} c="#fff"/></button>
      </div>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Messages index (standalone inner page) ─
function MessagesV3({ nav }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("care")} title="Messages"/>
        <div>
          <div className="row" onClick={() => nav("care-thread")}><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="user" s={18}/></div><div className="row-body"><div className="row-t">Dr. Mensah</div><div className="row-s">Saw your evening log — let's talk at 10:30.</div></div><span className="tl-tag ok">New</span></div>
          <div className="row" onClick={() => nav("care-thread")}><div className="row-ic"><I n="user" s={18}/></div><div className="row-body"><div className="row-t">Nurse Adjoa</div><div className="row-s">Nice walk streak.</div></div></div>
        </div>
      </div>
      <Tabs active="care" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Team member ────────────────────────────
function TeamMemberV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("care")} title="Provider"/>
        <div className="hero tight">
          <div className="lbl">Primary · endocrinology</div>
          <h1>Dr. Akosua <em>Mensah</em></h1>
          <div className="sub">Korle-Bu Teaching Hospital · 14 years · replies within 1 hour</div>
        </div>
        <div className="tagrow">
          <span className="chip teal">Primary</span>
          <span className="chip">Diabetes RPM lead</span>
          <span className="chip">English · Twi</span>
        </div>

        <div className="sect"><div className="t">Contact</div></div>
        <div>
          <div className="row" onClick={() => nav("care-thread")}><div className="row-ic" style={{ background: "var(--teal-50)", color: "var(--teal-600)" }}><I n="chat" s={18}/></div><div className="row-body"><div className="row-t">Message</div><div className="row-s">Async · 1h response</div></div></div>
          <div className="row" onClick={() => toast("Booking…")}><div className="row-ic"><I n="calendar" s={18}/></div><div className="row-body"><div className="row-t">Book a visit</div><div className="row-s">Next slot · tomorrow 14:00</div></div></div>
          <div className="row" onClick={() => toast("Calling clinical line…")}><div className="row-ic"><I n="phone" s={18}/></div><div className="row-body"><div className="row-t">Clinical line · urgent only</div></div></div>
        </div>

        <div className="sect"><div className="t">Shared access</div></div>
        <div>
          <div className="kv"><span className="k">Your labs</span><span className="v">Full</span></div>
          <div className="kv"><span className="k">Your meds</span><span className="v">Full</span></div>
          <div className="kv"><span className="k">Lifestyle logs</span><span className="v">Summary</span></div>
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Lab detail ─────────────────────────────
function LabDetailV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("labs")} title="Result" sub="14 April"/>
        <div className="hero tight">
          <div className="lbl">HbA1c · three-month glucose average</div>
          <h1>7.8<em> %</em></h1>
          <div className="sub">Above your 7.0 % target · Dr. Mensah signed off</div>
        </div>
        <div className="tagrow"><span className="chip warn">High</span><span className="chip">Reference 4.0–7.0 %</span></div>

        <div style={{ padding: "18px 24px 0" }}>
          <Spark data={[7.2, 7.1, 7.2, 7.3, 7.3, 7.4, 7.4, 7.5, 7.6, 7.6, 7.7, 7.8]} color="#c26a00"/>
        </div>

        <div className="sect"><div className="t">What this means</div></div>
        <div style={{ padding: "0 24px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
          HbA1c reflects your average blood sugar over the last 3 months. 7.8 % translates to an average of about 177 mg/dL — slightly above your target.
        </div>

        <div className="sect"><div className="t">History</div></div>
        <div>
          <div className="kv"><span className="k">14 Apr</span><span className="v">7.8 %</span></div>
          <div className="kv"><span className="k">14 Jan</span><span className="v">7.6 %</span></div>
          <div className="kv"><span className="k">12 Oct</span><span className="v">7.4 %</span></div>
          <div className="kv"><span className="k">10 Jul</span><span className="v">7.2 %</span></div>
        </div>

        <button className="btn-primary" onClick={() => toast("Added to visit")}>Ask Dr. Mensah</button>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="labs" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Profile edit ───────────────────────────
function ProfileV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("you")} title="Personal details"
          right={<button className="ico-btn" onClick={() => toast("Saved")}><I n="check" s={18}/></button>}/>
        <div>
          <div className="kv"><span className="k">Full name</span><span className="v">Ama Mensah</span></div>
          <div className="kv"><span className="k">Date of birth</span><span className="v">14 Mar 1991</span></div>
          <div className="kv"><span className="k">Sex</span><span className="v">Female</span></div>
          <div className="kv"><span className="k">Phone</span><span className="v">+233 24 555 0101</span></div>
          <div className="kv"><span className="k">Email</span><span className="v">ama.mensah@mail.gh</span></div>
          <div className="kv"><span className="k">Address</span><span className="v">Cantonments, Accra</span></div>
          <div className="kv"><span className="k">Language</span><span className="v">English · Twi</span></div>
        </div>
        <div className="sect"><div className="t">Health basics</div></div>
        <div>
          <div className="kv"><span className="k">Blood type</span><span className="v">O+</span></div>
          <div className="kv"><span className="k">Height</span><span className="v">165 cm</span></div>
          <div className="kv"><span className="k">Weight</span><span className="v">68 kg</span></div>
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Meds list ──────────────────────────────
function MedsListV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("you")} title="Medications" sub="3 active"
          right={<button className="ico-btn" onClick={() => toast("Add medication")}><I n="plus" s={18}/></button>}/>
        <div>
          <div className="row" onClick={() => nav("pharmacy-rx")}>
            <div className="row-ic" style={{ background: "var(--warn-50)", color: "var(--warn)" }}><I n="pill" s={18}/></div>
            <div className="row-body"><div className="row-t">Metformin · 500 mg</div><div className="row-s">2× daily · with food</div></div>
            <div className="chev"><I n="chev" s={16}/></div>
          </div>
          <div className="row" onClick={() => nav("pharmacy-rx")}>
            <div className="row-ic"><I n="pill" s={18}/></div>
            <div className="row-body"><div className="row-t">Lisinopril · 10 mg</div><div className="row-s">1× morning</div></div>
            <div className="chev"><I n="chev" s={16}/></div>
          </div>
          <div className="row" onClick={() => nav("pharmacy-rx")}>
            <div className="row-ic"><I n="pill" s={18}/></div>
            <div className="row-body"><div className="row-t">Vitamin D3 · 1000 IU</div><div className="row-s">1× daily</div></div>
            <div className="chev"><I n="chev" s={16}/></div>
          </div>
        </div>

        <div className="sect"><div className="t">Past · 90 days</div></div>
        <div>
          <div className="row"><div className="row-ic"><I n="pill" s={18}/></div><div className="row-body"><div className="row-t">Amoxicillin · 500 mg</div><div className="row-s">Finished 02 Feb</div></div></div>
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Delegates ──────────────────────────────
function DelegatesV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("you")} title="Kojo Mensah" sub="Delegate · brother"/>
        <div className="hero tight">
          <div className="lbl">Active · expires 12 Oct</div>
          <h1>3 <em>scopes</em> shared</h1>
          <div className="sub">Kojo can see limited parts of your record on your behalf.</div>
        </div>

        <div className="sect"><div className="t">What Kojo can see</div></div>
        <div>
          <div className="set-r"><div className="body"><div className="t">Upcoming visits</div><div className="s">Schedule + reminders only</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Prescriptions & pharmacy</div><div className="s">Refills + delivery status</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Emergency summary</div><div className="s">Conditions, allergies, blood type</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Lab results</div><div className="s">Off — not shared</div></div><div className="toggle"/></div>
          <div className="set-r"><div className="body"><div className="t">Messages with your team</div><div className="s">Off — not shared</div></div><div className="toggle"/></div>
        </div>

        <button className="btn-ghost" onClick={() => toast("Delegate revoked")}>Revoke access</button>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Notifications ──────────────────────────
function NotifsV3({ nav }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("you")} title="Notifications"/>
        <div className="sect"><div className="t">Reminders</div></div>
        <div>
          <div className="set-r"><div className="body"><div className="t">Medication doses</div><div className="s">19:00 metformin, others</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Visit reminders</div><div className="s">24h and 30 min before</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Weekly check-ins</div><div className="s">Friday mornings</div></div><div className="toggle on"/></div>
        </div>
        <div className="sect"><div className="t">Care team</div></div>
        <div>
          <div className="set-r"><div className="body"><div className="t">New messages</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">New lab results</div></div><div className="toggle on"/></div>
        </div>
        <div className="sect"><div className="t">Pharmacy</div></div>
        <div>
          <div className="set-r"><div className="body"><div className="t">Order status</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Refill runway</div><div className="s">4 days before you run out</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Shop promos</div></div><div className="toggle"/></div>
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Privacy ────────────────────────────────
function PrivacyV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("you")} title="Privacy & records"/>
        <div className="sect"><div className="t">Consent log · last 30 days</div></div>
        <div>
          <div className="row"><div className="row-ic"><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Dr. Mensah viewed labs</div><div className="row-s">Today 09:02</div></div></div>
          <div className="row"><div className="row-ic"><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Mobipharm dispensed Rx</div><div className="row-s">14 Apr 10:22</div></div></div>
          <div className="row"><div className="row-ic"><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Kojo viewed emergency summary</div><div className="row-s">10 Apr 22:14</div></div></div>
          <div className="row"><div className="row-ic"><I n="check" s={18}/></div><div className="row-body"><div className="row-t">Policy acceptance · v2.4</div><div className="row-s">04 Apr</div></div></div>
        </div>
        <div className="sect"><div className="t">Apps with access</div></div>
        <div>
          <div className="set-r"><div className="body"><div className="t">Apple Health</div><div className="s">Heart rate, steps</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Home BP cuff · Omron</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Research · SUGAR-GH cohort</div><div className="s">De-identified labs only</div></div><div className="toggle"/></div>
        </div>
        <button className="btn-ghost" onClick={() => toast("Download started")}>Download my record · PDF</button>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

// ── INNER: Settings ───────────────────────────────
function SettingsV3({ nav, toast }) {
  return (
    <div className="scr">
      <SB/>
      <div className="scroll">
        <PageHdr onBack={() => nav("you")} title="Settings"/>
        <div className="sect"><div className="t">Appearance</div></div>
        <div>
          <div className="set-r"><div className="body"><div className="t">Serif headlines</div><div className="s">Fraunces for quiet warmth</div></div><div className="toggle on"/></div>
          <div className="set-r"><div className="body"><div className="t">Reduce motion</div></div><div className="toggle"/></div>
          <div className="set-r"><div className="body"><div className="t">Large text</div></div><div className="toggle"/></div>
        </div>
        <div className="sect"><div className="t">Language & region</div></div>
        <div>
          <div className="kv"><span className="k">Language</span><span className="v">English</span></div>
          <div className="kv"><span className="k">Region</span><span className="v">Ghana · GHS</span></div>
          <div className="kv"><span className="k">Units</span><span className="v">Metric</span></div>
        </div>
        <div className="sect"><div className="t">Data</div></div>
        <div>
          <div className="row" onClick={() => toast("Cache cleared")}><div className="row-body"><div className="row-t">Clear cache</div><div className="row-s">42 MB</div></div></div>
          <div className="row" onClick={() => toast("Support")}><div className="row-body"><div className="row-t">Contact support</div></div></div>
        </div>
        <div style={{ height: 24 }}/>
      </div>
      <Tabs active="you" onTab={nav}/>
      <div className="home-ind"/>
    </div>
  );
}

Object.assign(window, {
  PharmacyV3, RxDetailV3, ProductV3, CartV3, OrderDetailV3,
  ThreadV3, MessagesV3, TeamMemberV3, LabDetailV3,
  ProfileV3, MedsListV3, DelegatesV3, NotifsV3, PrivacyV3, SettingsV3,
});
