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

export const AnalyticsRoutes = router
