import { Request, Response } from 'express'
import httpStatus from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { BookingService } from './booking.service'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'
import pick from '../../../shared/pick'

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
  
  const bookingData = {
    ...req.body,
    clientId: user.userId
  }

  const result = await BookingService.createBooking(bookingData, user)

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking created successfully. Please complete the payment.',
    data: result,
  })
})

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  const user = req.user as JwtPayload
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')

  const result = await BookingService.updateBookingStatus(id, status, user.userId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  })
})

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')

  const filters = pick(req.query, ['searchTerm', 'status', 'bookingDate', 'serviceId', 'filterType'])
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder'])

  const result = await BookingService.getMyBookings(user.userId, user.role, filters, options)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

const calculatePrice = catchAsync(async (req: Request, res: Response) => {
  const { serviceId, startTime, endTime, date, distanceFromProviderKm } = req.body
  
  const result = await BookingService.calculatePrice(
    serviceId,
    startTime,
    endTime,
    new Date(date),
    distanceFromProviderKm || 0,
    undefined // Overrides not currently fetched in this standalone calculation
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Price calculated successfully',
    data: result,
  })
})


const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user as JwtPayload

  const result = await BookingService.getSingleBooking(id)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  })
})

const getMyBookingsByDate = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')

  const date = req.query.date as string
  if (!date) throw new ApiError(httpStatus.BAD_REQUEST, 'Date is required')

  const result = await BookingService.getMyBookingsByDate(user.userId, user.role, date)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  })
})

const modifyBookingOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user as JwtPayload
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')

  const result = await BookingService.modifyBookingOffer(id, user.userId, req.body)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offer modified successfully',
    data: result,
  })
})

export const BookingController = {
  createBooking,
  updateBookingStatus,
  getMyBookings,
  calculatePrice,
  getSingleBooking,
  getMyBookingsByDate,
  modifyBookingOffer
}
