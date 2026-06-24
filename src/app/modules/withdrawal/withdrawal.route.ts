import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { WithdrawalController } from './withdrawal.controller'
import validateRequest from '../../middleware/validateRequest'
import { WithdrawalValidation } from './withdrawal.validation'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(WithdrawalValidation.createWithdrawalZodSchema),
  WithdrawalController.createWithdrawal,
)

router.get(
  '/my-withdrawals',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  WithdrawalController.getMyWithdrawals,
)

router.get(
  '/all-withdrawals',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  WithdrawalController.getAllWithdrawals,
)

router.patch(
  '/:id/status',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(WithdrawalValidation.updateWithdrawalStatusZodSchema),
  WithdrawalController.updateWithdrawalStatus,
)

export const WithdrawalRoutes = router
