// Check if admin user exists in database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates';
const ADMIN_EMAIL = 'admin@senement.com';

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin user...\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }, { collection: 'users', strict: false });

    const User = mongoose.model('User', UserSchema);

    // Check if admin user exists
    const adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (adminUser) {
      console.log('✅ Admin user found!');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Has Password: ${adminUser.password ? 'Yes' : 'No'}`);
      console.log('\n✅ You can login with: admin@senement.com');
    } else {
      console.log('❌ Admin user NOT found!');
      console.log(`\n⚠️  No user with email: ${ADMIN_EMAIL}`);
      console.log('\n📝 You need to create an admin user:');
      console.log('   1. Go to /signup');
      console.log('   2. Register with email: admin@senement.com');
      console.log('   3. Use password from ADMIN_PASSWORD in .env.local');
      console.log('   4. Then login and access /admin');
    }

    // List all users for reference
    const allUsers = await User.find({}).select('name email').lean();
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log('\nExisting users:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAdmin();
