import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { BookingController } from './booking.controller'
import { createBookingValidationSchema, updateBookingStatusSchema } from './booking.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN),
  validateRequest(createBookingValidationSchema),
  BookingController.createBooking
)

router.post(
  '/calculate-price',
  // Public or auth depending on requirement. Allowing public for now or user.
  // auth(USER_ROLES.USER),
  BookingController.calculatePrice
)

router.patch(
  '/:id/status',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN),
  validateRequest(updateBookingStatusSchema),
  BookingController.updateBookingStatus
)

router.get(
  '/my-bookings',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN),
  BookingController.getMyBookings
)


export const BookingRoutes = router
