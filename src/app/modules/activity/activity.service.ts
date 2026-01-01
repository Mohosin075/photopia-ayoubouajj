import { IActivity } from './activity.interface'
import { Activity } from './activity.model'

const logActivity = async (data: Partial<IActivity>) => {
    try {
        const activity = await Activity.create(data)
        return activity
    } catch (error) {
        console.error('Failed to log activity:', error)
        // We don't want to block the main flow if logging fails, so just log error
        return null
    }
}

const getRecentActivities = async (limit: number = 10) => {
    const activities = await Activity.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name email profile role')
        .populate('resourceId', 'title')

    return activities
}

export const ActivityServices = {
    logActivity,
    getRecentActivities,
}
