"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectIdeaServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const projectIdea_model_1 = require("./projectIdea.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const createProjectIdea = async (payload) => {
    const result = await projectIdea_model_1.ProjectIdea.create(payload);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create project idea');
    }
    return result;
};
const getAllProjectIdeas = async (filters, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const { searchTerm } = filters;
    const andConditions = [];
    if (searchTerm) {
        andConditions.push({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { linkText: { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }
    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};
    const finalSortBy = sortBy || 'order';
    const finalSortOrder = sortOrder || 'asc';
    const [result, total] = await Promise.all([
        projectIdea_model_1.ProjectIdea.find(whereConditions)
            .populate('subCategoryId')
            .skip(skip)
            .limit(limit)
            .sort({ [finalSortBy]: finalSortOrder }),
        projectIdea_model_1.ProjectIdea.countDocuments(whereConditions),
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
const updateProjectIdea = async (id, payload) => {
    const result = await projectIdea_model_1.ProjectIdea.findByIdAndUpdate(id, payload, {
        new: true,
    }).populate('subCategoryId');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Project idea not found');
    }
    return result;
};
const deleteProjectIdea = async (id) => {
    const result = await projectIdea_model_1.ProjectIdea.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Project idea not found');
    }
    return result;
};
exports.ProjectIdeaServices = {
    createProjectIdea,
    getAllProjectIdeas,
    updateProjectIdea,
    deleteProjectIdea,
};
