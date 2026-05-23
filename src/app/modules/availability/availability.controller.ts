import { Request, Response } from 'express'
import httpStatus from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { AvailabilityService } from './availability.service'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'

const createOrUpdateAvailability = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
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
  const user = req.user as JwtPayload
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
  const { serviceId } = req.query
  const result = await AvailabilityService.getProviderAvailability(user.userId, serviceId as string)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability retrieved successfully',
    data: result,
  })
})

const getProviderAvailability = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params
  const { serviceId } = req.query
  const result = await AvailabilityService.getProviderAvailability(providerId, serviceId as string)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Provider availability retrieved successfully',
    data: result,
  })
})

const checkDateAvailability = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params
  const { date, serviceId } = req.query
  
  if (!date || typeof date !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date query parameter is required')
  }
  
  const result = await AvailabilityService.checkAvailabilityForDate(providerId, new Date(date), serviceId as string)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Date availability checked successfully',
    data: result,
  })
})

const getTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params
  const { date, duration, serviceId } = req.query
  
  if (!date || typeof date !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date query parameter is required')
  }
  
  if (!duration || typeof duration !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Duration query parameter is required')
  }
  
  const serviceDuration = parseInt(duration, 10)
  if (isNaN(serviceDuration) || serviceDuration <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Duration must be a positive number')
  }
  
  const result = await AvailabilityService.getAvailableTimeSlots(
    providerId,
    new Date(date),
    serviceDuration,
    serviceId as string
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Available time slots retrieved successfully',
    data: { slots: result },
  })
})

const getMonthCalendar = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params
  const { month, year, serviceId } = req.query
  
  if (!month || typeof month !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Month query parameter is required')
  }
  
  if (!year || typeof year !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Year query parameter is required')
  }
  
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)
  
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Month must be between 1 and 12')
  }
  
  if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Year must be between 2020 and 2100')
  }
  
  const result = await AvailabilityService.getMonthCalendar(providerId, monthNum, yearNum, serviceId as string)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Month calendar retrieved successfully',
    data: { calendar: result },
  })
})

export const AvailabilityController = {
  createOrUpdateAvailability,
  getMyAvailability,
  getProviderAvailability,
  checkDateAvailability,
  getTimeSlots,
  getMonthCalendar,
}
