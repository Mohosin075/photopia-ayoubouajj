"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const withdrawal_controller_1 = require("./withdrawal.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const withdrawal_validation_1 = require("./withdrawal.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(withdrawal_validation_1.WithdrawalValidation.createWithdrawalZodSchema), withdrawal_controller_1.WithdrawalController.createWithdrawal);
router.get('/my-withdrawals', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), withdrawal_controller_1.WithdrawalController.getMyWithdrawals);
router.get('/all-withdrawals', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), withdrawal_controller_1.WithdrawalController.getAllWithdrawals);
router.patch('/:id/status', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(withdrawal_validation_1.WithdrawalValidation.updateWithdrawalStatusZodSchema), withdrawal_controller_1.WithdrawalController.updateWithdrawalStatus);
exports.WithdrawalRoutes = router;
