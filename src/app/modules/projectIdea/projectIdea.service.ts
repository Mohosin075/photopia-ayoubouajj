import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IProjectIdea, IProjectIdeaFilterables } from './projectIdea.interface'
import { ProjectIdea } from './projectIdea.model'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'

const createProjectIdea = async (payload: IProjectIdea) => {
  const result = await ProjectIdea.create(payload)
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create project idea')
  }
  return result
}

const getAllProjectIdeas = async (
  filters: IProjectIdeaFilterables,
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
        { linkText: { $regex: searchTerm, $options: 'i' } },
      ],
    })
  }

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {}

  const finalSortBy = sortBy || 'order'
  const finalSortOrder = sortOrder || 'asc'

  const [result, total] = await Promise.all([
    ProjectIdea.find(whereConditions)
      .populate('subCategoryId')
      .skip(skip)
      .limit(limit)
      .sort({ [finalSortBy]: finalSortOrder }),
    ProjectIdea.countDocuments(whereConditions),
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

const updateProjectIdea = async (
  id: string,
  payload: Partial<IProjectIdea>,
) => {
  const result = await ProjectIdea.findByIdAndUpdate(id, payload, {
    new: true,
  }).populate('subCategoryId')
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project idea not found')
  }
  return result
}

const deleteProjectIdea = async (id: string) => {
  const result = await ProjectIdea.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project idea not found')
  }
  return result
}

export const ProjectIdeaServices = {
  createProjectIdea,
  getAllProjectIdeas,
  updateProjectIdea,
  deleteProjectIdea,
}
