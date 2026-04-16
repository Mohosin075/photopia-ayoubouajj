import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { InspirationServices } from './inspiration.service'
import pick from '../../../shared/pick'
import { paginationFields } from '../../../interfaces/pagination'

const createInspiration = catchAsync(async (req: Request, res: Response) => {
    const result = await InspirationServices.createInspiration(req.body)
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Inspiration created successfully',
        data: result,
    })
})

const getAllInspirations = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm'])
    const paginationOptions = pick(req.query, paginationFields)
    const result = await InspirationServices.getAllInspirations(filters, paginationOptions)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Inspirations retrieved successfully',
        data: result,
    })
})

const updateInspiration = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await InspirationServices.updateInspiration(id, req.body)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Inspiration updated successfully',
        data: result,
    })
})

const deleteInspiration = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await InspirationServices.deleteInspiration(id)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Inspiration deleted successfully',
        data: result,
    })
})

export const InspirationController = {
    createInspiration,
    getAllInspirations,
    updateInspiration,
    deleteInspiration
}
