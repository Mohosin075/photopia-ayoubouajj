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

// Public endpoint to check if a specific date is available
router.get(
  '/check/:providerId',
  AvailabilityController.checkDateAvailability
)

// Public endpoint to get available time slots for a specific date
router.get(
  '/slots/:providerId',
  AvailabilityController.getTimeSlots
)

// Public endpoint to get month calendar overview
router.get(
  '/calendar/:providerId',
  AvailabilityController.getMonthCalendar
)

export const AvailabilityRoutes = router
