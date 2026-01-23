"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceServices = void 0;
// src/app/modules/service/service.service.ts
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const service_model_1 = require("./service.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const service_constants_1 = require("./service.constants");
const user_model_1 = require("../user/user.model");
const createService = async (payload) => {
    // Check if providerId already has a service with same title
    const existingService = await service_model_1.Service.findOne({
        providerId: payload.providerId,
        title: payload.title,
    });
    if (existingService) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, service_constants_1.SERVICE_CONSTANTS.MESSAGES.ALREADY_EXISTS);
    }
    // Map images from upload middleware
    if (payload.images) {
        const images = payload.images;
        if (images.length > 0) {
            payload.coverMedia = images[0];
            payload.gallery = images;
        }
        delete payload.images;
    }
    const result = (await service_model_1.Service.create(payload)).populate([
        { path: 'providerId', select: 'name email profile' },
        { path: 'category', select: 'name image' },
    ]);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, service_constants_1.SERVICE_CONSTANTS.MESSAGES.CREATE_FAILED);
    }
    return result;
};
const buildWhereConditions = (filters) => {
    const { searchTerm, minPrice, maxPrice, isVerified, isActive, ...filterData } = filters;
    const conditions = {};
    // Text search optimization or partial regex match
    if (searchTerm) {
        conditions.$or = service_constants_1.serviceSearchableFields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' }
        }));
    }
    // Range-based optimizations
    if (minPrice !== undefined || maxPrice !== undefined) {
        conditions.price = {};
        if (minPrice !== undefined)
            conditions.price.$gte = Number(minPrice);
        if (maxPrice !== undefined)
            conditions.price.$lte = Number(maxPrice);
    }
    // Direct flag matching
    if (isVerified !== undefined) {
        conditions.isVerified = isVerified === 'true' || isVerified === true;
    }
    if (isActive !== undefined) {
        conditions.isActive = isActive === 'true' || isActive === true;
    }
    // Efficiently handle other exact matches and array $in queries
    Object.entries(filterData).forEach(([field, value]) => {
        if (value !== undefined && value !== '') {
            if (field === 'tags' || field === 'equipment') {
                conditions[field] = { $in: Array.isArray(value) ? value : [value] };
            }
            else {
                conditions[field] = value;
            }
        }
    });
    return conditions;
};
const getAllServices = async (filters, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const whereConditions = buildWhereConditions(filters);
    // Default sort by createdAt descending
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    else {
        sortConditions.createdAt = -1;
    }
    const [result, total] = await Promise.all([
        service_model_1.Service.find(whereConditions)
            .select(service_constants_1.SERVICE_LIST_PROJECTION)
            .populate('providerId', 'name email profile')
            .populate('category', 'name image')
            .skip(skip)
            .limit(limit)
            .sort(sortConditions)
            .lean(),
        service_model_1.Service.countDocuments(whereConditions),
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
const getSingleService = async (id) => {
    const result = await service_model_1.Service.findById(id)
        .populate('providerId', 'name email profile')
        .populate('category', 'name image');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    return result;
};
const updateService = async (id, payload, userId) => {
    const service = await service_model_1.Service.findById(id);
    if (!service) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    // Check if user is authorized (providerId or admin)
    if (userId && service.providerId.toString() !== userId) {
        const user = await user_model_1.User.findById(userId);
        if (!user || !user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, service_constants_1.SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED);
        }
    }
    // Check for duplicate title if updating
    if (payload.title && payload.title !== service.title) {
        const existingService = await service_model_1.Service.findOne({
            providerId: service.providerId,
            title: payload.title,
            _id: { $ne: id }
        });
        if (existingService) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, service_constants_1.SERVICE_CONSTANTS.MESSAGES.ALREADY_EXISTS);
        }
    }
    // Map images from upload middleware
    if (payload.images) {
        const images = payload.images;
        if (images.length > 0) {
            payload.coverMedia = images[0];
            if (!payload.gallery) {
                payload.gallery = images.slice(1);
            }
            else {
                payload.gallery = [...payload.gallery, ...images.slice(1)];
            }
        }
        delete payload.images;
    }
    const result = await service_model_1.Service.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    })
        .populate('providerId', 'name email profile')
        .populate('category', 'name image');
    return result;
};
const deleteService = async (id, userId) => {
    const service = await service_model_1.Service.findById(id);
    if (!service) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    // Check if user is authorized (providerId or admin)
    if (userId && service.providerId.toString() !== userId) {
        const user = await user_model_1.User.findById(userId);
        if (!user || !user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, service_constants_1.SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED);
        }
    }
    const result = await service_model_1.Service.findByIdAndDelete(id);
    return result;
};
const getServicesByProvider = async (providerId, filters, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    // Merge providerId into filters
    const whereConditions = buildWhereConditions({ ...filters, providerId });
    // Sort conditions
    const sortConditions = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    else {
        sortConditions.createdAt = -1;
    }
    const [result, total] = await Promise.all([
        service_model_1.Service.find(whereConditions)
            .select(service_constants_1.SERVICE_LIST_PROJECTION)
            .populate('providerId', 'name email profile')
            .populate('category', 'name image')
            .skip(skip)
            .limit(limit)
            .sort(sortConditions)
            .lean(),
        service_model_1.Service.countDocuments(whereConditions),
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
const toggleServiceStatus = async (id, status) => {
    const service = await service_model_1.Service.findById(id);
    if (!service) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    }
    const result = await service_model_1.Service.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    return result;
};
exports.ServiceServices = {
    createService,
    getAllServices,
    getSingleService,
    updateService,
    deleteService,
    getServicesByProvider,
    toggleServiceStatus,
};
