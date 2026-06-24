import express from 'express'
import { ProjectIdeaController } from './projectIdea.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import {
  createProjectIdeaSchema,
  updateProjectIdeaSchema,
} from './projectIdea.validation'

const router = express.Router()

router.get('/', ProjectIdeaController.getAllProjectIdeas)

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(createProjectIdeaSchema),
  ProjectIdeaController.createProjectIdea,
)

router.put(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(updateProjectIdeaSchema),
  ProjectIdeaController.updateProjectIdea,
)

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(updateProjectIdeaSchema),
  ProjectIdeaController.updateProjectIdea,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  ProjectIdeaController.deleteProjectIdea,
)

export const ProjectIdeaRoutes = router
