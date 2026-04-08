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
import { geocodeAddress } from '../../../utils/geocodeAddress'

// Helper for Haversine distance
const calculateDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const calculatePrice = async (
  serviceId: string,
  startTime: string,
  endTime: string,
  date: Date,
  distanceFromProviderKm: number,
  overrides?: { priceOverride?: number; rateMultiplier?: number },
  packageName?: string
) => {
  const service = await Service.findById(serviceId)
  if (!service) throw new ApiError(httpStatus.NOT_FOUND, 'Service not found')

  const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60
  const end = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60
  let durationHours = end - start

  if (durationHours <= 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid duration')

  let baseRate = 0
  let isWeekend = false
  const day = date.getDay()
  if (day === 0 || day === 6) {
    isWeekend = true
    baseRate = service.pricingModel?.weekendHourlyRate || (service.price * 1.2)
  } else {
    baseRate = service.pricingModel?.weekdayHourlyRate || service.price
  }

  // Calculate subtotal
  let subtotal = 0
  
  if (service.pricingType === SERVICE_PRICING_TYPE.HOURLY) {
    // Apply Overrides for hourly only
    if (overrides?.priceOverride !== undefined) {
      baseRate = overrides.priceOverride
    } else if (overrides?.rateMultiplier !== undefined) {
      baseRate = baseRate * overrides.rateMultiplier
    }
    subtotal = baseRate * durationHours
  } else if (service.pricingType === SERVICE_PRICING_TYPE.DAILY) {
    subtotal = service.pricingModel?.dailyRate || service.price
    durationHours = service.pricingModel?.dailyHours || 8
  } else if (service.pricingType === SERVICE_PRICING_TYPE.PACKAGE) {
    if (packageName && service.pricingModel?.packages) {
      const selectedPackage = service.pricingModel.packages.find(p => p.name === packageName)
      if (selectedPackage) {
        subtotal = selectedPackage.price
        durationHours = selectedPackage.duration
      } else {
        throw new ApiError(httpStatus.BAD_REQUEST, `Package '${packageName}' not found in this service`)
      }
    } else {
      subtotal = service.price
      // Use service duration if available, otherwise default to what user selected
      if (service.duration && !isNaN(parseInt(service.duration))) {
        durationHours = parseInt(service.duration)
      }
    }
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

  const platformCommissionClient = 0.10 // 10% from user (client)
  const platformCommissionProvider = 0.05 // 5% from provider
  
  const clientTotal = Number((subtotal * (1 + platformCommissionClient)).toFixed(2))
  const providerEarnings = Number((subtotal * (1 - platformCommissionProvider)).toFixed(2))

  return {
    pricingType: service.pricingType,
    packageName,
    baseRate,
    isWeekend,
    travelFee,
    subtotal: Number(subtotal.toFixed(2)),
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

  // 1.5 Geocode address if coordinates are missing
  if (!payload.eventLocation.coordinates || !payload.eventLocation.coordinates.lat || !payload.eventLocation.coordinates.lng) {
    const fullAddress = `${payload.eventLocation.address}, ${payload.eventLocation.city}, ${payload.eventLocation.country}`
    const geocoded = await geocodeAddress(fullAddress)

    console.log('Geocoded:', geocoded)
    if (geocoded) {
      payload.eventLocation.coordinates = {
        lat: geocoded.lat,
        lng: geocoded.lng
      }
    }
  }

  // 1.6 Calculate distance if not provided or 0
  if ((!payload.eventLocation.distanceFromProviderKm || payload.eventLocation.distanceFromProviderKm === 0) &&
      service.location?.coordinates?.lat && service.location?.coordinates?.lng &&
      payload.eventLocation.coordinates?.lat && payload.eventLocation.coordinates?.lng) {
    
    const distance = calculateDistanceInKm(
      service.location.coordinates.lat,
      service.location.coordinates.lng,
      payload.eventLocation.coordinates.lat,
      payload.eventLocation.coordinates.lng
    )
    payload.eventLocation.distanceFromProviderKm = Number(distance.toFixed(2))
  }

  // 1.7 Ensure distance is at least 0 if still missing
  if (payload.eventLocation.distanceFromProviderKm === undefined) {
    payload.eventLocation.distanceFromProviderKm = 0
  }

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

  // 3. Calculate Price (First, to get the correct duration)
  const pricing = await calculatePrice(
    payload.serviceId.toString(),
    payload.startTime,
    payload.endTime,
    bookingDate,
    payload.eventLocation.distanceFromProviderKm || 0,
    availabilityCheck.pricing,
    payload.packageName
  )

  // Calculate actual end time based on the duration returned from pricing
  const [startHour, startMinute] = payload.startTime.split(':').map(Number)
  const startTotalMinutes = startHour * 60 + startMinute
  const durationMinutes = pricing.durationHours * 60
  const endTotalMinutes = startTotalMinutes + durationMinutes
  
  const endH = Math.floor(endTotalMinutes / 60)
  const endM = endTotalMinutes % 60
  const actualEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

  // Update payload with actual calculated values
  payload.endTime = actualEndTime
  payload.pricingDetails = pricing
  payload.durationHours = pricing.durationHours

  // Validate request time is within working hours
  if (availabilityCheck.workingHours) {
    const workStart = parseInt(availabilityCheck.workingHours.start.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.start.split(':')[1])
    const workEnd = parseInt(availabilityCheck.workingHours.end.split(':')[0]) * 60 + parseInt(availabilityCheck.workingHours.end.split(':')[1])
    
    if (startTotalMinutes < workStart || endTotalMinutes > workEnd) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Requested duration (${pricing.durationHours}h starting at ${payload.startTime}) exceeds provider working hours (${availabilityCheck.workingHours.start} - ${availabilityCheck.workingHours.end})`)
    }
  }
  
  // Check specific time slot availability (overlap with existing bookings)
  const existingBookings = await Booking.find({
    providerId: payload.providerId,
    bookingDate: payload.bookingDate,
    status: { $in: ['confirmed', 'pending', 'deposit_paid'] }
  })

  const hasOverlap = existingBookings.some(booking => {
     const existStart = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1])
     const existEnd = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1])
     return (startTotalMinutes < existEnd && endTotalMinutes > existStart)
  })

  if (hasOverlap) {
    throw new ApiError(httpStatus.CONFLICT, 'Time slot overlaps with an existing booking')
  }
  
  // Implement 50% deposit logic
   payload.depositPercentage = 0.5 // 50%
   payload.depositAmount = Number((pricing.clientTotal * payload.depositPercentage).toFixed(2))
   payload.balanceAmount = Number((pricing.clientTotal - payload.depositAmount).toFixed(2))
   payload.bookingDate = bookingDate // Ensure the Date object is saved

  const [booking] = await Booking.create([payload]) as any

  // 4. Create Stripe Checkout Session
  const paymentPayload = {
    amount: payload.depositAmount, // Charge the deposit amount
    currency: pricing.currency.toLowerCase(),
    productName: `Deposit for ${service.title}`,
    description: `Booking Number: ${booking.bookingNumber} (50% Deposit)`,
    bookingId: booking._id.toString(),
    metadata: {
      bookingId: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      paymentType: 'deposit'
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
    
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      booking.cancelledAt = new Date()
      // Refund pending balance if it was already credited as pending
      if (['confirmed', 'deposit_paid', 'in_progress'].includes(previousStatus)) {
        await WalletService.cancelPendingEarnings(
          booking.providerId,
          booking.pricingDetails.providerEarnings,
          session
        )
      }
    }

    if (status === 'completed') {
      booking.completedAt = new Date()
      
      // If booking is completed and wasn't already completed, transfer earnings
      if (previousStatus !== 'completed') {
        // 1. Move from pending to actual balance in local wallet
        await WalletService.completePendingEarnings(
          booking.providerId,
          booking.pricingDetails.providerEarnings,
          session
        )

        // 2. Stripe Connect Transfer
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
            
            booking.stripeTransferId = transfer.id
            booking.stripeTransferStatus = 'succeeded'
          } catch (error: any) {
            console.error('Stripe Transfer Error:', error.message)
            booking.stripeTransferStatus = 'failed'
            // We still let the DB transaction complete so the provider gets local credit
            // but we mark the Stripe transfer as failed for admin manual retry.
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
