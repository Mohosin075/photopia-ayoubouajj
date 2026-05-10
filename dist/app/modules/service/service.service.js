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
const mongoose_1 = require("mongoose");
const service_constants_1 = require("./service.constants");
const user_model_1 = require("../user/user.model");
const service_1 = require("../../../enum/service");
const category_model_1 = require("../category/category.model");
const professionalProfile_model_1 = require("../professionalProfile/professionalProfile.model");
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
        { path: 'category', select: 'name image theme' },
        { path: 'subCategory', select: 'name theme' },
    ]);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, service_constants_1.SERVICE_CONSTANTS.MESSAGES.CREATE_FAILED);
    }
    return result;
};
const buildWhereConditions = async (filters) => {
    const { searchTerm, minPrice, maxPrice, isVerified, isActive, status, theme, isOnline, quickResponse, expressDelivery, thisWeekend, lastMinute, ...filterData } = filters;
    const conditions = {};
    // ... rest of the logic ...
    // Handle new filters based on provider profile or other criteria
    if (isOnline !== undefined) {
        const onlineUsers = await user_model_1.User.find({ isOnline: isOnline === 'true' || isOnline === true }).select('_id').lean();
        conditions.providerId = { $in: onlineUsers.map(u => u._id) };
    }
    if (quickResponse !== undefined) {
        const quickResProfiles = await professionalProfile_model_1.ProfessionalProfile.find({ responseTime: { $lte: 120 } }).select('user').lean();
        const userIds = quickResProfiles.map(p => p.user);
        if (conditions.providerId) {
            conditions.providerId.$in = (conditions.providerId.$in || []).filter((id) => userIds.includes(id));
        }
        else {
            conditions.providerId = { $in: userIds };
        }
    }
    if (expressDelivery !== undefined) {
        // Assuming express delivery is delivery within 48 hours
        const expressProfiles = await professionalProfile_model_1.ProfessionalProfile.find({ deliveryRate: { $gte: 95 } }).select('user').lean();
        const userIds = expressProfiles.map(p => p.user);
        if (conditions.providerId) {
            conditions.providerId.$in = (conditions.providerId.$in || []).filter((id) => userIds.includes(id));
        }
        else {
            conditions.providerId = { $in: userIds };
        }
    }
    if (thisWeekend !== undefined) {
        // Filter providers available on Saturday or Sunday
        const { Availability } = require('../availability/availability.model');
        const availableProviders = await Availability.find({
            $or: [
                { 'defaultSchedule.saturday.isActive': true },
                { 'defaultSchedule.sunday.isActive': true }
            ]
        }).select('providerId').lean();
        const userIds = availableProviders.map((a) => a.providerId);
        if (conditions.providerId) {
            conditions.providerId.$in = (conditions.providerId.$in || []).filter((id) => userIds.includes(id));
        }
        else {
            conditions.providerId = { $in: userIds };
        }
    }
    if (lastMinute !== undefined) {
        // Filter providers with low advance notice hours
        const { Availability } = require('../availability/availability.model');
        const lastMinuteProviders = await Availability.find({
            advanceNoticeHours: { $lte: 4 } // 4 hours or less
        }).select('providerId').lean();
        const userIds = lastMinuteProviders.map((a) => a.providerId);
        if (conditions.providerId) {
            conditions.providerId.$in = (conditions.providerId.$in || []).filter((id) => userIds.includes(id));
        }
        else {
            conditions.providerId = { $in: userIds };
        }
    }
    // theme filtering logic already exists below...
    // Exclude DELETED services by default unless explicitly filtering for them
    if (status !== undefined) {
        conditions.status = status;
    }
    else {
        conditions.status = { $ne: service_1.SERVICE_STATUS.DELETED };
    }
    // Handle theme filtering by finding all categories with that theme
    if (theme) {
        const categories = await category_model_1.Category.find({ theme }).select('_id').lean();
        if (categories.length > 0) {
            conditions.category = { $in: categories.map(c => c._id) };
        }
        else {
            // If theme provided but no categories found, force empty result
            conditions.category = new mongoose_1.Types.ObjectId();
        }
    }
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
            else if (['category', 'subCategory', 'providerId'].includes(field)) {
                if (mongoose_1.Types.ObjectId.isValid(value)) {
                    conditions[field] = value;
                }
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
    const whereConditions = await buildWhereConditions(filters);
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
            .populate('providerId', 'name fullName email profile isOnline')
            .populate('category', 'name image icon theme')
            .populate('subCategory', 'name theme')
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
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    const result = await service_model_1.Service.findByIdAndUpdate(id, { $inc: { totalView: 1 } }, { new: true })
        .populate('providerId', 'name fullName email profile isOnline')
        .populate('category', 'name image icon theme')
        .populate('subCategory', 'name theme');
    if (!result || result.status === service_1.SERVICE_STATUS.DELETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    return result;
};
const updateService = async (id, payload, userId) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    const service = await service_model_1.Service.findById(id);
    if (!service) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    // Check if user is authorized (providerId or admin)
    const user = userId ? await user_model_1.User.findById(userId) : null;
    const isAdmin = user && user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role));
    if (userId && service.providerId.toString() !== userId && !isAdmin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, service_constants_1.SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED);
    }
    // Only Admin can set isOriginal
    if (payload.isOriginal !== undefined && !isAdmin) {
        delete payload.isOriginal;
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
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    const service = await service_model_1.Service.findById(id);
    if (!service) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, service_constants_1.SERVICE_CONSTANTS.MESSAGES.NOT_FOUND);
    }
    // Check if already deleted
    if (service.status === service_1.SERVICE_STATUS.DELETED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Service is already deleted');
    }
    // Check if user is authorized (providerId or admin)
    if (userId && service.providerId.toString() !== userId) {
        const user = await user_model_1.User.findById(userId);
        if (!user || !user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, service_constants_1.SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED);
        }
    }
    // Soft delete: set status to DELETED
    const result = await service_model_1.Service.findByIdAndUpdate(id, { status: service_1.SERVICE_STATUS.DELETED }, { new: true });
    return result;
};
const getServicesByProvider = async (providerId, filters, paginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    // Merge providerId into filters
    const whereConditions = await buildWhereConditions({ ...filters, providerId });
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
            .populate('providerId', 'name fullName email profile isOnline')
            .populate('category', 'name image icon theme')
            .populate('subCategory', 'name theme')
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
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Service not found');
    }
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
