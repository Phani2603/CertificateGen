import { sendBulkCertificates, type EmailProvider, type EmailDeliveryMode } from "@/lib/email-service"
import type { SendingMode } from "@/types/certificate"

export async function POST(request: Request) {
  try {
    const { recipients, provider = "resend", sendingMode, credentials, deliveryMode = "link-only" } = await request.json()

    console.log("[API] Sending", recipients.length, "certificates via", provider.toUpperCase())
    console.log("[API] Delivery mode:", deliveryMode)
    console.log("[API] Sending mode:", sendingMode || "auto")
    console.log("[API] Credentials provided:", !!credentials)

    if (!recipients || recipients.length === 0) {
      return Response.json({ success: false, error: "No recipients provided" }, { status: 400 })
    }

    if (provider === "gmail" && !credentials) {
      return Response.json(
        { success: false, error: "Gmail credentials required but not provided" },
        { status: 400 }
      )
    }

    // Validate Senement provider env vars
    if (provider === "senement") {
      if (!process.env.CORPORATE_EMAIL_USER || !process.env.CORPORATE_EMAIL_PASSWORD) {
        return Response.json(
          { success: false, error: "Senement email configuration missing in environment variables" },
          { status: 500 }
        )
      }
    }

    // Convert base64 strings back to Buffers for email attachment (only in attachment mode)
    const processedRecipients = deliveryMode === "link-only" 
      ? recipients.map((recipient: any) => ({
          email: recipient.email,
          name: recipient.name,
          certificateBlob: null, // No blob needed for link-only
          fileName: recipient.fileName || "certificate.png",
          verificationId: recipient.verificationId,
          verificationUrl: recipient.verificationUrl,
        }))
      : recipients.map((recipient: any) => ({
          email: recipient.email,
          name: recipient.name,
          certificateBlob: Buffer.from(recipient.certificateBase64, "base64"),
          fileName: recipient.fileName,
          verificationId: recipient.verificationId,
          verificationUrl: recipient.verificationUrl,
        }))

    console.log("[API] Processing", processedRecipients.length, "recipients")

    const results = await sendBulkCertificates(
      processedRecipients, 
      provider as EmailProvider,
      sendingMode as SendingMode | undefined,
      credentials,
      deliveryMode as EmailDeliveryMode
    ) as Array<{
      email: string
      success: boolean
      messageId?: string
      error?: string
      provider: string
    }>

    const successCount = results.filter((r) => r.success).length
    const errors = results.filter((r) => !r.success).map((r) => ({ email: r.email, error: r.error }))

    console.log("[API] Results - Success:", successCount, "Failed:", errors.length)
    if (errors.length > 0) {
      console.error("[API] Errors:", errors)
    }

    return Response.json({
      success: true,
      sentCount: successCount,
      errors,
      provider: provider || "resend",
      mode: results[0]?.provider?.includes("pooled") ? "pooled" : "sequential",
    })
  } catch (error) {
    console.error("[API] Error:", error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 },
    )
  }
}
