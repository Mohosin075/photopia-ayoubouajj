import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IProfessionalProfile } from './professionalProfile.interface'
import { ProfessionalProfile } from './professionalProfile.model'
import { User } from '../user/user.model'
import { USER_ROLES } from '../../../enum/user'

const createProfile = async (
    userId: string,
    payload: Partial<IProfessionalProfile>,
) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const existingProfile = await ProfessionalProfile.findOne({ user: userId })
    if (existingProfile) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Professional profile already exists')
    }

    const result = await ProfessionalProfile.create({
        ...payload,
        user: userId,
    })

    // Add PROFESSIONAL role to user if not already present
    if (!user.roles.includes(USER_ROLES.PROFESSIONAL)) {
        await User.findByIdAndUpdate(userId, {
            $addToSet: { roles: USER_ROLES.PROFESSIONAL },
        })
    }

    return result
}

const getProfile = async (userId: string) => {
    const profile = await ProfessionalProfile.findOne({ user: userId }).populate('user', 'name email profile')
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }
    return profile
}

const updateProfile = async (
    userId: string,
    payload: Partial<IProfessionalProfile>,
) => {
    const profile = await ProfessionalProfile.findOneAndUpdate(
        { user: userId },
        payload,
        { new: true },
    )
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }
    return profile
}

export const ProfessionalProfileServices = {
    createProfile,
    getProfile,
    updateProfile,
}
