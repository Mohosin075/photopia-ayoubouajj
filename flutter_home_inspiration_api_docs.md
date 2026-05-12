# Photopya Home & Inspiration API Documentation (for Flutter)

This document provides the API endpoints, request payloads, response structures, and socket events for the new Home sections, Inspiration module, and Service filters as per the `update.txt` requirements.

---

## 🏠 Home Page API
Retrieves all sections for the home screen in a single call.

- **Endpoint**: `GET /api/v1/home`
- **Auth**: Optional (Required to get `recentlyViewed` data)
- **Response Structure**:
```json
{
  "success": true,
  "message": "Home data retrieved successfully",
  "data": {
    "recentlyViewed": [
      {
        "_id": "64...",
        "userId": "64...",
        "serviceId": {
          "_id": "64...",
          "title": "Portrait Session",
          "price": 80,
          "currency": "EUR",
          "providerId": {
            "_id": "64...",
            "name": "Marc D.",
            "profile": "url",
            "isOnline": true
          },
          "category": {
             "name": "Portrait",
             "icon": "📸",
             "theme": "Natural"
          }
        },
        "viewedAt": "2026-04-17T10:00:00Z"
      }
    ],
    "popularCategories": [
      {
        "_id": "64...",
        "name": "Wedding",
        "icon": "💒",
        "image": "url",
        "isPopular": true
      }
    ],
    "trendingSubcategories": [
      {
        "_id": "64...",
        "name": "Reels & TikTok",
        "trendingBadge": "🔥 TRENDING",
        "parent": { "name": "Social Media" }
      }
    ],
    "availableNow": [
      {
        "_id": "64...",
        "title": "Pro Interview",
        "providerId": {
          "name": "Sophie L.",
          "isOnline": true,
          "lastActive": "2026-04-17T10:05:00Z"
        }
      }
    ],
    "superPros": [
      {
        "_id": "64...",
        "isSuperPro": true,
        "rating": 4.9,
        "user": {
          "name": "Julien M.",
          "profile": "url"
        }
      }
    ],
    "styles": ["Cinematic", "Natural", "Corporate", "Artistic"],
    "popularLocations": [
      { "_id": "Paris", "count": 1247, "image": "url" },
      { "_id": "Lyon", "count": 423, "image": "url" }
    ],
    "originalProjects": [
      {
        "_id": "64...",
        "title": "Professional VideoEditor",
        "price": 5,
        "currency": "EUR",
        "providerId": {
          "name": "Nazmul islam Rimon",
          "profile": "url"
        }
      }
    ],
    "inspirations": [
      {
        "title": "Planning a wedding?",
        "description": "See our wedding packages",
        "link": "/packages/wedding",
        "icon": "💒"
      }
    ]
  }
}
```

---

## 💡 Inspiration Module
Manage and view inspiration cards.

### 1. Get All Inspirations
- **Endpoint**: `GET /api/v1/inspiration`
- **Query Params**: `searchTerm`, `page`, `limit`
- **Response**: List of inspiration objects (same as in Home API).

### 2. Create Inspiration (Admin Only)
- **Endpoint**: `POST /api/v1/inspiration`
- **Payload**:
```json
{
  "title": "Need social content?",
  "description": "Social Media Plans",
  "link": "/plans/social",
  "icon": "📱"
}
```

---

## 🔍 Service Filters (Advanced Search)
New filters added to the service search API to match `update.txt` sections.

- **Endpoint**: `GET /api/v1/services`
- **New Query Parameters**:
  - `isOnline=true`: Filter providers currently online.
  - `quickResponse=true`: Filter providers who respond in < 2 hours.
  - `expressDelivery=true`: Filter providers with high delivery rates (24-48h).
  - `thisWeekend=true`: Filter providers available on Saturday or Sunday.
  - `lastMinute=true`: Filter providers with < 4h advance notice requirement.
  - `theme=Cinematic`: Filter services by creative style/theme.

---

## ⚡ Socket.io (Online/Offline Status)
To track if a professional is "Available Now", they must be tracked via Socket.

### 1. Connect & Join
When the app starts or user logs in, join the notification room:
- **Event**: `join-notification`
- **Payload**: `userId` (String)
- **Result**: Server marks user as `isOnline: true`.

### 2. Disconnect
When the socket connection is lost (app closed, network lost):
- **Result**: Server automatically marks user as `isOnline: false` and updates `lastActive`.

---

## 🏆 Super Pro Logic
The `isSuperPro` badge is automatically calculated by the server in real-time whenever a new review is submitted or a booking is completed.

**Criteria**:
- **Rating**: 4.5 or higher.
- **Response Rate**: 90% or higher.
- **Response Time**: 120 minutes (2 hours) or less.
- **Projects Completed**: 10 or more.
- **Satisfaction Rate**: 98% or higher.

Flutter Devs just need to display the badge if `isSuperPro == true`.

---

## 👁️ Recently Viewed Logic
- **Action**: When a user clicks to view a service detail, the Flutter app calls `GET /api/v1/services/:id`.
- **Server Side**: The server automatically records this view for the authenticated user.
- **Display**: These will then appear in the `recentlyViewed` section of the `GET /home` API.

---

## 💎 Original Projects Logic
The `isOriginal` badge is automatically assigned to a service when:
- **Average Rating**: 4.0 or higher.
- **Review Count**: 5 or more reviews.

**Automation**: This is updated in real-time whenever a new review is submitted. Admin manual override is also possible via the service update API.

---

## 📍 Location API (Google Places & Geocoding)
Used for finding and validating addresses during booking or profile setup.

### 1. Location Search (Autocomplete)
- **Endpoint**: `GET /api/v1/locations/search?q=query`
- **Auth**: Required
- **Query Params**:
  - `q` (String, Required): The search text (e.g., "Par").
- **Error Responses**:
  - `400 Bad Request`: If `q` is missing (Validation Error).
- **Response**:
```json
{
  "success": true,
  "message": "Location suggestions retrieved successfully",
  "data": [
    {
      "description": "Paris, France",
      "placeId": "ChIJD7fiBh9u5kcRY9ia9JhH-CQ",
      "mainText": "Paris",
      "secondaryText": "France"
    }
  ]
}
```

### 2. Geocode Address (Address to Lat/Lng)
- **Endpoint**: `GET /api/v1/locations/geocode?address=address`
- **Auth**: Required
- **Query Params**:
  - `address` (String, Required): The full address to geocode.
- **Error Responses**:
  - `400 Bad Request`: If `address` is missing (Validation Error).
  - `404 Not Found`: If Google cannot find the location (`ZERO_RESULTS`).
- **Response**:
```json
{
  "success": true,
  "message": "Location geocoded successfully",
  "data": {
    "lat": 48.856614,
    "lng": 2.3522219,
    "formattedAddress": "Paris, France",
    "placeId": "ChIJD7fiBh9u5kcRY9ia9JhH-CQ"
  }
}
```
