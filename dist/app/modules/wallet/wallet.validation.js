"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletValidation = void 0;
const zod_1 = require("zod");
const getWalletByUserIdZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }),
    }),
});
exports.WalletValidation = {
    getWalletByUserIdZodSchema,
};
