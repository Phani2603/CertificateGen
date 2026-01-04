// Migration script to convert all existing academic users to individual users
// This only needs to be run once

// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Now import other modules that depend on environment variables
import('../lib/mongodb').then(({ default: connectDB }) => {
  return import('../models/User').then(({ default: User }) => {
    return migrateAcademicUsersToIndividual(connectDB, User)
  })
}).catch((error) => {
  console.error('Migration script failed:', error)
  process.exit(1)
})

async function migrateAcademicUsersToIndividual(connectDB: any, User: any) {
  try {
    await connectDB()

    console.log('Starting migration of academic users to individual users...')

    // Find all users with no userType (existing users) or with organizationId (academic users)
    const usersToMigrate = await User.find({
      $or: [
        { userType: { $exists: false } },
        { userType: null },
        { organizationId: { $exists: true, $ne: null } }
      ]
    })

    console.log(`Found ${usersToMigrate.length} users to migrate`)

    let migratedCount = 0

    for (const user of usersToMigrate) {
      // Set userType to individual for all existing academic users
      user.userType = 'individual'
      
      // Keep their organizationId and clubs references intact for historical data
      // But they won't be able to access the academic dashboard anymore
      
      await user.save()
      migratedCount++
      
      if (migratedCount % 10 === 0) {
        console.log(`Migrated ${migratedCount} users...`)
      }
    }

    console.log(`✅ Migration completed successfully!`)
    console.log(`Total users migrated: ${migratedCount}`)
    console.log(`All existing academic users are now individual users.`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    process.exit(0)
  }
}
