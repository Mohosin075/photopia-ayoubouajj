'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.PromotionService = void 0
const http_status_codes_1 = require('http-status-codes')
const mongoose_1 = require('mongoose')
const promotion_model_1 = require('./promotion.model')
const paginationHelper_1 = require('../../../helpers/paginationHelper')
const ApiError_1 = __importDefault(require('../../../errors/ApiError'))
const promotionSearchableFields = ['code', 'description']
const createPromotion = async (user, payload) => {
  payload.createdBy = user.userId
  const existingPromotion = await promotion_model_1.Promotion.findOne({
    code: payload.code.toUpperCase(),
  })
  if (existingPromotion) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.BAD_REQUEST,
      'Promotion code already exists',
    )
  }
  const result = await promotion_model_1.Promotion.create(payload)
  return result
}
const getAllPromotions = async (user, filterables, pagination) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper_1.paginationHelper.calculatePagination(pagination)
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
    promotion_model_1.Promotion.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    promotion_model_1.Promotion.countDocuments(whereConditions),
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
const getSinglePromotion = async id => {
  const result = await promotion_model_1.Promotion.findById(id)
  if (!result) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.NOT_FOUND,
      'Promotion not found',
    )
  }
  return result
}
const updatePromotion = async (id, payload) => {
  const result = await promotion_model_1.Promotion.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  )
  if (!result) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.NOT_FOUND,
      'Promotion not found',
    )
  }
  return result
}
const deletePromotion = async id => {
  const result = await promotion_model_1.Promotion.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.NOT_FOUND,
      'Promotion not found',
    )
  }
  return result
}
const validatePromotion = async (code, userId) => {
  // Replace static method with regular query
  const promotion = await promotion_model_1.Promotion.findOne({
    code: code.toUpperCase().trim(),
  })
  if (!promotion) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.NOT_FOUND,
      'Promotion code not found',
    )
  }
  if (!promotion.isValid()) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.BAD_REQUEST,
      'Promotion code is no longer valid',
    )
  }
  if (!promotion.canUse(userId)) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.BAD_REQUEST,
      'Promotion code has already been used',
    )
  }
  return promotion
}
const applyPromotion = async (code, userId, amount) => {
  const promotion = await validatePromotion(code, userId)
  let discountAmount = 0
  if (promotion.discountType === 'percentage') {
    discountAmount = (amount * promotion.discountValue) / 100
  } else {
    discountAmount = promotion.discountValue
  }
  const finalAmount = Math.max(0, amount - discountAmount)
  // Mark promotion as used
  await promotion.markAsUsed(userId)
  return {
    promotion,
    discountAmount,
    finalAmount,
    originalAmount: amount,
  }
}
const togglePromotionStatus = async id => {
  const promotion = await promotion_model_1.Promotion.findById(id)
  if (!promotion) {
    throw new ApiError_1.default(
      http_status_codes_1.StatusCodes.NOT_FOUND,
      'Promotion not found',
    )
  }
  promotion.isActive = !promotion.isActive
  await promotion.save()
  return promotion
}
const getMyPromotions = async (user, pagination) => {
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper_1.paginationHelper.calculatePagination(pagination)
  const [result, total] = await Promise.all([
    promotion_model_1.Promotion.find({ createdBy: user.userId })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    promotion_model_1.Promotion.countDocuments({ createdBy: user.userId }),
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
  return await promotion_model_1.Promotion.find({
    isActive: true,
    validUntil: { $gte: now },
  })
}
// Helper function to find promotions by user (replacement for static method)
const findPromotionsByUser = async userId => {
  return await promotion_model_1.Promotion.find({
    $or: [
      { createdBy: userId },
      { usedBy: new mongoose_1.Types.ObjectId(userId) },
    ],
  })
}
exports.PromotionService = {
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
