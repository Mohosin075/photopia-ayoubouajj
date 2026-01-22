import httpStatus from 'http-status-codes'
import { Availability } from './availability.model'
import { IAvailability } from './availability.interface'
import ApiError from '../../../errors/ApiError'
import { Types } from 'mongoose'

const createOrUpdateAvailability = async (
  providerId: string,
  payload: Partial<IAvailability>
): Promise<IAvailability> => {
  const isExist = await Availability.findOne({ providerId })

  if (isExist) {
    const result = await Availability.findOneAndUpdate({ providerId }, payload, {
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
  providerId: string
): Promise<IAvailability | null> => {
  const result = await Availability.findOne({ providerId })
  return result
}

const checkAvailabilityForDate = async (
  providerId: string,
  date: Date
): Promise<{ isAvailable: boolean; reason?: string; workingHours?: { start: string; end: string } }> => {
  const availability = await Availability.findOne({ providerId })
  
  if (!availability) {
    return { isAvailable: false, reason: 'Provider has not set availability' }
  }

  console.log({date})

const targetDate = new Date(date); // convert string to Date

const customDate = availability.customDates.find(
  (cd) => new Date(cd.date).toDateString() === targetDate.toDateString()
);


  if (customDate) {
    if (customDate.type === 'blocked' || customDate.type === 'unavailable') {
      return { isAvailable: false, reason: 'Date is blocked by provider' }
    }
    if (customDate.type === 'special_hours' && customDate.start && customDate.end) {
      return { 
        isAvailable: true, 
        workingHours: { start: customDate.start, end: customDate.end } 
      }
    }
  }

  // Check recurring rules
  // TODO: Implement recurring rules logic if needed (e.g. block every Friday)

  // Check default schedule
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = days[targetDate.getDay()]
  const daySchedule = availability.defaultSchedule[dayName]

  if (!daySchedule || !daySchedule.isActive) {
    return { isAvailable: false, reason: 'Day is not a working day' }
  }

  return { 
    isAvailable: true, 
    workingHours: { start: daySchedule.start, end: daySchedule.end } 
  }
}

export const AvailabilityService = {
  createOrUpdateAvailability,
  getProviderAvailability,
  checkAvailabilityForDate,
}
