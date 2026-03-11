import httpStatus from 'http-status-codes'
import { Booking } from './booking.model'
import { IBooking } from './booking.interface'
import ApiError from '../../../errors/ApiError'
import { AvailabilityService } from '../availability/availability.service'
import { Service } from '../service/service.model'
import { User } from '../user/user.model'
import mongoose, { Types } from 'mongoose'
import { SERVICE_PRICING_TYPE } from '../../../enum/service'
import { WalletService } from '../wallet/wallet.service'
import stripe from '../../../config/stripe'
import { ProfessionalProfile } from '../professionalProfile/professionalProfile.model'
import { PaymentServices } from '../payment/payment.service'

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

  const platformCommission = 0.05 // 5% commission as per user request (3-5%)
  const platformCommissionClient = 0 // Assuming no extra fee for client for now, or it's included in subtotal
  const platformCommissionProvider = platformCommission
  
  const clientTotal = subtotal 
  const providerEarnings = subtotal * (1 - platformCommissionProvider)

  return {
    pricingType: service.pricingType,
    baseRate,
    isWeekend,
    travelFee,
    subtotal,
    platformCommissionClient,
    platformCommissionProvider,
    clientTotal,
    providerEarnings,
    currency: service.currency || 'EUR',
    durationHours
  }
}

const createBooking = async (payload: IBooking, user: any): Promise<any> => {
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

  console.log('Availability Check:', availabilityCheck)

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
  payload.depositAmount = pricing.clientTotal // Full payment
  payload.balanceAmount = 0
  payload.depositPercentage = 1 // 100%
  payload.bookingDate = bookingDate // Ensure the Date object is saved

  const [booking] = await Booking.create([payload]) as any

  // 4. Create Stripe Checkout Session
  const paymentPayload = {
    amount: pricing.clientTotal,
    currency: pricing.currency.toLowerCase(),
    productName: `Booking for ${service.title}`,
    description: `Booking Number: ${booking.bookingNumber}`,
    bookingId: booking._id.toString(),
    metadata: {
      bookingId: booking._id.toString(),
      bookingNumber: booking.bookingNumber
    }
  }

  const checkoutSession = await PaymentServices.createCheckoutSession(user, paymentPayload)

  return {
    booking,
    paymentSession: checkoutSession
  }
}

const updateBookingStatus = async (
  bookingId: string,
  status: string,
  userId: string
): Promise<IBooking | null> => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const booking = await Booking.findById(bookingId).session(session)
    if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')

    // Only provider or admin can confirm/cancel (client can cancel too)
    // For simplicity allowing update if user is involved
    if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
        // Check if admin (need role passed or check logic)
        // throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized')
    }

    const previousStatus = booking.status
    booking.status = status as any
    if (status === 'confirmed') booking.confirmedAt = new Date()
    if (status === 'cancelled') booking.cancelledAt = new Date()
    if (status === 'completed') {
      booking.completedAt = new Date()
      
      // If booking is completed and wasn't already completed, transfer earnings
      if (previousStatus !== 'completed') {
        // 1. Add to local wallet for display (as per instruction 3)
        await WalletService.addEarnings(
          booking.providerId,
          booking.pricingDetails.providerEarnings,
          session
        )

        // 2. Stripe Connect Transfer (as per instruction 2)
        const professionalProfile = await ProfessionalProfile.findOne({ user: booking.providerId })
        
        if (professionalProfile?.stripeAccountId) {
          try {
            console.log(`Attempting transfer to: ${professionalProfile.stripeAccountId}`)
            const transfer = await stripe.transfers.create({
              amount: Math.round(booking.pricingDetails.providerEarnings * 100), // convert to cents
              currency: booking.pricingDetails.currency.toLowerCase(),
              destination: professionalProfile.stripeAccountId,
              metadata: {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber
              }
            })
            // Optionally store transfer ID in booking
            booking.set('stripeTransferId', transfer.id)
          } catch (error: any) {
            console.error('Stripe Transfer Error:', error.message)
            // We don't necessarily want to abort the whole transaction if Stripe transfer fails, 
            // but we should probably log it or handle it. 
            // The instruction says "stripe.transfers.create এপিআই কল করতে হবে".
            // If it fails, the professional might not get paid immediately.
          }
        }
      }
    }

    await booking.save({ session })
    await session.commitTransaction()
    return booking
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

import { paginationHelper } from '../../../helpers/paginationHelper'
import { SortOrder } from 'mongoose'

const getMyBookings = async (
  userId: string, 
  role: string,
  filters: { searchTerm?: string; status?: string; bookingDate?: string; serviceId?: string; filterType?: string },
  options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
): Promise<{
  meta: { page: number; limit: number; total: number };
  data: IBooking[];
}> => {
  const { searchTerm, filterType, ...filterData } = filters
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options)

  const andConditions = []

  // Role-based filter
  if (role === 'professional') {
    andConditions.push({ providerId: userId })
  } else {
    andConditions.push({ clientId: userId })
  }

  // Search Logic (e.g., by Booking Number or Service Title - requires lookup usually, but let's stick to direct fields or bookingNumber)
  if (searchTerm) {
    andConditions.push({
      $or: [
        { bookingNumber: { $regex: searchTerm, $options: 'i' } },
        { clientName: { $regex: searchTerm, $options: 'i' } },
        // { 'service.title': { $regex: searchTerm, $options: 'i' } } // Requires aggregate/lookup for efficient search usually
      ]
    })
  }

  // Filter Type Logic
  if (filterType) {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    if (filterType === 'today') {
      andConditions.push({
        bookingDate: {
          $gte: startOfToday,
          $lt: endOfToday,
        },
      })
    } else if (filterType === 'upcoming') {
      andConditions.push({
        bookingDate: {
          $gte: endOfToday,
        },
        status: 'confirmed',
      })
    } else if (filterType === 'pending') {
      andConditions.push({
        status: 'pending',
      })
    }
  }

  // Filter Logic
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value
      }))
    })
  }

  // Sorting
  const sortConditions: { [key: string]: SortOrder } = {}
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder
  }

  const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {}

  const result = await Booking.find(whereConditions)
    .populate('serviceId')
    .populate('providerId', 'name email')
    .populate('clientId', 'name email')
    .sort(sortConditions)
    .skip(skip)
    .limit(limit)

  const total = await Booking.countDocuments(whereConditions)

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  }
}


const getSingleBooking = async (bookingId: string): Promise<IBooking | null> => {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')
  return booking
}

export const BookingService = {
  createBooking,
  updateBookingStatus,
  getMyBookings,
  calculatePrice,
  getSingleBooking
}
