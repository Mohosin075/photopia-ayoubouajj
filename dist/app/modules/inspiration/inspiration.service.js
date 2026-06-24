"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspirationServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const inspiration_model_1 = require("./inspiration.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const createInspiration = async (payload) => {
    const result = await inspiration_model_1.Inspiration.create(payload);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create inspiration');
    }
    return result;
};
const getAllInspirations = async (filters, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const { searchTerm } = filters;
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        inspiration_model_1.Inspiration.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder }),
        inspiration_model_1.Inspiration.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const updateInspiration = async (id, payload) => {
    const result = await inspiration_model_1.Inspiration.findByIdAndUpdate(id, payload, { new: true });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Inspiration not found');
    }
    return result;
};
const deleteInspiration = async (id) => {
    const result = await inspiration_model_1.Inspiration.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Inspiration not found');
    }
    return result;
};
exports.InspirationServices = {
    createInspiration,
    getAllInspirations,
    updateInspiration,
    deleteInspiration,
};
