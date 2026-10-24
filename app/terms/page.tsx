"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Inter } from "next/font/google"
import { 
  ArrowLeft, 
  ArrowUp,
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  ExternalLink 
} from "lucide-react"
import { MinimalFooter } from "@/components/minimal-footer"
import ScrollToTop from "@/components/scroll-to-top"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

interface SectionItem {
  id: string
  number: string
  title: string
  summary: string
  details?: string[]
  note?: string
}

const termsSections: SectionItem[] = [
  {
    id: "acceptance-scope-definitions",
    number: "1",
    title: "Acceptance, Scope and Definitions",
    summary:
      "These Terms govern the use of Certiflo, Senement’s certificate management platform for organizations that create, issue, deliver and verify digital certificates (the “Platform”). They apply to organizations, account holders, administrators and other authorized users. By registering, uploading data, issuing a certificate or using the Platform, you agree to these Terms and the Privacy Policy. If you do not agree, do not use the Platform.",
    details: [
      "“Organization” means the institution, company, club, event organizer, non-profit or other authorized issuer using Certiflo.",
      "“Participant” means a person whose information is submitted for a certificate.",
      "“User Content” includes organization information, logos, event details, participant data and certificate content.",
      "“Personal Data” has the meaning given under applicable data-protection law."
    ]
  },
  {
    id: "eligibility-and-authority",
    number: "2",
    title: "Eligibility and Authority",
    summary:
      "The person creating an account for an Organization must be legally capable and authorized to bind that Organization. Users must be at least 18 years old, unless using the Platform under lawful supervision. Organizations must provide genuine, accurate and current registration and contact details and update material changes promptly."
  },
  {
    id: "service-and-limited-license",
    number: "3",
    title: "Service and Limited License",
    summary:
      "Certiflo may provide organization/event profiles, participant-data upload and processing, certificate templates, bulk certificate generation, email delivery, verification links and related support or security functions. Features may change as the Platform develops. We grant the Organization a limited, non-exclusive, non-transferable and revocable right to use the Platform for lawful certificate issuance during its account term. The Platform is not a permanent archive or a guaranteed backup service."
  },
  {
    id: "organization-responsibilities",
    number: "4",
    title: "Organization Responsibilities",
    summary:
      "The Organization is responsible for ensuring participant data, event details, scores, dates and achievements are accurate, lawful and not misleading; issuing certificates only for genuine attendance, completion, participation or achievement; determining who qualifies for a certificate and ensuring the certificate reflects the actual achievement.",
    details: [
      "Obtaining and documenting all required consents, permissions and lawful bases before collecting or uploading Personal Data, including appropriate parental/guardian authorization where required for children.",
      "Providing participants with appropriate information about certificate issuance, emails, verification and data processing.",
      "Responding to participant requests for access, correction or deletion as required by law, and keeping appropriate records.",
      "Maintaining its own copies of participant lists, issued certificates and relevant records.",
      "Ensuring uploaded logos, images, text and other materials are owned by it or properly licensed.",
      "Complying with applicable laws, institutional rules and anti-spam requirements."
    ]
  },
  {
    id: "prohibited-use",
    number: "5",
    title: "Prohibited Use",
    summary:
      "You must strictly adhere to platform integrity standards. You must not issue fraudulent, fabricated or misleading certificates or misrepresent their recognition, status or equivalence to degrees, licenses or professional qualifications.",
    details: [
      "Do not upload unnecessary or sensitive information such as passwords, financial details, health information or biometric data.",
      "Do not use stolen, scraped, purchased or otherwise unauthorized participant email lists, or send spam or unsolicited bulk marketing.",
      "Do not impersonate a person or organization, infringe privacy or intellectual-property rights, or upload unlawful content.",
      "Do not hack, probe, disrupt, overload or gain unauthorized access to the Platform, other accounts, databases, servers, email systems or integrations.",
      "Do not upload malware, ransomware, phishing links or harmful code.",
      "Do not use unauthorized bots, scripts, scraping, bulk extraction or automation to bypass limits or impair the Platform.",
      "Do not copy, reverse engineer, decompile, disassemble or attempt to derive source code, templates or underlying logic.",
      "Do not rent, sublicense, resell, or use the Platform or its materials to create a competing product, except where we expressly authorize it in writing."
    ]
  },
  {
    id: "account-security-and-admin-access",
    number: "6",
    title: "Account Security and Administrator Access",
    summary:
      "You must keep credentials confidential, use strong unique passwords, restrict account access to trusted authorized people, review access when roles change, and promptly report suspected compromise or suspicious activity. You are responsible for activity carried out through your account, except to the extent applicable law provides otherwise.",
    details: [
      "Authorized Certiflo administrators and Senement support personnel may inspect an Organization’s Certiflo profile, account settings, uploaded participant records, certificate records and relevant technical logs when reasonably necessary to resolve a support ticket, investigate an incorrect certificate, restore account access, check suspected fraudulent issuance, respond to a security alert, maintain platform integrity or meet a legal obligation.",
      "Such access must be limited to authorized personnel, for a legitimate work purpose, and to the information reasonably needed. Access should be logged and subject to confidentiality and access-control measures.",
      "Administrators must not browse profiles for personal reasons or disclose data to unauthorized persons. Where practicable, support access should be tied to a support request or documented operational/security need."
    ]
  },
  {
    id: "data-ownership-and-intellectual-property",
    number: "7",
    title: "Data Ownership and Intellectual Property",
    summary:
      "The Organization retains ownership of its User Content, subject to the rights needed to operate the Platform. The Organization grants Senement a limited, non-exclusive, royalty-free license to host, store, process, transmit and display User Content only as reasonably needed to provide, maintain, secure and improve the Services, deliver certificates, enable verification, provide support and meet legal obligations.",
    details: [
      "We may use aggregated or anonymized statistics for analytics and service improvement.",
      "Certiflo’s software, code, features, platform design and templates remain owned by Senement or its licensors. The Organization receives only the limited right to use them through the Platform.",
      "Feedback and suggestions may be used to improve the Services without compensation, provided this does not transfer ownership of the Organization’s underlying content."
    ]
  },
  {
    id: "emails-verification-and-third-parties",
    number: "8",
    title: "Emails, Verification and Third-Party Services",
    summary:
      "The Organization authorizes service emails needed to deliver certificates, verification links and related notifications to the addresses it submits, and administrative emails to its registered contact. The Organization must use valid recipient lists and comply with applicable consent, anti-spam and unsubscribe rules. Email delivery depends on recipient systems, connectivity, spam filters and third-party providers; successful delivery cannot be guaranteed.",
    details: [
      "Certiflo may rely on third-party hosting, email delivery, analytics, security, support or payment providers. Necessary data may be processed by these providers to deliver the service, subject to applicable arrangements and law. Their own services may have separate terms and privacy practices.",
      "Location Information: Certiflo may infer an approximate location from an IP address for account security, fraud prevention, diagnostics or service reliability. If a specific Certiflo feature genuinely needs precise device location, Certiflo may request permission from the browser or device and may collect that location only if permission is granted and the feature is used. Certiflo does not state that location is collected from every user or at all times. A user may deny or later withdraw device-location permission; doing so may affect the location-dependent feature but should not affect unrelated certificate functions."
    ]
  },
  {
    id: "fees-free-access-and-taxes",
    number: "9",
    title: "Fees, Free Access and Taxes",
    summary:
      "Free or sponsored access may be offered at our discretion and may be limited, changed or discontinued. Paid features, pricing, billing cycles and applicable taxes will be shown at purchase or in the relevant plan. Unless applicable law requires otherwise or a specific plan states otherwise, fees are non-refundable. We may change pricing prospectively with reasonable notice."
  },
  {
    id: "data-security-availability-and-backups",
    number: "10",
    title: "Data Security, Availability and Backups",
    summary:
      "Senement will use safeguards appropriate to Certiflo’s operation and the data handled. Depending on what is implemented in the live service, these may include access controls, authentication, encryption, logging, monitoring, backups and incident-response procedures. No control should be understood as present unless it is actually deployed. Access to Personal Data is intended to be restricted to authorized personnel with a legitimate need.",
    details: [
      "Certiflo is designed to help Organizations issue and verify certificates, but no online platform can guarantee that data will never be exposed, lost, attacked or accessed unlawfully. We do not guarantee absolute security, uninterrupted availability, error-free operation, successful recovery of every item of data, or immunity from all attacks.",
      "We will take reasonable steps to prevent, detect, investigate and respond to security incidents and will provide notifications required by applicable law. Organizations must keep their own backups and promptly notify us of suspected incidents."
    ]
  },
  {
    id: "monitoring-suspension-and-revocation",
    number: "11",
    title: "Monitoring, Reports, Suspension and Certificate Revocation",
    summary:
      "We may review platform activity, records or content where reasonably necessary for support, security, fraud prevention, investigation, legal compliance or enforcement of these Terms. We may investigate reports of fake certificates, impersonation, spam, unlawful content or misuse. Users should report suspected abuse with relevant details and evidence to support@gocertiflo.com.",
    details: [
      "Where reasonably necessary, we may suspend or restrict an account, disable access, or revoke/disable a certificate if we reasonably suspect fraud, material breach, security risk, unlawful use or where required by law.",
      "We may act without advance notice when delay would create a security, fraud or legal risk. We will use reasonable efforts to provide relevant information or a route to appeal where appropriate and lawful. Users must cooperate reasonably with investigations."
    ]
  },
  {
    id: "disclaimers-and-limitation-of-liability",
    number: "12",
    title: "Data Loss, Disclaimers and Limitation of Liability",
    summary:
      "The Organization is responsible for the accuracy and legality of its uploads and for keeping external backups. We may attempt to recover accidentally deleted or lost data where feasible, but recovery is not guaranteed. We are not responsible for failures caused by user error, inaccurate data, internet or email-provider failures, third-party outages, force majeure events or other causes outside our reasonable control, subject to applicable law.",
    details: [
      "The Platform and certificates are provided on an “as available” basis. We do not guarantee that a certificate will be accepted or recognized by any employer, institution, regulator or other third party. Organizations remain responsible for the substance and validity of certificates they issue.",
      "To the maximum extent permitted by applicable law, neither party is liable for indirect, incidental, special, consequential or punitive losses, including lost profits or business opportunities.",
      "Senement’s aggregate liability for claims relating to the Platform will not exceed the greater of the fees paid by the Organization for the Platform during the one month before the event giving rise to the claim or INR 2,000, except where such limitation is prohibited by law. Nothing in these Terms excludes liability that cannot legally be excluded."
    ]
  },
  {
    id: "indemnity",
    number: "13",
    title: "Indemnity",
    summary:
      "The Organization is responsible for claims arising from its User Content, participant data, certificates, unlawful use, breach of these Terms or infringement of third-party rights, and will indemnify Senement to the extent permitted by law. We will give reasonable notice of a claim and allow the indemnifying party to participate in the defense. Any separate reciprocal indemnity expressly agreed in writing remains applicable."
  },
  {
    id: "confidentiality",
    number: "14",
    title: "Confidentiality",
    summary:
      "Each party must take reasonable steps to protect the other party’s non-public confidential information and use it only for the relevant service or legal purpose. This obligation does not apply to information that is public without breach, independently developed, lawfully received from another source, or required to be disclosed by law. Where legally permitted, advance notice will be given of compelled disclosure. Confidentiality obligations continue for three years after termination, or longer where required by law."
  },
  {
    id: "term-termination-and-changes",
    number: "15",
    title: "Term, Termination and Changes",
    summary:
      "These Terms take effect when an Organization creates a Certiflo account or accepts these Terms, whichever occurs first, and remain in effect while the Organization uses Certiflo. An Organization may stop using Certiflo and request account closure through available account settings or by contacting Certiflo Support. Before closure, the Organization should export any certificate records it needs to retain, where export functionality is available.",
    details: [
      "Senement may restrict, suspend or terminate access where reasonably necessary because of a breach of these Terms, fraudulent or unauthorized certificate issuance, misuse, a security risk, non-payment, a legal obligation or another legitimate operational reason. Where practicable and legally permitted, Certiflo will notify the Organization and allow it to address the issue. Certiflo may discontinue the service or terminate an account for operational reasons on reasonable notice.",
      "After closure, active Personal Data will generally be deleted or de-identified within 30–60 days, subject to backup cycles, legal holds, security investigations and applicable law, as further described in the Certiflo Privacy Policy.",
      "As Certiflo adds or changes certificate templates, bulk issuance, verification pages, organization administration, security controls or billing features, Senement may update these Terms to reflect the service, security or legal changes. Material changes will typically be communicated through the registered email address or a notice in Certiflo 14–30 days before taking effect where practicable. Changes needed sooner for security or legal reasons may take effect earlier where necessary. Continued use after the effective date constitutes acceptance where permitted by law. If the Organization disagrees, it must stop using Certiflo and may request account closure."
    ]
  },
  {
    id: "governing-law-and-jurisdiction",
    number: "16",
    title: "Governing Law and General Terms",
    summary:
      "These Terms govern use of Certiflo, including Organization accounts, participant-data uploads, certificate creation and delivery, verification links, account administration and related support. They are governed by the laws of India, including the Information Technology Act, 2000 and other applicable laws, and the Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025 to the extent their relevant provisions are in force and apply to the processing or service.",
    details: [
      "Courts at Hyderabad, Telangana, India will have jurisdiction, subject to mandatory law and any valid written dispute-resolution agreement. Any arbitration arrangement applies only if expressly adopted in a valid written agreement.",
      "These Terms must be read with the Certiflo Privacy Policy and any applicable service order or signed data-processing agreement. If a provision is unenforceable, the remainder continues in effect. A delay in enforcement is not a waiver.",
      "An Organization may not assign its rights or obligations without Senement’s prior written consent. Senement may transfer its rights and obligations as part of a restructuring, merger, acquisition or transfer of the Certiflo business, subject to applicable law and appropriate handling of data.",
      "Electronic acceptance through account registration, a checkbox or another recorded digital acceptance mechanism is valid to the extent permitted by law."
    ]
  },
  {
    id: "contact-information",
    number: "17",
    title: "Contact",
    summary:
      "Support, privacy and abuse reports: support@gocertiflo.com.",
    details: [
      "Operator: Senement",
      "Location: Hyderabad, Telangana, India",
      "Official Support Desk: support@gocertiflo.com"
    ]
  }
]

export default function TermsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const expandAll = () => {
    const all = termsSections.reduce((acc, s) => {
      acc[s.id] = true
      return acc
    }, {} as Record<string, boolean>)
    setExpandedSections(all)
  }

  const collapseAll = () => {
    setExpandedSections({})
  }

  const filteredSections = termsSections.filter(sec =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.details?.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className={`min-h-screen bg-white text-black ${inter.className}`}>
      {/* Top Header Bar */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-black hover:underline"
            >
              <ArrowLeft className="w-4 h-4 text-black" />
              <span>Back</span>
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/cflo1.svg" alt="Certiflo" width={24} height={24} />
              <span className="font-bold text-base tracking-tight text-black">Certiflo</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/privacy-policy"
              className="text-gray-600 hover:text-black transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="text-black hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Editorial Document Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-b border-gray-200">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-2">
            Legal Agreement • Version 2.0
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-4">
            Terms of Service & Acceptable Use Policy
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4">
            Operated by Senement (“Senement”, “we”, “us” or “our”). These Terms govern the use of Certiflo, Senement’s certificate management platform for organizations that create, issue, deliver and verify digital certificates.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <div>Operated by Senement • Hyderabad, Telangana, India</div>
            <div>Contact: <a href="mailto:support@gocertiflo.com" className="text-black font-medium underline">support@gocertiflo.com</a></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Table of Contents Table */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-8 border border-gray-200 rounded-lg p-5 bg-gray-50/50">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Table of Contents
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  17 Clauses
                </span>
              </div>

              {/* Search Inside Terms */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter clauses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 text-sm">
                {termsSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-start gap-2 py-1 text-gray-700 hover:text-black transition-colors text-sm leading-snug group"
                  >
                    <span className="text-xs font-bold text-gray-400 group-hover:text-black mt-0.5">
                      {section.number}.
                    </span>
                    <span className="truncate group-hover:underline">{section.title}</span>
                  </a>
                ))}
              </nav>

              <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-black font-semibold hover:underline"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-gray-500 hover:underline"
                >
                  Collapse all
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-black font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowUp className="w-3 h-3 text-black" />
                  <span>Top</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Column: Editorial Document Flow */}
          <main className="lg:col-span-8 space-y-10">
            
            {/* Mobile Filter */}
            <div className="lg:hidden border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter clauses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>
              <div className="flex items-center justify-between text-xs px-1">
                <button type="button" onClick={expandAll} className="text-black font-medium underline">
                  Expand all
                </button>
                <button type="button" onClick={collapseAll} className="text-gray-500 underline">
                  Collapse all
                </button>
                <button 
                  type="button" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                  className="text-black font-medium underline inline-flex items-center gap-0.5"
                >
                  <ArrowUp className="w-3 h-3 text-black" />
                  <span>Top</span>
                </button>
              </div>
            </div>

            {/* Clauses List: Clean Natural Typography */}
            {filteredSections.map((section) => {
              const isExpanded = expandedSections[section.id] ?? false

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20 pb-8 border-b border-gray-200 last:border-b-0"
                >
                  {/* Clause Heading */}
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight flex items-baseline gap-2">
                      <span className="text-gray-400 font-normal">{section.number}.</span>
                      <span>{section.title}</span>
                    </h2>

                    {section.details && section.details.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-black hover:underline flex-shrink-0"
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? "Show less" : "Read more"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-black" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-black" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Clause Text */}
                  <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-normal">
                    {section.summary}
                  </p>

                  {/* Expanded Bullet Points */}
                  {section.details && isExpanded && (
                    <div className="mt-4 pl-4 border-l-2 border-black space-y-2.5">
                      {section.details.map((detail, idx) => (
                        <div key={idx} className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          • {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}

            {filteredSections.length === 0 && (
              <div className="py-12 text-center border-t border-gray-200">
                <Search className="w-6 h-6 text-black mx-auto mb-2" />
                <p className="text-base font-semibold text-black">No matching clauses found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try another keyword or reset the filter.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1 text-xs border border-black rounded text-black font-medium hover:bg-black hover:text-white transition"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Contact Note */}
            <div className="pt-8 border-t border-gray-300">
              <h3 className="text-lg font-bold text-black mb-2">
                Questions or Abuse Inquiries
              </h3>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                To report fake certificates, unauthorized institutional use, or inquire about institutional terms, visit our Contact Page or reach out to our team.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition text-sm"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Go to Contact Page</span>
                </Link>
                <Link href="/privacy-policy" className="text-black hover:underline">
                  View Privacy Policy →
                </Link>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-1 text-gray-600 hover:text-black ml-auto text-sm"
                >
                  <ArrowUp className="w-4 h-4 text-black" />
                  <span>Go to top</span>
                </button>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* Floating Scroll To Top button */}
      <ScrollToTop />

      {/* Footer */}
      <MinimalFooter />
    </div>
  )
}
