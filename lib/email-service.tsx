import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendCertificateEmail(
  email: string,
  recipientName: string,
  certificateBlob: Blob | Buffer,
  fileName: string,
) {
  try {
    // Handle both Blob and Buffer types
    let base64: string
    if (Buffer.isBuffer(certificateBlob)) {
      base64 = certificateBlob.toString("base64")
    } else {
      const buffer = await certificateBlob.arrayBuffer()
      base64 = Buffer.from(buffer).toString("base64")
    }

    console.log("[Email Service] Sending email to:", email)
    console.log("[Email Service] From:", process.env.RESEND_FROM_EMAIL)
    console.log("[Email Service] Recipient name:", recipientName)
    console.log("[Email Service] File name:", fileName)

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: `Your Certificate - ${recipientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #21808D;">Congratulations!</h2>
          <p>Dear ${recipientName},</p>
          <p>Your certificate has been generated and is attached to this email.</p>
          <p>Please find your certificate attached below.</p>
          <p style="margin-top: 30px; color: #666;">Best regards,<br/>Certificate Team</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: base64,
          contentType: "image/png",
        },
      ],
    })

    console.log("[Email Service] Success! Message ID:", response.data?.id)
    return { success: true, messageId: response.data?.id }
  } catch (error) {
    console.error("[Email Service] Error sending to", email, ":", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }
  }
}

export async function sendBulkCertificates(
  recipients: Array<{
    email: string
    name: string
    certificateBlob: Blob | Buffer
    fileName: string
  }>,
) {
  const results = []

  for (const recipient of recipients) {
    const result = await sendCertificateEmail(
      recipient.email,
      recipient.name,
      recipient.certificateBlob,
      recipient.fileName,
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
