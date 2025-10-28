"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Download, Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react"
import JSZip from "jszip"
import FileSaver from "file-saver"
import type { CertificateField } from "@/types/certificate"
import { saveSession, loadSession,  base64ToBlob } from "@/utils/storage"
import { useCredentials } from "@/hooks/useCredentials"
import DevNav from "@/components/DevNav"

interface CertificateGenerationProps {
  templateImage: string
  fields: CertificateField[]
  onCsvUpload: (data: Array<Record<string, string>>) => void
  onBack: () => void
}

export default function CertificateGeneration({
  templateImage,
  fields,
  onCsvUpload,
  onBack,
}: CertificateGenerationProps) {
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [outputFormat, setOutputFormat] = useState<"png" | "pdf">("png")
  const [quality, setQuality] = useState<"standard" | "high">("standard")
  const [generationStatus, setGenerationStatus] = useState<"idle" | "success" | "error">("idle")
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatedCertificates, setGeneratedCertificates] = useState<Array<{
    email: string
    name: string
    certificateBlob: Blob
    fileName: string
  }>>([])
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [emailsSent, setEmailsSent] = useState(0)
  const [emailErrors, setEmailErrors] = useState<Array<{ email: string; error: string }>>([])
  const [isSendingMail, setIsSendingMail] = useState(false)
  const [emailProvider, setEmailProvider] = useState<"resend" | "gmail">("resend")
  const [sendingMode, setSendingMode] = useState<"auto" | "sequential" | "pooled">("auto")
  const [showDevNav, setShowDevNav] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // Use credentials hook
  const credentialsData = useCredentials()
  const { isAuthenticated, email: authenticatedEmail, checkCredentials } = credentialsData
  
  // Debug logging
  useEffect(() => {
    console.log('[CertGen] useCredentials state changed:', credentialsData)
  }, [credentialsData])

  // Restore generated certificates from session on mount
  useEffect(() => {
    const session = loadSession()
    
    // Restore CSV data and field mapping
    if (session.csvData && session.csvData.length > 0) {
      console.log("[Session] Restoring CSV data:", session.csvData.length, "rows")
      setCsvData(session.csvData)
      onCsvUpload(session.csvData)
    }
    
    if (session.csvHeaders && session.csvHeaders.length > 0) {
      console.log("[Session] Restoring CSV headers:", session.csvHeaders)
      setCsvHeaders(session.csvHeaders)
    }
    
    if (session.fieldMapping) {
      console.log("[Session] Restoring field mapping:", session.fieldMapping)
      setFieldMapping(session.fieldMapping)
    }
    
    // Restore generated certificates
    if (session.generatedCertificates && session.generatedCertificates.length > 0) {
      console.log("[Session] Restoring generated certificates:", session.generatedCertificates.length)
      const restoredCerts = session.generatedCertificates.map((cert) => ({
        email: cert.email,
        name: cert.name,
        certificateBlob: base64ToBlob(cert.certificateBlobBase64),
        fileName: cert.fileName,
      }))
      setGeneratedCertificates(restoredCerts)
      setGenerationStatus("success")
      setGeneratedCount(restoredCerts.length)
    }
  }, [])

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""))

      setCsvHeaders(headers)

      const data = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""))
        return headers.reduce(
          (obj, header, index) => {
            obj[header] = values[index] || ""
            return obj
          },
          {} as Record<string, string>,
        )
      })

      setCsvData(data)
      onCsvUpload(data)
      setGenerationStatus("idle")

      const autoMapping: Record<string, string> = {}
      fields.forEach((field) => {
        if (field.name === "Name") {
          const firstNameCol = headers.find((h) => h.toLowerCase() === "firstname")
          const lastNameCol = headers.find((h) => h.toLowerCase() === "lastname")
          if (firstNameCol && lastNameCol) {
            autoMapping[field.id] = `${firstNameCol}|${lastNameCol}`
          } else {
            const nameCol = headers.find((h) => h.toLowerCase() === "name")
            if (nameCol) autoMapping[field.id] = nameCol
          }
        } else {
          const matchingHeader = headers.find((h) => h.toLowerCase() === field.name.toLowerCase())
          if (matchingHeader) {
            autoMapping[field.id] = matchingHeader
          }
        }
      })
      setFieldMapping(autoMapping)
      
      // Save CSV data and headers to session
      saveSession({ 
        csvData: data, 
        csvHeaders: headers,
        fieldMapping: autoMapping
      })
      console.log("[Session] Saved CSV data and field mapping to localStorage")
    }
    reader.readAsText(file)
  }

  useEffect(() => {
    if (!previewCanvasRef.current || csvData.length === 0) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const row = csvData[0]

      fields.forEach((field) => {
        const csvColumn = fieldMapping[field.id]
        let text = ""

        if (csvColumn) {
          if (csvColumn.includes("|")) {
            const [firstCol, lastCol] = csvColumn.split("|")
            text = `${row[firstCol] || ""} ${row[lastCol] || ""}`.trim()
          } else {
            text = row[csvColumn] || ""
          }
        }

        if (!text) return

        const fontString = `${field.fontWeight} ${field.fontSize}px "${field.fontFamily}", serif`

        ctx.font = fontString
        ctx.fillStyle = field.color
        ctx.textAlign = field.alignment

        const x =
          field.alignment === "center" ? field.x : field.alignment === "right" ? field.x + (field.maxWidth || 0) : field.x
        ctx.fillText(text, x, field.y, field.maxWidth)
      })
    }
    img.src = templateImage
  }, [csvData, fieldMapping, fields, templateImage])

  // Helper function to convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1] // Remove data:image/png;base64, prefix
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const sendEmailsOnly = async () => {
    console.log(`[sendEmailsOnly] Starting - isAuthenticated: ${isAuthenticated}, emailProvider: ${emailProvider}`)
    
    if (generatedCertificates.length === 0) {
      alert("Please generate certificates first")
      return
    }

    // Check if Gmail is selected and credentials are required
    // Also check if credentials exist in storage as a fallback
    const hasStoredCredentials = await (async () => {
      try {
        const { hasValidCredentials } = await import('@/utils/secure-storage')
        return await hasValidCredentials()
      } catch {
        return false
      }
    })()
    
    console.log(`[sendEmailsOnly] hasStoredCredentials: ${hasStoredCredentials}`)
    
    if (emailProvider === "gmail" && !isAuthenticated && !hasStoredCredentials) {
      console.log('[sendEmailsOnly] Not authenticated, showing DevNav again')
      setShowDevNav(true)
      return
    }
    
    console.log('[sendEmailsOnly] Proceeding with email sending...')

    setIsSendingMail(true)
    setEmailStatus("sending")
    setEmailsSent(0)
    setEmailErrors([])

    try {
      // Get credentials from secure storage (client-side only)
      let credentials = null
      if (emailProvider === "gmail") {
        const { decryptCredentials } = await import('@/utils/secure-storage')
        credentials = await decryptCredentials()
        
        if (!credentials) {
          console.log('[sendEmailsOnly] No credentials found after checking storage')
          setShowDevNav(true)
          return
        }
        
        console.log('[sendEmailsOnly] Credentials found, proceeding with email sending')
      }

      // Convert blobs to base64 before sending
      const recipientsWithBase64 = await Promise.all(
        generatedCertificates.map(async (recipient) => ({
          email: recipient.email,
          name: recipient.name,
          certificateBase64: await blobToBase64(recipient.certificateBlob),
          fileName: recipient.fileName,
        }))
      )
      
      const response = await fetch("/api/send-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recipients: recipientsWithBase64, 
          provider: emailProvider,
          sendingMode: sendingMode === "auto" ? undefined : sendingMode,
          // Pass credentials to server for Gmail
          credentials: credentials ? {
            email: credentials.email,
            appPassword: credentials.appPassword
          } : null
        }),
      })

      const result = await response.json()

      console.log("[Client] Email API response:", result)

      if (result.success) {
        setEmailStatus("success")
        setEmailsSent(result.sentCount)
        if (result.errors.length > 0) {
          setEmailErrors(result.errors)
          console.error("[Client] Some emails failed:", result.errors)
        }
      } else {
        setEmailStatus("error")
        setEmailErrors([{ email: "all", error: result.error || "Unknown error" }])
        console.error("[Client] API error:", result)
      }
    } catch (error) {
      console.error("[Client] Error sending emails:", error)
      setEmailStatus("error")
      setEmailErrors([{ email: "all", error: "Failed to send emails. Please try again." }])
    } finally {
      setIsSendingMail(false)
    }
  }

  const generateCertificates = async () => {
    if (csvData.length === 0) {
      alert("Please upload a CSV file first")
      return
    }

    setIsGenerating(true)
    setGenerationStatus("idle")
    setGeneratedCount(0)
    setEmailStatus("idle")
    setEmailsSent(0)
    setEmailErrors([])

    try {
      const zip = new JSZip()
      const dpi = quality === "high" ? 300 : 72
      const scale = dpi / 72
      const emailRecipients: Array<{
        email: string
        name: string
        certificateBlob: Blob
        fileName: string
      }> = []

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i]
        const canvas = await createCertificateCanvas(row, scale)
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create blob"))
          }, "image/png")
        })

        const filename = `certificate_${String(i + 1).padStart(3, "0")}.png`
        zip.file(filename, blob)

        // Store certificate for potential email sending (check for email field - case insensitive)
        const emailField = Object.keys(row).find(key => key.toLowerCase() === 'email')
        const emailAddress = emailField ? row[emailField] : null
        
        console.log(`[Row ${i}] Email field:`, emailAddress, "| All fields:", Object.keys(row))
        
        if (emailAddress && emailAddress.trim()) {
          // Try to get first and last name (case insensitive)
          const firstNameField = Object.keys(row).find(key => key.toLowerCase() === 'firstname')
          const lastNameField = Object.keys(row).find(key => key.toLowerCase() === 'lastname')
          
          const firstName = firstNameField ? row[firstNameField] : ""
          const lastName = lastNameField ? row[lastNameField] : ""
          const recipientName = `${firstName} ${lastName}`.trim() || "Recipient"

          emailRecipients.push({
            email: emailAddress.trim(),
            name: recipientName,
            certificateBlob: blob,
            fileName: filename,
          })
          
          console.log(`[Row ${i}] Added to email list:`, emailAddress, recipientName)
        } else {
          console.warn(`[Row ${i}] No email found in row, skipping email for this certificate`)
        }

        setGeneratedCount(i + 1)
      }

      // Store generated certificates for later email sending
      setGeneratedCertificates(emailRecipients)
      
      console.log("[Certificate Generation] Generated certificates for email:", emailRecipients.length)
      console.log("[Certificate Generation] Email recipients:", emailRecipients.map(r => r.email))

      // Save generated certificates to session storage
      const certificatesForStorage = await Promise.all(
        emailRecipients.map(async (cert) => ({
          email: cert.email,
          name: cert.name,
          certificateBlobBase64: await blobToBase64(cert.certificateBlob),
          fileName: cert.fileName,
        }))
      )
      saveSession({ generatedCertificates: certificatesForStorage })
      console.log("[Session] Saved generated certificates to localStorage")

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const timestamp = new Date().toISOString().split("T")[0]
      const zipFilename = `certificates_${timestamp}.zip`
      FileSaver.saveAs(zipBlob, zipFilename)

      setGenerationStatus("success")
    } catch (error) {
      console.error("Error generating certificates:", error)
      setGenerationStatus("error")
      alert("Error generating certificates. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const createCertificateCanvas = (data: Record<string, string>, scale: number): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext("2d")!
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)

        fields.forEach((field) => {
          const csvColumn = fieldMapping[field.id]
          let text = ""

          if (csvColumn) {
            if (csvColumn.includes("|")) {
              const [firstCol, lastCol] = csvColumn.split("|")
              text = `${data[firstCol] || ""} ${data[lastCol] || ""}`.trim()
            } else {
              text = data[csvColumn] || ""
            }
          }

          if (!text) return

          const fontString = `${field.fontWeight} ${field.fontSize}px "${field.fontFamily}", serif`

          ctx.font = fontString
          ctx.fillStyle = field.color
          ctx.textAlign = field.alignment

          const x =
            field.alignment === "center" ? field.x : field.alignment === "right" ? field.x + (field.maxWidth || 0) : field.x
          ctx.fillText(text, x, field.y, field.maxWidth)
        })

        resolve(canvas)
      }
      img.src = templateImage
    })
  }

  const previewCertificates = csvData.slice(0, 3)

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Step 3: Generate Certificates</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CSV Upload */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-2 border-dashed border-gray-300 hover:border-[#21808D] transition-colors">
            <div className="text-center">
              <Upload className="w-12 h-12 text-[#21808D] mx-auto mb-4" />
              <h3 className="font-semibold text-[#1a1a1a] mb-2">Upload CSV File</h3>
              <p className="text-gray-600 text-sm mb-4">
                CSV should have: <strong>Email, FirstName, LastName</strong> + your certificate fields
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left text-xs">
                <p className="font-semibold text-blue-900 mb-1">Required CSV Format:</p>
                <code className="text-blue-700 block">Email,ID,FirstName,LastName</code>
                <code className="text-blue-700 block">student@klh.edu.in,123,John,Doe</code>
                <p className="text-blue-600 mt-2">💡 Email column is required for sending certificates</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#21808D] hover:bg-[#1a6570] text-white"
              >
                Select CSV File
              </Button>
            </div>
          </Card>

          {csvData.length > 0 && (
            <>
              <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Live Preview (First Certificate)</h3>
                <div className="bg-white rounded-lg overflow-hidden">
                  <canvas ref={previewCanvasRef} className="w-full h-auto" />
                </div>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Map CSV Columns to Fields</h3>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 min-w-24">{field.name}:</label>
                      <select
                        value={fieldMapping[field.id] || ""}
                        onChange={(e) =>
                          setFieldMapping({
                            ...fieldMapping,
                            [field.id]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">-- Select Column --</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </Card>

              <div>
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Preview (First 3 Certificates)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {previewCertificates.map((row, index) => (
                    <Card key={index} className="p-4 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700 mb-2">Certificate {index + 1}</p>
                      <div className="space-y-1 text-sm">
                        {fields.map((field) => {
                          const csvColumn = fieldMapping[field.id]
                          let value = "-"
                          if (csvColumn) {
                            if (csvColumn.includes("|")) {
                              const [firstCol, lastCol] = csvColumn.split("|")
                              value = `${row[firstCol] || ""} ${row[lastCol] || ""}`.trim()
                            } else {
                              value = row[csvColumn] || "-"
                            }
                          }
                          return (
                            <div key={field.id} className="flex justify-between">
                              <span className="text-gray-600">{field.name}:</span>
                              <span className="font-medium text-[#1a1a1a]">{value}</span>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="p-6 bg-[#21808D]/5 border-[#21808D]">
                <h3 className="font-semibold text-[#1a1a1a] mb-4">Processing Options</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Output Format</label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as "png" | "pdf")}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="png">PNG</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Quality</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as "standard" | "high")}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="standard">Standard (72 DPI)</option>
                      <option value="high">High (300 DPI)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-[#21808D]/20">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Email Provider</label>
                    <select
                      value={emailProvider}
                      onChange={(e) => setEmailProvider(e.target.value as "resend" | "gmail")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="resend">Resend (Requires Domain)</option>
                      <option value="gmail">Gmail/Educational SMTP</option>
                    </select>
                    <div className="mt-2 space-y-2">
                      {emailProvider === "resend" ? (
                        <p className="text-xs text-gray-500">
                          Use onboarding@resend.dev for testing (limited to verified email)
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {isAuthenticated ? (
                            <div className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-green-700">
                                Connected as: {authenticatedEmail}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-xs">
                              <AlertCircle className="w-3 h-3 text-orange-500" />
                              <span className="text-orange-700">
                                Email credentials required (will prompt when sending)
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            Secure credential input • Session-only storage • AES-256 encrypted
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {emailProvider === "gmail" && (
                    <div className="pt-4 border-t border-[#21808D]/20">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Sending Mode</label>
                      <select
                        value={sendingMode}
                        onChange={(e) => setSendingMode(e.target.value as "auto" | "sequential" | "pooled")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="auto">Auto ({generatedCertificates.length >= 50 ? "Pooled" : "Sequential"})</option>
                        <option value="sequential">Sequential (Safer, Slower)</option>
                        <option value="pooled">Pooled (Faster, For Bulk)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        {sendingMode === "sequential" 
                          ? "Sends emails one by one with 500ms delay (recommended for <50 recipients)"
                          : sendingMode === "pooled"
                          ? "Uses connection pooling to send emails in parallel (recommended for 50+ recipients)"
                          : `Auto-selects mode based on recipient count (currently ${generatedCertificates.length} recipients)`}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {generationStatus === "success" && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Success!</p>
                      <p className="text-sm text-green-700">
                        {generatedCount} certificates generated and downloaded as ZIP file.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {emailStatus === "success" && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Emails Sent Successfully!</p>
                      <p className="text-sm text-green-700">
                        {emailsSent} certificate(s) sent via email.
                        {emailErrors.length > 0 && ` (${emailErrors.length} failed)`}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {emailStatus === "error" && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Email Sending Failed</p>
                      <p className="text-sm text-red-700 mt-1">
                        {emailErrors[0]?.error || "Failed to send emails. Please try again."}
                      </p>
                      {emailErrors.length > 1 && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-600 cursor-pointer">
                            Show all errors ({emailErrors.length})
                          </summary>
                          <ul className="mt-2 text-xs text-red-600 space-y-1 list-disc list-inside">
                            {emailErrors.map((err, idx) => (
                              <li key={idx}>
                                <strong>{err.email}:</strong> {err.error}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {emailStatus === "sending" && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="font-semibold text-blue-900">Sending Emails...</p>
                      <p className="text-sm text-blue-700">
                        {emailsSent} / {csvData.length} emails sent
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {generationStatus === "error" && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Error</p>
                      <p className="text-sm text-red-700">
                        Failed to generate certificates. Please check your data and try again.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="p-6 bg-[#21808D]/5 border-[#21808D] sticky top-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Certificates to Generate</p>
                <p className="text-2xl font-bold text-[#21808D]">{csvData.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Fields</p>
                <p className="text-lg font-semibold text-[#1a1a1a]">{fields.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Output Format</p>
                <p className="text-lg font-semibold text-[#1a1a1a]">{outputFormat.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-gray-600">Quality</p>
                <p className="text-lg font-semibold text-[#1a1a1a]">{quality === "high" ? "300 DPI" : "72 DPI"}</p>
              </div>
              <div className="pt-2 border-t border-[#21808D]/20">
                <p className="text-gray-600 text-xs">Email Provider</p>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  {emailProvider === "resend" ? "Resend" : "Gmail SMTP"}
                </p>
              </div>
              {generatedCertificates.length > 0 && (
                <div className="pt-2 border-t border-[#21808D]/20">
                  <p className="text-gray-600 text-xs">Generated & Ready to Email</p>
                  <p className="text-lg font-semibold text-green-600">{generatedCertificates.length} certificates</p>
                </div>
              )}
              {isGenerating && (
                <div className="pt-2 border-t border-[#21808D]/20">
                  <p className="text-gray-600 text-xs">Progress</p>
                  <p className="text-sm font-semibold text-[#21808D]">
                    {generatedCount} / {csvData.length}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
          Back
        </Button>
        <Button
          onClick={generateCertificates}
          disabled={csvData.length === 0 || isGenerating}
          className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating... ({generatedCount}/{csvData.length})
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate & Download
            </>
          )}
        </Button>
        <Button
          onClick={sendEmailsOnly}
          disabled={generatedCertificates.length === 0 || isSendingMail || emailStatus === "sending"}
          className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white disabled:opacity-50"
        >
          {isSendingMail ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending... ({emailsSent}/{generatedCertificates.length})
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Emails
            </>
          )}
        </Button>
      </div>

      {/* DevNav for secure credential input */}
      <DevNav
        isOpen={showDevNav}
        onClose={() => setShowDevNav(false)}
        onSuccess={() => {
          console.log('[DevNav] Credentials authenticated successfully')
          // Force re-check credentials to update state
          checkCredentials().then(() => {
            console.log(`[DevNav] After checkCredentials - isAuthenticated: ${isAuthenticated}`)
            // Auto-proceed with email sending after successful authentication
            sendEmailsOnly()
          })
        }}
      />
    </div>
  )
}
