"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalProfileServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const professionalProfile_model_1 = require("./professionalProfile.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enum/user");
const createProfile = async (userId, payload) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const existingProfile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId });
    if (existingProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Professional profile already exists');
    }
    const result = await professionalProfile_model_1.ProfessionalProfile.create({
        ...payload,
        user: userId,
    });
    // Add PROFESSIONAL role to user if not already present
    if (!user.roles.includes(user_1.USER_ROLES.PROFESSIONAL)) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            $addToSet: { roles: user_1.USER_ROLES.PROFESSIONAL },
        });
    }
    return result;
};
const getProfile = async (userId) => {
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId }).populate('user');
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    return profile;
};
const updateProfile = async (userId, payload) => {
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOneAndUpdate({ user: userId }, payload, { new: true });
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    return profile;
};
exports.ProfessionalProfileServices = {
    createProfile,
    getProfile,
    updateProfile,
};
