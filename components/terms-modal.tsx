"use client"

import { useState, useEffect, useRef } from "react"
import { Inter } from "next/font/google"
import Link from "next/link"
import { 
  ExternalLink, 
  ScrollText,
  Check,
  ArrowDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAgree?: () => void
  showAgreeButton?: boolean
  requireScrollToBottom?: boolean
}

interface ModalClause {
  number: string
  title: string
  summary: string
}

const clauses: ModalClause[] = [
  {
    number: "1",
    title: "Acceptance, Scope and Definitions",
    summary: "By registering, uploading data, issuing a certificate or using Certiflo, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Platform."
  },
  {
    number: "2",
    title: "Eligibility and Authority",
    summary: "Account creators must be legally capable and authorized to bind their Organization, and at least 18 years old. Genuine registration details are strictly required."
  },
  {
    number: "3",
    title: "Service and Limited License",
    summary: "Senement grants a limited, revocable, non-transferable license to use Certiflo for lawful certificate issuance. Certiflo is not a permanent public archive or guaranteed backup service."
  },
  {
    number: "4",
    title: "Organization Responsibilities",
    summary: "Organizations must ensure participant data, event details, and achievements are accurate and genuine. You must obtain all required consents and legal bases before uploading data."
  },
  {
    number: "5",
    title: "Prohibited Use & Integrity Policy",
    summary: "Issuing fraudulent or fabricated certificates, uploading passwords or bank details, using purchased email lists, scraping, or sending spam is strictly prohibited and results in immediate termination."
  },
  {
    number: "6",
    title: "Account Security & Administrator Access",
    summary: "Keep passwords confidential and report compromises immediately. Authorized Senement personnel access accounts solely for technical support, fraud investigation, or legal compliance under strict logging."
  },
  {
    number: "7",
    title: "Data Ownership and Intellectual Property",
    summary: "The Organization retains complete ownership of its participant data and logos. Certiflo platform code, verification engine, and templates remain owned by Senement."
  },
  {
    number: "8",
    title: "Emails, Verification and Third-Party Services",
    summary: "The Organization authorizes service emails and public verification links. Certiflo infers approximate location from IP addresses solely for security and diagnostics."
  },
  {
    number: "9",
    title: "Fees, Free Access and Taxes",
    summary: "Free plans may be offered or modified at discretion. Paid plan fees are non-refundable unless required by law. Taxes and pricing are shown at purchase."
  },
  {
    number: "10",
    title: "Data Security, Availability and Backups",
    summary: "We use encryption and access controls. No internet platform can guarantee zero risk or 100% uptime; organizations must maintain independent backups."
  },
  {
    number: "11",
    title: "Monitoring, Suspension and Revocation",
    summary: "We investigate reports of fake credentials and may suspend accounts or revoke certificates that breach these Terms."
  },
  {
    number: "12",
    title: "Disclaimers and Limitation of Liability",
    summary: "Certificates are provided 'as available' with no guarantee of third-party recognition. Liability is capped at fees paid in the preceding month or INR 2,000, whichever is greater."
  },
  {
    number: "13",
    title: "Indemnity",
    summary: "Organizations agree to indemnify Senement from third-party claims arising from uploaded content, participant data, or unlawful credential issuance."
  },
  {
    number: "14",
    title: "Confidentiality",
    summary: "Both parties agree to protect non-public confidential information for three years following account termination."
  },
  {
    number: "15",
    title: "Term, Termination and Changes",
    summary: "Terms remain in effect during platform use. Accounts can be closed anytime. Material revisions will typically be announced 14–30 days in advance."
  },
  {
    number: "16",
    title: "Governing Law and Jurisdiction",
    summary: "Governed exclusively by Indian law, including the IT Act 2000 and DPDP Act 2023. Courts at Hyderabad, Telangana, India have exclusive jurisdiction."
  },
  {
    number: "17",
    title: "Contact",
    summary: "For support, privacy, or abuse reports: support@gocertiflo.com. Operated by Senement, Hyderabad, Telangana, India."
  }
]

export function TermsModal({
  isOpen,
  onClose,
  onAgree,
  showAgreeButton = true,
  requireScrollToBottom = true,
}: TermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!requireScrollToBottom)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(!requireScrollToBottom)
    }
  }, [isOpen, requireScrollToBottom])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!requireScrollToBottom) return
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    // Tolerance of 35px from the bottom
    if (scrollTop + clientHeight >= scrollHeight - 35) {
      setHasScrolledToBottom(true)
    }
  }

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }

  const handleAgree = () => {
    if (requireScrollToBottom && !hasScrolledToBottom) return
    if (onAgree) {
      onAgree()
    }
    onClose()
  }

  const isAgreeDisabled = Boolean(requireScrollToBottom && !hasScrolledToBottom)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent 
        className={`max-w-2xl h-[85vh] max-h-[85vh] p-0 flex flex-col gap-0 rounded-lg border border-gray-300 bg-white text-black overflow-hidden ${inter.className}`}
        showCloseButton={true}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0 text-left">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-black flex-shrink-0" />
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-black leading-tight">
                Terms of Service & Acceptable Use Policy
              </DialogTitle>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                Certiflo • Operated by Senement • Hyderabad, India
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Document Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 text-sm sm:text-base text-gray-800 space-y-5 leading-relaxed"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Highlighted Notice Banner */}
          {requireScrollToBottom && !hasScrolledToBottom ? (
            <div className="p-3.5 rounded-lg border-2 border-black bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-black">
                  Please scroll to the bottom of this document to enable the &quot;I Agree&quot; button.
                </span>
              </div>
              <button
                type="button"
                onClick={scrollToBottom}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-black text-white text-xs font-semibold hover:bg-gray-800 transition cursor-pointer self-start sm:self-auto flex-shrink-0"
              >
                <span>Jump to bottom</span>
                <ArrowDown className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-black bg-gray-50 flex items-center justify-between text-xs sm:text-sm text-black">
              <span className="font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-black flex-shrink-0" />
                <span>You have reviewed all clauses. You may now click &quot;I Agree &amp; Accept&quot;.</span>
              </span>
              <Link 
                href="/terms" 
                target="_blank"
                className="font-medium underline hover:text-gray-700 flex items-center gap-1 flex-shrink-0 ml-2"
              >
                <span>Full Page</span>
                <ExternalLink className="w-3 h-3 text-black" />
              </Link>
            </div>
          )}

          {/* Clean Clauses List */}
          <div className="space-y-4 pt-1">
            {clauses.map((clause) => (
              <div 
                key={clause.number}
                className="pb-3 border-b border-gray-100 last:border-b-0"
              >
                <h4 className="font-bold text-black text-sm sm:text-base mb-1">
                  {clause.number}. {clause.title}
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {clause.summary}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 pb-2 text-xs text-gray-600 border-t border-gray-200 leading-normal">
            By accepting, you confirm you are at least 18 years old, authorized to bind your organization, and consent to our{" "}
            <Link href="/privacy-policy" target="_blank" className="text-black font-medium underline">
              Privacy Policy
            </Link>{" "}
            under Indian Law and the Digital Personal Data Protection Act, 2023.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2 order-2 sm:order-1 text-xs">
            {requireScrollToBottom && !hasScrolledToBottom ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-black bg-black text-white font-semibold text-xs">
                <ArrowDown className="w-3.5 h-3.5 text-white animate-bounce" />
                <span>Scroll down to unlock &quot;I Agree&quot;</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-black bg-white text-black font-semibold text-xs">
                <Check className="w-3.5 h-3.5 text-black" />
                <span>End reached — Ready to agree</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-xs h-9 px-4 rounded border-gray-300 text-black hover:bg-gray-100"
            >
              Cancel
            </Button>

            {showAgreeButton && (
              <Button
                type="button"
                size="sm"
                onClick={handleAgree}
                disabled={isAgreeDisabled}
                className={`flex-1 sm:flex-initial text-xs h-9 px-5 rounded font-medium transition inline-flex items-center gap-1.5 ${
                  isAgreeDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
                    : "bg-black hover:bg-gray-800 text-white cursor-pointer"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isAgreeDisabled ? "Scroll down to agree" : "I Agree & Accept"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
