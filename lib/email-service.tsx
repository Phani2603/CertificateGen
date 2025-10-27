import { Resend } from "resend"
import nodemailer from "nodemailer"
import { decryptCredentials } from "@/utils/secure-storage"

const resend = new Resend(process.env.RESEND_API_KEY)

// Pooled email transporter for bulk sending (reuses connections)
let pooledEmailTransporter: nodemailer.Transporter | null = null

const createPooledEmailTransporter = async (credentials: { email: string; appPassword: string }) => {
  console.log('[Email Service] Creating pooled transporter with provided credentials')
  
  if (!credentials) {
    console.error('[Email Service] No credentials provided')
    throw new Error("Email credentials not found. Please authenticate first.")
  }

  if (!pooledEmailTransporter) {
    // Determine SMTP settings based on email domain
    const isGmail = credentials.email.endsWith('@gmail.com')
    const isEducational = credentials.email.includes('.edu.in')
    
    let smtpConfig
    
    if (isGmail) {
      smtpConfig = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
      }
    } else if (isEducational) {
      // For .edu.in emails, many use Gmail for Education
      smtpConfig = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
      }
    } else {
      throw new Error("Unsupported email domain")
    }

    pooledEmailTransporter = nodemailer.createTransport({
      ...smtpConfig,
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max parallel connections (Gmail recommended: 3-5)
      maxMessages: 100, // Messages per connection before reconnecting
      rateDelta: 1000, // Rate limiting: time window in ms
      rateLimit: 5, // Max emails per rateDelta
      auth: {
        user: credentials.email,
        pass: credentials.appPassword,
      },
    })

    console.log("[Email Service] Pooled email transporter created (max 5 connections, 100 msgs each)")

    // Handle idle event for logging
    pooledEmailTransporter.on("idle", () => {
      if (pooledEmailTransporter?.isIdle()) {
        console.log("[Email Service] Transporter is idle and ready for more emails")
      }
    })
  }

  return pooledEmailTransporter
}

// Create email transporter (single connection - for small batches)
const createEmailTransporter = async (credentials: { email: string; appPassword: string }) => {
  console.log('[Email Service] (Single) Creating transporter with provided credentials')
  
  if (!credentials) {
    console.error('[Email Service] (Single) No credentials provided')
    throw new Error("Email credentials not found. Please authenticate first.")
  }

  // Determine SMTP settings based on email domain
  const isGmail = credentials.email.endsWith('@gmail.com')
  const isEducational = credentials.email.includes('.edu.in')
  
  let smtpConfig
  
  if (isGmail) {
    smtpConfig = {
      service: "gmail",
    }
  } else if (isEducational) {
    // For .edu.in emails, we'll try the same logic as validation
    // Most educational institutions use Gmail for Education
    smtpConfig = {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
    }
  } else {
    throw new Error("Unsupported email domain")
  }
  
  return nodemailer.createTransport({
    ...smtpConfig,
    auth: {
      user: credentials.email,
      pass: credentials.appPassword,
    },
  })
}

export type EmailProvider = "resend" | "gmail"
export type SendingMode = "sequential" | "pooled"

// Graceful shutdown handler
if (typeof process !== "undefined") {
  const shutdownHandler = async () => {
    if (pooledEmailTransporter) {
      console.log("[Email Service] Closing pooled transporter...")
      pooledEmailTransporter.close()
      pooledEmailTransporter = null
    }
  }

  process.on("SIGTERM", shutdownHandler)
  process.on("SIGINT", shutdownHandler)
}

export async function sendCertificateEmail(
  email: string,
  recipientName: string,
  certificateBlob: Blob | Buffer,
  fileName: string,
  provider: EmailProvider = "resend",
  credentials?: { email: string; appPassword: string }
) {
  try {
    // Handle both Blob and Buffer types
    let buffer: Buffer
    if (Buffer.isBuffer(certificateBlob)) {
      buffer = certificateBlob
    } else {
      const arrayBuffer = await certificateBlob.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    console.log(`[Email Service] Sending email via ${provider.toUpperCase()} to:`, email)
    console.log("[Email Service] Recipient name:", recipientName)
    console.log("[Email Service] File name:", fileName)

    if (provider === "gmail") {
      // Send via Gmail SMTP
      if (!credentials) {
        throw new Error("Gmail credentials required but not provided")
      }
      const transporter = await createEmailTransporter(credentials)
      
      const info = await transporter.sendMail({
        from: `"KLH University - Certificate Team" <${credentials.email}>`,
        to: email,
        subject: `🎓 Congratulations ${recipientName}! Your Certificate is Ready`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Logo -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #21808D 0%, #1a6570 100%); padding: 40px 30px; text-align: center;">
                        <img src="cid:klh-logo" alt="KLH University" style="max-width: 120px; height: auto; margin-bottom: 20px;" />
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Congratulations!</h1>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 20px; line-height: 1.6;">
                          Dear <strong>${recipientName}</strong>,
                        </p>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                          We are delighted to inform you that your certificate has been successfully generated and is attached to this email.
                        </p>
                        
                        <div style="background-color: #f0f9fa; border-left: 4px solid #21808D; padding: 20px; margin: 25px 0; border-radius: 4px;">
                          <p style="color: #1a6570; font-size: 15px; margin: 0; line-height: 1.6;">
                            <strong>📎 Your certificate is attached as:</strong><br/>
                            <span style="font-family: monospace; color: #333;">${fileName}</span>
                          </p>
                        </div>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                          This certificate is a testament to your hard work, dedication, and the knowledge you've gained. We are incredibly proud of your achievement and hope this milestone serves as a stepping stone to greater success in your future endeavors.
                        </p>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                          Your commitment to learning and excellence has truly paid off. May this achievement inspire you to continue pursuing knowledge and reaching new heights in your academic and professional journey.
                        </p>
                        
                        <!-- Tips Section -->
                        <div style="background-color: #fffbf0; border: 1px solid #ffd700; padding: 20px; margin: 25px 0; border-radius: 8px;">
                          <h3 style="color: #1a1a1a; margin: 0 0 15px; font-size: 16px;">💡 Important Tips:</h3>
                          <ul style="color: #555; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Download and save your certificate immediately</li>
                            <li>Keep both digital and printed copies for your records</li>
                            <li>You can print this on high-quality paper for framing</li>
                            <li>Share your achievement on LinkedIn to enhance your profile</li>
                          </ul>
                        </div>
                        
                        <p style="color: #333333; font-size: 16px; margin: 25px 0 20px; line-height: 1.6;">
                          If you have any questions or need assistance, please don't hesitate to reach out to us.
                        </p>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 10px; line-height: 1.6;">
                          <strong>Once again, congratulations on this well-deserved recognition!</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                          <strong>Best regards,</strong><br/>
                          Certificate Team<br/>
                          KLH University
                        </p>
                        <p style="color: #999999; font-size: 12px; margin: 15px 0 0; line-height: 1.5;">
                          This is an automated email. Please do not reply to this message.<br/>
                          If you need assistance, please contact your program coordinator.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: "klh-logo.png",
            path: "./public/klh.png",
            cid: "klh-logo",
          },
          {
            filename: fileName,
            content: buffer,
            contentType: "image/png",
          },
        ],
      })

      console.log("[Email Service] Gmail Success! Message ID:", info.messageId)
      return { success: true, messageId: info.messageId, provider: "gmail" }
    } else {
      // Send via Resend (original code)
      const base64 = buffer.toString("base64")
      
      console.log("[Email Service] From:", process.env.RESEND_FROM_EMAIL)

      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: email,
        subject: `🎓 Congratulations ${recipientName}! Your Certificate is Ready`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #21808D 0%, #1a6570 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Congratulations!</h1>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 20px; line-height: 1.6;">
                          Dear <strong>${recipientName}</strong>,
                        </p>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                          We are delighted to inform you that your certificate has been successfully generated and is attached to this email.
                        </p>
                        
                        <div style="background-color: #f0f9fa; border-left: 4px solid #21808D; padding: 20px; margin: 25px 0; border-radius: 4px;">
                          <p style="color: #1a6570; font-size: 15px; margin: 0; line-height: 1.6;">
                            <strong>📎 Your certificate is attached as:</strong><br/>
                            <span style="font-family: monospace; color: #333;">${fileName}</span>
                          </p>
                        </div>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                          This certificate is a testament to your hard work, dedication, and the knowledge you've gained. We are incredibly proud of your achievement and hope this milestone serves as a stepping stone to greater success in your future endeavors.
                        </p>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                          Your commitment to learning and excellence has truly paid off. May this achievement inspire you to continue pursuing knowledge and reaching new heights in your academic and professional journey.
                        </p>
                        
                        <!-- Tips Section -->
                        <div style="background-color: #fffbf0; border: 1px solid #ffd700; padding: 20px; margin: 25px 0; border-radius: 8px;">
                          <h3 style="color: #1a1a1a; margin: 0 0 15px; font-size: 16px;">💡 Important Tips:</h3>
                          <ul style="color: #555; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Download and save your certificate immediately</li>
                            <li>Keep both digital and printed copies for your records</li>
                            <li>You can print this on high-quality paper for framing</li>
                            <li>Share your achievement on LinkedIn to enhance your profile</li>
                          </ul>
                        </div>
                        
                        <p style="color: #333333; font-size: 16px; margin: 25px 0 20px; line-height: 1.6;">
                          If you have any questions or need assistance, please don't hesitate to reach out to us.
                        </p>
                        
                        <p style="color: #333333; font-size: 16px; margin: 0 0 10px; line-height: 1.6;">
                          <strong>Once again, congratulations on this well-deserved recognition!</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                          <strong>Best regards,</strong><br/>
                          Certificate Team<br/>
                          KLH University
                        </p>
                        <p style="color: #999999; font-size: 12px; margin: 15px 0 0; line-height: 1.5;">
                          This is an automated email. Please do not reply to this message.<br/>
                          If you need assistance, please contact your program coordinator.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: fileName,
            content: base64,
            contentType: "image/png",
          },
        ],
      })

      console.log("[Email Service] Resend Success! Message ID:", response.data?.id)
      return { success: true, messageId: response.data?.id, provider: "resend" }
    }
  } catch (error) {
    console.error("[Email Service] Error sending to", email, ":", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
      provider,
    }
  }
}

// Pooled bulk sending for large batches (Gmail only)
export async function sendBulkCertificatesPooled(
  recipients: Array<{
    email: string
    name: string
    certificateBlob: Blob | Buffer
    fileName: string
  }>,
  credentials: { email: string; appPassword: string }
) {
  console.log(`[Pooled Email] Starting pooled send for ${recipients.length} recipients`)
  
  const pooledTransporter = await createPooledEmailTransporter(credentials)
  const results: Array<{
    email: string
    success: boolean
    messageId?: string
    error?: string
    provider: string
  }> = []
  
  let sentCount = 0
  let queuedRecipients = [...recipients]

  return new Promise((resolve) => {
    // Process queue when transporter is idle (has free connections)
    pooledTransporter.on('idle', async () => {
      console.log(`[Pooled Email] Transporter idle. Sent: ${sentCount}/${recipients.length}`)
      
      // Send emails while we have both queued recipients and available connections
      while (pooledTransporter.isIdle() && queuedRecipients.length > 0) {
        const recipient = queuedRecipients.shift()!
        
        try {
          const buffer = Buffer.isBuffer(recipient.certificateBlob)
            ? recipient.certificateBlob 
            : Buffer.from(await (recipient.certificateBlob as Blob).arrayBuffer())

          const info = await pooledTransporter.sendMail({
            from: `"KLH University - Certificate Team" <${credentials?.email}>`,
            to: recipient.email,
            subject: `🎓 Congratulations ${recipient.name}! Your Certificate is Ready`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                      <td style="background: linear-gradient(135deg, #21808D 0%, #1a6570 100%); padding: 40px 30px; text-align: center;">
                        <img src="cid:klh-logo" alt="KLH University" style="max-width: 120px; height: auto; margin-bottom: 20px;" />
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Congratulations!</h1>
                      </td>
                    </tr>

                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Dear ${recipient.name},</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                              Congratulations! 🎉 We are delighted to present you with your certificate of completion. 
                              This achievement is a testament to your dedication, hard work, and commitment to excellence.
                            </p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                              Your certificate is attached to this email. We encourage you to share this accomplishment 
                              with your network and celebrate this milestone in your educational journey.
                            </p>
                            
                            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 0 0 30px;">
                              <p style="color: #333333; font-size: 14px; margin: 0; line-height: 1.5;">
                                <strong>💡 Pro Tip:</strong> Download and save your certificate in a secure location. 
                                You may need it for future reference, job applications, or further education opportunities.
                              </p>
                            </div>

                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                              We wish you continued success in all your future endeavors!
                            </p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                              <strong>Best regards,</strong><br/>
                              <span style="color: #667eea; font-weight: 600;">KLH University Academic Team</span>
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                          <strong>Best regards,</strong><br/>
                          Certificate Team<br/>
                          KLH University
                        </p>
                        <p style="color: #999999; font-size: 12px; margin: 15px 0 0; line-height: 1.5;">
                          This is an automated email. Please do not reply to this message.<br/>
                          If you need assistance, please contact your program coordinator.
                        </p>
                      </td>
                    </tr>
                        
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
            attachments: [
              {
                filename: "klh-logo.png",
                path: "./public/klh.png",
                cid: "klh-logo",
              },
              {
                filename: recipient.fileName,
                content: buffer,
                contentType: "image/png",
              },
            ],
          })

          console.log(`[Pooled Email] ✅ Sent to ${recipient.email} - Message ID: ${info.messageId}`)
          results.push({
            email: recipient.email,
            success: true,
            messageId: info.messageId,
            provider: "gmail-pooled",
          })
          sentCount++

        } catch (error) {
          console.error(`[Pooled Email] ❌ Failed to send to ${recipient.email}:`, error)
          results.push({
            email: recipient.email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            provider: "gmail-pooled",
          })
          sentCount++
        }
      }

      // All emails processed
      if (queuedRecipients.length === 0 && sentCount === recipients.length) {
        console.log(`[Pooled Email] ✅ All ${sentCount} emails processed!`)
        pooledTransporter.close()
        resolve(results)
      }
    })
  })
}

// Sequential sending for small batches or Resend
export async function sendBulkCertificates(
  recipients: Array<{
    email: string
    name: string
    certificateBlob: Blob | Buffer
    fileName: string
  }>,
  provider: EmailProvider = "resend",
  sendingMode?: "sequential" | "pooled",
  credentials?: { email: string; appPassword: string }
) {
  // Auto-select mode: pooled for Gmail with 50+ recipients, otherwise sequential
  const shouldUsePooled = 
    sendingMode === "pooled" || 
    (sendingMode !== "sequential" && provider === "gmail" && recipients.length >= 50)

  if (shouldUsePooled && provider === "gmail") {
    console.log(`[Bulk Email] Using POOLED mode for ${recipients.length} recipients`)
    if (!credentials) {
      throw new Error("Gmail credentials required for pooled sending")
    }
    return await sendBulkCertificatesPooled(recipients, credentials)
  }

  // Sequential mode (original implementation)
  console.log(`[Bulk Email] Using SEQUENTIAL mode for ${recipients.length} recipients`)
  const results = []

  for (const recipient of recipients) {
    const result = await sendCertificateEmail(
      recipient.email,
      recipient.name,
      recipient.certificateBlob,
      recipient.fileName,
      provider,
      credentials
    )
    results.push({
      email: recipient.email,
      ...result,
    })

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return results
}

