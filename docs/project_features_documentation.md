# Photopya Backend - System Logic & Business Workflows Blueprint

This document explains the functional business logic, calculation mechanics, and background workflows implemented in the **Photopya Backend**. It is written to clearly demonstrate **how** each feature behaves, how the system protects against pricing fraud, and how automated actions are executed.

---

## 🏢 1. Professional Onboarding & Profile Verification Logic

To become active and bookable on Photopya, a provider must complete a structured **9-section onboarding process**. This ensures all professional profiles meet quality and regulatory standards.

### The 9-Section Rules:
1. **Age Verification**: The provider must input their `dateOfBirth` (DOB).
2. **Primary Domain**: Must choose a primary creative domain from a strict enum: `Photography`, `Videography`, or `Editing & Post-Production`.
3. **Categorization**: Must link their profile to specific Category IDs created by the system.
4. **Service Area (Intervention)**:
   - Must specify their **Main City** and **Department**.
   - Must select a **Travel Radius**: Options include `10km`, `30km`, `50km`, `100km`, or `Whole France`.
   - Must set if they are `availableForTravel` outside their main city.
5. **Professional Details**: Must choose from standard selectors:
   - **Experience**: `<1 year`, `1-3 years`, `3-5 years`, `5-10 years`, `>10 years`.
   - **Projects Completed**: `<10`, `10-50`, `50-100`, `>100`.
   - **Education**: `Self-taught`, `School`, `Professional training`.
6. **In-App & External Bio**: Max 500 characters and an optional external portfolio link.
7. **Legal Notice Check**: Profile update requests are rejected unless the professional explicitly checks and accepts:
   - `acceptedTerms` = `true`
   - `privacyPolicy` = `true`
   - `gdprAuthorization` = `true`
8. **Preferences**: Notification settings for emails, SMS, and newsletters.
9. **Profile Status Activation**: Once all required fields are validated, the profile's visibility is turned on (`isActive: true`).

---

## 🗂️ 2. Hierarchical Category & Navigation Logic

To help clients easily browse and find services, the platform uses a 3-layered navigation hierarchy:

```
Theme (PHOTOGRAPHY) ──> Parent Category (Wedding) ──> Sub-category (Videography / Drone)
```

1. **Theme Layer**: The top layer has 3 static options (`PHOTOGRAPHY`, `VIDEOGRAPHY`, `EDITING & POST-PRODUCTION`).
2. **Category Layer**: Fetched dynamically based on the selected theme (`type: 'category'`).
3. **Sub-category Layer**: When a client selects a category, the system queries sub-categories where `parent` matches the selected category ID (`type: 'subcategory'`).
4. **Filtering and Services**:
   - The final search matches the selected sub-category ID.
   - **Empty State Fallback**: If a category has no sub-categories configured, clicking that category bypasses the sub-category selector and immediately displays all services under that parent category.

---

## 💰 3. Pricing Logic & Anti-Tampering Security

Photopya offers three different pricing models, each calculating subtotals and validation rules differently.

### A. Hourly Pricing Model
- Uses a base hourly rate.
- **Weekend Rate Modifier**: If the booking date falls on a weekend (Saturday or Sunday), the backend automatically checks if a specific `weekendHourlyRate` is set. If not, it applies a default **20% modifier** (`baseRate = standardPrice * 1.2`).
- **Weekday Rate Modifier**: If it is a weekday, the backend checks for a `weekdayHourlyRate`, falling back to the standard base price.
- **Subtotal** = `calculatedHourlyRate * requestedHours`.

### B. Daily Pricing Model
- Designed for day-rate bookings (e.g. all-day studio rentals).
- Uses a flat `dailyRate`.
- Duration automatically defaults to a fixed number of hours (e.g. `8 hours` or a custom `dailyHours` setting).
- **Subtotal** = `dailyRate`.

### C. Package Pricing Model
- Used for predefined bundle packages (e.g., "Silver Wedding Package").
- The client must specify the `packageName` when placing a booking.
- The backend searches the service's predefined package list. If found, it fetches the package's specific `price` and `duration`.
- If the package name is missing or invalid, it falls back to the service's base `price`.
- **Subtotal** = `packagePrice`.

### 🛡️ Price-Tampering Security Validation (Add-ons)
To prevent malicious users from modifying pricing data in transit (e.g. editing HTML or request payloads to get a lower price):
1. When booking, clients submit selected add-ons (`customOptions`) with names and prices.
2. The backend performs a **Strict Add-on Check**: it matches every client-submitted add-on name against the service's registered `addOns` database array.
3. If an add-on is not offered by the service, or the price submitted differs from the price saved on the database by even €0.01, the booking is rejected immediately with a `400 Bad Request` ("Invalid price for add-on").
4. Once verified, the sum of all add-on prices is added to the subtotal.

---

## 🗺️ 4. Location Validation & Travel Fee Calculations

Travel fees are automatically calculated based on the distance between the provider and the booking event.

1. **Address Geocoding Fallback**: If the client provides a text address without coordinates, the backend calls the Google Geocoding API to resolve the address into latitude and longitude coordinates.
2. **Distance Calculation**: The system uses the **Haversine Formula** (Earth radius = 6371 km) to calculate the straight-line distance in kilometers between the service's default coordinates and the event coordinates.
3. **Out-of-Radius Restrictions**:
   - If the distance is less than or equal to the provider's `serviceRadiusKm` (defaults to 25km), the travel fee is `€0`.
   - If the distance is greater, the backend checks `allowOutsideRadius`. If this is `false`, the booking is blocked.
4. **Mileage Fee Modifier**:
   - Extra kilometers are computed as `extraKm = distance - serviceRadiusKm`.
   - Travel fee is calculated as `extraKm * travelFeePerKm`.
   - The travel fee is capped at `maxTravelFee` (configured by the professional, default is €100).
5. **Subtotal Adjustment**: The calculated travel fee is added to the final subtotal.

---

## 📅 5. Availability Calculations & Booking Overlap Checks

When a client queries available time slots or tries to place a booking, the backend routes the date through a hierarchical validation pipeline.

### Step 1: Calendar Validation Pipeline
To evaluate if a specific date and time are available, the backend checks criteria in this order:
1. **Blocked Dates**: If the date falls inside the professional's `blockedDateRanges` (e.g., vacations, holidays), the date is marked **Unavailable**.
2. **Date-Range Availability Periods**: If the provider has seasonal or specific `availabilityPeriods` configured, the backend checks if the date falls inside. If it doesn't, it is marked **Unavailable**.
3. **Custom Date Overrides**: The backend checks for specific day overrides (e.g., opening custom hours for a single day).
4. **Weekly Schedule Fallback**: If no specific date ranges match, the backend falls back to the provider's standard recurring weekly schedule (e.g., Monday-Friday 9:00 - 18:00).

### Step 2: Time-Slot Calculation & Working Hours Check
- The system checks if the booking start and end times fall entirely within the computed working hours for that day. If not, the booking is blocked.

### Step 3: Booking Collision Check (Overlaps)
- The backend queries all active bookings (`pending`, `confirmed`, or `in_progress`) for the provider on that specific date.
- It verifies that the requested `startTime` and `endTime` do not overlap with any existing bookings.
- If an overlap is found, the system blocks the request with a `409 Conflict` error to prevent double-bookings.

---

## 💳 6. Booking Pipeline, Stripe Bypass & Platform Commissions

Once a booking is validated, the payment and confirmation flow is initiated.

```
Booking Requested ──> Calculate Commissions ──> Check Deposit % ──> Check if 0% ──> Bypass Stripe?
                                                                         ├──> Yes ──> Confirm Booking
                                                                         └──> No  ──> Create Stripe Intent
```

### A. Commission Splits
Photopya automatically splits transactions to secure platform operational commissions:
- **Client Total**: The platform adds a **10% client commission** to the subtotal:
  $$\text{Client Total} = \text{Subtotal} \times 1.10$$
- **Provider Earnings**: The platform deducts a **5% provider commission** from the subtotal:
  $$\text{Provider Earnings} = \text{Subtotal} \times 0.95$$

### B. Dynamic Upfront Deposits & Stripe Bypass Logic
The backend supports dynamic upfront deposits based on the service configuration:
- **0% Upfront Deposit (Default)**:
  - If the service has a `depositPercentage` set to `0`, the calculated `depositAmount` is `€0`.
  - The backend **bypasses Stripe PaymentIntent creation** entirely.
  - It saves the booking in MongoDB and returns `payment: null` to the client app.
  - The client is redirected straight to the booking success screen without launching the payment sheet.
- **Custom Deposits (e.g., 20%, 50%)**:
  - The upfront deposit is calculated as:
    $$\text{Deposit Amount} = \text{Client Total} \times \text{Deposit Percentage}$$
  - The remaining amount is set as `balanceAmount`.
  - The system creates a Stripe PaymentIntent for the deposit amount and returns the `clientSecret` and Stripe details.
  - The booking status is kept as `pending` until Stripe confirms the payment webhook.

### C. Booking Status Flow
- **Auto-Accept Pipeline**: If a professional enables auto-accept rules for a service, the booking bypasses manual approval if it matches all rules:
  - Client total budget $\ge$ `minimumBudget`.
  - Event location $\le$ `withinRadiusKm`.
  - Client is a verified user (`verified: true`).
  - If rules match, status is set to `confirmed`. Otherwise, it defaults to `pending`.
- **Status Progression**:
  `pending` $\rightarrow$ `confirmed` $\rightarrow$ `in_progress` $\rightarrow$ `completed` OR `cancelled`.

---

## 🔄 7. Offer Modification & Negotiation Flow

For bookings in a `pending` state, professionals can customize or negotiate the offer:

1. **State Constraint**: The modify action is allowed only if both booking status and payment status are `pending`. If the client has already paid, modification is blocked.
2. **Rate Negotiation**: The professional can update the `baseRate`, rename the `packageName`, or add/remove `customOptions`.
3. **Automated Recalculation**:
   - The backend runs the pricing engine again based on the modified rates.
   - It updates the `subtotal`, travel fees, and add-on costs.
   - It recalculates the 10% client commission, 5% provider commission, deposit amount, and remaining balance.
4. **Client Notification**: The updated booking is saved, and a notification is sent to the client. The client can then pay the updated deposit amount to confirm the booking.

---

## 🏦 8. Wallet Ledger & Connect Transfer Workflows

The platform manages wallet ledger accounts for all providers to track earnings, balances, and payouts.

### A. Wallet Balances
Each provider's wallet tracks three distinct balances:
1. `pendingBalance`: Funds held during active bookings.
2. `balance`: Available earnings that can be withdrawn.
3. `totalEarnings`: Lifetime earnings on the platform.

### B. Booking Completion & Stripe Connect Transfers
When a booking status is updated to `completed`:
1. **Local Ledger Transfer**: The backend runs a database transaction that moves the provider's earnings from `pendingBalance` to `balance`, and increments `totalEarnings`.
2. **Stripe Connect Transfer**:
   - The system checks if the professional has set up a Connected Stripe Account (`stripeAccountId`).
   - If found, the backend automatically initiates a Stripe Transfer to deposit the earnings directly into the professional's bank account.
   - If the Stripe Transfer fails (e.g., restricted account), the local wallet balance is still updated, and the transfer status is marked as `failed` for admin review.

### C. Cancellation & Refund Logic
- If a booking is cancelled, the system automatically runs `cancelPendingEarnings` to deduct the booking's earnings from the provider's `pendingBalance`, preventing payouts for cancelled sessions.

---

## ⚡ 9. Real-Time Status & Notification Sync

Real-time interactions are powered by Socket.IO to keep clients and professionals synced instantly.

1. **Online Presence Tracking**:
   - When a user connects to the socket and joins their notification room (`join-notification`), the backend updates their record to `isOnline: true` in the database.
   - When the user disconnects, the socket handler updates their status to `isOnline: false` and saves the current timestamp as `lastActive`.
2. **Instant Messaging & Rooms**:
   - Chat messaging is scoped to dedicated rooms (`getMessage::${chatId}`).
   - To keep conversation lists updated (last message snippet, unread counts), the server triggers `updateChatList::${userId}` to both users, prompting the apps to refresh their lists.
3. **In-App & Push Notifications**:
   - When a booking status updates or a payment succeeds, the system creates a notification object.
   - It emits a real-time socket notification (`notification`) for active in-app banners.
   - It triggers a background FCM payload to deliver a mobile push notification if the user is offline.

---

## 🏆 10. Automated Badges & Performance Metrics

To promote top-quality providers and services, the backend calculates and updates status badges in real-time.

### A. Super Pro Badge
The `isSuperPro` badge is calculated dynamically for professionals when reviews are submitted or bookings are completed.
- **Criteria**:
  - **Average Rating**: $\ge 4.5$
  - **Response Rate**: $\ge 90\%$ (messages answered)
  - **Response Time**: $\le 120\text{ minutes}$ (2 hours)
  - **Projects Completed**: $\ge 10$
  - **Satisfaction Rate**: $\ge 98\%$
- **Execution**: The backend updates this flag on the professional's profile, letting the frontend display the badge automatically.

### B. Original Projects Badge
This badge highlights high-performing individual services.
- **Criteria**:
  - **Average Rating**: $\ge 4.0$
  - **Review Count**: $\ge 5$ reviews
- **Execution**: Automatically flags `isOriginal: true` on the service model when reviews meet these thresholds.
