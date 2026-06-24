import mongoose from 'mongoose'
import config from '../src/config'
import { User } from '../src/app/modules/user/user.model'
import { sendPushNotification } from '../src/helpers/pushnotificationHelper'

const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url as string)
    console.log('DB Connected')
  } catch (err) {
    console.error('DB Connection Error', err)
    process.exit(1)
  }
}

const run = async () => {
  await connectDB()
  try {
    // Find the 5 most recently updated users with device tokens
    const recentUsers = await User.find({ deviceToken: { $ne: null, $exists: true } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name email deviceToken updatedAt')

    if (recentUsers.length === 0) {
      console.log('No users with device tokens found.')
      return
    }

    console.log('Recent users with device tokens:')
    recentUsers.forEach((u, i) => {
      console.log(`[${i}] Name: ${u.name} | Email: ${u.email} | Token prefix: ${u.deviceToken?.substring(0, 15)}... | Updated: ${u.updatedAt.toISOString()}`)
    })

    // Try sending a push to the most recently updated user (index 0)
    const targetUser = recentUsers[0]
    console.log(`\nAttempting to send push to most recent user: ${targetUser.name} (${targetUser.email})`)

    if (targetUser.deviceToken) {
      await sendPushNotification(
        targetUser.deviceToken,
        'Test Push Notification',
        'This is a test notification from the updated Photopya backend!',
        {
          test: 'true',
          timestamp: new Date().toISOString()
        }
      )
    }
  } catch (error: any) {
    console.error('Test run failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('DB Disconnected')
  }
}

run()
