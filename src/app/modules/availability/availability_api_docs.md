# Availability Module API Integration Guide

এই ডকুমেন্টটি `Availability` মডিউলের API সমূহ ব্যবহার করার জন্য একটি সম্পূর্ণ গাইডলাইন (Flutter বা যেকোনো প্ল্যাটফর্মের জন্য)। এই API গুলো মূলত একজন প্রোভাইডারের শিডিউল (কখন সে available, কখন available না) ম্যানেজ এবং চেক করার জন্য ব্যবহৃত হয়।

## 🔗 Base Configuration

**Base URL:** `{{BASE_URL}}/api/v1/availability` (রাউটিং অনুযায়ী)
**Headers:** 
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <YOUR_JWT_TOKEN>"
}
```
*(Public API গুলোতে Authorization হেডার না দিলেও চলবে।)*

---

## 1. Create or Update Availability (প্রোভাইডারের এভেইলিবিলিটি সেট করা)
প্রোভাইডার তার কাজের সময়সূচি, ডিফল্ট শিডিউল, বা বন্ধের দিন সেট/আপডেট করতে এই API কল করবে।
যদি আগে থেকে availability সেট করা থাকে, তবে এটি আপডেট হবে। না থাকলে নতুন তৈরি হবে।

**Endpoint:** `/`
**Method:** `POST`
**Authorized Roles:** Professional, Admin

**Request Body (JSON):**  
*(সব ফিল্ড অপশনাল, প্রয়োজন অনুযায়ী পাঠাতে হবে। Time format অবশ্যই `HH:MM` হতে হবে)*

```json
{
  "serviceId": "specific_service_id_if_needed", // Optional: String
  "defaultSchedule": {                            // Optional: Object (সপ্তাহের কোন দিন কখন এভেইলেবল)
    "monday": { 
      "start": "09:00", 
      "end": "17:00", 
      "isActive": true, 
      "maxBookings": 5 
    },
    "tuesday": { "start": "09:00", "end": "17:00", "isActive": true },
    "wednesday": { "start": "09:00", "end": "17:00", "isActive": false } // Not working on Wednesday
    // thursday, friday, saturday, sunday...
  },
  "customDates": [                                // Optional: Array of objects (স্পেশাল বন্ধ বা ছুটির দিন)
    {
      "date": "2023-12-25T00:00:00.000Z",         // Required: ISO date
      "type": "blocked",                          // Required Enum ('blocked', 'special_hours', 'unavailable')
      "note": "Christmas Holiday"
    },
    {
      "date": "2023-12-31T00:00:00.000Z",
      "type": "special_hours",
      "start": "10:00",
      "end": "14:00",
      "rateMultiplier": 1.5,                      // 1.5x charge on this day
      "maxBookings": 2
    }
  ],
  "recurringRules": [                             // Optional: Array of objects (রিপিটিং রুলস)
    {
      "type": "block_weekly",                     // Required Enum ('block_weekly', 'block_monthly', 'special_hours_weekly')
      "dayOfWeek": 5,                             // 0=Sunday, 1=Monday... 5=Friday
      "active": true
    }
  ],
  "bufferMinutes": 30,                            // Optional: Number (বুকিংয়ের মাঝখানে বিরতি)
  "advanceNoticeHours": 24,                       // Optional: Number (মিনিমাম কতক্ষণ আগে বুক করতে হবে)
  "maxBookingsPerDay": 10,                        // Optional: Number  
  "maxBookingsPerWeek": 50,                       // Optional: Number
  "autoBlockAfterBooking": true,                  // Optional: Boolean
  "autoBlockDuration": 60                         // Optional: Number (minutes)
}
```

---

## 2. Get My Availability (লগিন করা প্রোভাইডারের নিজের এভেইলিবিলিটি দেখা)
প্রোভাইডার তার বর্তমান 세ভ করা শিডিউল দেখার জন্য।

**Endpoint:** `/my-availability`
**Method:** `GET`
**Authorized Roles:** Professional

**Example URL:**
`{{BASE_URL}}/api/v1/availability/my-availability`

---

## 3. Get Provider Availability (নির্দিষ্ট প্রোভাইডারের এভেইলিবিলিটি দেখা)
যেকোনো ইউজার বা প্রোভাইডার অন্য প্রোভাইডারের সেটআপ করা মেইন শিডিউল দেখতে।

**Endpoint:** `/:providerId`
**Method:** `GET`
**Authorized Roles:** Public / Any

**Example URL:**
`{{BASE_URL}}/api/v1/availability/651a...abc1`

---

## 4. Check Date Availability (কোনো নির্দিষ্ট তারিখে প্রোভাইডার ফ্রি আছে কিনা চেক করা)
ইউজার যখন ক্যালেন্ডারে কোনো ডেট সিলেক্ট করবে, ওইদিন প্রোভাইডার এভেইলেবল কিনা তা চেক করার জন্য।

**Endpoint:** `/check/:providerId`
**Method:** `GET`
**Authorized Roles:** Public / Any

**Query Parameters (Required):**
- `date` (String: ISO Date format, e.g. `2023-11-20T00:00:00.000Z`)

**Example URL:**
`{{BASE_URL}}/api/v1/availability/check/651a...abc1?date=2023-11-20T00:00:00.000Z`

---

## 5. Get Time Slots (নির্দিষ্ট তারিখের জন্য খালি স্লট বের করা)
ইউজার ডেট সিলেক্ট করার পর, ওই দিনের কোন কোন সময়ে (Time Slots) বুকিং করা যাবে তার একটি লিস্ট নিয়ে আসা।

**Endpoint:** `/slots/:providerId`
**Method:** `GET`
**Authorized Roles:** Public / Any

**Query Parameters (Required):**
- `date` (String: ISO Date format, e.g. `2023-11-20T00:00:00.000Z`)
- `duration` (String/Number: সার্ভিসের সময়সীমা মিনিটে, যেমন লোগো ডিজাইনের জন্য `120`)

**Example URL:**
`{{BASE_URL}}/api/v1/availability/slots/651a...abc1?date=2023-11-20&duration=60`

*(এই API টি একটি array রিটার্ন করবে, যেমন: `["10:00", "11:30", "14:00"]`)*

---

## 6. Get Month Calendar Overview (এক মাসের ক্যালেন্ডার ওভারভিউ)
ইউজারকে যখন একটি পুরো মাসের ক্যালেন্ডার দেখানো হয়, ওই মাসের কোন কোন দিনগুলো ফ্রি আছে বা ব্লক আছে তার ওভারভিউ পাওয়ার জন্য।

**Endpoint:** `/calendar/:providerId`
**Method:** `GET`
**Authorized Roles:** Public / Any

**Query Parameters (Required):**
- `month` (String/Number: 1 থেকে 12 এর মাঝে মাসের নম্বর)
- `year` (String/Number: যেমন 2023)

**Example URL:**
`{{BASE_URL}}/api/v1/availability/calendar/651a...abc1?month=11&year=2023`

*(এই API টি সাধারণত পুরো মাসের প্রতিটি দিনের একটি স্ট্যাটাস রিটার্ন করে, যেমন কোন দিন available আর কোন দিন fully booked)*
