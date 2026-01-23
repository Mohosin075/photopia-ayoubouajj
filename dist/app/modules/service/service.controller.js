"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../../interfaces/pagination");
const pick_1 = __importDefault(require("../../../shared/pick"));
const service_service_1 = require("./service.service");
const service_constants_1 = require("./service.constants");
const createService = (0, catchAsync_1.default)(async (req, res) => {
    const serviceData = req.body;
    const { userId } = req.user;
    if (!userId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: 'User not authenticated',
        });
    }
    // Add providerId from authenticated user
    serviceData.providerId = userId;
    const result = await service_service_1.ServiceServices.createService(serviceData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: service_constants_1.SERVICE_CONSTANTS.MESSAGES.CREATED,
        data: result,
    });
});
const getAllServices = (0, catchAsync_1.default)(async (req, res) => {
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const filters = (0, pick_1.default)(req.query, service_constants_1.serviceFilterableFields);
    const result = await service_service_1.ServiceServices.getAllServices(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: service_constants_1.SERVICE_CONSTANTS.MESSAGES.RETRIEVED_ALL,
        data: result,
    });
});
const getSingleService = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await service_service_1.ServiceServices.getSingleService(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: service_constants_1.SERVICE_CONSTANTS.MESSAGES.RETRIEVED,
        data: result,
    });
});
const updateService = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const serviceData = req.body;
    const { userId } = req.user;
    const result = await service_service_1.ServiceServices.updateService(id, serviceData, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: service_constants_1.SERVICE_CONSTANTS.MESSAGES.UPDATED,
        data: result,
    });
});
const deleteService = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    const result = await service_service_1.ServiceServices.deleteService(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: service_constants_1.SERVICE_CONSTANTS.MESSAGES.DELETED,
        data: result,
    });
});
const getServicesByProvider = (0, catchAsync_1.default)(async (req, res) => {
    const { providerId } = req.params;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const filters = (0, pick_1.default)(req.query, service_constants_1.serviceFilterableFields);
    const result = await service_service_1.ServiceServices.getServicesByProvider(providerId, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Provider services retrieved successfully',
        data: result,
    });
});
const getMyServices = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const filters = (0, pick_1.default)(req.query, service_constants_1.serviceFilterableFields);
    if (!userId) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: 'User not authenticated',
        });
    }
    const result = await service_service_1.ServiceServices.getServicesByProvider(userId, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'My services retrieved successfully',
        data: result,
    });
});
const toggleServiceStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await service_service_1.ServiceServices.toggleServiceStatus(id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: service_constants_1.SERVICE_CONSTANTS.MESSAGES.UPDATED,
        data: result,
    });
});
exports.ServiceController = {
    createService,
    getAllServices,
    getSingleService,
    updateService,
    deleteService,
    getServicesByProvider,
    getMyServices,
    toggleServiceStatus,
};
