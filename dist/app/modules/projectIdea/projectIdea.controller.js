"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectIdeaController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const projectIdea_service_1 = require("./projectIdea.service");
const pick_1 = __importDefault(require("../../../shared/pick"));
const pagination_1 = require("../../../interfaces/pagination");
const createProjectIdea = (0, catchAsync_1.default)(async (req, res) => {
    const result = await projectIdea_service_1.ProjectIdeaServices.createProjectIdea(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Project idea created successfully',
        data: result,
    });
});
const getAllProjectIdeas = (0, catchAsync_1.default)(async (req, res) => {
    const filters = (0, pick_1.default)(req.query, ['searchTerm']);
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await projectIdea_service_1.ProjectIdeaServices.getAllProjectIdeas(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Project ideas retrieved successfully',
        data: result,
    });
});
const updateProjectIdea = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await projectIdea_service_1.ProjectIdeaServices.updateProjectIdea(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Project idea updated successfully',
        data: result,
    });
});
const deleteProjectIdea = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await projectIdea_service_1.ProjectIdeaServices.deleteProjectIdea(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Project idea deleted successfully',
        data: result,
    });
});
exports.ProjectIdeaController = {
    createProjectIdea,
    getAllProjectIdeas,
    updateProjectIdea,
    deleteProjectIdea,
};
