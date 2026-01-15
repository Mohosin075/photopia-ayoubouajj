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

  const result = await Service.create(payload)

  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      SERVICE_CONSTANTS.MESSAGES.CREATE_FAILED
    )
  }

  return result
}

const buildWhereConditions = (filters: IServiceFilterables) => {
  const { searchTerm, minPrice, maxPrice, isVerified, isActive, ...filterData } = filters
  const conditions: any = {}

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

  const whereConditions = buildWhereConditions(filters)

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
      .populate('providerId', 'name email profileImage')
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
  const result = await Service.findById(id)
    .populate('providerId', 'name email profileImage')

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }

  return result
}

const updateService = async (
  id: string,
  payload: Partial<IService>,
  userId?: string
) => {
  const service = await Service.findById(id)

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }

  // Check if user is authorized (providerId or admin)
  if (userId && service.providerId.toString() !== userId) {
    const user = await User.findById(userId)
    if (!user || !user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED)
    }
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
  }).populate('providerId', 'name email profileImage')

  return result
}

const deleteService = async (id: string, userId?: string) => {
  const service = await Service.findById(id)

  if (!service) {
    throw new ApiError(StatusCodes.NOT_FOUND, SERVICE_CONSTANTS.MESSAGES.NOT_FOUND)
  }

  // Check if user is authorized (providerId or admin)
  if (userId && service.providerId.toString() !== userId) {
    const user = await User.findById(userId)
    if (!user || !user.roles.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role))) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, SERVICE_CONSTANTS.MESSAGES.UNAUTHORIZED)
    }
  }

  const result = await Service.findByIdAndDelete(id)

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
  const whereConditions = buildWhereConditions({ ...filters, providerId })

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
      .populate('providerId', 'name email profileImage')
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

const toggleServiceStatus = async (id: string, status: string) => {
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