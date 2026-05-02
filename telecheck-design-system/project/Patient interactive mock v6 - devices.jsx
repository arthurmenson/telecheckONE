// v2 — DEVICES: pairing flow + monitoring dashboard
const { useState: uSDv, useEffect: uEDv, useRef: uRDv } = React;

// Device catalog
const DEVICES_REGISTRY = {
  "accu-chek": { brand: "Accu-Chek", model: "Guide", kind: "Glucometer", metric: "Blood glucose", unit: "mg/dL",
    battery: 72, signal: "strong", firmware: "2.1.4", paired: "14 Jan 2026", last: "07:42 today",
    target: "80–130", range: { min: 70, max: 180 },
    readings: [
      { tm: "Today 07:42", v: 118, ok: true },
      { tm: "Yesterday 21:00", v: 142, ok: false, note: "post-dinner" },
      { tm: "Yesterday 07:30", v: 122, ok: true },
      { tm: "Mon 07:35", v: 129, ok: true },
      { tm: "Sun 07:38", v: 135, ok: false },
      { tm: "Sat 07:20", v: 124, ok: true },
      { tm: "Fri 07:33", v: 116, ok: true },
    ],
    supplies: [{ n: "Test strips · 50-pack", p: "GHS 95", s: "Low · order soon" }, { n: "Lancets · 100-pack", p: "GHS 38", s: "In stock" }],
  },
  "omron-m2": { brand: "Omron", model: "M2 Basic", kind: "BP monitor", metric: "Blood pressure", unit: "mmHg",
    battery: 54, signal: "ok", firmware: "1.0.8", paired: "02 Feb 2026", last: "Yesterday 19:20",
    target: "< 130/80", range: { min: 90, max: 160 },
    readings: [
      { tm: "Yesterday 19:20", v: "124/78", ok: true },
      { tm: "Yesterday 08:00", v: "128/82", ok: true },
      { tm: "Mon 19:15", v: "132/84", ok: false },
      { tm: "Mon 07:50", v: "126/80", ok: true },
      { tm: "Sun 08:04", v: "138/88", ok: false },
    ],
    supplies: [{ n: "Replacement cuff · adult", p: "GHS 90", s: "In stock" }],
  },
};

// Pairing flow (multi-step)
function AddDeviceSheet({ onClose, toast }) {
  const [step, setStep] = uSDv("pick");
  const [device, setDevice] = uSDv(null);
  const candidates = [
    { id: "cgm", brand: "FreeStyle", model: "Libre 2", kind: "CGM", why: "For GLP-1 program", price: "GHS 480 / sensor" },
    { id: "scale", brand: "Withings", model: "Body+", kind: "Smart scale", why: "Weight + body composition", price: "GHS 620" },
    { id: "pulseox", brand: "iHealth", model: "Air Pro", kind: "Pulse oximeter", why: "SpO₂ + pulse", price: "GHS 180" },
    { id: "thermo", brand: "Braun", model: "ThermoScan 7", kind: "Thermometer", why: "Family health tracking", price: "GHS 240" },
    { id: "omron-m7", brand: "Omron", model: "M7 Intelli-IT", kind: "BP monitor", why: "Upgrade from M2", price: "GHS 520" },
  ];

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "86vh" }}>
        <div className="sheet-handle"/>

        {step === "pick" && (
          <>
            <div className="sheet-t">Add a monitoring device</div>
            <div className="sheet-s">Pick what you want to connect</div>
            <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
              <div style={{ display: "grid", gap: 8 }}>
                {candidates.map(d => (
                  <div key={d.id} onClick={() => { setDevice(d); setStep("scan"); }} style={{ padding: "14px 14px", borderRadius: 12, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", cursor: "pointer", display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--n-50)", display: "grid", placeItems: "center" }}>
                      <Ic2 n="shield" s={18} c="var(--fg-2)"/>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.brand} {d.model}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{d.kind} · {d.why}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-700)", fontVariantNumeric: "tabular-nums" }}>{d.price}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "var(--n-50)", fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.5 }}>
                Don't have one yet? Most devices are available in the Telecheck Shop with next-day Accra delivery.
              </div>
              <button className="cta g" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {step === "scan" && device && (
          <>
            <div className="sheet-t">Scanning for {device.brand} {device.model}</div>
            <div className="sheet-s">Turn on your device and place it nearby · Bluetooth</div>
            <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
              <BluetoothScanningAnimation/>
              <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--fg-2)", marginTop: 14, lineHeight: 1.5 }}>
                Searching for devices within 2m…<br/>
                <span style={{ color: "var(--fg-3)", fontSize: 11 }}>Make sure Bluetooth is on and the device is in pairing mode.</span>
              </div>
              <button className="cta" style={{ marginTop: 22 }} onClick={() => setStep("found")}>Simulate found</button>
              <button className="cta g" onClick={() => setStep("pick")}>Back</button>
            </div>
          </>
        )}

        {step === "found" && device && (
          <>
            <div className="sheet-t">Found your device</div>
            <div className="sheet-s">Serial matches · verify to pair</div>
            <div className="sheet-body" style={{ padding: "0 18px 18px" }}>
              <div style={{ padding: 16, borderRadius: 14, background: "var(--teal-50)", border: "1px solid var(--teal-200)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--teal-500)", color: "#fff", display: "grid", placeItems: "center" }}>
                    <Ic2 n="shield" s={22} c="#fff"/>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{device.brand} {device.model}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>Serial: SN-{Math.floor(Math.random()*9000+1000)}-{Math.floor(Math.random()*900+100)} · {device.kind}</div>
                  </div>
                </div>
              </div>
              <div className="section-h"><span>Permissions</span></div>
              <div className="extract">
                <div className="extract-row"><span className="k">Read readings</span><span className="v ok">Required</span></div>
                <div className="extract-row"><span className="k">Share with Dr. Mensah</span><span className="v ok">Granted</span></div>
                <div className="extract-row"><span className="k">Auto-log to record</span><span className="v ok">Granted</span></div>
                <div className="extract-row"><span className="k">Alert thresholds</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>Default</span></div>
              </div>
              <button className="cta" style={{ marginTop: 18 }} onClick={() => setStep("done")}>Pair & connect</button>
              <button className="cta g" onClick={() => setStep("pick")}>Not this one</button>
            </div>
          </>
        )}

        {step === "done" && device && (
          <>
            <div className="sheet-body" style={{ padding: "24px 18px 18px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: "var(--teal-500)", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
                <Ic2 n="check" s={38} c="#fff" sw={2.4}/>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{device.brand} {device.model} is ready</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 6, lineHeight: 1.5, padding: "0 16px" }}>
                First reading will appear in your monitoring dashboard in a few seconds.
              </div>
              <button className="cta" style={{ marginTop: 22 }} onClick={() => { toast(`${device.brand} ${device.model} connected`); onClose(); }}>Open dashboard</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function BluetoothScanningAnimation() {
  return (
    <div style={{ position: "relative", height: 160, display: "grid", placeItems: "center" }}>
      <style>{`
        @keyframes bt-ripple { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
        .bt-ring { position: absolute; width: 80px; height: 80px; border-radius: 40px; border: 2px solid var(--teal-500); animation: bt-ripple 1.8s ease-out infinite; }
      `}</style>
      <div className="bt-ring" style={{ animationDelay: "0s" }}/>
      <div className="bt-ring" style={{ animationDelay: "0.6s" }}/>
      <div className="bt-ring" style={{ animationDelay: "1.2s" }}/>
      <div style={{ width: 80, height: 80, borderRadius: 40, background: "var(--teal-500)", display: "grid", placeItems: "center", position: "relative", zIndex: 2 }}>
        <Ic2 n="shield" s={32} c="#fff"/>
      </div>
    </div>
  );
}

// Device monitoring dashboard (full screen)
function DeviceDetailScreen({ nav, toast, deviceId = "accu-chek" }) {
  const d = DEVICES_REGISTRY[deviceId] || DEVICES_REGISTRY["accu-chek"];
  const [liveTick, setLiveTick] = uSDv(0);
  uEDv(() => {
    const t = setInterval(() => setLiveTick(x => x + 1), 2200);
    return () => clearInterval(t);
  }, []);

  // Build a sparkline of numeric readings
  const nums = d.readings.map(r => typeof r.v === "number" ? r.v : parseInt(String(r.v).split("/")[0], 10)).reverse();
  const min = Math.min(...nums), max = Math.max(...nums);
  const range = Math.max(1, max - min);
  const pts = nums.map((v, i) => `${(i / (nums.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(" ");

  const batteryColor = d.battery > 50 ? "var(--teal-700)" : d.battery > 20 ? "var(--warning-700)" : "#b84240";
  const signalColor = d.signal === "strong" ? "var(--teal-700)" : d.signal === "ok" ? "var(--warning-700)" : "var(--fg-3)";

  return (
    <div className="app">
      <SB2/>
      <Sub2 title={`${d.brand} ${d.model}`} onBack={() => nav("care-track-devices")} right={
        <button className="ic-btn" onClick={() => toast("Settings")}><Ic2 n="more" s={18}/></button>
      }/>
      <div className="scroll" style={{ padding: "14px 16px 32px" }}>

        {/* Live status card */}
        <div style={{ padding: "18px 18px 16px", borderRadius: 18, background: "linear-gradient(135deg, var(--teal-600), var(--teal-500))", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#7ce3b7", boxShadow: "0 0 0 0 rgba(124, 227, 183, 0.7)", animation: "live-pulse 1.6s infinite" }}/>
            <style>{`@keyframes live-pulse { 0% { box-shadow: 0 0 0 0 rgba(124, 227, 183, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(124, 227, 183, 0); } 100% { box-shadow: 0 0 0 0 rgba(124, 227, 183, 0); } }`}</style>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em" }}>LIVE · CONNECTED</div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 14 }}>{d.metric}</div>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
            {d.readings[0].v} <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.8 }}>{d.unit}</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{d.readings[0].tm} · target {d.target}</div>

          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 14, fontSize: 11, opacity: 0.9 }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Ic2 n="shield" s={12} c="#fff"/> {d.battery}%
            </div>
            <div>{d.signal === "strong" ? "●●●" : d.signal === "ok" ? "●●○" : "●○○"}</div>
          </div>
        </div>

        {/* Sparkline card */}
        <div style={{ marginTop: 12, padding: "14px 14px 10px", borderRadius: 16, background: "var(--surface-1)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)" }}>Last 7 readings</div>
            <div style={{ fontSize: 10.5, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{min}–{max} {d.unit}</div>
          </div>
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: 90, marginTop: 8, display: "block" }} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`grad-${deviceId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0.24"/>
                <stop offset="100%" stopColor="var(--teal-500)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polyline points={pts} fill="none" stroke="var(--teal-600)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
            <polygon points={`${pts} 100,100 0,100`} fill={`url(#grad-${deviceId})`}/>
            {nums.map((v, i) => {
              const x = (i / (nums.length - 1)) * 100;
              const y = 100 - ((v - min) / range) * 80 - 10;
              return <circle key={i} cx={x} cy={y} r="1.4" fill="var(--teal-700)" vectorEffect="non-scaling-stroke"/>;
            })}
          </svg>
        </div>

        {/* Device status extract */}
        <div className="section-h"><span>Device status</span></div>
        <div className="extract">
          <div className="extract-row"><span className="k">Battery</span><span className="v" style={{ color: batteryColor, fontFamily: "inherit", fontWeight: 600 }}>{d.battery}% {d.battery < 30 ? "· replace soon" : "· healthy"}</span></div>
          <div className="extract-row"><span className="k">Signal</span><span className="v" style={{ color: signalColor, fontFamily: "inherit", fontWeight: 600 }}>{d.signal === "strong" ? "Strong" : d.signal === "ok" ? "OK" : "Weak"}</span></div>
          <div className="extract-row"><span className="k">Last sync</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{d.last}</span></div>
          <div className="extract-row"><span className="k">Firmware</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>v{d.firmware}</span></div>
          <div className="extract-row"><span className="k">Paired</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{d.paired}</span></div>
        </div>

        {/* Recent readings */}
        <div className="section-h"><span>Recent readings</span></div>
        {d.readings.map((r, i) => (
          <div key={i} className="lc" onClick={() => toast(`Reading at ${r.tm}${r.note ? " · " + r.note : ""}`)}>
            <div className={`lc-ic ${r.ok ? "teal" : "warn"}`} style={{ fontWeight: 700, fontSize: 11 }}>
              {typeof r.v === "number" ? r.v : String(r.v).split("/")[0]}
            </div>
            <div>
              <div className="lc-t">{typeof r.v === "number" ? r.v : r.v} <span style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 500 }}>{d.unit}</span></div>
              <div className="lc-s">{r.tm}{r.note ? ` · ${r.note}` : ""}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: r.ok ? "var(--teal-700)" : "var(--warning-700)" }}>{r.ok ? "IN RANGE" : "FLAGGED"}</div>
          </div>
        ))}

        {/* Supplies */}
        <div className="section-h"><span>Supplies & accessories</span></div>
        {d.supplies.map((s, i) => (
          <Row key={i} icon="shop" tone="info" title={s.n} sub={`${s.p} · ${s.s}`} onClick={() => nav("pharmacy-shop")}/>
        ))}

        {/* Actions */}
        <div className="section-h"><span>Manage</span></div>
        <Row icon="spark" tone="teal" title="Sync now" sub={`Last sync ${d.last}`} onClick={() => toast("Sync triggered · 2 new readings")}/>
        <Row icon="flag" tone="iris" title="Alert thresholds" sub={`Outside ${d.range.min}–${d.range.max} ${d.unit}`} onClick={() => toast("Threshold editor")}/>
        <Row icon="users" tone="gold" title="Sharing · 2 people" sub="Dr. Mensah · Nurse Adjoa" onClick={() => nav("care-team")}/>
        <Row icon="doc" tone="info" title="Export readings · CSV" sub="Last 90 days" onClick={() => toast("Export queued")}/>
        <button className="cta g" style={{ marginTop: 12, color: "#b84240", border: "1px solid #e8cdc9" }} onClick={() => toast("Confirm unpair?")}>Unpair device</button>
      </div>
    </div>
  );
}

Object.assign(window, { AddDeviceSheet, DeviceDetailScreen, DEVICES_REGISTRY });
