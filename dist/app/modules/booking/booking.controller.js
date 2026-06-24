"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const booking_service_1 = require("./booking.service");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const pick_1 = __importDefault(require("../../../shared/pick"));
const user_model_1 = require("../user/user.model");
const createBooking = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!(user === null || user === void 0 ? void 0 : user.userId))
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    let clientEmail = user.email;
    if (!clientEmail) {
        const dbUser = await user_model_1.User.findById(user.userId).select('email').lean();
        clientEmail = dbUser === null || dbUser === void 0 ? void 0 : dbUser.email;
    }
    if (!clientEmail) {
        clientEmail = req.body.clientEmail;
    }
    if (!clientEmail) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Email not found for your account. Please update your profile or sign in again.');
    }
    const bookingData = {
        ...req.body,
        clientId: user.userId,
        clientEmail,
    };
    const result = await booking_service_1.BookingService.createBooking(bookingData, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: 'Booking created successfully. Please complete the payment.',
        data: result,
    });
});
const updateBookingStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const result = await booking_service_1.BookingService.updateBookingStatus(id, status, user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Booking status updated successfully',
        data: result,
    });
});
const getMyBookings = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const filters = (0, pick_1.default)(req.query, [
        'searchTerm',
        'status',
        'bookingDate',
        'serviceId',
        'filterType',
    ]);
    const options = (0, pick_1.default)(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await booking_service_1.BookingService.getMyBookings(user.userId, user.role, filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
const calculatePrice = (0, catchAsync_1.default)(async (req, res) => {
    const { serviceId, startTime, endTime, date, distanceFromProviderKm, packageName, customOptions, } = req.body;
    const result = await booking_service_1.BookingService.calculatePrice(serviceId, startTime, endTime, new Date(date), distanceFromProviderKm || 0, undefined, // Overrides
    packageName, customOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Price calculated successfully',
        data: result,
    });
});
const getSingleBooking = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const result = await booking_service_1.BookingService.getSingleBooking(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Booking retrieved successfully',
        data: result,
    });
});
const getMyBookingsByDate = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const date = req.query.date;
    if (!date)
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Date is required');
    const result = await booking_service_1.BookingService.getMyBookingsByDate(user.userId, user.role, date);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result,
    });
});
const modifyBookingOffer = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const result = await booking_service_1.BookingService.modifyBookingOffer(id, user.userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Offer modified successfully',
        data: result,
    });
});
const payRemainingBalance = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const result = await booking_service_1.BookingService.payRemainingBalance(id, user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Payment intent created for remaining balance',
        data: result,
    });
});
exports.BookingController = {
    createBooking,
    updateBookingStatus,
    getMyBookings,
    calculatePrice,
    getSingleBooking,
    getMyBookingsByDate,
    modifyBookingOffer,
    payRemainingBalance,
};
