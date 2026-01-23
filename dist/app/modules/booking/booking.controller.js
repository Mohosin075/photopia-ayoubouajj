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
const createBooking = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const bookingData = {
        ...req.body,
        clientId: user.userId
    };
    const result = await booking_service_1.BookingService.createBooking(bookingData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: 'Booking created successfully',
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
    const result = await booking_service_1.BookingService.getMyBookings(user.userId, user.role);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Bookings retrieved successfully',
        data: result,
    });
});
const calculatePrice = (0, catchAsync_1.default)(async (req, res) => {
    const { serviceId, startTime, endTime, date, distanceFromProviderKm } = req.body;
    const result = await booking_service_1.BookingService.calculatePrice(serviceId, startTime, endTime, new Date(date), new Date(date), distanceFromProviderKm || 0, undefined // Overrides not currently fetched in this standalone calculation
    );
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Price calculated successfully',
        data: result,
    });
});
exports.BookingController = {
    createBooking,
    updateBookingStatus,
    getMyBookings,
    calculatePrice
};
