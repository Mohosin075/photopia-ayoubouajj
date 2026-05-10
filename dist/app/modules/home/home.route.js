"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const home_controller_1 = require("./home.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const router = express_1.default.Router();
// Allow both guests and authenticated users
router.get('/', (req, res, next) => {
    // If there is an auth header, try to authenticate
    if (req.headers.authorization) {
        return (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.PROFESSIONAL)(req, res, next);
    }
    next();
}, home_controller_1.HomeController.getHomeData);
exports.HomeRoutes = router;
