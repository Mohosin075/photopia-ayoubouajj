import express from 'express'
import { HomeController } from './home.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

// Allow both guests and authenticated users
router.get(
  '/',
  (req, res, next) => {
    // If there is an auth header, try to authenticate
    if (req.headers.authorization) {
      return auth(
        USER_ROLES.USER,
        USER_ROLES.ADMIN,
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.PROFESSIONAL,
      )(req, res, next)
    }
    next()
  },
  HomeController.getHomeData,
)

export const HomeRoutes = router
