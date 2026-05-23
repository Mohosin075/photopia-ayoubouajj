import cron from 'node-cron'
import { Notification } from './notification.model'
import { NotificationServices } from './notification.service'
import {
  NotificationStatus,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from './notification.interface'

import { User } from '../user/user.model'
import { Booking } from '../booking/booking.model'

export class NotificationScheduler {
  private static instance: NotificationScheduler

  private constructor() {
    this.initializeSchedulers()
  }

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler()
    }
    return NotificationScheduler.instance
  }

  private initializeSchedulers(): void {
    console.log('🕒 Initializing notification schedulers...')

    // Schedule 1: Process pending notifications every minute
    cron.schedule('* * * * *', async () => {
      await this.processPendingNotifications()
    })



    // Schedule 3: Clean up old archived notifications daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupArchivedNotifications()
    })

    // Schedule 4: Send welcome emails to new users (within last hour)
    cron.schedule('*/15 * * * *', async () => {
      // Every 15 minutes
      await this.sendWelcomeEmails()
    })

    // Schedule 5: Scan upcoming bookings and send client & pro reminders daily at 8 AM
    cron.schedule('0 8 * * *', async () => {
      await this.sendBookingReminders()
    })

    console.log('✅ Notification schedulers initialized')
  }

  private async processPendingNotifications(): Promise<void> {
    try {
      const pendingNotifications = await Notification.find({
        status: NotificationStatus.PENDING,
        scheduledAt: { $lte: new Date() },
        channel: { $ne: 'IN_APP' },
      }).limit(50)

      console.log(
        `📧 Processing ${pendingNotifications.length} pending notifications...`,
      )

      for (const notification of pendingNotifications) {
        try {
          await NotificationServices.sendNotificationEmail(notification)
        } catch (error: any) {
          console.error(
            `Failed to process notification ${notification._id}:`,
            error,
          )

          // Update status to failed after max retries
          const retryCount = (notification.metadata?.retryCount || 0) + 1
          if (retryCount >= 3) {
            await Notification.findByIdAndUpdate(notification._id, {
              status: NotificationStatus.FAILED,
              metadata: {
                ...notification.metadata,
                retryCount,
                lastError: error.message,
              },
            })
          } else {
            // Update retry count and reschedule for later
            await Notification.findByIdAndUpdate(notification._id, {
              scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes later
              metadata: {
                ...notification.metadata,
                retryCount,
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error)
    }
  }



  private async sendWelcomeEmails(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      // Find users created in the last hour who haven't received welcome email
      const newUsers = await User.find({
        createdAt: { $gte: oneHourAgo },
        'metadata.welcomeEmailSent': { $ne: true },
      })

      console.log(`👋 Found ${newUsers.length} new users to welcome`)

      for (const user of newUsers) {
        try {
          await NotificationServices.createNotification(
            {
              userId: user._id,
              title: 'Welcome to Photopya!',
              content: `Welcome aboard, ${user.name}! We're excited to have you join our community.`,
              type: NotificationType.WELCOME,
              channel: NotificationChannel.BOTH,
              priority: NotificationPriority.MEDIUM,
              metadata: {
                welcomeEmailSent: true,
              },
              actionUrl: `${process.env.CLIENT_URL}/dashboard`,
              actionText: 'Get Started',
            },
            true,
          )

          // Mark welcome email as sent in user metadata
          await User.findByIdAndUpdate(user._id, {
            $set: {
              'metadata.welcomeEmailSent': true,
              'metadata.welcomeEmailSentAt': new Date(),
            },
          })

          console.log(`Sent welcome email to: ${user.email}`)
        } catch (error) {
          console.error(`Failed to send welcome email to ${user.email}:`, error)
        }
      }
    } catch (error) {
      console.error('Error sending welcome emails:', error)
    }
  }

  private async cleanupArchivedNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const result = await Notification.deleteMany({
        isArchived: true,
        updatedAt: { $lte: thirtyDaysAgo },
      })

      console.log(
        `🧹 Cleaned up ${result.deletedCount} archived notifications older than 30 days`,
      )
    } catch (error) {
      console.error('Error cleaning up archived notifications:', error)
    }
  }

  private async sendBookingReminders(): Promise<void> {
    try {
      console.log('⏰ Scanning upcoming bookings for reminders...')
      const now = new Date()

      // Calculate date ranges
      const startOfDay = (days: number) => {
        const d = new Date(now)
        d.setDate(d.getDate() + days)
        d.setHours(0, 0, 0, 0)
        return d
      }
      const endOfDay = (days: number) => {
        const d = new Date(now)
        d.setDate(d.getDate() + days)
        d.setHours(23, 59, 59, 999)
        return d
      }

      const intervals = [
        {
          days: 7,
          label: '7-day',
          clientType: NotificationType.REMINDER_7D,
          proType: NotificationType.REMINDER_7D,
          clientChannel: NotificationChannel.BOTH,
          proChannel: NotificationChannel.BOTH,
          clientPriority: NotificationPriority.MEDIUM,
          proPriority: NotificationPriority.MEDIUM,
        },
        {
          days: 3,
          label: '3-day',
          clientType: NotificationType.REMINDER_3D,
          proType: NotificationType.REMINDER_3D,
          clientChannel: NotificationChannel.BOTH,
          proChannel: NotificationChannel.BOTH,
          clientPriority: NotificationPriority.HIGH,
          proPriority: NotificationPriority.HIGH,
        },
        {
          days: 1,
          label: '1-day',
          clientType: NotificationType.REMINDER_1D,
          proType: NotificationType.REMINDER_1D,
          clientChannel: NotificationChannel.ALL,
          proChannel: NotificationChannel.ALL,
          clientPriority: NotificationPriority.HIGH,
          proPriority: NotificationPriority.HIGH,
        },
        {
          days: 0,
          label: 'same-day',
          clientType: NotificationType.REMINDER_SAME_DAY,
          proType: NotificationType.REMINDER_SAME_DAY,
          clientChannel: NotificationChannel.BOTH,
          proChannel: NotificationChannel.BOTH,
          clientPriority: NotificationPriority.HIGH,
          proPriority: NotificationPriority.URGENT,
        },
      ]

      for (const interval of intervals) {
        const start = startOfDay(interval.days)
        const end = endOfDay(interval.days)

        // Find bookings scheduled inside this window
        const bookings = await Booking.find({
          bookingDate: { $gte: start, $lte: end },
          status: 'confirmed',
        })

        console.log(`⏰ Found ${bookings.length} confirmed bookings for ${interval.label} reminders.`)

        for (const booking of bookings as any[]) {
          try {
            const formattedDate = booking.bookingDate.toLocaleDateString()
            const time = booking.startTime

            // Prevent duplicate reminder sends in the same calendar day (Production Shield)
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)

            // 1. Client Reminder Check
            const existingClientReminder = await Notification.findOne({
              userId: booking.clientId,
              type: interval.clientType,
              'metadata.bookingId': booking._id.toString(),
              createdAt: { $gte: startOfDay },
            })

            if (!existingClientReminder) {
              // --- Send Client Reminder ---
              await NotificationServices.createNotification(
                {
                  userId: booking.clientId,
                  title: `${interval.label.toUpperCase()} Reminder: Photopya Booking`,
                  content: `Hi ${booking.clientName}, this is a reminder for your upcoming service on ${formattedDate} at ${time}.`,
                  type: interval.clientType,
                  channel: interval.clientChannel,
                  priority: interval.clientPriority,
                  metadata: {
                    bookingId: booking._id.toString(),
                    bookingNumber: booking.bookingNumber,
                  },
                  actionUrl: `/bookings/${booking._id}`,
                },
                interval.clientChannel === NotificationChannel.BOTH ||
                  interval.clientChannel === NotificationChannel.ALL,
              )
            } else {
              console.log(`[Reminder Shield] Client reminder already sent today for booking ${booking.bookingNumber}`)
            }

            // 2. Professional Reminder Check
            const existingProReminder = await Notification.findOne({
              userId: booking.providerId,
              type: interval.proType,
              'metadata.bookingId': booking._id.toString(),
              createdAt: { $gte: startOfDay },
            })

            if (!existingProReminder) {
              // --- Send Professional Reminder ---
              await NotificationServices.createNotification(
                {
                  userId: booking.providerId,
                  title: `${interval.label.toUpperCase()} Reminder: Client Session`,
                  content: `Hi Professional, you have an upcoming booking session with ${booking.clientName} on ${formattedDate} at ${time}.`,
                  type: interval.proType,
                  channel: interval.proChannel,
                  priority: interval.proPriority,
                  metadata: {
                    bookingId: booking._id.toString(),
                    bookingNumber: booking.bookingNumber,
                  },
                  actionUrl: `/bookings/${booking._id}`,
                },
                interval.proChannel === NotificationChannel.BOTH ||
                  interval.proChannel === NotificationChannel.ALL,
              )
            } else {
              console.log(`[Reminder Shield] Professional reminder already sent today for booking ${booking.bookingNumber}`)
            }
          } catch (err: any) {
            console.error(`Failed to send reminder for booking ${booking.bookingNumber}:`, err.message)
          }
        }
      }
    } catch (error) {
      console.error('Error in sendBookingReminders scheduler:', error)
    }
  }

  // Public method to manually trigger schedulers (for testing)
  async triggerManualSchedule(
    type: 'reminders' | 'welcome' | 'cleanup',
  ): Promise<void> {
    console.log(`🔧 Manually triggering scheduler: ${type}`)

    switch (type) {
      case 'reminders':
        await this.sendBookingReminders()
        break
      case 'welcome':
        await this.sendWelcomeEmails()
        break
      case 'cleanup':
        await this.cleanupArchivedNotifications()
        break
    }

    console.log(`✅ Manual scheduler completed: ${type}`)
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance()
