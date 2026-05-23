import httpStatus from 'http-status-codes'
import { Availability } from './availability.model'
import { IAvailability } from './availability.interface'
import ApiError from '../../../errors/ApiError'
import { Types } from 'mongoose'
import { Booking } from '../booking/booking.model'

const createOrUpdateAvailability = async (
  providerId: string,
  payload: Partial<IAvailability>
): Promise<IAvailability> => {
  const query: any = { providerId }
  if (payload.serviceId) {
    query.serviceId = payload.serviceId
  } else {
    query.$or = [{ serviceId: null }, { serviceId: { $exists: false } }]
  }

  const isExist = await Availability.findOne(query)

  if (isExist) {
    const result = await Availability.findOneAndUpdate(query, payload, {
      new: true,
      runValidators: true,
    })
    return result as IAvailability
  } else {
    const result = await Availability.create({ ...payload, providerId })
    return result
  }
}

const getProviderAvailability = async (
  providerId: string,
  serviceId?: string
): Promise<IAvailability | null> => {
  const query: any = { providerId }
  if (serviceId) {
    query.serviceId = serviceId
  } else {
    query.$or = [{ serviceId: null }, { serviceId: { $exists: false } }]
  }
  const result = await Availability.findOne(query)
  return result
}

const checkAvailabilityForDate = async (
  providerId: string,
  date: Date,
  serviceId?: string
): Promise<{ 
  isAvailable: boolean; 
  reason?: string; 
  workingHours?: { start: string; end: string };
  pricing?: { priceOverride?: number; rateMultiplier?: number };
}> => {
  let availability = null
  if (serviceId) {
    availability = await Availability.findOne({ providerId, serviceId })
  }
  if (!availability) {
    availability = await Availability.findOne({ 
      providerId, 
      $or: [{ serviceId: null }, { serviceId: { $exists: false } }] 
    })
  }
  
  if (!availability) {
    return { isAvailable: false, reason: 'Provider has not set availability' }
  }

  const targetDate = new Date(date)
  let workingHours: { start: string; end: string } | undefined
  let pricing: { priceOverride?: number; rateMultiplier?: number } | undefined
  let maxBookings = availability.maxBookingsPerDay

  // 1. Check specific custom dates (overrides everything)
  const customDate = availability.customDates.find(
    (cd) => new Date(cd.date).toDateString() === targetDate.toDateString()
  )

  if (customDate) {
    if (customDate.type === 'blocked' || customDate.type === 'unavailable') {
      return { isAvailable: false, reason: 'Date is specifically blocked by provider' }
    }
    workingHours = { start: customDate.start || '09:00', end: customDate.end || '17:00' }
    pricing = {
      priceOverride: customDate.priceOverride,
      rateMultiplier: customDate.rateMultiplier
    }
    if (customDate.maxBookings) maxBookings = customDate.maxBookings
  } else {
    // 2. Check recurring rules
    let ruleMatched = false
    if (availability.recurringRules && availability.recurringRules.length > 0) {
      for (const rule of availability.recurringRules) {
        if (!rule.active) continue

        // Weekday check
        if (rule.type === 'block_weekly' || rule.type === 'special_hours_weekly') {
          if (rule.dayOfWeek !== undefined && rule.dayOfWeek === targetDate.getDay()) {
            if (rule.type === 'block_weekly') {
              return { isAvailable: false, reason: 'Date matches a recurring block rule' }
            }
            if (rule.type === 'special_hours_weekly' && rule.start && rule.end) {
              workingHours = { start: rule.start, end: rule.end }
              if (rule.maxBookings) maxBookings = rule.maxBookings
              ruleMatched = true
              break
            }
          }
        }
        
        // Monthly check
        if (rule.type === 'block_monthly') {
          const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
          const dayOfMonth = targetDate.getDate()
          const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7)
          
          if (rule.weekOfMonth !== undefined && rule.weekOfMonth === weekOfMonth) {
            return { isAvailable: false, reason: 'Date matches a recurring monthly block rule' }
          }
        }
      }
    }

    if (!ruleMatched) {
      // 3. Check default schedule
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = days[targetDate.getDay()]
      const defaultSchedule = availability.defaultSchedule as any
      const daySchedule = defaultSchedule[dayName] || defaultSchedule.get?.(dayName)

      if (!daySchedule || !daySchedule.isActive) {
        return { isAvailable: false, reason: `Day (${dayName}) is not a working day in default schedule` }
      }
      workingHours = { start: daySchedule.start, end: daySchedule.end }
      if (daySchedule.maxBookings) maxBookings = daySchedule.maxBookings
    }
  }

  // Final step: Check if fully booked for the day
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const bookingCount = await Booking.countDocuments({
    providerId: new Types.ObjectId(providerId),
    bookingDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $nin: ['cancelled', 'completed'] }
  })

  if (bookingCount >= maxBookings) {
    return { isAvailable: false, reason: 'Fully booked for this date' }
  }

  return { 
    isAvailable: true, 
    workingHours,
    pricing
  }
}

const getAvailableTimeSlots = async (
  providerId: string,
  date: Date,
  serviceDuration: number,
  serviceId?: string
): Promise<string[]> => {
  let availability = null
  if (serviceId) {
    availability = await Availability.findOne({ providerId, serviceId })
  }
  if (!availability) {
    availability = await Availability.findOne({
      providerId,
      $or: [{ serviceId: null }, { serviceId: { $exists: false } }]
    })
  }
  
  if (!availability) {
    return []
  }

  // First check if the date is available
  const dateCheck = await checkAvailabilityForDate(providerId, date, serviceId)
  if (!dateCheck.isAvailable || !dateCheck.workingHours) {
    return []
  }

  const { start, end } = dateCheck.workingHours
  const bufferMinutes = availability.bufferMinutes || 0
  const totalSlotDuration = serviceDuration + bufferMinutes

  // Generate time slots
  const slots: string[] = []
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += totalSlotDuration) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const timeSlot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    slots.push(timeSlot)
  }


  // Filter out booked slots
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const existingBookings = await Booking.find({
    providerId: new Types.ObjectId(providerId),
    bookingDate: {
      $gte: targetDate,
      $lt: nextDay
    },
    status: { $nin: ['cancelled', 'completed'] }
  }).select('startTime endTime')

  // Filter out slots that conflict with existing bookings
  const availableSlots = slots.filter(slot => {
    const [slotHour, slotMinute] = slot.split(':').map(Number)
    const slotStartMinutes = slotHour * 60 + slotMinute
    const slotEndMinutes = slotStartMinutes + serviceDuration

    return !existingBookings.some((booking: { startTime: string; endTime: string }) => {
      const [bookingStartHour, bookingStartMinute] = booking.startTime.split(':').map(Number)
      const [bookingEndHour, bookingEndMinute] = booking.endTime.split(':').map(Number)
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute
      const bookingEndMinutes = bookingEndHour * 60 + bookingEndMinute

      // Check for overlap
      return (
        (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
        (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
        (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
      )
    })
  })

  return availableSlots
}

const getMonthCalendar = async (
  providerId: string,
  month: number,
  year: number,
  serviceId?: string
): Promise<{
  date: string;
  isAvailable: boolean;
  reason?: string;
  hasSpecialPricing?: boolean;
}[]> => {
  let availability = null
  if (serviceId) {
    availability = await Availability.findOne({ providerId, serviceId })
  }
  if (!availability) {
    availability = await Availability.findOne({
      providerId,
      $or: [{ serviceId: null }, { serviceId: { $exists: false } }]
    })
  }
  
  if (!availability) {
    return []
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const calendar = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateCheck = await checkAvailabilityForDate(providerId, date, serviceId)
    
    calendar.push({
      date: date.toISOString().split('T')[0],
      isAvailable: dateCheck.isAvailable,
      reason: dateCheck.reason,
      hasSpecialPricing: !!(dateCheck.pricing?.priceOverride || dateCheck.pricing?.rateMultiplier)
    })
  }

  return calendar
}

export const AvailabilityService = {
  createOrUpdateAvailability,
  getProviderAvailability,
  checkAvailabilityForDate,
  getAvailableTimeSlots,
  getMonthCalendar,
}
