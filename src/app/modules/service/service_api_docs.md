# Service Module API Integration Guide

এই ডকুমেন্টটি `Service` মডিউলের API সমূহ ব্যবহার করার জন্য একটি সম্পূর্ণ গাইডলাইন (Flutter বা যেকোনো প্ল্যাটফর্মের জন্য)। এখানে প্রতিটি এন্ডপয়েন্ট, মেথড এবং রিকোয়েস্ট বডি (ডেটা মডেল) এর স্ট্রাকচার দেওয়া হলো।

## 🔗 Base Configuration

**Base URL:** `{{BASE_URL}}/api/v1/services` (রাউটিং অনুযায়ী)
**Headers:** 
```json
{
  "Content-Type": "application/json", // For default JSON payloads
  // OR -> "Content-Type": "multipart/form-data" (For endpoints that include file upload)
  "Authorization": "Bearer <YOUR_JWT_TOKEN>"
}
```

---

## 1. Create Service (নতুন সার্ভিস তৈরি করা)
**Endpoint:** `/`
**Method:** `POST`
**Authorized Roles:** Professional, Admin, Super Admin
**Note:** This endpoint uses `fileAndBodyProcessorUsingDiskStorage()`, which means you likely need to send data as `multipart/form-data` if you're uploading files (like `coverMedia`), and text data as stringified JSON or normal fields depending on your server's exact configuration. Here is the JSON schema for the data part.

**Request Body (JSON format mapping):**
```json
{
  "title": "Professional Wedding Photography",       // Required (string)
  "description": "High quality photography...",      // Required (string)
  "category": "Photography",                         // Required (string)
  "serviceType": "hourly",                           // Required (Enum mapping to SERVICE_TYPE)
  "subCategory": "Wedding",                          // Optional (string)
  "tags": ["wedding", "photo", "4k"],                // Optional (Array of strings)
  "equipment": ["Sony A7III", "Gimbal"],             // Optional (Array of strings)
  "price": 500,                                      // Required (Number)
  "currency": "USD",                                 // Optional (String, default usually 'EUR')
  "pricingType": "fixed",                            // Required (Enum mapping to SERVICE_PRICING_TYPE)
  "duration": "2 hours",                             // Required (String)
  "location": {                                      // Required (Object)
    "type": "physical",                              // Required Enum ('physical', 'virtual', etc.)
    "country": "Bangladesh",                         // Required (String)
    "city": "Dhaka",                                 // Required (String)
    "address": "123 Main St",                        // Optional (String)
    "coordinates": {                                 // Optional (Object)
      "lat": 23.8103,
      "lng": 90.4125
    },
    "serviceRadiusKm": 20                            // Optional (Number)
  },
  "gallery": ["url1.jpg", "url2.jpg"],               // Optional (Array of URLs)
  "status": "active"                                 // Optional Enum ('active', 'inactive', 'suspended', etc., default 'active')
}
```
*(If uploading an image simultaneously, ensure the Flutter code sends `multipart/form-data` with the file attached to the appropriate key like `file` or `coverMedia` as configured in your multer setup).*

---

## 2. Get All Services (পাবলিক সার্ভিস লিস্ট)
যেকোনো ইউজার সব সার্ভিস দেখতে পারবে (ফিল্টার সহ)।

**Endpoint:** `/`
**Method:** `GET`
**Authorized Roles:** Public / Any

**Query Parameters (All Optional):**
- `searchTerm` (String)
- `category` (String)
- `subCategory` (String)
- `tags` (String)
- `pricingType` (Enum)
- `minPrice` (String/Number)
- `maxPrice` (String/Number)
- `location.type` (Enum)
- `location.country` (String)
- `location.city` (String)
- `status` (Enum)
- `isVerified` (Boolean as string 'true'/'false')
- `providerId` (String)
- `serviceType` (Enum)
- `isActive` (Boolean as string 'true'/'false')
- `page`, `limit`, `sortBy`, `sortOrder` (Pagination options)

**Example URL:**
`{{BASE_URL}}/api/v1/services?page=1&limit=10&category=Photography&status=active`

---

## 3. Get Services By Provider (নির্দিষ্ট প্রোভাইডারের সার্ভিস)
একজন নির্দিষ্ট প্রোভাইডারের (যেমন ফটোগ্রাফার) সব সার্ভিস দেখতে এই API ব্যবহার করবেন।

**Endpoint:** `/provider/:providerId`
**Method:** `GET`
**Authorized Roles:** Public / Any

**Query Parameters (All Optional):** Same as "Get All Services".

**Example URL:**
`{{BASE_URL}}/api/v1/services/provider/651a...abc1`

---

## 4. Get My Services (প্রোভাইডারের নিজের সার্ভিস লিস্ট)
লগ-ইন করা প্রোভাইডার তার নিজের তৈরি করা সব সার্ভিস দেখতে এই API কল করবে।

**Endpoint:** `/my/services`
**Method:** `GET`
**Authorized Roles:** Professional, Admin, Super Admin

**Query Parameters (All Optional):** Same as "Get All Services".

**Example URL:**
`{{BASE_URL}}/api/v1/services/my/services?page=1&limit=10`

---

## 5. Get Single Service (সার্ভিসের বিস্তারিত দেখা)
একটি সার্ভিসের বিস্তারিত তথ্য দেখতে।

**Endpoint:** `/:id` (এখানে `:id` হলো সার্ভিসের ID)
**Method:** `GET`
**Authorized Roles:** Public / Any

**Example URL:**
`{{BASE_URL}}/api/v1/services/651a...abc2`

---

## 6. Update Service (সার্ভিস আপডেট করা)
সার্ভিসের যেকোনো তথ্য আপডেট করতে।

**Endpoint:** `/:id`
**Method:** `PATCH`
**Authorized Roles:** Professional, Admin, Super Admin
**Note:** Uses `fileAndBodyProcessorUsingDiskStorage()` so it might require `multipart/form-data` for files.

**Request Body (JSON format mapping):**
(সব ফিল্ড অপশনাল)
```json
{
  "title": "Updated Wedding Photography",
  "price": 600,
  "status": "inactive",
  "isActive": false,
  "isVerified": true, // Usually admin specific
  // ... Any field from Create Service can be passed optionally
}
```

---

## 7. Delete Service (সার্ভিস ডিলিট করা)
একটি সার্ভিস মুছে ফেলতে।

**Endpoint:** `/:id`
**Method:** `DELETE`
**Authorized Roles:** Professional, Admin, Super Admin

**Example URL:**
`{{BASE_URL}}/api/v1/services/651a...abc2`

---

## 8. Toggle Service Status (সার্ভিসের স্ট্যাটাস অন/অফ করা)
সার্ভিস active, inactive বা suspended করতে।

**Endpoint:** `/:id/status`
**Method:** `PATCH`
**Authorized Roles:** Professional, Admin, Super Admin

**Request Body JSON:**
```json
{
  "status": "inactive" // Required Enum (e.g., 'active', 'inactive', 'suspended')
}
```
