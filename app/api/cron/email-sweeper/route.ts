import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailJob from '@/models/EmailJob';

export const maxDuration = 60; // Max execution time for Vercel Hobby

export async function GET() {
  try {
    await connectDB();

    // 10 minutes is our safety threshold.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find orphaned jobs:
    // 1. Stuck in 'sending' (worker crashed, QStash retries exhausted)
    // 2. Stuck in 'pending' (producer crashed before QStash publish, or QStash dropped it)
    const orphanedJobs = await EmailJob.find({
      $or: [
        { status: 'sending', lockedAt: { $lt: tenMinutesAgo } },
        { status: 'pending', updatedAt: { $lt: tenMinutesAgo } }
      ]
    }).lean();

    if (orphanedJobs.length === 0) {
      return NextResponse.json({ success: true, message: 'No orphaned jobs found' });
    }

    const baseUrl = process.env.APP_URL_PRODUCTION || process.env.NEXT_PUBLIC_BASE_URL;
    const webhookUrl = `${baseUrl?.replace(/\/$/, '')}/api/webhooks/email-worker`;
    const qstashToken = process.env.QSTASH_TOKEN;

    if (!baseUrl || !qstashToken) {
      return NextResponse.json({ success: false, error: 'Server configuration error (missing APP_URL or QSTASH_TOKEN)' }, { status: 500 });
    }

    console.log(`[Sweeper] Found ${orphanedJobs.length} orphaned jobs. Republishing...`);

    // We must update the DB before publishing so they don't get swept again in the next minute.
    // Mongoose updateMany automatically updates `updatedAt`, resetting the 10-minute clock.
    const jobIds = orphanedJobs.map((j: any) => j._id);
    await EmailJob.updateMany(
      { _id: { $in: jobIds } },
      { $set: { status: 'pending', lockedAt: null } }
    );

    // QStash Batch Publishing (Chunks of 100)
    const CHUNK_SIZE = 100;
    let publishedCount = 0;

    for (let i = 0; i < orphanedJobs.length; i += CHUNK_SIZE) {
      const chunk = orphanedJobs.slice(i, i + CHUNK_SIZE);
      
      const qstashPayload = chunk.map((job: any) => ({
        url: webhookUrl,
        queue: 'email-queue',
        body: JSON.stringify({ jobId: job._id.toString() }),
        retries: 3
      }));

      const qstashRes = await fetch('https://qstash.upstash.io/v2/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qstashToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(qstashPayload)
      });

      if (!qstashRes.ok) {
        console.error(`[Sweeper] QStash publish failed for chunk:`, await qstashRes.text());
        // We continue trying other chunks instead of hard failing the entire run
      } else {
        publishedCount += chunk.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Swept ${orphanedJobs.length} jobs. Successfully republished ${publishedCount}.` 
    });

  } catch (error) {
    console.error('[Sweeper] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
