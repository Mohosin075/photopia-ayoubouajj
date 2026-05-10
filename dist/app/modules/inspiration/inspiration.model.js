"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inspiration = void 0;
const mongoose_1 = require("mongoose");
const inspirationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    link: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.Inspiration = (0, mongoose_1.model)('Inspiration', inspirationSchema);
