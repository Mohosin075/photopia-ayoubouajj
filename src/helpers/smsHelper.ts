import twilio from 'twilio'
import config from '../config'

let client: twilio.Twilio | null = null

if (config.twilio.account_sid && config.twilio.auth_token) {
  try {
    client = twilio(config.twilio.account_sid, config.twilio.auth_token)
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error)
  }
}

export const sendSMSNotification = async (
  to: string,
  body: string,
): Promise<boolean> => {
  try {
    if (client && config.twilio.phone_number) {
      console.log(`📱 [Twilio] Dispatching real SMS to ${to}...`)
      const message = await client.messages.create({
        body,
        from: config.twilio.phone_number,
        to,
      })
      console.log(`📱 [Twilio] SMS successfully sent! SID: ${message.sid}`)
      return true
    } else {
      console.log(
        `📱 [Twilio Simulation] SMS would be sent to ${to}: "${body}"`,
      )
      return true
    }
  } catch (error: any) {
    console.error(`❌ [Twilio] SMS delivery failed to ${to}:`, error.message)
    return false
  }
}
