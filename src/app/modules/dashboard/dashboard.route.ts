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

export const DashboardRoutes = router
