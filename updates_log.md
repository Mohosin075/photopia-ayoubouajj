# Updates Log - Functional Services & Slot System

This document tracks all changes made to make "Service by Day" and "Service by Package" fully functional while maintaining a consistent slot system.

## Version 1.0.0

### Service Model & Validation
- [x] Updated `createServiceSchema` and `updateServiceSchema` to support `pricingModel` (including `dailyRate` and `packages` array).
- [x] Ensured `dailyHours` defaults to 8 if not provided.

### Booking Interface & Model
- [x] Added `packageName` to `IBooking` interface.
- [x] Added `packageName` to `bookingSchema` (Mongoose Model).

### Booking Validation
- [x] Updated `createBookingValidationSchema` (Zod) to include `packageName` as an optional string.

### Booking Service (Pricing & Creation)
- [x] Updated `calculatePrice` function:
    - Added support for `packageName`.
    - If `pricingType` is `PACKAGE`, it now searches for the package name in the service's `packages` array.
    - If found, it uses the package's specific `price` and `duration`.
    - If not found or if the service doesn't have packages, it falls back to the service's base `price`.
    - If `pricingType` is `DAILY`, it uses the `dailyRate` from the `pricingModel`.
- [x] Updated `createBooking` function:
    - Passes `packageName` from payload to the pricing logic.
    - Reordered logic to calculate price (and duration) *before* checking working hours and overlaps.
    - Automatically updates the booking's `endTime` based on the package/daily duration.

### Availability & Slot System
- [x] Verified that package-specific `duration` is correctly used during overlap checking.
- [x] Ensured `DAILY` service bookings use the correct `dailyHours` for slot blocking.

## Version 1.1.0 (Service-Level Add-ons & Pricing Security Validation)

### Service Schema & Models
- [x] Defined and added `IAddOn` interface containing `name`, `price`, and optional `description`.
- [x] Added `addOns` mongoose schema and sub-array inside `Service` Schema model.

### Service Validation
- [x] Included Zod schema validation for optional `addOns` array when creating or updating services.

### Booking System & Security Validation
- [x] Updated `createBookingValidationSchema` (Zod) to accept client-selected `customOptions` (Add-ons).
- [x] Enhanced `calculatePrice` helper with a `strictAddOnsCheck` security parameter:
  - If enabled (during dynamic price calculation and booking creation by client), it matches each selected option against the Service's predefined `addOns` list.
  - If a selected add-on does not exist on the service, or the price is tampered/changed, it immediately throws a `400 Bad Request` validation error.
- [x] Updated `BookingController.calculatePrice` to dynamically parse and forward `packageName` and `customOptions`.

