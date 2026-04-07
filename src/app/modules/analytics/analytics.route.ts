import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { AnalyticsController } from './analytics.controller'
import validateRequest from '../../middleware/validateRequest'
import { AnalyticsValidation } from './analytics.validation'

const router = express.Router()

router.post(
  '/track',
  validateRequest(AnalyticsValidation.trackVisitZodSchema),
  AnalyticsController.trackVisit
)

router.get(
  '/premium',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AnalyticsController.getPremiumAnalytics
)

export const AnalyticsRoutes = router
