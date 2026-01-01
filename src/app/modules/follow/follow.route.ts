import express from 'express'
import { FollowController } from './follow.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import {
  followUserSchema,
  unfollowUserSchema,
  acceptFollowRequestSchema,
  rejectFollowRequestSchema,
  blockUserSchema,
  unblockUserSchema,
  getFollowersSchema,
  getFollowStatsSchema,
  checkFollowStatusSchema,
  getMutualFollowersSchema,
  getFollowSuggestionsSchema,
} from './follow.validation'

const router = express.Router()

// Follow/Unfollow routes
router.post(
  '/:userId',
  auth(...Object.values(USER_ROLES)),
  validateRequest(followUserSchema),
  FollowController.followUser,
)

router.delete(
  '/:userId/unfollow',
  auth(...Object.values(USER_ROLES)),
  validateRequest(unfollowUserSchema),
  FollowController.unfollowUser,
)

// Follow request management
router.post(
  '/:followerId/accept',
  auth(...Object.values(USER_ROLES)),
  validateRequest(acceptFollowRequestSchema),
  FollowController.acceptFollowRequest,
)

router.post(
  '/:followerId/reject',
  auth(...Object.values(USER_ROLES)),
  validateRequest(rejectFollowRequestSchema),
  FollowController.rejectFollowRequest,
)

// Block/Unblock
router.post(
  '/:userId/block',
  auth(...Object.values(USER_ROLES)),
  validateRequest(blockUserSchema),
  FollowController.blockUser,
)

router.delete(
  '/:userId/unblock',
  auth(...Object.values(USER_ROLES)),
  validateRequest(unblockUserSchema),
  FollowController.unblockUser,
)

// Get followers/following
router.get(
  '/:userId/followers',
  auth(...Object.values(USER_ROLES)),
  validateRequest(getFollowersSchema),
  FollowController.getFollowers,
)

// Get stats
router.get(
  '/:userId/stats',
  auth(...Object.values(USER_ROLES)),
  validateRequest(getFollowStatsSchema),
  FollowController.getFollowStats,
)

// Check status
router.get(
  '/:userId/status',
  auth(...Object.values(USER_ROLES)),
  validateRequest(checkFollowStatusSchema),
  FollowController.checkFollowStatus,
)

// Mutual followers
router.get(
  '/:userId/mutual',
  auth(...Object.values(USER_ROLES)),
  validateRequest(getMutualFollowersSchema),
  FollowController.getMutualFollowers,
)

// Suggestions
router.get(
  '/suggestions',
  auth(...Object.values(USER_ROLES)),
  validateRequest(getFollowSuggestionsSchema),
  FollowController.getFollowSuggestions,
)

export const FollowRoutes = router
