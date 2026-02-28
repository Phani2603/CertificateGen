"use client"

/**
 * Email Composition Form
 * 
 * Clean, minimal email interface following SOLID principles.
 * Simple form-based UI with provider selection and validation.
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Send, Loader2 } from "lucide-react"
import { EMAIL_PROVIDERS, type EmailProvider } from "@/lib/email-providers"

interface EmailFormData {
  from: string
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
  providerId: string
}

export default function EmailForm() {
  const [sending, setSending] = useState(false)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null)
  const [formData, setFormData] = useState<EmailFormData>({
    from: "",
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    providerId: EMAIL_PROVIDERS[0]?.id || "",
  })

  // Initialize selected provider
  useEffect(() => {
    const provider = EMAIL_PROVIDERS.find(p => p.id === formData.providerId)
    if (provider) {
      setSelectedProvider(provider)
      setFormData(prev => ({ ...prev, from: provider.email }))
    }
  }, [formData.providerId])

  // Form validation
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!formData.to.trim()) {
      return { valid: false, error: "Recipient email is required" }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = formData.to.split(',').map(e => e.trim())
    const invalidEmail = emails.find(email => !emailRegex.test(email))
    
    if (invalidEmail) {
      return { valid: false, error: `Invalid email: ${invalidEmail}` }
    }

    if (!formData.subject.trim()) {
      return { valid: false, error: "Subject is required" }
    }

    if (!formData.body.trim()) {
      return { valid: false, error: "Email body cannot be empty" }
    }

    return { valid: true }
  }

  // Handle form submission
  const handleSend = async () => {
    const validation = validateForm()
    
    if (!validation.valid) {
      toast.error(validation.error || "Please fill all required fields")
      return
    }

    // Skip client-side credential validation since credentials are server-side only
    // The API endpoint will validate and return proper errors if credentials are missing

    setSending(true)

    try {
      // Call the email send API endpoint
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: formData.providerId,
          to: formData.to,
          cc: formData.cc,
          bcc: formData.bcc,
          subject: formData.subject,
          body: formData.body,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send email')
      }

      toast.success("Email sent successfully!", {
        description: `Sent via ${data.provider}`,
      })

      // Reset form
      setFormData({
        from: selectedProvider?.email || "",
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
        providerId: formData.providerId,
      })
      setShowCcBcc(false)
    } catch (error) {
      console.error("Email send error:", error)
      toast.error("Failed to send email", {
        description: error instanceof Error ? error.message : 'Please check your configuration',
      })
    } finally {
      setSending(false)
    }
  }

  // Handle input changes
  const handleChange = (field: keyof EmailFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Send Email</CardTitle>
        <CardDescription>
          Compose and send emails using configured providers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Email Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Email Provider</Label>
            <Select
              value={formData.providerId}
              onValueChange={(value) => handleChange("providerId", value)}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{provider.displayName}</span>
                      <span className="text-xs text-muted-foreground">{provider.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProvider?.description && (
              <p className="text-xs text-muted-foreground">
                {selectedProvider.description}
              </p>
            )}
          </div>

          <Separator />

          {/* From Field */}
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              value={formData.from}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="to">
              To <span className="text-destructive">*</span>
            </Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={(e) => handleChange("to", e.target.value)}
            />
          </div>

          {/* CC/BCC Toggle */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-xs"
            >
              {showCcBcc ? "Hide" : "Show"} Cc/Bcc
            </Button>
          </div>

          {/* CC/BCC Fields */}
          {showCcBcc && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cc">Cc</Label>
                <Input
                  id="cc"
                  type="email"
                  placeholder="cc@example.com"
                  value={formData.cc}
                  onChange={(e) => handleChange("cc", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bcc">Bcc</Label>
                <Input
                  id="bcc"
                  type="email"
                  placeholder="bcc@example.com"
                  value={formData.bcc}
                  onChange={(e) => handleChange("bcc", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label htmlFor="body">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="body"
              placeholder="Compose your email..."
              value={formData.body}
              onChange={(e) => handleChange("body", e.target.value)}
              className="min-h-[200px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {formData.body.length} characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  to: "",
                  cc: "",
                  bcc: "",
                  subject: "",
                  body: "",
                }))
                toast.info("Form cleared")
              }}
              disabled={sending}
            >
              Clear
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={sending}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>

          {/* Info Footer */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Emails are sent using SMTP via the configured provider. Check server logs for detailed status.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
