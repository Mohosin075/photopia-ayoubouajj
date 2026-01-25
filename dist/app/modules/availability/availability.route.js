"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const availability_controller_1 = require("./availability.controller");
const availability_validation_1 = require("./availability.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(availability_validation_1.createAvailabilityValidationSchema), availability_controller_1.AvailabilityController.createOrUpdateAvailability);
router.get('/my-availability', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL), availability_controller_1.AvailabilityController.getMyAvailability);
router.get('/:providerId', availability_controller_1.AvailabilityController.getProviderAvailability);
// Public endpoint to check if a specific date is available
router.get('/check/:providerId', availability_controller_1.AvailabilityController.checkDateAvailability);
// Public endpoint to get available time slots for a specific date
router.get('/slots/:providerId', availability_controller_1.AvailabilityController.getTimeSlots);
// Public endpoint to get month calendar overview
router.get('/calendar/:providerId', availability_controller_1.AvailabilityController.getMonthCalendar);
exports.AvailabilityRoutes = router;
