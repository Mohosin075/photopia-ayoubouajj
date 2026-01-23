"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const booking_controller_1 = require("./booking.controller");
const booking_validation_1 = require("./booking.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(booking_validation_1.createBookingValidationSchema), booking_controller_1.BookingController.createBooking);
router.post('/calculate-price', 
// Public or auth depending on requirement. Allowing public for now or user.
// auth(USER_ROLES.USER),
booking_controller_1.BookingController.calculatePrice);
router.patch('/:id/status', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(booking_validation_1.updateBookingStatusSchema), booking_controller_1.BookingController.updateBookingStatus);
router.get('/my-bookings', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN), booking_controller_1.BookingController.getMyBookings);
exports.BookingRoutes = router;
