import axios from 'axios'

const checkTimeSync = async () => {
  try {
    const localTime = new Date()
    console.log('Local server time (UTC):', localTime.toISOString())

    const response = await axios.head('https://www.google.com')
    const googleDateStr = response.headers.date
    if (!googleDateStr) {
      console.error('Google did not return a Date header')
      return
    }
    const googleTime = new Date(googleDateStr)
    console.log('Google server time (UTC):', googleTime.toISOString())

    const diffMs = Math.abs(localTime.getTime() - googleTime.getTime())
    console.log(`Time difference: ${diffMs} ms (${diffMs / 1000} seconds)`)

    if (diffMs > 300000) { // 5 minutes
      console.warn('WARNING: Your server time is out of sync by more than 5 minutes! This will cause Firebase/Google Auth to fail with "Invalid JWT Signature". Please synchronize your system clock.')
    } else {
      console.log('Time is synchronized within acceptable limits.')
    }
  } catch (error: any) {
    console.error('Failed to fetch Google time:', error.message)
  }
}

checkTimeSync()
