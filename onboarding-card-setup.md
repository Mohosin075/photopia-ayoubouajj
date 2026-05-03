# 🚀 Flutter Integration Guide - Recent Updates

This document covers the new API endpoints and data structures for **Payment Method Management** and the **Professional Profile Onboarding** (Sections 1-9).

---

## 1. Payment Method Management
These endpoints allow users to save, manage, and delete their credit/debit cards via Stripe.

### A. Add New Payment Method (Setup Intent)
To save a card without charging money, you must first get a `clientSecret`.
- **Endpoint**: `POST /api/v1/payment/create-setup-intent`
- **Auth**: Required (`USER` role)
- **Response**:
```json
{
  "success": true,
  "message": "Setup intent created successfully",
  "data": {
    "clientSecret": "seti_1P..."
  }
}
```
**Action**: Use this `clientSecret` with the `flutter_stripe` package's `confirmSetupIntent` method.

### B. List Saved Payment Methods
- **Endpoint**: `GET /api/v1/payment/methods`
- **Auth**: Required (`USER` role)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_1P...",
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025,
      "isDefault": true
    }
  ]
}
```

### C. Set Default Payment Method
- **Endpoint**: `PATCH /api/v1/payment/methods/:id/default`
- **Auth**: Required (`USER` role)

### D. Delete Payment Method
- **Endpoint**: `DELETE /api/v1/payment/methods/:id`
- **Auth**: Required (`USER` role)

---

## 2. Professional Profile Onboarding (Sections 1-9)
The `ProfessionalProfile` update now follows a structured 9-section template.

- **Endpoint**: `PATCH /api/v1/professional-profile/update` (or the relevant update endpoint)
- **Content-Type**: `application/json` (or `multipart/form-data` if uploading files)

### Data Structure (JSON Body)
```json
{
  "dateOfBirth": "1995-05-15", // REQUIRED
  "primaryDomain": ["Photography", "Videography"], // REQUIRED (Enum: Photography, Videography, Editing)
  "categories": ["65f...", "65g..."], // OPTIONAL (Array of Category ObjectIDs)
  
  "areaOfIntervention": { // OPTIONAL
    "mainCity": "Paris",
    "department": "75",
    "radius": "50km", // Options: 10km, 30km, 50km, 100km, whole France
    "availableForTravel": true
  },
  
  "experienceDetails": { // OPTIONAL
    "yearsOfExperience": "3-5 years", // Options: <1 year, 1-3 years, 3-5 years, 5-10 years, >10 years
    "projectsCompleted": "50-100", // Options: <10, 10-50, 50-100, >100
    "education": "Professional training" // Options: Self-taught, School, Professional training
  },
  
  "notificationPreferences": { // REQUIRED
    "emailNewRequests": true,
    "smsUrgentRequests": true,
    "newsletterPros": true,
    "customerReviewReminder": true
  },
  
  "legalNotice": { // REQUIRED (All must be true)
    "acceptedTerms": true,
    "privacyPolicy": true,
    "gdprAuthorization": true
  },
  
  "miniBio": "Professional photographer with 5 years of experience...", // OPTIONAL (Max 500 chars)
  "externalPortfolioLink": "https://portfolio.com", // OPTIONAL
  
  "specialties": ["Wedding", "Portrait"] // Existing field
}
```

### Important Notes:
1.  **Primary Domain**: This is now an **Enum**. Only `Photography`, `Videography`, and `Editing` are allowed.
2.  **Categories**: These should be the `_id` values from the Category API.
3.  **Legal Notice**: The API will validate that these are `true`.
4.  **Required Fields**: `dateOfBirth`, `primaryDomain`, `notificationPreferences`, and `legalNotice` are mandatory to successfully update the profile.

---

## 3. General Updates
- **Project Name**: The project has been renamed from **Photopia** to **Photopya**. Ensure all display text in the app is updated.
- **Messaging**: You can now send documents in messages. Use the `documents` field in the `multipart/form-data` request.
