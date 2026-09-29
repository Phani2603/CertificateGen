import dotenv from 'dotenv';
import mongoose from 'mongoose';
import EmailJob from '../models/EmailJob';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function run() {
  console.log('🧪 Testing Email Worker Endpoint (Local Database Check)...\n');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from .env.local');
    process.exit(1);
  }

  // 1. Connect to DB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // 2. Create a dummy job
  const dummyJobId = new mongoose.Types.ObjectId();
  const testEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'test@example.com';
  
  const dedupeKey = `test_${Date.now()}:certificate`;

  console.log(`📤 Creating dummy pending EmailJob (dedupeKey: ${dedupeKey})...`);
  
  const newJob = await EmailJob.create({
    _id: dummyJobId,
    type: 'certificate',
    dedupeKey: dedupeKey,
    batchId: 'batch_test_001',
    status: 'pending',
    data: {
      to: testEmail,
      toName: 'Test Worker',
      subject: 'Worker Test - Phase 2',
      html: `
        <h2>Worker Success! ⚙️</h2>
        <p>This email was processed by the <code>EmailJob</code> model and the worker claim logic.</p>
      `
    }
  });

  console.log(`✅ Dummy job created with ID: ${newJob._id}`);
  console.log(`\n👉 To test the worker route, run your Next.js server (npm run dev)`);
  console.log(`   and run this CURL command in another terminal:`);
  console.log(`\ncurl -X POST http://localhost:3000/api/webhooks/email-worker \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"jobId": "${newJob._id}"}'\n`);
  
  console.log(`Once the curl command finishes, check your MongoDB to see the status changed to 'sent'!`);
  
  mongoose.disconnect();
}

run();
