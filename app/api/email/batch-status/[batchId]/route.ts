import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import EmailJob from '@/models/EmailJob';
import CertificateHistory from '@/models/CertificateHistory';
import PrivateOrg from '@/models/PrivateOrg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId } = await params;
    if (!batchId) {
      return NextResponse.json({ success: false, error: 'Invalid batch id' }, { status: 400 });
    }

    await connectDB();

    let searchBatchIds = [batchId];
    let eventName = '';
    let orgName = '';

    // If it's a valid ObjectId, it might be a CertificateHistory ID.
    // Let's resolve the registrationBatchIds to properly query the EmailJobs.
    if (mongoose.Types.ObjectId.isValid(batchId)) {
      const history = await CertificateHistory.findById(batchId).select('eventName privateOrgId registrationBatchIds batchId').lean();
      if (history) {
        eventName = history.eventName;
        if (history.privateOrgId) {
          const org = await PrivateOrg.findById(history.privateOrgId).select('name').lean();
          if (org) {
            orgName = org.name;
          }
        }
        
        const regBatchIds = Array.isArray(history.registrationBatchIds) && history.registrationBatchIds.length > 0
          ? history.registrationBatchIds
          : (history.batchId ? [history.batchId] : []);
          
        if (regBatchIds.length > 0) {
          searchBatchIds = [...searchBatchIds, ...regBatchIds];
        }
      }
    }

    // Query EmailJobs by the resolved batch IDs
    const jobs = await EmailJob.find({
      batchId: { $in: searchBatchIds },
      type: 'certificate_notification'
    }).select('status').lean();

    if (jobs.length === 0) {
      return NextResponse.json({ success: false, error: 'No jobs found for this batch' }, { status: 404 });
    }

    let sent = 0;
    let pending = 0;
    let failed = 0;
    let configError = 0;

    jobs.forEach((job: any) => {
      if (job.status === 'sent') sent++;
      else if (job.status === 'failed') failed++;
      else if (job.status === 'config_error') configError++;
      else pending++; // 'pending' or 'sending'
    });

    const total = jobs.length;
    const isComplete = (sent + failed + configError) === total;

    return NextResponse.json({
      total,
      sent,
      pending,
      failed,
      configError,
      isComplete,
      eventName,
      orgName
    });

  } catch (error) {
    console.error('[Batch Status API] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch batch status' }, { status: 500 });
  }
}
