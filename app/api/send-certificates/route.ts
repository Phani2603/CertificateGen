import { sendBulkCertificates, type EmailProvider } from "@/lib/email-service"
import type { SendingMode } from "@/types/certificate"

export async function POST(request: Request) {
  try {
    const { recipients, provider, sendingMode } = await request.json()

    console.log("[API] Received request to send emails to", recipients?.length, "recipients")
    console.log("[API] Email provider:", provider || "resend")
    console.log("[API] Sending mode:", sendingMode || "auto")

    if (!recipients || recipients.length === 0) {
      return Response.json({ success: false, error: "No recipients provided" }, { status: 400 })
    }

    // Convert base64 strings back to Buffers for email attachment
    const processedRecipients = recipients.map((recipient: any) => ({
      email: recipient.email,
      name: recipient.name,
      certificateBlob: Buffer.from(recipient.certificateBase64, "base64"),
      fileName: recipient.fileName,
    }))

    console.log("[API] Processing", processedRecipients.length, "recipients")

    const results = await sendBulkCertificates(
      processedRecipients, 
      provider as EmailProvider,
      sendingMode as SendingMode | undefined
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
