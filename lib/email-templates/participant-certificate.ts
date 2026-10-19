/**
 * Participant Certificate Email Template
 * 
 * Generates responsive, Outlook- & mobile-compatible HTML matching the new Certiflo design:
 * - Branded green hero banner with pixel-perfect personalized receiver highlight
 * - Sub-banner issuance summary with primary CTA button
 * - "Certificate details" section with candidate name, event name, issuer name, and illustration
 * - "Finish strong" banner with secondary CTA button
 * - Dark footer with official support and site links
 */

export interface ParticipantEmailData {
  recipientName: string;
  eventName: string;
  issuerName?: string;
  verificationUrl: string;
  baseUrl?: string;
  heroBannerUrl?: string;
  styling?: {
    fontSize?: number | string;
    top?: number | string;
    left?: number | string;
  };
}

export function generateParticipantCertificateEmailHtml(data: ParticipantEmailData): string {
  const {
    recipientName,
    eventName,
    issuerName = 'Certiflo',
    verificationUrl,
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL_PRODUCTION || 'https://www.gocertiflo.com',
  } = data;

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const firstName = recipientName.trim().split(' ')[0] || recipientName;

  // Build dynamic server-side image API url with optional tuning params
  let bannerQuery = `name=${encodeURIComponent(firstName)}`;
  if (data.styling?.fontSize) bannerQuery += `&fontSize=${encodeURIComponent(String(data.styling.fontSize))}`;
  if (data.styling?.top) bannerQuery += `&top=${encodeURIComponent(String(data.styling.top))}`;
  if (data.styling?.left) bannerQuery += `&left=${encodeURIComponent(String(data.styling.left))}`;

  const heroBannerUrl = data.heroBannerUrl || `${normalizedBaseUrl}/api/email/banner?${bannerQuery}`;

  const detailsIllustrationUrl = `${normalizedBaseUrl}/email-assets/details-illustration.png`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inclusive+Sans:ital@0;1&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    p, span, h1, h2, h3 { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    #MessageViewBody a { color: inherit; text-decoration: none; }
    @media (max-width: 600px) {
      .ecw { width: 100% !important; min-width: 0 !important; }
      .details-stack { display: block !important; width: 100% !important; }
      .details-img { max-width: 180px !important; margin: 12px auto 0 !important; }
      .footer-col { display: block !important; width: 100% !important; text-align: left !important; margin-bottom: 16px; }
    }
  </style>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
</head>
<body style="width: 100%; background-color: #f0f1f5; margin: 0; padding: 20px 0; font-family: 'Inclusive Sans', Arial, Helvetica, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color: #f0f1f5;">
    <tr>
      <td align="center" style="padding: 10px;">
        <!--[if mso]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
        <![endif]-->
        
        <table align="center" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="ecw" style="max-width: 600px; width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          
          <!-- HERO BANNER SECTION (Baked PNG - zero CSS position:absolute, 100% Gmail & Outlook compatible) -->
          <tr>
            <td style="padding: 0; background-color: #ffffff; font-size: 0; line-height: 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="padding: 0; border-top-left-radius: 12px; border-top-right-radius: 12px; overflow: hidden; font-size: 0; line-height: 0;">
                    <img src="${heroBannerUrl}" alt="Hey ${firstName}! Your certificate is ready." width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none; margin: 0; padding: 0; border-top-left-radius: 12px; border-top-right-radius: 12px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SUB-BANNER ISSUANCE MESSAGE & TOP CTA -->
          <tr>
            <td style="padding: 24px 24px 8px; text-align: center; background-color: #ffffff;">
              <p style="font-family: 'Inclusive Sans', Arial, Helvetica, sans-serif; font-size: 15px; color: #111111; line-height: 1.5; margin: 0 0 20px; letter-spacing: -0.01em;">
                <strong>${issuerName}</strong> has issued your certificate for <strong>${eventName}</strong>. Use the secure link below to view, download or share it.
              </p>

              <!-- Top Primary Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px;">
                <tr>
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationUrl}" style="height:44px;width:220px;v-text-anchor:middle;" arcsize="16%" fillcolor="#00bf63">
                    <w:anchorlock/>
                    <v:textbox inset="0px,0px,0px,0px">
                      <center style="color:#000000;font-family:Arial,sans-serif;font-size:16px;font-weight:700;">view your certificate</center>
                    </v:textbox>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <td bgcolor="#00bf63" style="background-color: #00bf63; border-radius: 7px; text-align: center;">
                    <a href="${verificationUrl}" target="_blank" rel="noopener" style="display: block; padding: 11px 26px; color: #000000; text-decoration: none; font-family: 'Inclusive Sans', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -0.02em;">
                      view your certificate
                    </a>
                  </td>
                  <!--<![endif]-->
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER SPACING -->
          <tr>
            <td style="padding: 0 24px; height: 12px; background-color: #ffffff;"></td>
          </tr>

          <!-- CERTIFICATE DETAILS SECTION -->
          <tr>
            <td style="padding: 0 24px 24px; background-color: #ffffff;">
              <h2 style="font-family: 'Inclusive Sans', Arial, Helvetica, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: -0.03em; text-align: center; color: #000000; margin: 0 0 16px; line-height: 1.3;">
                Certificate details
              </h2>

              <!-- Gray Rounded Box with Details and Illustration -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="width: 100%; background-color: #edecec; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Left Details Table -->
                        <td width="60%" class="details-stack" style="vertical-align: middle; padding: 6px 10px 6px 0;">
                          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; font-family: 'Inclusive Sans', Arial, sans-serif; font-size: 15px; color: #000000; line-height: 1.5;">
                            <tr>
                              <td style="padding: 7px 0; font-weight: 700; white-space: nowrap; width: 135px; color: #000000;">Candidate Name</td>
                              <td style="padding: 7px 8px; font-weight: 700; color: #000000;">:</td>
                              <td style="padding: 7px 0; color: #222222; font-weight: 500;">${recipientName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 7px 0; font-weight: 700; white-space: nowrap; color: #000000;">Event Name</td>
                              <td style="padding: 7px 8px; font-weight: 700; color: #000000;">:</td>
                              <td style="padding: 7px 0; color: #222222; font-weight: 500;">${eventName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 7px 0; font-weight: 700; white-space: nowrap; color: #000000;">Issued By</td>
                              <td style="padding: 7px 8px; font-weight: 700; color: #000000;">:</td>
                              <td style="padding: 7px 0; color: #222222; font-weight: 500;">${issuerName}</td>
                            </tr>
                          </table>
                        </td>

                        <!-- Right Illustration -->
                        <td width="40%" class="details-stack" style="vertical-align: middle; text-align: center; padding: 6px 0;">
                          <img src="${detailsIllustrationUrl}" alt="Certificate details illustration" width="200" class="details-img" style="display: block; width: 100%; max-width: 200px; height: auto; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- GREEN "FINISH STRONG" BANNER -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="width: 100%; background-color: #00bf63; border-radius: 12px; margin: 20px 0 0; text-align: center;">
                <tr>
                  <td style="padding: 32px 20px;">
                    <div style="font-family: 'Inclusive Sans', Arial, sans-serif; font-size: 34px; font-weight: 700; letter-spacing: -0.02em; color: #000000; margin-bottom: 6px; line-height: 1.2;">
                      Finish strong
                    </div>
                    <div style="font-family: 'Inclusive Sans', Arial, sans-serif; font-size: 16px; color: #000000; margin-bottom: 22px;">
                      Your certificate is waiting.
                    </div>

                    <!-- White Pill Button -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                      <tr>
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationUrl}" style="height:38px;width:180px;v-text-anchor:middle;" arcsize="68%" fillcolor="#ffffff">
                          <w:anchorlock/>
                          <v:textbox inset="0px,0px,0px,0px">
                            <center style="color:#000000;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">view your certificate</center>
                          </v:textbox>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 26px; text-align: center;">
                          <a href="${verificationUrl}" target="_blank" rel="noopener" style="display: block; padding: 10px 26px; color: #000000; text-decoration: none; font-family: 'Inclusive Sans', Arial, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: -0.02em;">
                            view your certificate
                          </a>
                        </td>
                        <!--<![endif]-->
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- DARK FOOTER -->
          <tr>
            <td style="background-color: #000000; padding: 28px 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="55%" class="footer-col" style="vertical-align: top; font-family: 'Inclusive Sans', Arial, sans-serif;">
                    <div style="color: #00bf63; font-size: 16px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.01em;">
                      Questions? We’re here to help.
                    </div>
                    <div style="font-size: 13px; line-height: 1.6;">
                      <a href="mailto:query@gocertiflo.com" style="color: #1a8cff; text-decoration: underline;">query@gocertiflo.com</a><br/>
                      <a href="https://www.gocertiflo.com" target="_blank" rel="noopener" style="color: #1a8cff; text-decoration: underline;">www.gocertiflo.com</a>
                    </div>
                  </td>
                  <td width="45%" class="footer-col" style="vertical-align: top; text-align: right; font-family: 'Inclusive Sans', Arial, sans-serif; font-size: 12px; color: #ffffff; line-height: 1.6;">
                    <div style="margin-bottom: 6px;">
                      <a href="${verificationUrl}" target="_blank" rel="noopener" style="color: #ffffff; text-decoration: underline;">View certificate</a> &bull; 
                      <a href="https://www.gocertiflo.com" target="_blank" rel="noopener" style="color: #ffffff; text-decoration: underline;">Visit website</a>
                    </div>
                    <div style="color: #aaaaaa;">
                      &copy; 2026 Certiflo. All rights reserved.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
