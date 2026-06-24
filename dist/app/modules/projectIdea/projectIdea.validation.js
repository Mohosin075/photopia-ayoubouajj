"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectIdeaSchema = exports.createProjectIdeaSchema = void 0;
const zod_1 = require("zod");
exports.createProjectIdeaSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({
            required_error: 'Title is required',
        }),
        linkText: zod_1.z.string({
            required_error: 'Link text is required',
        }),
        subCategoryId: zod_1.z.string({
            required_error: 'Subcategory ID is required',
        }),
        order: zod_1.z.number().optional(),
    }),
});
exports.updateProjectIdeaSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        linkText: zod_1.z.string().optional(),
        subCategoryId: zod_1.z.string().optional(),
        order: zod_1.z.number().optional(),
    }),
});
