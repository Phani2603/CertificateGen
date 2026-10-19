import { NextRequest, NextResponse } from 'next/server';
import { generateParticipantCertificateEmailHtml } from '@/lib/email-templates/participant-certificate';
import { sendZeptoMail } from '@/lib/zeptomail-client';
import { uploadBannerToS3 } from '@/lib/email-banner-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, recipientName, eventName, issuerName, verificationId, styling } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid recipient email is required' }, { status: 400 });
    }

    const name = recipientName || 'Test Candidate';
    const event = eventName || 'Certiflo Verification Preview';
    const issuer = issuerName || 'Certiflo Team';
    const id = verificationId || 'test_demo_verify_123';

    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.APP_URL_PRODUCTION || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.gocertiflo.com');

    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${id}`;

    // Upload baked banner to public S3 so external inboxes (like Gmail) can load it immediately
    const heroBannerUrl = await uploadBannerToS3(name);

    const html = generateParticipantCertificateEmailHtml({
      recipientName: name,
      eventName: event,
      issuerName: issuer,
      verificationUrl,
      baseUrl,
      heroBannerUrl,
    });

    const result = await sendZeptoMail({
      to,
      toName: name,
      fromName: issuer,
      subject: `🎓 Congratulations! Your Certificate for ${event} is Ready`,
      html,
    });

    if (result.status === 'ok') {
      return NextResponse.json({ success: true, message: `Test email successfully sent to ${to}`, data: result.data });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message || 'ZeptoMail returned an error',
        status: result.status,
        data: result.data
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Send Test Email Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
