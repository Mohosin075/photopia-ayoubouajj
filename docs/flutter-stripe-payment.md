# Mobile payments: Stripe PaymentIntents (Flutter)

Integration guide for client applications using the [flutter_stripe](https://pub.dev/packages/flutter_stripe) SDK against the Photopia HTTP API. Behavior described here matches the payment module implementation (routes, validation, and `createPaymentIntent` / `createEphemeralKey` / setup intent flows).

**Booking + deposit + balance + saved cards (end-to-end):** use **[`flutter-booking-payment.md`](./flutter-booking-payment.md)** as the main Flutter product guide. This document focuses on **payment module** endpoints and behaviour details.

---

## 1. Scope

| Topic | Covered |
|--------|---------|
| One-time charge with **new card** (client confirms PaymentIntent) | Yes |
| One-time charge with **saved** card (`pm_…` from this API) | Yes |
| Listing / saving / deleting cards | Yes |
| **Booking-integrated** deposit/balance (recommended path) | See [`flutter-booking-payment.md`](./flutter-booking-payment.md) |
| Stripe Checkout (`/create-checkout-session`) | No |

---

## 2. Base URL and authentication

| Item | Value |
|------|--------|
| Path prefix | `{BASE_URL}/api/v1/payment` |
| Scheme | HTTPS in production |
| Auth | `Authorization: Bearer <access_token>` on every call below |

**Publishable key:** configure `Stripe.publishableKey` in the app with your Stripe **publishable** key. Never embed secret keys in mobile clients.

---

## 3. Response envelope

Success responses follow the shared API shape. Client logic should read the payload from **`data`**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "meta": null,
  "data": {}
}
```

`POST /create-payment-intent` returns HTTP **201** with the same envelope.

Errors are returned by the global error handler (non-success `success`, `message`, and status code). Treat **4xx/5xx** as failed operations and surface messages appropriately.

---

## 4. Authorization matrix (roles)

Endpoints enforce `auth(...)` as below. The JWT must carry an allowed role in **`activeRole`** or **`role`** (middleware accepts either). Values are the API’s role strings (enum `USER_ROLES`).

| Endpoint | Method | Allowed `activeRole` / `role` values |
|----------|--------|--------------------------------------|
| `/methods` | `GET` | `user`, `admin`, `super_admin` |
| `/create-setup-intent` | `POST` | `user`, `admin`, `super_admin` |
| `/methods/:id/default` | `PATCH` | `user` only |
| `/methods/:id` | `DELETE` | `user`, `admin`, `super_admin` |
| `/create-payment-intent` | `POST` | `professional`, `user`, `admin`, `super_admin` |
| `/ephemeral-key` | `POST` | `professional`, `user`, `super_admin` |

**Note:** A **`professional`** account can call `create-payment-intent` and `ephemeral-key` but **not** `GET /methods` or `POST /create-setup-intent` under the current routes. Extend `payment.route.ts` if professionals must list or save cards through these endpoints.

---

## 5. `POST /create-payment-intent`

Creates a Stripe **PaymentIntent**, persists a **`Payment`** row in MongoDB, and returns secrets and status for the client.

### 5.1 Request body

Validated fields (Zod `PaymentValidations.create`):

| Field | Required | Type | Rules |
|-------|----------|------|--------|
| `bookingId` | Yes | string | MongoDB ObjectId string of the booking. |
| `amount` | **No** | number | **Optional.** If omitted, the server computes the charge from the booking (see §5.2). If provided, it must **exactly match** the server-computed payable amount (same decimals) or the API returns **400**. When provided, Zod requires **`amount >= 1`**. |
| `currency` | No | string | If omitted in the request JSON, the service uses **`eur`** for Stripe (`currency` parameter) and **`EUR`** for the stored payment document. If provided, the same value is lowercased for Stripe and uppercased in the database. |
| `productName` | No | string | Not used by `createPaymentIntent` (checkout validation only). |
| `description` | No | string | Not used by `createPaymentIntent`. |
| `paymentMethodId` | No | string | Stripe PaymentMethod id (`pm_…`). When present, server sets `off_session: true` and `confirm: true`. |

Optional passthrough: `metadata` merged into Stripe PaymentIntent `metadata` (e.g. `paymentType: 'deposit' | 'balance'` when calling manually).

**Authorization:** only the user who owns the booking (`booking.clientId` === JWT `userId`) may call this endpoint; otherwise **403**.

### 5.2 Server behaviour (amount + booking state)

1. Loads the **booking** by `bookingId`. Ensures the authenticated user is the **client** on that booking.
2. **Payable amount** (major currency units, server-side source of truth):
   - If `booking.paymentStatus === 'pending'` → uses **`booking.depositAmount`**
   - Else if `booking.paymentStatus === 'deposit_paid'` and **`booking.balanceAmount > 0`** → uses **`booking.balanceAmount`**
   - Else → **400** (e.g. already `fully_paid`, or no balance left)
3. If `amount` is present in the body, it must equal that payable amount (to avoid stale client values).
4. Loads **User** from DB by JWT `userId`; ensures Stripe **Customer** exists (`stripeCustomerId`); creates and saves if missing.
5. Builds the PaymentIntent:
   - **Without** `paymentMethodId`: `payment_method_types: ['card']`; client confirms with `clientSecret`.
   - **With** `paymentMethodId`: `payment_method`, `off_session: true`, `confirm: true` (saved card; may need 3DS — see §5.5).

### 5.3 Success response (`data`)

| Field | Type | Description |
|-------|------|-------------|
| `clientSecret` | string | PaymentIntent client secret for the Stripe SDK. |
| `paymentIntentId` | string | Stripe PaymentIntent id (`pi_…`). |
| `amount` | number | **Server-computed** payable amount in major units (deposit or balance). |
| `status` | string | Stripe PaymentIntent `status` after creation (e.g. `requires_payment_method`, `requires_confirmation`, `requires_action`, `succeeded`, `processing`). |

### 5.4 Client flow: new card

1. Call `POST /create-payment-intent` with **`bookingId` only** (and optional `currency`). Omit `amount` unless you are mirroring the server value for debugging.
2. Use `clientSecret` with Payment Sheet (`paymentIntentClientSecret`) or `confirmPayment`, per [flutter_stripe](https://pub.dev/packages/flutter_stripe) patterns.
3. Initial `status` is commonly `requires_payment_method` until the user completes the flow.

### 5.5 Client flow: saved card

1. Call `GET /methods` (roles permitting) and display cards; each item’s `id` is a `pm_…` value.
2. Call `POST /create-payment-intent` with `bookingId` and **`paymentMethodId`: `pm_…`** (optional `currency`; `amount` optional — server derives it).
3. Interpret `status`:
   - **`succeeded`** — payment completed; no further SDK step for confirmation.
   - **`requires_action`** — SCA / 3DS may be required; use the same `clientSecret` with the SDK’s flow to handle the next action (see current `flutter_stripe` docs for `handleNextAction` / `confirmPayment` / Payment Sheet).
   - **`requires_payment_method`** (or other non-success terminal states) — treat as failure or retry with another method; check Stripe dashboard or logs for decline reasons.

Saved cards must belong to the Stripe Customer linked to the authenticated user; the API lists only that customer’s methods.

### 5.6 Persistence

Each successful `POST /create-payment-intent` creates a **`Payment`** document: `status` is **`succeeded`** if the Stripe PaymentIntent is already `succeeded`, otherwise **`pending`**. Reconcile final state via webhooks or your existing payments APIs as applicable.

---

## 6. `GET /methods` — list saved payment methods

Returns an array in `data`. Each element:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stripe PaymentMethod id — use as `paymentMethodId` when calling `POST /create-payment-intent`. |
| `brand` | string (optional) | Card brand. |
| `last4` | string (optional) | Last four digits. |
| `expMonth` | number (optional) | Expiry month. |
| `expYear` | number (optional) | Expiry year. |
| `isDefault` | boolean | `true` if this method is the Stripe customer default. |

If the user has no `stripeCustomerId` yet, the service returns an **empty array**.

---

## 7. `POST /create-setup-intent` — save a card without charging

**Response `data`:**

```json
{
  "clientSecret": "<setup_intent_client_secret>"
}
```

Use the Setup Intent client secret in the Flutter SDK to collect and confirm the card. The backend associates the Stripe Customer with the logged-in user so saved methods appear on `GET /methods` after confirmation.

---

## 8. `POST /ephemeral-key`

**Request body (optional):**

```json
{
  "apiVersion": "2025-05-28.basil"
}
```

If `apiVersion` is omitted, the server uses **`2025-05-28.basil`** when creating the ephemeral key.

**Response `data`:**

```json
{
  "ephemeralKey": "<ephemeral_key_secret>"
}
```

**Implementation note:** The handler loads the user from the **database** by JWT `userId`, reads **`stripeCustomerId`** from that document, and creates a Stripe Customer from **`userData.email`** / **`fullName` or `name`** if missing — **aligned with `createPaymentIntent`**. The response does **not** include `customerId`; after `createBooking` with `paymentMode: intent`, `data.payment.customerId` may be returned when the user already had a Stripe customer; otherwise create the customer via payment intent or ephemeral-key flow first.

---

## 9. Related routes (reference)

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/methods/:id/default` | Set default card (`USER` only). `:id` is `pm_…`. |
| `DELETE` | `/methods/:id` | Detach saved card. |

---

## 10. Operational checklist (Flutter)

- [ ] Prefer **[`flutter-booking-payment.md`](./flutter-booking-payment.md)** for deposit/balance UX; use this doc for payment endpoint details.
- [ ] Use **currency** consistently with product pricing; omitted `currency` on PaymentIntent defaults to **eur** in the payment service.
- [ ] If you send **`amount`** on `create-payment-intent`, it must match the server-computed deposit/balance; otherwise omit it.
- [ ] Handle **403** (not booking owner) and **403** from the role matrix (e.g. professional vs saved-card endpoints).
- [ ] For production, use HTTPS, live keys only in release builds, and configure **`/webhook`** in Stripe.
- [ ] After payment, **refresh booking** (`GET /booking/:id`); webhooks drive authoritative `paymentStatus` updates.

---

## 11. Reference implementation

Server logic: `src/app/modules/payment/payment.service.ts` (`createPaymentIntent`, `createEphemeralKey`, `getMyPaymentMethods`, `createSetupIntent`), routes in `payment.route.ts`, request schema in `payment.validation.ts`. Booking integration: `src/app/modules/booking/booking.service.ts`.
