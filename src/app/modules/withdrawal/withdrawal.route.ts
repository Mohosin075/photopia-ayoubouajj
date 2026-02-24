import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { WithdrawalController } from './withdrawal.controller'

const router = express.Router()

router.post(
  '/',
  auth(USER_ROLES.PROFESSIONAL),
  WithdrawalController.createWithdrawal
)

router.get(
  '/my-withdrawals',
  auth(USER_ROLES.PROFESSIONAL),
  WithdrawalController.getMyWithdrawals
)

router.get(
  '/all-withdrawals',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  WithdrawalController.getAllWithdrawals
)

router.patch(
  '/:id/status',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  WithdrawalController.updateWithdrawalStatus
)

export const WithdrawalRoutes = router
