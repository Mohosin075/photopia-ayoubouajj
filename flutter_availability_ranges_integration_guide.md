# Flutter Integration Guide: Date-Range Availability & Blocked Ranges

This guide describes how to update the Flutter app to integrate with the new date-range availability slots and blocked ranges features on the backend.

---

## 1. Overview of the New Fields

The `Availability` configuration now accepts arrays of date ranges, so you no longer need to expand ranges (like Jan 15-20) into individual days on the mobile client. You can send the range directly.

1. **`availabilityPeriods`**: Used to define specific ranges of dates when a service is active (useful for manual slot management).
2. **`blockedDateRanges`**: Used to block booking across a range of dates (e.g., holidays, vacations) for either a specific service or globally.

---

## 2. API Endpoints & Request Payloads

### A. Saving Availability (Create or Update)
To save these settings from the Professional app, send a `POST` request.

* **Endpoint:** `POST /api/v1/availability/create-availability` (or your configured create route)
* **Headers:** `Authorization: Bearer <TOKEN>`
* **Request Payload (Example):**

```json
{
  "serviceId": "651a2b3c4d5e6f7a8b9c0d1e", // Optional: Pass to make these slots specific to this service
  "availabilityPeriods": [
    {
      "startDate": "2025-01-15T00:00:00.000Z",
      "endDate": "2025-01-20T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "18:00",
      "priceOverride": 150.00
    },
    {
      "startDate": "2025-02-01T00:00:00.000Z",
      "endDate": "2025-02-15T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "17:00"
    }
  ],
  "blockedDateRanges": [
    {
      "startDate": "2024-12-24T00:00:00.000Z",
      "endDate": "2024-12-26T00:00:00.000Z",
      "note": "Christmas Holiday"
    },
    {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-01T00:00:00.000Z",
      "note": "New Year"
    }
  ],
  "bufferMinutes": 30
}
```

*Note: Dates must be valid ISO 8601 strings.*

---

### B. Fetching Availability Settings
To retrieve a provider's settings to display on the professional settings screen:

* **Retrieve Global Availability:**
  ```http
  GET /api/v1/availability/my-availability
  ```
* **Retrieve Service-Specific Availability:**
  ```http
  GET /api/v1/availability/my-availability?serviceId=YOUR_SERVICE_ID
  ```

* **Response Format (Example snippet):**
```json
{
  "success": true,
  "data": {
    "_id": "675dba054a75d8de7ffc6e09",
    "providerId": "675dba054a75d8de7ffc6e03",
    "serviceId": "675dba054a75d8de7ffc6e05",
    "availabilityPeriods": [
      {
        "startDate": "2025-01-15T00:00:00.000Z",
        "endDate": "2025-01-20T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "18:00",
        "priceOverride": 150
      }
    ],
    "blockedDateRanges": [
      {
        "startDate": "2024-12-24T00:00:00.000Z",
        "endDate": "2024-12-26T00:00:00.000Z",
        "note": "Christmas Holiday"
      }
    ],
    "bufferMinutes": 30
  }
}
```

---

### C. Client Fetching Slots
When a client selects a date on the calendar, call the time slots endpoint. The backend automatically calculates overrides, blocked ranges, and active availability periods.

* **Endpoint:**
  ```http
  GET /api/v1/availability/slots/PROVIDER_ID?date=2025-01-16&duration=60&serviceId=SERVICE_ID
  ```
* **Response (Example):**
  ```json
  {
    "success": true,
    "message": "Available time slots retrieved successfully",
    "data": {
      "slots": ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"]
    }
  }
  ```

---

## 3. Backend Priority Logic (For Reference)

When validating a booking or fetching slots for a specific date, the backend checks the configuration in this exact priority:

1. **Blocked Date Ranges:** If the date is inside any `blockedDateRanges` (e.g. Dec 24-26), it returns `isAvailable: false`.
2. **Custom Date Override:** If the date matches a specific `customDates` single-day override, it applies that override.
3. **Availability Periods:** If there are any `availabilityPeriods` configured:
   - It checks if the date falls inside any range (inclusive).
   - If yes, it uses the specific hours (e.g. 10:00-17:00) and pricing overrides.
   - If no, it blocks the booking (outside valid ranges).
4. **Fallback:** If no `availabilityPeriods` are configured, it falls back to the default weekly schedule (`defaultSchedule`) and recurring weekly rules.
