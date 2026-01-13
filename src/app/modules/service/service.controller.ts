// src/app/modules/service/service.controller.ts
import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { paginationFields } from '../../../interfaces/pagination'
import pick from '../../../shared/pick'
import { ServiceServices } from './service.service'
import { SERVICE_CONSTANTS, serviceFilterableFields } from './service.constants'
import { JwtPayload } from 'jsonwebtoken'

const createService = catchAsync(async (req: Request, res: Response) => {
  const serviceData = req.body
  const { userId } = req.user as JwtPayload

  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
    })
  }

  // Add providerId from authenticated user
  serviceData.providerId = userId

  const result = await ServiceServices.createService(serviceData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: SERVICE_CONSTANTS.MESSAGES.CREATED,
    data: result,
  })
})

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields)
  const filters = pick(req.query, serviceFilterableFields)
  const result = await ServiceServices.getAllServices(filters, paginationOptions)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: SERVICE_CONSTANTS.MESSAGES.RETRIEVED_ALL,
    data: result,
  })
})

const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ServiceServices.getSingleService(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: SERVICE_CONSTANTS.MESSAGES.RETRIEVED,
    data: result,
  })
})

const updateService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const serviceData = req.body
  const { userId } = req.user as JwtPayload

  const result = await ServiceServices.updateService(id, serviceData, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: SERVICE_CONSTANTS.MESSAGES.UPDATED,
    data: result,
  })
})

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const { userId } = req.user as JwtPayload

  const result = await ServiceServices.deleteService(id, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: SERVICE_CONSTANTS.MESSAGES.DELETED,
    data: result,
  })
})

const getServicesByProvider = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params
  const paginationOptions = pick(req.query, paginationFields)
  const filters = pick(req.query, serviceFilterableFields)

  const result = await ServiceServices.getServicesByProvider(
    providerId,
    filters,
    paginationOptions
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Provider services retrieved successfully',
    data: result,
  })
})

const getMyServices = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload
  const paginationOptions = pick(req.query, paginationFields)
  const filters = pick(req.query, serviceFilterableFields)

  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
    })
  }

  const result = await ServiceServices.getServicesByProvider(
    userId,
    filters,
    paginationOptions
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'My services retrieved successfully',
    data: result,
  })
})

const toggleServiceStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  const result = await ServiceServices.toggleServiceStatus(id, status)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: SERVICE_CONSTANTS.MESSAGES.UPDATED,
    data: result,
  })
})

export const ServiceController = {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
  getServicesByProvider,
  getMyServices,
  toggleServiceStatus,
}