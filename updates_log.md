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

## Version 1.2.0 (Dynamic Deposit Configuration & 0% Default)

### Service Schema Updates
- [x] Changed `depositPercentage` default inside `Service` schema from `0.5` (50%) to `0` (0% deposit).
- [x] Allows professionals to hide the deposit setting on the frontend (saving `0` as the default).

### Booking Pricing & Payment Integration
- [x] Modified booking creation flow in `booking.service.ts` to dynamically fetch the service's `depositPercentage` rather than using a hardcoded `0.5` (50%).
- [x] Implemented seamless **0% upfront deposit support**: If the service has a `0%` deposit configured, it bypasses Stripe PaymentIntent / Stripe Checkout session generation, marking the booking directly and returning `payment: null` safely.
- [x] Updated `modifyBookingOffer` to fetch `depositPercentage` from the corresponding service dynamically.

## Version 1.3.0 (Per-Service Auto-Accept Bookings Rules)

### Service Schema & Validations
- [x] Added `autoAcceptBookings` object to `IService` interface in `service.interface.ts`.
- [x] Registered `autoAcceptBookings` sub-schema in the `Service` mongoose model in `service.model.ts` with default values:
  - `enabled: false`
  - `minimumBudget: 0`
  - `withinRadiusKm: 30`
  - `verifiedClientsOnly: false`
- [x] Implemented Zod validations under `createServiceSchema` and `updateServiceSchema` inside `service.validation.ts` to accept the rules parameters.

### Booking Auto-Accept Integration & Pipeline
- [x] In booking creation (`createBooking` inside `booking.service.ts`), fetched the provider's `Service` details.
- [x] Integrated rule matching checks directly from the selected Service:
  - **Budget rule:** Evaluated if booking budget is at or above the service's minimum budget threshold.
  - **Distance radius rule:** Evaluated if event distance is within the service's allowed radius.
  - **Verification rule:** Evaluated if client is a verified user.
- [x] Automatically sets booking status to `confirmed` and updates `confirmedAt` if all conditions match, else defaults to `pending` status.
- [x] Completely cleaned up all legacy global `autoAcceptBookings` configurations in `ProfessionalProfile` schema, interface, and validations.

## Version 1.4.0 (Dual-Level Availability Slots: Per-Service & Global)

### Availability Schema Updates
- [x] Uncommented and enabled `serviceId?: Types.ObjectId` in `IAvailability` interface.
- [x] Uncommented and registered `serviceId` inside `Availability` mongoose model schema, referencing `'Service'` with indexing.

### Availability Queries with Fallback Engine
- [x] Refactored `AvailabilityService`:
  - `createOrUpdateAvailability`: Queries/updates specific service availability if `serviceId` is present, else targets global settings.
  - `getProviderAvailability`: Queries specific service settings with fallback filters.
  - `checkAvailabilityForDate`: Implemented a robust fallback engine—first queries availability specific to the service, and if not found, falls back to the global calendar settings.
  - `getAvailableTimeSlots` & `getMonthCalendar`: Enabled optional `serviceId` argument and forwarded to the fallback engine.

### Controller & Validation Integration
- [x] Updated all Express endpoints in `availability.controller.ts` (`getMyAvailability`, `getProviderAvailability`, `checkDateAvailability`, `getTimeSlots`, `getMonthCalendar`) to retrieve `serviceId` from query strings and forward them to the database services.
- [x] Updated booking creation flow in `booking.service.ts` to forward `serviceId` during availability validation checks.
