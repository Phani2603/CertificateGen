const { readFileSync } = require('fs')
const { join } = require('path')
const mongoose = require('mongoose')

// Load environment variables from .env.local
require('dotenv').config({ path: join(process.cwd(), '.env.local') })

// Define Organization schema inline for seeding
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'college' },
  city: String,
  state: String,
  country: { type: String, default: 'India' },
  website: String,
  description: String,
  logoUrl: String,
  nirfRank: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema)

async function seedColleges() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certificategen'
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Read CSV file
    const csvPath = join(process.cwd(), 'public', 'nirf_engineering_2025.csv')
    console.log('Reading CSV file from:', csvPath)
    const csvContent = readFileSync(csvPath, 'utf-8')
    
    // Parse CSV
    const lines = csvContent.split('\n').slice(1) // Skip header
    const colleges = lines
      .filter(line => line.trim())
      .map(line => {
        const [id, name, city, state, score, rank] = line.split(',')
        return {
          name: name?.replace(/More Details.*/, '').trim() || '',
          type: 'college',
          city: city?.trim() || '',
          state: state?.trim() || '',
          country: 'India',
          nirfRank: parseInt(rank) || 0,
          members: [],
        }
      })
      .filter(college => college.name) // Only include valid entries

    console.log(`Found ${colleges.length} colleges to seed`)

    // Check if already seeded
    const existingCount = await Organization.countDocuments({ type: 'college', nirfRank: { $exists: true } })
    
    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} colleges. Skipping seed.`)
      console.log('To re-seed, delete existing colleges first.')
      await mongoose.disconnect()
      process.exit(0)
    }

    // Bulk insert
    console.log('Inserting colleges into database...')
    const result = await Organization.insertMany(colleges, { ordered: false })
    console.log(`✅ Successfully seeded ${result.length} colleges to database`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error seeding colleges:', error)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  }
}

seedColleges()
