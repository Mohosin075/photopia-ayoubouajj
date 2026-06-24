"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationScheduler = exports.NotificationScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notification_model_1 = require("./notification.model");
const notification_service_1 = require("./notification.service");
const notification_interface_1 = require("./notification.interface");
const user_model_1 = require("../user/user.model");
const booking_model_1 = require("../booking/booking.model");
class NotificationScheduler {
    constructor() {
        this.initializeSchedulers();
    }
    static getInstance() {
        if (!NotificationScheduler.instance) {
            NotificationScheduler.instance = new NotificationScheduler();
        }
        return NotificationScheduler.instance;
    }
    initializeSchedulers() {
        console.log('🕒 Initializing notification schedulers...');
        // Schedule 1: Process pending notifications every minute
        node_cron_1.default.schedule('* * * * *', async () => {
            await this.processPendingNotifications();
        });
        // Schedule 3: Clean up old archived notifications daily at 2 AM
        node_cron_1.default.schedule('0 2 * * *', async () => {
            await this.cleanupArchivedNotifications();
        });
        // Schedule 4: Send welcome emails to new users (within last hour)
        node_cron_1.default.schedule('*/15 * * * *', async () => {
            // Every 15 minutes
            await this.sendWelcomeEmails();
        });
        // Schedule 5: Scan upcoming bookings and send client & pro reminders daily at 8 AM
        node_cron_1.default.schedule('0 8 * * *', async () => {
            await this.sendBookingReminders();
        });
        console.log('✅ Notification schedulers initialized');
    }
    async processPendingNotifications() {
        var _a;
        try {
            const pendingNotifications = await notification_model_1.Notification.find({
                status: notification_interface_1.NotificationStatus.PENDING,
                scheduledAt: { $lte: new Date() },
                channel: { $ne: 'IN_APP' },
            }).limit(50);
            console.log(`📧 Processing ${pendingNotifications.length} pending notifications...`);
            for (const notification of pendingNotifications) {
                try {
                    await notification_service_1.NotificationServices.sendNotificationEmail(notification);
                }
                catch (error) {
                    console.error(`Failed to process notification ${notification._id}:`, error);
                    // Update status to failed after max retries
                    const retryCount = (((_a = notification.metadata) === null || _a === void 0 ? void 0 : _a.retryCount) || 0) + 1;
                    if (retryCount >= 3) {
                        await notification_model_1.Notification.findByIdAndUpdate(notification._id, {
                            status: notification_interface_1.NotificationStatus.FAILED,
                            metadata: {
                                ...notification.metadata,
                                retryCount,
                                lastError: error.message,
                            },
                        });
                    }
                    else {
                        // Update retry count and reschedule for later
                        await notification_model_1.Notification.findByIdAndUpdate(notification._id, {
                            scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes later
                            metadata: {
                                ...notification.metadata,
                                retryCount,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error processing pending notifications:', error);
        }
    }
    async sendWelcomeEmails() {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            // Find users created in the last hour who haven't received welcome email
            const newUsers = await user_model_1.User.find({
                createdAt: { $gte: oneHourAgo },
                'metadata.welcomeEmailSent': { $ne: true },
            });
            console.log(`👋 Found ${newUsers.length} new users to welcome`);
            for (const user of newUsers) {
                try {
                    await notification_service_1.NotificationServices.createNotification({
                        userId: user._id,
                        title: 'Welcome to Photopya!',
                        content: `Welcome aboard, ${user.name}! We're excited to have you join our community.`,
                        type: notification_interface_1.NotificationType.WELCOME,
                        channel: notification_interface_1.NotificationChannel.BOTH,
                        priority: notification_interface_1.NotificationPriority.MEDIUM,
                        metadata: {
                            welcomeEmailSent: true,
                        },
                        actionUrl: `${process.env.CLIENT_URL}/dashboard`,
                        actionText: 'Get Started',
                    }, true);
                    // Mark welcome email as sent in user metadata
                    await user_model_1.User.findByIdAndUpdate(user._id, {
                        $set: {
                            'metadata.welcomeEmailSent': true,
                            'metadata.welcomeEmailSentAt': new Date(),
                        },
                    });
                    console.log(`Sent welcome email to: ${user.email}`);
                }
                catch (error) {
                    console.error(`Failed to send welcome email to ${user.email}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error sending welcome emails:', error);
        }
    }
    async cleanupArchivedNotifications() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const result = await notification_model_1.Notification.deleteMany({
                isArchived: true,
                updatedAt: { $lte: thirtyDaysAgo },
            });
            console.log(`🧹 Cleaned up ${result.deletedCount} archived notifications older than 30 days`);
        }
        catch (error) {
            console.error('Error cleaning up archived notifications:', error);
        }
    }
    async sendBookingReminders() {
        try {
            console.log('⏰ Scanning upcoming bookings for reminders...');
            const now = new Date();
            // Calculate date ranges
            const startOfDay = (days) => {
                const d = new Date(now);
                d.setDate(d.getDate() + days);
                d.setHours(0, 0, 0, 0);
                return d;
            };
            const endOfDay = (days) => {
                const d = new Date(now);
                d.setDate(d.getDate() + days);
                d.setHours(23, 59, 59, 999);
                return d;
            };
            const intervals = [
                {
                    days: 7,
                    label: '7-day',
                    clientType: notification_interface_1.NotificationType.REMINDER_7D,
                    proType: notification_interface_1.NotificationType.REMINDER_7D,
                    clientChannel: notification_interface_1.NotificationChannel.BOTH,
                    proChannel: notification_interface_1.NotificationChannel.BOTH,
                    clientPriority: notification_interface_1.NotificationPriority.MEDIUM,
                    proPriority: notification_interface_1.NotificationPriority.MEDIUM,
                },
                {
                    days: 3,
                    label: '3-day',
                    clientType: notification_interface_1.NotificationType.REMINDER_3D,
                    proType: notification_interface_1.NotificationType.REMINDER_3D,
                    clientChannel: notification_interface_1.NotificationChannel.BOTH,
                    proChannel: notification_interface_1.NotificationChannel.BOTH,
                    clientPriority: notification_interface_1.NotificationPriority.HIGH,
                    proPriority: notification_interface_1.NotificationPriority.HIGH,
                },
                {
                    days: 1,
                    label: '1-day',
                    clientType: notification_interface_1.NotificationType.REMINDER_1D,
                    proType: notification_interface_1.NotificationType.REMINDER_1D,
                    clientChannel: notification_interface_1.NotificationChannel.ALL,
                    proChannel: notification_interface_1.NotificationChannel.ALL,
                    clientPriority: notification_interface_1.NotificationPriority.HIGH,
                    proPriority: notification_interface_1.NotificationPriority.HIGH,
                },
                {
                    days: 0,
                    label: 'same-day',
                    clientType: notification_interface_1.NotificationType.REMINDER_SAME_DAY,
                    proType: notification_interface_1.NotificationType.REMINDER_SAME_DAY,
                    clientChannel: notification_interface_1.NotificationChannel.BOTH,
                    proChannel: notification_interface_1.NotificationChannel.BOTH,
                    clientPriority: notification_interface_1.NotificationPriority.HIGH,
                    proPriority: notification_interface_1.NotificationPriority.URGENT,
                },
            ];
            for (const interval of intervals) {
                const start = startOfDay(interval.days);
                const end = endOfDay(interval.days);
                // Find bookings scheduled inside this window
                const bookings = await booking_model_1.Booking.find({
                    bookingDate: { $gte: start, $lte: end },
                    status: 'confirmed',
                });
                console.log(`⏰ Found ${bookings.length} confirmed bookings for ${interval.label} reminders.`);
                for (const booking of bookings) {
                    try {
                        const formattedDate = booking.bookingDate.toLocaleDateString();
                        const time = booking.startTime;
                        // Prevent duplicate reminder sends in the same calendar day (Production Shield)
                        const startOfDay = new Date();
                        startOfDay.setHours(0, 0, 0, 0);
                        // 1. Client Reminder Check
                        const existingClientReminder = await notification_model_1.Notification.findOne({
                            userId: booking.clientId,
                            type: interval.clientType,
                            'metadata.bookingId': booking._id.toString(),
                            createdAt: { $gte: startOfDay },
                        });
                        if (!existingClientReminder) {
                            // --- Send Client Reminder ---
                            await notification_service_1.NotificationServices.createNotification({
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
                            }, interval.clientChannel === notification_interface_1.NotificationChannel.BOTH ||
                                interval.clientChannel === notification_interface_1.NotificationChannel.ALL);
                        }
                        else {
                            console.log(`[Reminder Shield] Client reminder already sent today for booking ${booking.bookingNumber}`);
                        }
                        // 2. Professional Reminder Check
                        const existingProReminder = await notification_model_1.Notification.findOne({
                            userId: booking.providerId,
                            type: interval.proType,
                            'metadata.bookingId': booking._id.toString(),
                            createdAt: { $gte: startOfDay },
                        });
                        if (!existingProReminder) {
                            // --- Send Professional Reminder ---
                            await notification_service_1.NotificationServices.createNotification({
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
                            }, interval.proChannel === notification_interface_1.NotificationChannel.BOTH ||
                                interval.proChannel === notification_interface_1.NotificationChannel.ALL);
                        }
                        else {
                            console.log(`[Reminder Shield] Professional reminder already sent today for booking ${booking.bookingNumber}`);
                        }
                    }
                    catch (err) {
                        console.error(`Failed to send reminder for booking ${booking.bookingNumber}:`, err.message);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in sendBookingReminders scheduler:', error);
        }
    }
    // Public method to manually trigger schedulers (for testing)
    async triggerManualSchedule(type) {
        console.log(`🔧 Manually triggering scheduler: ${type}`);
        switch (type) {
            case 'reminders':
                await this.sendBookingReminders();
                break;
            case 'welcome':
                await this.sendWelcomeEmails();
                break;
            case 'cleanup':
                await this.cleanupArchivedNotifications();
                break;
        }
        console.log(`✅ Manual scheduler completed: ${type}`);
    }
}
exports.NotificationScheduler = NotificationScheduler;
// Export singleton instance
exports.notificationScheduler = NotificationScheduler.getInstance();
