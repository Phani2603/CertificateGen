# Pitch Deck - Certificate Generation & Distribution Platform

## Slide 1 - Title
- Product: Certificate Generation & Distribution Platform
- Tagline: Automate certificate creation, verification, and delivery
- Date: May 10, 2026

## Slide 2 - Problem
- Institutions and organizations spend significant time generating certificates manually
- Manual workflows lead to formatting errors, inconsistent branding, and delivery delays
- Verification is often missing or ad-hoc, reducing trust in issued certificates

## Slide 3 - Solution
- End-to-end platform to design, generate, verify, and distribute certificates
- Batch processing from CSV data with visual template mapping
- Built-in verification endpoint to validate issued certificates

## Slide 4 - Product Overview
- Certificate template builder with field mapping and preview
- Bulk generation pipeline with export (PNG/PDF) and ZIP downloads
- Email delivery with multi-provider support (Gmail SMTP, Resend)
- Verification pages backed by MongoDB records

## Slide 5 - Core Workflow
- Create organization, club, and event
- Upload certificate template and CSV data
- Generate certificates in batch and register in database
- Distribute via email or share verification links

## Slide 6 - Key Features (Today)
- Dynamic field mapping and DPI-based rendering
- CSV auto-detection and mapping
- Certificate registration with hashes and verification IDs
- Secure email delivery (links or attachments)
- Session persistence and responsive UI

## Slide 7 - Security and Reliability
- AES-256-GCM encryption for credential handling
- PBKDF2 key derivation with 100,000 iterations
- Request validation, sanitization, and CORS protection
- Route protection with NextAuth.js v5 (email/password, Google, GitHub)

## Slide 8 - Technology Stack
- Next.js 16, React 19, TypeScript, Tailwind CSS
- Node.js API routes
- MongoDB for certificate and user data
- Canvas-based rendering pipeline
- SMTP and Resend email delivery providers

## Slide 9 - Roadmap (Planned)
- Certificate quota management per organization (design complete)
- QR codes embedded on certificates for instant verification
- Verification links included in emails by default
- Team collaboration features (organizations, roles, shared access)
- Profile management and certificate history dashboards

## Slide 10 - Future Growth Opportunities
- Corporate and academic onboarding flows
- CMS-backed blog content and knowledge base
- Advanced analytics for issuance volume and delivery success
- Enterprise-grade policy controls and audit trails
