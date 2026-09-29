/**
 * ZeptoMail REST API Client
 * 
 * Uses native fetch to keep the bundle small and avoid unnecessary SDKs.
 * Implements strict error classification for the QStash webhook retry mechanism.
 */

export type ZeptoMailStatus = 'ok' | 'retry' | 'permanent' | 'config';

export interface ZeptoMailResponse {
  status: ZeptoMailStatus;
  message?: string;
  data?: any;
}

export interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

export async function sendZeptoMail(payload: SendEmailPayload): Promise<ZeptoMailResponse> {
  const token = process.env.ZEPTOMAIL_SEND_TOKEN;
  const senderEmail = process.env.ZEPTOMAIL_SENDER_EMAIL;
  const apiUrl = process.env.ZEPTOMAIL_API_URL;

  // 1. Fail fast on missing config
  if (!token || !senderEmail || !apiUrl) {
    console.error('[ZeptoMail] Missing required environment variables');
    return { status: 'config', message: 'Missing ZeptoMail environment variables' };
  }

  // Safely format the token (Zoho gives it with the prefix, we ensure it's not doubled)
  const formattedToken = token.startsWith('Zoho-enczapikey ') 
    ? token 
    : `Zoho-enczapikey ${token}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': formattedToken
      },
      body: JSON.stringify({
        from: { 
          address: senderEmail,
          name: process.env.ZEPTOMAIL_SENDER_NAME || 'GoCertiflo'
        },
        to: [
          {
            email_address: {
              address: payload.to,
              name: payload.toName || payload.to.split('@')[0]
            }
          }
        ],
        subject: payload.subject,
        htmlbody: payload.html
      })
    });

    // Try parsing JSON, fallback to text if Zeptomail returns non-JSON error
    let data;
    const rawText = await response.text();
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    if (response.ok) {
      return { status: 'ok', data };
    }

    // 2. Classify errors based on HTTP status code
    if (response.status === 401 || response.status === 403) {
      console.error(`[ZeptoMail] status=${response.status} Auth/Domain Error:\n`, JSON.stringify(data, null, 2));
      
      // Fix ZeptoMail's weird API design where a bad email format throws 401 Access Denied
      const details = data?.error?.details || [];
      const isInvalidEmail = details.some((d: any) => d.code === 'SM_113' || d.message === 'Invalid email address');
      
      if (isInvalidEmail) {
        return { status: 'permanent', message: 'Payload error: Invalid email address format', data };
      }

      return { status: 'config', message: `Auth/Domain error: ${response.status}`, data };
    }

    if (response.status === 429 || response.status >= 500) {
      console.error(`[ZeptoMail] status=${response.status} Temporary/Rate-Limit Error:\n`, JSON.stringify(data, null, 2));
      return { status: 'retry', message: `Temporary error: ${response.status}`, data };
    }

    // 400 Bad Request (e.g. malformed email address) -> permanent failure for this specific email
    console.error(`[ZeptoMail] status=${response.status} Permanent/Payload Error:\n`, JSON.stringify(data, null, 2));
    return { status: 'permanent', message: `Payload error: ${response.status}`, data };

  } catch (error) {
    // 3. Network errors (fetch failed entirely) should be retried
    console.error('[ZeptoMail] Network Error:', error);
    return { status: 'retry', message: error instanceof Error ? error.message : 'Unknown network error' };
  }
}
