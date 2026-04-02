"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Withdrawal = void 0;
const mongoose_1 = require("mongoose");
const withdrawalSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'EUR'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    bankAccountDetails: {
        accountHolderName: String,
        bankName: String,
        iban: String,
        swiftCode: String
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    transactionId: String
}, {
    timestamps: true
});
exports.Withdrawal = (0, mongoose_1.model)('Withdrawal', withdrawalSchema);
