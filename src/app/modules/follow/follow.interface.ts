import { Model, Types } from 'mongoose'
import { IUser } from '../user/user.interface'

export type IFollow = {
  _id?: Types.ObjectId
  follower: Types.ObjectId | IUser
  following: Types.ObjectId | IUser
  status: FollowStatus
  createdAt: Date
  updatedAt: Date
}

export enum FollowStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

export type FollowModel = Model<IFollow>

export interface FollowCounts {
  followersCount: number
  followingCount: number
}

export interface FollowStats {
  followers: number
  following: number
  pendingRequests?: number
}

export interface FollowUser {
  _id: string
  name: string
  email: string
  profile: string
  status: string
  followedAt?: Date
}
