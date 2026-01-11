import mongoose from 'mongoose';
import { Message } from '../message/message.model'
import { IChat } from './chat.interface'
import { Chat } from './chat.model'

const createChatToDB = async (payload: any): Promise<IChat> => {
  const isExistChat: IChat | null = await Chat.findOne({
    participants: { $all: payload },
  })

  if (isExistChat) {
    return isExistChat
  }
  const chat: IChat = await Chat.create({ participants: payload })
  return chat
}

const getChatFromDB = async (user: any, search: string): Promise<any> => {
  const userId = new mongoose.Types.ObjectId(user.userId)

  const aggregatePipeline: any[] = [
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
  ]

  const chatsWithDetails = await Chat.aggregate(aggregatePipeline)

  const totalUnreadChats = chatsWithDetails.filter(
    (chat: any) => chat.unreadCount > 0,
  ).length

  return {
    chats: chatsWithDetails,
    totalUnreadChats,
  }
}

export const ChatService = { createChatToDB, getChatFromDB }
