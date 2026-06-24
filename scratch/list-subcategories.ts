import mongoose from 'mongoose'
import config from '../src/config'
import { Category } from '../src/app/modules/category/category.model'

const connectDB = async () => {
  try {
    await mongoose.connect(config.database_url as string)
  } catch (err) {
    console.error('DB Connection Error', err)
    process.exit(1)
  }
}

const run = async () => {
  await connectDB()
  try {
    const subcategories = await Category.find({
      type: 'subcategory',
      parent: { $in: [
        new mongoose.Types.ObjectId('69f660160f2f322ec6eddf96'),
        new mongoose.Types.ObjectId('69f660ac0f2f322ec6eddff3')
      ]}
    })
    console.log('Photography Event / Portrait subcategories found:')
    subcategories.forEach(sub => {
      console.log(`ID: ${sub._id} | Name: "${sub.name}" | Theme: "${sub.theme}" | Parent ID: ${sub.parent}`)
    })
  } catch (error) {
    console.error('Error listing subcategories:', error)
  } finally {
    await mongoose.disconnect()
  }
}

run()
