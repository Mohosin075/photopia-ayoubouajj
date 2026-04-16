# Flutter Integration Guide: Service Management & Pricing

This guide provides everything you need to integrate the **Service** module into the Photopia Flutter application. It covers data models, API endpoints, filtering, and media uploads.

---

## 1. Global Response Structure
All API responses follow a standard wrapper. Use this generic class in Dart to handle responses.

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
      message: json['message'],
      meta: json['meta'] != null ? ApiMeta.fromJson(json['meta']) : null,
      data: json['data'] != null ? fromJsonT(json['data']) : null,
    );
  }
}

class ApiMeta {
  final int page;
  final int limit;
  final int total;

  ApiMeta({required this.page, required this.limit, required this.total});

  factory ApiMeta.fromJson(Map<String, dynamic> json) {
    return ApiMeta(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      total: json['total'] ?? 0,
    );
  }
}
```

---

## 2. Service Data Models
Update your Flutter models to match the backend interfaces.

### Service Model
```dart
class ServiceModel {
  final String id;
  final String providerId;
  final String title;
  final String description;
  final String category; // Category ID
  final String serviceType; // e.g., 'photography', 'videography'
  final String? subCategory;
  final List<String>? tags;
  final List<String>? equipment;
  final double price;
  final String currency;
  final String pricingType; // 'HOURLY', 'DAILY', 'PACKAGE'
  final ServicePricingModel? pricingModel;
  final CancellationPolicy? cancellationPolicy;
  final ServiceLocation location;
  final String? coverMedia;
  final List<String>? gallery;
  final String status;
  final bool isVerified;
  final bool isActive;

  ServiceModel({
    required this.id,
    required this.providerId,
    required this.title,
    required this.description,
    required this.category,
    required this.serviceType,
    this.subCategory,
    this.tags,
    this.equipment,
    required this.price,
    required this.currency,
    required this.pricingType,
    this.pricingModel,
    this.cancellationPolicy,
    required this.location,
    this.coverMedia,
    this.gallery,
    required this.status,
    required this.isVerified,
    required this.isActive,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['_id'],
      providerId: json['providerId'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      serviceType: json['serviceType'],
      subCategory: json['subCategory'],
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      equipment: json['equipment'] != null ? List<String>.from(json['equipment']) : null,
      price: (json['price'] as num).toDouble(),
      currency: json['currency'] ?? 'EUR',
      pricingType: json['pricingType'],
      pricingModel: json['pricingModel'] != null ? ServicePricingModel.fromJson(json['pricingModel']) : null,
      cancellationPolicy: json['cancellationPolicy'] != null ? CancellationPolicy.fromJson(json['cancellationPolicy']) : null,
      location: ServiceLocation.fromJson(json['location']),
      coverMedia: json['coverMedia'],
      gallery: json['gallery'] != null ? List<String>.from(json['gallery']) : null,
      status: json['status'],
      isVerified: json['isVerified'] ?? false,
      isActive: json['isActive'] ?? true,
    );
  }
}

class ServiceLocation {
  final String type; // 'ONSITE', 'REMOTE'
  final String country;
  final String city;
  final String? address;
  final double? lat;
  final double? lng;
  final int? serviceRadiusKm;

  ServiceLocation({required this.type, required this.country, required this.city, this.address, this.lat, this.lng, this.serviceRadiusKm});

  factory ServiceLocation.fromJson(Map<String, dynamic> json) {
    return ServiceLocation(
      type: json['type'],
      country: json['country'],
      city: json['city'],
      address: json['address'],
      lat: (json['coordinates']?['lat'] as num?)?.toDouble(),
      lng: (json['coordinates']?['lng'] as num?)?.toDouble(),
      serviceRadiusKm: json['serviceRadiusKm'],
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
```

---

## 3. Main Endpoints

### 🔗 Base URL: `{{BASE_URL}}/api/v1/services`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Fetch all services with filters | No |
| **GET** | `/:id` | Get details of a single service | No |
| **GET** | `/provider/:providerId` | Get services of a specific provider | No |
| **GET** | `/my/services` | Get services owned by current provider | Yes |
| **POST** | `/` | Create a new service (Multipart) | Yes |
| **PATCH** | `/:id` | Update an existing service (Multipart) | Yes |
| **DELETE** | `/:id` | Delete a service | Yes |
| **PATCH** | `/:id/status` | Toggle status (ACTIVE/INACTIVE) | Yes |

---

## 4. Fetching & Filtering
The `GET /` endpoint supports several query parameters for filtering.

**Query Parameters:**
- `searchTerm`: Search in title/description.
- `category`: Filter by category ID.
- `pricingType`: `HOURLY`, `DAILY`, `PACKAGE`.
- `minPrice` / `maxPrice`: Price range.
- `location.city` / `location.country`: Geographic filter.
- `serviceType`: e.g. `photography`.

**Example Request:**
`GET /api/v1/services?category=65f...&pricingType=PACKAGE&minPrice=100`

---

## 5. Service Creation (Multipart)
Since services include media uploads, use `multipart/form-data`.

### Request Configuration
- **Header:** `Content-Type: multipart/form-data`
- **Field `data`:** Stringified JSON of the service object.
- **Field `coverPhoto`:** Single image file.
- **Field `images`:** List of image files (up to 5).

### JSON structure for `data` field:
```json
{
  "title": "Professional Wedding Photography",
  "description": "Full day coverage...",
  "category": "65f... (ID)",
  "serviceType": "photography",
  "pricingType": "PACKAGE",
  "price": 500,
  "pricingModel": {
    "type": "PACKAGE",
    "packages": [
      { "name": "Standard", "price": 500, "duration": 5, "description": "Basic set" }
    ]
  },
  "location": {
    "type": "ONSITE",
    "country": "Germany",
    "city": "Berlin"
  }
}
```

---

## 6. Booking Hints
When a user selects a package, send the `packageName` in the booking request.

> [!IMPORTANT]
> **Automatic Duration:** The backend automatically calculates the `endTime` based on the selected package's `duration` or the default `dailyHours`.

> [!TIP]
> **Deposit:** The system calculates a **50% deposit** by default for any service booking, which is required for Stripe Checkout completion.

---

## 7. Status Management
Toggle a service's availability using the status endpoint.

**Endpoint:** `PATCH /services/:id/status`
**Body:** `{ "status": "INACTIVE" }`
