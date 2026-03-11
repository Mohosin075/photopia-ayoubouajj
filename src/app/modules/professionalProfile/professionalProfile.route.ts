import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ProfessionalProfileController } from './professionalProfile.controller'
import validateRequest from '../../middleware/validateRequest'
import { ProfessionalProfileValidation } from './professionalProfile.validation'

const router = express.Router()

router.post(
    '/',
    auth(USER_ROLES.USER),
    validateRequest(ProfessionalProfileValidation.createProfessionalProfileSchema),
    ProfessionalProfileController.createProfile,
)

router.get(
    '/',
    auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL),
    ProfessionalProfileController.getProfile,
)

router.patch(
    '/',
    auth(USER_ROLES.PROFESSIONAL),
    validateRequest(ProfessionalProfileValidation.updateProfessionalProfileSchema),
    ProfessionalProfileController.updateProfile,
)

router.post(
    '/stripe-connect-onboarding',
    auth(USER_ROLES.PROFESSIONAL),
    ProfessionalProfileController.stripeConnectOnboarding,
)

router.get(
    '/stripe-connect-status',
    auth(USER_ROLES.PROFESSIONAL),
    ProfessionalProfileController.checkStripeAccountStatus,
)

// Public route for Stripe to return to, which will redirect to frontend
router.get(
    '/stripe-connect-return',
    ProfessionalProfileController.checkStripeAccountStatus,
)

export const ProfessionalProfileRoutes = router
