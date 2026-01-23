"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalProfileRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const professionalProfile_controller_1 = require("./professionalProfile.controller");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const professionalProfile_validation_1 = require("./professionalProfile.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER), (0, validateRequest_1.default)(professionalProfile_validation_1.ProfessionalProfileValidation.createProfessionalProfileSchema), professionalProfile_controller_1.ProfessionalProfileController.createProfile);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.PROFESSIONAL), professionalProfile_controller_1.ProfessionalProfileController.getProfile);
router.patch('/', (0, auth_1.default)(user_1.USER_ROLES.PROFESSIONAL), (0, validateRequest_1.default)(professionalProfile_validation_1.ProfessionalProfileValidation.updateProfessionalProfileSchema), professionalProfile_controller_1.ProfessionalProfileController.updateProfile);
exports.ProfessionalProfileRoutes = router;
