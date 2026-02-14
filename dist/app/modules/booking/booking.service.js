"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const booking_model_1 = require("./booking.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const availability_service_1 = require("../availability/availability.service");
const service_model_1 = require("../service/service.model");
const service_1 = require("../../../enum/service");
const calculatePrice = async (serviceId, startTime, endTime, date, distanceFromProviderKm, overrides) => {
    var _a, _b, _c, _d, _e, _f;
    const service = await service_model_1.Service.findById(serviceId);
    if (!service)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Service not found');
    const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60;
    const end = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60;
    const durationHours = end - start;
    if (durationHours <= 0)
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Invalid duration');
    let baseRate = 0;
    let isWeekend = false;
    const day = date.getDay();
    if (day === 0 || day === 6) {
        isWeekend = true;
        baseRate = ((_a = service.pricingModel) === null || _a === void 0 ? void 0 : _a.weekendHourlyRate) || service.price;
    }
    else {
        baseRate = ((_b = service.pricingModel) === null || _b === void 0 ? void 0 : _b.weekdayHourlyRate) || service.price;
    }
    // Fallback if specific hourly rates are 0
    if (service.pricingType === service_1.SERVICE_PRICING_TYPE.HOURLY && (!baseRate || baseRate === 0)) {
        baseRate = service.price;
    }
    // Apply Overrides
    if ((overrides === null || overrides === void 0 ? void 0 : overrides.priceOverride) !== undefined) {
        baseRate = overrides.priceOverride;
    }
    else if ((overrides === null || overrides === void 0 ? void 0 : overrides.rateMultiplier) !== undefined) {
        baseRate = baseRate * overrides.rateMultiplier;
    }
    // Calculate subtotal
    let subtotal = 0;
    if (service.pricingType === service_1.SERVICE_PRICING_TYPE.HOURLY) {
        subtotal = baseRate * durationHours;
    }
    else if (service.pricingType === service_1.SERVICE_PRICING_TYPE.DAILY) {
        // For daily, one booking usually means one day? Or fraction? 
        // Assuming daily rate applies once per day regardless of hours, unless spanning multiple days (which our logic doesn't support yet, strict single day)
        subtotal = ((_c = service.pricingModel) === null || _c === void 0 ? void 0 : _c.dailyRate) || service.price;
    }
    else {
        // Default fallthrough (e.g. PACKAGE)
        subtotal = service.price;
    }
    // Travel fee
    let travelFee = 0;
    if (distanceFromProviderKm > (((_d = service.location) === null || _d === void 0 ? void 0 : _d.serviceRadiusKm) || 25)) {
        if (!service.allowOutsideRadius) {
            throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Location is outside service radius (${(_e = service.location) === null || _e === void 0 ? void 0 : _e.serviceRadiusKm}km)`);
        }
        const extraKm = distanceFromProviderKm - (((_f = service.location) === null || _f === void 0 ? void 0 : _f.serviceRadiusKm) || 25);
        travelFee = Math.min(extraKm * (service.travelFeePerKm || 1.5), service.maxTravelFee || 100);
    }
    subtotal += travelFee;
    const platformCommissionClient = 0.10;
    const platformCommissionProvider = 0.05;
    // const clientTotal = subtotal * (1 + platformCommissionClient)
    const clientTotal = subtotal; // Client pays subtotal? Usually platform fee is added on top. Let's stick to existing logic:
    const totalWithClientFee = subtotal * (1 + platformCommissionClient);
    const providerEarnings = subtotal * (1 - platformCommissionProvider);
    return {
        pricingType: service.pricingType,
        baseRate,
        isWeekend,
        travelFee,
        subtotal,
        platformCommissionClient,
        platformCommissionProvider,
        clientTotal: totalWithClientFee,
        providerEarnings,
        currency: service.currency || 'EUR',
        durationHours
    };
};
const createBooking = async (payload) => {
    // 1. Check Service Existence
    const service = await service_model_1.Service.findById(payload.serviceId);
    if (!service)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Service not found');
    // Ensure bookingDate is a Date object
    const bookingDate = new Date(payload.bookingDate);
    // 2. Check Availability
    const availabilityCheck = await availability_service_1.AvailabilityService.checkAvailabilityForDate(payload.providerId.toString(), bookingDate);
    console.log('Availability Check:', availabilityCheck);
    if (!availabilityCheck.isAvailable) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Provider is not available: ${availabilityCheck.reason}`);
    }
    // Validate request time is within working hours
    if (availabilityCheck.workingHours) {
        const workStart = parseInt(availabilityCheck.workingHours.start.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.start.split(':')[1]);
        const workEnd = parseInt(availabilityCheck.workingHours.end.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.end.split(':')[1]);
        const reqStart = parseInt(payload.startTime.split(':')[0]) * 60 + parseInt(payload.startTime.split(':')[1]);
        const reqEnd = parseInt(payload.endTime.split(':')[0]) * 60 + parseInt(payload.endTime.split(':')[1]);
        if (reqStart < workStart || reqEnd > workEnd) {
            throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Requested time is outside working hours (${availabilityCheck.workingHours.start} - ${availabilityCheck.workingHours.end})`);
        }
    }
    // TODO: Check specific time slot availability (overlap with existing bookings)
    const existingBookings = await booking_model_1.Booking.find({
        providerId: payload.providerId,
        bookingDate: payload.bookingDate,
        status: { $in: ['confirmed', 'pending', 'deposit_paid'] }
    });
    // Simple overlap check
    const newStart = parseInt(payload.startTime.split(':')[0]) * 60 + parseInt(payload.startTime.split(':')[1]);
    const newEnd = parseInt(payload.endTime.split(':')[0]) * 60 + parseInt(payload.endTime.split(':')[1]);
    const hasOverlap = existingBookings.some(booking => {
        const existStart = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1]);
        const existEnd = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1]);
        return (newStart < existEnd && newEnd > existStart);
    });
    if (hasOverlap) {
        throw new ApiError_1.default(http_status_codes_1.default.CONFLICT, 'Time slot overlaps with an existing booking');
    }
    // 3. Calculate Price
    const pricing = await calculatePrice(payload.serviceId.toString(), payload.startTime, payload.endTime, bookingDate, payload.eventLocation.distanceFromProviderKm, availabilityCheck.pricing);
    payload.pricingDetails = pricing;
    payload.durationHours = pricing.durationHours;
    payload.depositAmount = pricing.clientTotal * 0.5; // 50% deposit
    payload.balanceAmount = pricing.clientTotal - payload.depositAmount;
    payload.depositPercentage = 0.5;
    payload.bookingDate = bookingDate; // Ensure the Date object is saved
    const result = await booking_model_1.Booking.create(payload);
    return result;
};
const updateBookingStatus = async (bookingId, status, userId) => {
    const booking = await booking_model_1.Booking.findById(bookingId);
    if (!booking)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Booking not found');
    // Only provider or admin can confirm/cancel (client can cancel too)
    // For simplicity allowing update if user is involved
    if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
        // Check if admin (need role passed or check logic)
        // throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized')
    }
    booking.status = status;
    if (status === 'confirmed')
        booking.confirmedAt = new Date();
    if (status === 'cancelled')
        booking.cancelledAt = new Date();
    if (status === 'completed')
        booking.completedAt = new Date();
    await booking.save();
    return booking;
};
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const getMyBookings = async (userId, role, filters, options) => {
    const { searchTerm, filterType, ...filterData } = filters;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(options);
    const andConditions = [];
    // Role-based filter
    if (role === 'professional') {
        andConditions.push({ providerId: userId });
    }
    else {
        andConditions.push({ clientId: userId });
    }
    // Search Logic (e.g., by Booking Number or Service Title - requires lookup usually, but let's stick to direct fields or bookingNumber)
    if (searchTerm) {
        andConditions.push({
            $or: [
                { bookingNumber: { $regex: searchTerm, $options: 'i' } },
                { clientName: { $regex: searchTerm, $options: 'i' } },
                // { 'service.title': { $regex: searchTerm, $options: 'i' } } // Requires aggregate/lookup for efficient search usually
            ]
        });
    }
    // Filter Type Logic
    if (filterType) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        if (filterType === 'today') {
            andConditions.push({
                bookingDate: {
                    $gte: startOfToday,
                    $lt: endOfToday,
                },
            });
        }
        else if (filterType === 'upcoming') {
            andConditions.push({
                bookingDate: {
                    $gte: endOfToday,
                },
                status: 'confirmed',
            });
        }
        else if (filterType === 'pending') {
            andConditions.push({
                status: 'pending',
            });
        }
    }
    // Filter Logic
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([field, value]) => ({
                [field]: value
            }))
        });
    }
    // Sorting
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder;
    }
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    const result = await booking_model_1.Booking.find(whereConditions)
        .populate('serviceId')
        .populate('providerId', 'name email')
        .populate('clientId', 'name email')
        .sort(sortConditions)
        .skip(skip)
        .limit(limit);
    const total = await booking_model_1.Booking.countDocuments(whereConditions);
    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result,
    };
};
const getSingleBooking = async (bookingId) => {
    const booking = await booking_model_1.Booking.findById(bookingId);
    if (!booking)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Booking not found');
    return booking;
};
exports.BookingService = {
    createBooking,
    updateBookingStatus,
    getMyBookings,
    calculatePrice,
    getSingleBooking
};
