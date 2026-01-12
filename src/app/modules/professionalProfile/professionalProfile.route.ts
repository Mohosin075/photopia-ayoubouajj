import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ProfessionalProfileController } from './professionalProfile.controller'

const router = express.Router()

router.post(
    '/',
    auth(USER_ROLES.USER),
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
    ProfessionalProfileController.updateProfile,
)

export const ProfessionalProfileRoutes = router
