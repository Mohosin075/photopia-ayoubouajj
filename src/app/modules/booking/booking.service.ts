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
import { ProfessionalProfileServices } from '../professionalProfile/professionalProfile.service'
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
  packageName?: string,
  customOptions?: { name: string; price: number }[]
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

  // Add Custom Options
  if (customOptions && customOptions.length > 0) {
    const optionsTotal = customOptions.reduce((acc, opt) => acc + opt.price, 0)
    subtotal += optionsTotal
  }

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
    durationHours,
    customOptions
  }
}

const createBooking = async (payload: IBooking & { paymentMode?: 'intent' | 'checkout'; paymentMethodId?: string }, user: any): Promise<any> => {
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
    payload.packageName,
    payload.customOptions
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
    status: { $in: ['pending', 'confirmed', 'in_progress'] }
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

  const createdBookings = await Booking.create([payload])
  const booking = createdBookings[0] as IBooking

  // Increment totalBooking in Service
  await Service.findByIdAndUpdate(payload.serviceId, {
    $inc: { totalBooking: 1 }
  })

  // ============================================
  // PAYMENT FLOW: intent (Flutter) vs checkout (Web)
  // ============================================
  const paymentMode = (payload as any).paymentMode || 'intent'

  if (paymentMode === 'intent') {
    // ------- FLUTTER FLOW: PaymentIntent + EphemeralKey -------
    const intentResult = await PaymentServices.createPaymentIntent(user, {
      bookingId: (booking._id as Types.ObjectId).toString(),
      amount: payload.depositAmount,
      currency: pricing.currency.toLowerCase(),
      paymentMethodId: (payload as any).paymentMethodId, // optional saved card
      metadata: {
        bookingId: (booking._id as Types.ObjectId).toString(),
        bookingNumber: booking.bookingNumber,
        paymentType: 'deposit',
      },
    })

    // Store Stripe references on the booking
    booking.stripePaymentId = intentResult.paymentIntentId
    booking.stripeClientSecret = intentResult.clientSecret
    await booking.save()

    // Create ephemeral key for Flutter payment sheet
    let ephemeralKey: string | undefined
    let stripeCustomerId: string | undefined
    try {
      const userData = await User.findById(user.userId)
      stripeCustomerId = userData?.stripeCustomerId
      if (stripeCustomerId) {
        const ephResult = await PaymentServices.createEphemeralKey(user)
        ephemeralKey = ephResult.ephemeralKey
      }
    } catch (e) {
      console.error('Ephemeral key creation warning:', e)
    }

    return {
      booking,
      payment: {
        paymentMode: 'intent',
        clientSecret: intentResult.clientSecret,
        paymentIntentId: intentResult.paymentIntentId,
        ephemeralKey,
        customerId: stripeCustomerId,
        amount: payload.depositAmount,
        currency: pricing.currency,
        status: intentResult.status,
      },
    }
  } else {
    // ------- WEB FLOW: Stripe Checkout Session -------
    const paymentPayload = {
      amount: payload.depositAmount,
      currency: pricing.currency.toLowerCase(),
      productName: `Deposit for ${service.title}`,
      description: `Booking Number: ${booking.bookingNumber} (50% Deposit)`,
      bookingId: (booking._id as Types.ObjectId).toString(),
      metadata: {
        bookingId: (booking._id as Types.ObjectId).toString(),
        bookingNumber: booking.bookingNumber,
        paymentType: 'deposit',
      },
    }

    const checkoutSession = await PaymentServices.createCheckoutSession(user, paymentPayload)

    booking.stripePaymentId = checkoutSession.sessionId
    await booking.save()

    return {
      booking,
      payment: {
        paymentMode: 'checkout',
        sessionId: checkoutSession.sessionId,
        url: checkoutSession.url,
        amount: payload.depositAmount,
        currency: pricing.currency,
      },
    }
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
      if (
        ['confirmed', 'in_progress'].includes(previousStatus) &&
        ['deposit_paid', 'fully_paid'].includes(booking.paymentStatus)
      ) {
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

        // 1.5 Increment projects count for the provider
        await ProfessionalProfileServices.incrementProjectsCount(booking.providerId.toString())

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

const getMyBookingsByDate = async (
  userId: string,
  role: string,
  date: string
): Promise<IBooking[]> => {
  const targetDate = new Date(date)
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)

  const query: any = {
    bookingDate: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  }

  if (role === 'professional') {
    query.providerId = userId
  } else {
    query.clientId = userId
  }

  const result = await Booking.find(query)
    .populate('serviceId')
    .populate('providerId', 'name email')
    .populate('clientId', 'name email')
    .sort({ startTime: 1 })

  return result
}

const modifyBookingOffer = async (
  bookingId: string,
  providerId: string,
  payload: {
    baseRate?: number;
    packageName?: string;
    customOptions?: { name: string; price: number }[];
  }
): Promise<IBooking | null> => {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')

  if (booking.providerId.toString() !== providerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the professional who received this booking can modify the offer')
  }

  if (booking.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Cannot modify offer when booking status is ${booking.status}`)
  }

  if (booking.paymentStatus !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot modify offer after payment has been initiated or completed')
  }

  // Recalculate Pricing
  const overrides = payload.baseRate ? { priceOverride: payload.baseRate } : undefined
  
  const pricingResult = await calculatePrice(
    booking.serviceId.toString(),
    booking.startTime,
    booking.endTime,
    booking.bookingDate,
    booking.eventLocation.distanceFromProviderKm || 0,
    overrides,
    payload.packageName || booking.packageName,
    payload.customOptions || (booking.customOptions as any)
  )

  // Update Booking Top-level Properties
  booking.packageName = pricingResult.packageName
  booking.customOptions = pricingResult.customOptions as any
  booking.durationHours = pricingResult.durationHours
  
  // Extract only the fields that belong in pricingDetails
  const { 
    pricingType, 
    baseRate, 
    isWeekend, 
    travelFee, 
    subtotal, 
    platformCommissionClient, 
    platformCommissionProvider, 
    clientTotal, 
    providerEarnings, 
    currency 
  } = pricingResult

  booking.pricingDetails = {
    pricingType,
    baseRate,
    isWeekend,
    travelFee,
    subtotal,
    platformCommissionClient,
    platformCommissionProvider,
    clientTotal,
    providerEarnings,
    currency
  }
  
  // Update deposit/balance
  booking.depositPercentage = 0.5 
  booking.depositAmount = Number((clientTotal * booking.depositPercentage).toFixed(2))
  booking.balanceAmount = Number((clientTotal - booking.depositAmount).toFixed(2))

  await booking.save()
  return booking
}

/**
 * Pay Remaining Balance (the other 50%) for a booking
 * Called after deposit is paid and booking is confirmed
 */
const payRemainingBalance = async (
  bookingId: string,
  user: any,
  payload?: { paymentMethodId?: string }
): Promise<any> => {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found')

  // Only the client who booked can pay
  if (booking.clientId.toString() !== user.userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the booking client can pay the remaining balance')
  }

  // Must be in deposit_paid status
  if (booking.paymentStatus !== 'deposit_paid') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot pay remaining balance. Current payment status: ${booking.paymentStatus}`
    )
  }

  if (booking.balanceAmount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No remaining balance to pay')
  }

  // Create Payment Intent for remaining balance
  const intentResult = await PaymentServices.createPaymentIntent(user, {
    bookingId: (booking._id as Types.ObjectId).toString(),
    amount: booking.balanceAmount,
    currency: booking.pricingDetails.currency.toLowerCase(),
    paymentMethodId: payload?.paymentMethodId,
    metadata: {
      bookingId: (booking._id as Types.ObjectId).toString(),
      bookingNumber: booking.bookingNumber,
      paymentType: 'balance',
    },
  })

  // Create ephemeral key for Flutter
  let ephemeralKey: string | undefined
  let stripeCustomerId: string | undefined
  try {
    const userData = await User.findById(user.userId)
    stripeCustomerId = userData?.stripeCustomerId
    if (stripeCustomerId) {
      const ephResult = await PaymentServices.createEphemeralKey(user)
      ephemeralKey = ephResult.ephemeralKey
    }
  } catch (e) {
    console.error('Ephemeral key creation warning:', e)
  }

  return {
    booking,
    payment: {
      paymentMode: 'intent',
      clientSecret: intentResult.clientSecret,
      paymentIntentId: intentResult.paymentIntentId,
      ephemeralKey,
      customerId: stripeCustomerId,
      amount: booking.balanceAmount,
      currency: booking.pricingDetails.currency,
      status: intentResult.status,
      paymentType: 'balance',
    },
  }
}

export const BookingService = {
  createBooking,
  updateBookingStatus,
  getMyBookings,
  calculatePrice,
  getSingleBooking,
  getMyBookingsByDate,
  modifyBookingOffer,
  payRemainingBalance,
}
