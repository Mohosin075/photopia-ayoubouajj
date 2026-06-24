"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalService = void 0;
const withdrawal_model_1 = require("./withdrawal.model");
const wallet_service_1 = require("../wallet/wallet.service");
const professionalProfile_model_1 = require("../professionalProfile/professionalProfile.model");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createWithdrawal = async (payload) => {
    const { userId, amount } = payload;
    if (!userId || !amount) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'User ID and amount are required');
    }
    // Check if professional has Stripe Connect
    const professionalProfile = await professionalProfile_model_1.ProfessionalProfile.findOne({
        user: userId,
    });
    const isStripeConnected = (professionalProfile === null || professionalProfile === void 0 ? void 0 : professionalProfile.stripeAccountId) &&
        (professionalProfile === null || professionalProfile === void 0 ? void 0 : professionalProfile.stripeOnboardingComplete);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 1. Deduct from local wallet first to ensure they have balance
        const wallet = await wallet_service_1.WalletService.deductBalance(userId.toString(), amount, session);
        const currency = (payload.currency ||
            (wallet === null || wallet === void 0 ? void 0 : wallet.currency) ||
            'EUR').toLowerCase();
        let withdrawalData = { ...payload, currency: currency.toUpperCase() };
        if (isStripeConnected) {
            // 2. Trigger Stripe Payout from Connected Account to their Bank
            try {
                const payout = await stripe_1.default.payouts.create({
                    amount: Math.round(amount * 100),
                    currency: currency,
                }, {
                    stripeAccount: professionalProfile.stripeAccountId,
                });
                withdrawalData.status = 'completed';
                withdrawalData.transactionId = payout.id;
                withdrawalData.processedAt = new Date();
            }
            catch (stripeError) {
                throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, `Stripe Payout failed: ${stripeError.message}`);
            }
        }
        else {
            // Manual flow for users without Stripe Connect
            if (!payload.bankAccountDetails) {
                throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Bank account details are required for manual withdrawal');
            }
            withdrawalData.status = 'pending';
        }
        const withdrawal = await withdrawal_model_1.Withdrawal.create([withdrawalData], { session });
        await session.commitTransaction();
        return withdrawal[0];
    }
    catch (error) {
        await session.abortTransaction();
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, error.message || 'Withdrawal failed');
    }
    finally {
        session.endSession();
    }
};
const getMyWithdrawals = async (userId) => {
    return await withdrawal_model_1.Withdrawal.find({ userId }).sort({ createdAt: -1 });
};
const getAllWithdrawals = async () => {
    return await withdrawal_model_1.Withdrawal.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
};
const updateWithdrawalStatus = async (withdrawalId, status, transactionId) => {
    const withdrawal = await withdrawal_model_1.Withdrawal.findById(withdrawalId);
    if (!withdrawal)
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Withdrawal request not found');
    if (withdrawal.status !== 'pending') {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Withdrawal is already processed');
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        withdrawal.status = status;
        withdrawal.processedAt = new Date();
        if (status === 'completed') {
            withdrawal.transactionId = transactionId;
        }
        else if (status === 'failed' || status === 'cancelled') {
            // Refund the wallet if failed or cancelled
            await wallet_service_1.WalletService.refundBalance(withdrawal.userId, withdrawal.amount, session);
        }
        await withdrawal.save({ session });
        await session.commitTransaction();
        return withdrawal;
    }
    catch (error) {
        await session.abortTransaction();
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, error.message || 'Failed to update withdrawal status');
    }
    finally {
        session.endSession();
    }
};
exports.WithdrawalService = {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus,
};
