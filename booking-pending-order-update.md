# Modify Offer API Integration Guide (Professional)

This document provides technical details for integrating the **"Modify Offer"** feature in the Flutter app. This feature allows a Professional to customize the price, package, or add specific features for a client while a booking is still in the `pending` state.

---

## 1. Endpoint Details

- **Endpoint**: `/api/v1/bookings/:id/modify-offer`
- **Method**: `PATCH`
- **Authentication**: Required (Professional JWT Token)
- **Role**: `PROFESSIONAL`

---

## 2. Request Body (JSON)

The professional can send any of the following fields. All fields are optional (Partial Update).

```json
{
  "baseRate": 120.00,
  "packageName": "Custom Wedding Package",
  "customOptions": [
    {
      "name": "Extra 2 Hours",
      "price": 80.00
    },
    {
      "name": "Drone Photography",
      "price": 150.00
    }
  ]
}
```

### Fields Description:
| Field | Type | Description |
| :--- | :--- | :--- |
| `baseRate` | `Number` | The new price/rate. **Can be higher or lower** than the original. |
| `packageName` | `String` | Use this if the professional renames the offer or changes the formula. |
| `customOptions` | `Array` | A list of specific additions with their own prices. |

---

## 3. Implementation Workflow

### Step A: Identify Client's Initial Request
Before modifying, the Professional needs to see what the client initially selected. Fetch this from the `GET /bookings/:id` endpoint:
- `packageName`: The initial package chosen.
- `pricingDetails.baseRate`: The original price.
- `specialRequests`: Any specific notes/instructions left by the client.

### Step B: UI/UX for Modification
1.  In the Professional's **Pending Orders** screen, show a "Modify Offer" or "Edit Pricing" button.
2.  **Constraint**: This button should only be enabled if:
    - `booking.status == "pending"`
    - `booking.paymentStatus == "pending"`
3.  Open a form where the Pro can change the price, rename the package, or add/remove "Custom Options".

### Step C: API Call & Recalculation
When the Pro clicks "Save/Update", send the `PATCH` request. 
- **The Backend will automatically recalculate**:
    - `subtotal` (including custom options)
    - `platformCommission` (10% client / 5% provider)
    - `clientTotal` (Total amount client must pay)
    - `depositAmount` (50% of clientTotal)
    - `balanceAmount` (Remaining 50%)

---

## 4. Success Response (200 OK)

The API returns the full updated booking object.

```json
{
  "success": true,
  "message": "Offer modified successfully",
  "data": {
    "_id": "64...",
    "bookingNumber": "BK-12345",
    "packageName": "Custom Wedding Package",
    "pricingDetails": {
      "baseRate": 120,
      "subtotal": 350,
      "clientTotal": 385,
      "providerEarnings": 332.5,
      "currency": "EUR"
    },
    "depositAmount": 192.5,
    "balanceAmount": 192.5,
    "status": "pending"
  }
}
```

---

## 5. Important Notes

- **Pricing Flexibility**: Professionals have full control to **increase or decrease** the price. Setting a lower `baseRate` acts as a discount.
- **Client Notification**: After a successful modification, the app should ideally notify the client (via Push or Chat) that their offer has been updated. The client will then pay the **new deposit amount**.
- **Payment Status**: If the client has already initiated payment or paid the deposit, this API will return an error (400 Bad Request).