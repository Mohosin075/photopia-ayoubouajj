import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ProfessionalProfileController } from './professionalProfile.controller'
import validateRequest from '../../middleware/validateRequest'
import { ProfessionalProfileValidation } from './professionalProfile.validation'

const router = express.Router()

router.post(
    '/',
    auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL),
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
    auth(USER_ROLES.PROFESSIONAL, USER_ROLES.USER),
    validateRequest(ProfessionalProfileValidation.updateProfessionalProfileSchema),
    ProfessionalProfileController.updateProfile,
)

export const ProfessionalProfileRoutes = router
