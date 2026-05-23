import { Model, Types } from 'mongoose'

export interface INotification {
  _id: Types.ObjectId
  userId: Types.ObjectId
  title: string
  content: string
  type: NotificationType
  channel: NotificationChannel
  status: NotificationStatus
  priority: NotificationPriority
  metadata?: Record<string, any>
  scheduledAt?: Date
  sentAt?: Date
  readAt?: Date
  actionUrl?: string
  actionText?: string
  actionClickedAt?: Date
  isRead: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export enum NotificationType {
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PROMOTIONAL = 'PROMOTIONAL',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',

  // Bookings & Orders (Client & Pro)
  BOOKING_REQUEST_SENT = 'BOOKING_REQUEST_SENT',
  BOOKING_ACCEPTED = 'BOOKING_ACCEPTED',
  BOOKING_DECLINED = 'BOOKING_DECLINED',
  BOOKING_EXPIRED = 'BOOKING_EXPIRED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED_BY_PRO = 'BOOKING_CANCELLED_BY_PRO',
  BOOKING_CANCELLED_BY_CLIENT = 'BOOKING_CANCELLED_BY_CLIENT',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  DEPOSIT_DUE = 'DEPOSIT_DUE',

  // Communication & Call
  UNREAD_MESSAGE_REMINDER = 'UNREAD_MESSAGE_REMINDER',
  INCOMING_VIDEO_CALL = 'INCOMING_VIDEO_CALL',
  URGENT_MESSAGE = 'URGENT_MESSAGE',

  // Reminders
  REMINDER_7D = 'REMINDER_7D',
  REMINDER_3D = 'REMINDER_3D',
  REMINDER_1D = 'REMINDER_1D',
  REMINDER_SAME_DAY = 'REMINDER_SAME_DAY',
  PREPARATION_REMINDER = 'PREPARATION_REMINDER',
  SERVICE_START = 'SERVICE_START',
  SERVICE_END = 'SERVICE_END',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',

  // Reviews
  REVIEW_REQUEST = 'REVIEW_REQUEST',
  REVIEW_PENDING_REMINDER = 'REVIEW_PENDING_REMINDER',
  REVIEW_FINAL_REMINDER = 'REVIEW_FINAL_REMINDER',
  REVIEW_PUBLISHED = 'REVIEW_PUBLISHED',
  PRO_RESPONSE = 'PRO_RESPONSE',
  NEGATIVE_REVIEW = 'NEGATIVE_REVIEW',

  // Payments & Finance
  INVOICE_AVAILABLE = 'INVOICE_AVAILABLE',
  REFUND_IN_PROGRESS = 'REFUND_IN_PROGRESS',
  TRANSFER_IN_PROGRESS = 'TRANSFER_IN_PROGRESS',
  TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  MONTHLY_EARNINGS = 'MONTHLY_EARNINGS',

  // Alerts & Security
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  VERIFICATION_IN_PROGRESS = 'VERIFICATION_IN_PROGRESS',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  DOCUMENTS_EXPIRED = 'DOCUMENTS_EXPIRED',
  BANK_INFO_EXPIRED = 'BANK_INFO_EXPIRED',

  // Listings & Performance (Pro specific)
  LISTING_VIEW_SPIKE = 'LISTING_VIEW_SPIKE',
  UNANSWERED_MESSAGE_6H = 'UNANSWERED_MESSAGE_6H',
  UNDERPERFORMING_LISTING = 'UNDERPERFORMING_LISTING',
  LISTING_EXPIRED = 'LISTING_EXPIRED',
  LISTING_PENDING = 'LISTING_PENDING',
  LISTING_REJECTED = 'LISTING_REJECTED',
  LISTING_APPROVED = 'LISTING_APPROVED',
  PHOTOS_REJECTED = 'PHOTOS_REJECTED',

  // Calendar
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  CALENDAR_UPDATE_REMINDER = 'CALENDAR_UPDATE_REMINDER',
  PERIOD_FULLY_BOOKED = 'PERIOD_FULLY_BOOKED',
  ALTERNATIVE_DATE_REQUESTED = 'ALTERNATIVE_DATE_REQUESTED',

  // Account Status
  PREMIUM_STATUS = 'PREMIUM_STATUS',
  PREMIUM_EXPIRING_SOON = 'PREMIUM_EXPIRING_SOON',
  PREMIUM_EXPIRED = 'PREMIUM_EXPIRED',
  RENEWAL_SUCCESSFUL = 'RENEWAL_SUCCESSFUL',
  PREMIUM_PAYMENT_FAILED = 'PREMIUM_PAYMENT_FAILED',

  // Promotions & Offers
  PROMO_CODE_RECEIVED = 'PROMO_CODE_RECEIVED',
  OFFER_EXPIRING_SOON = 'OFFER_EXPIRING_SOON',
  BIRTHDAY = 'BIRTHDAY',
  REFERRAL_SUCCESS = 'REFERRAL_SUCCESS',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  BOTH = 'BOTH',
  ALL = 'ALL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface INotificationFilterables {
  searchTerm?: string
  userId?: string
  type?: NotificationType
  channel?: NotificationChannel
  status?: NotificationStatus
  priority?: NotificationPriority
  isRead?: boolean
  isArchived?: boolean
  startDate?: string
  endDate?: string
}

export interface EmailNotificationData {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, any>
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer | string
    contentType?: string
  }>
}

export interface CreateNotificationDto {
  userId: string | Types.ObjectId
  title: string
  content: string
  type: NotificationType
  channel?: NotificationChannel
  priority?: NotificationPriority
  metadata?: Record<string, any>
  scheduledAt?: Date
  actionUrl?: string
  actionText?: string
}

export type NotificationModel = Model<INotification, {}, {}>

export interface INotificationStats {
  total: number
  unread: number
  byType: Record<string, number>
  byChannel: Record<string, number>
  byStatus: Record<string, number>
}

export interface INotificationAnalytics {
  openRate: number // Percentage of notifications that were opened/read
  engagement: number // Percentage of notifications that had user interaction (clicked action URL)
}

export interface INotificationWithAnalytics extends INotification {
  analytics?: INotificationAnalytics
}
