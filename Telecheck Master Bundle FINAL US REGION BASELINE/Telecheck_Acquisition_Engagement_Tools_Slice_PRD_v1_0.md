# Telecheck — Acquisition & Engagement Tools Slice PRD

**Covers:** Food & Calorie Scanning (#15), Fitness & Behavior Tracking (#16), Pregnancy Tracking (#17)
**Version:** 1.0
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 5 & Pillar 6, §11.1
**Companion documents:** AI Clinical Assistant Slice PRD v1.0, RPM/CCM Slice PRD v1.0, Medication Interaction & Validation Engine Slice PRD v1.0, Consent & Delegated Access Slice PRD v1.0

---

## 1. Purpose and strategic role

These three tools serve the same strategic function: they bring patients onto the platform without requiring a clinical visit, create habitual engagement between clinical events, and generate health data that feeds clinical workflows when the patient enters a care relationship.

A patient who downloads Telecheck to scan their lunch, track their steps, or monitor their pregnancy is not yet a clinical patient. But they have an account, a health profile beginning to form, and a relationship with the platform. When that patient develops a clinical need — a blood sugar concern, a GLP-1 interest, a medication question during pregnancy — Telecheck is already in their pocket and already knows something about them.

These tools are **acquisition engines, not primary revenue generators** (Master PRD §18). Revenue comes from the clinical services they feed: consultations, prescriptions, refills, RPM/CCM subscriptions. The tools themselves are free at launch.

This slice defines all three tools together because they share the same design principles, the same clinical connection model, and the same data-flow architecture. Where they differ (food scanning checks medication interactions; pregnancy tracking has safety-critical escalation), the differences are called out.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 11 — Engage with health independently of clinical visits | All three tools |
| §10 Pillar 5 — Food and calorie scanning, fitness and behavior signal integration | Food scanning and fitness tracking |
| §11.1 Launch scope — Food and calorie scanning, fitness tracking, pregnancy tracking | Launch capabilities |
| §11.4 Critical-path subset | All three are 30-day-tolerant (acquisition tools; absence doesn't affect care) |
| §18 Business model — Acquisition engines | Low-friction tools that feed clinical services |
| §20 Non-goals — Telecheck is not a consumer wellness app | Wellness signals serve clinical care; they are not the product in themselves |

---

## 3. Design principles (shared across all three tools)

**Clinical connection, not standalone wellness.** Every tool connects to the patient's clinical context. Food scanning doesn't just count calories — it checks against medication interactions and condition-relevant dietary concerns. Fitness tracking doesn't just count steps — it feeds RPM data and connects to condition management. Pregnancy tracking doesn't just show weeks — it surfaces medication safety flags and connects to prenatal care pathways.

**Low friction, high engagement.** These tools must feel lighter and faster than the clinical portions of the platform. A food scan should take 5 seconds. A step count should sync automatically. A pregnancy milestone should arrive as a delightful notification, not a clinical obligation.

**Clear boundary between wellness and clinical advice.** These tools provide health information and guidance, not clinical advice. The UX clearly separates "here's what your food contains" (wellness information) from "talk to your doctor about this medication interaction" (clinical escalation). The AI Clinical Assistant (Mode 1) reinforces this boundary when patients ask questions that cross it.

**Data feeds clinical workflows, not the reverse.** Data from these tools flows into clinical contexts (RPM dashboards, interaction engine, clinician preparation) when the patient has a care relationship. Clinical data does not flow back into these tools beyond what the patient has already seen (e.g., the patient sees their own medication list; food scanning can reference it for interaction checking).

**Free at launch.** No per-use fee, no subscription, no paywall. The tools are included in the platform experience. Their value is acquisition and engagement, not direct revenue.

---

## 4. Food & Calorie Scanning

### 4.1 What it does

The patient photographs a food item or meal. The platform identifies the food, estimates nutritional content (calories, macronutrients, key micronutrients), and connects the information to the patient's clinical context.

### 4.2 Scanning flow

1. Patient taps "Scan food" from the Home screen, the dedicated Food tab, or the AI Clinical Assistant
2. Camera opens with framing guide
3. Patient photographs the food item or meal
4. AI identifies the food and estimates nutritional content
5. Patient sees: food identification (with confidence), estimated calories, macronutrient breakdown (carbs, protein, fat), and key micronutrients
6. Patient can correct the identification ("That's not rice, it's couscous") or adjust portion size
7. The scan is saved to the patient's food log

### 4.3 Clinical connections

**Condition-aware guidance.** If the patient has diabetes, scanned foods that are high-glycemic are flagged with a gentle note: "This food may cause a blood sugar spike. If you're managing diabetes, consider pairing it with protein or fiber." The guidance is educational, not prescriptive.

**Medication-aware flags.** If the patient's medication list includes a medication with food interactions (e.g., warfarin and vitamin K-rich foods; MAOIs and tyramine-rich foods; statins and grapefruit), the scan checks the food against known interactions. If a flag is triggered: "This food may interact with [medication]. Talk to your doctor or pharmacist if you eat this regularly."

These flags are informational. They are not interaction engine signals (they don't have the same severity/mechanism/recommended-action structure). They are food-level awareness prompts that reference the patient's medication list. The patient can dismiss them.

**Herbal medicine connection.** If the patient's herbal medicine profile includes preparations with dietary implications (e.g., licorice root and sodium, ginseng and blood sugar), food scans may surface relevant awareness: "You're taking [herbal preparation]. Monitoring your [nutrient] intake may be helpful."

**RPM data feed.** For patients enrolled in RPM/CCM programs with dietary components (diabetes management, weight management), food scan data feeds the RPM dashboard as a dietary adherence signal. The clinician sees aggregate dietary patterns (not individual scans) alongside other monitoring data.

### 4.4 What it does NOT do

- Does not prescribe diets or meal plans
- Does not replace nutritionist consultation
- Does not provide medical nutrition therapy
- Does not diagnose food allergies or intolerances
- Does not guarantee calorie accuracy (estimates are approximate and the patient should understand this)

### 4.5 Food database

The food scanning AI requires a food recognition model and nutritional database. Requirements:
- Coverage of foods commonly consumed in Ghana and West Africa (jollof rice, fufu, kenkey, banku, waakye, kelewele, groundnut soup, light soup, palm nut soup, etc.) — not just a Western food database
- Local food names and regional variants
- Portion size estimation from photos (inherently imprecise — the system should communicate this)
- Nutritional data from recognized sources (USDA, FAO West African Food Composition Table, Ghana Health Service nutrition data where available)

---

## 5. Fitness & Behavior Tracking

### 5.1 What it does

The platform collects movement, exercise, and health behavior signals from the patient's device (phone accelerometer, connected wearables) and manual entry. It presents the data as a simple activity dashboard and connects it to clinical context.

### 5.2 Data sources

**Automatic (device-based):**
- Step count (from phone accelerometer or connected wearable)
- Distance walked/run
- Active minutes
- Sleep duration and quality (from wearable, if available)

**Manual entry:**
- Exercise type and duration ("I walked for 30 minutes," "I did 20 minutes of yoga")
- Self-reported activity level for the day

**Connected devices:**
- Integration with common fitness wearables and health platforms (Apple Health, Google Health Connect, Fitbit, Samsung Health) where available
- At launch, integration scope is limited to a defined compatibility list per market

### 5.3 Activity dashboard

The patient sees:
- Today's step count and progress toward daily goal (default goal: 7,500 steps, adjustable)
- Weekly activity summary (steps, active minutes, exercise sessions)
- Trends over time (weekly and monthly views)
- Streaks and milestones (days in a row meeting goal — light gamification)

### 5.4 Clinical connections

**RPM data feed.** For patients enrolled in RPM/CCM programs, activity data feeds the monitoring dashboard:
- Activity level as an adherence signal for exercise goals in the care plan
- Sedentary pattern alerts (extended period of very low activity may indicate clinical concern — e.g., depression, mobility decline, or acute illness)
- Correlation views: activity level alongside blood glucose, blood pressure, or weight trends

**Condition-aware context.** If the patient has conditions affected by activity (diabetes: exercise lowers blood sugar; hypertension: regular exercise reduces blood pressure; obesity: activity supports weight management), the dashboard notes the connection: "Staying active helps manage your blood pressure. You've been averaging 6,000 steps this week."

**Medication timing.** If the patient takes medications that interact with exercise (e.g., insulin: exercise may cause hypoglycemia), a gentle note is available: "If you exercise intensely, check your blood sugar before and after, especially if you take insulin."

### 5.5 What it does NOT do

- Does not prescribe exercise programs
- Does not replace physiotherapy or exercise physiology consultation
- Does not diagnose conditions from activity patterns
- Does not enforce exercise requirements (the patient is never penalized for inactivity)
- Does not use activity data for insurance risk assessment or any non-clinical commercial purpose

---

## 6. Pregnancy Tracking

### 6.1 What it does

Pregnancy tracking provides week-by-week guidance through pregnancy, with medication safety as the core clinical connection. It is the most safety-sensitive of the three acquisition tools because pregnancy creates urgent medication interaction and teratogenicity concerns.

### 6.2 Setup

When the patient indicates pregnancy (during onboarding, in their health profile, or in conversation with Mode 1):
- Estimated due date or last menstrual period is captured
- Gestational week is calculated
- The pregnancy tracking module activates in the patient's health profile
- The Medication Interaction & Validation Engine is notified — pregnancy/lactation flags activate for all current and future medication checks (Medication Interaction Engine Slice §4.5)

### 6.3 Weekly tracking experience

Each week, the patient sees:
- **Week milestone.** "You're in week [X]" with a brief, warm description of what's happening developmentally
- **Body changes.** Common symptoms and changes for this week, written in plain language
- **Nutrition focus.** Key nutritional needs for this stage (folic acid, iron, calcium, etc.)
- **Activity guidance.** Safe activity levels and modifications for this stage
- **Upcoming milestones.** What to expect in the coming weeks
- **Appointments.** Recommended prenatal care schedule (when to get an ultrasound, when to get specific labs)

Content is clinician-reviewed and based on established prenatal care guidelines. Content is educational, not prescriptive — the patient's prenatal care provider makes clinical decisions.

### 6.4 Clinical connections

**Medication safety — the primary clinical value.** Pregnancy tracking activates pregnancy/lactation flags across the platform:
- Every current medication is checked against pregnancy safety categories (FDA/EMA or equivalent classification)
- Medications that are contraindicated, cautioned, or require dose adjustment in pregnancy are flagged
- The patient sees these flags on their medication detail page: "This medication has pregnancy-related precautions. Talk to your doctor."
- The clinician sees pregnancy-activated interaction signals at every prescribing and refill decision
- New prescriptions during pregnancy are automatically checked against the pregnancy-aware interaction engine

**Herbal medicine safety.** Pregnancy activates herb-specific safety flags. Many herbal preparations are contraindicated or cautioned in pregnancy (e.g., St. John's Wort, high-dose ginger, certain traditional preparations). The herb-drug engine's pregnancy flags surface alongside medication flags.

**Lab schedule integration.** Recommended prenatal labs (blood type, hemoglobin, glucose screening, urinalysis, etc.) integrate with the Labs Slice's lab schedule tracking. The patient receives reminders for recommended prenatal labs.

**RPM connection.** If the patient enrolls in an RPM/CCM program (e.g., gestational diabetes management), pregnancy tracking data feeds the monitoring dashboard.

**Emergency awareness.** Pregnancy tracking includes awareness of danger signs at each stage:
- Always visible: "Seek immediate care if you experience: severe abdominal pain, vaginal bleeding, severe headache with visual changes, reduced fetal movement after [X] weeks, sudden severe swelling, or leaking fluid."
- This is not a clinical assessment tool — it is a persistent safety awareness feature
- If the patient reports a danger sign to Mode 1, the AI triggers the emergency escalation pathway immediately

### 6.5 Postpartum transition

After the estimated due date:
- The tracking module transitions to postpartum mode
- Lactation-aware medication flags activate (replacing pregnancy flags where the concern shifts from teratogenicity to milk transfer)
- Postpartum recovery milestones and guidance
- Newborn care basics (not a substitute for pediatric care — awareness and connection to care)
- The patient can indicate the pregnancy ended (delivery, loss, or termination). Each path receives appropriate, sensitive content and care connections.

### 6.6 Pregnancy loss sensitivity

If the patient indicates a pregnancy loss:
- All pregnancy-related notifications, milestones, and content stop immediately
- A sensitive acknowledgment is displayed: "We're sorry for your loss. If you need support, [resources]."
- The patient's health profile updates to reflect the loss (for clinical record accuracy)
- Medication flags revert from pregnancy-aware to standard
- The patient is not automatically prompted about pregnancy in future interactions unless they initiate

### 6.7 What it does NOT do

- Does not replace prenatal care or a prenatal care provider
- Does not provide ultrasound interpretation or fetal diagnostics
- Does not make prescribing decisions about medication safety in pregnancy (it flags; the clinician decides)
- Does not provide labor and delivery guidance
- Does not provide newborn clinical care guidance (connects to pediatric care pathways, does not replace them)

---

## 7. Shared architecture

### 7.1 Data model

Each tool stores data in the patient's health profile:

| Tool | Data stored | Clinical consumers |
|---|---|---|
| Food scanning | Food log entries (food, nutritional content, timestamp, medication/condition flags generated) | RPM dietary tracking, clinician preparation, AI Clinical Assistant context |
| Fitness tracking | Activity entries (steps, active minutes, exercise, sleep), device source | RPM activity monitoring, clinician preparation, AI Clinical Assistant context |
| Pregnancy tracking | Gestational week, due date, milestone progress, pregnancy status | Medication Interaction Engine (pregnancy flags), Herb-Drug Engine (pregnancy flags), Labs (prenatal schedule), RPM (gestational diabetes), clinician preparation |

### 7.2 Consent

These tools operate under **data-use consent** (Consent Slice §5.3). The patient consents to AI interpretation of their health data at program enrollment. For patients who use only the acquisition tools without enrolling in a clinical program, a lighter data-use consent covers the AI-powered food recognition and health guidance.

Data from these tools is shared with clinicians only when the patient has an active care relationship and care consent. A patient using food scanning without any clinical enrollment has their data stored but not shared with anyone.

### 7.3 Engagement model

All three tools use the same engagement patterns:
- **Daily/weekly touchpoints** that feel lightweight and rewarding (not clinical obligations)
- **Streak and milestone mechanics** (light gamification — "5 days in a row logging food" or "Week 20 of pregnancy")
- **AI Clinical Assistant integration** — Mode 1 can answer questions about food, fitness, and pregnancy ("Is sushi safe during pregnancy?" or "How many calories are in fufu?")
- **Clinical pathway connection** — when tool engagement surfaces a clinical need, the transition to clinical care is smooth (not a hard sell)

### 7.4 Notifications

| Tool | Notification types | Default channel |
|---|---|---|
| Food scanning | Weekly nutrition summary, medication interaction flags | In-app only |
| Fitness tracking | Daily activity reminder (if opted in), weekly summary, milestone celebrations | In-app, optional WhatsApp |
| Pregnancy tracking | Weekly milestone ("You're in week 24!"), appointment reminders, lab reminders | In-app + WhatsApp |

All acquisition tool notifications are lower priority than clinical notifications. The patient can mute any of them.

### 7.5 Delegate access

Delegates with view-records scope can see the patient's food log, activity data, and pregnancy tracking data within their granted visibility categories. Pregnancy tracking data is in the reproductive health sensitive category — delegates without reproductive health access do not see it (Consent Slice §6.4).

---

## 8. Acquisition-to-clinical-care conversion

### 8.1 Conversion pathways

The primary business value of these tools is converting engaged users into clinical patients:

| Tool | Conversion target | Pathway |
|---|---|---|
| Food scanning | GLP-1 program, diabetes management, nutrition consult | "Based on your food log, you might benefit from our weight management program. Would you like to learn more?" |
| Fitness tracking | RPM/CCM enrollment, chronic care programs | "You've been tracking your activity consistently. Our monitoring program can help connect your activity data to your health goals." |
| Pregnancy tracking | Prenatal care consult, gestational diabetes screening, medication review | "Based on your pregnancy stage, it might be a good time to review your medications with a doctor." |

### 8.2 Conversion design principles

- **Suggest, don't push.** Conversion prompts are suggestions, not sales. They appear at natural moments (after a food scan that reveals a dietary concern, after a fitness milestone, at a pregnancy stage that warrants clinical attention), not on a scheduled marketing cadence.
- **Maximum one prompt per week** per tool. The patient is never bombarded.
- **Always dismissible.** The patient can dismiss a conversion prompt and it does not return for 30 days.
- **Transparent.** The prompt explains what the clinical service offers and what it costs. No bait-and-switch.
- **Never conditional.** The tools never degrade in quality or features based on whether the patient converts. A patient who uses food scanning for a year without enrolling in a clinical program gets the same scanning experience as a GLP-1 patient.

---

## 9. Edge cases

### 9.1 Food scanning — unrecognized food

If the AI cannot identify the food:
- "I couldn't identify this food. Can you tell me what it is?" with a text entry option
- The patient enters the food name; the system looks up nutritional data from the database
- If the food is not in the database: "I don't have nutritional data for [food name]. You can still log it as a meal." The food is logged without nutritional data.
- Unrecognized foods are tracked for database expansion (same pattern as herb-drug coverage gaps)

### 9.2 Fitness tracking — inconsistent device data

If the patient's device reports implausible activity data (100,000 steps in a day, 0 steps for a week despite app usage):
- Implausible highs are flagged: "Your step count today seems unusually high. This might be a device issue." The data is logged but flagged.
- Extended zeros are noted gently: "We haven't seen activity data from your device recently. Is everything okay with your tracker?"
- No clinical action is taken on flagged device data — it is informational only.

### 9.3 Pregnancy tracking — uncertain dates

If the patient is unsure of their due date or last menstrual period:
- The system allows an approximate date ("I think I'm about 3 months pregnant")
- The gestational week is estimated with a note: "This is an estimate — your doctor can confirm your due date with an ultrasound."
- The tracking adjusts if the patient later updates the date with a clinician-confirmed due date.

### 9.4 Pregnancy tracking — high-risk pregnancy

The pregnancy tracking module provides general pregnancy guidance, not high-risk pregnancy management. If the patient has conditions that make their pregnancy high-risk (preeclampsia history, gestational diabetes, multiple pregnancy, advanced maternal age):
- The module does not provide high-risk-specific guidance
- It surfaces a recommendation: "Based on your health profile, you may benefit from closer prenatal monitoring. Would you like to discuss this with a doctor?"
- The module's general content remains available alongside the clinical recommendation

---

## 10. Metrics

**Acquisition**
- Tool adoption rate (% of platform users who use each tool)
- Daily/weekly active users per tool
- Food scans per user per week
- Activity tracking days per user per month
- Pregnancy tracking engagement rate (% of pregnant users who actively track)

**Engagement**
- Retention rate per tool (30/60/90-day)
- Streak completion rate
- AI Clinical Assistant questions related to food, fitness, or pregnancy
- Time spent in each tool per session

**Conversion**
- Conversion prompt display rate
- Conversion prompt engagement rate (tapped vs dismissed)
- Acquisition-tool-to-clinical-service conversion rate (the key business metric)
- Time from first tool use to clinical enrollment
- Revenue attributable to tool-acquired patients

**Clinical integration**
- Food scans with medication interaction flags generated
- Pregnancy tracking medication safety flags generated
- Activity data feeding RPM dashboards (for clinically enrolled patients)
- Clinician references to acquisition tool data during consults

**Data quality**
- Food recognition accuracy rate
- Unrecognized food rate
- Device data plausibility flag rate
- Pregnancy date accuracy (estimated vs clinician-confirmed)

---

## 11. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **AI Clinical Assistant Slice.** Mode 1 answers questions arising from tool use and facilitates conversion to clinical services.
- **Medication Interaction & Validation Engine Slice.** Pregnancy tracking activates pregnancy/lactation flags. Food scanning references medication-food interactions.
- **Herb-Drug Interaction Engine Slice.** Pregnancy tracking activates herbal medicine pregnancy flags. Food scanning may reference herbal-dietary interactions.
- **RPM/CCM Slice.** Activity and dietary data feed RPM monitoring for enrolled patients.
- **Consent & Delegated Access Slice.** Data-use consent covers tool data. Pregnancy data is in the reproductive health sensitive category.
- **Labs Slice.** Pregnancy tracking integrates with prenatal lab schedule tracking.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Tool notifications use in-app and optionally WhatsApp channels.
- **Food recognition AI model.** A food recognition model trained on or adapted for West African and Ghanaian cuisine. Model selection and training/adaptation is on the critical path for food scanning quality.
- **Nutritional database.** Coverage of local foods with accurate nutritional data.
- **Prenatal care content.** Clinician-reviewed week-by-week pregnancy content. Content development is on the critical path for pregnancy tracking.

---

## 12. Open questions (slice-level)

1. **Food recognition model.** Build, fine-tune an existing model, or use a third-party API? How is the model adapted for Ghanaian and West African foods? What accuracy rate is acceptable at launch?
2. **Wearable device partnerships.** Should Telecheck partner with specific wearable brands for Ghana launch (potentially negotiating bulk pricing for patients)? Or remain device-agnostic?
3. **Pregnancy content localization.** Is the pregnancy content based on WHO prenatal care guidelines, Ghana Health Service guidelines, or a combination? Are there culturally specific pregnancy practices that should be acknowledged or addressed in the content?
4. **Calorie accuracy communication.** How prominently should the platform communicate that food scanning calorie estimates are approximate? Overcommunicating uncertainty reduces trust; undercommunicating it creates false precision.
5. **Gamification calibration.** How much gamification is appropriate? Streaks and milestones drive engagement but risk trivializing health management. What's the right balance for a clinical platform?
6. **Tool usage without account.** Should any tool functionality be available without creating a Telecheck account (true zero-friction acquisition)? Or is account creation the minimum bar? No-account usage maximizes top-of-funnel but limits data persistence and conversion.
7. **Men's health acquisition tool.** The current three tools skew toward general wellness and pregnancy. Should there be a men's-health-specific acquisition tool (e.g., fitness challenges, health screening reminders) to feed the ED program pipeline?

---

## 13. v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 50)

### 13.1 Country-conditional marketing surface logic (Row 50 — per ADR-027)

This section governs how the Acquisition & Engagement Tools slice renders any marketing-class surface (educational interstitials, conversion hooks, drug-class/molecule-class call-outs) in a country-conditional manner per ADR-027 (Country-Conditional DTC Marketing Posture).

**Pre-render CCR consultation.** All surface-rendering services in this slice MUST consult CCR `marketing.molecule_level_marketing_permitted` (3-state enum: `permitted` | `prohibited` | `pending_evidence`) before rendering any molecule-level marketing surface. The CCR resolution scope is the patient's `country_of_care`. Default rendering behavior when `marketing.molecule_level_marketing_permitted ≠ permitted`: the slice MUST render program-level surfaces only (program/category-class messaging) and MUST suppress molecule-level surfaces (specific-molecule/brand-name claims).

**Surface classification (5 criteria per Master PRD §13.2 working definition).** Marketing surfaces are classified at design time using the §13.2 5-criterion working definition (specific molecule mention, brand name reference, claim class, audience targeting, regulatory venue). Borderline cases fail-closed (treat as molecule-level) per ADR-027 v0.6 Decision §7.

**Audit emission for every rendered molecule-level surface.** Each render of a molecule-level surface MUST emit `marketing.surface_rendered` per AUDIT_EVENTS v5.2 §6 carrying: CCR marketing policy version, MarketingCopy entity version, governance review reference, approval timestamp, approval validity expiry, claim classes, patient_id, country_of_care, surface_id.

**Drift detection and auto-suspend.** A `marketing.surface_drift` event (per AUDIT_EVENTS v5.2 §6 + Master PRD §13.2) auto-suspends the affected surface. Detection triggers include: CCR policy version change after copy approval, MarketingCopy approval validity expiry, governance review cadence overrun (`marketing_governance_review_cadence_months`), or detection that rendered claim classes diverge from approved MarketingCopy. Republishing requires a fresh §13.2 governance review pass.

**Marketing copy registration flow.** Copy is authored, then governance-reviewed under the Master PRD §13.2 Governance review process (triple sign-off per ADR-027 v0.6: Product + Regulatory Affairs + Clinical Safety), then registered as a `MarketingCopy` entity per TYPES v5.2. Only `MarketingCopy` entities in `approved` status may be referenced by surface-rendering services. The MarketingCopy registration carries the structured `marketing_copy_governance_evidence` object per CCR_RUNTIME v5.2 marketing block.

**Cross-references:** ADR-027 (Country-Conditional DTC Marketing Posture, Accepted at v1.10); Master PRD v1.10 §7.9 (marketing posture activation gate operational requirements), §13.2 (Marketing copy governance process); AUDIT_EVENTS v5.2 §6 (`marketing.surface_rendered`, `marketing.surface_drift`); CCR_RUNTIME v5.2 marketing block (`molecule_level_marketing_permitted`, `marketing_copy_governance_evidence`, `marketing_governance_review_cadence_months`, `marketing_governance_lead_designation_artifact_id`); TYPES v5.2 (`MarketingCopy`, `MarketingCopyGovernanceEvidence`); MARKET_LAUNCH v5.1 marketing posture activation gate (6 conditions); DOMAIN_EVENTS v5.2 (`marketing.surface_published`, `marketing.surface_suspended`).

---

## Document control

- **v1.0** — Combined Acquisition & Engagement Tools slice PRD covering Food & Calorie Scanning, Fitness & Behavior Tracking, and Pregnancy Tracking. Defines shared design principles (clinical connection, low friction, clear wellness/clinical boundary), individual tool flows and clinical connections, acquisition-to-clinical-care conversion model, shared data architecture and consent model, and edge cases. Pregnancy tracking includes medication safety as primary clinical value, danger sign awareness, postpartum transition, and pregnancy loss sensitivity. Derived from Master PRD v1.6 §10 Pillar 5 and §18 acquisition engines.
- **v1.10 cycle addition (2026-05-02 — v1.10.1 hygiene cycle physical merge of Phase5 delta Row 50):** Added §13 country-conditional marketing surface logic per ADR-027 (Accepted at v1.10). All molecule-level marketing surfaces consult CCR `marketing.molecule_level_marketing_permitted` and emit `marketing.surface_rendered` audit. Drift detection auto-suspends via `marketing.surface_drift`. Cross-references CCR_RUNTIME v5.2 marketing block, TYPES v5.2 MarketingCopy, AUDIT_EVENTS v5.2 §6, MARKET_LAUNCH v5.1 activation gate.
- **Next review:** after food recognition model decision (Q1); after pregnancy content is clinically reviewed; after RPM/CCM slice defines dietary and activity data consumption format.
- **Change discipline:** changes to clinical connection logic (medication flags, interaction references), pregnancy safety escalation, conversion design principles, or data-sharing scope require explicit owner sign-off.
