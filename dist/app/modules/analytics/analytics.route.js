"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const analytics_controller_1 = require("./analytics.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const analytics_validation_1 = require("./analytics.validation");
const router = express_1.default.Router();
router.post('/track', (0, validateRequest_1.default)(analytics_validation_1.AnalyticsValidation.trackVisitZodSchema), analytics_controller_1.AnalyticsController.trackVisit);
exports.AnalyticsRoutes = router;
