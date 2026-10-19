"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Send, 
  Loader2, 
  Minus, 
  Maximize2, 
  Minimize2, 
  X, 
  Trash2, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Link2, 
  Eraser, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sparkles,
  ChevronDown,
  Pencil
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { format } from "date-fns"
import { EMAIL_PROVIDERS } from "@/lib/email-providers"

export interface ContactFormRecord {
  _id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  emailSent?: boolean
  notes?: string
  createdAt: string
  updatedAt?: string
}

interface ContactComposeBoxProps {
  form: ContactFormRecord | null
  isOpen: boolean
  onClose: () => void
  onOpenNew?: () => void
  onSuccess?: () => void
}

type WindowMode = 'docked' | 'minimized' | 'maximized'

export default function ContactComposeBox({
  form,
  isOpen,
  onClose,
  onOpenNew,
  onSuccess
}: ContactComposeBoxProps) {
  const [windowMode, setWindowMode] = useState<WindowMode>('docked')
  const [providerId, setProviderId] = useState<string>(
    EMAIL_PROVIDERS[1]?.id || EMAIL_PROVIDERS[0]?.id || "gocertiflo-support"
  )
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [subject, setSubject] = useState("")
  const [sending, setSending] = useState(false)
  const [showFormatting, setShowFormatting] = useState(true)

  const editorRef = useRef<HTMLDivElement>(null)

  // Initialize or reset when a form or fresh compose is opened
  useEffect(() => {
    if (isOpen) {
      setWindowMode('docked')
      setCc("")
      setBcc("")
      setShowCc(false)
      setShowBcc(false)

      if (form) {
        setTo(form.email || "")
        setSubject(`Re: Your Contact Form Submission`)

        // Populate rich editor with greeting and quoted history
        const formattedDate = form.createdAt 
          ? format(new Date(form.createdAt), 'PPP p')
          : "earlier"

        const initialHtml = `
          <p>Hi ${form.name || "there"},</p>
          <p><br></p>
          <p><br></p>
          <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-family: sans-serif;">
            <p style="margin: 0 0 8px 0; color: #475569;"><strong>On ${formattedDate}, ${form.name || "User"} &lt;${form.email}&gt; wrote:</strong></p>
            <blockquote style="margin: 0; padding-left: 12px; border-left: 3px solid #cbd5e1; color: #64748b; font-style: normal;">
              ${(form.message || "").replace(/\n/g, '<br/>')}
            </blockquote>
          </div>
        `
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml
            const pElements = editorRef.current.querySelectorAll('p')
            if (pElements.length > 1) {
              const range = document.createRange()
              const sel = window.getSelection()
              range.setStart(pElements[1], 0)
              range.collapse(true)
              sel?.removeAllRanges()
              sel?.addRange(range)
            }
          }
        }, 50)
      } else {
        // Fresh new email
        setTo("")
        setSubject("")
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = `<p>Hi there,</p><p><br></p>`
          }
        }, 50)
      }
    }
  }, [form, isOpen])

  const selectedProvider = EMAIL_PROVIDERS.find(p => p.id === providerId) || EMAIL_PROVIDERS[0]

  // Rich Text Editor Commands
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
  }

  const handleInsertLink = () => {
    const url = prompt("Enter the URL:", "https://")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  // Quick reply templates
  const applyTemplate = (templateType: 'ack' | 'resolved' | 'need_info' | 'verification') => {
    if (!editorRef.current) return
    editorRef.current.focus()

    let templateText = ""
    switch (templateType) {
      case 'ack':
        templateText = `<p>Thank you for reaching out to us. We have received your query and our team is looking into this. We will get back to you with an update shortly.</p>`
        break
      case 'resolved':
        templateText = `<p>We have reviewed and resolved your request regarding your certificate. You can now access your updated certificate directly from your dashboard.</p><p>Please let us know if everything looks good or if you have any further questions!</p>`
        break
      case 'need_info':
        templateText = `<p>Thank you for reaching out. In order to help you promptly, could you please provide additional details (such as your registered certificate ID, event date, or college/organization name)?</p>`
        break
      case 'verification':
        templateText = `<p>Regarding your certificate verification query, our cryptographic verification system has confirmed the authenticity of your record. You can check the live verification status at <a href="https://certiflo.com/verify">certiflo.com/verify</a>.</p>`
        break
    }

    document.execCommand('insertHTML', false, templateText)
  }

  // Handle Send Email
  const handleSend = async () => {
    if (!to.trim()) {
      toast.error("Recipient email is required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to.trim())) {
      toast.error("Please provide a valid recipient email address")
      return
    }

    if (!subject.trim()) {
      toast.error("Subject is required")
      return
    }

    const htmlContent = editorRef.current?.innerHTML || ""
    const textContent = editorRef.current?.innerText || ""

    if (!textContent.trim()) {
      toast.error("Email body cannot be empty")
      return
    }

    setSending(true)

    try {
      // 1. Send email via /api/email/send
      const emailRes = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          to: to.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim(),
          body: textContent,
          html: htmlContent,
        }),
      })

      const emailData = await emailRes.json()

      if (!emailRes.ok) {
        throw new Error(emailData.error || emailData.details || "Failed to send email")
      }

      // 2. If replying to a contact form record, automatically update status to 'replied'
      if (form) {
        const replyTimestamp = format(new Date(), 'yyyy-MM-dd HH:mm')
        const replyNote = `[Replied on ${replyTimestamp} via ${selectedProvider.displayName}]: ${subject}`
        const updatedNotes = form.notes ? `${form.notes}\n\n${replyNote}` : replyNote

        await fetch(`/api/contact/${form._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'replied',
            notes: updatedNotes
          }),
        })
      }

      toast.success(`Email sent to ${to}!`, {
        description: `Sent via ${selectedProvider.displayName}`,
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      console.error("Reply error:", err)
      toast.error("Failed to send email", {
        description: err.message || "Please check your email credentials in .env.local",
      })
    } finally {
      setSending(false)
    }
  }

  // Keyboard shortcut Ctrl+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  // 1. IDLE STATE: Sleek docked bar with pencil icon when not actively open
  if (!isOpen) {
    return (
      <div 
        onClick={() => {
          setWindowMode('docked')
          if (onOpenNew) {
            onOpenNew()
          }
        }}
        className="fixed bottom-0 right-6 z-40 flex items-center gap-2.5 px-4 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-t-xl shadow-xl border-t border-x border-slate-700/80 cursor-pointer select-none transition-all group hover:-translate-y-0.5"
        title="Open email composer"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded bg-[#00D492]/20 text-[#00D492] group-hover:bg-[#00D492] group-hover:text-slate-900 transition-colors">
          <Pencil className="w-3 h-3" />
        </div>
        <span className="text-xs font-semibold tracking-wide">Compose Mail</span>
      </div>
    )
  }

  // 2. MINIMIZED STATE: Sleek bottom bar showing active draft / reply recipient
  if (windowMode === 'minimized') {
    return (
      <div className="fixed bottom-0 right-6 z-50 flex items-center justify-between w-80 h-10 px-4 bg-slate-900 text-white rounded-t-xl shadow-2xl border-t border-x border-slate-700 cursor-pointer select-none transition-all hover:bg-slate-800">
        <div 
          className="flex items-center gap-2 flex-1 truncate"
          onClick={() => setWindowMode('docked')}
        >
          <div className="flex items-center justify-center w-5 h-5 rounded bg-[#00D492]/20 text-[#00D492]">
            <Pencil className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold truncate">
            {form ? `Reply: ${form.name}` : (subject || "New Message")}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button 
            type="button"
            title="Expand"
            onClick={() => setWindowMode('docked')} 
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            title="Close"
            onClick={onClose} 
            className="p-1 hover:bg-red-500 rounded text-slate-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // 3. MAXIMIZED VS DOCKED SIZING & POSITION
  const isMaximized = windowMode === 'maximized'

  return (
    <>
      {/* Backdrop for maximized view */}
      {isMaximized && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setWindowMode('docked')}
        />
      )}

      <div 
        className={`fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl transition-all duration-200 ${
          isMaximized 
            ? "inset-4 sm:inset-10 rounded-2xl" 
            : "bottom-0 right-6 w-[580px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] rounded-t-xl"
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Gmail-style Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 dark:bg-slate-950 text-white rounded-t-xl select-none">
          <div className="flex items-center gap-2 text-sm font-medium truncate">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-[#00D492]/20 text-[#00D492]">
              <Pencil className="w-3 h-3" />
            </div>
            <span className="truncate">{form ? `Reply to ${form.name}` : "New Message"}</span>
            {form && (
              <span className="text-xs text-slate-400 font-normal truncate">({form.email})</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Minimize"
              onClick={() => setWindowMode('minimized')}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              title={isMaximized ? "Restore" : "Maximize"}
              onClick={() => setWindowMode(isMaximized ? 'docked' : 'maximized')}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              title="Close & Discard"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sender & Recipient Metadata Fields */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 space-y-1.5 text-sm bg-slate-50/70 dark:bg-slate-900/60">
          {/* From Field */}
          <div className="flex items-center gap-3">
            <span className="w-14 text-xs font-semibold text-slate-500 uppercase tracking-wide">From</span>
            <div className="flex-1">
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="h-7 text-xs border-transparent bg-transparent shadow-none hover:bg-white dark:hover:bg-slate-800 focus:ring-1 focus:ring-[#00D492]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {EMAIL_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id} className="text-xs">
                      <span className="font-semibold">{provider.displayName}</span>{" "}
                      <span className="text-slate-500">({provider.email})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* To Field */}
          <div className="flex items-center gap-3">
            <span className="w-14 text-xs font-semibold text-slate-500 uppercase tracking-wide">To</span>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-7 text-xs border-transparent shadow-none hover:bg-white dark:hover:bg-slate-800 focus-visible:ring-1 focus-visible:ring-[#00D492]"
              placeholder="recipient@example.com"
            />
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Optional Cc Field */}
          {showCc && (
            <div className="flex items-center gap-3 animate-in fade-in duration-150">
              <span className="w-14 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cc</span>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="h-7 text-xs border-transparent shadow-none hover:bg-white dark:hover:bg-slate-800 focus-visible:ring-1 focus-visible:ring-[#00D492]"
                placeholder="cc@example.com"
              />
              <button
                type="button"
                onClick={() => { setShowCc(false); setCc(""); }}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Optional Bcc Field */}
          {showBcc && (
            <div className="flex items-center gap-3 animate-in fade-in duration-150">
              <span className="w-14 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bcc</span>
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="h-7 text-xs border-transparent shadow-none hover:bg-white dark:hover:bg-slate-800 focus-visible:ring-1 focus-visible:ring-[#00D492]"
                placeholder="bcc@example.com"
              />
              <button
                type="button"
                onClick={() => { setShowBcc(false); setBcc(""); }}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Subject Field */}
          <div className="flex items-center gap-3">
            <span className="w-14 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-7 text-xs border-transparent shadow-none hover:bg-white dark:hover:bg-slate-800 focus-visible:ring-1 focus-visible:ring-[#00D492] font-medium"
              placeholder="Subject"
            />
          </div>
        </div>

        {/* Gmail Formatting Toolbar */}
        {showFormatting && (
          <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs">
            {/* Font Style */}
            <button
              type="button"
              title="Bold (Ctrl+B)"
              onClick={() => executeCommand('bold')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic (Ctrl+I)"
              onClick={() => executeCommand('italic')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Underline (Ctrl+U)"
              onClick={() => executeCommand('underline')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Strikethrough"
              onClick={() => executeCommand('strikeThrough')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Alignments */}
            <button
              type="button"
              title="Align Left"
              onClick={() => executeCommand('justifyLeft')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Align Center"
              onClick={() => executeCommand('justifyCenter')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Align Right"
              onClick={() => executeCommand('justifyRight')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Lists */}
            <button
              type="button"
              title="Bulleted List"
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Numbered List"
              onClick={() => executeCommand('insertOrderedList')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Quote"
              onClick={() => executeCommand('formatBlock', 'blockquote')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Link & Clear */}
            <button
              type="button"
              title="Insert Link"
              onClick={handleInsertLink}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Clear Formatting"
              onClick={() => executeCommand('removeFormat')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            {/* Templates Dropdown */}
            <div className="ml-auto flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 text-[#21808D] dark:text-[#00D492] hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Templates</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel>Quick Response Templates</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => applyTemplate('ack')}>
                    1. Acknowledge & Under Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyTemplate('resolved')}>
                    2. Resolution Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyTemplate('need_info')}>
                    3. Request More Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyTemplate('verification')}>
                    4. Verification Assistance
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Rich Text Editor Writing Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-slate-900 cursor-text">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-full outline-hidden text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans space-y-2 focus:outline-hidden"
            style={{ minHeight: "100%" }}
          />
        </div>

        {/* Action Bar at Bottom */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            {/* Primary Send Button */}
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-[#00D492] hover:bg-[#00D492]/90 text-white font-medium px-4 h-9 shadow-sm gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>

            {/* Toggle Formatting Toolbar */}
            <Button
              type="button"
              variant={showFormatting ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowFormatting(!showFormatting)}
              title="Formatting options"
              className="h-9 w-9 p-0 font-bold text-sm"
            >
              <u>A</u>
            </Button>

            <span className="text-[11px] text-slate-400 hidden sm:inline ml-2">
              Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px]">Ctrl+Enter</kbd> to send
            </span>
          </div>

          {/* Discard Draft / Trash */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={sending}
              title="Discard draft"
              className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
