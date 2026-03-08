// Quick script to check PrivateOrg collection in database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates';

async function checkOrgs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define PrivateOrg schema (minimal)
    const PrivateOrgSchema = new mongoose.Schema({
      name: String,
      slug: String,
      certificateQuota: Number,
      certificatesUsed: Number,
    }, { collection: 'privateorgs' });

    const PrivateOrg = mongoose.model('PrivateOrg', PrivateOrgSchema);

    // Count documents
    const count = await PrivateOrg.countDocuments();
    console.log(`Total PrivateOrg documents: ${count}`);

    // Get all documents
    const orgs = await PrivateOrg.find({}).lean();
    console.log('\nOrganizations:');
    orgs.forEach((org, index) => {
      console.log(`\n${index + 1}. ${org.name}`);
      console.log(`   Slug: ${org.slug}`);
      console.log(`   Quota: ${org.certificateQuota ?? 'not set'}`);
      console.log(`   Used: ${org.certificatesUsed ?? 'not set'}`);
    });

    if (count === 0) {
      console.log('\n⚠️  No organizations found!');
      console.log('Create one at: http://localhost:3000/create-organization');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkOrgs();
