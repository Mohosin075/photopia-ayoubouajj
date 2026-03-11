import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { DashboardController } from './dashboard.controller'

const router = express.Router()

router.get(
  '/user-stats',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getUserManagementStats,
)

router.get(
  '/user-details/:userId',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getUserDetailsStats,
)

router.post(
  '/warn-user',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.warnUser,
)

router.get(
  '/moderation-stats',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getContentModerationStats,
)

router.get(
  '/moderation-reports',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getModerationReports,
)

router.get(
  '/moderation-reports/:reportId',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getModerationReportDetails,
)

router.post(
  '/moderation-reports/:reportId/action',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.handleModerationAction,
)

export const DashboardRoutes = router
