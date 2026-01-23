import httpStatus from 'http-status-codes'
import { Booking } from './booking.model'
import { IBooking } from './booking.interface'
import ApiError from '../../../errors/ApiError'
import { AvailabilityService } from '../availability/availability.service'
import { Service } from '../service/service.model'
import { User } from '../user/user.model'
import mongoose, { Types } from 'mongoose'
import { SERVICE_PRICING_TYPE } from '../../../enum/service'

const calculatePrice = async (
  serviceId: string,
  startTime: string,
  endTime: string,
  date: Date,
  distanceFromProviderKm: number,
  overrides?: { priceOverride?: number; rateMultiplier?: number }
) => {
  const service = await Service.findById(serviceId)
  if (!service) throw new ApiError(httpStatus.NOT_FOUND, 'Service not found')

  const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60
  const end = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60
  const durationHours = end - start

  if (durationHours <= 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid duration')

  let baseRate = 0
  let isWeekend = false
  const day = date.getDay()
  if (day === 0 || day === 6) {
    isWeekend = true
    baseRate = service.pricingModel?.weekendHourlyRate || service.price
  } else {
    baseRate = service.pricingModel?.weekdayHourlyRate || service.price
  }

  // Fallback if specific hourly rates are 0
  if (service.pricingType === SERVICE_PRICING_TYPE.HOURLY && (!baseRate || baseRate === 0)) {
     baseRate = service.price
  }

  // Apply Overrides
  if (overrides?.priceOverride !== undefined) {
    baseRate = overrides.priceOverride
  } else if (overrides?.rateMultiplier !== undefined) {
    baseRate = baseRate * overrides.rateMultiplier
  }

  // Calculate subtotal
  let subtotal = 0
  if (service.pricingType === SERVICE_PRICING_TYPE.HOURLY) {
    subtotal = baseRate * durationHours
  } else if (service.pricingType === SERVICE_PRICING_TYPE.DAILY) {
     // For daily, one booking usually means one day? Or fraction? 
     // Assuming daily rate applies once per day regardless of hours, unless spanning multiple days (which our logic doesn't support yet, strict single day)
     subtotal = service.pricingModel?.dailyRate || service.price
  } else {
     // Default fallthrough (e.g. PACKAGE)
     subtotal = service.price
  }

  // Travel fee
  let travelFee = 0
  if (distanceFromProviderKm > (service.location?.serviceRadiusKm || 25)) {
    if (!service.allowOutsideRadius) {
       throw new ApiError(httpStatus.BAD_REQUEST, `Location is outside service radius (${service.location?.serviceRadiusKm}km)`)
    }
    const extraKm = distanceFromProviderKm - (service.location?.serviceRadiusKm || 25)
    travelFee = Math.min(extraKm * (service.travelFeePerKm || 1.5), service.maxTravelFee || 100)
  }

  subtotal += travelFee

  const platformCommissionClient = 0.10
  const platformCommissionProvider = 0.05
  // const clientTotal = subtotal * (1 + platformCommissionClient)
  const clientTotal = subtotal // Client pays subtotal? Usually platform fee is added on top. Let's stick to existing logic:
  const totalWithClientFee = subtotal * (1 + platformCommissionClient)
  
  const providerEarnings = subtotal * (1 - platformCommissionProvider)

  return {
    pricingType: service.pricingType,
    baseRate,
    isWeekend,
    travelFee,
    subtotal,
    platformCommissionClient,
    platformCommissionProvider,
    clientTotal: totalWithClientFee,
    providerEarnings,
    currency: service.currency || 'EUR',
    durationHours
  }
}

const createBooking = async (payload: IBooking): Promise<IBooking> => {
  // 1. Check Service Existence
  const service = await Service.findById(payload.serviceId)
  if (!service) throw new ApiError(httpStatus.NOT_FOUND, 'Service not found')

  // Ensure bookingDate is a Date object
  const bookingDate = new Date(payload.bookingDate)
  
  // 2. Check Availability
  const availabilityCheck = await AvailabilityService.checkAvailabilityForDate(
    payload.providerId.toString(),
    bookingDate
  )

  if (!availabilityCheck.isAvailable) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Provider is not available: ${availabilityCheck.reason}`)
  }

  // Validate request time is within working hours
  if (availabilityCheck.workingHours) {
    const workStart = parseInt(availabilityCheck.workingHours.start.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.start.split(':')[1])
    const workEnd = parseInt(availabilityCheck.workingHours.end.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.end.split(':')[1])
    
    const reqStart = parseInt(payload.startTime.split(':')[0]) * 60 + parseInt(payload.startTime.split(':')[1])
    const reqEnd = parseInt(payload.endTime.split(':')[0]) * 60 + parseInt(payload.endTime.split(':')[1])

    if (reqStart < workStart || reqEnd > workEnd) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Requested time is outside working hours (${availabilityCheck.workingHours.start} - ${availabilityCheck.workingHours.end})`)
    }
  }
  
  // TODO: Check specific time slot availability (overlap with existing bookings)
  const existingBookings = await Booking.find({
    providerId: payload.providerId,
    bookingDate: payload.bookingDate,
    status: { $in: ['confirmed', 'pending', 'deposit_paid'] }
  })

  // Simple overlap check
  const newStart = parseInt(payload.startTime.split(':')[0]) * 60 + parseInt(payload.startTime.split(':')[1])
  const newEnd = parseInt(payload.endTime.split(':')[0]) * 60 + parseInt(payload.endTime.split(':')[1])

  const hasOverlap = existingBookings.some(booking => {
     const existStart = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1])
     const existEnd = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1])
     return (newStart < existEnd && newEnd > existStart)
  })

  if (hasOverlap) {
    throw new ApiError(httpStatus.CONFLICT, 'Time slot overlaps with an existing booking')
  }

  // 3. Calculate Price
  const pricing = await calculatePrice(
    payload.serviceId.toString(),
    payload.startTime,
    payload.endTime,
    bookingDate,
    payload.eventLocation.distanceFromProviderKm,
    availabilityCheck.pricing
  )

  payload.pricingDetails = pricing
  payload.durationHours = pricing.durationHours
  payload.depositAmount = pricing.clientTotal * 0.5 // 50% deposit
  payload.balanceAmount = pricing.clientTotal - payload.depositAmount
  payload.depositPercentage = 0.5
  payload.bookingDate = bookingDate // Ensure the Date object is saved

  const result = await Booking.create(payload)
  return result
}

const updateBookingStatus = async (
  bookingId: string,
  status: string,
  userId: string
): Promise<IBooking | null> => {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')

  // Only provider or admin can confirm/cancel (client can cancel too)
  // For simplicity allowing update if user is involved
  if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
      // Check if admin (need role passed or check logic)
      // throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized')
  }

  booking.status = status as any
  if (status === 'confirmed') booking.confirmedAt = new Date()
  if (status === 'cancelled') booking.cancelledAt = new Date()
  if (status === 'completed') booking.completedAt = new Date()

  await booking.save()
  return booking
}

const getMyBookings = async (userId: string, role: string): Promise<IBooking[]> => {
  let query: any = {}
  if (role === 'professional') {
    query.providerId = userId
  } else {
    query.clientId = userId
  }
  const bookings = await Booking.find(query)
    .populate('serviceId')
    .populate('providerId', 'name email')
    .populate('clientId', 'name email')
    .sort({ createdAt: -1 })
  return bookings
}

export const BookingService = {
  createBooking,
  updateBookingStatus,
  getMyBookings,
  calculatePrice
}
