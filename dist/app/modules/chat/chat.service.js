"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const chat_model_1 = require("./chat.model");
const createChatToDB = async (payload) => {
    const isExistChat = await chat_model_1.Chat.findOne({
        participants: { $all: payload },
    });
    if (isExistChat) {
        return isExistChat;
    }
    const chat = await chat_model_1.Chat.create({ participants: payload });
    return chat;
};
const getChatFromDB = async (user, search) => {
    const userId = new mongoose_1.default.Types.ObjectId(user.userId);
    const aggregatePipeline = [
        {
            $match: {
                participants: userId,
            },
        },
        // Populate participants
        {
            $lookup: {
                from: 'users',
                localField: 'participants',
                foreignField: '_id',
                as: 'participants',
            },
        },
        // Filter participants to exclude the current user and apply search
        {
            $addFields: {
                participants: {
                    $filter: {
                        input: '$participants',
                        as: 'participant',
                        cond: { $ne: ['$$participant._id', userId] },
                    },
                },
            },
        },
        // Keep only chats where at least one participant remains (after search/filter)
        {
            $match: {
                'participants.0': { $exists: true },
                ...(search && {
                    'participants.name': { $regex: search, $options: 'i' },
                }),
            },
        },
        // Get last message
        {
            $lookup: {
                from: 'messages',
                let: { chatId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$chatId', '$$chatId'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'sender',
                            foreignField: '_id',
                            as: 'sender',
                        },
                    },
                    { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            text: 1,
                            image: 1,
                            createdAt: 1,
                            seen: 1,
                            sender: { _id: 1, name: 1, image: 1 },
                        },
                    },
                ],
                as: 'lastMessage',
            },
        },
        { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
        // Get unread count
        {
            $lookup: {
                from: 'messages',
                let: { chatId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$chatId', '$$chatId'] },
                                    { $ne: ['$sender', userId] },
                                    { $eq: ['$seen', false] },
                                ],
                            },
                        },
                    },
                    { $count: 'count' },
                ],
                as: 'unreadCount',
            },
        },
        { $unwind: { path: '$unreadCount', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                unreadCount: { $ifNull: ['$unreadCount.count', 0] },
            },
        },
        // Project final fields
        {
            $project: {
                _id: 1,
                status: 1,
                updatedAt: 1,
                lastMessage: 1,
                unreadCount: 1,
                participants: {
                    _id: 1,
                    name: 1,
                    profile: 1,
                    profession: 1,
                    updatedAt: 1,
                },
            },
        },
        // Sort by latest message or chat update
        {
            $sort: {
                'lastMessage.createdAt': -1,
                updatedAt: -1,
            },
        },
    ];
    const chatsWithDetails = await chat_model_1.Chat.aggregate(aggregatePipeline);
    const totalUnreadChats = chatsWithDetails.filter((chat) => chat.unreadCount > 0).length;
    return {
        chats: chatsWithDetails,
        totalUnreadChats,
    };
};
exports.ChatService = { createChatToDB, getChatFromDB };
