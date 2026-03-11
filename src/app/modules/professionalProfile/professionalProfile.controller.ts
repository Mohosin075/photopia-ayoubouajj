import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { ProfessionalProfileServices } from './professionalProfile.service'

import { JwtPayload } from 'jsonwebtoken'

const createProfile = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload
    const result = await ProfessionalProfileServices.createProfile(userId, req.body)
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Professional profile created successfully',
        data: result,
    })
})

const getProfile = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload
    const result = await ProfessionalProfileServices.getProfile(userId)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Professional profile retrieved successfully',
        data: result,
    })
})

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload
    const result = await ProfessionalProfileServices.updateProfile(userId, req.body)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Professional profile updated successfully',
        data: result,
    })
})

const stripeConnectOnboarding = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload
    const result = await ProfessionalProfileServices.stripeConnectOnboarding(userId)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Stripe onboarding URL generated successfully',
        data: result,
    })
})

const checkStripeAccountStatus = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload
    const result = await ProfessionalProfileServices.checkStripeAccountStatus(userId)
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Stripe account status retrieved successfully',
        data: result,
    })
})

export const ProfessionalProfileController = {
    createProfile,
    getProfile,
    updateProfile,
    stripeConnectOnboarding,
    checkStripeAccountStatus,
}
