import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import EmailJob from '@/models/EmailJob';
import CertificateHistory from '@/models/CertificateHistory';

export const maxDuration = 60; // Max execution time for Vercel Hobby

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Check
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, certificateIds } = body;

    if (!batchId && (!certificateIds || !Array.isArray(certificateIds))) {
      return NextResponse.json(
        { success: false, error: 'Must provide either batchId or certificateIds array' },
        { status: 400 }
      );
    }

    await connectDB();

    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : (process.env.APP_URL_PRODUCTION || process.env.NEXT_PUBLIC_BASE_URL);
      
    if (!baseUrl) {
      return NextResponse.json({ success: false, error: 'Server configuration error (missing APP_URL)' }, { status: 500 });
    }
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/email-worker`;

    const qstashToken = process.env.QSTASH_TOKEN;
    if (!qstashToken) {
      return NextResponse.json({ success: false, error: 'QStash token not configured' }, { status: 500 });
    }

    let jobsToPublish: any[] = [];
    const EMAIL_TYPE = 'certificate_notification';

    // ==========================================
    // PATH A: "Send All" (using batchId)
    // ==========================================
    if (batchId && (!certificateIds || certificateIds.length === 0)) {
      // 1. Get all certificates in the generation batch
      let certs: any[] = [];
      
      // Try treating batchId as a CertificateHistory ID first
      if (mongoose.Types.ObjectId.isValid(batchId)) {
        const history = await CertificateHistory.findById(batchId).lean();
        if (history && history.certificateIds && history.certificateIds.length > 0) {
          certs = await Certificate.find({ _id: { $in: history.certificateIds } }).lean();
        }
      }

      // Fallback: Try matching metadata.batchId exactly, or as a prefix (since batches are chunked e.g. batch-123-1)
      if (certs.length === 0) {
        certs = await Certificate.find({
          $or: [
            { "metadata.batchId": batchId },
            { "metadata.batchId": { $regex: `^${batchId}` } }
          ]
        }).lean();
      }
      
      if (certs.length === 0) {
        return NextResponse.json({ success: false, error: 'No certificates found for this batch' }, { status: 404 });
      }

      // 2. Find which ones are already successfully sent or currently in-flight
      const certIds = certs.map((c: any) => c._id);
      const alreadyQueuedIds = await EmailJob.find({ 
        certificateId: { $in: certIds }, 
        type: EMAIL_TYPE,
        status: { $in: ["sent", "pending", "sending"] } // Excludes 'failed' / 'config_error' so they can be retried
      }).distinct("certificateId");

      const alreadySet = new Set(alreadyQueuedIds.map(id => id.toString()));
      
      // 3. Filter down to the ones that haven't been queued yet (or failed ones)
      const toQueue = certs.filter((c: any) => !alreadySet.has(c._id.toString()));

      if (toQueue.length === 0) {
        return NextResponse.json({ success: true, message: 'All certificates in this batch are already sent or queued.' });
      }

      // 4. Create or Reset EmailJobs in bulk
      const bulkOps = toQueue.map((c: any) => ({
        updateOne: {
          filter: { certificateId: c._id, type: EMAIL_TYPE },
          update: {
            $set: {
              status: 'pending',
              attempts: 0,
              lastError: '',
              batchId: batchId,
              data: {
                to: c.recipientEmail,
                toName: c.recipientName,
                subject: 'Your Certificate is Ready',
                html: `<p>Hi ${c.recipientName},</p><p>Your certificate is ready. View and download it here: <a href="${baseUrl}/verify/${c.verificationId}">${baseUrl}/verify/${c.verificationId}</a></p>`
              }
            }
          },
          upsert: true
        }
      }));

      await EmailJob.bulkWrite(bulkOps);
      
      // 5. Fetch the jobs we just upserted so we can send their _ids to QStash
      jobsToPublish = await EmailJob.find({ 
        certificateId: { $in: toQueue.map((c: any) => c._id) }, 
        type: EMAIL_TYPE 
      }).lean();
    } 
    // ==========================================
    // PATH B: "Resend Selected" (using certificateIds)
    // ==========================================
    else if (certificateIds && certificateIds.length > 0) {
      const certs = await Certificate.find({ _id: { $in: certificateIds } }).lean();
      
      if (certs.length === 0) {
        return NextResponse.json({ success: false, error: 'No certificates found for the provided IDs' }, { status: 404 });
      }

      // We explicitly upsert each job, resetting its status to 'pending'
      const upsertPromises = certs.map(async (c: any) => {
        const payloadData = {
          to: c.recipientEmail,
          toName: c.recipientName,
          subject: 'Your Certificate is Ready',
          html: `<p>Hi ${c.recipientName},</p><p>Your certificate is ready. View and download it here: <a href="${baseUrl}/verify/${c.verificationId}">${baseUrl}/verify/${c.verificationId}</a></p>`
        };

        const job = await EmailJob.findOneAndUpdate(
          { certificateId: c._id, type: EMAIL_TYPE },
          { 
            $set: { 
              status: 'pending', 
              attempts: 0, 
              lastError: '',
              data: payloadData,
              batchId: c.metadata?.batchId || 'resend_batch'
            }
          },
          { upsert: true, new: true }
        );
        return job;
      });

      jobsToPublish = await Promise.all(upsertPromises);
    }

    if (jobsToPublish.length === 0) {
      return NextResponse.json({ success: true, message: 'No jobs created' });
    }

    // ==========================================
    // QSTASH BATCH PUBLISHING (or Local Bypass)
    // ==========================================
    
    // If we're running locally, QStash can't reach our localhost webhook. 
    // We bypass QStash and hit the worker directly.
    if (webhookUrl.includes('localhost')) {
      console.log(`[Bulk Send API] Local dev detected. Bypassing QStash and triggering worker directly for ${jobsToPublish.length} jobs...`);
      
      // Fire and forget requests to our own webhook
      jobsToPublish.forEach((job: any) => {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job._id.toString() })
        }).catch(err => console.error(`[Local Worker Trigger Failed] Job ${job._id}:`, err));
      });
      
    } else {
      // Production QStash Flow
      const CHUNK_SIZE = 100;
      
      for (let i = 0; i < jobsToPublish.length; i += CHUNK_SIZE) {
        const chunk = jobsToPublish.slice(i, i + CHUNK_SIZE);
        
        const qstashPayload = chunk.map((job: any) => ({
          destination: webhookUrl,
          body: JSON.stringify({ jobId: job._id.toString() }),
          headers: {
            "Upstash-Retries": "3"
          }
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
          const errText = await qstashRes.text();
          console.error(`[Producer] QStash batch publish failed: ${errText}`);
          return NextResponse.json({ success: false, error: 'Failed to publish to QStash queue' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully queued ${jobsToPublish.length} emails.` 
    });

  } catch (error) {
    console.error('[Bulk Send API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
