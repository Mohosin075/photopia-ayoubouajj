"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPriority = exports.NotificationStatus = exports.NotificationChannel = exports.NotificationType = void 0;
var NotificationType;
(function (NotificationType) {
    NotificationType["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    NotificationType["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    NotificationType["NEW_MESSAGE"] = "NEW_MESSAGE";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationType["PROMOTIONAL"] = "PROMOTIONAL";
    NotificationType["WELCOME"] = "WELCOME";
    NotificationType["PASSWORD_RESET"] = "PASSWORD_RESET";
    NotificationType["ACCOUNT_VERIFICATION"] = "ACCOUNT_VERIFICATION";
    // Bookings & Orders (Client & Pro)
    NotificationType["BOOKING_REQUEST_SENT"] = "BOOKING_REQUEST_SENT";
    NotificationType["BOOKING_ACCEPTED"] = "BOOKING_ACCEPTED";
    NotificationType["BOOKING_DECLINED"] = "BOOKING_DECLINED";
    NotificationType["BOOKING_EXPIRED"] = "BOOKING_EXPIRED";
    NotificationType["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    NotificationType["BOOKING_CANCELLED_BY_PRO"] = "BOOKING_CANCELLED_BY_PRO";
    NotificationType["BOOKING_CANCELLED_BY_CLIENT"] = "BOOKING_CANCELLED_BY_CLIENT";
    NotificationType["REFUND_PROCESSED"] = "REFUND_PROCESSED";
    NotificationType["DEPOSIT_DUE"] = "DEPOSIT_DUE";
    // Communication & Call
    NotificationType["UNREAD_MESSAGE_REMINDER"] = "UNREAD_MESSAGE_REMINDER";
    NotificationType["INCOMING_VIDEO_CALL"] = "INCOMING_VIDEO_CALL";
    NotificationType["URGENT_MESSAGE"] = "URGENT_MESSAGE";
    // Reminders
    NotificationType["REMINDER_7D"] = "REMINDER_7D";
    NotificationType["REMINDER_3D"] = "REMINDER_3D";
    NotificationType["REMINDER_1D"] = "REMINDER_1D";
    NotificationType["REMINDER_SAME_DAY"] = "REMINDER_SAME_DAY";
    NotificationType["PREPARATION_REMINDER"] = "PREPARATION_REMINDER";
    NotificationType["SERVICE_START"] = "SERVICE_START";
    NotificationType["SERVICE_END"] = "SERVICE_END";
    NotificationType["SERVICE_COMPLETED"] = "SERVICE_COMPLETED";
    // Reviews
    NotificationType["REVIEW_REQUEST"] = "REVIEW_REQUEST";
    NotificationType["REVIEW_PENDING_REMINDER"] = "REVIEW_PENDING_REMINDER";
    NotificationType["REVIEW_FINAL_REMINDER"] = "REVIEW_FINAL_REMINDER";
    NotificationType["REVIEW_PUBLISHED"] = "REVIEW_PUBLISHED";
    NotificationType["PRO_RESPONSE"] = "PRO_RESPONSE";
    NotificationType["NEGATIVE_REVIEW"] = "NEGATIVE_REVIEW";
    // Payments & Finance
    NotificationType["INVOICE_AVAILABLE"] = "INVOICE_AVAILABLE";
    NotificationType["REFUND_IN_PROGRESS"] = "REFUND_IN_PROGRESS";
    NotificationType["TRANSFER_IN_PROGRESS"] = "TRANSFER_IN_PROGRESS";
    NotificationType["TRANSFER_COMPLETED"] = "TRANSFER_COMPLETED";
    NotificationType["TRANSFER_FAILED"] = "TRANSFER_FAILED";
    NotificationType["MONTHLY_EARNINGS"] = "MONTHLY_EARNINGS";
    // Alerts & Security
    NotificationType["SUSPICIOUS_LOGIN"] = "SUSPICIOUS_LOGIN";
    NotificationType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    NotificationType["VERIFICATION_IN_PROGRESS"] = "VERIFICATION_IN_PROGRESS";
    NotificationType["VERIFICATION_APPROVED"] = "VERIFICATION_APPROVED";
    NotificationType["VERIFICATION_REJECTED"] = "VERIFICATION_REJECTED";
    NotificationType["DOCUMENTS_EXPIRED"] = "DOCUMENTS_EXPIRED";
    NotificationType["BANK_INFO_EXPIRED"] = "BANK_INFO_EXPIRED";
    // Listings & Performance (Pro specific)
    NotificationType["LISTING_VIEW_SPIKE"] = "LISTING_VIEW_SPIKE";
    NotificationType["UNANSWERED_MESSAGE_6H"] = "UNANSWERED_MESSAGE_6H";
    NotificationType["UNDERPERFORMING_LISTING"] = "UNDERPERFORMING_LISTING";
    NotificationType["LISTING_EXPIRED"] = "LISTING_EXPIRED";
    NotificationType["LISTING_PENDING"] = "LISTING_PENDING";
    NotificationType["LISTING_REJECTED"] = "LISTING_REJECTED";
    NotificationType["LISTING_APPROVED"] = "LISTING_APPROVED";
    NotificationType["PHOTOS_REJECTED"] = "PHOTOS_REJECTED";
    // Calendar
    NotificationType["CONFLICT_DETECTED"] = "CONFLICT_DETECTED";
    NotificationType["CALENDAR_UPDATE_REMINDER"] = "CALENDAR_UPDATE_REMINDER";
    NotificationType["PERIOD_FULLY_BOOKED"] = "PERIOD_FULLY_BOOKED";
    NotificationType["ALTERNATIVE_DATE_REQUESTED"] = "ALTERNATIVE_DATE_REQUESTED";
    // Account Status
    NotificationType["PREMIUM_STATUS"] = "PREMIUM_STATUS";
    NotificationType["PREMIUM_EXPIRING_SOON"] = "PREMIUM_EXPIRING_SOON";
    NotificationType["PREMIUM_EXPIRED"] = "PREMIUM_EXPIRED";
    NotificationType["RENEWAL_SUCCESSFUL"] = "RENEWAL_SUCCESSFUL";
    NotificationType["PREMIUM_PAYMENT_FAILED"] = "PREMIUM_PAYMENT_FAILED";
    // Promotions & Offers
    NotificationType["PROMO_CODE_RECEIVED"] = "PROMO_CODE_RECEIVED";
    NotificationType["OFFER_EXPIRING_SOON"] = "OFFER_EXPIRING_SOON";
    NotificationType["BIRTHDAY"] = "BIRTHDAY";
    NotificationType["REFERRAL_SUCCESS"] = "REFERRAL_SUCCESS";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "IN_APP";
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["BOTH"] = "BOTH";
    NotificationChannel["ALL"] = "ALL";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "PENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["FAILED"] = "FAILED";
    NotificationStatus["READ"] = "READ";
    NotificationStatus["ARCHIVED"] = "ARCHIVED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
