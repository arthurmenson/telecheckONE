// v2 — LABS + ME detail sheets
const { useState: uSLM } = React;

// ─────── LAB RESULT DETAIL SHEET ───────
function LabResultSheet({ result, onClose, toast, nav }) {
  if (!result) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "88vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-t">{result.title}</div>
        <div className="sheet-s">{result.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "baseline", padding: "14px 16px", borderRadius: 14, background: `var(--${result.tone}-50, var(--n-50))` }}>
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: "0.1em", fontWeight: 700, color: `var(--${result.tone}-700, var(--fg-2))` }}>{result.flagLabel}</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4, color: "var(--fg-1)", fontVariantNumeric: "tabular-nums" }}>{result.value}</div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>Target: {result.target}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", textAlign: "right" }}>{result.delta}</div>
          </div>

          <div className="section-h"><span>All values</span></div>
          <div className="extract">
            {result.values.map((v, i) => (
              <div className="extract-row" key={i}><span className="k">{v.k}</span><span className={`v ${v.flag || ""}`}>{v.v}</span></div>
            ))}
          </div>

          {/* Review provenance — REVIEWED BY CLINICIAN vs AI ONLY (PRD §13.2 / §17) */}
          {(() => {
            const reviewed = !!result.clinicianNote;
            return (
              <div style={{
                marginTop: 16,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${reviewed ? "var(--teal-200)" : "var(--iris-200)"}`,
                background: reviewed ? "var(--teal-50)" : "var(--iris-50, #f1f0ff)",
                display: "flex", gap: 10, alignItems: "center",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: reviewed ? "var(--teal-500)" : "var(--iris-500)",
                  color: "#fff", display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  <Ic2 n={reviewed ? "shield" : "spark"} s={14} sw={2.2} c="#fff"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: reviewed ? "var(--teal-700)" : "var(--iris-600)" }}>
                    {reviewed ? "REVIEWED BY CLINICIAN" : "AI INTERPRETATION ONLY"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2, lineHeight: 1.35 }}>
                    {reviewed
                      ? "A clinician has signed off on this result. You can act on the summary below."
                      : "AI wrote the plain-language summary. Not yet reviewed by a clinician — ask before making changes."}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="section-h"><span>Plain-language summary</span></div>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--n-50)", fontSize: 13, lineHeight: 1.55, color: "var(--fg-2)" }}>{result.summary}</div>

          {result.clinicianNote && (
            <>
              <div className="section-h"><span>What your clinician said</span></div>
              <div style={{ padding: 14, borderRadius: 12, background: "var(--teal-50)", border: "1px solid var(--teal-200)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--teal-700)" }}>{result.signedBy}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6, color: "var(--fg-1)" }}>{result.clinicianNote}</div>
              </div>
            </>
          )}

          <button className="cta" onClick={() => { onClose(); nav("ai-ws"); }}>Ask AI about this result</button>
          <button className="cta g" onClick={() => { onClose(); window.__telecheck_openEpisodeConsent?.(); }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ic2 n="spark" s={14} c="var(--iris-600)"/>
              Get an AI second opinion
            </span>
          </button>
          <button className="cta g" onClick={() => toast("Shared with Dr. Mensah")}>Share with someone</button>
          <button className="cta g" onClick={() => toast("PDF downloaded")}>Download PDF</button>
        </div>
      </div>
    </>
  );
}

// ─────── RECORD DOC SHEET ───────
function RecordDocSheet({ doc, onClose, toast, nav }) {
  if (!doc) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "80vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-t">{doc.title}</div>
        <div className="sheet-s">{doc.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          {doc.rows && (
            <div className="extract">
              {doc.rows.map((r, i) => (
                <div className="extract-row" key={i}><span className="k">{r.k}</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{r.v}</span></div>
              ))}
            </div>
          )}
          {doc.body && <div style={{ padding: 14, borderRadius: 12, background: "var(--n-50)", fontSize: 13, lineHeight: 1.55, color: "var(--fg-2)", marginTop: 12 }}>{doc.body}</div>}
          {doc.actions ? (
            doc.actions.map((a, i) => (
              <button key={i} className={i === 0 ? "cta" : "cta g"} onClick={() => {
                if (doc.actionNavs && doc.actionNavs[i] && nav) { nav(doc.actionNavs[i]); onClose(); return; }
                toast(a); onClose();
              }}>{a}</button>
            ))
          ) : (
            <>
              <button className="cta" onClick={() => toast("PDF downloaded")}>Download as PDF</button>
              <button className="cta g" onClick={() => toast("Share link created")}>Share securely</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─────── FAMILY MEMBER SHEET ───────
function FamilyMemberSheet({ member, onClose, toast, onSwitch }) {
  if (!member) return null;
  const m = {
    "kofi":   { name: "Kofi Mensah", role: "Dad · 68", av: "KO", color: "var(--gold-500)", relation: "I care for him",
      perms: [["View medications", true], ["View labs", true], ["Approve refills", true], ["Schedule visits", false], ["Emergency contact", true]],
      expires: "12 Oct 2026", conditions: "Hypertension · mild CKD", meds: "3 active", audit: "47 events · last 30 days" },
    "abena":  { name: "Abena Mensah", role: "Daughter · 8", av: "AB", color: "var(--iris-500)", relation: "I care for her",
      perms: [["View all (minor default)", true], ["Approve any action", true], ["Share with grandparents", false]],
      expires: "Until she turns 16", conditions: "Pediatric · no chronic conditions", meds: "0 active", audit: "3 events · last 30 days" },
    "kojo":   { name: "Kojo Asare", role: "Partner · 36", av: "KJ", color: "var(--teal-500)", relation: "Has access to me",
      perms: [["View my medications", true], ["View my labs", true], ["Schedule my visits", false], ["Approve refills", false]],
      expires: "No expiry · revokable", conditions: "—", meds: "—", audit: "12 events · last 30 days" },
  }[member] || null;
  if (!m) return null;

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "88vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6 }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: m.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>{m.av}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{m.role} · {m.relation}</div>
            </div>
          </div>

          <div className="section-h"><span>Permissions</span></div>
          <div className="extract">
            {m.perms.map(([label, on], i) => (
              <div className="extract-row" key={i}>
                <span className="k">{label}</span>
                <span className="v" style={{ color: on ? "var(--teal-700)" : "var(--fg-3)", fontFamily: "inherit", fontWeight: 600 }}>{on ? "Granted" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="section-h"><span>Context</span></div>
          <div className="extract">
            <div className="extract-row"><span className="k">Expires</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{m.expires}</span></div>
            {m.conditions !== "—" && <div className="extract-row"><span className="k">Conditions</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{m.conditions}</span></div>}
            {m.meds !== "—" && <div className="extract-row"><span className="k">Medications</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{m.meds}</span></div>}
            <div className="extract-row"><span className="k">Audit</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{m.audit}</span></div>
          </div>

          {m.relation === "I care for him" || m.relation === "I care for her" ? (
            <button className="cta" onClick={() => { toast(`Switched to ${m.name.split(" ")[0]}'s view`); onClose(); onSwitch && onSwitch(); }}>Switch to their view</button>
          ) : (
            <button className="cta g" style={{ color: "#b84240", border: "1px solid #e8cdc9" }} onClick={() => { toast(`${m.name}'s access revoked`); onClose(); }}>Revoke access</button>
          )}
          <button className="cta g" onClick={() => toast("Audit log opened")}>See audit log</button>
          <button className="cta g" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─────── EVENT RSVP SHEET ───────
function EventSheet({ event, onClose, toast }) {
  if (!event) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "86vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6 }}>
            <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--teal-500)", color: "#fff", display: "grid", placeItems: "center", padding: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>{event.month}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: -2 }}>{event.date}</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{event.title}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{event.host} · {event.time}</div>
              <div style={{ fontSize: 12, color: "var(--teal-700)", marginTop: 2, fontWeight: 600 }}>{event.going} going</div>
            </div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--n-50)", fontSize: 13, lineHeight: 1.55, color: "var(--fg-2)", marginTop: 16 }}>{event.about}</div>
          <div className="section-h"><span>What you'll need</span></div>
          <div className="extract">
            {event.need.map((n, i) => (
              <div className="extract-row" key={i}><span className="k">{n.k}</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{n.v}</span></div>
            ))}
          </div>
          <button className="cta" onClick={() => { toast(`RSVP'd to ${event.title}`); onClose(); }}>RSVP · I'll be there</button>
          <button className="cta g" onClick={() => toast("Added to calendar")}>Add to calendar</button>
          <button className="cta g" onClick={onClose}>Maybe later</button>
        </div>
      </div>
    </>
  );
}

// ─────── SETTINGS DETAIL SHEET (for Me items) ───────
function SettingsDetailSheet({ item, onClose, toast }) {
  if (!item) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet" style={{ maxHeight: "80vh" }}>
        <div className="sheet-handle"/>
        <div className="sheet-t">{item.title}</div>
        <div className="sheet-s">{item.sub}</div>
        <div className="sheet-body" style={{ padding: "0 18px 20px" }}>
          {item.rows && (
            <div className="extract">
              {item.rows.map((r, i) => (
                <div className="extract-row" key={i}><span className="k">{r.k}</span><span className="v" style={{ color: "var(--fg-1)", fontFamily: "inherit", fontWeight: 500 }}>{r.v}</span></div>
              ))}
            </div>
          )}
          {item.body && <div style={{ padding: 14, borderRadius: 12, background: "var(--n-50)", fontSize: 13, lineHeight: 1.55, color: "var(--fg-2)", marginTop: 12 }}>{item.body}</div>}
          {item.actions && item.actions.map((a, i) => (
            <button key={i} className={i === 0 ? "cta" : "cta g"} onClick={() => { toast(a); onClose(); }}>{a}</button>
          ))}
          <button className="cta g" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { LabResultSheet, RecordDocSheet, FamilyMemberSheet, EventSheet, SettingsDetailSheet });
