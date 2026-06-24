import mongoose from 'mongoose'
import { User } from '../src/app/modules/user/user.model'
import admin from 'firebase-admin'
import config from '../src/config'

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
    console.log('Initializing Firebase Admin using the new JSON file...')
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert('./photopia-2505f-firebase-adminsdk-fbsvc-4f9264b58f.json')
      })
      console.log('Firebase initialized successfully.')
    }

    const user = await User.findOne({ deviceToken: { $ne: null, $exists: true } })
    if (!user || !user.deviceToken) {
      console.log('No user with device token found.')
      return
    }

    console.log(`Sending test push to User: ${user.name} (${user.email})`)
    console.log(`Token: ${user.deviceToken}`)

    const message = {
      token: user.deviceToken,
      notification: {
        title: 'New Key Test Push',
        body: 'Testing push notification using the new service account JSON file.'
      },
      data: {
        test: 'true',
        timestamp: new Date().toISOString()
      }
    }

    try {
      const response = await admin.messaging().send(message)
      console.log('Successfully sent message:', response)
    } catch (sendError: any) {
      console.error('Error sending message:', sendError.message, sendError)
    }

  } catch (error: any) {
    console.error('Test run failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('DB Disconnected')
  }
}

run()
