import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { ProfessionalProfileController } from './professionalProfile.controller'
import validateRequest from '../../middleware/validateRequest'
import { ProfessionalProfileValidation } from './professionalProfile.validation'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

router.post(
    '/',
    auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL),
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(ProfessionalProfileValidation.createProfessionalProfileSchema),
    ProfessionalProfileController.createProfile,
)

router.get(
    '/',
    auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL),
    ProfessionalProfileController.getProfile,
)

router.get(
    '/statistics',
    auth(USER_ROLES.PROFESSIONAL),
    ProfessionalProfileController.getDetailedStatistics,
)

router.get(
    '/statistics/export',
    auth(USER_ROLES.PROFESSIONAL),
    ProfessionalProfileController.exportStatisticsReport,
)

router.patch(
    '/',
    auth(USER_ROLES.PROFESSIONAL, USER_ROLES.USER),
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(ProfessionalProfileValidation.updateProfessionalProfileSchema),
    ProfessionalProfileController.updateProfile,
)

export const ProfessionalProfileRoutes = router
