"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const availability_model_1 = require("./availability.model");
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
        if (customDate.type === 'special_hours' && customDate.start && customDate.end) {
            return {
                isAvailable: true,
                workingHours: { start: customDate.start, end: customDate.end }
            };
        }
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
exports.AvailabilityService = {
    createOrUpdateAvailability,
    getProviderAvailability,
    checkAvailabilityForDate,
};
