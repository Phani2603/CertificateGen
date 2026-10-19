import { NextRequest, NextResponse } from 'next/server';
import { generateParticipantCertificateEmailHtml } from '@/lib/email-templates/participant-certificate';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const recipientName = searchParams.get('name') || 'Phani Kumar';
  const eventName = searchParams.get('event') || 'Full Stack AI Hackathon 2026';
  const issuerName = searchParams.get('issuer') || 'Google Developer Student Clubs';
  const verificationId = searchParams.get('id') || 'cert_demo_123456';

  const fontSize = searchParams.get('fontSize') || undefined;
  const top = searchParams.get('top') || undefined;
  const left = searchParams.get('left') || undefined;

  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : (process.env.APP_URL_PRODUCTION || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.gocertiflo.com');

  const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${verificationId}`;

  const html = generateParticipantCertificateEmailHtml({
    recipientName,
    eventName,
    issuerName,
    verificationUrl,
    baseUrl,
    styling: {
      fontSize,
      top,
      left,
    },
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
