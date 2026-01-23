"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enum/user");
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
    },
    serviceType: {
        type: String,
        enum: Object.values(user_1.SERVICE_TYPE),
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
categorySchema.index({ name: 1 });
categorySchema.index({ serviceType: 1 });
exports.Category = (0, mongoose_1.model)('Category', categorySchema);
