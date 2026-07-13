import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const API_KEY = process.env.SERVER_MAP_API_KEY

async function testFinalSearch() {
  console.log('\n========== Final Test: New Places API ==========')
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:autocomplete',
      { input: 'Bogura' },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
        },
      },
    )

    const suggestions = response.data.suggestions || []
    console.log('✅ SUCCESS! Total suggestions:', suggestions.length)
    suggestions.slice(0, 5).forEach((s: any, i: number) => {
      const p = s.placePrediction
      console.log(`  ${i + 1}. description: ${p?.text?.text}`)
      console.log(`     placeId:     ${p?.placeId}`)
      console.log(`     mainText:    ${p?.structuredFormat?.mainText?.text}`)
      console.log(`     secondary:   ${p?.structuredFormat?.secondaryText?.text}`)
    })
  } catch (err: any) {
    console.log('❌ FAILED:', err.response?.data?.error?.message || err.message)
  }
}

testFinalSearch()
