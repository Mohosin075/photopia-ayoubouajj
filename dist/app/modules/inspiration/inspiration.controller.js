"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspirationController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const inspiration_service_1 = require("./inspiration.service");
const pick_1 = __importDefault(require("../../../shared/pick"));
const pagination_1 = require("../../../interfaces/pagination");
const createInspiration = (0, catchAsync_1.default)(async (req, res) => {
    const result = await inspiration_service_1.InspirationServices.createInspiration(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Inspiration created successfully',
        data: result,
    });
});
const getAllInspirations = (0, catchAsync_1.default)(async (req, res) => {
    const filters = (0, pick_1.default)(req.query, ['searchTerm']);
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await inspiration_service_1.InspirationServices.getAllInspirations(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Inspirations retrieved successfully',
        data: result,
    });
});
const updateInspiration = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await inspiration_service_1.InspirationServices.updateInspiration(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Inspiration updated successfully',
        data: result,
    });
});
const deleteInspiration = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await inspiration_service_1.InspirationServices.deleteInspiration(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Inspiration deleted successfully',
        data: result,
    });
});
exports.InspirationController = {
    createInspiration,
    getAllInspirations,
    updateInspiration,
    deleteInspiration
};
