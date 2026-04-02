"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const wallet_controller_1 = require("./wallet.controller");
const router = express_1.default.Router();
router.get('/my-wallet', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), wallet_controller_1.WalletController.getMyWallet);
exports.WalletRoutes = router;
