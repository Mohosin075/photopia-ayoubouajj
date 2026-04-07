"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const analytics_controller_1 = require("./analytics.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const analytics_validation_1 = require("./analytics.validation");
const router = express_1.default.Router();
router.post('/track', (0, validateRequest_1.default)(analytics_validation_1.AnalyticsValidation.trackVisitZodSchema), analytics_controller_1.AnalyticsController.trackVisit);
router.get('/premium', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), analytics_controller_1.AnalyticsController.getPremiumAnalytics);
exports.AnalyticsRoutes = router;
