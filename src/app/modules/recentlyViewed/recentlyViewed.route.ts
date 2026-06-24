import express from 'express'
import { RecentlyViewedController } from './recentlyViewed.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router
  .route('/')
  .get(
    auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN),
    RecentlyViewedController.getRecentlyViewed,
  )
  .post(
    auth(USER_ROLES.USER, USER_ROLES.PROFESSIONAL, USER_ROLES.ADMIN),
    RecentlyViewedController.recordView,
  )

export const RecentlyViewedRoutes = router
