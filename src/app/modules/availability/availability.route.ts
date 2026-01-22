import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { AvailabilityController } from './availability.controller'
import { createAvailabilityValidationSchema, updateAvailabilityValidationSchema } from './availability.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN),
  validateRequest(createAvailabilityValidationSchema),
  AvailabilityController.createOrUpdateAvailability
)

router.get(
  '/my-availability',
  auth(USER_ROLES.PROFESSIONAL),
  AvailabilityController.getMyAvailability
)

router.get(
  '/:providerId',
  AvailabilityController.getProviderAvailability
)

export const AvailabilityRoutes = router
