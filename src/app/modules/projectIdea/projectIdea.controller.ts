import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { ProjectIdeaServices } from './projectIdea.service'
import pick from '../../../shared/pick'
import { paginationFields } from '../../../interfaces/pagination'

const createProjectIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectIdeaServices.createProjectIdea(req.body)
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Project idea created successfully',
    data: result,
  })
})

const getAllProjectIdeas = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm'])
  const paginationOptions = pick(req.query, paginationFields)
  const result = await ProjectIdeaServices.getAllProjectIdeas(
    filters,
    paginationOptions,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Project ideas retrieved successfully',
    data: result,
  })
})

const updateProjectIdea = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ProjectIdeaServices.updateProjectIdea(id, req.body)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Project idea updated successfully',
    data: result,
  })
})

const deleteProjectIdea = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ProjectIdeaServices.deleteProjectIdea(id)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Project idea deleted successfully',
    data: result,
  })
})

export const ProjectIdeaController = {
  createProjectIdea,
  getAllProjectIdeas,
  updateProjectIdea,
  deleteProjectIdea,
}
