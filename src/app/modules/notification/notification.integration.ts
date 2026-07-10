import { Types } from 'mongoose'
import { NotificationServices } from './notification.service'
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from './notification.interface'
import { Payment } from '../payment/payment.model'
import { User } from '../user/user.model'

export class NotificationIntegration {
  static async onPaymentSuccess(
    paymentId: Types.ObjectId | string,
  ): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId).populate(
        'userId',
        'email name',
      )

      if (!payment) return

      await NotificationServices.createNotification(
        {
          userId: payment.userId._id,
          title: 'Payment Successful',
          content: `Your payment of ${payment.amount} ${payment.currency} was successful.`,
          type: NotificationType.PAYMENT_SUCCESS,
          channel: NotificationChannel.ALL,
          priority: NotificationPriority.HIGH,
          metadata: {
            paymentId: payment._id,
          },
          actionUrl: `${process.env.CLIENT_URL}/payments/${payment._id}`,
          actionText: 'View Receipt',
        },
        true,
      )
    } catch (error) {
      console.error('Error creating payment success notification:', error)
    }
  }

  static async onPaymentFailed(
    paymentId: Types.ObjectId | string,
  ): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId).populate(
        'userId',
        'email name',
      )

      if (!payment) return

      await NotificationServices.createNotification(
        {
          userId: payment.userId._id,
          title: 'Payment Failed',
          content: `Your payment failed. Please try again.`,
          type: NotificationType.PAYMENT_FAILED,
          channel: NotificationChannel.ALL,
          priority: NotificationPriority.URGENT,
          metadata: {
            paymentId: payment._id,
          },
          actionUrl: `${process.env.CLIENT_URL}/payments/${payment._id}/retry`,
          actionText: 'Retry Payment',
        },
        true,
      )
    } catch (error) {
      console.error('Error creating payment failed notification:', error)
    }
  }

  static async onNewMessage(
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId,
    message: string,
    chatId?: Types.ObjectId | string,
  ): Promise<void> {
    try {
      await NotificationServices.createNotification({
        userId: receiverId,
        title: 'New Message',
        content: `You have a new message: "${message.substring(0, 100)}..."`,
        type: NotificationType.NEW_MESSAGE,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          senderId,
          messagePreview: message.substring(0, 100),
          chatId: chatId ? chatId.toString() : undefined,
        },
        actionUrl: `${process.env.CLIENT_URL}/messages/${senderId}`,
        actionText: 'View Message',
      })
    } catch (error) {
      console.error('Error creating message notification:', error)
    }
  }

  static async sendPasswordReset(
    userId: Types.ObjectId,
    resetCode: string,
  ): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      await NotificationServices.createNotification(
        {
          userId: user._id,
          title: 'Password Reset Request',
          content: `Use this code to reset your password: ${resetCode}`,
          type: NotificationType.PASSWORD_RESET,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.URGENT,
          metadata: {
            resetCode,
          },
        },
        true,
      )
    } catch (error) {
      console.error('Error creating password reset notification:', error)
    }
  }

  static async sendAccountVerification(
    userId: Types.ObjectId,
    verificationToken: string,
  ): Promise<void> {
    try {
      const user = await User.findById(userId)
      if (!user) return

      await NotificationServices.createNotification(
        {
          userId: user._id,
          title: 'Verify Your Account',
          content:
            'Please verify your email address to complete your registration.',
          type: NotificationType.ACCOUNT_VERIFICATION,
          channel: NotificationChannel.EMAIL,
          priority: NotificationPriority.HIGH,
          metadata: {
            verificationToken,
          },
        },
        true,
      )
    } catch (error) {
      console.error('Error creating account verification notification:', error)
    }
  }

  static async onBookingRequested(booking: any): Promise<void> {
    try {
      await NotificationServices.createNotification({
        userId: booking.clientId,
        title: 'Booking Request Sent 📅',
        content: `Your booking request for service was sent. Booking #: ${booking.bookingNumber}`,
        type: NotificationType.BOOKING_REQUEST_SENT,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/bookings/${booking._id}`,
        actionText: 'View Details',
      })

      await NotificationServices.createNotification({
        userId: booking.providerId,
        title: 'New Booking Request 📅',
        content: `You received a new booking request from ${booking.clientName || 'Client'}. Booking #: ${booking.bookingNumber}`,
        type: NotificationType.BOOKING_REQUEST_SENT,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.HIGH,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/bookings/${booking._id}`,
        actionText: 'View Details',
      })
    } catch (error) {
      console.error('Error in onBookingRequested notification:', error)
    }
  }

  static async onBookingConfirmed(booking: any): Promise<void> {
    try {
      await NotificationServices.createNotification({
        userId: booking.clientId,
        title: 'Booking Confirmed 🎉',
        content: `Your booking has been confirmed by the provider. Booking #: ${booking.bookingNumber}`,
        type: NotificationType.BOOKING_CONFIRMED,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.HIGH,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/bookings/${booking._id}`,
        actionText: 'View Details',
      })

      await NotificationServices.createNotification({
        userId: booking.providerId,
        title: 'Booking Confirmed 🎉',
        content: `Booking session with ${booking.clientName || 'Client'} is confirmed. Booking #: ${booking.bookingNumber}`,
        type: NotificationType.BOOKING_CONFIRMED,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.HIGH,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/bookings/${booking._id}`,
        actionText: 'View Details',
      })
    } catch (error) {
      console.error('Error in onBookingConfirmed notification:', error)
    }
  }

  static async onBookingCancelled(booking: any, cancelledByUserId: string): Promise<void> {
    try {
      const isClient = booking.clientId.toString() === cancelledByUserId.toString()
      const targetUserId = isClient ? booking.providerId : booking.clientId
      const title = 'Booking Cancelled ❌'
      const content = isClient
        ? `Client ${booking.clientName || 'Client'} cancelled booking #${booking.bookingNumber}.`
        : `Provider cancelled your booking #${booking.bookingNumber}.`
      
      const notifType = isClient 
        ? NotificationType.BOOKING_CANCELLED_BY_CLIENT 
        : NotificationType.BOOKING_CANCELLED_BY_PRO

      await NotificationServices.createNotification({
        userId: targetUserId,
        title,
        content,
        type: notifType,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.HIGH,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/bookings/${booking._id}`,
        actionText: 'View Details',
      })
    } catch (error) {
      console.error('Error in onBookingCancelled notification:', error)
    }
  }

  static async onBookingCompleted(booking: any): Promise<void> {
    try {
      await NotificationServices.createNotification({
        userId: booking.clientId,
        title: 'Service Completed 🌟',
        content: `Your service is marked as completed. Please leave a review for your provider!`,
        type: NotificationType.SERVICE_COMPLETED,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/bookings/${booking._id}/review`,
        actionText: 'Write Review',
      })

      await NotificationServices.createNotification({
        userId: booking.providerId,
        title: 'Earnings Credited 💰',
        content: `Booking #${booking.bookingNumber} is completed. Earnings have been credited to your wallet.`,
        type: NotificationType.TRANSFER_COMPLETED,
        channel: NotificationChannel.PUSH,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
        actionUrl: `/wallet`,
        actionText: 'Go to Wallet',
      })
    } catch (error) {
      console.error('Error in onBookingCompleted notification:', error)
    }
  }
}

export default NotificationIntegration
