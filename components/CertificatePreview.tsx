"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Award } from "lucide-react"
import { renderWatermark } from "@/lib/watermark-utils"
import { useWatermarkConfig } from "@/hooks/useWatermarkConfig"

interface FieldConfig {
    id: string
    name: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    color: string
    alignment?: CanvasTextAlign
    align?: CanvasTextAlign
    fontWeight?: number
    maxWidth?: number
}

interface CertificateData {
    recipientName: string
    recipientEmail: string
    eventName: string
    eventDate: string
    organizationName: string
    clubName: string
    issueDate: string
    templateS3Key?: string
    fieldConfiguration?: FieldConfig[]
    eventId?: string
}

interface CertificatePreviewProps {
    certificate: CertificateData
}

export function CertificatePreview({ certificate }: CertificatePreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { watermarkReady, watermarkVersion } = useWatermarkConfig()
    const [loading, setLoading] = useState(true)
    const [templateUrl, setTemplateUrl] = useState<string | null>(null)
    const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>([])
    const [generated, setGenerated] = useState(false)

    useEffect(() => {
        let isMounted = true

        const loadTemplate = async () => {
            try {
                setLoading(true)
                setGenerated(false)
                setTemplateUrl(null)
                setFieldConfig([])

                let templateKey = certificate.templateS3Key
                let effectiveFieldConfig = certificate.fieldConfiguration

                // If template missing, try fetching from event
                if (!templateKey && certificate.eventId) {
                    try {
                        const eventResponse = await fetch(`/api/events/${certificate.eventId}`)
                        const eventData = await eventResponse.json()
                        if (eventData.success && eventData.event) {
                            if (eventData.event.templateS3Key) {
                                templateKey = eventData.event.templateS3Key
                            }
                            if (!effectiveFieldConfig && eventData.event.fieldConfiguration) {
                                effectiveFieldConfig = eventData.event.fieldConfiguration
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching event template:", err)
                    }
                }

                if (templateKey) {
                    const templateResponse = await fetch(
                        `/api/templates/signed-url?key=${encodeURIComponent(templateKey)}`
                    )
                    const templateData = await templateResponse.json()

                    if (isMounted && templateData.success && templateData.signedUrl) {
                        setTemplateUrl(templateData.signedUrl)
                        setFieldConfig(effectiveFieldConfig || [])
                    }
                } else {
                    setLoading(false)
                }
            } catch (err) {
                console.error("Error loading template:", err)
                if (isMounted) setLoading(false)
            }
        }

        loadTemplate()

        return () => {
            isMounted = false
        }
    }, [certificate])

    useEffect(() => {
        if (!templateUrl || !canvasRef.current || !watermarkReady) return

        const render = async () => {
            const canvas = canvasRef.current!
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            try {
                const img = new window.Image()
                const proxyUrl = `/api/templates/proxy?url=${encodeURIComponent(templateUrl)}`

                img.onload = () => {
                    canvas.width = img.width
                    canvas.height = img.height
                    ctx.drawImage(img, 0, 0)

                    const recipientData: Record<string, string> = {
                        recipientName: certificate.recipientName,
                        recipientEmail: certificate.recipientEmail,
                        eventName: certificate.eventName,
                        eventDate: certificate.eventDate,
                        organizationName: certificate.organizationName,
                        clubName: certificate.clubName,
                        issueDate: new Date(certificate.issueDate).toLocaleDateString(),
                        name: certificate.recipientName,
                        Name: certificate.recipientName,
                        email: certificate.recipientEmail,
                        Email: certificate.recipientEmail,
                        event: certificate.eventName,
                        Event: certificate.eventName,
                        date: new Date(certificate.issueDate).toLocaleDateString(),
                        Date: new Date(certificate.issueDate).toLocaleDateString(),
                        organization: certificate.organizationName,
                        Organization: certificate.organizationName,
                        club: certificate.clubName,
                        Club: certificate.clubName,
                    }

                    if (fieldConfig && fieldConfig.length > 0) {
                        fieldConfig.forEach((field) => {
                            let value = recipientData[field.name]
                            if (!value) {
                                const matchingKey = Object.keys(recipientData).find(
                                    key => key.toLowerCase() === field.name.toLowerCase()
                                )
                                value = matchingKey ? recipientData[matchingKey] : field.name
                            }

                            const rawFontWeight = field.fontWeight === 400 ? undefined : field.fontWeight
                            const fontString = rawFontWeight
                                ? `${rawFontWeight} ${field.fontSize}px "${field.fontFamily}"`
                                : `${field.fontSize}px "${field.fontFamily}"`

                            ctx.font = fontString
                            ctx.fillStyle = field.color

                            const alignment = (field.alignment || field.align || 'left') as CanvasTextAlign
                            ctx.textAlign = alignment

                            const x = alignment === 'center'
                                ? field.x
                                : alignment === 'right'
                                    ? field.x + (field.maxWidth || 0)
                                    : field.x

                            if (field.maxWidth) {
                                ctx.fillText(value, x, field.y, field.maxWidth)
                            } else {
                                ctx.fillText(value, x, field.y)
                            }
                        })
                    }

                    // Add watermark to certificate preview
                    renderWatermark(ctx, canvas.width, canvas.height, 1)

                    setGenerated(true)
                    setLoading(false)
                }

                img.onerror = () => {
                    setLoading(false)
                }

                img.src = proxyUrl
            } catch (err) {
                console.error("Error rendering canvas:", err)
                setLoading(false)
            }
        }

        render()
    }, [templateUrl, fieldConfig, certificate, watermarkReady, watermarkVersion])

    if (!templateUrl && !loading) {
        return (
            <div className="bg-slate-50 p-4 rounded-lg border flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
                <Award className="h-12 w-12 text-primary" />
                <h3 className="font-serif text-xl font-bold text-slate-800 tracking-wide mt-2">
                    {certificate.eventName}
                </h3>
                <p className="text-sm text-slate-500">Presented to</p>
                <p className="text-lg font-medium">{certificate.recipientName}</p>
                <div className="w-1/2 h-px bg-slate-200 my-2" />
                <p className="text-xs text-muted-foreground">
                    Issued by {certificate.organizationName} on {new Date(certificate.issueDate).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-amber-600 mt-2">(Preview not available - no template found)</p>
            </div>
        )
    }

    return (
        <div className="relative w-full aspect-[1.414] bg-slate-100 rounded-lg overflow-hidden border">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
            />
        </div>
    )
}
