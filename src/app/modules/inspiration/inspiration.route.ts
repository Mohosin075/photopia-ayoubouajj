import express from 'express'
import { InspirationController } from './inspiration.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { createInspirationSchema, updateInspirationSchema } from './inspiration.validation'

const router = express.Router()

router.get('/', InspirationController.getAllInspirations)

router.post(
    '/',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(createInspirationSchema),
    InspirationController.createInspiration
)

router.patch(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    validateRequest(updateInspirationSchema),
    InspirationController.updateInspiration
)

router.delete(
    '/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    InspirationController.deleteInspiration
)

export const InspirationRoutes = router
