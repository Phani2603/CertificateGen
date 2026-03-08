// Migration script to add quota fields to existing PrivateOrg documents
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates';

async function migrateOrgs() {
  try {
    console.log('🚀 Starting quota fields migration...\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define PrivateOrg schema
    const PrivateOrgSchema = new mongoose.Schema({
      name: String,
      slug: String,
      certificateQuota: Number,
      certificatesUsed: Number,
      quotaMetadata: Object,
    }, { collection: 'privateorgs', strict: false });

    const PrivateOrg = mongoose.model('PrivateOrg', PrivateOrgSchema);

    // Find organizations without quota fields
    const orgsWithoutQuota = await PrivateOrg.find({
      $or: [
        { certificateQuota: { $exists: false } },
        { certificatesUsed: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${orgsWithoutQuota.length} organizations needing migration\n`);

    if (orgsWithoutQuota.length === 0) {
      console.log('✅ All organizations already have quota fields!');
      return;
    }

    // Update each organization
    for (const org of orgsWithoutQuota) {
      console.log(`Updating: ${org.name} (${org.slug})`);
      
      await PrivateOrg.updateOne(
        { _id: org._id },
        {
          $set: {
            certificateQuota: -1, // -1 = unlimited by default
            certificatesUsed: 0,   // Start with 0 used
            quotaMetadata: {
              allocatedBy: 'system',
              allocatedAt: new Date(),
              notes: 'Auto-migrated to quota system with unlimited access'
            }
          }
        }
      );
      
      console.log(`  ✅ Set quota: -1 (unlimited), used: 0`);
    }

    console.log(`\n🎉 Migration complete! Updated ${orgsWithoutQuota.length} organizations`);
    console.log('\n📋 All organizations now have:');
    console.log('   - certificateQuota: -1 (unlimited)');
    console.log('   - certificatesUsed: 0');
    console.log('   - quotaMetadata with migration info');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrateOrgs();
