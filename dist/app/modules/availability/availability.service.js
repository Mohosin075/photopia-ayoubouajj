"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const availability_model_1 = require("./availability.model");
const mongoose_1 = require("mongoose");
const createOrUpdateAvailability = async (providerId, payload) => {
    const isExist = await availability_model_1.Availability.findOne({ providerId });
    if (isExist) {
        const result = await availability_model_1.Availability.findOneAndUpdate({ providerId }, payload, {
            new: true,
            runValidators: true,
        });
        return result;
    }
    else {
        const result = await availability_model_1.Availability.create({ ...payload, providerId });
        return result;
    }
};
const getProviderAvailability = async (providerId) => {
    const result = await availability_model_1.Availability.findOne({ providerId });
    return result;
};
const checkAvailabilityForDate = async (providerId, date) => {
    const availability = await availability_model_1.Availability.findOne({ providerId });
    if (!availability) {
        return { isAvailable: false, reason: 'Provider has not set availability' };
    }
    const targetDate = new Date(date);
    // 1. Check specific custom dates (overrides everything)
    const customDate = availability.customDates.find((cd) => new Date(cd.date).toDateString() === targetDate.toDateString());
    if (customDate) {
        if (customDate.type === 'blocked' || customDate.type === 'unavailable') {
            return { isAvailable: false, reason: 'Date is specifically blocked by provider' };
        }
        return {
            isAvailable: true,
            workingHours: { start: customDate.start || '09:00', end: customDate.end || '17:00' }, // Fallback if missing
            pricing: {
                priceOverride: customDate.priceOverride,
                rateMultiplier: customDate.rateMultiplier
            }
        };
    }
    // 2. Check recurring rules
    // Sort rules needed? Assuming order doesn't matter much for now or 'block' takes precedence
    if (availability.recurringRules && availability.recurringRules.length > 0) {
        for (const rule of availability.recurringRules) {
            if (!rule.active)
                continue;
            // Weekday check
            if (rule.type === 'block_weekly' || rule.type === 'special_hours_weekly') {
                if (rule.dayOfWeek !== undefined && rule.dayOfWeek === targetDate.getDay()) {
                    if (rule.type === 'block_weekly') {
                        return { isAvailable: false, reason: 'Date matches a recurring block rule' };
                    }
                    if (rule.type === 'special_hours_weekly' && rule.start && rule.end) {
                        return {
                            isAvailable: true,
                            workingHours: { start: rule.start, end: rule.end }
                        };
                    }
                }
            }
            // Monthly check (e.g., 2nd week of month)
            if (rule.type === 'block_monthly') {
                // Calculate week of month
                const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                const dayOfMonth = targetDate.getDate();
                const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
                if (rule.weekOfMonth !== undefined && rule.weekOfMonth === weekOfMonth) {
                    return { isAvailable: false, reason: 'Date matches a recurring monthly block rule' };
                }
            }
        }
    }
    // 3. Check default schedule
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[targetDate.getDay()];
    const daySchedule = availability.defaultSchedule[dayName];
    if (!daySchedule || !daySchedule.isActive) {
        return { isAvailable: false, reason: 'Day is not a working day in default schedule' };
    }
    return {
        isAvailable: true,
        workingHours: { start: daySchedule.start, end: daySchedule.end }
    };
};
const getAvailableTimeSlots = async (providerId, date, serviceDuration) => {
    const availability = await availability_model_1.Availability.findOne({ providerId });
    if (!availability) {
        return [];
    }
    // First check if the date is available
    const dateCheck = await checkAvailabilityForDate(providerId, date);
    if (!dateCheck.isAvailable || !dateCheck.workingHours) {
        return [];
    }
    const { start, end } = dateCheck.workingHours;
    const bufferMinutes = availability.bufferMinutes || 0;
    const totalSlotDuration = serviceDuration + bufferMinutes;
    // Generate time slots
    const slots = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += totalSlotDuration) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeSlot);
    }
    // Import Booking model to check for conflicts
    const { Booking } = require('../booking/booking.model');
    // Filter out booked slots
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const existingBookings = await Booking.find({
        providerId: new mongoose_1.Types.ObjectId(providerId),
        bookingDate: {
            $gte: targetDate,
            $lt: nextDay
        },
        status: { $nin: ['cancelled', 'completed'] }
    }).select('startTime endTime');
    // Filter out slots that conflict with existing bookings
    const availableSlots = slots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotStartMinutes = slotHour * 60 + slotMinute;
        const slotEndMinutes = slotStartMinutes + serviceDuration;
        return !existingBookings.some((booking) => {
            const [bookingStartHour, bookingStartMinute] = booking.startTime.split(':').map(Number);
            const [bookingEndHour, bookingEndMinute] = booking.endTime.split(':').map(Number);
            const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute;
            const bookingEndMinutes = bookingEndHour * 60 + bookingEndMinute;
            // Check for overlap
            return ((slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
                (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
                (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes));
        });
    });
    return availableSlots;
};
const getMonthCalendar = async (providerId, month, year) => {
    var _a, _b;
    const availability = await availability_model_1.Availability.findOne({ providerId });
    if (!availability) {
        return [];
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateCheck = await checkAvailabilityForDate(providerId, date);
        calendar.push({
            date: date.toISOString().split('T')[0],
            isAvailable: dateCheck.isAvailable,
            reason: dateCheck.reason,
            hasSpecialPricing: !!(((_a = dateCheck.pricing) === null || _a === void 0 ? void 0 : _a.priceOverride) || ((_b = dateCheck.pricing) === null || _b === void 0 ? void 0 : _b.rateMultiplier))
        });
    }
    return calendar;
};
exports.AvailabilityService = {
    createOrUpdateAvailability,
    getProviderAvailability,
    checkAvailabilityForDate,
    getAvailableTimeSlots,
    getMonthCalendar,
};
