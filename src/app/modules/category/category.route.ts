import express from 'express'
import { CategoryController } from './category.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import validateRequest from '../../middleware/validateRequest'
import { createCategorySchema, updateCategorySchema } from './category.validation'

const router = express.Router()

router
    .route('/')
    .get(CategoryController.getAllCategories)
    .post(
        auth(USER_ROLES.ADMIN),
        validateRequest(createCategorySchema),
        CategoryController.createCategory,
    )

router
    .route('/:id')
    .get(CategoryController.getSingleCategory)
    .patch(
        auth(USER_ROLES.ADMIN),
        validateRequest(updateCategorySchema),
        CategoryController.updateCategory,
    )
    .delete(auth(USER_ROLES.ADMIN), CategoryController.deleteCategory)

export const CategoryRoutes = router
