# Flutter Integration Guide: Service Pricing & Packages

This guide explain how to integrate the new **Service by Day** and **Service by Package** features into the Photopia Flutter application.

## 1. Service Creation & Management
When creating or updating a service, professionals can now define complex pricing models.

**Endpoints:** 
- `POST /services` (Create)
- `PATCH /services/:id` (Update)

### Pricing Types
The `pricingType` field must be one of:
- `HOURLY`: Standard hourly rate.
- `DAILY`: Fixed rate per day.
- `PACKAGE`: Pre-defined bundles/packages.

### Request Body (Pricing Model)
The `pricingModel` object allows storing specific rates and a list of packages.

```json
{
  "title": "Wedding Photography",
  "pricingType": "PACKAGE", 
  "price": 500, // Base fallout price
  "pricingModel": {
    "type": "PACKAGE",
    "dailyRate": 800, // Used if pricingType is DAILY
    "dailyHours": 8, // Default duration for a DAILY booking
    "packages": [
      {
        "name": "Bronze Package",
        "price": 300,
        "duration": 3,
        "description": "3 hours of coverage",
        "includes": ["50 Digital Photos", "1 Location"]
      },
      {
        "name": "Gold Package",
        "price": 700,
        "duration": 6,
        "description": "6 hours of coverage",
        "includes": ["150 Digital Photos", "2 Locations", "Drone Shots"]
      }
    ]
  }
}
```

---

## 2. Booking a Service
When a client books a service, they can now specify a package.

**Endpoint:** `POST /bookings`

### Important Request Fields
- `packageName`: (Optional) The name of the package selected (e.g., "Gold Package").
- `startTime`: The starting time (e.g., "10:00").
- `endTime`: You can send any valid time string, but the **Backend will automatically recalculate** this based on the Package or Daily duration.

### Example Booking Request (Package)
```json
{
  "serviceId": "SERVICE_ID",
  "providerId": "PROVIDER_ID",
  "bookingDate": "2024-05-20",
  "startTime": "10:00",
  "endTime": "11:00", // Backend will change this to 16:00 if Gold Package is 6h
  "packageName": "Gold Package",
  "eventLocation": {
    "address": "123 Eiffel St",
    "city": "Paris",
    "country": "France"
  },
  "clientName": "John Doe",
  "clientEmail": "john@example.com"
}
```

---

## 3. Flutter Model Suggestions

### Service Model
Update your Service model to include the nested `pricingModel`.

```dart
class ServicePricingModel {
  final String type;
  final double? dailyRate;
  final int? dailyHours;
  final List<ServicePackage>? packages;

  ServicePricingModel({required this.type, this.dailyRate, this.dailyHours, this.packages});

  factory ServicePricingModel.fromJson(Map<String, dynamic> json) {
    return ServicePricingModel(
      type: json['type'],
      dailyRate: (json['dailyRate'] as num?)?.toDouble(),
      dailyHours: json['dailyHours'],
      packages: json['packages'] != null 
        ? (json['packages'] as List).map((p) => ServicePackage.fromJson(p)).toList()
        : null,
    );
  }
}

class ServicePackage {
  final String name;
  final double price;
  final int duration;
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
```

---

## 4. UI/UX Workflow for Booking
1. **Show Packages:** If `service.pricingType == 'PACKAGE'`, display the list of packages from `pricingModel.packages`.
2. **Selection:** Let the user select one.
3. **Date Selection:** Client picks a date.
4. **Time Selection:** Client picks a `startTime`. 
5. **Display Final Price:** Show the package price (e.g., €700) instead of the base hourly service price.
6. **Submit:** Send the booking request with the `packageName`.

> [!TIP]
> **Total Duration:** You don't need to calculate the `endTime` on the frontend for the API call, as the backend does it. However, it's good practice to show the user the "Expected End Time" (StartTime + Package Duration) in the UI before they confirm.

> [!IMPORTANT]
> **Deposit Logic:** The backend automatically calculates a **50% deposit** based on the package or daily price. This amount will be returned in the `paymentSession` for Stripe Checkout.
