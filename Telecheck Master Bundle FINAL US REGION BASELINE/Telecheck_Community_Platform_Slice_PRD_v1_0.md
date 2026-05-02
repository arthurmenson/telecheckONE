# Telecheck — Community Platform Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Community Safety & Moderation Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 6, §13.3
**Companion documents:** Admin — Moderation Policy Configuration Slice PRD (#19), AI Clinical Assistant Slice PRD v1.0, Consent & Delegated Access Slice PRD v1.0, Adverse Event Reporting Slice PRD v1.0, Market Rollout Cockpit Slice PRD v1.0

---

## 1. Purpose and strategic role

Community is how Telecheck keeps patients engaged between clinical events. A patient who sees a doctor once a quarter and refills monthly has 360 days a year with no platform contact. Community fills that gap with peer support, shared experience, expert guidance, and condition-specific connection. Patients who feel connected to others managing the same condition are more adherent, more informed, and more retained.

Community is also the platform's highest-risk non-clinical surface. A peer support group for diabetes patients can become a source of dangerous misinformation. A weight-loss group can become a venue for disordered eating encouragement. A men's health group can become a target for spam or exploitation. And any group can surface a crisis — a patient expressing suicidal ideation, disclosing abuse, or describing a medical emergency.

This slice defines how Telecheck builds community that drives engagement and retention while maintaining safety through moderation that is structured, governed, and crisis-aware.

This slice defines:
- What community spaces exist and how they are structured
- How content is created, displayed, and moderated
- How moderation works (automated + human, with platform-floor crisis detection)
- How expert sessions and curated content work
- How community connects to clinical care (without replacing it)
- What the patient, moderator, and operator see
- What happens when things go wrong

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 12 — Participate in patient community | Moderated groups, events, expert sessions, peer support |
| §10 Pillar 6 — Community and engagement | Full pillar definition |
| §11.1 Launch scope — Community | Moderated groups, events, expert sessions, peer support |
| §11.3 Launch activation — Community groups beyond curated launch set | Additional groups activate as moderation capacity warrants |
| §13.3 Protocol-authorized moderation autonomy | Moderation framework |
| §13.4 Platform floor — Community floor | No medication sales, no sexualization of minors, no doxing, no crisis override, no safety-critical misinformation tolerance |
| §23 Q3 — Community moderation capacity sizing | Pre-launch decision this slice helps resolve |

---

## 3. Actors

| Actor | Role in community |
|---|---|
| **Patient (community member)** | Participates in groups. Posts, comments, reacts, shares experiences. Attends expert sessions. Reports content. |
| **Expert** | Clinician, nutritionist, health educator, or subject-matter expert who leads sessions or contributes authoritative content. Expert content is visually distinguished from peer content. |
| **Moderator** | Trained human moderator who reviews flagged content, enforces community guidelines, handles escalations, and ensures safe spaces. |
| **AI moderation system** | Automated content screening that flags, hides, or escalates content based on configured moderation policies. Operates under §13.3. |
| **Community Safety & Moderation Lead** | Manages the moderation team, configures moderation policies, reviews moderation metrics, and handles escalations that exceed moderator authority. |
| **Delegate** | Participates in community under their own account, not the patient's. A delegate cannot post as a patient. A delegate may participate in relevant groups (e.g., a caregiver in a caregiver support group). |

---

## 4. Community structure

### 4.1 Groups

Groups are the primary community structure. Each group is:
- **Condition-specific or program-specific.** Tied to a health condition, program, or care journey. Not general-purpose social groups.
- **Moderated.** Every group has active moderation (automated + human).
- **Membership-gated.** Patients join groups relevant to their conditions or programs. Joining is opt-in, not automatic. Some groups may require enrollment in a specific program.
- **Named and described.** Each group has a name, description, community guidelines summary, and expected tone.

### 4.2 Launch groups (Ghana)

Three curated launch groups, matching the primary commercial programs:

**1. Weight & Metabolic Health**
- For patients in GLP-1 programs, weight management, and metabolic health journeys
- Topics: medication experiences, side effect management, dietary strategies, exercise, progress sharing, emotional aspects of weight management
- Moderation sensitivity: high — eating disorder risk, body image sensitivity, unverified diet advice

**2. Men's Health**
- For patients in men's health and ED programs
- Topics: treatment experiences, lifestyle factors, relationship impacts, general men's wellness
- Moderation sensitivity: high — privacy and discretion essential, stigma awareness, spam/exploitation risk
- Design: discreet naming and navigation. Community participation does not reveal the specific program to other platform surfaces.

**3. Living with Hypertension & Diabetes**
- For patients managing chronic conditions — hypertension, diabetes, or both
- Topics: daily management, medication experiences, diet and nutrition, monitoring routines, lab result understanding, family involvement, emotional wellbeing
- Moderation sensitivity: moderate — misinformation risk around medication and dietary advice, emotional support needs

### 4.3 Group expansion

Additional groups activate after launch when:
- Moderation capacity is confirmed (moderator-to-member ratio meets threshold)
- Community health signals from existing groups are stable (low policy-violation rate, acceptable moderation workload)
- New group topics are identified from patient demand (requests, AI assistant conversation patterns, program enrollment data)

Expansion is managed through the Market Rollout Cockpit — new groups go through the activation review flow with moderation capacity as a dependency.

---

## 5. Content model

### 5.1 Content types

| Type | Description | Who creates | Moderation level |
|---|---|---|---|
| **Post** | Standalone contribution to a group. Text, optional photo. | Patient | Pre-screen (automated) + human review for flagged content |
| **Comment** | Reply to a post. Text only at launch. | Patient | Pre-screen (automated) + human review for flagged content |
| **Reaction** | Lightweight response (support, helpful, thanks). Not a "like" — reactions are empathetic, not popularity-driven. | Patient | No moderation needed |
| **Expert post** | Authoritative content from a verified expert. Visually distinct from peer content. | Expert | Pre-reviewed by moderation team before publication |
| **Expert session announcement** | Scheduled live or async Q&A with an expert. | Community team | Pre-reviewed |
| **Pinned resource** | Curated, clinician-reviewed resource (article, guide, FAQ) pinned at the top of a group. | Community team / clinical team | Pre-reviewed and clinically validated |
| **Poll** | Structured question for group members. Anonymous responses. | Community team (not patient-created at launch) | Pre-reviewed |

### 5.2 Content rules

- **No medication dosing advice between peers.** Patients can share their experiences ("I take 1mg of semaglutide and it works for me") but cannot advise others on dosing ("You should increase your dose"). The distinction is moderated.
- **No medical diagnosis between peers.** Patients can describe symptoms and share experiences but cannot diagnose others.
- **No medication or supplement sales.** Platform floor rule (§13.4). Zero tolerance.
- **No identifiable health information about third parties.** Patients can discuss their own health freely but cannot post identifiable information about others (including family members) without consent.
- **Photo guidelines.** Photos of food, exercise, lifestyle are welcome. Photos of medications are allowed (for identification or discussion). Photos of wounds, symptoms, or medical conditions are allowed in clinical context but flagged for moderation review. Photos of people must have consent (self-photos are fine; photos of others require consent).
- **Anonymity option.** Patients can participate under their display name or choose an anonymous handle within a group. Anonymous participation still has an identity in the system for moderation and safety purposes — the patient is not anonymous to moderators.

### 5.3 Content visibility

All content is visible only to members of the group. Groups are not discoverable by search engines. Content is not shared outside the group without the author's explicit action. There is no public feed, no discovery algorithm, and no cross-group content surfacing.

---

## 6. Moderation

### 6.1 Moderation architecture

Community moderation operates under §13.3 (protocol-authorized moderation autonomy). It has three layers:

**Layer 1 — Automated pre-screening.** Every post and comment passes through automated content screening before publication. The screening checks for: prohibited content (medication sales, explicit content, contact information exchange, known misinformation patterns), potential crisis signals (self-harm language, abuse indicators, emergency keywords), and spam/manipulation patterns. Screening decisions: pass (content publishes immediately), flag for human review (content is held), or auto-hide (content is hidden with a notification to the author and a queue entry for human review).

**Layer 2 — Human moderation.** Trained moderators review flagged content, respond to user reports, enforce community guidelines, and maintain group health. Human moderators make contextual decisions that automated screening cannot: is this medication experience sharing or dosing advice? Is this emotional venting or a crisis? Is this cultural health practice discussion or dangerous misinformation?

**Layer 3 — Crisis detection and escalation.** Platform-floor behavior (§13.4). Not configurable. If any content — posted, commented, or detected by the AI — signals self-harm, abuse, imminent danger, or medical emergency, mandatory escalation triggers regardless of moderation policy configuration.

### 6.2 Moderation actions

| Action | Severity | Automated? | Reversible? |
|---|---|---|---|
| **Pass** | None | Yes | N/A |
| **Flag for review** | Low | Yes | N/A (pending human decision) |
| **Auto-hide** | Moderate | Yes (for clear violations) | Yes — author notified, can appeal |
| **Human hide** | Moderate | No — moderator decision | Yes — author can appeal |
| **Warn user** | Moderate | No — moderator decision | N/A |
| **Restrict posting** | Moderate-high | No — moderator decision | Yes — time-limited (24h/72h/7d) |
| **Remove content** | High | No — moderator decision | No — content deleted. Author notified with reason. |
| **Account suspension** | Severe | No — **human review required at launch** | Not easily — requires safety team review to reverse |
| **Emergency escalation** | Critical | Yes (crisis detection) + human follow-up | N/A — safety action |

**Serious moderation actions (account suspension, irreversible enforcement, emergency escalations tied to a specific user) require human review at launch.** Admin-configurable relaxation of this rule is explicitly post-launch (Master PRD §11.2).

### 6.3 Moderation staffing (Ghana launch)

Per the Flagged Items Resolution:
- **2 trained human moderators** covering Ghana business hours (8am–8pm)
- **1 moderator on-call** for evening/overnight crisis escalation (8pm–8am)
- Automated moderation running 24/7 under configured policies
- Crisis detection always-on regardless of moderator availability

**Moderation SLAs:**

| Signal type | Response target |
|---|---|
| Crisis / self-harm / abuse | Under 15 minutes (24/7) |
| Severe harassment / dangerous misinformation | Under 1 hour (during staffed hours) |
| Routine moderation reports | Under 24 hours |

**Expansion trigger:** When active community membership exceeds 500 per group, or when moderation action rate exceeds a defined threshold, add moderator capacity before adding groups.

### 6.4 Crisis detection

Crisis detection is platform-floor behavior. It cannot be configured away by moderation policy, admin settings, or guardrail templates.

**Triggers:**
- Language indicating suicidal ideation or self-harm intent
- Language indicating abuse (domestic violence, child abuse, elder abuse)
- Language indicating a medical emergency
- Language indicating imminent danger to self or others

**Response:**
- Content is immediately flagged for moderator + safety team review
- If the author is identifiable (not anonymous to the system — they always are), their account is flagged for outreach
- Crisis resources are surfaced to the author (local emergency number, crisis helpline, "If you're in danger, call [number] now")
- If the signal is assessed as imminent risk, the safety team may contact the patient directly through the platform's messaging system
- The incident is logged in the Adverse Event Reporting system and the Market Rollout Cockpit

**What crisis detection does not do:**
- It does not auto-ban or restrict the user (they may be in crisis and need the platform's resources)
- It does not publicly flag the content to other group members
- It does not diagnose or assess severity autonomously — human safety team follow-up is required

---

## 7. Expert sessions

### 7.1 What they are

Expert sessions are scheduled, moderated interactions between a verified expert (clinician, nutritionist, health educator) and group members. They are a primary content-quality driver — expert sessions produce authoritative information that counterbalances the risk of peer misinformation.

### 7.2 Session formats

**Live Q&A.** Scheduled time-bounded session where the expert answers questions in real time (text-based at launch). Group members submit questions; the expert responds. A moderator manages the queue and ensures guidelines are followed. Sessions are archived and available as a resource afterward.

**Ask-the-Expert thread.** A time-bounded (typically 48–72 hours) async thread where the expert answers questions posted by group members. Lower-intensity than live Q&A. Answers are marked as expert-verified.

**Expert article.** A long-form piece written by the expert, published as a pinned resource in the group. Clinically reviewed before publication. Permanent resource.

### 7.3 Expert content distinction

Expert content is always visually distinct from peer content (Master PRD §17). The distinction uses:
- A verified badge next to the expert's name
- A distinct visual container (different background color or border)
- A label: "Expert response" or "Clinician-verified"
- Expert content is never mixed into the peer feed without visual distinction

This distinction is a hard rule. The patient must always know whether they are reading a peer's experience or an expert's guidance.

---

## 8. Community-to-clinical-care bridge

Community engagement should naturally connect to clinical care when appropriate — without community becoming a substitute for clinical care.

### 8.1 How community connects to clinical care

- **"Ask your doctor" pathways.** When a community discussion raises a question the patient should ask their clinician, the AI Clinical Assistant (Mode 1) or the expert can suggest: "This is a great question for your doctor — would you like to book a consult?" The pathway is a suggestion, not a redirect.
- **Refill and medication discussion.** If a patient's community post mentions medication concerns that align with their active prescriptions, Mode 1 (if the patient engages it) can surface relevant interaction signals or suggest a refill review.
- **Lab result context.** If a patient shares a lab result in a community post ("My HbA1c went up"), Mode 1 can offer to explain the result in private ("Would you like me to explain what your HbA1c means for your care plan?").
- **Program enrollment.** Community participation may surface interest in clinical programs. A patient in the diabetes group who isn't enrolled in RPM/CCM may be offered enrollment: "We notice you're actively managing your diabetes. Our monitoring program might help — would you like to learn more?"

### 8.2 What community does not do

- **Community does not replace clinical consultations.** Peer advice is peer advice. Expert sessions are educational, not clinical. No community interaction constitutes a clinical encounter.
- **Community does not surface confidential clinical data.** A patient's medication list, lab results, and clinical history are not visible in community unless the patient voluntarily shares them in a post.
- **Community does not enable peer-to-peer prescribing or medication sharing.** Platform floor rule. Zero tolerance.
- **AI Clinical Assistant does not participate in community discussions.** Mode 1 is not a community member. It does not post in groups, comment on posts, or generate content in community spaces. It may assist individual patients privately when they engage it from a community context.

---

## 9. Patient-facing experience

### 9.1 Community discovery

The patient finds community from:
- **Home screen.** A community section showing groups relevant to the patient's conditions and programs, with member count and recent activity indicator.
- **Program dashboard.** Each program links to its associated community group.
- **AI Clinical Assistant.** Mode 1 can suggest relevant groups: "There's a community group for people managing hypertension — would you like to join?"

Joining is always opt-in. The patient is never auto-enrolled in a community group.

### 9.2 Group experience

Inside a group, the patient sees:
- **Feed.** Chronological stream of posts and expert content. Pinned resources at the top.
- **Guidelines.** Accessible community guidelines specific to this group.
- **Members.** Member count (not a member list — privacy). The patient can see who posted but cannot browse all members.
- **Events.** Upcoming expert sessions with join/RSVP controls.
- **Resources.** Curated, clinician-reviewed content for this condition/program.
- **Report.** Easy reporting mechanism for any content that violates guidelines or causes concern.

### 9.3 Posting experience

- Text entry with optional photo attachment
- Anonymity toggle ("Post as [display name]" or "Post anonymously")
- Before posting, a gentle guidelines reminder: "Remember: share your experience, not medical advice for others"
- Post preview before submission
- After posting: the post appears in the feed (or shows "Under review" if flagged by automated screening)

### 9.4 Notification preferences

Community notifications default to in-app only (batched). Patients can opt into WhatsApp notifications for specific groups or events. Community notifications are always lower priority than clinical notifications (Master PRD §17 notification architecture).

---

## 10. Moderator experience

### 10.1 Moderation queue

The moderator's primary surface:
- **Flagged content queue.** Content flagged by automated screening or user reports, sorted by severity and age.
- Each flagged item shows: content text, author (even if anonymous to the group — moderators see the account), flag reason, group context, author's posting history, and moderation action controls.
- **Crisis alerts.** Crisis-detected content surfaces with highest priority and distinct visual treatment.

### 10.2 Moderation actions

From the queue, moderators can:
- **Approve.** Content is unflagged and published (if it was held) or confirmed as appropriate (if it was auto-published but reported).
- **Hide.** Content is removed from the group feed. Author is notified with reason.
- **Warn.** Author receives a warning message explaining the guideline violation. The warning is logged.
- **Restrict.** Author's posting ability is temporarily restricted (24h/72h/7d). Author is notified with reason and duration.
- **Remove.** Content is permanently deleted. Author is notified with reason.
- **Escalate.** Content requires Community Safety Lead or safety team review (severity beyond moderator authority).

### 10.3 Moderator guidelines

Moderators follow structured guidelines that cover:
- How to distinguish experience sharing from medical advice
- How to handle emotional content without clinical judgment
- When to escalate vs handle directly
- How to communicate with authors (warm, respectful, non-punitive tone)
- How to handle cultural health practice discussions (respect for traditional medicine while flagging dangerous practices)
- Crisis response protocol
- Bias awareness (no differential treatment based on condition, identity, or background)

---

## 11. Content that requires special moderation attention

### 11.1 Medication experience sharing vs dosing advice

The line between acceptable experience sharing and dangerous dosing advice:

**Acceptable:** "I take 0.5mg of semaglutide and I've found it works well for me." "When I started metformin, I had stomach issues for the first two weeks but they settled." "My doctor switched me from amlodipine to losartan because of swelling."

**Not acceptable:** "You should increase your dose to 1mg — that's what worked for me." "Stop taking your metformin if you feel sick — it's not worth it." "Don't bother with what your doctor says, just take [specific medication]."

The moderator's judgment call: did the author share their own experience, or did they prescribe action for another person? Context matters — "I found that taking it at night helped" is borderline acceptable (sharing a personal strategy) while "Take it at night, not in the morning" crosses into advice.

### 11.2 Mental health content

Community groups for chronic conditions will surface mental health content — the emotional burden of chronic disease is real. Moderation approach:
- Emotional sharing is welcome and supported ("I feel overwhelmed managing my diabetes")
- Peer empathy is encouraged ("I understand — you're not alone in this")
- Depression or anxiety discussion is not suppressed — but crisis signals are always detected
- Moderators do not attempt to provide mental health counseling
- When appropriate, moderators suggest clinical resources: "It sounds like you're going through a lot. Our AI assistant can help connect you with support if you'd like."

### 11.3 Traditional medicine and herbal discussions

Particularly relevant for Ghana. Moderation approach:
- Discussion of traditional remedies and herbal medicines is welcome — this is a core part of the patient's health context
- Sharing experiences with herbal medicines is treated the same as sharing experiences with prescription medications
- Dangerous recommendations (e.g., "Stop your diabetes medication and use [herbal preparation] instead") are moderated as medical advice
- The herb-drug interaction engine's patient-facing messaging can be referenced by moderators: "If you're using [herbal preparation] with prescription medications, it's worth checking for interactions — you can ask the AI assistant."
- Cultural sensitivity is essential. Moderators never dismiss or disrespect traditional medicine — they redirect unsafe advice while respecting the practice.

### 11.4 Weight and body image content

In the Weight & Metabolic Health group:
- Progress sharing is encouraged ("I've lost 5kg in 3 months on my program")
- Before/after photos are allowed with content warnings
- Extreme restriction, purging, or pro-eating-disorder content is removed and the author receives a supportive message with resources
- Shaming or negative comments about anyone's body or progress are removed
- Comparison-driven content ("I lost more than you" or "You should be losing faster") is moderated

---

## 12. Safety and platform floor

### 12.1 Community platform floor rules (§13.4)

- No platform-tolerated peer-to-peer sale or exchange of medications
- No platform-tolerated sexualization or solicitation of minors
- No platform-tolerated doxing or targeted harassment
- No override of crisis detection and escalation
- No tolerance of verified safety-critical misinformation

### 12.2 What "verified safety-critical misinformation" means

Not all incorrect health information is "safety-critical misinformation." A patient saying "I heard vitamin C cures colds" is common misinformation but not safety-critical. A patient saying "Stop taking your insulin, it's poison — use cinnamon instead" is safety-critical because following the advice could cause death.

The moderation standard for safety-critical misinformation: would following this advice plausibly cause serious harm to the person reading it? If yes, the content is removed and the author is warned. If the content is merely incorrect but not dangerous, an expert response or moderator note may correct it without removal.

---

## 13. Audit

| Event | What is recorded |
|---|---|
| Group created / modified | Group ID, name, configuration, creator, timestamp |
| Member joined / left | Member ID, group, timestamp, join method (voluntary/invitation) |
| Content posted | Content ID, author (including anonymous mapping), group, content text, photo attachment metadata, automated screening result, timestamp |
| Content flagged | Content ID, flag source (automated/user report), flag reason, timestamp |
| Moderation action | Content ID, moderator ID, action taken, reason, timestamp |
| User warned / restricted | User ID, moderator ID, reason, duration (if restricted), timestamp |
| Account suspension recommended | User ID, moderator ID, reason, escalation to safety team, timestamp |
| Crisis detected | Content ID, trigger type, response actions taken, escalation destination, timestamp |
| Expert session | Session ID, expert ID, group, format, duration, participant count, timestamp |
| Content reported by user | Reporter ID, content ID, report reason, timestamp |
| Appeal submitted | User ID, content ID, appeal text, timestamp |
| Appeal resolved | Content ID, reviewer ID, decision, timestamp |

---

## 14. Metrics

**Engagement**
- Active community participants (monthly active members who post, comment, or react)
- Participation rate (community members as % of active platform patients)
- Posts per active member per month
- Reactions per post (engagement signal)
- Expert session attendance rate
- Community-to-clinical-service conversion (community engagement preceding clinical action — consult booking, program enrollment, refill)
- Group membership growth rate

**Safety and moderation**
- Automated screening flag rate (% of content flagged)
- False-positive flag rate (flagged content that moderators approve — calibration signal)
- Human moderation action rate (% of content receiving human moderation action)
- Policy-violation rate (content removed or author warned as % of total content)
- Crisis-signal rate and time-to-response
- Crisis-signal-to-confirmed-crisis rate (were crisis detections warranted?)
- User report rate (members reporting content)
- Appeal rate and appeal-upheld rate
- Account restriction / suspension rate
- Moderator response time by signal type (vs SLA)
- Moderation queue depth (is the team keeping up?)

**Content quality**
- Expert content ratio (expert posts as % of total content)
- Expert session frequency
- Pinned resource engagement (views, saves)
- Dangerous-misinformation removal rate

**Retention**
- Community member 30/60/90-day retention
- Community churn rate
- Correlation between community participation and clinical service retention (do community members retain better than non-members?)

---

## 15. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Admin — Moderation Policy Configuration (#19).** Moderation policies are configured through the admin surface. The community platform enforces them.
- **AI Clinical Assistant Slice.** Mode 1 suggests groups, assists with clinical questions arising from community context, and does not participate directly in community.
- **Consent & Delegated Access Slice.** Community participation requires data-use consent for community. Delegates participate under their own accounts.
- **Adverse Event Reporting Slice.** Crisis detections and safety incidents from community feed the adverse event reporting system.
- **Market Rollout Cockpit Slice.** Community groups are activated through the cockpit. Moderation capacity is a dependency checked before group expansion.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Community notifications (expert session announcements, post responses) use in-app and optionally WhatsApp channels.
- **Moderation staffing.** 2 moderators (daytime) + 1 on-call (overnight) for Ghana launch. Moderator recruitment and training is on the launch critical path.
- **Expert recruitment.** At least one expert per launch group for initial expert sessions and pinned resources. Expert identity verification and onboarding required.
- **Community guidelines.** Written, clinician-reviewed community guidelines for each launch group. Guidelines must be culturally appropriate for the anchor market.

---

## 16. Open questions (slice-level)

1. **Direct messaging between community members.** The Master PRD says community is "not a direct-messaging platform between arbitrary users" (§20). Should any form of private messaging be supported (e.g., patient-to-patient connection request with mutual opt-in)? Or is all community interaction group-level only?
2. **Content persistence.** How long are community posts retained? Indefinitely? Or do posts expire after a period (e.g., 12 months)? What about expert content and pinned resources?
3. **Community for delegates/caregivers.** Should there be caregiver-specific community groups (e.g., "Caring for a parent with diabetes")? These would be populated by delegates, not patients, and have different content needs.
4. **Multilingual community.** At what point do community groups need multilingual support? For Ghana, is English sufficient for launch, or should Twi-language groups be available? How does moderation work across languages?
5. **User blocking.** Can a community member block another member (preventing them from seeing each other's posts)? This is standard in social products but adds complexity to the moderation model.
6. **Community analytics for clinical insights.** Should aggregated community data (trending topics, frequently asked questions, common concerns) be surfaced to the clinical team for program improvement? If so, what anonymization and consent standards apply?
7. **Partner/sponsor content.** The Master PRD notes "condition-specific program sponsorship with appropriate disclosure" as a potential post-launch monetization path (§18). What disclosure standard applies? How is sponsored content distinguished from organic and expert content?
8. **Group size limits.** Should groups have maximum membership? If a group grows to 5,000 members, does moderation scale linearly or are sub-groups needed?

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 10)

**Cycle C2 — Emerging-markets framing reframe.** The launch posture is reframed conceptually as an **emerging-market pilot in Ghana via Telecheck-Ghana** — the architecture (group model, three-layer moderation, crisis detection, moderation staffing) is country-agnostic and CCR-driven per ADR-024; only the launch instance is Ghana. The §4.2 group identifiers and §6.3 moderation-staffing references retain their Ghana-specific naming because they are operational facts about the actual community at the Telecheck-Ghana pilot (Heros Health Ghana DBA community groups), not architectural constraints. Future emerging-market instances will configure their own launch groups and moderation staffing through the Market Rollout Cockpit.

**Cross-references (v1.10):** ADR-024 (CCR country-driven configuration), Master PRD v1.10 §17 (brand-structure rules — Telecheck-Ghana operating-tenant identifier), Market Rollout Cockpit Slice (per-market group activation).

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 10 (Cycle C2).

---

## Document control

- **v1.0** — Initial Community Platform slice PRD. Defines group structure (3 launch groups for Ghana), content model (7 content types with moderation levels), three-layer moderation architecture (automated screening, human moderation, crisis detection), moderation staffing (2+1 for Ghana launch) with SLAs, expert session formats, community-to-clinical-care bridges, special moderation guidance for medication sharing, mental health, traditional medicine, and body image content, and platform floor compliance. Derived from Master PRD v1.6 §10 Pillar 6 and §13.3.
- **Next review:** after moderation staffing is confirmed (§23 Q3); after community guidelines are written and clinically reviewed; after expert recruitment for launch groups.
- **Change discipline:** changes to moderation architecture, crisis detection triggers, content rules, platform floor compliance, or moderation staffing model require explicit owner sign-off and must be validated against the Master PRD §13.3 and §13.4.
