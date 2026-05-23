// cockpit-data.jsx
// Centralized mock data for the Telecheck Ops Cockpit.
// Project-agnostic; Telecheck is instance #1.

const PROJECTS = [
  { id: 'telecheck', name: 'Telecheck', env: 'pilot · Ghana', accent: '#0b7a6b', current: true },
  { id: 'orchard',   name: 'Orchard CRM', env: 'pre-launch', accent: '#5944b8' },
  { id: 'tidemark',  name: 'Tidemark Research', env: 'internal', accent: '#c88a2b' },
];

const AGENTS = [
  {
    id:'clinical', name:'Clinical Agent',
    role:'Pharmacy · Med-Int · Refill · Forms-Intake',
    status:'green', heartbeat: '12s', focus:'Authoring telecheck-clinical PR #142',
    prsActive: 3, codexQ: 1, complete: 67,
    color: '#23947e',
  },
  {
    id:'patient', name:'Patient Agent',
    role:'Intake · RPM · Acquisition modules',
    status:'green', heartbeat: '42s', focus:'Drafting CR-087 (intake → consent flow)',
    prsActive: 2, codexQ: 0, complete: 81,
    color: '#5fb3a0',
  },
  {
    id:'platform', name:'Platform Agent',
    role:'Contracts · OpenAPI · State machines',
    status:'amber', heartbeat: '3m 14s', focus:'Waiting on ratifier — CR-091 (RBAC v1.3)',
    prsActive: 1, codexQ: 0, complete: 54,
    color: '#6e5bd6',
  },
  {
    id:'pharmacy', name:'Pharmacy Agent',
    role:'Dispense · Inventory · Delivery handoff',
    status:'green', heartbeat: '8s', focus:'Codex round-2 review on PR #138',
    prsActive: 2, codexQ: 2, complete: 73,
    color: '#dcaa50',
  },
  {
    id:'orchestrator', name:'Orchestrator',
    role:'Cross-agent coordination · dep ledger',
    status:'green', heartbeat: '1s', focus:'Resolving dep DEP-201: clinical ↔ pharmacy',
    prsActive: 0, codexQ: 0, complete: null,
    color: '#0b7a6b',
  },
  {
    id:'crisis', name:'Crisis Agent',
    role:'Emergency banner · safety triage',
    status:'gray', heartbeat: '14h', focus:'Idle — last drill 21 May 09:14 UTC',
    prsActive: 0, codexQ: 0, complete: 100,
    color: '#c8402f',
  },
  {
    id:'codex', name:'Codex Reviewer',
    role:'Adversarial review · pass-1 + pass-2',
    status:'green', heartbeat: '6s', focus:'Reviewing PR #142 (round 2)',
    prsActive: 0, codexQ: 5, complete: null,
    color: '#9e92e3',
  },
  {
    id:'doc', name:'Doc Agent',
    role:'PRD slices · ADR scribe · changelog',
    status:'red', heartbeat: '21m', focus:'Stalled — auth failure on Anthropic API',
    prsActive: 0, codexQ: 0, complete: 38,
    color: '#f06351',
  },
];

const PRS = [
  // In Progress
  { id:142, repo:'telecheck-clinical', title:'Refill state machine: add pharmacist-hold transition', agent:'clinical', age:'2h', codex:0, status:'progress', author:'AI', ai:true, lines:'+182 −47' },
  { id:144, repo:'telecheck-patient',  title:'RPM check-in: support nurse-mediated submission', agent:'patient', age:'45m', codex:0, status:'progress', author:'AI', ai:true, lines:'+96 −12' },
  { id:145, repo:'telecheck-platform', title:'OpenAPI: tighten /prescriptions/{id}/approve payload', agent:'platform', age:'18m', codex:0, status:'progress', author:'AI', ai:true, lines:'+38 −22' },
  // In Codex Review
  { id:138, repo:'telecheck-pharmacy', title:'Dispense queue: SLA breach surfacing', agent:'pharmacy', age:'4h', codex:2, status:'review', author:'AI', ai:true, lines:'+421 −198' },
  { id:140, repo:'telecheck-clinical', title:'Drug-interaction engine: add herb-drug stub', agent:'clinical', age:'6h', codex:1, status:'review', author:'AI', ai:true, lines:'+612 −34' },
  { id:141, repo:'telecheck-pharmacy', title:'Delivery handoff: courier webhook idempotency', agent:'pharmacy', age:'3h', codex:1, status:'review', author:'AI', ai:true, lines:'+147 −22' },
  { id:139, repo:'telecheck-platform', title:'CDM v1.7 → v1.8: add lab_value.unit_system', agent:'platform', age:'8h', codex:2, status:'review', author:'AI', ai:true, lines:'+89 −14' },
  { id:143, repo:'telecheck-patient',  title:'Pregnancy module: kick-counter sheet', agent:'patient', age:'1h', codex:1, status:'review', author:'AI', ai:true, lines:'+254 −0' },
  // Awaiting Ratifier
  { id:131, repo:'telecheck-platform', title:'RBAC: introduce "delegated_caregiver" role (CR-091)', agent:'platform', age:'2d 4h', codex:2, status:'ratify', author:'AI', ai:true, lines:'+202 −56', cr:'CR-091' },
  { id:135, repo:'telecheck-clinical', title:'Hard-floor #6: prescription approval requires clinician sig', agent:'clinical', age:'1d 18h', codex:2, status:'ratify', author:'AI', ai:true, lines:'+78 −12', cr:'CR-094' },
  { id:137, repo:'telecheck-platform', title:'Promotion ledger: add reject_with_modifications event', agent:'platform', age:'3d 2h', codex:2, status:'ratify', author:'AI', ai:true, lines:'+148 −0', cr:'CR-096' },
  // Merged today
  { id:128, repo:'telecheck-patient',  title:'Intake forms: literacy-adaptive copy', agent:'patient', age:'merged 11:42', codex:2, status:'merged', author:'AI', ai:true, lines:'+340 −90' },
  { id:130, repo:'telecheck-platform', title:'Contracts Pack v5.2: lab_panel.normal_range nullability', agent:'platform', age:'merged 09:18', codex:2, status:'merged', author:'AI', ai:true, lines:'+44 −11' },
  { id:132, repo:'telecheck-pharmacy', title:'Refill: auto-decline when last_dispensed < 5d', agent:'pharmacy', age:'merged 08:02', codex:2, status:'merged', author:'AI', ai:true, lines:'+71 −18' },
  { id:133, repo:'telecheck-clinical', title:'Med-Int engine: add eGFR-banded warning for metformin', agent:'clinical', age:'merged 07:30', codex:2, status:'merged', author:'AI', ai:true, lines:'+118 −22' },
];

const SPEC_TREE = [
  { id:'prd', name:'Master PRD', v:'v1.10', cr: 0, type:'doc' },
  { id:'cdm', name:'CDM', v:'v1.7', cr: 1, type:'schema' },
  { id:'openapi', name:'OpenAPI', v:'v0.3', cr: 2, type:'schema' },
  { id:'sm', name:'State Machines', v:'v1.2', cr: 0, type:'fsm' },
  { id:'rbac', name:'RBAC', v:'v1.2', cr: 1, type:'policy' },
  { id:'contracts', name:'Contracts Pack', v:'v5.2', cr: 1, type:'group', children: [
    { id:'c-prescription', name:'prescription.contract', v:'v5.2', cr:0 },
    { id:'c-refill', name:'refill.contract', v:'v5.2', cr:0 },
    { id:'c-lab-panel', name:'lab_panel.contract', v:'v5.1', cr:1 },
    { id:'c-rpm', name:'rpm_session.contract', v:'v5.0', cr:0 },
    { id:'c-consult', name:'consult.contract', v:'v5.2', cr:0 },
    { id:'c-med-int', name:'med_interaction.contract', v:'v5.2', cr:0 },
    { id:'c-herb', name:'herb_drug.contract', v:'v0.8', cr:0 },
    { id:'c-intake', name:'intake_form.contract', v:'v5.2', cr:0 },
    { id:'c-consent', name:'consent.contract', v:'v5.2', cr:0 },
    { id:'c-delegate', name:'delegate.contract', v:'v5.1', cr:0 },
    { id:'c-emerg', name:'emergency.contract', v:'v5.2', cr:0 },
    { id:'c-pay', name:'payment.contract', v:'v5.0', cr:0 },
    { id:'c-courier', name:'courier_webhook.contract', v:'v5.2', cr:0 },
    { id:'c-audit', name:'audit_log.contract', v:'v5.2', cr:0 },
  ]},
  { id:'adrs', name:'ADRs', v:'029', cr: 0, type:'group', children: [
    { id:'adr-027', name:'ADR-027: Use Supabase for RBAC', v:'accepted', cr:0 },
    { id:'adr-028', name:'ADR-028: Codex 2-pass review baseline', v:'accepted', cr:0 },
    { id:'adr-029', name:'ADR-029: Iris-only AI visual cue', v:'proposed', cr:0 },
  ]},
  { id:'slices', name:'Slice PRDs', v:'17', cr: 0, type:'group', children: [
    { id:'s-01', name:'Slice 01: Patient intake', v:'v2.1', cr:0 },
    { id:'s-02', name:'Slice 02: Refill loop', v:'v2.1', cr:0 },
    { id:'s-03', name:'Slice 03: Clinician console', v:'v2.0', cr:0 },
    { id:'s-04', name:'Slice 04: Med-interaction', v:'v1.8', cr:0 },
    { id:'s-05', name:'Slice 05: Lab interpretation', v:'v1.6', cr:0 },
  ]},
];

const PENDING_RATIFICATIONS = [
  { id:'CR-091', title:'RBAC: introduce delegated_caregiver role', agent:'platform', age:'2d 4h', priority:'p1', floor:6,
    claudeRec:'Approve with scope-narrowing (read+act, not admin).',
    codex1:'No backwards-compat break detected. Audit trail OK.',
    codex2:'Confirm: legal review of delegation consent UX. Recommend hold.',
    diff: '+202 −56' },
  { id:'CR-094', title:'Hard-floor #6: prescription requires clinician sig', agent:'clinical', age:'1d 18h', priority:'p0', floor:6,
    claudeRec:'Approve — restores floor constraint missing since v0.9.',
    codex1:'OK. Replay confirms 0 regression in dispense flow.',
    codex2:'OK.', diff: '+78 −12' },
  { id:'CR-096', title:'Promotion ledger: reject_with_modifications event', agent:'platform', age:'3d 2h', priority:'p2', floor:4,
    claudeRec:'Approve.',
    codex1:'OK.', codex2:'Schema migration tested.', diff: '+148 −0' },
  { id:'CR-087', title:'Intake → consent flow restructure', agent:'patient', age:'5h', priority:'p1', floor:5,
    claudeRec:'Hold — pending RBAC CR-091 merge first.',
    codex1:'Dep order matters; route after CR-091.', codex2:'Hold.', diff: '+412 −188' },
];

const RECENT_DECISIONS = [
  { id:'CR-088', t:'2h ago', kind:'approve', who:'You',     title:'Lab unit-system migration' },
  { id:'CR-085', t:'5h ago', kind:'approve', who:'You',     title:'Codex round-3 escalation policy' },
  { id:'CR-084', t:'1d ago', kind:'modify',  who:'You',     title:'Consent UX copy: tighten delegate framing' },
  { id:'CR-082', t:'1d ago', kind:'reject',  who:'You',     title:'Auto-renew prescriptions w/o clinician' },
  { id:'CR-081', t:'2d ago', kind:'approve', who:'You',     title:'Pregnancy module kick-counter' },
];

const BLOCKERS = [
  { id:'DEP-201', filed:'18h ago', waiting:'patient',  owner:'clinical', title:'Refill state machine needs pharmacist-hold transition' },
  { id:'DEP-198', filed:'1d 4h ago', waiting:'pharmacy', owner:'platform', title:'OpenAPI payload for /prescriptions/{id}/approve' },
  { id:'DEP-194', filed:'2d ago',   waiting:'doc',      owner:'clinical', title:'ADR-029 needs reasoning trace for iris-only decision' },
];

const MILESTONES = [
  { id:'pilot', name:'Ghana pilot', date:'18 Jul 2026', pct: 47, kind:'pilot' },
  { id:'v10',   name:'v1.0',        date:'02 Sep 2026', pct: 31, kind:'release' },
  { id:'v11',   name:'v1.1 (Herb-drug)', date:'15 Oct 2026', pct: 12, kind:'release' },
];

const EVENT_LOG = [
  { t:'2s ago',      ts:'2026-05-23 14:42:14', type:'heartbeat', source:'clinical',    sum:'heartbeat ok · 142 tokens/s · 3 active PRs', json:'{ "agent":"clinical","tokens_s":142,"prs":3,"focus":"PR#142" }' },
  { t:'14s ago',     ts:'2026-05-23 14:42:02', type:'pr-open',   source:'platform',    sum:'opened PR #145 telecheck-platform · OpenAPI tighten', json:'{ "pr":145,"repo":"telecheck-platform" }' },
  { t:'48s ago',     ts:'2026-05-23 14:41:28', type:'codex',     source:'codex',       sum:'round-2 review complete · PR #138 · APPROVE', json:'{ "pr":138,"round":2,"verdict":"approve" }' },
  { t:'1m ago',      ts:'2026-05-23 14:41:11', type:'dep',       source:'orchestrator',sum:'dep DEP-202 filed: patient → clinical (intake form schema)', json:'{ "id":"DEP-202","filer":"patient","owner":"clinical" }' },
  { t:'2m ago',      ts:'2026-05-23 14:40:09', type:'dialogue',  source:'human',       sum:'You: "approve CR-088"', json:'{ "speaker":"human","text":"approve CR-088" }' },
  { t:'2m ago',      ts:'2026-05-23 14:40:08', type:'ratify',    source:'orchestrator',sum:'ratifier decision: CR-088 APPROVED by You', json:'{ "id":"CR-088","outcome":"approve" }' },
  { t:'4m ago',      ts:'2026-05-23 14:38:01', type:'pr-merged', source:'pharmacy',    sum:'merged PR #132 · refill auto-decline rule', json:'{ "pr":132 }' },
  { t:'6m ago',      ts:'2026-05-23 14:36:14', type:'heartbeat', source:'patient',     sum:'heartbeat ok · 88 tokens/s', json:'{}' },
  { t:'9m ago',      ts:'2026-05-23 14:33:48', type:'codex',     source:'codex',       sum:'round-1 review complete · PR #140 · REQUEST CHANGES', json:'{}' },
  { t:'12m ago',     ts:'2026-05-23 14:30:11', type:'pr-merged', source:'clinical',    sum:'merged PR #133 · eGFR-banded metformin warning', json:'{}' },
  { t:'18m ago',     ts:'2026-05-23 14:24:01', type:'heartbeat', source:'doc',         sum:'heartbeat MISSED · last seen 24m ago', json:'{}' },
  { t:'21m ago',     ts:'2026-05-23 14:21:14', type:'hardstop',  source:'doc',         sum:'agent doc STALLED · Anthropic API 401', json:'{ "agent":"doc","reason":"401" }' },
  { t:'34m ago',     ts:'2026-05-23 14:08:22', type:'pr-open',   source:'patient',     sum:'opened PR #144 · RPM nurse-mediated submission', json:'{}' },
  { t:'42m ago',     ts:'2026-05-23 14:00:00', type:'ratify',    source:'orchestrator',sum:'CR-085 APPROVED by You · Codex round-3 escalation policy', json:'{}' },
  { t:'1h ago',      ts:'2026-05-23 13:41:00', type:'pr-open',   source:'patient',     sum:'opened PR #143 · pregnancy module kick-counter', json:'{}' },
  { t:'1h ago',      ts:'2026-05-23 13:31:14', type:'dep',       source:'orchestrator',sum:'dep DEP-198 satisfied · platform → pharmacy', json:'{}' },
  { t:'2h ago',      ts:'2026-05-23 12:42:14', type:'pr-open',   source:'clinical',    sum:'opened PR #142 · pharmacist-hold transition', json:'{}' },
  { t:'3h ago',      ts:'2026-05-23 11:42:18', type:'pr-merged', source:'patient',     sum:'merged PR #128 · intake literacy-adaptive copy', json:'{}' },
  { t:'4h ago',      ts:'2026-05-23 10:14:00', type:'codex',     source:'codex',       sum:'round-2 review complete · PR #138 · REQUEST CHANGES (then fixed)', json:'{}' },
  { t:'5h ago',      ts:'2026-05-23 09:18:00', type:'pr-merged', source:'platform',    sum:'merged PR #130 · CDM v1.7→v1.8 lab_value.unit_system', json:'{}' },
];

const INVENTORY = [
  // Tools
  { name:'github-mcp',         type:'MCP',    owner:'orchestrator', status:'active',     d24: 412, d7d: 2891, last:'14s ago' },
  { name:'supabase-mcp',       type:'MCP',    owner:'platform',     status:'active',     d24: 188, d7d: 1402, last:'31s ago' },
  { name:'anthropic-claude',   type:'Tool',   owner:'clinical',     status:'active',     d24: 904, d7d: 6020, last:'2s ago' },
  { name:'codex-reviewer',     type:'Tool',   owner:'codex',        status:'active',     d24: 88,  d7d: 612,  last:'48s ago' },
  { name:'drug-interaction-db',type:'Tool',   owner:'clinical',     status:'active',     d24: 41,  d7d: 244,  last:'12m ago' },
  { name:'lab-unit-converter', type:'Tool',   owner:'platform',     status:'active',     d24: 12,  d7d: 91,   last:'1h ago' },
  { name:'pdf-extractor',      type:'Tool',   owner:'doc',          status:'deprecated', d24: 0,   d7d: 4,    last:'4d ago' },
  // Skills
  { name:'write-adr',          type:'Skill',  owner:'doc',          status:'active',     d24: 3,   d7d: 22,   last:'18m ago' },
  { name:'draft-cr',           type:'Skill',  owner:'platform',     status:'active',     d24: 8,   d7d: 41,   last:'9m ago' },
  { name:'codex-pass-1',       type:'Skill',  owner:'codex',        status:'active',     d24: 41,  d7d: 312,  last:'48s ago' },
  { name:'codex-pass-2',       type:'Skill',  owner:'codex',        status:'active',     d24: 38,  d7d: 298,  last:'2m ago' },
  { name:'replay-events',      type:'Skill',  owner:'orchestrator', status:'active',     d24: 2,   d7d: 14,   last:'6h ago' },
  // Agents
  { name:'clinical',           type:'Agent',  owner:'—',            status:'active',     d24: null,d7d: null, last:'12s ago' },
  { name:'patient',            type:'Agent',  owner:'—',            status:'active',     d24: null,d7d: null, last:'42s ago' },
  { name:'platform',           type:'Agent',  owner:'—',            status:'active',     d24: null,d7d: null, last:'3m ago' },
  { name:'pharmacy',           type:'Agent',  owner:'—',            status:'active',     d24: null,d7d: null, last:'8s ago' },
  { name:'doc',                type:'Agent',  owner:'—',            status:'stalled',    d24: null,d7d: null, last:'21m ago' },
];

const CHAT_HISTORY = [
  { from:'user',  who:'You', av:'M', t:'14:38', text:"What needs my decision right now?" },
  { from:'orch',  who:'Orchestrator', av:'O', ai:true, t:'14:38', text:`Three items in your ratifier queue, sorted by age:

1. **CR-091** — RBAC: introduce \`delegated_caregiver\` role (filed 2d 4h ago, p1, floor-6)
2. **CR-094** — Hard-floor #6: prescription requires clinician sig (1d 18h, p0, floor-6)
3. **CR-096** — Promotion ledger: \`reject_with_modifications\` event (3d 2h, p2, floor-4)

CR-091 and CR-094 both have Codex pass-2 complete; CR-091's Codex-2 recommends a hold pending legal review of delegation consent UX. CR-096 is unblocked and low-risk.

Recommendation: ratify CR-094 now (lowest risk, restores a missing floor constraint), then convene a 15-min review for CR-091 with legal.`, callout: 'CR-091 has been waiting 2d 4h — that is over your soft SLA of 48h.' },
  { from:'user',  who:'You', av:'M', t:'14:39', text:"Approve CR-094." },
  { from:'orch',  who:'Orchestrator', av:'O', ai:true, t:'14:39', text:`Done. CR-094 ratified at 14:39:11 UTC.

- Event \`ratification_decision\` written to canonical log
- Promotion ledger entry pending Platform Agent author (~30s)
- Clinical Agent notified; PR #135 will auto-merge once promotion ledger is committed

Anything else?` },
];

const KEY_EVENTS_24H = [3,2,5,4,7,6,8,5,9,7,12,15,11,14,18,21,17,14,10,8,11,16,22,28];
// 24 buckets, hourly; ai-authored share roughly tracks 90%
const AI_EVENTS_24H = KEY_EVENTS_24H.map(n => Math.max(0, n-1));

const PR_TREND_7D = [9, 12, 8, 14, 17, 11, 18];  // PRs/day last 7 days
const THROUGHPUT_24H = 18;
const THROUGHPUT_7D_AVG = 13;

const PILOT_PCT = 47;
const WEEKS_TO_PILOT = 8;

Object.assign(window, {
  COCKPIT_DATA: {
    PROJECTS, AGENTS, PRS, SPEC_TREE, PENDING_RATIFICATIONS, RECENT_DECISIONS,
    BLOCKERS, MILESTONES, EVENT_LOG, INVENTORY, CHAT_HISTORY,
    KEY_EVENTS_24H, AI_EVENTS_24H, PR_TREND_7D,
    THROUGHPUT_24H, THROUGHPUT_7D_AVG, PILOT_PCT, WEEKS_TO_PILOT,
  }
});
