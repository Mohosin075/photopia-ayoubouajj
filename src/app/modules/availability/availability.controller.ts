import { Request, Response } from 'express'
import httpStatus from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { AvailabilityService } from './availability.service'
import ApiError from '../../../errors/ApiError'

const createOrUpdateAvailability = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
  const result = await AvailabilityService.createOrUpdateAvailability(user.userId, req.body)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability updated successfully',
    data: result,
  })
})

const getMyAvailability = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
  const result = await AvailabilityService.getProviderAvailability(user.userId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability retrieved successfully',
    data: result,
  })
})

const getProviderAvailability = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params
  const result = await AvailabilityService.getProviderAvailability(providerId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Provider availability retrieved successfully',
    data: result,
  })
})

export const AvailabilityController = {
  createOrUpdateAvailability,
  getMyAvailability,
  getProviderAvailability,
}
