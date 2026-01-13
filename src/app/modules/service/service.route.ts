import express from 'express'
import { ServiceController } from './service.controller'
import auth from '../../middleware/auth'
import { SERVICE_TYPE, USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import {
  createServiceSchema,
  updateServiceSchema,
  filterServiceSchema,
  toggleServiceStatusSchema,
} from './service.validation'
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody'

const router = express.Router()

// --- Public Routes ---
router
  .route('/')
  .get(validateRequest(filterServiceSchema), ServiceController.getAllServices)
  .post(
    auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(createServiceSchema),
    ServiceController.createService
  )

router.get(
  '/provider/:providerId',
  validateRequest(filterServiceSchema),
  ServiceController.getServicesByProvider
)

// --- Provider Routes ---
router.get(
  '/my/services',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(filterServiceSchema),
  ServiceController.getMyServices
)

router
  .route('/:id')
  .get(ServiceController.getSingleService)
  .patch(
    auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(updateServiceSchema),
    ServiceController.updateService
  )
  .delete(auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), ServiceController.deleteService)

router.patch(
  '/:id/status',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(toggleServiceStatusSchema),
  ServiceController.toggleServiceStatus
)

export const ServiceRoutes = router