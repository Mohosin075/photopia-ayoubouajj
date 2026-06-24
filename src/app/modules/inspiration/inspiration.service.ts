import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IInspiration, IInspirationFilterables } from './inspiration.interface'
import { Inspiration } from './inspiration.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'

const createInspiration = async (payload: IInspiration) => {
  const result = await Inspiration.create(payload)
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create inspiration')
  }
  return result
}

const getAllInspirations = async (
  filters: IInspirationFilterables,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions)

  const { searchTerm } = filters
  const andConditions = []

  if (searchTerm) {
    andConditions.push({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
    })
  }

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Inspiration.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Inspiration.countDocuments(whereConditions),
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

const updateInspiration = async (
  id: string,
  payload: Partial<IInspiration>,
) => {
  const result = await Inspiration.findByIdAndUpdate(id, payload, { new: true })
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Inspiration not found')
  }
  return result
}

const deleteInspiration = async (id: string) => {
  const result = await Inspiration.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Inspiration not found')
  }
  return result
}

export const InspirationServices = {
  createInspiration,
  getAllInspirations,
  updateInspiration,
  deleteInspiration,
}
