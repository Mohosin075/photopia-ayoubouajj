# Flutter: Booking + Stripe payment + saved cards

This guide is the **primary** mobile integration document for **booking checkout** (deposit + balance) and **saved payment methods**. It matches the current backend in `booking.service.ts`, `payment.service.ts`, and `payment.route.ts`.

For PaymentIntent-only details and the role matrix, see also [`flutter-stripe-payment.md`](./flutter-stripe-payment.md).


## 2. Booking lifecycle (payment fields for the UI)

After `GET /api/v1/booking/:id` or list endpoints:

| Field | Meaning |
|-------|---------|
| `paymentStatus` | `pending` → deposit not settled · `deposit_paid` → deposit OK, balance may remain · `fully_paid` → all client charges done · `refunded` / `cancelled` as applicable |
| `depositAmount` | First charge (~50% of client total under current business rules) |
| `balanceAmount` | Remaining amount after deposit |
| `pricingDetails.clientTotal` | Full client price (before split) |
| `pricingDetails.currency` | Currency code for display (align UI with Stripe/service logic) |
| `status` | Booking workflow: `pending`, `confirmed`, `in_progress`, etc. — **not the same as `paymentStatus`** |

**Show “Pay remaining” when:** `paymentStatus === 'deposit_paid' && balanceAmount > 0`.

---

## 3. Recommended flows

### 3.1 Save a card (no charge)

1. `POST /api/v1/payment/create-setup-intent` → `data.clientSecret`
2. Use **Setup Intent** / Payment Sheet with that secret ([flutter_stripe](https://pub.dev/packages/flutter_stripe)).
3. `GET /api/v1/payment/methods` → each item’s `id` is `pm_...` (use as `paymentMethodId`).

**Roles:** `user`, `admin`, `super_admin` for setup + list methods (see `payment.route.ts`). Professionals cannot use these routes unless you extend them.

### 3.2 Create booking + pay deposit (Flutter PaymentIntent — default)

**`POST /api/v1/booking`**

Include the normal booking body (provider, service, date, times, location, client name, etc.) plus:

```json
{
  "paymentMode": "intent",
  "paymentMethodId": "pm_xxx_optional"
}
```

- Omit `paymentMethodId` → user pays with a **new card** via Payment Sheet using the returned `clientSecret`.
- Send `paymentMethodId` → server attempts **off-session confirm** on the saved card (response may be `succeeded` or `requires_action` for 3DS).

**Typical response `data`:**

```json
{
  "booking": { "_id": "...", "paymentStatus": "pending", "depositAmount": 50, "balanceAmount": 50 },
  "payment": {
    "paymentMode": "intent",
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_...",
    "ephemeralKey": "ek_...",
    "customerId": "cus_...",
    "amount": 50,
    "currency": "EUR",
    "status": "requires_payment_method"
  }
}
```

**Client steps (new card):**

1. If `customerId` and `ephemeralKey` are present, pass them to Payment Sheet initialisation with `paymentIntentClientSecret` = `clientSecret`.
2. Present Payment Sheet and complete payment.
3. Poll or refresh **`GET /api/v1/booking/:id`** until `paymentStatus` becomes `deposit_paid` (webhook may add a short delay).

**Client steps (saved card):**

- If `payment.status === 'succeeded'`, treat deposit as done; still refresh the booking to confirm `paymentStatus`.
- If `requires_action`, use the same `clientSecret` with the SDK for the next action (SCA).

You **do not** need a separate `create-payment-intent` call for the first deposit if this response already contains `clientSecret`.

### 3.3 Retry or manual PaymentIntent

**`POST /api/v1/payment/create-payment-intent`**

```json
{
  "bookingId": "<mongo_booking_id>",
  "paymentMethodId": "pm_xxx_optional",
  "currency": "eur"
}
```

- **`amount` is optional.** If omitted, the server derives the charge from the booking:
  - `paymentStatus === 'pending'` → **`depositAmount`**
  - `paymentStatus === 'deposit_paid'` and `balanceAmount > 0` → **`balanceAmount`**
- If you send `amount`, it **must exactly match** the server-computed value or you get **400**.
- Only the **booking owner** (`clientId` matches JWT user) may call this — otherwise **403**.

Use for retries, crashes, or when the first `clientSecret` was not stored.

### 3.4 Pay remaining balance

**`POST /api/v1/booking/:id/pay-balance`**

Optional body:

```json
{ "paymentMethodId": "pm_xxx" }
```

Same Payment Sheet / saved-card rules as deposit. Server enforces: caller is client, `paymentStatus === 'deposit_paid'`, `balanceAmount > 0`.

---

## 4. Webhooks and fresh state

Final `paymentStatus` / `fully_paid` updates are driven by Stripe webhooks on the server (`payment_intent.succeeded`, `checkout.session.completed`, etc.).

**App rule:** after the user finishes the Stripe UI, call **`GET /api/v1/booking/:id`** (or reload the list) so the UI matches the server.

---

## 5. Production checklist

- [ ] **Webhook** in Stripe Dashboard → `{BASE_URL}/webhook` with correct signing secret (`config.stripe.webhookSecret`).
- [ ] **Currency:** if `currency` is omitted on some calls, the payment service defaults Stripe to **`eur`** — align with your Stripe account and catalog.
- [ ] **3DS:** saved-card flows may return `requires_action` — handle it; do not assume `succeeded` only.
- [ ] **Roles:** professionals may call `create-payment-intent` / `pay-balance` per routes but **cannot** list/save cards without extending routes.
- [ ] **Idempotency:** multiple `create-payment-intent` calls create multiple `Payment` rows; prefer reusing a valid `clientSecret` when still valid, or define retry rules in product.
- [ ] **Checkout mode:** `paymentMode: "checkout"` returns a **session URL** for web-style redirect — not the primary Flutter Payment Sheet path.

---

## 6. Quick reference

| Goal | Endpoint |
|------|----------|
| Create booking + start deposit | `POST /api/v1/booking` (`paymentMode: "intent"`) |
| Save card | `POST /api/v1/payment/create-setup-intent` |
| List cards | `GET /api/v1/payment/methods` |
| Extra / retry PI | `POST /api/v1/payment/create-payment-intent` |
| Ephemeral key (Payment Sheet) | `POST /api/v1/payment/ephemeral-key` |
| Pay balance | `POST /api/v1/booking/:id/pay-balance` |
| Refresh state | `GET /api/v1/booking/:id` |

---

