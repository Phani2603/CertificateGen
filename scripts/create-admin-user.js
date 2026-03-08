// Create admin user in database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates';
const ADMIN_EMAIL = 'admin@senement.com';
const ADMIN_PASSWORD = 'AdminForge2026!Secure'; // From .env.local ADMIN_PASSWORD

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      image: String,
      emailVerified: Date,
      userType: String,
    }, { collection: 'users', strict: false });

    const User = mongoose.model('User', UserSchema);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('\n✅ You can login with: admin@senement.com');
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      emailVerified: new Date(),
      userType: 'individual', // Default type, admin access is based on email
      image: null,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: AdminForge2026!Secure`);
    console.log('\n🎉 You can now login and access /admin portal!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@senement.com');
    console.log('   Password: AdminForge2026!Secure');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createAdmin();
