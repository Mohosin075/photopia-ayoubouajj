'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.PromotionController = void 0
const http_status_codes_1 = require('http-status-codes')
const promotion_service_1 = require('./promotion.service')
const catchAsync_1 = __importDefault(require('../../../shared/catchAsync'))
const sendResponse_1 = __importDefault(require('../../../shared/sendResponse'))
const pick_1 = __importDefault(require('../../../shared/pick'))
const pagination_1 = require('../../../interfaces/pagination')
const createPromotion = (0, catchAsync_1.default)(async (req, res) => {
  const user = req.user
  const result = await promotion_service_1.PromotionService.createPromotion(
    user,
    req.body,
  )
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.CREATED,
    success: true,
    message: 'Promotion created successfully',
    data: result,
  })
})
const getAllPromotions = (0, catchAsync_1.default)(async (req, res) => {
  const user = req.user
  const filters = (0, pick_1.default)(req.query, [
    'searchTerm',
    'isActive',
    'discountType',
    'isSingleUse',
  ])
  const paginationOptions = (0, pick_1.default)(
    req.query,
    pagination_1.paginationFields,
  )
  const result = await promotion_service_1.PromotionService.getAllPromotions(
    user,
    filters,
    paginationOptions,
  )
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'Promotions retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})
const getSinglePromotion = (0, catchAsync_1.default)(async (req, res) => {
  const { id } = req.params
  const result =
    await promotion_service_1.PromotionService.getSinglePromotion(id)
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'Promotion retrieved successfully',
    data: result,
  })
})
const updatePromotion = (0, catchAsync_1.default)(async (req, res) => {
  const { id } = req.params
  const result = await promotion_service_1.PromotionService.updatePromotion(
    id,
    req.body,
  )
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'Promotion updated successfully',
    data: result,
  })
})
const deletePromotion = (0, catchAsync_1.default)(async (req, res) => {
  const { id } = req.params
  const result = await promotion_service_1.PromotionService.deletePromotion(id)
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'Promotion deleted successfully',
    data: result,
  })
})
const validatePromotion = (0, catchAsync_1.default)(async (req, res) => {
  const { code } = req.body
  const user = req.user
  const result = await promotion_service_1.PromotionService.validatePromotion(
    code,
    user.userId,
  )
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'Promotion code is valid',
    data: result,
  })
})
const applyPromotion = (0, catchAsync_1.default)(async (req, res) => {
  const { code, amount } = req.body
  const user = req.user
  const result = await promotion_service_1.PromotionService.applyPromotion(
    code,
    user.userId,
    amount,
  )
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'Promotion applied successfully',
    data: result,
  })
})
const togglePromotionStatus = (0, catchAsync_1.default)(async (req, res) => {
  const { id } = req.params
  const result =
    await promotion_service_1.PromotionService.togglePromotionStatus(id)
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: `Promotion ${result.isActive ? 'activated' : 'deactivated'} successfully`,
    data: result,
  })
})
const getMyPromotions = (0, catchAsync_1.default)(async (req, res) => {
  const user = req.user
  const paginationOptions = (0, pick_1.default)(
    req.query,
    pagination_1.paginationFields,
  )
  const result = await promotion_service_1.PromotionService.getMyPromotions(
    user,
    paginationOptions,
  )
  ;(0, sendResponse_1.default)(res, {
    statusCode: http_status_codes_1.StatusCodes.OK,
    success: true,
    message: 'My promotions retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})
exports.PromotionController = {
  createPromotion,
  getAllPromotions,
  getSinglePromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
  applyPromotion,
  togglePromotionStatus,
  getMyPromotions,
}
