"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspirationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const inspiration_controller_1 = require("./inspiration.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const inspiration_validation_1 = require("./inspiration.validation");
const router = express_1.default.Router();
router.get('/', inspiration_controller_1.InspirationController.getAllInspirations);
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(inspiration_validation_1.createInspirationSchema), inspiration_controller_1.InspirationController.createInspiration);
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(inspiration_validation_1.updateInspirationSchema), inspiration_controller_1.InspirationController.updateInspiration);
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), inspiration_controller_1.InspirationController.deleteInspiration);
exports.InspirationRoutes = router;
