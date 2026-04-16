// src/app/modules/service/service.service.ts
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IService, IServiceFilterables } from './service.interface'
import { Service } from './service.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { Types } from 'mongoose'
import { SERVICE_CONSTANTS, serviceFilterableFields, serviceSearchableFields, SERVICE_LIST_PROJECTION } from './service.constants'
import { User } from '../user/user.model'
import { SERVICE_STATUS } from '../../../enum/service'
import { Category } from '../category/category.model'
import { ProfessionalProfile } from '../professionalProfile/professionalProfile.model'

const createService = async (payload: IService & { providerId: string }) => {
  // Check if providerId already has a service with same title
  const existingService = await Service.findOne({
    providerId: payload.providerId,
    title: payload.title,
  })

  if (existingService) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      SERVICE_CONSTANTS.MESSAGES.ALREADY_EXISTS
    )
  }

  // Map images from upload middleware
  if ((payload as any).images) {
    const images = (payload as any).images
    if (images.length > 0) {
      payload.coverMedia = images[0]
      payload.gallery = images
    }
    delete (payload as any).images
  }

  const result = (await Service.create(payload)).populate([
    { path: 'providerId', select: 'name email profile' },
    { path: 'category', select: 'name image theme' },
    { path: 'subCategory', select: 'name theme' },
  ])

  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      SERVICE_CONSTANTS.MESSAGES.CREATE_FAILED
    )
  }

  return result
}

const buildWhereConditions = async (filters: IServiceFilterables) => {
  const { 
    searchTerm, 
    minPrice, 
    maxPrice, 
    isVerified, 
    isActive, 
    status, 
    theme,
    isOnline,
    quickResponse,
    expressDelivery,
    thisWeekend,
    lastMinute,
    ...filterData 
  } = filters
  const conditions: any = {}

  // ... rest of the logic ...
  // Handle new filters based on provider profile or other criteria
  if (isOnline !== undefined) {
    const onlineUsers = await User.find({ isOnline: isOnline === 'true' || isOnline === true }).select('_id').lean();
    conditions.providerId = { $in: onlineUsers.map(u => u._id) };
  }

  if (quickResponse !== undefined) {
    const quickResProfiles = await ProfessionalProfile.find({ responseTime: { $lte: 120 } }).select('user').lean();
    const userIds = quickResProfiles.map(p => p.user);
    if (conditions.providerId) {
        conditions.providerId.$in = (conditions.providerId.$in || []).filter((id: any) => userIds.includes(id));
    } else {
        conditions.providerId = { $in: userIds };
    }
  }

  if (expressDelivery !== undefined) {
       // Assuming express delivery is delivery within 48 hours
       const expressProfiles = await ProfessionalProfile.find({ deliveryRate: { $gte: 95 } }).select('user').lean();
       const userIds = expressProfiles.map(p => p.user);
       if (conditions.providerId) {
           conditions.providerId.$in = (conditions.providerId.$in || []).filter((id: any) => userIds.includes(id));
       } else {
           conditions.providerId = { $in: userIds };
       }
   }

   if (thisWeekend !== undefined) {
       // Filter providers available on Saturday or Sunday
       const { Availability } = require('../availability/availability.model');
       const availableProviders = await Availability.find({
           $or: [
               { 'defaultSchedule.saturday.isActive': true },
               { 'defaultSchedule.sunday.isActive': true }
           ]
       }).select('providerId').lean();
       const userIds = availableProviders.map((a: any) => a.providerId);
       if (conditions.providerId) {
           conditions.providerId.$in = (conditions.providerId.$in || []).filter((id: any) => userIds.includes(id));
       } else {
           conditions.providerId = { $in: userIds };
       }
   }

   if (lastMinute !== undefined) {
       // Filter providers with low advance notice hours
       const { Availability } = require('../availability/availability.model');
       const lastMinuteProviders = await Availability.find({
           advanceNoticeHours: { $lte: 4 } // 4 hours or less
       }).select('providerId').lean();
       const userIds = lastMinuteProviders.map((a: any) => a.providerId);
       if (conditions.providerId) {
           conditions.providerId.$in = (conditions.providerId.$in || []).filter((id: any) => userIds.includes(id));
       } else {
           conditions.providerId = { $in: userIds };
       }
   }
   
   // theme filtering logic already exists below...

  // Exclude DELETED services by default unless explicitly filtering for them
  if (status !== undefined) {
    conditions.status = status
  } else {
    conditions.status = { $ne: SERVICE_STATUS.DELETED }
  }

  // Handle theme filtering by finding all categories with that theme
  if (theme) {
    const categories = await Category.find({ theme }).select('_id').lean();
    if (categories.length > 0) {
      conditions.category = { $in: categories.map(c => c._id) };
    } else {
      // If theme provided but no categories found, force empty result
      conditions.category = new Types.ObjectId();
    }
  }

  // Text search optimization or partial regex match
  if (searchTerm) {
    conditions.$or = serviceSearchableFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  }

  // Range-based optimizations
  if (minPrice !== undefined || maxPrice !== undefined) {
    conditions.price = {}
    if (minPrice !== undefined) conditions.price.$gte = Number(minPrice)
    if (maxPrice !== undefined) conditions.price.$lte = Number(maxPrice)
  }

  // Direct flag matching
  if (isVerified !== undefined) {
    conditions.isVerified = isVerified === 'true' || isVerified === true
  }
  if (isActive !== undefined) {
    conditions.isActive = isActive === 'true' || isActive === true
  }

  // Efficiently handle other exact matches and array $in queries
  Object.entries(filterData).forEach(([field, value]) => {
    if (value !== undefined && value !== '') {
      if (field === 'tags' || field === 'equipment') {
        conditions[field] = { $in: Array.isArray(value) ? value : [value] }
      } else if (['category', 'subCategory', 'providerId'].includes(field)) {
        if (Types.ObjectId.isValid(value as string)) {
          conditions[field] = value
        }
      } else {
        conditions[field] = value
      }
    }
  })

  return conditions
}

const getAllServices = async (
  filters: IServiceFilterables,
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  const whereConditions = await buildWhereConditions(filters)

  // Default sort by createdAt descending
  const sortConditions: any = {}
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1
  } else {
    sortConditions.createdAt = -1
  }

  const [result, total] = await Promise.all([
    Service.find(whereConditions)
      .select(SERVICE_LIST_PROJECTION)
      .populate('providerId', 'name email profile')
      .populate('category', 'name image theme')
      .populate('subCategory', 'name theme')
      .skip(skip)
      .limit(limit)
      .sort(sortConditions)
      .lean(),
    Service.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const getSingleService = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }
  const result = await Service.findById(id)
    .populate('providerId', 'name email profile')
    .populate('category', 'name image theme')
    .populate('subCategory', 'name theme')

  if (!result || result.status === SERVICE_STATUS.DELETED) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }

  return result
}

const updateService = async (
  id: string,
  payload: Partial<IService>,
  userId?: string
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }
  const service = await Service.findById(id)

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }

  // Check if user is authorized (providerId or admin)
  const user = userId ? await User.findById(userId) : null
  const isAdmin = user && user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))

  if (userId && service.providerId.toString() !== userId && !isAdmin) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED)
  }

  // Only Admin can set isOriginal
  if (payload.isOriginal !== undefined && !isAdmin) {
    delete payload.isOriginal
  }

  // Check for duplicate title if updating
  if (payload.title && payload.title !== service.title) {
    const existingService = await Service.findOne({
      providerId: service.providerId,
      title: payload.title,
      _id: { $ne: id }
    })

    if (existingService) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        SERVICE_CONSTANTS.MESSAGES.ALREADY_EXISTS
      )
    }
  }

  // Map images from upload middleware
  if ((payload as any).images) {
    const images = (payload as any).images
    if (images.length > 0) {
      payload.coverMedia = images[0]
      if (!payload.gallery) {
        payload.gallery = images.slice(1)
      } else {
        payload.gallery = [...payload.gallery, ...images.slice(1)]
      }
    }
    delete (payload as any).images
  }

  const result = await Service.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate('providerId', 'name email profile')
    .populate('category', 'name image')

  return result
}

const deleteService = async (id: string, userId?: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }
  const service = await Service.findById(id)

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }

  // Check if already deleted
  if (service.status === SERVICE_STATUS.DELETED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Service is already deleted')
  }

  // Check if user is authorized (providerId or admin)
  if (userId && service.providerId.toString() !== userId) {
    const user = await User.findById(userId)
    if (!user || !user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED)
    }
  }

  // Soft delete: set status to DELETED
  const result = await Service.findByIdAndUpdate(
    id,
    { status: SERVICE_STATUS.DELETED },
    { new: true }
  )

  return result
}

const getServicesByProvider = async (
  providerId: string,
  filters: IServiceFilterables,
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  // Merge providerId into filters
  const whereConditions = await buildWhereConditions({ ...filters, providerId })

  // Sort conditions
  const sortConditions: any = {}
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1
  } else {
    sortConditions.createdAt = -1
  }

  const [result, total] = await Promise.all([
    Service.find(whereConditions)
      .select(SERVICE_LIST_PROJECTION)
      .populate('providerId', 'name email profile')
      .populate('category', 'name image')
      .skip(skip)
      .limit(limit)
      .sort(sortConditions)
      .lean(),
    Service.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const toggleServiceStatus = async (id: string, status: SERVICE_STATUS) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found')
  }
  const service = await Service.findById(id)

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found')
  }

  const result = await Service.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  )

  return result
}

export const ServiceServices = {
  createService,
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
  getServicesByProvider,
  toggleServiceStatus,
}