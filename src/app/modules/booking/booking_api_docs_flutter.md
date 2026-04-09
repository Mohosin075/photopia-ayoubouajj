# Booking Module API Integration Guide

এই ডকুমেন্টটি `Booking` মডিউলের API সমূহ ব্যবহার করার জন্য একটি সম্পূর্ণ গাইডলাইন (Flutter বা যেকোনো প্ল্যাটফর্মের জন্য)। এখানে প্রতিটি এন্ডপয়েন্ট, মেথড এবং রিকোয়েস্ট বডি (ডেটা মডেল) এর স্ট্রাকচার দেওয়া হলো। ডার্ট/ফ্লাটার এর স্পেসিফিক কোড বাদ দিয়ে শুধু API স্পেসিফিকেশন রাখা হয়েছে।

## 🔗 Base Configuration

**Base URL:** `{{BASE_URL}}/api/v1/booking`
**Headers:** 
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <YOUR_JWT_TOKEN>"
}
```
*(প্রায় সব সুরক্ষিত রিকোয়েস্টের জন্যই Authorization হেডার প্রয়োজন।)*

---

## 1. Create Booking (নতুন বুকিং তৈরি করা)
**Endpoint:** `/`
**Method:** `POST`
**Authorized Roles:** User, Professional, Admin, Super Admin

**Request Body (JSON):**
`startTime` এবং `endTime` এর ফরম্যাট `HH:MM` (২৪ ঘণ্টার ফরম্যাট) হতে হবে।

```json
{
  "providerId": "651a...abc1",       // Required: প্রোভাইডার এর ID (String)
  "serviceId": "651a...abc2",        // Required: সার্ভিসের ID (String)
  "bookingDate": "2023-11-20T00:00:00.000Z", // Required: ISO Date String
  "startTime": "10:30",              // Required: HH:MM Format 
  "endTime": "12:30",                // Required: HH:MM Format (Optional for Package/Daily as system calculates)
  "packageName": "Gold",             // Optional: Required if pricingType is PACKAGE
  "eventLocation": {                 // Required: Object
    "address": "123 Main St",        // Required: String
    "city": "Dhaka",                 // Required: String
    "country": "Bangladesh",         // Required: String
    "coordinates": {                 // Optional: Object
      "lat": 23.8103,                // Number
      "lng": 90.4125                 // Number
    },
    "distanceFromProviderKm": 10.5,  // Required: Positive Number
    "notes": "Near central park"     // Optional: String
  },
  "clientName": "John Doe",          // Required: String
  "clientEmail": "john@example.com", // Required: Valid Email String
  "clientPhone": "+8801700000000",   // Optional: String
  "eventType": "Wedding",            // Optional: String
  "specialRequests": "Extra lights"  // Optional: String
}
```

---

## 2. Calculate Booking Price (প্রাইস ক্যালকুলেশন)
বুকিং কনফার্ম বা পেমেন্ট করার আগে প্রাইস চেক করতে এই API কল করা হয়।

**Endpoint:** `/calculate-price`
**Method:** `POST`
**Authorized Roles:** Public / Auth User

**Request Body JSON:**
```json
{
  "serviceId": "651a...abc2",                // Required: String
  "startTime": "10:30",                      // Required: HH:MM string
  "endTime": "12:30",                        // Required: HH:MM string
  "date": "2023-11-20T00:00:00.000Z",        // Required: ISO Date string
  "distanceFromProviderKm": 10.5,            // Optional: Number (default is 0)
  "packageName": "Gold"                      // Optional: Package name
}
```

---

## 3. Get My Bookings (নিজের সমস্ত বুকিং লিস্ট নেওয়া)
ইউজার বা প্রোভাইডার তার নিজের বুকিং লিস্ট দেখার জন্য এই API ব্যবহার করবে।

**Endpoint:** `/my-bookings`
**Method:** `GET`
**Authorized Roles:** User, Professional, Admin, Super Admin

**Query Parameters (All Optional):** 
- `searchTerm` (String)
- `status` (String: 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled')
- `bookingDate` (String: ISO Date format)
- `serviceId` (String: ID)
- `filterType` (String)
- `page` (Number)
- `limit` (Number)
- `sortBy` (String)
- `sortOrder` (String: 'asc' / 'desc')

**Example URL:**
`{{BASE_URL}}/api/v1/booking/my-bookings?page=1&limit=10&status=pending`

---

## 4. Get Single Booking (একটি নির্দিষ্ট বুকিং দেখা)
বুকিং এর বিস্তারিত তথ্য (Details) দেখার জন্য।

**Endpoint:** `/:id` (এখানে `:id` হলো বুকিং আইটেমের Object ID)
**Method:** `GET`
**Authorized Roles:** User, Professional, Admin, Super Admin

**Example URL:**
`{{BASE_URL}}/api/v1/booking/651a...abc3`

---

## 5. Get My Bookings By Date (নির্দিষ্ট তারিখ অনুযায়ী বুকিং লিস্ট নেওয়া)
ইউজার বা প্রোভাইডার একটি নির্দিষ্ট তারিখের সমস্ত বুকিং দেখার জন্য এই API ব্যবহার করবে।

**Endpoint:** `/my-bookings-by-date`
**Method:** `GET`
**Authorized Roles:** User, Professional, Admin, Super Admin

**Query Parameters:** 
- `date` (Required: String, Format: `YYYY-MM-DD` or ISO Date String)

**Example URL:**
`{{BASE_URL}}/api/v1/booking/my-bookings-by-date?date=2024-04-10`

---

## 6. Update Booking Status (স্ট্যাটাস আপডেট / ক্যানসেল করা)
বুকিং এর অবস্থা পরিবর্তন করার জন্য (যেমন- pending থেকে confirmed বা cancelled করা)।

**Endpoint:** `/:id/status`
**Method:** `PATCH`
**Authorized Roles:** User, Professional, Admin, Super Admin

**Request Body JSON:**
```json
{
  "status": "cancelled",             // Required: Enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')
  "cancellationReason": "Optional Reason" // Optional (required logically if status is cancelled)
}
```
