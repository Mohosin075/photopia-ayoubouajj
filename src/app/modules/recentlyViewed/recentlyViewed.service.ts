import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { RecentlyViewed } from './recentlyViewed.model'
import { IRecentlyViewed } from './recentlyViewed.interface'

const recordView = async (userId: string, serviceId: string) => {
  if (!serviceId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Service ID is required')
  }
  const result = await RecentlyViewed.findOneAndUpdate(
    { userId, serviceId },
    { viewedAt: new Date() },
    { upsert: true, new: true },
  )

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to record view')
  }

  return result
}

const getRecentlyViewed = async (userId: string) => {
  const result = await RecentlyViewed.find({ userId })
    .populate({
      path: 'serviceId',
      populate: [
        { path: 'providerId', select: 'name fullName profile' },
        { path: 'category', select: 'name image icon' },
      ],
    })
    .sort({ viewedAt: -1 })
    .limit(10)

  return result
}

export const RecentlyViewedServices = {
  recordView,
  getRecentlyViewed,
}
