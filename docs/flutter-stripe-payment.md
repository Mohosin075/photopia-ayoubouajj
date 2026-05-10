# Mobile payments: Stripe PaymentIntents (Flutter)

Integration guide for client applications using the [flutter_stripe](https://pub.dev/packages/flutter_stripe) SDK against the Photopia HTTP API. Behavior described here matches the payment module implementation (routes, validation, and `createPaymentIntent` / `createEphemeralKey` / setup intent flows).

---

## 1. Scope

| Topic | Covered |
|--------|---------|
| One-time charge with **new card** (client confirms PaymentIntent) | Yes |
| One-time charge with **saved** card (`pm_…` from this API) | Yes |
| Listing / saving / deleting cards | Yes |
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
| `bookingId` | Yes | string | Non-empty booking identifier (stored on the payment record / metadata). |
| `amount` | Yes | number | **Major currency units** (e.g. `49.99` for €49.99). Server sends `Math.round(amount * 100)` to Stripe as the integer amount. |
| `currency` | No | string | If omitted in the request JSON, the service uses **`eur`** for Stripe (`currency` parameter) and **`EUR`** for the stored payment document. If provided, the same value is lowercased for Stripe and uppercased in the database. |
| `productName` | No | string | Not used by `createPaymentIntent` (used by checkout validation only). Safe to omit. |
| `description` | No | string | Same as above for this handler. |

**Validation constraint:** `amount` must satisfy **`amount >= 1`** (Zod `.min(1)`). Amounts below `1` are rejected before the service runs.

**Optional field (service only):** `paymentMethodId` — Stripe PaymentMethod id (`pm_…`). Not declared in the Zod schema; it is still read from `req.body` by the controller/service. When present, behavior changes as in §5.3.

Optional passthrough: `metadata` object merged into Stripe PaymentIntent `metadata` when present on the body.

### 5.2 Server behavior (summary)

1. Loads the user from the database by JWT `userId`; resolves **email** from the user document (not from the request body).
2. Ensures a Stripe **Customer** exists (`stripeCustomerId` on the user); creates and saves one if missing.
3. Builds the PaymentIntent:
   - **Without** `paymentMethodId`: sets `payment_method_types: ['card']`. Client must collect payment details and confirm using the returned `clientSecret`.
   - **With** `paymentMethodId`: sets `payment_method`, `off_session: true`, and `confirm: true` (immediate charge attempt with the saved card).

### 5.3 Success response (`data`)

| Field | Type | Description |
|-------|------|-------------|
| `clientSecret` | string | PaymentIntent client secret for the Stripe SDK. |
| `paymentIntentId` | string | Stripe PaymentIntent id (`pi_…`). |
| `amount` | number | Echo of the request `amount` (major units). |
| `status` | string | Stripe PaymentIntent `status` after creation (e.g. `requires_payment_method`, `requires_confirmation`, `requires_action`, `succeeded`, `processing`). |

### 5.4 Client flow: new card

1. Call `POST /create-payment-intent` **without** `paymentMethodId`.
2. Use `clientSecret` with Payment Sheet (`paymentIntentClientSecret`) or `confirmPayment`, per [flutter_stripe](https://pub.dev/packages/flutter_stripe) patterns.
3. Initial `status` is commonly `requires_payment_method` until the user completes the flow.

### 5.5 Client flow: saved card

1. Call `GET /methods` (roles permitting) and display cards; each item’s `id` is a `pm_…` value.
2. Call `POST /create-payment-intent` with the same `bookingId`, `amount`, `currency`, and **`paymentMethodId`: `pm_…`**.
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

**Implementation note:** This handler resolves `stripeCustomerId` from the **JWT payload** first, then creates a Stripe customer using **`user.email` and `user.name` from the JWT** if no customer id exists. Tokens that omit `email` may cause customer creation to fail; ensuring tokens carry `email` after login, or aligning this handler with the DB-backed user lookup used in `createPaymentIntent`, avoids inconsistency. The response does **not** include `customerId`; for Payment Sheet parameters you need the Stripe Customer id (`cus_…`) from your user/profile domain if exposed.

---

## 9. Related routes (reference)

| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/methods/:id/default` | Set default card (`USER` only). `:id` is `pm_…`. |
| `DELETE` | `/methods/:id` | Detach saved card. |

---

## 10. Operational checklist (Flutter)

- [ ] Use the same **currency** consistently with product pricing; remember omitted currency defaults to **EUR** in the payment service.
- [ ] Respect **`amount >= 1`** validation.
- [ ] Handle **403** using the role matrix (e.g. professional vs saved-card endpoints).
- [ ] For production, point `BASE_URL` at the deployed API and use live Stripe keys only in release builds.
- [ ] After payment, refresh booking or payment state from your backend; rely on webhooks for authoritative settlement where implemented.

---

## 11. Reference implementation

Server logic: `src/app/modules/payment/payment.service.ts` (`createPaymentIntent`, `createEphemeralKey`, `getMyPaymentMethods`, `createSetupIntent`), routes in `payment.route.ts`, request schema in `payment.validation.ts`.
