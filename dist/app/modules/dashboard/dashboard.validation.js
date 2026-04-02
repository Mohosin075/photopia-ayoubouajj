"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardValidation = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const getUserDetailsStatsZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z
            .string({
            required_error: 'User ID is required',
        })
            .regex(objectIdRegex, 'Invalid user ID format'),
    }),
});
const warnUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z
            .string({
            required_error: 'User ID is required',
        })
            .regex(objectIdRegex, 'Invalid user ID format'),
        message: zod_1.z.string({
            required_error: 'Warning message is required',
        }),
    }),
});
const getModerationReportDetailsZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        reportId: zod_1.z
            .string({
            required_error: 'Report ID is required',
        })
            .regex(objectIdRegex, 'Invalid report ID format'),
    }),
});
const handleModerationActionZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        reportId: zod_1.z
            .string({
            required_error: 'Report ID is required',
        })
            .regex(objectIdRegex, 'Invalid report ID format'),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['warning', 'block', 'remove', 'archive', 'refund', 'close'], {
            required_error: 'Action is required',
        }),
        details: zod_1.z.string().optional(),
    }),
});
const getTransactionDetailsZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        transactionId: zod_1.z
            .string({
            required_error: 'Transaction ID is required',
        })
            .regex(objectIdRegex, 'Invalid transaction ID format'),
    }),
});
exports.DashboardValidation = {
    getUserDetailsStatsZodSchema,
    warnUserZodSchema,
    getModerationReportDetailsZodSchema,
    handleModerationActionZodSchema,
    getTransactionDetailsZodSchema,
};
