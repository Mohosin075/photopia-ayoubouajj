import express from 'express'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { WalletController } from './wallet.controller'

const router = express.Router()

router.get(
  '/my-wallet',
  auth(USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  WalletController.getMyWallet,
)

export const WalletRoutes = router
