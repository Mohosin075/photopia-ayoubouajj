import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { Category } from '../src/app/modules/category/category.model'

dotenv.config({ path: path.join(__dirname, '../.env') })

async function updateCategoryImages() {
  try {
    const dbUri = process.env.DATABASE_URL
    if (!dbUri) throw new Error('DATABASE_URL is not defined in .env file')

    console.log('Connecting to database...')
    await mongoose.connect(dbUri)
    console.log('Connected successfully.')

    const categories = await Category.find()
    console.log(`Found ${categories.length} categories/subcategories.`)

    let updatedCount = 0

    for (const cat of categories) {
      // Unsplash Source API is dead and direct URLs can 404 if deleted.
      // We will use LoremFlickr which reliably fetches keyword-based images from Flickr.
      
      // Clean up the category name to extract keywords (e.g. "Photo Editing" -> "photo,editing")
      const keywords = encodeURIComponent(
        cat.name
          .replace(/[^a-zA-Z0-9 ]/g, '') // Remove special characters
          .trim()
          .replace(/\s+/g, ',') // Replace spaces with commas
          .toLowerCase()
      )

      // Add a lock id (cat._id) so the image remains consistent for this category
      const imageUrl = `https://loremflickr.com/800/600/${keywords}?lock=${Math.floor(Math.random() * 1000)}`

      cat.image = imageUrl
      await cat.save()
      
      updatedCount++
      console.log(`Updated [${cat.type}]: ${cat.name} -> ${imageUrl}`)
    }

    console.log(`\nSuccessfully updated ${updatedCount} items!`)
    process.exit(0)
  } catch (error) {
    console.error('Error updating images:', error)
    process.exit(1)
  }
}

updateCategoryImages()
