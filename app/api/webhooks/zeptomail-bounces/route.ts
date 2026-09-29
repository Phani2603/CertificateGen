import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailJob from '@/models/EmailJob';

export async function POST(request: NextRequest) {
  try {
    // 1. (Optional for now) Verify a secret token from ZeptoMail headers to secure this route
    // const authHeader = request.headers.get('Authorization');
    
    const body = await request.json();

    // We only care about bounce events
    if (!body || (body.event !== 'bounce' && !body.bounce_details)) {
       return NextResponse.json({ success: true, message: 'Ignored (Not a bounce)' });
    }

    const emailAddress = body.bounce_details?.rcpt_to || body.recipient_address || body.email;

    if (!emailAddress) {
      return NextResponse.json({ success: false, error: 'No recipient email found in payload' }, { status: 400 });
    }

    await connectDB();

    // Find the most recently sent job for this email. 
    // (If we passed `jobId` in ZeptoMail's custom headers, we could look it up directly.
    // For now, looking up the most recent sent job by email address is highly accurate).
    const job = await EmailJob.findOne({ 
      "data.to": emailAddress,
      status: 'sent' 
    }).sort({ createdAt: -1 });

    if (!job) {
      console.log(`[Bounce Webhook] No matching 'sent' job found for ${emailAddress}`);
      return NextResponse.json({ success: true, message: 'No matching job found' });
    }

    // Update status to bounced so it's clear it failed AFTER ZeptoMail initially accepted it.
    job.status = 'bounced';
    job.lastError = `Bounced: ${body.bounce_details?.reason || body.reason || 'Unknown reason'}`;
    await job.save();

    console.log(`[Bounce Webhook] Marked job for ${emailAddress} as bounced.`);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Bounce Webhook] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
