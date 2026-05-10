"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentlyViewedRoutes = void 0;
const express_1 = __importDefault(require("express"));
const recentlyViewed_controller_1 = require("./recentlyViewed.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
router
    .route('/')
    .get((0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN), recentlyViewed_controller_1.RecentlyViewedController.getRecentlyViewed)
    .post((0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN), recentlyViewed_controller_1.RecentlyViewedController.recordView);
exports.RecentlyViewedRoutes = router;
