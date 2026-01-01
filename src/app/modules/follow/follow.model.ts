import { Schema, model } from 'mongoose'
import { IFollow, FollowModel, FollowStatus } from './follow.interface'

const FollowSchema = new Schema<IFollow, FollowModel>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FollowStatus),
      default: FollowStatus.ACCEPTED,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Ensure one follower-following pair
FollowSchema.index({ follower: 1, following: 1 }, { unique: true })

// Virtual populate for user data
FollowSchema.virtual('followerInfo', {
  ref: 'User',
  localField: 'follower',
  foreignField: '_id',
  justOne: true,
})

FollowSchema.virtual('followingInfo', {
  ref: 'User',
  localField: 'following',
  foreignField: '_id',
  justOne: true,
})

export const Follow = model<IFollow, FollowModel>('Follow', FollowSchema)
