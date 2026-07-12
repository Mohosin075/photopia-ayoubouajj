import mongoose from 'mongoose'
import config from '../config'
import { User } from '../app/modules/user/user.model'
import colors from 'colors'

const countries = ['Germany', 'France', 'United Kingdom', 'Spain', 'Italy']
const cities = {
  Germany: ['Berlin', 'Munich', 'Hamburg'],
  France: ['Paris', 'Lyon', 'Marseille'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham'],
  Spain: ['Madrid', 'Barcelona', 'Valencia'],
  Italy: ['Rome', 'Milan', 'Naples'],
}

const seedLocations = async () => {
  try {
    console.log(colors.yellow('⏳ Connecting to database...'))
    await mongoose.connect(config.database_url as string)
    console.log(colors.green('🚀 Database connected successfully'))

    const users = await User.find({})
    console.log(colors.blue(`Found ${users.length} users in database.`))

    let updatedCount = 0

    for (const user of users) {
      if (!user.address || !user.address.country || !user.address.city) {
        const randomCountry = countries[Math.floor(Math.random() * countries.length)]
        const countryCities = cities[randomCountry as keyof typeof cities]
        const randomCity = countryCities[Math.floor(Math.random() * countryCities.length)]

        await User.findByIdAndUpdate(user._id, {
          $set: {
            'address.country': randomCountry,
            'address.city': randomCity,
            'address.presentAddress': `${randomCity}, ${randomCountry}`,
            'address.permanentAddress': `${randomCity}, ${randomCountry}`,
          },
        })
        updatedCount++
      }
    }

    console.log(colors.green(`✅ Successfully updated ${updatedCount} users with locations.`))
    process.exit(0)
  } catch (error) {
    console.error(colors.red('❌ Error seeding locations:'), error)
    process.exit(1)
  }
}

seedLocations()
