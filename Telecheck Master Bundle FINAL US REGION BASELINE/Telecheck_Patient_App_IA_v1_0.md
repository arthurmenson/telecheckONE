# Telecheck — Patient App Information Architecture

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Parent document:** Telecheck Master Platform PRD v1.6, §12 (launch-readiness criteria), §17 (experience direction)
**Companion documents:** All slice PRDs, Design System v1.1

---

## 1. Purpose

This document defines how 17 slice PRDs become one coherent patient experience. It translates product requirements into screen structure, navigation, and information hierarchy — the skeleton that the Design System then skins.

The Master PRD (§2) positions this document as "experience truth" — downstream of the PRD but upstream of prototypes and screen designs. It interprets PRD intent into patient-facing architecture without introducing screen-level design decisions (colors, typography, component styles — those belong in the Design System).

**This document answers:** Where does everything live? How does the patient move between capabilities? What do they see first? What is always reachable? What is buried deliberately?

---

## 2. Design constraints (from Master PRD §17)

- Calm, not sterile. Warm and reassuring clinical platform.
- Premium but trustworthy. Quality signaled through consistency, not decoration.
- Readable, not decorative. Comprehension first.
- AI is visually distinct from clinician-authored and peer-authored content. Always.
- Protocol-executed actions are visibly flagged. Always.
- Low-friction onboarding. Under 5 minutes.
- Empty, loading, failure, and offline states are designed. Every screen.
- Degraded connectivity is a first-class target.
- Family context is always visible when acting as delegate.
- Mobile-first. Phone screen is the primary viewport.
- One question or small group per screen in forms. No long scrolling forms.

---

## 3. Navigation model

### 3.1 Primary navigation — bottom tab bar

Five tabs. Always visible. The patient can reach any primary surface in one tap from anywhere.

```
┌──────────────────────────────────────────────┐
│                                              │
│              [Current Screen]                │
│                                              │
├──────┬──────┬──────┬──────┬──────────────────┤
│ Home │ Care │ Rx   │ Labs │ Community        │
│  🏠  │  💊  │  💊  │  🔬  │  👥              │
└──────┴──────┴──────┴──────┴──────────────────┘
```

| Tab | Primary purpose | What lives here |
|---|---|---|
| **Home** | Dashboard, daily overview, quick actions | Today's tasks, recent activity, program status, acquisition tools entry, AI assistant launcher |
| **Care** | Clinical relationships and consultations | Active programs, consults (async + sync), care plans, clinician directory, booking |
| **Pharmacy (Rx)** | Medications and fulfillment | Active medications, refill, prescriptions, order tracking, delivery status |
| **Labs** | Lab results and health data | Lab timeline, trends, uploads, document history |
| **Community** | Peer support and engagement | Groups, posts, expert sessions, resources |

### 3.2 Persistent elements (always accessible)

Three elements are reachable from every screen, regardless of tab:

**AI Clinical Assistant launcher.** A floating action button or persistent icon in the bottom-right corner. One tap opens Mode 1 conversation. Pre-seeded with context from the current screen (e.g., tapping from a medication detail page opens chat about that medication).

**Notification bell.** Top-right corner. Shows unread count. Taps into the notification center (§4.8).

**Emergency control.** Persistent in the top area or accessible via long-press on the AI launcher. One tap surfaces emergency numbers and guidance. This is a launch-readiness criterion (Master PRD §12).

### 3.3 Delegate context banner

When a delegate is acting on behalf of a patient, a persistent banner appears below the top bar on every screen:

```
┌──────────────────────────────────────┐
│ 👤 Viewing: [Patient Name]  [Switch] │
└──────────────────────────────────────┘
```

The banner is non-dismissible. "Switch" returns to the delegate's own account or switches to another patient they have access to. All screens below the banner show the target patient's data, not the delegate's.

---

## 4. Screen architecture by tab

### 4.1 Home tab

The patient's daily dashboard. Designed to answer: "What should I do today?" and "What's happening with my health?"

```
Home
├── Today's Tasks
│   ├── RPM metrics due ("Log your blood pressure")
│   ├── Medication reminders ("Take metformin at 8am")
│   ├── Upcoming appointments ("Video visit with Dr. X at 3pm")
│   ├── Pending actions ("Complete your intake form")
│   └── Refill reminders ("Refill due in 3 days")
│
├── Recent Activity
│   ├── Last consult summary
│   ├── Last refill status
│   ├── Recent lab results (if available)
│   └── Recent AI conversation snippet
│
├── Program Status Cards
│   ├── [Program 1] progress, next milestone, adherence
│   └── [Program 2] progress, next milestone, adherence
│
├── Health Tools (acquisition)
│   ├── Scan Food
│   ├── Track Activity
│   └── Pregnancy Tracker (if applicable)
│
├── AI Assistant Card
│   └── "Ask me anything about your health"
│
└── Community Highlights
    └── Recent activity from joined groups
```

**Empty state (new user, no programs):** The Home screen shows onboarding progress, acquisition tool invitations ("Track your meals," "Monitor your fitness"), and a prominent "Start a consultation" entry point. It does not show empty cards for programs, labs, and medications the patient doesn't have yet.

### 4.2 Care tab

The patient's clinical relationship hub. Where they manage programs, consults, and care plans.

```
Care
├── Active Programs
│   ├── [Program Card] — name, status, next milestone, adherence
│   │   └── Tap → Program Detail
│   │       ├── Care Plan (targets, schedule, milestones)
│   │       ├── RPM Dashboard (metrics, trends, alerts)
│   │       ├── Medication list (program-specific)
│   │       ├── Lab schedule
│   │       ├── Consult history (for this program)
│   │       └── Check-in history
│   └── [Program Card 2]
│
├── Consultations
│   ├── Upcoming (booked sync consults with date, time, clinician)
│   ├── In Progress (async consults awaiting decision)
│   ├── Recent (completed consults with summaries)
│   └── [Start a Consultation] button
│       ├── Choose: Program consult or General consult
│       ├── Choose: Async or Video
│       └── → Intake flow (Forms/Intake Engine)
│
├── My Doctors
│   ├── Clinicians the patient has seen (continuity)
│   ├── Clinician profiles
│   └── [Find a Doctor] → search and booking
│
├── Family & Delegates
│   ├── Active delegations (who can act on my behalf)
│   ├── [Add a delegate] → delegation setup flow
│   ├── [Manage access] → scope customization per delegate
│   └── Delegate activity log (who did what)
│
└── [Enroll in a Program] → program discovery and enrollment
```

### 4.3 Pharmacy (Rx) tab

The patient's medication and fulfillment center.

```
Pharmacy
├── Active Medications
│   ├── [Medication Card] — name, dose, frequency, refill status
│   │   └── Tap → Medication Detail
│   │       ├── Why prescribed
│   │       ├── Dosing instructions and history
│   │       ├── Side effects
│   │       ├── Adherence (refill history)
│   │       ├── Interaction signals (patient-appropriate language)
│   │       ├── Herb-drug signals (if applicable)
│   │       ├── Refill countdown ("Next refill due in X days")
│   │       ├── [Request Refill] button
│   │       ├── [Report a Problem] → adverse event reporting
│   │       └── [Ask About This] → AI assistant (Mode 1)
│   └── [Medication Card 2]
│
├── Herbal Medicines
│   ├── Reported herbal medicines
│   ├── [Add / Update] → herbal medicine entry
│   └── Interaction signals (herb-drug, patient-appropriate)
│
├── Orders
│   ├── Active Orders
│   │   ├── [Order Card] — medication, status, delivery/pickup, tracking
│   │   └── Tap → Order Detail
│   │       ├── Order timeline (requested → approved → fulfilling → delivering → delivered)
│   │       ├── Delivery tracking (if in transit)
│   │       ├── Pharmacy info
│   │       └── Payment receipt
│   ├── Past Orders
│   └── [empty state: "No orders yet"]
│
└── [Browse / Request Refill] → refill initiation
```

**Medication detail page** is a launch-readiness criterion (Master PRD §12). It includes: why prescribed, dosing history, side effects, adherence, clinician/pharmacy notes, refill status, and interaction signals.

**Protocol-approved refill distinction.** When a refill was protocol-approved (not clinician-reviewed), the medication detail page shows: "Approved under your [Program Name] care program. Your care team oversees this process." When clinician-approved: "Reviewed and approved by Dr. [Name]."

### 4.4 Labs tab

The patient's lab results and health document center.

```
Labs
├── Lab Timeline
│   ├── [Lab Entry] — date, panel/test name, key values, AI interpretation summary
│   │   └── Tap → Lab Detail
│   │       ├── All values with reference ranges and normal/abnormal indicators
│   │       ├── AI interpretation (full)
│   │       ├── Review status ("Reviewed by Dr. [Name]" or "Not yet reviewed")
│   │       ├── Original uploaded image (accessible)
│   │       ├── [Ask About This] → AI assistant (Mode 1)
│   │       └── [Report a Concern] → clinician messaging
│   └── [Lab Entry 2]
│
├── Trends
│   ├── Test selector (choose which test to view over time)
│   ├── Time-series chart with reference range bands
│   ├── Medication overlay toggle (show medication start/stop dates)
│   └── Panel comparison (side-by-side across uploads)
│
├── Upload
│   ├── [Take Photo] → camera capture flow
│   ├── [Choose File] → file upload
│   ├── [Enter Manually] → manual entry with panel templates
│   └── Processing status for in-progress uploads
│
├── Documents
│   ├── Non-lab document uploads (clinical letters, discharge summaries)
│   ├── AI-generated summaries
│   └── [Upload Document]
│
└── Lab Schedule
    ├── Required labs for active programs (with due dates)
    ├── Overdue labs highlighted
    └── Lab reminders settings
```

**Lab upload with extraction confirmation** is a launch-readiness criterion (Master PRD §12). The confirmation screen (extracted values alongside original image, edit controls, confidence indicators) lives within the upload flow.

**Lab trend and drill-down views** are a launch-readiness criterion (Master PRD §12). Time-series charts, panel comparisons, and medication overlays live in the Trends section.

### 4.5 Community tab

The patient's peer support and engagement space.

```
Community
├── My Groups
│   ├── [Group Card] — name, member count, recent activity indicator
│   │   └── Tap → Group Feed
│   │       ├── Pinned resources (top)
│   │       ├── Post feed (chronological)
│   │       │   ├── [Post] — author (or "Anonymous"), text, photo, reactions, comments
│   │       │   │   ├── Expert posts visually distinct (badge, container)
│   │       │   │   └── [Report] button on every post
│   │       │   └── [Post] ...
│   │       ├── [New Post] → posting flow (text, photo, anonymity toggle, guidelines reminder)
│   │       ├── Events → upcoming expert sessions, RSVP
│   │       ├── Resources → pinned clinician-reviewed content
│   │       └── Guidelines → group-specific community guidelines
│   └── [Group Card 2]
│
├── Discover Groups
│   ├── Groups relevant to patient's conditions/programs
│   ├── [Join] button per group
│   └── Group descriptions and member counts
│
├── Upcoming Events
│   ├── Expert sessions across all joined groups
│   └── RSVP status
│
└── Saved Resources
    └── Resources the patient has bookmarked from groups
```

**Content type distinction.** Every piece of content in the community feed carries a visual indicator of its source: peer content (default), expert content (verified badge + distinct container), AI-generated content (AI label — though AI does not post in community, this indicator exists for any AI-referenced content the patient might share).

---

## 5. AI Clinical Assistant surfaces

The AI assistant is not a tab — it's a layer that overlays and integrates with every tab.

### 5.1 Global launcher

Floating action button, always visible (except during video calls and full-screen flows). One tap opens the assistant.

### 5.2 Embedded cards

Contextual AI entry points embedded within other surfaces:

| Surface | Embedded card | Pre-seeded context |
|---|---|---|
| Home | "Ask me anything about your health" | General — no specific context |
| Medication detail | "Have a question about this medication?" | Medication name, signals |
| Lab detail | "Want me to explain these results?" | Lab values, interpretation |
| RPM dashboard | "Questions about your readings?" | Recent metrics, trends |
| Program detail | "How can I help with your program?" | Program, care plan |
| Community (group context) | "Need clinical clarity on something discussed here?" | Group topic |
| Refill status | "Questions about your refill?" | Refill state, medication |

### 5.3 Full workspace

Accessed by tapping the global launcher or any embedded card. A dedicated chat interface:

```
AI Clinical Assistant
├── Conversation area
│   ├── Message thread (patient messages + AI responses)
│   ├── AI label visible on every response
│   ├── Review status on clinical content ("Reviewed" / "Not yet reviewed")
│   ├── Source attribution (interaction engine reference, lab data reference)
│   └── Escalation buttons ("Talk to my doctor" → consult booking)
│
├── Context panel (collapsible)
│   ├── Active medications referenced
│   ├── Active conditions referenced
│   ├── Recent labs referenced
│   └── Active program referenced
│
├── Quick actions
│   ├── "Refill a medication"
│   ├── "Book a consult"
│   ├── "Upload labs"
│   └── "Report a concern"
│
└── Conversation history
    └── Past sessions (searchable)
```

---

## 6. Key cross-cutting screens

### 6.1 Onboarding flow

Not a tab — a linear flow that the patient passes through once:

```
Onboarding
├── Stage 1: Account Creation
│   ├── Phone/email entry
│   ├── OTP verification
│   ├── Platform consent
│   └── Name, DOB, sex, location
│
├── Stage 2: Health Profile
│   ├── Known conditions (multi-select + free text)
│   ├── Allergies
│   ├── Current medications (reconciliation flow)
│   ├── Herbal medicines (inclusive prompt)
│   ├── Pregnancy/lactation status
│   ├── Smoking/alcohol (simple screening)
│   └── Emergency contact
│
└── Stage 3: Program Enrollment
    ├── Program selection
    ├── Program-specific intake (conditional)
    ├── Care consent (consent block)
    ├── Data-use consent (consent block)
    └── → Home tab (first experience)
```

Progress indicator visible throughout. Save-and-resume across sessions. Under 5 minutes total.

### 6.2 Notification center

Accessed from the notification bell (top-right, persistent):

```
Notifications
├── Filter: All / Clinical / Pharmacy / Community / Program
│
├── [Notification] — icon, title, preview, timestamp, read/unread
│   ├── Clinical: "Your doctor reviewed your consultation" → tap → consult result
│   ├── Pharmacy: "Your medication is on its way" → tap → order tracking
│   ├── Refill: "Refill due in 3 days" → tap → medication detail
│   ├── Lab: "Lab results available" → tap → lab detail
│   ├── RPM: "Time to log your blood pressure" → tap → RPM dashboard
│   ├── Community: "New reply to your post" → tap → post
│   ├── Appointment: "Video visit tomorrow at 3pm" → tap → appointment detail
│   └── Program: "You've reached a milestone!" → tap → program detail
│
└── Settings → notification preferences per type and channel
```

### 6.3 Settings

```
Settings
├── Account
│   ├── Profile (name, contact, location)
│   ├── Identity verification status
│   └── Language preference
│
├── Consent & Privacy
│   ├── Active consents (with scope and date)
│   ├── Active delegations (with scope and relationship)
│   ├── Revocation controls per consent and delegation
│   ├── Consent history
│   └── Data rights (export, deletion request)
│
├── Notifications
│   ├── Channel preferences per notification type
│   ├── Quiet hours
│   └── Mute controls per tool/group
│
├── Devices
│   ├── Connected health devices (glucometer, BP monitor, scale)
│   └── [Add Device] → pairing flow
│
├── Payment
│   ├── Payment methods
│   ├── Payment history
│   ├── Active subscriptions
│   └── Receipts
│
├── About Telecheck
│   ├── Terms of service
│   ├── Privacy policy
│   └── App version
│
└── Support
    ├── Contact support
    ├── FAQ
    └── Report a problem
```

### 6.4 Emergency screen

Accessible from the persistent emergency control. Single-tap access from any screen.

```
Emergency
├── [Call Emergency Services] — large, prominent button with local emergency number
├── [Call My Emergency Contact] — patient's registered emergency contact
├── Emergency guidance
│   ├── "If you're having chest pain..."
│   ├── "If you're having trouble breathing..."
│   ├── "If you're having a severe allergic reaction..."
│   └── Context-aware (pregnancy-related emergencies if pregnant)
├── My Medications (cached — available offline)
├── My Allergies (cached — available offline)
└── My Conditions (cached — available offline)
```

This screen works offline (cached data). It is never behind a loading state.

---

## 7. Information hierarchy rules

### 7.1 What shows first

| Screen | First thing the patient sees | Why |
|---|---|---|
| Home | Today's tasks | Actionable — tells them what to do |
| Care | Active programs with status | Context — where they are in their journey |
| Pharmacy | Active medications with refill status | Urgent — medication management is time-sensitive |
| Labs | Most recent results | Current — latest health information |
| Community | My groups with recent activity | Engaging — social presence |

### 7.2 What is always one tap away

| Action | From where | How |
|---|---|---|
| Ask the AI | Anywhere | Floating launcher |
| Emergency | Anywhere | Persistent control |
| Refill a medication | Pharmacy tab, medication detail, AI assistant | Button or conversation |
| Book a consult | Care tab, AI assistant, Home | Button or conversation |
| Upload labs | Labs tab, AI assistant, Home | Button or conversation |
| View notifications | Anywhere | Top-right bell |

### 7.3 What is deliberately buried

| Item | Where it lives | Why it's not prominent |
|---|---|---|
| Consent management | Settings → Consent & Privacy | Important but not daily. Shouldn't clutter clinical surfaces. |
| Payment details | Settings → Payment | Transactional, not engagement. |
| Device management | Settings → Devices | Setup once, rarely revisited. |
| Data export/deletion | Settings → Consent & Privacy → Data rights | Legal requirement, not engagement feature. |
| Past orders (older than 30 days) | Pharmacy → Orders → Past | Archival, not active management. |

---

## 8. State-aware screens

Every screen has four designed states (launch-readiness criterion, Master PRD §12):

### 8.1 Empty state

When the patient has no data for this screen (new user, no programs, no labs, no medications):
- Never a blank screen
- Shows an explanation of what this surface is for
- Shows a clear action to get started ("Upload your first lab results," "Start a consultation")
- May show contextual acquisition tool entry points ("While you're here, try scanning your lunch")

### 8.2 Loading state

When data is being fetched:
- Skeleton screens (gray placeholder shapes matching the expected layout) rather than spinners
- Content loads progressively (show what's ready, load the rest)
- Never blocks the entire screen for a single slow data source

### 8.3 Failure state

When data cannot be loaded:
- Clear error message: "We couldn't load your lab results right now"
- Retry button
- Alternative action: "You can try again later, or contact support"
- Other parts of the screen that loaded successfully remain visible

### 8.4 Offline state

When the device has degraded or no connectivity:
- Persistent banner: "Limited connectivity — some features may be unavailable"
- Cached data displayed with "Last updated [timestamp]"
- Features requiring connectivity show disabled state with explanation
- Emergency screen always available (cached)
- Queued actions (refill draft, message draft) show "Will send when connected"

---

## 9. Delegate experience overlay

When a delegate is acting on behalf of a patient, the entire app operates with the delegate overlay:

**What changes:**
- Persistent banner showing target patient name with switch control
- All data shown is the target patient's (within granted visibility scope)
- Sensitive-category data hidden unless explicitly granted
- Actions limited to granted scopes (e.g., can't request refill if not granted request-refills)
- Consent blocks in forms may require the patient to complete directly
- AI conversations are logged to the target patient's account

**What doesn't change:**
- Navigation structure (same tabs, same hierarchy)
- Screen layouts (same screens, scoped data)
- AI assistant behavior (same interaction, delegate context visible)

**Scope-restricted actions** show a disabled state with explanation: "You don't have permission to request refills for [patient name]. Ask [patient name] to update your access in Settings."

---

## 10. Content type visual indicators

Every piece of content across the app carries a source indicator:

| Source | Indicator | Where it appears |
|---|---|---|
| **AI-generated** | AI icon + "AI" label | AI conversations, AI interpretations, AI summaries |
| **Clinician-authored** | Clinician name + credential | Consult notes, prescriptions, clinical notes |
| **Clinician-reviewed** | "Reviewed by Dr. [Name]" | Lab interpretations, AI outputs after review |
| **Not yet reviewed** | "Not yet reviewed by your doctor" | Lab interpretations, AI outputs before review |
| **Peer content** | Author name (or "Anonymous") | Community posts and comments |
| **Expert content** | Verified badge + "Expert" label + distinct container | Expert posts, expert session content |
| **Protocol-executed** | "Approved under your care program" | Refills, actions processed by protocol engine |
| **System-generated** | No author attribution | Notifications, reminders, status updates |

These indicators are consistent across all surfaces. A patient never needs to wonder whether they're reading AI output, clinician notes, or peer advice.

---

## 11. Screen inventory

Complete list of distinct screens in the patient app:

| # | Screen | Tab/Flow | Priority |
|---|---|---|---|
| 1 | Home dashboard | Home | Critical-path |
| 2 | Program detail | Care | Critical-path |
| 3 | RPM dashboard (within program) | Care | Launch |
| 4 | Care plan view | Care | Launch |
| 5 | Consult list (upcoming, in progress, recent) | Care | Critical-path |
| 6 | Consult intake form | Care (flow) | Critical-path |
| 7 | Consult result / post-visit summary | Care | Critical-path |
| 8 | Clinician search and booking | Care | Launch |
| 9 | Clinician profile | Care | Launch |
| 10 | Video consult — device check | Care (flow) | Launch |
| 11 | Video consult — waiting room | Care (flow) | Launch |
| 12 | Video consult — in-call | Care (flow) | Launch |
| 13 | Delegation management | Care | Launch |
| 14 | Delegate invitation flow | Care (flow) | Launch |
| 15 | Active medications list | Pharmacy | Critical-path |
| 16 | Medication detail | Pharmacy | Critical-path |
| 17 | Herbal medicines list | Pharmacy | Launch |
| 18 | Refill request flow | Pharmacy (flow) | Critical-path |
| 19 | Order list | Pharmacy | Critical-path |
| 20 | Order detail with tracking | Pharmacy | Critical-path |
| 21 | Lab timeline | Labs | Critical-path |
| 22 | Lab detail | Labs | Critical-path |
| 23 | Lab trends (charts) | Labs | Launch |
| 24 | Lab upload — camera capture | Labs (flow) | Critical-path |
| 25 | Lab upload — extraction confirmation | Labs (flow) | Critical-path |
| 26 | Lab upload — manual entry | Labs (flow) | Launch |
| 27 | Document upload and summary | Labs | Launch |
| 28 | Community — my groups | Community | Launch |
| 29 | Community — group feed | Community | Launch |
| 30 | Community — new post | Community (flow) | Launch |
| 31 | Community — expert session | Community | Launch |
| 32 | Community — discover groups | Community | Launch |
| 33 | AI Clinical Assistant — full workspace | Overlay | Critical-path |
| 34 | Notification center | Overlay | Critical-path |
| 35 | Emergency screen | Overlay | Critical-path |
| 36 | Food scanning — camera + result | Home (flow) | Launch |
| 37 | Fitness dashboard | Home | Launch |
| 38 | Pregnancy tracker | Home | Launch |
| 39 | Onboarding — Stage 1 (account creation) | Flow | Critical-path |
| 40 | Onboarding — Stage 2 (health profile) | Flow | Critical-path |
| 41 | Onboarding — Stage 3 (program enrollment) | Flow | Critical-path |
| 42 | Settings — main | Settings | Launch |
| 43 | Settings — Consent & Privacy | Settings | Launch |
| 44 | Settings — Notifications | Settings | Launch |
| 45 | Settings — Devices | Settings | Launch |
| 46 | Settings — Payment | Settings | Launch |
| 47 | Adverse event reporting form | Flow | Launch |
| 48 | Payment confirmation | Flow | Critical-path |

**48 distinct screens.** 20 are critical-path (must be designed and functional before any patient interaction). 28 are launch-scope (must be functional at launch but can follow critical-path screens by days).

---

## 12. Navigation flows — key patient journeys

### 12.1 First-time patient: curiosity to care

```
App Download → Onboarding Stage 1 → Onboarding Stage 2 → Home (empty state)
→ Scan Food (acquisition) → AI Assistant ("I'm worried about my blood sugar")
→ AI suggests consult → Consult intake → Async consult submitted
→ Notification: "Doctor reviewed your case" → Consult result → Prescription
→ Pharmacy tab → Order tracking → Delivered
→ Home: Program card appears → RPM dashboard → Daily monitoring begins
```

### 12.2 Established patient: monthly refill

```
Home: "Refill due in 3 days" → tap → Medication detail
→ [Request Refill] → Confirm → "Sent for review"
→ Notification: "Refill approved" → Pharmacy → Order tracking → Delivered
→ Medication detail: refill countdown resets
```

### 12.3 Delegate managing elderly parent

```
[Delegate's own Home] → Switch to parent's account (banner appears)
→ Pharmacy: view parent's medications → [Request Refill] for parent
→ Pay on parent's behalf → Track order
→ Switch back to own account
```

### 12.4 Lab upload and interpretation

```
Labs tab → [Take Photo] → Camera → Capture pages → Submit
→ "Processing..." → Extraction confirmation screen
→ Review values against image → Correct any errors → Confirm
→ "Interpreting..." → Lab detail with AI interpretation
→ "Not yet reviewed by your doctor" → [Ask About This] → AI explains
→ Later: Notification: "Dr. X reviewed your results" → Lab detail: "Reviewed by Dr. X"
```

---

## 13. Accessibility implementation

| Requirement | Implementation |
|---|---|
| WCAG AA contrast | All text meets minimum contrast ratios. Verified per screen. |
| Screen reader support | All interactive elements have accessible labels. All images have alt text. Tab order is logical. |
| Keyboard navigation | All flows completable via keyboard (tablet/desktop users). |
| Color not sole carrier | Severity uses icon + text + color. Status uses shape + text + color. AI/clinician/peer uses label + container + color. |
| Touch targets | Minimum 44x44pt for all interactive elements. |
| Text scaling | App respects system text size preferences up to 200%. |
| Literacy-aware copy | Patient-facing text at basic literacy level. Clinical terms explained inline. |
| Motion reduction | Animations respect system reduce-motion preferences. |

---

## Document control

- **v1.0 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5E, Rows 19 + 32):** Brand-presentation distinction documented per Master PRD v1.10 §17 (C3 brand-structure cascade): the Patient App is a consumer surface and surfaces the consumer DBA — `Heros Health` for Telecheck-US, `Heros Health Ghana` for Telecheck-Ghana, country-instanced via subdomains (`heroshealth.com`, `ghana.heroshealth.com`). The operating-tenant identifier (`Telecheck-US`, `Telecheck-Ghana`) is internal/B2B-only and MUST NOT be patient-facing — IA references that previously implied consumer-brand `"Telecheck-Ghana"` should be read as `"Heros Health Ghana"` (consumer DBA). App naming in the iOS / Android stores follows the consumer DBA (Heros Health, country-instanced by App Store metadata where required). Tenant-overridable design tokens (Design System v1.1 Tenant brand token overlay model + v1.10 cycle additions Row 33 Heros consumer-brand identity tokens) drive the visual presentation. Body content otherwise preserved at v1.0 baseline.
- **v1.0** — Initial Patient App Information Architecture. Defines five-tab navigation, persistent elements (AI launcher, notifications, emergency), delegate overlay, 48 distinct screens with critical-path flagging, key patient journey flows, content type visual indicators, state-aware screen design (empty/loading/failure/offline), and accessibility implementation. Derived from Master PRD v1.6 §12 and §17, interpreted through all slice PRDs.
- **Next review:** after Design System defines visual treatment for the IA structure; after first prototype testing with target users in Ghana.
- **Change discipline:** changes to tab structure, persistent elements, delegate overlay behavior, or content type indicators require product owner sign-off and must be validated against the Master PRD §12 launch-readiness criteria.
