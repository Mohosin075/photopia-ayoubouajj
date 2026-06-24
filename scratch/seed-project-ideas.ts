import mongoose from 'mongoose'
import config from '../src/config'
import { ProjectIdea } from '../src/app/modules/projectIdea/projectIdea.model'

const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url as string)
    console.log('DB Connected')
  } catch (err) {
    console.error('DB Connection Error', err)
    process.exit(1)
  }
}

const projectIdeasToInsert = [
  {
    title: 'Are 🏠 you planning a wedding? 💍',
    linkText: 'See our wedding packages',
    subCategoryId: new mongoose.Types.ObjectId('69f662050f2f322ec6ede0fa'), // Wedding subcategory
    order: 1,
  },
  {
    title: 'Expecting a new family member? 👶',
    linkText: 'Book newborn & maternity session',
    subCategoryId: new mongoose.Types.ObjectId('69f6609d0f2f322ec6eddfe9'), // Newborn & maternity portrait subcategory
    order: 2,
  },
  {
    title: 'Need a professional headshot for LinkedIn? 💼',
    linkText: 'Explore business portrait services',
    subCategoryId: new mongoose.Types.ObjectId('69f6605b0f2f322ec6eddfb7'), // Portrait corporate / business subcategory
    order: 3,
  },
  {
    title: 'Selling or renting your home? 🏡',
    linkText: 'Hire a real estate photographer',
    subCategoryId: new mongoose.Types.ObjectId('69f663310f2f322ec6ede1c8'), // Residential Real Estate subcategory
    order: 4,
  },
  {
    title: 'Want to make your vlogs stand out? 🎬',
    linkText: 'Find expert vlog editors',
    subCategoryId: new mongoose.Types.ObjectId('69f674aa0f2f322ec6edf0db'), // Vlog editing subcategory
    order: 5,
  },
]

const run = async () => {
  await connectDB()
  try {
    // Check existing project ideas
    const count = await ProjectIdea.countDocuments()
    console.log(`Current project ideas count in database: ${count}`)

    console.log('Inserting project ideas...')
    const result = await ProjectIdea.insertMany(projectIdeasToInsert)
    console.log('Successfully inserted project ideas:', result)
  } catch (error) {
    console.error('Error inserting project ideas:', error)
  } finally {
    await mongoose.disconnect()
    console.log('DB Disconnected')
  }
}

run()
