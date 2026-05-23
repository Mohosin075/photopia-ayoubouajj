# Flutter Integration Guide: Service Management & Pricing

This guide provides a comprehensive reference for integrating the **Service** module into the Photopya Flutter application. It covers everything from standard response parsing to complex pricing models, media uploads, and booking logic.

---

## 1. Standard Response Handling
All backend APIs wrap data in a common structure. Use these Dart base classes for consistent parsing.

### ApiResponse Wrapper
```dart
class ApiResponse<T> {
  final int statusCode;
  final bool success;
  final String? message;
  final ApiMeta? meta;
  final T? data;

  ApiResponse({
    required this.statusCode,
    required this.success,
    this.message,
    this.meta,
    this.data,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(dynamic) fromJsonT) {
    return ApiResponse(
      statusCode: json['statusCode'],
      success: json['success'],
      message: json['message'] ?? '',
      meta: json['meta'] != null ? ApiMeta.fromJson(json['meta']) : null,
      data: json['data'] != null ? fromJsonT(json['data']) : null,
    );
  }
}

class ApiMeta {
  final int page;
  final int limit;
  final int total;
  final int? totalPages;

  ApiMeta({required this.page, required this.limit, required this.total, this.totalPages});

  factory ApiMeta.fromJson(Map<String, dynamic> json) {
    return ApiMeta(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'],
    );
  }
}
```

---

## 2. Comprehensive Data Models
Update your models to reflect the current backend logic, including pricing rules and travel fees.

### Service Model
```dart
class ServiceModel {
  final String id;
  final String providerId; // Populated Object or ID
  final String title;
  final String description;
  final String category; // Populated Object or ID
  final String serviceType; // e.g., 'photography', 'videography'
  final String? subCategory;
  final String? theme;
  final List<String>? tags;
  final List<String>? equipment;
  final double price; // Base or Hourly Rate
  final String currency;
  final String pricingType; // 'HOURLY', 'DAILY', 'PACKAGE'
  final ServicePricingModel? pricingModel;
  final List<PricingRule>? pricingRules;
  final ServiceLocation location;
  final double? travelFeePerKm;
  final bool allowOutsideRadius;
  final double? maxTravelFee;
  final int depositPercentage; // Default is usually 50
  final CancellationPolicy? cancellationPolicy;
  final String? coverMedia;
  final List<String>? gallery;
  final String status; // 'DRAFT', 'ACTIVE', 'INACTIVE', etc.
  final bool isVerified;
  final bool isActive;
  final List<ServiceAddOn>? addOns;


  ServiceModel({
    required this.id,
    required this.providerId,
    required this.title,
    required this.description,
    required this.category,
    required this.serviceType,
    this.subCategory,
    this.theme,
    this.tags,
    this.equipment,
    required this.price,
    required this.currency,
    required this.pricingType,
    this.pricingModel,
    this.pricingRules,
    required this.location,
    this.travelFeePerKm,
    this.allowOutsideRadius = false,
    this.maxTravelFee,
    this.depositPercentage = 50,
    this.cancellationPolicy,
    this.coverMedia,
    this.gallery,
    required this.status,
    required this.isVerified,
    required this.isActive,
    this.addOns,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['_id'],
      providerId: json['providerId'] is Map ? json['providerId']['_id'] : json['providerId'],
      title: json['title'],
      description: json['description'],
      category: json['category'] is Map ? json['category']['_id'] : json['category'],
      serviceType: json['serviceType'],
      subCategory: json['subCategory'],
      theme: json['theme'],
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      equipment: json['equipment'] != null ? List<String>.from(json['equipment']) : null,
      price: (json['price'] as num).toDouble(),
      currency: json['currency'] ?? 'EUR',
      pricingType: json['pricingType'],
      pricingModel: json['pricingModel'] != null ? ServicePricingModel.fromJson(json['pricingModel']) : null,
      pricingRules: json['pricingRules'] != null 
        ? (json['pricingRules'] as List).map((r) => PricingRule.fromJson(r)).toList() 
        : null,
      location: ServiceLocation.fromJson(json['location']),
      travelFeePerKm: (json['travelFeePerKm'] as num?)?.toDouble(),
      allowOutsideRadius: json['allowOutsideRadius'] ?? false,
      maxTravelFee: (json['maxTravelFee'] as num?)?.toDouble(),
      depositPercentage: json['depositPercentage'] ?? 50,
      cancellationPolicy: json['cancellationPolicy'] != null ? CancellationPolicy.fromJson(json['cancellationPolicy']) : null,
      coverMedia: json['coverMedia'],
      gallery: json['gallery'] != null ? List<String>.from(json['gallery']) : null,
      status: json['status'],
      isVerified: json['isVerified'] ?? false,
      isActive: json['isActive'] ?? true,
      addOns: json['addOns'] != null
        ? (json['addOns'] as List).map((a) => ServiceAddOn.fromJson(a)).toList()
        : null,
    );
  }
}
```

### Supporting Models
```dart
class ServiceLocation {
  final String type; // 'ONSITE', 'REMOTE'
  final String country;
  final String city;
  final String? address;
  final double? lat;
  final double? lng;
  final int serviceRadiusKm;

  ServiceLocation({required this.type, required this.country, required this.city, this.address, this.lat, this.lng, this.serviceRadiusKm = 50});

  factory ServiceLocation.fromJson(Map<String, dynamic> json) {
    return ServiceLocation(
      type: json['type'],
      country: json['country'],
      city: json['city'],
      address: json['address'],
      lat: (json['coordinates']?['lat'] as num?)?.toDouble(),
      lng: (json['coordinates']?['lng'] as num?)?.toDouble(),
      serviceRadiusKm: json['serviceRadiusKm'] ?? 50,
    );
  }
}

class ServicePricingModel {
  final String type;
  final double? dailyRate;
  final int? dailyHours;
  final double? weekdayHourlyRate;
  final double? weekendHourlyRate;
  final List<ServicePackage>? packages;

  ServicePricingModel({required this.type, this.dailyRate, this.dailyHours, this.weekdayHourlyRate, this.weekendHourlyRate, this.packages});

  factory ServicePricingModel.fromJson(Map<String, dynamic> json) {
    return ServicePricingModel(
      type: json['type'],
      dailyRate: (json['dailyRate'] as num?)?.toDouble(),
      dailyHours: json['dailyHours'],
      weekdayHourlyRate: (json['weekdayHourlyRate'] as num?)?.toDouble(),
      weekendHourlyRate: (json['weekendHourlyRate'] as num?)?.toDouble(),
      packages: json['packages'] != null 
        ? (json['packages'] as List).map((p) => ServicePackage.fromJson(p)).toList() 
        : null,
    );
  }
}

class ServicePackage {
  final String name;
  final double price;
  final int duration; // in hours
  final String? description;
  final List<String>? includes;

  ServicePackage({required this.name, required this.price, required this.duration, this.description, this.includes});

  factory ServicePackage.fromJson(Map<String, dynamic> json) {
    return ServicePackage(
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      duration: json['duration'],
      description: json['description'],
      includes: json['includes'] != null ? List<String>.from(json['includes']) : null,
    );
  }
}

class PricingRule {
  final String ruleType; // 'peak_hour', 'weekend', 'holiday', etc.
  final String modifierType; // 'percentage', 'fixed', 'multiplier'
  final double modifierValue;
  final int priority;

  PricingRule({required this.ruleType, required this.modifierType, required this.modifierValue, required this.priority});

  factory PricingRule.fromJson(Map<String, dynamic> json) {
    return PricingRule(
      ruleType: json['ruleType'],
      modifierType: json['modifierType'],
      modifierValue: (json['modifierValue'] as num).toDouble(),
      priority: json['priority'] ?? 0,
    );
  }
}

class CancellationPolicy {
  final int freeCancellationHours;
  final int partialRefundHours;
  final int noRefundHours;

  CancellationPolicy({required this.freeCancellationHours, required this.partialRefundHours, required this.noRefundHours});

  factory CancellationPolicy.fromJson(Map<String, dynamic> json) {
    return CancellationPolicy(
      freeCancellationHours: json['freeCancellationHours'] ?? 24,
      partialRefundHours: json['partialRefundHours'] ?? 12,
      noRefundHours: json['noRefundHours'] ?? 6,
    );
  }
}

class ServiceAddOn {
  final String name;
  final double price;
  final String? description;

  ServiceAddOn({required this.name, required this.price, this.description});

  factory ServiceAddOn.fromJson(Map<String, dynamic> json) {
    return ServiceAddOn(
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'price': price,
      if (description != null) 'description': description,
    };
  }
}

```

---

## 3. Pricing Logic Re-checked
Each `pricingType` has specific validation and booking behavior.

- **HOURLY**:
    - Uses `price` as the hourly rate.
    - If `weekdayHourlyRate` or `weekendHourlyRate` exist in `pricingModel`, they **override** the base `price` automatically based on the booking date.
- **DAILY**:
    - **Mandatory**: `pricingModel.dailyRate`.
    - Backend automatically treats the booking as a full day (duration = `dailyHours` or 8h default).
- **PACKAGE**:
    - **Mandatory**: `pricingModel.packages` (at least one).
    - Client **must** send `packageName` in the booking request.
    - `endTime` is automatically recalculated by the backend based on `startTime` + package `duration`.

---

## 3.1 Add-ons & Custom Options Integration

You can offer predefined extra options (like "Drone footage", "Extra hour", "Rush delivery") for services.

### A. Creating a Service with Predefined Add-ons
When a Professional creates or updates a service, they can pass an `addOns` list:
```json
{
  "title": "Professional Portrait Shoot",
  "pricingType": "HOURLY",
  "price": 100,
  "addOns": [
    {
      "name": "Extra hour of coverage",
      "price": 150,
      "description": "Add one extra hour of shooting time"
    },
    {
      "name": "Drone footage",
      "price": 300,
      "description": "Aerial video shots included"
    },
    {
      "name": "Rush delivery (48h)",
      "price": 200,
      "description": "Receive edited photos within 48 hours"
    }
  ]
}
```

### B. Client Booking with Add-ons (Custom Options)
When booking the service, the client can select which add-ons they want. The selected options should be sent in the `customOptions` field:
```json
{
  "serviceId": "SERVICE_ID",
  "providerId": "PROVIDER_ID",
  "bookingDate": "2026-06-15",
  "startTime": "14:00",
  "endTime": "16:00",
  "customOptions": [
    {
      "name": "Drone footage",
      "price": 300
    },
    {
      "name": "Rush delivery (48h)",
      "price": 200
    }
  ]
}
```

> [!WARNING]
> **Strict Security price validation:** 
> The backend matches each item in the client-submitted `customOptions` against the service's predefined `addOns` array.
> - If the add-on `name` does not exist on the service, or the `price` does not match the configured price exactly, the backend will reject the request with `400 Bad Request` ("Invalid price for add-on").
> - Always query the service first and map the selected add-on names and prices exactly. Do not allow manually edited inputs for price.

---


## 4. Demo Data for Smooth Integration

### A. Demo: Creating a PACKAGE Service
Use this JSON in the `data` field of your `multipart/form-data` request.

```json
{
  "title": "Wedding Photography Gold",
  "description": "Premium 8-hour wedding coverage with drone shots and high-end editing.",
  "category": "65f8a... (Category ID)",
  "serviceType": "photography",
  "price": 600,
  "currency": "EUR",
  "duration": "8 hours",
  "pricingType": "PACKAGE",
  "pricingModel": {
    "type": "PACKAGE",
    "packages": [
      {
        "name": "Gold Wedding",
        "price": 800,
        "duration": 8,
        "description": "Full day gold coverage",
        "includes": ["200 Photos", "Post-editing", "Drone Shot"]
      },
      {
        "name": "Silver Wedding",
        "price": 500,
        "duration": 4,
        "description": "Half day silver coverage",
        "includes": ["100 Photos", "Post-editing"]
      }
    ]
  },
  "location": {
    "type": "ONSITE",
    "country": "Germany",
    "city": "Berlin",
    "serviceRadiusKm": 50,
    "coordinates": { "lat": 52.52, "lng": 13.405 }
  },
  "tags": ["wedding", "professional", "berlin"],
  "equipment": ["Sony A7IV", "35mm f1.4", "DJI Mini 3 Pro"]
}
```

### B. Demo: Creating a DAILY Service
```json
{
  "title": "Full Day Studio Rental",
  "description": "Large professional studio available for full day rentals.",
  "category": "65f8a... (Category ID)",
  "serviceType": "studio_rental",
  "price": 400,
  "pricingType": "DAILY",
  "pricingModel": {
    "type": "DAILY",
    "dailyRate": 400,
    "dailyHours": 10
  },
  "location": {
    "type": "ONSITE",
    "country": "France",
    "city": "Paris"
  }
}
```

---

## 5. Image Handling logic
When creating or updating a service via `multipart/form-data`:

1.  **Field names**: Use `coverPhoto` for the main image and `images` (array) for additional gallery images.
2.  **Logic**: If you only upload files to the `images` field, the backend automatically takes the **first image** from the `images` array and sets it as `coverMedia`.

---

## 6. Booking Workflow Facts
Integrators should be aware of these automatic backend processes:

- **Travel Fees**: If the event address coordinates are more than `serviceRadiusKm` away from the service's coordinates, a travel fee is added (`distance * travelFeePerKm`). This is capped by `maxTravelFee`.
- **Automatic Geocoding**: If you don't send coordinates for the event location in a booking, the backend will attempt to geocode the `address`, `city`, and `country` string.
- **Deposit**: A **50% deposit** is mandatory. The `POST /bookings` response will contain a `paymentSession` (Stripe Checkout URL) that the client **must** visit to confirm the booking.
- **Booking Number**: Backend generates a unique ID like `B-123456789` for every booking.

---

## 7. Service Status & Visibility
- **DRAFT**: Visible only to the provider.
- **ACTIVE**: Publicly visible and bookable.
- **INACTIVE**: Publicly visible but **not bookable**.
- **DELETED**: Completely hidden (soft deleted).
---

## 8. Flutter Implementation (Code Example)
When creating a service from Flutter, you **must** use `multipart/form-data`. The most important part is that all text data (title, price, location, etc.) must be stringified into a single field named **`data`**.

### Using Dio (Recommended)
```dart
import 'package:dio/dio.dart';
import 'dart:convert';

Future<void> createService(ServiceModel service, List<String> imagePaths) async {
  Dio dio = Dio();
  
  // 1. Prepare the JSON data
  Map<String, dynamic> jsonData = {
    "title": service.title,
    "description": service.description,
    "category": service.category,
    "serviceType": service.serviceType,
    "price": service.price,
    "currency": service.currency,
    "duration": "2 hours", // or dynamic
    "pricingType": service.pricingType,
    "pricingModel": {
        "type": service.pricingType,
        "packages": service.pricingModel?.packages?.map((p) => {
            "name": p.name,
            "price": p.price,
            "duration": p.duration,
            "description": p.description,
            "includes": p.includes
        }).toList()
    },
    "location": {
      "type": "ONSITE",
      "country": "Germany",
      "city": "Berlin",
      "address": "123 Main St",
      "serviceRadiusKm": 50
    }
  };

  // 2. Create FormData
  FormData formData = FormData.fromMap({
    "data": jsonEncode(jsonData), // MUST be stringified JSON
    "coverPhoto": await MultipartFile.fromFile(imagePaths[0], filename: "cover.jpg"),
    "images": [
      for (var path in imagePaths)
        await MultipartFile.fromFile(path, filename: path.split('/').last)
    ],
  });

  // 3. Send Request
  try {
    var response = await dio.post(
      "https://your-api.com/api/v1/services",
      data: formData,
      options: Options(
        headers: {
          "Authorization": "Bearer YOUR_TOKEN",
          "Content-Type": "multipart/form-data",
        },
      ),
    );
    print("Success: ${response.data}");
  } catch (e) {
    print("Error: $e");
  }
}
```

> [!CAUTION]
> **Common Mistake:** Sending `title` or `price` as direct fields in `FormData` will fail validation. The backend only looks at the `data` field for these values.

---

## 9. Troubleshooting Integration
If you get a `400 Bad Request` or `Validation Error`:

1.  **Check the `data` field**: Ensure it is a valid JSON string. Use `jsonEncode()` in Dart.
2.  **Required Fields**: Ensure `category` is a valid MongoDB ObjectId string.
3.  **Pricing Type**: If `pricingType` is `PACKAGE`, you **must** include `pricingModel.packages` with at least one item.
4.  **Field Names**: Ensure file fields are named `coverPhoto` or `images` exactly as shown.

---

## 10. State Management with Provider
Using `Provider` is the recommended way to manage service data and creation state across the app.

### ServiceProvider Implementation
```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:convert';

class ServiceProvider with ChangeNotifier {
  final Dio _dio = Dio(BaseOptions(baseUrl: "YOUR_BASE_URL"));
  
  List<ServiceModel> _services = [];
  List<ServiceModel> _myServices = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<ServiceModel> get services => _services;
  List<ServiceModel> get myServices => _myServices;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Fetch Public Services with Optional Filters
  Future<void> fetchPublicServices({Map<String, dynamic>? filters}) async {
    _setLoading(true);
    try {
      final response = await _dio.get('/api/v1/services', queryParameters: filters);
      
      // Map the generic ApiResponse to a List<ServiceModel>
      final apiResponse = ApiResponse<List<ServiceModel>>.fromJson(
        response.data,
        (data) {
           // Backend returns { meta: {...}, data: [...] } for list endpoints
           List list = data is Map ? data['data'] : data;
           return list.map((s) => ServiceModel.fromJson(s)).toList();
        },
      );
      
      if (apiResponse.success) {
        _services = apiResponse.data ?? [];
        _error = null;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // Create Service (Multipart)
  Future<bool> createService(ServiceModel service, List<String> imagePaths, String token) async {
    _setLoading(true);
    try {
      // 1. Prepare JSON
      Map<String, dynamic> jsonData = {
        "title": service.title,
        "description": service.description,
        "category": service.category,
        "serviceType": service.serviceType,
        "price": service.price,
        "currency": service.currency,
        "duration": "2 hours",
        "pricingType": service.pricingType,
        "pricingModel": service.pricingModel != null ? {
          "type": service.pricingType,
          "dailyRate": service.pricingModel?.dailyRate,
          "dailyHours": service.pricingModel?.dailyHours,
          "packages": service.pricingModel?.packages?.map((p) => {
            "name": p.name,
            "price": p.price,
            "duration": p.duration,
            "description": p.description,
          }).toList(),
        } : null,
        "location": {
          "type": service.location.type,
          "country": service.location.country,
          "city": service.location.city,
          "serviceRadiusKm": service.location.serviceRadiusKm,
        }
      };

      // 2. Prepare FormData
      FormData formData = FormData.fromMap({
        "data": jsonEncode(jsonData),
        "coverPhoto": await MultipartFile.fromFile(imagePaths[0], filename: "cover.jpg"),
        "images": [
          for (var path in imagePaths)
            await MultipartFile.fromFile(path, filename: path.split('/').last)
        ],
      });

      // 3. Request
      final response = await _dio.post(
        '/api/v1/services',
        data: formData,
        options: Options(headers: {"Authorization": "Bearer $token"}),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        await fetchPublicServices(); // Refresh list
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool val) {
    _isLoading = val;
    notifyListeners();
  }
}
```

### Usage in UI
Wrap your app in `main.dart`:
```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => ServiceProvider()),
  ],
  child: MyApp(),
)
```

Use `Consumer` to display services:
```dart
Consumer<ServiceProvider>(
  builder: (context, provider, child) {
    if (provider.isLoading) return Center(child: CircularProgressIndicator());
    if (provider.error != null) return Center(child: Text("Error: ${provider.error}"));
    
    return ListView.builder(
      itemCount: provider.services.length,
      itemBuilder: (context, index) => ServiceCard(service: provider.services[index]),
    );
  },
)
```
