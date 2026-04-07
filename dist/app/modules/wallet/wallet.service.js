"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const wallet_model_1 = require("./wallet.model");
const mongoose_1 = require("mongoose");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const booking_model_1 = require("../booking/booking.model");
const getWalletByUserId = async (userId) => {
    var _a, _b, _c;
    let wallet = await wallet_model_1.Wallet.findOne({ userId });
    if (!wallet) {
        wallet = await wallet_model_1.Wallet.create({ userId });
    }
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthBeforeLastStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthBeforeLastEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    const [thisMonthStats, lastMonthStats, monthBeforeLastStats] = await Promise.all([
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId.toString()),
                    status: 'completed',
                    completedAt: { $gte: currentMonthStart },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId.toString()),
                    status: 'completed',
                    completedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId.toString()),
                    status: 'completed',
                    completedAt: { $gte: monthBeforeLastStart, $lte: monthBeforeLastEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
        ]),
    ]);
    const thisMonthEarnings = ((_a = thisMonthStats[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    const lastMonthEarnings = ((_b = lastMonthStats[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
    const monthBeforeLastEarnings = ((_c = monthBeforeLastStats[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
    const calculateChange = (current, previous) => {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(2));
    };
    return {
        ...wallet.toObject(),
        thisMonthEarnings: {
            amount: thisMonthEarnings,
            percentageChange: calculateChange(thisMonthEarnings, lastMonthEarnings),
        },
        lastMonthEarnings: {
            amount: lastMonthEarnings,
            percentageChange: calculateChange(lastMonthEarnings, monthBeforeLastEarnings),
        },
    };
};
const addEarnings = async (userId, amount, session) => {
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId }, {
        $inc: { balance: amount, totalEarnings: amount }
    }, { session, new: true, upsert: true });
    return wallet;
};
const deductBalance = async (userId, amount, session) => {
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId, balance: { $gte: amount } }, {
        $inc: { balance: -amount, totalWithdrawn: amount }
    }, { session, new: true });
    if (!wallet) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Insufficient balance or wallet not found');
    }
    return wallet;
};
const refundBalance = async (userId, amount, session) => {
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId }, {
        $inc: { balance: amount, totalWithdrawn: -amount }
    }, { session, new: true });
    if (!wallet) {
        throw new ApiError_1.default(http_status_codes_1.default.NOT_FOUND, 'Wallet not found for refund');
    }
    return wallet;
};
const addPendingEarnings = async (userId, amount, session) => {
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId }, {
        $inc: { pendingBalance: amount }
    }, { session, new: true, upsert: true });
    return wallet;
};
const completePendingEarnings = async (userId, amount, session) => {
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId, pendingBalance: { $gte: amount } }, {
        $inc: { pendingBalance: -amount, balance: amount, totalEarnings: amount }
    }, { session, new: true });
    if (!wallet) {
        // If pending balance is less than amount (edge case), just add to balance
        return await wallet_model_1.Wallet.findOneAndUpdate({ userId }, { $inc: { balance: amount, totalEarnings: amount } }, { session, new: true });
    }
    return wallet;
};
const cancelPendingEarnings = async (userId, amount, session) => {
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId, pendingBalance: { $gte: amount } }, {
        $inc: { pendingBalance: -amount }
    }, { session, new: true });
    return wallet;
};
exports.WalletService = {
    getWalletByUserId,
    addEarnings,
    deductBalance,
    refundBalance,
    addPendingEarnings,
    completePendingEarnings,
    cancelPendingEarnings
};
