import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { HomeServices } from './home.service'
import { JwtPayload } from 'jsonwebtoken'

const getHomeData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const userId = user?.userId

  const result = await HomeServices.getHomeData(userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Home data retrieved successfully',
    data: result,
  })
})

export const HomeController = {
  getHomeData,
}
