"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectIdea = void 0;
const mongoose_1 = require("mongoose");
const projectIdeaSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    linkText: {
        type: String,
        required: true,
        trim: true,
    },
    subCategoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
projectIdeaSchema.index({ order: 1 });
projectIdeaSchema.index({ subCategoryId: 1 });
exports.ProjectIdea = (0, mongoose_1.model)('ProjectIdea', projectIdeaSchema);
