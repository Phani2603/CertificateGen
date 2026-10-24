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
  Mail 
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

const sections: SectionItem[] = [
  {
    id: "purpose-and-scope",
    number: "1",
    title: "Purpose and Scope",
    summary:
      "This Privacy Policy explains how Senement handles Personal Data through Certiflo, its certificate management platform, when Organizations register, upload participant lists, generate or send certificates, manage organization profiles, use verification pages, or contact Certiflo Support. It should be read with the Certiflo Terms of Service & Acceptable Use Policy. Processing is subject to applicable Indian law, including the Digital Personal Data Protection Act, 2023, its applicable rules and the Information Technology Act, 2000, as in force."
  },
  {
    id: "roles-and-responsibilities",
    number: "2",
    title: "Our Role and Organization Responsibilities",
    summary:
      "Senement acts as a Data Fiduciary for information it collects to manage organization accounts, provide support, operate and secure the Platform, and understand usage. For participant information uploaded by an Organization to issue certificates, Senement generally acts as a Data Processor on that Organization’s instructions. The Organization is generally responsible for deciding why participant data is collected, ensuring a lawful basis and required consent, providing privacy notices, and handling participant requests.",
    details: [
      "Organizations must upload only data necessary for certificate issuance and verification, and must not upload passwords, payment-card or bank details, health information, biometric data or other sensitive information unrelated to the service.",
      "Organizations must obtain required permissions, including parental/guardian consent where legally required for children’s data."
    ]
  },
  {
    id: "information-we-collect",
    number: "3",
    title: "Information We May Collect",
    summary:
      "Depending on the features used, information may include organization account data, participant data, security credentials, and verification technical logs.",
    details: [
      "Organization/account data: administrator name, organization name, role, email address, contact details, address, website, logo and profile details.",
      "Participant/certificate data: participant name and email, organization or event details, certificate content, achievement, score or completion information supplied by the Organization, certificate identifier, status and revocation details.",
      "Account/security data: login email, password hash (not the plain-text password), login and failed-login timestamps, session/cookie data, access records and multi-factor authentication records if enabled.",
      "Verification and technical data: certificate access or verification timestamps, IP address, browser and device details, referrer, error reports and platform activity logs. Certiflo may infer approximate location from an IP address for security, fraud prevention, diagnostics or service reliability.",
      "Support communications: name, email, organization, message content, attachments and evidence submitted to support.",
      "Website/cookie data: pages visited, time on pages, clicks, browser/device details, referrer and similar diagnostic or analytics information, where such tools are used.",
      "Billing information (if paid plans are introduced): subscription and invoice records and limited billing details. Payment credentials are handled by payment providers where applicable and are not stored by Senement.",
      "We do not intentionally seek biometric, health, financial-account, caste, religion, sexual-orientation, political-belief, criminal-record or family/relationship information. Please do not upload it."
    ]
  },
  {
    id: "how-we-use-information",
    number: "4",
    title: "How We Collect and Use Information",
    summary:
      "We collect information directly when an Organization registers or uploads a file, when a recipient opens or verifies a certificate, when a visitor uses the site, or when someone contacts support. We may also receive technical delivery logs from hosting, email, security, analytics or other providers used to run the Platform.",
    details: [
      "We use Personal Data to create and administer accounts and authenticate users; process participant lists and generate, deliver and verify certificates; display verification status to people using a verification link; respond to support requests and troubleshoot errors; protect the Platform, investigate suspicious access, fraud, abuse, fake certificates or violations of the Terms; maintain logs, backups and service integrity; send service, security, maintenance, policy and certificate-related notices; and comply with legal obligations.",
      "We do not sell Personal Data to data brokers or unrelated marketers, and do not use it for targeted advertising. We do not share one Organization’s identifiable data with another Organization except where authorized, necessary for certificate verification, or required by law.",
      "Location Information: Certiflo may process approximate location inferred from an IP address for account protection, abuse and fraud detection, diagnostics, and service reliability. If a future or current feature requires precise device location, Certiflo will ask for permission through the browser or device. Precise location will be collected only if permission is granted. Certiflo does not continuously track users or require location permission for ordinary certificate issuance and verification."
    ]
  },
  {
    id: "administrative-access",
    number: "5",
    title: "Administrative and Support Access",
    summary:
      "To resolve technical problems, assist an Organization, maintain the service, investigate fraud or security incidents, or comply with law, authorized Senement/Certiflo administrators and support personnel may inspect the relevant Organization profile, account settings, uploaded participant records, certificate records and technical logs.",
    details: [
      "This access is not intended for general browsing or personal curiosity.",
      "It must be limited to authorized personnel and to the information reasonably needed for the stated purpose, protected by access controls and confidentiality obligations, and logged or otherwise auditable where systems support it.",
      "Access may occur without prior notice where necessary to address an urgent security, fraud or legal issue; otherwise, we will seek to work through the Organization’s support request where practicable."
    ]
  },
  {
    id: "security-measures",
    number: "6",
    title: "Security and the Limits of Any Guarantee",
    summary:
      "We use commercially reasonable technical, organizational and administrative measures appropriate to the nature of the information and the service. Depending on implementation, these may include encryption in transit and/or at rest, role-based access controls, authentication, restricted staff permissions, logging, monitoring, backups, vulnerability management and incident-response procedures.",
    details: [
      "Certiflo is built to support the issuance and verification of digital certificates, and Senement will use safeguards appropriate to the service and the information handled.",
      "However, no website, database, cloud provider or internet service can guarantee that information will never leak, be lost, be attacked or be accessed unlawfully. We therefore cannot honestly promise zero risk or immunity from all cyberattacks.",
      "We will take reasonable steps to prevent, detect, contain, investigate and remediate incidents and will notify affected parties and authorities when required by applicable law. Organizations should use strong passwords, restrict account access and maintain their own backups."
    ]
  },
  {
    id: "sharing-and-service-providers",
    number: "7",
    title: "Sharing and Service Providers",
    summary:
      "We may share only the information reasonably necessary with service providers that help us host the Platform, send certificate emails, monitor errors and security, provide customer support, analyze usage, or process payments if applicable. Such providers may process data in India or other locations depending on their infrastructure and applicable law.",
    details: [
      "We expect appropriate confidentiality and data-protection safeguards from providers, but their own services may be subject to separate terms.",
      "We may disclose information where required by law or lawful process, to protect the rights and safety of users or the public, investigate suspected fraud or security incidents, enforce our Terms, or complete a merger, restructuring or sale of the relevant business. Where legally permitted and reasonably practicable, we will notify affected parties of compulsory disclosure or material changes in control."
    ]
  },
  {
    id: "certificate-verification",
    number: "8",
    title: "Certificate Verification and Public Display",
    summary:
      "A certificate verification page may display information contained on the certificate, such as the participant’s name, issuing Organization, event or achievement, issue date, certificate identifier and status. This display is necessary for recipients and authorized verifiers to confirm authenticity. Organizations should not place unnecessary Personal Data on certificates and should inform participants that certificate details may be visible to people who have the verification link or access to the verification page."
  },
  {
    id: "retention-and-deletion",
    number: "9",
    title: "Retention and Deletion",
    summary:
      "We retain Personal Data for the time reasonably necessary to provide the service, keep certificates verifiable as directed by the Organization, maintain security and audit records, resolve disputes and meet legal obligations.",
    details: [
      "Active account/participant data is typically deleted within 30–60 days after an account deletion request or termination, subject to backups, legal holds, security needs and applicable law.",
      "Active certificate data may remain available for verification while the Organization keeps certificates active; revoked certificate records and security logs may be retained for a limited period for fraud prevention and audit purposes.",
      "Organizations may request deletion of their data and associated certificates, subject to legal obligations and the need to retain limited records. Residual copies in encrypted backups are removed during standard automated backup rotation."
    ]
  },
  {
    id: "rights-and-requests",
    number: "10",
    title: "Rights and Requests",
    summary:
      "Subject to applicable law, individuals may have rights to request access to information, correction or updating of inaccurate data, deletion, withdrawal of consent where processing is based on consent, grievance redressal and other statutory rights.",
    details: [
      "For participant records uploaded by an Organization, contact the issuing Organization first because it generally determines the purpose of processing.",
      "You may also contact Senement at support@gocertiflo.com for assistance. We will review and respond within the timelines required by applicable law."
    ]
  },
  {
    id: "childrens-data",
    number: "11",
    title: "Children’s Data",
    summary:
      "Organizations are responsible for identifying when participant data relates to a child and obtaining verifiable parental or guardian consent and any other authorization required by law before uploading it. Organizations must follow their own institutional requirements and applicable child-data rules. Certiflo should not be used to collect children’s data beyond what is necessary for legitimate certificate issuance and verification."
  },
  {
    id: "cookies-analytics-logs",
    number: "12",
    title: "Cookies, Analytics and Technical Logs",
    summary:
      "The Platform may use essential cookies or similar technologies to maintain sessions, protect accounts, remember preferences, diagnose errors and understand service performance. If analytics tools are used, they should be configured to limit or anonymize identifiers where feasible. Users can manage cookies through browser settings, but disabling essential cookies may affect Platform functionality."
  },
  {
    id: "international-processing",
    number: "13",
    title: "International Processing and Third-Party Links",
    summary:
      "Service providers may process or store data outside the user’s state or country. Any transfer will be subject to applicable Indian law and safeguards required at the time. The Platform may link to third-party websites or services; we are not responsible for their independent privacy practices. Review their policies before providing information to them."
  },
  {
    id: "data-breaches-and-incident-response",
    number: "14",
    title: "Data Breaches and Incident Response",
    summary:
      "If Senement becomes aware of a Personal Data breach affecting Certiflo, it will assess and investigate the incident, take reasonable steps to contain it and mitigate harm, preserve relevant records, and notify affected individuals and authorities within the time and manner required by applicable law that is in force and applies to the incident.",
    details: [
      "Applicable Indian Law: Certiflo’s handling of Personal Data is intended to follow applicable Indian law, including the Information Technology Act, 2000 and applicable rules, and the Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025 to the extent their relevant provisions have commenced and apply to the processing.",
      "The commencement of provisions under the DPDP framework is phased, so references to legal obligations in this Policy mean obligations that are applicable at the relevant time."
    ]
  },
  {
    id: "changes-to-policy",
    number: "15",
    title: "Changes to This Policy",
    summary:
      "As Certiflo adds or changes certificate delivery, verification, account administration or security features, Senement may update this Policy to reflect the actual service, its providers, security practices or applicable law. Material changes will typically be communicated through Certiflo or the registered email 14–30 days before taking effect where practicable. The effective date and version will be updated when the Policy changes."
  },
  {
    id: "contact-and-grievance",
    number: "16",
    title: "Contact and Grievance Redressal",
    summary:
      "For privacy requests, complaints, suspected breaches, and grievance redressal under Indian data protection law, contact our team.",
    details: [
      "Email: support@gocertiflo.com",
      "Operator: Senement, Hyderabad, Telangana, India",
      "Grievance Redressal Desk: support@gocertiflo.com"
    ]
  }
]

export default function PrivacyPolicyPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const expandAll = () => {
    const all = sections.reduce((acc, s) => {
      acc[s.id] = true
      return acc
    }, {} as Record<string, boolean>)
    setExpandedSections(all)
  }

  const collapseAll = () => {
    setExpandedSections({})
  }

  const filteredSections = sections.filter(sec =>
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
              href="/terms"
              className="text-gray-600 hover:text-black transition"
            >
              Terms of Service
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
            Privacy Policy • Version 2.0
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-4">
            Certiflo Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4">
            Operated by Senement (“Senement”, “we”, “us” or “our”). This Privacy Policy explains how Senement handles Personal Data through Certiflo, its certificate management platform, in compliance with applicable Indian law, including the Digital Personal Data Protection Act, 2023, its applicable rules, and the Information Technology Act, 2000.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <div>Operated by Senement • Hyderabad, Telangana, India</div>
            <div>Privacy Contact: <a href="mailto:support@gocertiflo.com" className="text-black font-medium underline">support@gocertiflo.com</a></div>
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
                  16 Sections
                </span>
              </div>

              {/* Search Inside Policy */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 text-sm">
                {sections.map((section) => (
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

          {/* Right Column: Natural Editorial Document Flow */}
          <main className="lg:col-span-8 space-y-10">
            
            {/* Mobile Filter */}
            <div className="lg:hidden border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sections..."
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

            {/* Sections List */}
            {filteredSections.map((section) => {
              const isExpanded = expandedSections[section.id] ?? false

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20 pb-8 border-b border-gray-200 last:border-b-0"
                >
                  {/* Heading */}
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

                  {/* Summary Text */}
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
                <p className="text-base font-semibold text-black">No matching sections found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try another search query or clear the filter.
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

            {/* Grievance & Contact Section */}
            <div className="pt-8 border-t border-gray-300">
              <h3 className="text-lg font-bold text-black mb-2">
                Grievance Redressal & Privacy Contact
              </h3>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                For data access requests, corrections, or grievance redressal under the Digital Personal Data Protection Act, 2023, visit our Contact Page or reach out to our team.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition text-sm"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Go to Contact Page</span>
                </Link>
                <Link href="/terms" className="text-black hover:underline">
                  View Terms of Service →
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
