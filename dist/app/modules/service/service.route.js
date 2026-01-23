"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const service_controller_1 = require("./service.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const service_validation_1 = require("./service.validation");
const processReqBody_1 = require("../../middleware/processReqBody");
const router = express_1.default.Router();
// --- Public Routes ---
router
    .route('/')
    .get((0, validateRequest_1.default)(service_validation_1.filterServiceSchema), service_controller_1.ServiceController.getAllServices)
    .post((0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(service_validation_1.createServiceSchema), service_controller_1.ServiceController.createService);
router.get('/provider/:providerId', (0, validateRequest_1.default)(service_validation_1.filterServiceSchema), service_controller_1.ServiceController.getServicesByProvider);
// --- Provider Routes ---
router.get('/my/services', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(service_validation_1.filterServiceSchema), service_controller_1.ServiceController.getMyServices);
router
    .route('/:id')
    .get(service_controller_1.ServiceController.getSingleService)
    .patch((0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(service_validation_1.updateServiceSchema), service_controller_1.ServiceController.updateService)
    .delete((0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), service_controller_1.ServiceController.deleteService);
router.patch('/:id/status', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(service_validation_1.toggleServiceStatusSchema), service_controller_1.ServiceController.toggleServiceStatus);
exports.ServiceRoutes = router;
