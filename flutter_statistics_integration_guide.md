# Flutter Integration Guide: Professional Statistics & Analytics

This document provides technical details for integrating the `/statistics` route and visit tracking into the Photopia Flutter application.

## 1. Statistics Overview
**Endpoint:** `GET /professional-profiles/statistics`  
**Authentication:** Required (Professional Token)  
**Description:** Returns detailed performance metrics, revenue analytics, and premium insights. The response structure changes dynamically based on the user's subscription status.

### Request Headers
```http
Authorization: Bearer <PROFESSIONAL_TOKEN>
Content-Type: application/json
```

---

## 2. Response Structure

### A. Free User Response
Free users get a base set of metrics representing their core profile performance and basic revenue.

```json
{
  "success": true,
  "message": "Detailed statistics retrieved successfully",
  "data": {
    "isPremium": false,
    "profileViews": {
      "count": 120,
      "change": -8,
      "performanceVsCategory": {
        "categoryAverage": 450,
        "percentageAbove": -73.3
      }
    },
    "rating": {
      "score": 4.8,
      "reviews": 15,
      "performanceVsCategory": {
        "categoryAverage": 4.2,
        "percentageHigher": 14.3
      }
    },
    "revenueAnalytics": {
      "currentMonth": 1200,
      "previousMonth": 1000,
      "percentageChange": 20.0,
      "averagePerPeriod": 300,
      "bestPerforming": 0,
      "weeklyBreakdown": []
    }
  }
}
```

### B. Premium User Response
Premium users receive additional lists (like Regions) and a `premiumMetrics` object containing high-level business insights.

```json
{
  "success": true,
  "message": "Detailed statistics retrieved successfully",
  "data": {
    "isPremium": true,
    "profileViews": { ... },
    "rating": { ... },
    "revenueAnalytics": {
      "currentMonth": 5000,
      "previousMonth": 4200,
      "percentageChange": 19.0,
      "averagePerPeriod": 1250,
      "bestPerforming": 1800,
      "weeklyBreakdown": [
        { "week": "Week 1", "amount": 1200 },
        { "week": "Week 2", "amount": 1800 }
      ]
    },
    "viewsByRegion": [
      { "city": "Paris", "percentage": 40.5, "count": 200 },
      { "city": "Lyon", "percentage": 20.0, "count": 100 }
    ],
    "premiumMetrics": {
      "mostViewedProject": {
        "serviceId": "...",
        "title": "Wedding Photography",
        "views": 450
      },
      "conversionRate": 5.2,
      "bounceRate": 30.5,
      "avgRevenueVsCategory": {
        "userAvg": 450,
        "categoryAvg": 400,
        "categoryName": "Photography"
      },
      "averageOrderValue": 450,
      "repeatRate": 12.5,
      "avgConversionTime": 48.5
    }
  }
}
```

---

## 3. Flutter Implementation Tips

### Data Modeling
Create a polymorphic model or a class with nullable fields to handle the premium metrics.

```dart
class StatisticsResponse {
  final bool isPremium;
  final ProfileViews profileViews;
  final RatingStats rating;
  final RevenueAnalytics revenue;
  // Premium only
  final List<RegionStats>? viewsByRegion;
  final PremiumMetrics? premiumMetrics;

  StatisticsResponse({
    required this.isPremium,
    required this.profileViews,
    required this.rating,
    required this.revenue,
    this.viewsByRegion,
    this.premiumMetrics,
  });

  factory StatisticsResponse.fromJson(Map<String, dynamic> json) {
    return StatisticsResponse(
      isPremium: json['isPremium'],
      profileViews: ProfileViews.fromJson(json['profileViews']),
      rating: RatingStats.fromJson(json['rating']),
      revenue: RevenueAnalytics.fromJson(json['revenueAnalytics']),
      viewsByRegion: json['viewsByRegion'] != null 
          ? (json['viewsByRegion'] as List).map((i) => RegionStats.fromJson(i)).toList()
          : null,
      premiumMetrics: json['premiumMetrics'] != null 
          ? PremiumMetrics.fromJson(json['premiumMetrics'])
          : null,
    );
  }
}
```

### UI Handling
Use the `isPremium` flag to toggle visibility of premium widgets (e.g., specific charts or the "Most Viewed Project" card). For free users, you can show a "Upgrade to Premium" overlay or blur these sections.

---

## 4. Capturing Data (Visit Tracking)
To ensure these statistics are accurate, the Flutter app **MUST** track visits/interactions when a user views a professional's profile or service.

**Endpoint:** `POST /analytics/track`  
**Method:** `POST`

### Request Body
```json
{
  "providerId": "PROFESSIONAL_USER_ID",
  "serviceId": "SERVICE_ID", // Optional, send if viewing a specific service
  "visitorId": "LOGGED_IN_USER_ID", // Unique ID for visitor
  "type": "view" // Or "interaction" for clicks
}
```

> [!IMPORTANT]
> Always send the `type: 'interaction'` when a user clicks a button like "Book Now" or "Chat". This is how the **Bounce Rate** and **Conversion Rate** are calculated.
