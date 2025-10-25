import { sendBulkCertificates, type EmailProvider } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const { recipients, provider } = await request.json()

    console.log("[API] Received request to send emails to", recipients?.length, "recipients")
    console.log("[API] Email provider:", provider || "resend")

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

    const results = await sendBulkCertificates(processedRecipients, provider as EmailProvider)

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
