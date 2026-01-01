import { z } from 'zod'

export const followUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const unfollowUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const acceptFollowRequestSchema = z.object({
  params: z.object({
    followerId: z.string().min(1, 'Follower ID is required'),
  }),
})

export const rejectFollowRequestSchema = z.object({
  params: z.object({
    followerId: z.string().min(1, 'Follower ID is required'),
  }),
})

export const blockUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const unblockUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const getFollowersSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  query: z.object({
    type: z.enum(['followers', 'following']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})

export const getFollowStatsSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const checkFollowStatusSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const getMutualFollowersSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
})

export const getFollowSuggestionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
})
