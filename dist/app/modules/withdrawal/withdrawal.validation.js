"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalValidation = void 0;
const zod_1 = require("zod");
const createWithdrawalZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number({
            required_error: 'Amount is required',
        })
            .positive('Amount must be positive'),
        currency: zod_1.z.string().optional(),
        bankAccountDetails: zod_1.z
            .object({
            accountHolderName: zod_1.z.string({
                required_error: 'Account holder name is required',
            }),
            bankName: zod_1.z.string({
                required_error: 'Bank name is required',
            }),
            iban: zod_1.z.string({
                required_error: 'IBAN is required',
            }),
            swiftCode: zod_1.z.string().optional(),
        })
            .optional(),
    }),
});
const updateWithdrawalStatusZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['completed', 'failed', 'cancelled'], {
            required_error: 'Status is required',
        }),
        transactionId: zod_1.z.string().optional(),
    }),
});
exports.WithdrawalValidation = {
    createWithdrawalZodSchema,
    updateWithdrawalStatusZodSchema,
};
