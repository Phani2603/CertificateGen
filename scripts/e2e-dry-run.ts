import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Certificate from '../models/Certificate';
import EmailJob from '../models/EmailJob';
import { sendZeptoMail } from '../lib/zeptomail-client';

dotenv.config({ path: '.env.local' });

// NOTE: Replace these with two of your real email addresses to see the emails arrive!
const REAL_EMAIL_1 = '2320030052cse@gmail.com';
const REAL_EMAIL_2 = 'iamunfity2603@gmail.com';
const BAD_EMAIL = 'this_is_an_invalid_email_format'; // Will trigger a 'failed' status

async function simulateProducerSendAll(batchId: string) {
  console.log(`\n--- Running 'Send All' Producer Logic for batch ${batchId} ---`);

  const certs = await Certificate.find({ "metadata.batchId": batchId }).lean();

  const certIds = certs.map((c: any) => c._id);
  const alreadyQueuedIds = await EmailJob.find({
    certificateId: { $in: certIds },
    type: 'certificate_notification',
    status: { $in: ["sent", "pending", "sending"] }
  }).distinct("certificateId");

  const alreadySet = new Set(alreadyQueuedIds.map(id => id.toString()));
  const toQueue = certs.filter((c: any) => !alreadySet.has(c._id.toString()));

  console.log(`Found ${certs.length} total certs. ${alreadyQueuedIds.length} already in flight/sent. Queuing ${toQueue.length} jobs.`);

  if (toQueue.length > 0) {
    const bulkOps = toQueue.map((c: any) => ({
      updateOne: {
        filter: { certificateId: c._id, type: 'certificate_notification' },
        update: {
          $set: {
            status: 'pending',
            attempts: 0,
            lastError: '',
            batchId: batchId,
            data: {
              to: c.recipientEmail,
              toName: c.recipientName,
              subject: 'Dry Run Certificate',
              html: `<p>Hi ${c.recipientName}, your dry run cert: <a href="http://localhost/verify/${c.verificationId}">Link</a></p>`
            }
          }
        },
        upsert: true
      }
    }));

    await EmailJob.bulkWrite(bulkOps);
    console.log(`Upserted ${toQueue.length} jobs into MongoDB.`);
  }
}

async function simulateWorker(batchId: string) {
  console.log(`\n--- Running Worker Logic for batch ${batchId} ---`);
  const jobs = await EmailJob.find({ batchId, status: 'pending' });
  console.log(`Found ${jobs.length} pending jobs to process.`);

  for (const job of jobs) {
    console.log(`\nProcessing job for: ${job.data.to}`);
    // Atomic claim simulation
    job.status = 'sending';
    await job.save();

    const result = await sendZeptoMail(job.data);
    console.log(`API Result: ${result.status}`);

    if (result.status === 'ok') job.status = 'sent';
    else if (result.status === 'permanent') {
      job.status = 'failed';
      job.lastError = 'Permanent payload failure';
    } else if (result.status === 'config') {
      job.status = 'config_error';
    } else {
      job.status = 'pending'; // retry
    }

    await job.save();
    console.log(`Job status updated to: ${job.status}`);
  }
}

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);

  // Clean up the old index from Phase 2 so it doesn't cause duplicate key errors
  try {
    await EmailJob.collection.dropIndex('dedupeKey_1');
    console.log('🧹 Dropped deprecated dedupeKey_1 index from MongoDB.');
  } catch (e) {
    // Ignore if it doesn't exist
  }

  const batchId = `dry_run_${Date.now()}`;

  // 1. Seed Certificates
  console.log(`\n[1] Seeding 3 Certificates (Batch: ${batchId})...`);
  await Certificate.insertMany([
    // { verificationId: `v_${Date.now()}_1`, certificateHash: 'h1', recipientName: 'Valid 1', recipientEmail: REAL_EMAIL_1, eventName: 'E', eventDate: '2026', organizationName: 'O', clubName: 'C', metadata: { batchId } },
    { verificationId: `v_${Date.now()}_2`, certificateHash: 'h2', recipientName: 'Bad User', recipientEmail: BAD_EMAIL, eventName: 'E', eventDate: '2026', organizationName: 'O', clubName: 'C', metadata: { batchId } },
    // { verificationId: `v_${Date.now()}_3`, certificateHash: 'h3', recipientName: 'Valid 2', recipientEmail: REAL_EMAIL_2, eventName: 'E', eventDate: '2026', organizationName: 'O', clubName: 'C', metadata: { batchId } }
  ]);

  // 2. First "Send All"
  console.log('\n[2] Triggering FIRST "Send All"');
  await simulateProducerSendAll(batchId);
  await simulateWorker(batchId);

  // 3. Second "Send All" (Testing the fix!)
  console.log('\n[3] Triggering SECOND "Send All" (Testing the fix!)');
  console.log('Only the "failed" job should be picked up again, not the two "sent" ones.');
  await simulateProducerSendAll(batchId);

  console.log('\n✅ Dry run complete!');
  process.exit(0);
}

run();
