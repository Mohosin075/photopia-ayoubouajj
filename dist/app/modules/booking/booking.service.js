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
const mongoose_1 = __importDefault(require("mongoose"));
const service_1 = require("../../../enum/service");
const wallet_service_1 = require("../wallet/wallet.service");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const professionalProfile_model_1 = require("../professionalProfile/professionalProfile.model");
const payment_service_1 = require("../payment/payment.service");
const geocodeAddress_1 = require("../../../utils/geocodeAddress");
// Helper for Haversine distance
const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const calculatePrice = async (serviceId, startTime, endTime, date, distanceFromProviderKm, overrides, packageName) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const service = await service_model_1.Service.findById(serviceId);
    if (!service)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Service not found');
    const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60;
    const end = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60;
    let durationHours = end - start;
    if (durationHours <= 0)
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Invalid duration');
    let baseRate = 0;
    let isWeekend = false;
    const day = date.getDay();
    if (day === 0 || day === 6) {
        isWeekend = true;
        baseRate = ((_a = service.pricingModel) === null || _a === void 0 ? void 0 : _a.weekendHourlyRate) || (service.price * 1.2);
    }
    else {
        baseRate = ((_b = service.pricingModel) === null || _b === void 0 ? void 0 : _b.weekdayHourlyRate) || service.price;
    }
    // Calculate subtotal
    let subtotal = 0;
    if (service.pricingType === service_1.SERVICE_PRICING_TYPE.HOURLY) {
        // Apply Overrides for hourly only
        if ((overrides === null || overrides === void 0 ? void 0 : overrides.priceOverride) !== undefined) {
            baseRate = overrides.priceOverride;
        }
        else if ((overrides === null || overrides === void 0 ? void 0 : overrides.rateMultiplier) !== undefined) {
            baseRate = baseRate * overrides.rateMultiplier;
        }
        subtotal = baseRate * durationHours;
    }
    else if (service.pricingType === service_1.SERVICE_PRICING_TYPE.DAILY) {
        subtotal = ((_c = service.pricingModel) === null || _c === void 0 ? void 0 : _c.dailyRate) || service.price;
        durationHours = ((_d = service.pricingModel) === null || _d === void 0 ? void 0 : _d.dailyHours) || 8;
    }
    else if (service.pricingType === service_1.SERVICE_PRICING_TYPE.PACKAGE) {
        if (packageName && ((_e = service.pricingModel) === null || _e === void 0 ? void 0 : _e.packages)) {
            const selectedPackage = service.pricingModel.packages.find(p => p.name === packageName);
            if (selectedPackage) {
                subtotal = selectedPackage.price;
                durationHours = selectedPackage.duration;
            }
            else {
                throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Package '${packageName}' not found in this service`);
            }
        }
        else {
            subtotal = service.price;
            // Use service duration if available, otherwise default to what user selected
            if (service.duration && !isNaN(parseInt(service.duration))) {
                durationHours = parseInt(service.duration);
            }
        }
    }
    // Travel fee
    let travelFee = 0;
    if (distanceFromProviderKm > (((_f = service.location) === null || _f === void 0 ? void 0 : _f.serviceRadiusKm) || 25)) {
        if (!service.allowOutsideRadius) {
            throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Location is outside service radius (${(_g = service.location) === null || _g === void 0 ? void 0 : _g.serviceRadiusKm}km)`);
        }
        const extraKm = distanceFromProviderKm - (((_h = service.location) === null || _h === void 0 ? void 0 : _h.serviceRadiusKm) || 25);
        travelFee = Math.min(extraKm * (service.travelFeePerKm || 1.5), service.maxTravelFee || 100);
    }
    subtotal += travelFee;
    const platformCommissionClient = 0.10; // 10% from user (client)
    const platformCommissionProvider = 0.05; // 5% from provider
    const clientTotal = Number((subtotal * (1 + platformCommissionClient)).toFixed(2));
    const providerEarnings = Number((subtotal * (1 - platformCommissionProvider)).toFixed(2));
    return {
        pricingType: service.pricingType,
        packageName,
        baseRate,
        isWeekend,
        travelFee,
        subtotal: Number(subtotal.toFixed(2)),
        platformCommissionClient,
        platformCommissionProvider,
        clientTotal,
        providerEarnings,
        currency: service.currency || 'EUR',
        durationHours
    };
};
const createBooking = async (payload, user) => {
    var _a, _b, _c, _d, _e, _f;
    // 1. Check Service Existence
    const service = await service_model_1.Service.findById(payload.serviceId);
    if (!service)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Service not found');
    // 1.5 Geocode address if coordinates are missing
    if (!payload.eventLocation.coordinates || !payload.eventLocation.coordinates.lat || !payload.eventLocation.coordinates.lng) {
        const fullAddress = `${payload.eventLocation.address}, ${payload.eventLocation.city}, ${payload.eventLocation.country}`;
        const geocoded = await (0, geocodeAddress_1.geocodeAddress)(fullAddress);
        console.log('Geocoded:', geocoded);
        if (geocoded) {
            payload.eventLocation.coordinates = {
                lat: geocoded.lat,
                lng: geocoded.lng
            };
        }
    }
    // 1.6 Calculate distance if not provided or 0
    if ((!payload.eventLocation.distanceFromProviderKm || payload.eventLocation.distanceFromProviderKm === 0) &&
        ((_b = (_a = service.location) === null || _a === void 0 ? void 0 : _a.coordinates) === null || _b === void 0 ? void 0 : _b.lat) && ((_d = (_c = service.location) === null || _c === void 0 ? void 0 : _c.coordinates) === null || _d === void 0 ? void 0 : _d.lng) &&
        ((_e = payload.eventLocation.coordinates) === null || _e === void 0 ? void 0 : _e.lat) && ((_f = payload.eventLocation.coordinates) === null || _f === void 0 ? void 0 : _f.lng)) {
        const distance = calculateDistanceInKm(service.location.coordinates.lat, service.location.coordinates.lng, payload.eventLocation.coordinates.lat, payload.eventLocation.coordinates.lng);
        payload.eventLocation.distanceFromProviderKm = Number(distance.toFixed(2));
    }
    // 1.7 Ensure distance is at least 0 if still missing
    if (payload.eventLocation.distanceFromProviderKm === undefined) {
        payload.eventLocation.distanceFromProviderKm = 0;
    }
    // Ensure bookingDate is a Date object
    const bookingDate = new Date(payload.bookingDate);
    // 2. Check Availability
    const availabilityCheck = await availability_service_1.AvailabilityService.checkAvailabilityForDate(payload.providerId.toString(), bookingDate);
    console.log('Availability Check:', availabilityCheck);
    if (!availabilityCheck.isAvailable) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Provider is not available: ${availabilityCheck.reason}`);
    }
    // 3. Calculate Price (First, to get the correct duration)
    const pricing = await calculatePrice(payload.serviceId.toString(), payload.startTime, payload.endTime, bookingDate, payload.eventLocation.distanceFromProviderKm || 0, availabilityCheck.pricing, payload.packageName);
    // Calculate actual end time based on the duration returned from pricing
    const [startHour, startMinute] = payload.startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const durationMinutes = pricing.durationHours * 60;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;
    const actualEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    // Update payload with actual calculated values
    payload.endTime = actualEndTime;
    payload.pricingDetails = pricing;
    payload.durationHours = pricing.durationHours;
    // Validate request time is within working hours
    if (availabilityCheck.workingHours) {
        const workStart = parseInt(availabilityCheck.workingHours.start.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.start.split(':')[1]);
        const workEnd = parseInt(availabilityCheck.workingHours.end.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.end.split(':')[1]);
        if (startTotalMinutes < workStart || endTotalMinutes > workEnd) {
            throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Requested duration (${pricing.durationHours}h starting at ${payload.startTime}) exceeds provider working hours (${availabilityCheck.workingHours.start} - ${availabilityCheck.workingHours.end})`);
        }
    }
    // Check specific time slot availability (overlap with existing bookings)
    const existingBookings = await booking_model_1.Booking.find({
        providerId: payload.providerId,
        bookingDate: payload.bookingDate,
        status: { $in: ['confirmed', 'pending', 'deposit_paid'] }
    });
    const hasOverlap = existingBookings.some(booking => {
        const existStart = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1]);
        const existEnd = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1]);
        return (startTotalMinutes < existEnd && endTotalMinutes > existStart);
    });
    if (hasOverlap) {
        throw new ApiError_1.default(http_status_codes_1.default.CONFLICT, 'Time slot overlaps with an existing booking');
    }
    // Implement 50% deposit logic
    payload.depositPercentage = 0.5; // 50%
    payload.depositAmount = Number((pricing.clientTotal * payload.depositPercentage).toFixed(2));
    payload.balanceAmount = Number((pricing.clientTotal - payload.depositAmount).toFixed(2));
    payload.bookingDate = bookingDate; // Ensure the Date object is saved
    const [booking] = await booking_model_1.Booking.create([payload]);
    // 4. Create Stripe Checkout Session
    const paymentPayload = {
        amount: payload.depositAmount, // Charge the deposit amount
        currency: pricing.currency.toLowerCase(),
        productName: `Deposit for ${service.title}`,
        description: `Booking Number: ${booking.bookingNumber} (50% Deposit)`,
        bookingId: booking._id.toString(),
        metadata: {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingNumber,
            paymentType: 'deposit'
        }
    };
    const checkoutSession = await payment_service_1.PaymentServices.createCheckoutSession(user, paymentPayload);
    return {
        booking,
        paymentSession: checkoutSession
    };
};
const updateBookingStatus = async (bookingId, status, userId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const booking = await booking_model_1.Booking.findById(bookingId).session(session);
        if (!booking)
            throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Booking not found');
        // Only provider or admin can confirm/cancel (client can cancel too)
        // For simplicity allowing update if user is involved
        if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
            // Check if admin (need role passed or check logic)
            // throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized')
        }
        const previousStatus = booking.status;
        booking.status = status;
        if (status === 'confirmed')
            booking.confirmedAt = new Date();
        if (status === 'cancelled' && previousStatus !== 'cancelled') {
            booking.cancelledAt = new Date();
            // Refund pending balance if it was already credited as pending
            if (['confirmed', 'deposit_paid', 'in_progress'].includes(previousStatus)) {
                await wallet_service_1.WalletService.cancelPendingEarnings(booking.providerId, booking.pricingDetails.providerEarnings, session);
            }
        }
        if (status === 'completed') {
            booking.completedAt = new Date();
            // If booking is completed and wasn't already completed, transfer earnings
            if (previousStatus !== 'completed') {
                // 1. Move from pending to actual balance in local wallet
                await wallet_service_1.WalletService.completePendingEarnings(booking.providerId, booking.pricingDetails.providerEarnings, session);
                // 2. Stripe Connect Transfer
                const professionalProfile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: booking.providerId });
                if (professionalProfile === null || professionalProfile === void 0 ? void 0 : professionalProfile.stripeAccountId) {
                    try {
                        console.log(`Attempting transfer to: ${professionalProfile.stripeAccountId}`);
                        const transfer = await stripe_1.default.transfers.create({
                            amount: Math.round(booking.pricingDetails.providerEarnings * 100), // convert to cents
                            currency: booking.pricingDetails.currency.toLowerCase(),
                            destination: professionalProfile.stripeAccountId,
                            metadata: {
                                bookingId: booking.id,
                                bookingNumber: booking.bookingNumber
                            }
                        });
                        booking.stripeTransferId = transfer.id;
                        booking.stripeTransferStatus = 'succeeded';
                    }
                    catch (error) {
                        console.error('Stripe Transfer Error:', error.message);
                        booking.stripeTransferStatus = 'failed';
                        // We still let the DB transaction complete so the provider gets local credit
                        // but we mark the Stripe transfer as failed for admin manual retry.
                    }
                }
            }
        }
        await booking.save({ session });
        await session.commitTransaction();
        return booking;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
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
const getMyBookingsByDate = async (userId, role, date) => {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    const query = {
        bookingDate: {
            $gte: startOfDay,
            $lt: endOfDay,
        },
    };
    if (role === 'professional') {
        query.providerId = userId;
    }
    else {
        query.clientId = userId;
    }
    const result = await booking_model_1.Booking.find(query)
        .populate('serviceId')
        .populate('providerId', 'name email')
        .populate('clientId', 'name email')
        .sort({ startTime: 1 });
    return result;
};
exports.BookingService = {
    createBooking,
    updateBookingStatus,
    getMyBookings,
    calculatePrice,
    getSingleBooking,
    getMyBookingsByDate
};
