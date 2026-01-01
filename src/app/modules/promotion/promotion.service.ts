import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { Promotion } from './promotion.model'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { IPaginationOptions } from '../../../interfaces/pagination'
import ApiError from '../../../errors/ApiError'
import { IPromotion } from './promotion.interface'

export interface IPromotionFilterables {
  searchTerm?: string
  isActive?: boolean
  discountType?: 'percentage' | 'fixed'
  isSingleUse?: boolean
}

const promotionSearchableFields = ['code', 'description']

const createPromotion = async (user: JwtPayload, payload: any) => {
  payload.createdBy = user.authId


  const existingPromotion = await Promotion.findOne({
    code: payload.code.toUpperCase(),
  })
  if (existingPromotion) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Promotion code already exists')
  }

  const result = await Promotion.create(payload)
  return result
}

const getAllPromotions = async (
  user: JwtPayload,
  filterables: IPromotionFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: promotionSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Promotion.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Promotion.countDocuments(whereConditions),
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

const getSinglePromotion = async (id: string) => {
  const result = await Promotion.findById(id)

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promotion not found')
  }

  return result
}

const updatePromotion = async (id: string, payload: Partial<IPromotion>) => {
  const result = await Promotion.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promotion not found')
  }

  return result
}

const deletePromotion = async (id: string) => {
  const result = await Promotion.findByIdAndDelete(id)

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promotion not found')
  }

  return result
}

const validatePromotion = async (code: string, authId: string) => {
  // Replace static method with regular query
  const promotion = await Promotion.findOne({ code: code.toUpperCase().trim() })

  if (!promotion) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promotion code not found')
  }

  if (!promotion.isValid()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Promotion code is no longer valid',
    )
  }

  if (!promotion.canUse(authId)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Promotion code has already been used',
    )
  }

  return promotion
}

const applyPromotion = async (code: string, authId: string, amount: number) => {
  const promotion = await validatePromotion(code, authId)

  let discountAmount = 0

  if (promotion.discountType === 'percentage') {
    discountAmount = (amount * promotion.discountValue) / 100
  } else {
    discountAmount = promotion.discountValue
  }

  const finalAmount = Math.max(0, amount - discountAmount)

  // Mark promotion as used
  await promotion.markAsUsed(authId)

  return {
    promotion,
    discountAmount,
    finalAmount,
    originalAmount: amount,
  }
}

const togglePromotionStatus = async (id: string) => {
  const promotion = await Promotion.findById(id)

  if (!promotion) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promotion not found')
  }

  promotion.isActive = !promotion.isActive
  await promotion.save()

  return promotion
}

const getMyPromotions = async (
  user: JwtPayload,
  pagination: IPaginationOptions,
) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const [result, total] = await Promise.all([
    Promotion.find({ createdBy: user.authId })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Promotion.countDocuments({ createdBy: user.authId }),
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

// Helper function to find active promotions (replacement for static method)
const findActivePromotions = async () => {
  const now = new Date()
  return await Promotion.find({
    isActive: true,
    validUntil: { $gte: now },
  })
}

// Helper function to find promotions by user (replacement for static method)
const findPromotionsByUser = async (authId: string) => {
  return await Promotion.find({
    $or: [{ createdBy: authId }, { usedBy: new Types.ObjectId(authId) }],
  })
}

export const PromotionService = {
  createPromotion,
  getAllPromotions,
  getSinglePromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
  applyPromotion,
  togglePromotionStatus,
  getMyPromotions,
  findActivePromotions,
  findPromotionsByUser,
}
