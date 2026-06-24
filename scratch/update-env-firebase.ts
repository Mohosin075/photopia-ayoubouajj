import fs from 'fs'
import path from 'path'

const run = () => {
  const jsonPath = path.join(process.cwd(), 'photopia-2505f-firebase-adminsdk-fbsvc-4f9264b58f.json')
  const envPath = path.join(process.cwd(), '.env')

  if (!fs.existsSync(jsonPath)) {
    console.error('New JSON file not found at:', jsonPath)
    return
  }

  // 1. Read JSON and encode to base64
  const jsonContent = fs.readFileSync(jsonPath)
  const base64Str = jsonContent.toString('base64')
  console.log('Encoded new service account to base64 successfully.')

  // 2. Read .env file
  let envContent = fs.readFileSync(envPath, 'utf8')

  // 3. Replace FIREBASE_SERVICE_ACCOUNT_BASE64 line
  const regex = /^FIREBASE_SERVICE_ACCOUNT_BASE64=.*$/m
  const newLine = `FIREBASE_SERVICE_ACCOUNT_BASE64=${base64Str}`

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine)
    console.log('Found existing FIREBASE_SERVICE_ACCOUNT_BASE64 line and replaced it.')
  } else {
    envContent += `\n${newLine}\n`
    console.log('Added new FIREBASE_SERVICE_ACCOUNT_BASE64 line to .env.')
  }

  // 4. Write back to .env
  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('.env file updated successfully.')
}

run()
