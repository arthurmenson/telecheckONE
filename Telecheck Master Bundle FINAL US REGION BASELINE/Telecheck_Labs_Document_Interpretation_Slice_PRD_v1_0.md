# Telecheck — Labs and Document Interpretation Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Clinical Governance Lead
**Parent document:** Telecheck Master Platform PRD v1.9, §10 Pillar 2 & Pillar 5, §11.1
**Companion documents:** Medication Interaction & Validation Engine Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Refill Slice PRD v1.0, v5 Contracts Pack

---

## 1. Purpose and strategic role

Labs are the connective tissue of chronic care. Every medication decision, every dose adjustment, every refill renewal for a chronic condition eventually depends on a lab value. If patients cannot get their lab results into Telecheck easily, and if clinicians cannot see those results interpreted and connected to the patient's full clinical picture, the platform's promise of unified care collapses into the same fragmented experience patients already have — one app for the doctor, another for the lab, a paper printout they lose, and no one looking at the full picture.

This slice defines how patients bring lab data into the platform, how the platform extracts, structures, and stores it, how AI interprets it, how clinicians review and validate interpretations, how lab data feeds into the interaction engine and chronic care monitoring, and how patients see their results over time.

This slice also covers non-lab document interpretation — clinical letters, discharge summaries, imaging reports, and other documents patients may upload. The workflow is similar (upload → extract → interpret → review) but the data model and interpretation scope differ.

This slice defines:
- How patients upload labs and documents
- How extraction and structuring work
- How AI interpretation works and when clinician review is required
- How lab data feeds the interaction engine (drug–lab checks)
- How patients see results, trends, and interpretations
- How the platform handles poor-quality uploads, unrecognized formats, and partial data

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 3 — Upload and interpret a document or lab | End-to-end lab and document upload, extraction, interpretation, and review |
| §8 Job 6 — Monitor chronic conditions over time | Lab trends feed into RPM/CCM monitoring |
| §8 Job 7 — Handle alerts and follow-up | Lab-driven alerts and clinician escalation |
| §8 Job 9 — Converse with AI for clinical understanding | AI Clinical Assistant (Mode 1) explains lab results |
| §10 Pillar 2 — AI clinical support | AI interpretation of lab results |
| §10 Pillar 5 — Lab interpretation engine | Engine definition |
| §11.1 Launch scope — AI lab interpretation | Launch capability |
| §12 Launch readiness — Lab upload with extraction confirmation | Patient-facing foundation |
| §12 Launch readiness — Lab trend and drill-down views | Patient-facing foundation |
| Medication Interaction Engine Slice §4.3 — Drug–lab conflicts | Lab data feeds drug–lab checks |

---

## 3. Actors

| Actor | Role in this workflow |
|---|---|
| **Patient** | Uploads lab results or documents via camera or file; confirms extraction accuracy; views results, trends, and AI interpretations; asks the AI Clinical Assistant about results |
| **Delegate** | May upload labs on behalf of a patient and view results within their granted access scope |
| **Clinician** | Reviews AI interpretations where required by governance; validates or corrects extracted values; acts on lab-driven alerts; sees lab data at prescribing and refill decision points |
| **AI Clinical Assistant (Mode 1)** | Explains lab results to patients; surfaces trends and connections to conditions and medications; escalates critically abnormal values |
| **AI Clinical Assistant (Mode 2)** | Consumes lab data as input for protocol evaluation (e.g., required labs for GLP-1 eligibility) |
| **Medication Interaction & Validation Engine** | Consumes structured lab data for drug–lab conflict checks (Medication Engine Slice §4.3) |
| **RPM/CCM** | Consumes lab trends for chronic disease monitoring, adherence tracking, and alert logic |

---

## 4. Upload pathways

Patients can bring lab data into Telecheck through three pathways. All three produce the same structured output after extraction.

### 4.1 Camera capture

The patient photographs their lab report using the device camera. This is the primary pathway for Ghana and emerging markets, where lab results are often received as printed paper or handwritten forms.

**Flow:**
1. Patient taps "Upload labs" from the Labs tab, Home, or AI Clinical Assistant
2. Camera opens with framing guide ("Position your lab report within the frame")
3. Patient captures one or more pages
4. System performs image quality check (blur detection, lighting, completeness). If quality is insufficient, the patient is prompted to retake: "The image is a bit blurry — try again with better lighting"
5. Images are uploaded for extraction processing

**Design principles:**
- The camera flow should feel as simple as taking a photo, not operating a scanner
- Multi-page support — many lab reports span multiple pages. The patient can capture multiple pages in sequence before submitting
- The patient can review captured images before submitting and retake any that look wrong

### 4.2 File upload

The patient uploads a digital file — PDF, image (JPEG, PNG), or supported document format. This pathway serves patients who receive lab results electronically (email, patient portal download).

**Flow:**
1. Patient taps "Upload labs" and selects "Choose file"
2. File picker opens. Supported formats: PDF, JPEG, PNG, HEIC
3. File is uploaded for extraction processing

### 4.3 Manual entry

The patient manually enters lab values. This is a fallback for cases where the lab report is damaged, illegible, or in a format the extraction pipeline cannot process.

**Flow:**
1. Patient selects "Enter manually"
2. Structured form with common lab panels (complete blood count, metabolic panel, lipid panel, HbA1c, thyroid panel, liver function, renal function) presented as selectable templates
3. Patient selects the relevant panel and enters values with units
4. System validates entries (numeric format, plausible range — flags clearly impossible values like "hemoglobin: 500" for correction)
5. Values are saved directly to the patient's lab history (no extraction step needed)

### 4.4 External integration (post-launch)

Direct integration with laboratory information systems (LIS) to receive lab results electronically. This eliminates the upload step entirely. Post-launch capability dependent on lab partner integration in each market.

---

## 5. Extraction and structuring

### 5.1 Extraction pipeline

Camera captures and file uploads enter the extraction pipeline:

1. **Image preprocessing.** Rotation correction, deskewing, contrast enhancement, noise reduction. For multi-page uploads, pages are ordered.
2. **OCR (Optical Character Recognition).** Text extraction from the image or PDF. The OCR engine must handle: printed text (standard lab reports), mixed printed and handwritten text (common in Ghana), multiple languages on the same report (English and local language headers), and variable report formats (no two labs use the same layout).
3. **Structured data extraction.** The extracted text is parsed to identify: lab test names, values, units, reference ranges, specimen collection date, ordering physician (if present), laboratory name (if present), and any flags or annotations on the report.
4. **Normalization.** Extracted test names are mapped to a canonical lab test vocabulary (e.g., LOINC codes or internal canonical names). Units are normalized to a standard unit system. This normalization is essential because the same test may be reported under different names by different labs ("FBG" vs "Fasting Blood Glucose" vs "Fasting Glucose").
5. **Confidence scoring.** Each extracted value is assigned a confidence score based on OCR quality, parsing certainty, and normalization match. Low-confidence values are flagged for patient confirmation.

### 5.2 Patient confirmation step

After extraction, the patient sees a **confirmation screen** showing the extracted values alongside the original image. This is a launch-readiness criterion (Master PRD §12): "Lab upload with extraction confirmation. Upload via camera or file, OCR/extraction preview, edit/confirm step, and save-to-history. Not a fire-and-forget queue."

**Confirmation screen shows:**
- Each extracted test name, value, unit, and reference range
- Confidence indicator for each value (high confidence: displayed normally; low confidence: highlighted with "Please verify this value")
- The original image alongside the extracted values for comparison
- Edit controls for each value (patient can correct extraction errors)
- "Add missing values" option if the extraction missed a test on the report
- Collection date (extracted or patient-entered)
- "Confirm and save" button

**The patient must confirm before values are saved to their history.** This prevents extraction errors from silently entering the clinical record. It also gives the patient a moment of engagement with their results before interpretation begins.

**For delegate uploads:** The delegate performs the confirmation step on behalf of the patient. The confirmation is logged as delegate-confirmed.

### 5.3 What happens after confirmation

- Confirmed values are saved to the patient's lab history with: test name (canonical), value, unit, reference range, collection date, upload date, source (camera/file/manual), extraction confidence, and confirming user (patient or delegate)
- The Medication Interaction & Validation Engine is notified that lab data has been updated. If any active prescriptions have drug–lab check relevance, the engine re-evaluates. New drug–lab signals are generated if thresholds are crossed.
- AI interpretation begins (§6)
- The values appear in the patient's lab timeline

---

## 6. AI interpretation

### 6.1 What the AI interprets

After confirmed lab values are saved, the AI interpretation engine analyzes:

**Individual value assessment**
- Is the value within, above, or below the reference range?
- How far from the range boundary is it? (marginally abnormal vs severely abnormal)
- Is there a previous value for comparison? If so, what is the delta and the trend direction (stable, improving, worsening)?

**Panel-level assessment**
- Do related values form a coherent clinical picture? (e.g., elevated creatinine + elevated BUN + low GFR together suggest renal impairment more strongly than any single value)
- Are any panel-level patterns clinically significant?

**Cross-domain correlation**
- How do the lab values connect to the patient's known conditions? (e.g., HbA1c in a diabetic patient; LFTs in a patient on hepatotoxic medication; potassium in a patient on potassium-sparing diuretics)
- How do the lab values connect to the patient's active medications? (this is where the AI interpretation engine and the Medication Interaction Engine's drug–lab check overlap — the interpretation engine provides narrative explanation, the interaction engine provides structured signals)
- How do the lab values connect to the patient's reported herbal medicines? (e.g., LFT abnormalities in a patient reporting kava or neem use)

**Trend analysis**
- For patients with multiple lab uploads over time, the AI identifies trends: improving, worsening, stable, or fluctuating
- Trend analysis is especially important for chronic care monitoring (RPM/CCM): a slowly rising creatinine over 6 months is a different clinical signal than a single elevated creatinine

### 6.2 Interpretation output

The AI produces a structured interpretation containing:

| Field | Description |
|---|---|
| Summary | 2–3 sentence plain-language summary of the overall lab results. Written for the patient. |
| Abnormal values | List of values outside reference range, with severity indication (mildly / moderately / severely abnormal) |
| Trend alerts | Values that are trending in a concerning direction, even if currently within range |
| Condition connections | How results relate to the patient's known conditions |
| Medication connections | How results relate to the patient's active medications (narrative complement to interaction engine drug–lab signals) |
| Herbal medicine connections | How results may relate to reported herbal medicines |
| Recommended follow-up | Suggested next steps (recheck in X weeks, discuss with your doctor, no action needed) |
| Confidence | Overall interpretation confidence (high/medium/low) |
| Review status | "Not yet reviewed by your doctor" (default) or "Reviewed by Dr. [Name]" |

### 6.3 Clinician review requirement

AI lab interpretations require clinician review in the following cases:

**Always requires clinician review:**
- Critically abnormal values (values that could indicate immediate clinical danger)
- First-time lab upload for a patient (no prior context for the AI to reason from)
- Values that trigger new drug–lab interaction signals at critical or major severity
- Trend reversals in monitored chronic conditions (e.g., previously stable HbA1c now worsening)
- Patient explicitly requests clinician review

**Clinician review recommended but not required:**
- Mildly abnormal values with stable trends
- Values consistent with known, managed conditions (e.g., mildly elevated glucose in a known diabetic with stable HbA1c)
- Routine monitoring results within expected parameters

**No clinician review required:**
- All values within normal reference ranges with no significant trends
- Routine monitoring with stable results in a well-managed program

**Governance note:** The line between "always requires" and "recommended" is configurable per market and program through the admin guardrail configuration surface. The conservative default at launch requires clinician review for all abnormal values. As the AI interpretation engine builds a track record, the threshold can be relaxed for well-characterized lab patterns in specific programs.

### 6.4 Clinician review workflow

When clinician review is required or requested:
- The lab interpretation enters the clinician's review queue
- The clinician sees: patient summary, extracted values (with original image accessible), AI interpretation, interaction engine drug–lab signals, herb–drug signals if relevant, and recommended follow-up
- The clinician takes one of four actions:
  - **Validate** — AI interpretation is correct. Interpretation is marked as reviewed. Patient sees "Reviewed by Dr. [Name]."
  - **Correct** — AI interpretation needs adjustment. Clinician edits the interpretation. The AI's original interpretation is retained in audit; the clinician's corrected version is what the patient sees.
  - **Escalate** — results require urgent clinical action (new prescription, dose change, emergency referral). The clinician initiates the appropriate workflow from the review surface.
  - **Request retest** — results are questionable (possible lab error, unlikely values given clinical context). The clinician requests a retest and the patient is notified.

---

## 7. Patient-facing experience

### 7.1 Lab timeline

The primary patient view of their lab history. A chronological feed showing each lab upload with:
- Date of collection
- Panel name or individual test name(s)
- Key values with normal/abnormal indicators
- AI interpretation summary (2–3 sentences)
- Review status indicator
- Tap to expand into full detail view

### 7.2 Lab detail view

When the patient taps a lab result:
- All extracted values for that upload, with reference ranges and normal/abnormal indicators
- AI interpretation (full output from §6.2)
- Review status and reviewing clinician name (if reviewed)
- Original uploaded image accessible for reference
- "Ask about this" button → opens AI Clinical Assistant (Mode 1) pre-seeded with the lab context

### 7.3 Trend views

For tests with multiple values over time:
- **Time-series chart** showing values plotted over time with reference range bands
- **Trend indicator** (improving / worsening / stable / fluctuating)
- **Medication overlay** — option to overlay medication start/stop/dose-change dates on the trend chart, showing potential correlation between medication changes and lab value changes
- **Panel comparison** — side-by-side comparison of related values across two or more uploads (e.g., compare last 3 metabolic panels)

Trend views are a launch-readiness criterion (Master PRD §12): "Lab trend and drill-down views. Time-series, panel comparisons, medication overlays."

### 7.4 Abnormal value alerts

When a lab upload contains abnormal values:
- The patient is notified (in-app + WhatsApp) that results are available and contain values outside the normal range
- The notification does not state the specific abnormal values — it directs the patient to view results in the app. This avoids alarming notification content and ensures the patient sees the full context and AI interpretation alongside the abnormal value.
- Critically abnormal values trigger immediate clinician notification in parallel — the patient sees "Your doctor has been notified about these results" on the detail view.

### 7.5 Interpretation in the AI Clinical Assistant

When the patient asks Mode 1 about their labs ("What does my HbA1c mean?" or "Are my liver tests okay?"), Mode 1:
- References the stored interpretation and extracted values
- Explains in patient-appropriate language what the values mean, how they compare to reference ranges, what the trend looks like, and how they connect to the patient's conditions and medications
- Indicates review status: "Your doctor has reviewed these results" vs "These results haven't been reviewed by your doctor yet"
- For critically abnormal values, escalates immediately rather than explaining casually
- For values the patient doesn't have on file, suggests uploading labs or booking a consult

---

## 8. Lab data as input to other systems

### 8.1 Medication Interaction & Validation Engine

Confirmed lab values are available to the interaction engine for drug–lab conflict checks (Medication Engine Slice §4.3). The engine evaluates:
- Current lab values against active medications
- Trending lab values — the engine flags when a value is approaching a dangerous threshold, not only when it has crossed one
- Staleness — if the most recent lab value is older than a configurable threshold, the engine flags it (Medication Engine Slice §10.3)

When the patient uploads new labs, the interaction engine re-evaluates. If new drug–lab signals are generated, they appear at the clinician's next prescribing or refill decision point. Critical new drug–lab signals trigger immediate clinician notification.

### 8.2 RPM/CCM

Lab values feed into chronic care monitoring. For patients enrolled in RPM/CCM programs:
- Lab results are tracked against program-defined targets (e.g., HbA1c < 7% for diabetes program)
- Deviations from targets generate monitoring alerts
- Adherence to required lab schedules is tracked (e.g., "Quarterly HbA1c due — patient's last HbA1c was 4 months ago")
- Lab trends are visible in the clinician's program dashboard alongside other RPM data (vitals, adherence, symptoms)

### 8.3 Protocol evaluation (Mode 2)

Lab data is consumed by Mode 2 as part of protocol evaluation for structured async care pathways. Example: GLP-1 eligibility requires certain lab values to be within specified ranges. Mode 2 checks the patient's most recent relevant lab data and flags missing or out-of-range values.

### 8.4 Refill eligibility

The refill workflow checks whether required monitoring inputs (including labs) are current within protocol thresholds (Refill Slice §5.1 Step 3). If required labs are stale, the refill is declined with a clear reason and the patient is directed to get updated labs.

---

## 9. Document interpretation (non-lab)

Patients may upload documents other than lab reports: clinical letters, discharge summaries, imaging reports, specialist referral notes, prescription histories from other providers.

### 9.1 How document interpretation differs from lab interpretation

| Dimension | Lab results | Other documents |
|---|---|---|
| Extraction output | Structured numeric values with canonical test names | Unstructured or semi-structured text summaries |
| Normalization | Values mapped to canonical vocabulary (LOINC or internal) | Key findings extracted but not normalized to a controlled vocabulary at launch |
| AI interpretation | Quantitative — values against ranges, trends, correlations | Qualitative — summary, key findings, medication mentions, condition mentions |
| Interaction engine input | Lab values feed drug–lab checks | Medication mentions may update the patient's medication list (with patient confirmation) |
| Trend tracking | Time-series on structured values | Not applicable at launch |
| Clinician review | Required for abnormal values; optional for normal | Recommended for all uploaded documents at launch |

### 9.2 Document interpretation workflow

1. Patient uploads a document (camera or file)
2. OCR extracts text
3. AI identifies the document type (clinical letter, discharge summary, imaging report, prescription, other)
4. AI produces a structured summary: document type, date, source (if identifiable), key findings, medications mentioned, conditions mentioned, recommended actions mentioned
5. The patient sees the summary with the original document accessible
6. If the document mentions medications not in the patient's profile, the AI offers to add them (with patient confirmation): "This document mentions [medication] — would you like to add it to your medication list?"
7. Clinician review is recommended for all uploaded documents at launch

### 9.3 Scope limitations at launch

- Document interpretation at launch is summarization and key-finding extraction, not deep clinical analysis
- Imaging report interpretation is limited to extracting the radiologist's written impression — the platform does not interpret imaging data (DICOM files, X-rays, etc.) at launch
- Prescription documents from other providers can surface medication names for reconciliation but do not automatically create active prescriptions in Telecheck (that requires clinician action)
- Handwritten clinical notes in local languages are best-effort OCR with low confidence flagging

---

## 10. Edge cases

### 10.1 Poor-quality image

If the camera capture or uploaded image is too blurry, dark, or incomplete for reliable OCR:
- The system informs the patient: "We couldn't read your lab report clearly. Try taking another photo with better lighting, or enter your values manually."
- The original image is saved (the patient took the effort to upload — don't discard it) but no extraction is attempted
- Manual entry is offered as a fallback

### 10.2 Unrecognized lab format

If the extraction pipeline cannot parse the report format (unusual layout, unfamiliar lab provider, non-standard formatting):
- Partial extraction is attempted — whatever values can be identified are presented for patient confirmation
- Missing values are flagged: "We could only read some of your results. You can add the missing values manually."
- The unrecognized format is logged for pipeline improvement

### 10.3 Conflicting values

If the same test appears multiple times in the same upload with different values (possible OCR error or multiple specimen collections on the same report):
- Both values are presented to the patient for clarification: "We found two values for [test name]. Which one is correct?"
- The patient selects the correct value or enters the right one manually

### 10.4 Historical labs

Patients may upload old lab reports (months or years old) to build their history. The system:
- Accepts historical uploads with the collection date prominently confirmed by the patient
- Historical values are added to the lab timeline at their correct date position
- Historical values do not trigger interaction engine re-evaluation unless they are the most recent value for a test (replacing a stale or missing data point)
- AI interpretation of historical values is more limited (less clinical context available for older results)

### 10.5 External lab results with different reference ranges

Different labs use different reference ranges for the same test. The system:
- Stores the reference range from the original lab report (as extracted)
- Uses the extracted reference range for abnormal/normal classification on that specific result
- For trend views, flags when results from different labs with different reference ranges are plotted together: "Note: these results are from different laboratories with different reference ranges"
- Does not force a single reference range across all results

### 10.6 Lab results during degraded connectivity

Per the degraded connectivity model (Master PRD §17):
- Previously viewed lab summaries are cached and available offline
- New lab uploads require connectivity (OCR processing is server-side)
- Patients can photograph their lab report offline for queued upload when connectivity returns
- AI interpretation requires connectivity

---

## 11. States and transitions

| State | Description | Next state |
|---|---|---|
| **Uploaded** | Image or file received by the platform | Processing |
| **Processing** | OCR and extraction pipeline running | Extracted / Extraction Failed |
| **Extraction Failed** | Pipeline could not extract values | Manual Entry Offered (patient can enter manually or retake photo) |
| **Extracted** | Values extracted; awaiting patient confirmation | Confirming |
| **Confirming** | Patient reviewing extracted values against original image | Confirmed / Corrected |
| **Confirmed** | Patient accepted extracted values (or corrected and accepted) | Interpreting |
| **Interpreting** | AI interpretation running | Interpreted |
| **Interpreted** | AI interpretation complete | Available (if no clinician review required) / Review Queued |
| **Review Queued** | Clinician review required; in review queue | Reviewed |
| **Reviewed** | Clinician validated, corrected, or escalated | Available |
| **Available** | Results and interpretation visible to patient | — |

Every state transition is timestamped. The patient sees meaningful status at each stage: "Processing your lab report..." → "Please confirm your results" → "Results available — your doctor has been notified" (or "Results available").

---

## 12. Audit

| Event | What is recorded |
|---|---|
| Upload | Patient/delegate ID, upload method (camera/file/manual), file metadata, timestamp |
| Extraction | OCR engine version, extraction confidence per value, normalization mappings applied |
| Patient confirmation | Confirming user (patient or delegate), values confirmed, values corrected (original vs corrected), timestamp |
| AI interpretation | Interpretation engine version, interpretation output (full), confidence, conditions and medications referenced, timestamp |
| Clinician review | Clinician ID, action (validate/correct/escalate/request retest), corrections made (original AI interpretation preserved), timestamp |
| Interaction engine notification | Whether new drug–lab signals were generated from the updated lab data |
| Patient view | Timestamp of first patient view of results (for engagement tracking) |

---

## 13. Metrics

**Upload and extraction**
- Lab upload volume per day/week
- Upload pathway distribution (camera vs file vs manual)
- Extraction success rate (extraction completed vs extraction failed)
- Extraction confidence distribution (% of values at high/medium/low confidence)
- Patient correction rate (% of extracted values the patient corrects — quality signal for the OCR pipeline)
- Time from upload to confirmed values

**Interpretation**
- AI interpretation completion rate
- Clinician review rate (% of interpretations requiring or receiving clinician review)
- Clinician validation rate (% of interpretations the clinician validates without correction)
- Clinician correction rate (% of interpretations the clinician corrects — AI quality signal)
- Time from confirmation to interpretation available
- Time from interpretation to clinician review (when review required)

**Patient engagement**
- Lab upload frequency per patient (especially for chronic care programs with monitoring requirements)
- Lab trend view usage
- AI Clinical Assistant questions about lab results
- Patients with overdue required labs (monitoring adherence)

**Clinical impact**
- New drug–lab interaction signals generated from lab uploads
- Clinical actions triggered by lab results (prescription changes, dose adjustments, referrals)
- Abnormal value detection rate (true abnormals identified vs missed)

---

## 14. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Medication Interaction & Validation Engine Slice.** Lab data feeds drug–lab checks. The engine must be notified when new lab data is confirmed so it can re-evaluate active medications.
- **AI Clinical Assistant Slice.** Mode 1 explains lab results to patients. Mode 2 consumes lab data for protocol evaluation.
- **Refill Slice.** Refill eligibility checks whether required labs are current. Lab staleness data must be accessible to the refill workflow.
- **RPM/CCM.** Lab trends feed chronic care monitoring. Lab schedule adherence is tracked.
- **Herb–Drug Interaction Engine Slice.** Lab abnormalities may correlate with reported herbal medicine use. AI interpretation references herb–drug connections.
- **Forms/Intake Engine.** Lab upload may occur during onboarding or program enrollment intake.
- **OCR/extraction infrastructure.** Server-side processing pipeline for image-to-structured-data conversion. Pipeline quality directly determines extraction accuracy. This is an engineering dependency on the launch critical path.
- **Canonical lab vocabulary.** A mapping of lab test names to canonical identifiers (LOINC or internal). This mapping must cover common tests from Ghana-market laboratories. Vocabulary development is on the launch critical path.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Abnormal value notifications and clinician alerts depend on the notification system.

---

## 15. Open questions (slice-level)

1. **OCR pipeline technology.** Build or buy? If buy, which provider handles mixed printed/handwritten text, variable formats, and local-language headers well for Ghana lab reports?
2. **Canonical lab vocabulary scope.** How many distinct lab tests must the vocabulary cover at launch? Is LOINC the right standard, or is an internal vocabulary more practical for Ghana-market lab report formats?
3. **Reference range source.** When the extraction pipeline cannot extract a reference range from the report, should the system apply a default reference range from a standard source (e.g., WHO guidelines)? If so, which source, and how is the applied range communicated to the patient and clinician?
4. **Lab partner integration timeline.** When do direct LIS integrations enter the roadmap? Are there Ghana-market labs interested in integration partnerships at or shortly after launch?
5. **Imaging report depth.** At launch, imaging report interpretation is limited to extracting the radiologist's impression. At what point should the platform accept DICOM/imaging data and provide AI-assisted imaging interpretation? Is this a Telecheck capability or a partnership?
6. **Document storage and retention.** How long are original uploaded images and files retained? Can the patient delete their uploaded documents (and if so, are the extracted structured values also deleted)? *Note: physical hosting region is resolved per ADR-026 (us-east-1 for all tenants); jurisdictional data-residency obligations (retention durations, deletion rights) are driven by `country_of_residence` per CCR_RUNTIME and remain to be specified per-country in the CountryConfig retention rules.*
7. **Lab result sharing.** Can a patient share their lab results with an external provider (e.g., download a structured report for a doctor outside Telecheck)? What format?
8. **Extraction accuracy targets.** What extraction accuracy rate is acceptable at launch? Is 90% value-level accuracy sufficient, or does clinical safety require higher? How is extraction accuracy measured and monitored?

---

## Document control

- **v1.0** — Initial Labs and Document Interpretation slice PRD. Defines three upload pathways (camera, file, manual), extraction and structuring pipeline, patient confirmation step, AI interpretation with clinician review governance, lab data as input to interaction engine and RPM/CCM, patient-facing timeline and trend views, document interpretation for non-lab uploads, and edge case handling. Derived from Master PRD v1.6 §10 Pillar 2 & 5 and launch-readiness criteria §12.
- **Next review:** after OCR pipeline technology decision (Q1 above); after canonical lab vocabulary scope is defined; after RPM/CCM slice defines lab monitoring requirements for launch programs.
- **Change discipline:** changes to the extraction pipeline requirements, patient confirmation workflow, clinician review governance, or interaction engine data feed require explicit owner sign-off and must be validated against the Medication Interaction Engine Slice PRD.
