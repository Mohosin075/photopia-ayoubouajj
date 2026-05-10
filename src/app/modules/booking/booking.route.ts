import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { BookingController } from './booking.controller'
import { createBookingValidationSchema, updateBookingStatusSchema, modifyOfferValidationSchema } from './booking.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createBookingValidationSchema),
  BookingController.createBooking
)

router.post(
  '/calculate-price',
  // Public or auth depending on requirement. Allowing public for now or user.
  // auth(USER_ROLES.USER),
  BookingController.calculatePrice
)

router.get(
  '/my-bookings',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  BookingController.getMyBookings
)

router.get(
  '/my-bookings-by-date',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  BookingController.getMyBookingsByDate
)

router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  BookingController.getSingleBooking
)

router.patch(
  '/:id/status',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(updateBookingStatusSchema),
  BookingController.updateBookingStatus
)
 
router.patch(
  '/:id/modify-offer',
  auth(USER_ROLES.PROFESSIONAL),
  validateRequest(modifyOfferValidationSchema),
  BookingController.modifyBookingOffer
)

router.post(
  '/:id/pay-balance',
  auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  BookingController.payRemainingBalance
)
    




export const BookingRoutes = router
