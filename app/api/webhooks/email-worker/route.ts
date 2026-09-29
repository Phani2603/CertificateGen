import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailJob from '@/models/EmailJob';
import { sendZeptoMail, SendEmailPayload } from '@/lib/zeptomail-client';

export const maxDuration = 60; // Max execution time for Vercel Hobby

export async function POST(request: NextRequest) {
  try {
    // 1. (Optional for now) Verify QStash Signature here if using @upstash/qstash
    
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Global caching prevents connection exhaustion when QStash fires in parallel
    await connectDB();

    // 2. Atomic Claim & Timeout Recovery
    // We claim the job ONLY IF it is 'pending' OR (stuck in 'sending' for > 5 mins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const job = await EmailJob.findOneAndUpdate(
      {
        _id: jobId,
        $or: [
          { status: 'pending' },
          { status: 'sending', lockedAt: { $lt: fiveMinutesAgo } }
        ]
      },
      {
        $set: { 
          status: 'sending', 
          lockedAt: new Date() 
        },
        $inc: { attempts: 1 }
      },
      { new: true } // Return the updated document
    );

    // If job is null, it's either already sent or being actively processed by a healthy worker.
    if (!job) {
      const existingJob = await EmailJob.findById(jobId).select('status').lean();
      
      if (!existingJob) {
        return NextResponse.json({ success: true, message: 'Job does not exist' });
      }

      if (['sent', 'failed', 'config_error'].includes(existingJob.status)) {
        console.log(`[Worker] Job ${jobId} already terminal (${existingJob.status}). Skipping (Idempotency).`);
        return NextResponse.json({ success: true, message: 'Job already in terminal state' });
      }

      if (existingJob.status === 'sending') {
        // Active lock. Return 429 so QStash backs off and retries.
        // NOTE: QStash has finite retries. The Phase 4 Sweeper is the true safety net for this.
        return NextResponse.json({ error: 'Job is currently locked, retry later' }, { status: 429 });
      }

      return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 });
    }

    console.log(`[Worker] Processing Job ${jobId} (Attempt ${job.attempts})...`);

    // 3. Execute Send
    // For now, assume job.data maps directly to SendEmailPayload
    const payload: SendEmailPayload = job.data;
    
    const result = await sendZeptoMail(payload);

    // 4. Update Status based on exact classification
    switch (result.status) {
      case 'ok':
        job.status = 'sent';
        break;
      case 'permanent':
        job.status = 'failed';
        job.lastError = result.message || 'Permanent payload failure';
        break;
      case 'config':
        job.status = 'config_error';
        job.lastError = result.message || 'Configuration/Auth error';
        break;
      case 'retry':
        if (job.attempts >= 5) {
          job.status = 'failed';
          job.lastError = `Max attempts (5) exhausted. Last error: ${result.message || 'Temporary error'}`;
          await job.save();
          // Return 200 so QStash drops it. A human must intervene via the UI now.
          return NextResponse.json({ success: false, message: 'Max attempts exhausted, marked failed' });
        }

        // Reset to pending so the next QStash retry will pick it up
        job.status = 'pending';
        job.lastError = result.message || 'Temporary error';
        await job.save();
        
        // Throwing 500 explicitly tells QStash to retry this webhook later
        return NextResponse.json({ error: 'Temporary failure, requesting QStash retry' }, { status: 500 });
    }

    await job.save();
    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('[Worker] Fatal Error:', error);
    // Throwing 500 ensures QStash knows the worker crashed unexpectedly and will retry
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
