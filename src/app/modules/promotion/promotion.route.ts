import express from 'express'
import { PromotionController } from './promotion.controller'
import auth from '../../middleware/auth'
import validateRequest from '../../middleware/validateRequest'
import { PromotionValidation } from './promotion.validation'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER),
  validateRequest(PromotionValidation.createPromotionZodSchema),
  PromotionController.createPromotion,
)

router.get(
  '/',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),
  PromotionController.getAllPromotions,
)

router.get(
  '/my-promotions',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER),
  PromotionController.getMyPromotions,
)

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER),
  PromotionController.getSinglePromotion,
)

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER),
  validateRequest(PromotionValidation.updatePromotionZodSchema),
  PromotionController.updatePromotion,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER),
  PromotionController.deletePromotion,
)

router.patch(
  '/:id/toggle-status',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER),
  PromotionController.togglePromotionStatus,
)

router.post(
  '/validate',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),
  validateRequest(PromotionValidation.validatePromotionZodSchema),
  PromotionController.validatePromotion,
)

router.post(
  '/apply',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.USER,
    USER_ROLES.ORGANIZER,
  ),
  validateRequest(PromotionValidation.applyPromotionZodSchema),
  PromotionController.applyPromotion,
)

export const PromotionRoutes = router
