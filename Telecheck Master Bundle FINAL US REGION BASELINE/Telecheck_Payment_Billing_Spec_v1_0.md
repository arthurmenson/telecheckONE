# Telecheck — Payment & Billing Specification

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Engineering Lead + Finance Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §18
**Companion documents:** Refill Slice PRD v1.0, Pharmacy Portal Slice PRD v1.0, RPM/CCM Slice PRD v1.0, Contracts Pack v5 (CCR-RUNTIME, TYPES)

---

## 1. Purpose

This specification defines the payment infrastructure for Telecheck's Ghana launch: which payment providers, what integration model, the payment flow for each transaction type, refund handling, and the subscription billing architecture for RPM/CCM.

Payment is critical-path (Master PRD §11.4). If payment doesn't work, neither refills nor consultations can complete.

---

## 2. Payment rails — Ghana launch

### 2.1 Supported rails

| Rail | Provider | Coverage | Use case |
|---|---|---|---|
| Mobile money — MTN MoMo | Via Paystack | ~60% of mobile money market in Ghana | Default payment method |
| Mobile money — Vodafone Cash | Via Paystack | ~15% market share | Secondary mobile money |
| Mobile money — AirtelTigo Money | Via Paystack | ~10% market share | Tertiary mobile money |
| Card (Visa/Mastercard) | Via Paystack | Urban/diaspora patients | Alternative for patients with bank cards |

### 2.2 Integration model

Telecheck integrates with **Paystack** as the payment aggregator for Ghana. Paystack provides unified access to all three mobile money providers and card networks. This is a single integration point — Telecheck does not integrate directly with MTN, Vodafone, or AirtelTigo.

Paystack webhook callbacks notify Telecheck of payment status changes. All callbacks are verified using Paystack's signature verification before processing.

### 2.3 Currency

All Ghana transactions are in **Ghana Cedis (GHS)**. Prices are stored in pesewas (1 GHS = 100 pesewas) to avoid floating-point arithmetic. Display format: "GH₵ XX.XX" per CCR-RUNTIME presentation configuration.

---

## 3. Payment flows by transaction type

### 3.1 Consultation payment

**Flow:** Pay-before-start.

1. Patient books consultation → payment amount displayed (consult fee from PricingBundle)
2. Patient selects payment method (mobile money or card)
3. Payment initiated → mobile money: USSD prompt sent to patient's phone; card: card form displayed
4. Patient authorizes on their device
5. Payment confirmed → consultation becomes bookable/startable
6. If payment fails → consultation not booked; patient sees failure reason and can retry

**Timeout:** Mobile money authorization must complete within 5 minutes. After timeout, the payment attempt is cancelled and the patient can retry.

### 3.2 Refill / medication payment

**Flow:** Pay-at-approval (after clinician or protocol approves, before pharmacy fulfillment begins).

1. Refill approved → payment amount calculated (medication cost from formulary pricing)
2. Patient notified: "Your refill has been approved. Pay GH₵ XX.XX to proceed."
3. Patient taps to pay → same payment flow as consultation
4. Payment confirmed → order enters pharmacy queue
5. If payment fails → order held; patient notified with failure reason and retry option
6. For time-sensitive medications, payment failure flags the order as urgent to operations

**No consult fee on refills** (Master PRD §18). Refills are medication-cost only.

### 3.3 RPM/CCM subscription payment

**Flow:** Monthly recurring charge.

1. Patient enrolls in RPM/CCM program → subscription amount displayed (monthly fee from PricingBundle)
2. Patient authorizes first payment (same flow as above)
3. Subsequent monthly charges are initiated automatically via Paystack's recurring payment API
4. 3 days before each charge: patient notified "Your monthly care subscription of GH₵ XX.XX will be charged on [date]"
5. If monthly charge fails: grace period of 3 days with daily retry
6. If still failing after grace period: patient notified, subscription paused (clinical obligations per Market Launch pause rules continue — no abrupt discontinuation of care)

### 3.4 Delivery fee

**Flow:** Bundled with medication payment.

Delivery fee (if applicable) is added to the medication payment. The patient sees one total: medication cost + delivery fee. Free delivery thresholds or flat-rate delivery are configured per PricingBundle.

---

## 4. Payment states

| State | Description | Next state |
|---|---|---|
| `pending` | Payment initiated, awaiting patient authorization | `authorized`, `failed`, `timeout` |
| `authorized` | Patient authorized on their device | `captured`, `cancelled` |
| `captured` | Funds collected | `settled`, `refunded`, `partially_refunded` |
| `settled` | Funds available in Telecheck's account | `refunded`, `partially_refunded` |
| `failed` | Payment failed (insufficient funds, declined, network error) | `pending` (retry) |
| `timeout` | Authorization window expired | `pending` (retry) |
| `cancelled` | Payment cancelled by patient or system | — (terminal) |
| `refunded` | Full refund issued | — (terminal) |
| `partially_refunded` | Partial refund issued | `refunded` |

---

## 5. Refund handling

### 5.1 Refund triggers

| Trigger | Refund type | Timeline |
|---|---|---|
| Consultation cancelled by clinician | Full refund of consult fee | Automatic, within 24 hours |
| Consultation cancelled by patient (>2 hours before) | Full refund | Automatic, within 24 hours |
| Consultation cancelled by patient (<2 hours before) | No refund (configurable per market) | — |
| Medication order cancelled before fulfillment | Full refund of medication + delivery | Automatic, within 24 hours |
| Medication order cancelled after fulfillment but before dispatch | Full refund minus restocking fee (if configured) | Manual review, within 48 hours |
| Delivery failure — medication returned to pharmacy | Full refund of delivery fee; medication available for pickup | Automatic delivery fee refund |
| Medication quality complaint | Manual review by operations | Within 72 hours of complaint |

### 5.2 Refund method

Refunds return to the original payment method. Mobile money refunds are instant. Card refunds take 5–10 business days per card network rules. The patient is notified when the refund is initiated and when it completes.

---

## 6. Payment failure handling

### 6.1 Failure types and responses

| Failure type | Patient-facing message | System behavior |
|---|---|---|
| Insufficient funds | "Payment could not be completed — insufficient funds. Please top up and try again." | Hold order; allow retry |
| Network timeout | "Payment is taking longer than expected. We'll notify you when it completes." | Retry once after 60 seconds; if still failing, cancel and allow manual retry |
| Provider unavailable | "Your payment provider is temporarily unavailable. Please try again shortly or use a different payment method." | Surface alternative payment rails |
| Card declined | "Your card was declined. Please check your card details or try a different payment method." | Allow retry with same or different method |
| Duplicate payment detected | "This payment has already been processed." | Idempotency key prevents duplicate charge |

### 6.2 Abandoned payment recovery

If a patient initiates a payment but does not complete authorization within 30 minutes:
1. Order is held (not cancelled)
2. Patient receives a notification: "You have a pending payment for your [medication/consultation]. Complete payment to proceed."
3. After 24 hours of no action: order is cancelled, patient notified
4. For refill orders: the refill approval remains valid — the patient can re-initiate payment without re-approval (within the approval validity window)

---

## 7. Financial reporting and reconciliation

### 7.1 Daily reconciliation

At end of each business day:
1. Paystack settlement report is compared against Telecheck's payment records
2. Discrepancies are flagged for manual review
3. Unmatched Paystack callbacks are investigated (potential webhook delivery failure)
4. Unmatched Telecheck records are investigated (potential callback not received)

### 7.2 Revenue reporting

Payment data feeds dashboards showing:
- Daily/weekly/monthly revenue by transaction type (consultation, medication, subscription, delivery)
- Payment method distribution
- Payment failure rate by method and failure type
- Refund rate and reasons
- Average transaction value

---

## 8. Security

- Telecheck never stores card numbers, CVVs, or mobile money PINs. All sensitive payment data is handled by Paystack.
- Paystack webhook callbacks are verified using HMAC signature verification before processing
- Payment records in Telecheck store: payment_id, amount, currency, payment_rail, status, timestamps — no card or mobile money account details
- Payment audit records are Category C (operational) unless linked to a clinical transaction (medication payment), in which case they are logged alongside the clinical audit trail

---

## 9. Multi-market extensibility

For future markets beyond Ghana:
- Payment rails are configured per market in the CCR (operational.payment_rails)
- Currency is per market (operational.currency)
- Payment aggregator may differ per market (e.g., Flutterwave for Nigeria, Stripe for other markets)
- The payment service abstracts the aggregator behind a unified interface — switching aggregators does not require changes to clinical or pharmacy workflows

---

## 10. Dependencies

- **Paystack API** — payment processing for all rails
- **CCR-RUNTIME** — payment rails configuration per market
- **Refill Slice** — payment collection point at Step 6 (post-approval, pre-fulfillment)
- **Pharmacy Portal Slice** — order does not enter fulfillment until payment is captured
- **RPM/CCM Slice** — subscription billing for monthly programs
- **Notification Spec** — payment confirmation, failure, and reminder notifications

---

## Document control

- **v1.0** — Initial Payment & Billing specification. Defines Paystack integration for Ghana (MTN MoMo, Vodafone Cash, AirtelTigo Money, card), payment flows per transaction type, refund handling, subscription billing for RPM/CCM, failure recovery, reconciliation, and multi-market extensibility.
