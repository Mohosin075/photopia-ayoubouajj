"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowRoutes = void 0;
const express_1 = __importDefault(require("express"));
const follow_controller_1 = require("./follow.controller");
const auth_1 = __importDefault(require("../../middleware/auth"));
const user_1 = require("../../../enum/user");
const validateRequest_1 = __importDefault(require("../../middleware/validateRequest"));
const follow_validation_1 = require("./follow.validation");
const router = express_1.default.Router();
// Follow/Unfollow routes
router.post('/:userId', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.followUserSchema), follow_controller_1.FollowController.followUser);
router.delete('/:userId/unfollow', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.unfollowUserSchema), follow_controller_1.FollowController.unfollowUser);
// Follow request management
router.post('/:followerId/accept', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.acceptFollowRequestSchema), follow_controller_1.FollowController.acceptFollowRequest);
router.post('/:followerId/reject', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.rejectFollowRequestSchema), follow_controller_1.FollowController.rejectFollowRequest);
// Block/Unblock
router.post('/:userId/block', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.blockUserSchema), follow_controller_1.FollowController.blockUser);
router.delete('/:userId/unblock', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.unblockUserSchema), follow_controller_1.FollowController.unblockUser);
// Get followers/following
router.get('/:userId/followers', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.getFollowersSchema), follow_controller_1.FollowController.getFollowers);
// Get stats
router.get('/:userId/stats', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.getFollowStatsSchema), follow_controller_1.FollowController.getFollowStats);
// Check status
router.get('/:userId/status', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.checkFollowStatusSchema), follow_controller_1.FollowController.checkFollowStatus);
// Mutual followers
router.get('/:userId/mutual', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.getMutualFollowersSchema), follow_controller_1.FollowController.getMutualFollowers);
// Suggestions
router.get('/suggestions', (0, auth_1.default)(...Object.values(user_1.USER_ROLES)), (0, validateRequest_1.default)(follow_validation_1.getFollowSuggestionsSchema), follow_controller_1.FollowController.getFollowSuggestions);
exports.FollowRoutes = router;
