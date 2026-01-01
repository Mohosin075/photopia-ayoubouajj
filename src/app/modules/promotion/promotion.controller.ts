import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { PromotionService } from './promotion.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import pick from '../../../shared/pick'
import { IPromotionFilterables } from './promotion.service'
import { paginationFields } from '../../../interfaces/pagination'
import { JwtPayload } from 'jsonwebtoken'

const createPromotion = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await PromotionService.createPromotion(user, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Promotion created successfully',
    data: result,
  })
})

const getAllPromotions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const filters = pick(req.query, [
    'searchTerm',
    'isActive',
    'discountType',
    'isSingleUse',
  ]) as IPromotionFilterables
  const paginationOptions = pick(req.query, paginationFields)

  const result = await PromotionService.getAllPromotions(
    user,
    filters,
    paginationOptions,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Promotions retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const getSinglePromotion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await PromotionService.getSinglePromotion(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Promotion retrieved successfully',
    data: result,
  })
})

const updatePromotion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await PromotionService.updatePromotion(id, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Promotion updated successfully',
    data: result,
  })
})

const deletePromotion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await PromotionService.deletePromotion(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Promotion deleted successfully',
    data: result,
  })
})

const validatePromotion = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body
  const user = req.user as JwtPayload

  const result = await PromotionService.validatePromotion(code, user.authId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Promotion code is valid',
    data: result,
  })
})

const applyPromotion = catchAsync(async (req: Request, res: Response) => {
  const { code, amount } = req.body
  const user = req.user as JwtPayload

  const result = await PromotionService.applyPromotion(
    code,
    user.authId,
    amount,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Promotion applied successfully',
    data: result,
  })
})

const togglePromotionStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await PromotionService.togglePromotionStatus(id)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `Promotion ${result.isActive ? 'activated' : 'deactivated'} successfully`,
      data: result,
    })
  },
)

const getMyPromotions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const paginationOptions = pick(req.query, paginationFields)

  const result = await PromotionService.getMyPromotions(user, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'My promotions retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

export const PromotionController = {
  createPromotion,
  getAllPromotions,
  getSinglePromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
  applyPromotion,
  togglePromotionStatus,
  getMyPromotions,
}
