import dotenv from 'dotenv';
import { sendZeptoMail } from '../lib/zeptomail-client';

// Load .env.local for testing outside of Next.js
dotenv.config({ path: '.env.local' });

async function run() {
  console.log('🧪 Testing ZeptoMail API Client...\n');
  
  // Take email from command line, or fallback to ADMIN_EMAIL, or test@example.com
  const testEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'test@example.com';
  
  if (testEmail === 'test@example.com') {
    console.log('⚠️ Please provide your email address as an argument.');
    console.log('Usage: npx tsx scripts/test-zeptomail.ts your@email.com\n');
  }

  console.log(`📤 Sending test email to: ${testEmail}...`);

  const result = await sendZeptoMail({
    to: testEmail,
    toName: 'Test User',
    subject: 'ZeptoMail Integration Test - Phase 1',
    html: `
      <h2>Success! 🚀</h2>
      <p>If you are reading this, the ZeptoMail REST API integration is working perfectly.</p>
      <p>This email was sent using native Node.js <code>fetch</code>, bypassing Nodemailer and SMTP completely.</p>
    `
  });

  console.log('\n📊 --- Result ---');
  console.log(`Status: ${result.status}`);
  if (result.message) console.log(`Message: ${result.message}`);
  if (result.data) console.log(`Data:`, JSON.stringify(result.data, null, 2));
}

run();
