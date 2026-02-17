"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Download, Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react"
import JSZip from "jszip"
import FileSaver from "file-saver"
import type { CertificateField } from "@/types/certificate"
import { saveSession, loadSession, clearSession, base64ToBlob } from "@/utils/storage"
import { useCredentials } from "@/hooks/useCredentials"
import DevNav from "@/components/DevNav"
import { toast } from "sonner"

interface CertificateGenerationProps {
  templateImage: string
  templateS3Key?: string // NEW: S3 key for template
  fields: CertificateField[]
  onCsvUpload: (data: Array<Record<string, string>>) => void
  onBack: () => void
  selectedEvent?: {club: string, eventId: string, eventName: string} | null
  onAddToHistory?: (eventName: string, clubName: string, count: number, totalSizeBytes: number) => void
  organization?: {id: string, name: string, logoUrl?: string} | null
  clubs?: Array<{id: string, name: string, members: number, color: string, logoUrl?: string}>
}

export default function CertificateGeneration({
  templateImage,
  templateS3Key, // NEW
  fields,
  onCsvUpload,
  onBack,
  selectedEvent,
  onAddToHistory,
  organization,
  clubs,
}: CertificateGenerationProps) {
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [outputFormat, setOutputFormat] = useState<"png" | "pdf">("png")
  const [quality, setQuality] = useState<"standard" | "high">("standard")
  const [generationStatus, setGenerationStatus] = useState<"idle" | "success" | "error">("idle")
  const [generatedCount, setGeneratedCount] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<
    "idle" | "rendering" | "registering" | "zipping" | "completed" | "error"
  >("idle")
  const [renderBatchInfo, setRenderBatchInfo] = useState<{ current: number; total: number } | null>(null)
  const [registerBatchInfo, setRegisterBatchInfo] = useState<{ current: number; total: number } | null>(null)
  const [registeredCount, setRegisteredCount] = useState(0)
  const [totalToRegister, setTotalToRegister] = useState(0)
  const [cachedTemplateUrl, setCachedTemplateUrl] = useState<string | null>(null) // NEW: Cache S3 template URL
  const [generatedCertificates, setGeneratedCertificates] = useState<Array<{
    email: string
    name: string
    certificateBlob: Blob
    fileName: string
    verificationId?: string
    verificationUrl?: string
  }>>([])
  const [verificationData, setVerificationData] = useState<Array<{
    recipientName: string
    recipientEmail: string
    verificationId: string
    verificationUrl: string
  }>>([])
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [emailsSent, setEmailsSent] = useState(0)
  const [emailErrors, setEmailErrors] = useState<Array<{ email: string; error: string }>>([])
  const [isSendingMail, setIsSendingMail] = useState(false)
  const [emailProvider, setEmailProvider] = useState<"resend" | "gmail" | "senement">("senement")
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

  // Helper function to get template URL (S3 or base64) with CORS proxy
  const getTemplateUrl = async (): Promise<string> => {
    // If we have a cached S3 URL, use it
    if (cachedTemplateUrl) {
      console.log('[CertGen] Using cached template URL')
      return cachedTemplateUrl
    }

    // If templateImage is already a URL (http/https), proxy it to avoid CORS
    if (templateImage.startsWith('http://') || templateImage.startsWith('https://')) {
      console.log('[CertGen] Template is a URL, using proxy to avoid CORS')
      const proxiedUrl = `/api/templates/proxy?url=${encodeURIComponent(templateImage)}`
      setCachedTemplateUrl(proxiedUrl)
      return proxiedUrl
    }

    // If templateImage starts with data:, it's base64
    if (templateImage.startsWith('data:')) {
      console.log('[CertGen] Template is base64 data URI')
      return templateImage
    }

    // Otherwise, assume it's a base64 string without prefix
    console.log('[CertGen] Template is base64 string, adding data URI prefix')
    return `data:image/png;base64,${templateImage}`
  }

  // Restore generated certificates from session on mount
  useEffect(() => {
    const eventId = selectedEvent?.eventId
    const session = loadSession(eventId)
    
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
  }, [selectedEvent?.eventId])

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""))

      console.log("[CSV Upload] Headers detected:", headers)
      console.log("[CSV Upload] Email column exists:", headers.some(h => h.toLowerCase() === 'email'))

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
      const eventId = selectedEvent?.eventId
      saveSession({ 
        csvData: data, 
        csvHeaders: headers,
        fieldMapping: autoMapping
      }, eventId)
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
    
    // Use getTemplateUrl to handle both S3 and base64
    getTemplateUrl().then(url => {
      img.src = url
    }).catch(err => {
      console.error('[CertGen] Error loading template:', err)
      img.src = templateImage // Fallback to original
    })
  }, [csvData, fieldMapping, fields, templateImage, cachedTemplateUrl])

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
      toast.error("Please generate certificates first")
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
    
    // For Senement, no credentials needed (uses env vars on server)
    if (emailProvider === "senement") {
      console.log('[sendEmailsOnly] Using Senement corporate email')
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
          verificationId: recipient.verificationId,
          verificationUrl: recipient.verificationUrl,
        }))
      )
      
      // Send in batches to avoid 413 Payload Too Large errors
      const BATCH_SIZE = 10 // Adjust based on certificate size
      const batches = []
      for (let i = 0; i < recipientsWithBase64.length; i += BATCH_SIZE) {
        batches.push(recipientsWithBase64.slice(i, i + BATCH_SIZE))
      }
      
      console.log(`[sendEmailsOnly] Sending ${recipientsWithBase64.length} emails in ${batches.length} batches`)
      
      let totalSent = 0
      const allErrors: Array<{ email: string; error: string }> = []
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`[sendEmailsOnly] Processing batch ${i + 1}/${batches.length} (${batch.length} recipients)`)
        
        try {
          const response = await fetch("/api/send-certificates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              recipients: batch, 
              provider: emailProvider,
              sendingMode: sendingMode === "auto" ? undefined : sendingMode,
              // Pass credentials to server for Gmail
              credentials: credentials ? {
                email: credentials.email,
                appPassword: credentials.appPassword
              } : null
            }),
          })

          // Handle non-JSON responses (like 413 errors)
          if (!response.ok) {
            let errorMessage = `Server error: ${response.status} ${response.statusText}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              // Response is not JSON (e.g., 413 returns HTML)
              if (response.status === 413) {
                errorMessage = "Payload too large. Try reducing batch size or certificate file sizes."
              }
            }
            throw new Error(errorMessage)
          }

          const result = await response.json()
          console.log(`[Client] Batch ${i + 1} API response:`, result)

          if (result.success) {
            totalSent += result.sentCount
            if (result.errors && result.errors.length > 0) {
              allErrors.push(...result.errors)
            }
          } else {
            throw new Error(result.error || "Unknown error")
          }
        } catch (batchError) {
          console.error(`[Client] Error in batch ${i + 1}:`, batchError)
          // Mark all emails in this batch as failed
          batch.forEach(recipient => {
            allErrors.push({
              email: recipient.email,
              error: batchError instanceof Error ? batchError.message : "Failed to send"
            })
          })
        }
        
        // Update progress
        setEmailsSent(totalSent)
        setEmailErrors(allErrors)
      }
      
      // Set final status
      if (totalSent > 0) {
        setEmailStatus("success")
        console.log(`[Client] All batches complete: ${totalSent} sent, ${allErrors.length} failed`)
      } else {
        setEmailStatus("error")
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
      toast.error("Please upload a CSV file first")
      return
    }

    // Warn users when generating a very large number of certificates
    if (csvData.length >= 1000) {
      toast.info(`Generating ${csvData.length} certificates. This may take a few minutes. We will process them in safe batches.`)
    }

    setIsGenerating(true)
    setGenerationStatus("idle")
    setGeneratedCount(0)
    setCurrentPhase("rendering")
    setRenderBatchInfo(null)
    setRegisterBatchInfo(null)
    setRegisteredCount(0)
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

      // Progressive generation with batching to prevent browser freeze
      const BATCH_SIZE = 10 // Process 10 certificates at a time
      const BATCH_DELAY = 50 // 50ms delay between batches to keep UI responsive
      const totalCertificates = csvData.length

      const totalRenderBatches = Math.ceil(totalCertificates / BATCH_SIZE)
      setRenderBatchInfo({ current: 0, total: totalRenderBatches })

      console.log(`[Batch Processing] Starting generation of ${totalCertificates} certificates in batches of ${BATCH_SIZE}`)

      for (let batchStart = 0; batchStart < totalCertificates; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalCertificates)
        const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1
        const totalBatches = totalRenderBatches
        
        console.log(`[Batch ${batchNumber}/${totalBatches}] Processing certificates ${batchStart + 1} to ${batchEnd}`)

        setRenderBatchInfo({ current: batchNumber, total: totalBatches })

        // Process current batch
        for (let i = batchStart; i < batchEnd; i++) {
          const row = csvData[i]
          const canvas = await createCertificateCanvas(row, scale)
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error("Failed to create blob"))
            }, "image/png")
          })

          const filename = `${row.ID || String(i + 1).padStart(3, "0")}_${row.FirstName}_${row.LastName}.png`

          // Don't add to zip yet - we'll add them to organized folders later
          // zip.file(filename, blob)

          // Store certificate for potential email sending (check for email field - case insensitive)
          const emailField = Object.keys(row).find(key => key.toLowerCase() === 'email')
          const emailAddress = emailField ? row[emailField] : null
          
          // Debug: Log email detection for first few rows
          if (i < 2) {
            console.log(`[Email Detection] Row ${i}:`, {
              rowKeys: Object.keys(row),
              emailField,
              emailAddress,
              allRowData: row
            })
          }
          
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
          }

          // Update progress for each certificate
          setGeneratedCount(i + 1)
        }

        // Small delay between batches to keep UI responsive
        if (batchEnd < totalCertificates) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
        }
      }

      console.log(`[Batch Processing] Completed! Generated ${totalCertificates} certificates`)

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
      const eventId = selectedEvent?.eventId
      saveSession({ generatedCertificates: certificatesForStorage }, eventId)
      console.log("[Session] Saved generated certificates to localStorage")

      // Register certificates in database FIRST to get verification IDs
      let registeredVerificationData: any[] = []

      if (selectedEvent && emailRecipients.length > 0) {
        try {
          console.log("[Certificate Registration] Registering certificates in database (batched)...")
          const batchIdBase = `batch-${Date.now()}`

          // Get club name from clubs array using club ID from selectedEvent
          const selectedClub = clubs?.find(c => c.id === selectedEvent.club)
          const clubName = selectedClub?.name || 'Unknown Club'
          const organizationName = organization?.name || 'Unknown Organization'

          const certificatesToRegister = emailRecipients.map(recipient => ({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            eventName: selectedEvent.eventName,
            eventDate: new Date().toISOString().split('T')[0],
            organizationName: organizationName,
            clubName: clubName,
            templateS3Key: templateS3Key || null,
            fieldConfiguration: fields || null,
          }))

          console.log("[Certificate Registration] Templates to register:", {
            count: certificatesToRegister.length,
            templateS3Key: templateS3Key,
            hasFields: !!fields,
            fieldCount: fields?.length || 0,
          })

          // Batch registration to avoid timeouts in production
          const REGISTER_BATCH_SIZE = 200
          const allRegistered: any[] = []

          const totalToRegisterLocal = certificatesToRegister.length
          const totalRegisterBatches = Math.ceil(totalToRegisterLocal / REGISTER_BATCH_SIZE)
          setCurrentPhase("registering")
          setRegisterBatchInfo({ current: 0, total: totalRegisterBatches })
          setRegisteredCount(0)
          setTotalToRegister(totalToRegisterLocal)

          for (let start = 0; start < certificatesToRegister.length; start += REGISTER_BATCH_SIZE) {
            const end = Math.min(start + REGISTER_BATCH_SIZE, certificatesToRegister.length)
            const batch = certificatesToRegister.slice(start, end)
            const batchId = `${batchIdBase}-${Math.floor(start / REGISTER_BATCH_SIZE) + 1}`

            const currentBatchNumber = Math.floor(start / REGISTER_BATCH_SIZE) + 1
            setRegisterBatchInfo({ current: currentBatchNumber, total: totalRegisterBatches })

            console.log(`[Certificate Registration] Sending batch ${start + 1}-${end} of ${certificatesToRegister.length}`)

            const response = await fetch('/api/certificates/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                certificates: batch,
                batchId,
                generatedBy: localStorage.getItem('profileEmail') || 'anonymous',
                eventId: selectedEvent.eventId,
                fieldConfiguration: fields,
                templateS3Key: templateS3Key,
              }),
            })

            const result = await response.json()

            if (result.success && result.certificates) {
              console.log(`[Certificate Registration] Batch registered ${result.registered}/${result.total}`)
              allRegistered.push(...result.certificates)
              setRegisteredCount((prev) => {
                const next = prev + batch.length
                return next > totalToRegisterLocal ? totalToRegisterLocal : next
              })
            } else {
              console.warn("[Certificate Registration] Batch registration failed:", result.error)
            }
          }

          registeredVerificationData = allRegistered
          setVerificationData(allRegistered)

          if (registeredVerificationData.length > 0) {
            // Map verification IDs to generated certificates for email inclusion
            const updatedCertificates = emailRecipients.map(genCert => {
              const verificationInfo = registeredVerificationData.find(
                (vc: any) => vc.recipientEmail === genCert.email
              )
              return {
                ...genCert,
                verificationId: verificationInfo?.verificationId,
                verificationUrl: verificationInfo?.verificationUrl,
              }
            })
            setGeneratedCertificates(updatedCertificates)
            console.log("[Certificate Registration] Verification data ready for ZIP creation")
          } else {
            console.warn("[Certificate Registration] No verification data returned from any batch")
            setGeneratedCertificates(emailRecipients)
          }
        } catch (error) {
          console.error("[Certificate Registration] Error registering certificates:", error)
          // Still keep the generated certificates available for manual use/email
          setGeneratedCertificates(emailRecipients)
        }
      } else {
        // No selectedEvent or no email recipients - still keep the generated certificates available
        console.log("[Certificate Generation] No event selected or no email recipients - keeping certificates for manual send")
        setGeneratedCertificates(emailRecipients)
      }

      // NOW create organized folder structure with verification data
      setCurrentPhase("zipping")
      const certificatesRootFolder = zip.folder("certificates")

      if (certificatesRootFolder && registeredVerificationData.length > 0) {
        console.log("[ZIP Creation] Creating organized folder structure...")
        // Add each certificate in its own folder with verification file
        for (let i = 0; i < emailRecipients.length; i++) {
          const recipient = emailRecipients[i]
          const verificationInfo = registeredVerificationData.find(
            v => v.recipientEmail === recipient.email
          )
          
          if (recipient.certificateBlob && verificationInfo) {
            // Create folder name: email_prefix_Name (e.g., 2320030111_Venkat_manoj)
            const emailPrefix = verificationInfo.recipientEmail.split('@')[0]
            const namePart = verificationInfo.recipientName.toLowerCase().replace(/\s+/g, '_')
            const folderName = `${emailPrefix}_${namePart}`
            
            // Create individual folder for this recipient
            const recipientFolder = certificatesRootFolder.folder(folderName)
            
            if (recipientFolder) {
              // Add certificate to the folder
              const certArrayBuffer = await recipient.certificateBlob.arrayBuffer()
              const certFileName = `${folderName}.${outputFormat}`
              // ✅ For PNG: use blob directly, for PDF: convert properly
              if (outputFormat === 'png') {
                recipientFolder.file(certFileName, certArrayBuffer)
              } else {
                // PDF: ensure it's added as binary ArrayBuffer
                recipientFolder.file(certFileName, certArrayBuffer, { binary: true })
              }
              
              // Create verification.txt in the same folder
              const selectedClub = clubs?.find(c => c.id === selectedEvent?.club)
              const clubName = selectedClub?.name || 'Unknown Club'
              const organizationName = organization?.name || 'Unknown Organization'
              
              const individualVerificationContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                     CERTIFICATE VERIFICATION INFORMATION                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

CERTIFICATE FOR: ${verificationInfo.recipientName}
EMAIL: ${verificationInfo.recipientEmail}

${'-'.repeat(80)}
VERIFICATION DETAILS
${'-'.repeat(80)}

Event Name: ${selectedEvent?.eventName || 'Unknown Event'}
Organization: ${organizationName}
Club: ${clubName}
Generated: ${new Date().toLocaleString()}

${'-'.repeat(80)}
VERIFICATION ID & URL
${'-'.repeat(80)}

🔐 Verification ID:
   ${verificationInfo.verificationId}

🌐 Verification URL:
   ${verificationInfo.verificationUrl}

${'-'.repeat(80)}
HOW TO VERIFY THIS CERTIFICATE
${'-'.repeat(80)}

1. ONLINE VERIFICATION (Recommended):
   • Visit: ${verificationInfo.verificationUrl}
   • Or go to: ${window.location.origin}/verify
   • Enter the Verification ID shown above

2. SHARE WITH EMPLOYERS/INSTITUTIONS:
   • Provide the Verification URL above
   • They can verify authenticity independently
   • No account or login required

3. QR CODE VERIFICATION (if available):
   • Scan the QR code on your certificate
   • Instant verification on mobile devices

${'-'.repeat(80)}
IMPORTANT NOTES
${'-'.repeat(80)}

✓ This Verification ID is unique and permanent
✓ Cannot be tampered with or modified
✓ Protected by SHA-256 cryptographic hash
✓ Verified against secure database records
✓ Accepted as proof of authenticity worldwide

${'-'.repeat(80)}
WHAT VERIFICATION CONFIRMS
${'-'.repeat(80)}

• Certificate was issued by authorized organization
• Recipient information is accurate and unmodified
• Event details are authentic and verified
• Issue date and time are officially recorded
• Certificate has not been revoked

${'-'.repeat(80)}
SUPPORT & ASSISTANCE
${'-'.repeat(80)}

If you have any questions or need help with verification:
• Contact: ${localStorage.getItem('profileEmail') || 'certificate issuer'}
• Keep this file safe for future reference
• Do not share your Verification ID publicly (unless verifying)

${'-'.repeat(80)}

Generated by Certificate Generation System
Powered by getcertificates.senement.com

╔══════════════════════════════════════════════════════════════════════════════╗
║  This is an official verification document. Keep it safe with your certificate ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
              
              recipientFolder.file("verification.txt", individualVerificationContent)
              console.log(`[Verification] Created folder: ${folderName}`)
            }
          }
        }
        
        // Create master verification manifest
        const masterVerificationContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                   MASTER VERIFICATION INFORMATION - ALL CERTIFICATES            ║
╚══════════════════════════════════════════════════════════════════════════════╝

Generated: ${new Date().toLocaleString()}
Event: ${selectedEvent?.eventName || 'Unknown Event'}
Organization: ${localStorage.getItem('userOrganization') || 'Unknown Organization'}
Club: ${selectedEvent?.club || 'Unknown Club'}
Total Certificates: ${registeredVerificationData.length}

${'='.repeat(80)}
ALL VERIFICATION IDs
${'='.repeat(80)}

${registeredVerificationData.map((cert, idx) => {
  const emailPrefix = cert.recipientEmail.split('@')[0]
  const namePart = cert.recipientName.toLowerCase().replace(/\s+/g, '_')
  const folderName = `${emailPrefix}_${namePart}`
  return `
${idx + 1}. ${cert.recipientName}
   Email: ${cert.recipientEmail}
   Verification ID: ${cert.verificationId}
   Verification URL: ${cert.verificationUrl}
   Folder: certificates/${folderName}/
`}).join('\n' + '-'.repeat(80) + '\n')}

${'='.repeat(80)}
BULK VERIFICATION GUIDE
${'='.repeat(80)}

For HR departments or institutions verifying multiple certificates:

1. Each recipient has their own folder in 'certificates/' directory
2. Each folder contains: certificate image + verification.txt
3. Use the Verification URLs above for instant online verification
4. Import 'verification_manifest.json' for automated verification systems
5. Contact issuing organization for any discrepancies

${'='.repeat(80)}
`
        
        zip.file("MASTER_VERIFICATION_INFO.txt", masterVerificationContent)
        
        // Also add JSON manifest for programmatic access
        const verificationManifest = {
          generatedDate: new Date().toISOString(),
          eventName: selectedEvent?.eventName || 'Unknown Event',
          organizationName: localStorage.getItem('userOrganization') || 'Unknown Organization',
          clubName: selectedEvent?.club || 'Unknown Club',
          totalCertificates: registeredVerificationData.length,
          certificates: registeredVerificationData.map(cert => {
            const emailPrefix = cert.recipientEmail.split('@')[0]
            const namePart = cert.recipientName.toLowerCase().replace(/\s+/g, '_')
            const folderName = `${emailPrefix}_${namePart}`
            return {
              recipientName: cert.recipientName,
              recipientEmail: cert.recipientEmail,
              verificationId: cert.verificationId,
              verificationUrl: cert.verificationUrl,
              folderPath: `certificates/${folderName}/`,
              certificateFile: `certificates/${folderName}/${folderName}.${outputFormat}`,
              verificationFile: `certificates/${folderName}/verification.txt`
            }
          })
        }
        
        zip.file("verification_manifest.json", JSON.stringify(verificationManifest, null, 2))
        
        // Add README for users
        const readmeContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                         CERTIFICATE PACKAGE - README                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

Thank you for using our Certificate Generation System!

${'='.repeat(80)}
FOLDER STRUCTURE
${'='.repeat(80)}

certificates_${new Date().toISOString().split('T')[0]}.zip
├── certificates/
│   ├── 2320030111_venkat_manoj/
│   │   ├── 2320030111_venkat_manoj.${outputFormat}
│   │   └── verification.txt
│   │
│   ├── 2320030222_john_doe/
│   │   ├── 2320030222_john_doe.${outputFormat}
│   │   └── verification.txt
│   │
│   └── ... (one folder per recipient)
│
├── MASTER_VERIFICATION_INFO.txt     ← All verification IDs in one place
├── verification_manifest.json       ← Machine-readable format
└── README.txt                       ← This file

${'='.repeat(80)}
FOR CERTIFICATE RECIPIENTS
${'='.repeat(80)}

1. Find your folder in 'certificates/' (named with your email and name)
2. Inside your folder you'll find:
   • Your certificate image/PDF
   • verification.txt with your unique Verification ID
3. Open verification.txt to get your Verification ID and URL
4. Use the URL to verify your certificate online

${'='.repeat(80)}
FOR BULK DISTRIBUTION
${'='.repeat(80)}

• Share individual folders with each recipient (everything in one place!)
• Or share entire ZIP and let recipients find their folder
• Use MASTER_VERIFICATION_INFO.txt for all IDs at once
• Use verification_manifest.json for automated systems

${'='.repeat(80)}
VERIFICATION METHODS
${'='.repeat(80)}

1. Click the URL in your verification.txt file (easiest)
2. Visit ${window.location.origin}/verify and enter your ID
3. Scan QR code on certificate (if present)

${'='.repeat(80)}
FOLDER NAMING CONVENTION
${'='.repeat(80)}

Folders are named: {email_prefix}_{recipient_name}
Example: 2320030111_venkat_manoj

This makes it easy to:
• Identify recipients by email or name
• Share specific folders quickly
• Organize certificates systematically

${'='.repeat(80)}
SUPPORT
${'='.repeat(80)}

Questions? Contact the certificate issuing organization.
System powered by: getcertificates.senement.com

Generated: ${new Date().toLocaleString()}

╔══════════════════════════════════════════════════════════════════════════════╗
║              Each folder is a complete, self-contained package! 🎓             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
        zip.file("README.txt", readmeContent)

        console.log("[Verification] Created organized folder structure with individual folders per recipient")
      } else {
        console.warn("[ZIP Creation] No verification data available - certificates not organized into folders")

        // Fallback: still include all generated certificates in a flat structure
        if (certificatesRootFolder) {
          console.log("[ZIP Creation] Adding raw certificates without verification data...")
          for (let i = 0; i < emailRecipients.length; i++) {
            const recipient = emailRecipients[i]
            if (!recipient.certificateBlob) continue

            try {
              const certArrayBuffer = await recipient.certificateBlob.arrayBuffer()
              const baseName = `${(recipient.fileName || `certificate_${String(i + 1).padStart(4, "0")}`).replace(/\.\w+$/, "")}`
              const certFileName = `${baseName}.${outputFormat}`
              certificatesRootFolder.file(certFileName, certArrayBuffer)
            } catch (err) {
              console.error("[ZIP Creation] Error adding certificate to fallback ZIP:", {
                index: i,
                email: recipient.email,
                error: err instanceof Error ? err.message : err,
              })
            }
          }
        }
      }

      // Generate and download the ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const timestamp = new Date().toISOString().split("T")[0]
      const zipFilename = `certificates_${timestamp}.zip`
      FileSaver.saveAs(zipBlob, zipFilename)
      console.log("[ZIP Creation] ZIP file downloaded successfully")

      // Add to history with proper club name
      if (onAddToHistory && selectedEvent) {
        // Get club name from clubs array using club ID
        const selectedClub = clubs?.find(c => c.id === selectedEvent.club)
        const clubName = selectedClub?.name || 'Unknown Club'
        
        onAddToHistory(
          selectedEvent.eventName,
          clubName,
          csvData.length,
          zipBlob.size
        )
      }

      setGenerationStatus("success")
      setCurrentPhase("completed")
    } catch (error) {
      console.error("Error generating certificates:", error)
      setGenerationStatus("error")
      setCurrentPhase("error")
      toast.error("Error generating certificates. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const createCertificateCanvas = (data: Record<string, string>, scale: number): Promise<HTMLCanvasElement> => {
    return new Promise(async (resolve) => {
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
      
      // Use getTemplateUrl to handle both S3 and base64
      getTemplateUrl().then(url => {
        img.src = url
      }).catch(err => {
        console.error('[CertGen] Error loading template for canvas:', err)
        img.src = templateImage // Fallback
      })
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
                <code className="text-blue-700 block">student@university.edu.in,123,John,Doe</code>
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
                      {/*<option value="pdf">PDF</option>*/}
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
                      onChange={(e) => setEmailProvider(e.target.value as "resend" | "gmail" | "senement")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      disabled
                    >
                      <option value="senement">Senement Corporate (forge@senement.com)</option>
                    </select>
                    <div className="mt-2 space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-green-700">
                            Sends from: forge@senement.com (Senement)
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Professional corporate email • GoDaddy SMTP • Automatic configuration
                        </p>
                      </div>
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

              {verificationData.length > 0 && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-purple-900">Verification IDs Generated</p>
                      <p className="text-sm text-purple-700 mt-1">
                        {verificationData.length} certificates registered with unique verification IDs
                      </p>
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-purple-800 cursor-pointer hover:underline">
                          View Verification IDs & URLs
                        </summary>
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                          {verificationData.map((cert, idx) => (
                            <div key={idx} className="p-3 bg-white rounded border border-purple-200 text-xs">
                              <p className="font-semibold text-gray-900">{cert.recipientName}</p>
                              <p className="text-gray-600">{cert.recipientEmail}</p>
                              <div className="mt-2 space-y-1">
                                <div>
                                  <span className="font-medium text-purple-700">ID:</span>
                                  <code className="ml-2 px-2 py-1 bg-purple-100 rounded text-purple-900 select-all">
                                    {cert.verificationId}
                                  </code>
                                </div>
                                <div>
                                  <span className="font-medium text-purple-700">URL:</span>
                                  <a 
                                    href={cert.verificationUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:underline break-all"
                                  >
                                    {cert.verificationUrl}
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            const text = verificationData.map(cert => 
                              `${cert.recipientName} (${cert.recipientEmail}):\nID: ${cert.verificationId}\nURL: ${cert.verificationUrl}\n`
                            ).join('\n')
                            navigator.clipboard.writeText(text)
                            toast.success('Verification data copied to clipboard!')
                          }}
                          variant="outline"
                          className="w-full mt-3 text-xs"
                        >
                          Copy All Verification Data
                        </Button>
                      </details>
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
                  Senement Corporate
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
                <p className="text-gray-600 text-xs mb-1">Progress</p>
                <div className="space-y-1">
                  <Progress
                    value={
                      currentPhase === "rendering" || currentPhase === "idle"
                        ? (csvData.length ? (generatedCount / csvData.length) * 100 : 0)
                        : currentPhase === "registering" && totalToRegister
                        ? (registeredCount / totalToRegister) * 100
                        : currentPhase === "zipping" || currentPhase === "completed"
                        ? 100
                        : 0
                    }
                    className="h-2 w-full bg-[#21808D]/10"
                  />
                  <p className="text-xs text-[#21808D] font-medium">
                    {currentPhase === "rendering" && (
                      <>
                        Generating certificates: {generatedCount} / {csvData.length}
                        {renderBatchInfo && ` (Batch ${renderBatchInfo.current} of ${renderBatchInfo.total})`}
                      </>
                    )}
                    {currentPhase === "registering" && registerBatchInfo && (
                      <>
                        Registering in database: batch {registerBatchInfo.current} of {registerBatchInfo.total}
                      </>
                    )}
                    {currentPhase === "zipping" && "Packaging ZIP file..."}
                    {currentPhase === "completed" && "Completed"}
                    {currentPhase === "error" && "Error during generation"}
                  </p>
                </div>
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
        {(generatedCertificates.length > 0 || csvData.length > 0) && (
          <Button
            onClick={() => {
              if (confirm('Clear all session data for this event? This will remove uploaded CSV, generated certificates, and field mappings.')) {
                const eventId = selectedEvent?.eventId
                clearSession(eventId)
                setCsvData([])
                setCsvHeaders([])
                setFieldMapping({})
                setGeneratedCertificates([])
                setGenerationStatus('idle')
                setGeneratedCount(0)
                setVerificationData([])
                toast.success('Session cleared successfully!')
              }
            }}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            Clear Session
          </Button>
        )}
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
          title={generatedCertificates.length === 0 ? "No certificates with email addresses found. Make sure your CSV has an 'Email' column." : ""}
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
              Send Emails {generatedCertificates.length > 0 ? `(${generatedCertificates.length})` : ""}
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
