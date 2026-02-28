# Email Provider Environment Variables

Add these environment variables to your `.env.local` file for the Email Modal functionality.

## Required Variables

### Senement Forge Email Provider (`forge@senement.com`)

**✅ Already Configured!** This provider uses your existing variables:

```env
# Already in your .env.local
CORPORATE_EMAIL_USER=forge@senement.com
CORPORATE_EMAIL_PASSWORD=Shrot@8546
```

**Optional Configuration** (uses GoDaddy SMTP defaults if not specified):

```env
# Optional - defaults to GoDaddy SMTP
NEXT_PUBLIC_CORPORATE_EMAIL_HOST=smtp.secureserver.net
NEXT_PUBLIC_CORPORATE_EMAIL_PORT=465
NEXT_PUBLIC_CORPORATE_EMAIL_SECURE=true
```

### GoCertiflo Support Email Provider (`support@gocertiflo.com`)

**⚠️ Needs Configuration** - Add these to your `.env.local`:

```env
# GoCertiflo Support - Required
GOCERTIFLO_SUPPORT_USER=support@gocertiflo.com
GOCERTIFLO_SUPPORT_PASSWORD=your_password_here

# GoCertiflo Support - Optional (has defaults)
NEXT_PUBLIC_GOCERTIFLO_SUPPORT_HOST=smtp.gocertiflo.com
NEXT_PUBLIC_GOCERTIFLO_SUPPORT_PORT=587
NEXT_PUBLIC_GOCERTIFLO_SUPPORT_SECURE=true
```

## Complete .env.local Example

**What's Already There:**
```env
# ✅ Already configured - Senement Forge
CORPORATE_EMAIL_USER=forge@senement.com
CORPORATE_EMAIL_PASSWORD=Shrot@8546
```

**What You Need to Add:**

```env
# ========================================
# ADDITIONAL EMAIL PROVIDER CONFIGURATION
# ========================================

# --------------------------------------------------
# GoCertiflo Support Provider (support@gocertiflo.com)
# --------------------------------------------------
# Required credentials
GOCERTIFLO_SUPPORT_USER=support@gocertiflo.com
GOCERTIFLO_SUPPORT_PASSWORD=your_gocertiflo_password_here

# Optional configuration (has defaults)
# NEXT_PUBLIC_GOCERTIFLO_SUPPORT_HOST=smtp.gocertiflo.com
# NEXT_PUBLIC_GOCERTIFLO_SUPPORT_PORT=587
# NEXT_PUBLIC_GOCERTIFLO_SUPPORT_SECURE=true
```

**Optional - Override GoDaddy SMTP Defaults for Senement Forge:**
```env
# Only add these if you need different SMTP settings
# NEXT_PUBLIC_CORPORATE_EMAIL_HOST=smtp.secureserver.net
# NEXT_PUBLIC_CORPORATE_EMAIL_PORT=465
# NEXT_PUBLIC_CORPORATE_EMAIL_SECURE=true
```

## Variable Naming Convention

The naming follows your existing pattern for scalability:

### Pattern: `[VISIBILITY]_[PROVIDER]_[PROPERTY]`

- **VISIBILITY**: 
  - `NEXT_PUBLIC_` - Client-side accessible (safe, non-sensitive data like SMTP host/port)
  - *(no prefix)* - Server-side only (sensitive credentials like USER/PASSWORD)

- **PROVIDER**: 
  - `CORPORATE_EMAIL` - Senement forge email (your existing variables)
  - `GOCERTIFLO_SUPPORT` - GoCertiflo support email provider

- **PROPERTY**: 
  - `HOST` - SMTP server hostname (optional, has defaults)
  - `PORT` - SMTP server port (optional, has defaults)
  - `SECURE` - Whether to use TLS/SSL (optional, has defaults)
  - `USER` - Email account username (required)
  - `PASSWORD` - Email account password (required)

### Examples:
```env
# Senement Forge (existing)
CORPORATE_EMAIL_USER=forge@senement.com          # Server-side only
CORPORATE_EMAIL_PASSWORD=your_password            # Server-side only
NEXT_PUBLIC_CORPORATE_EMAIL_HOST=smtp...          # Optional, client-side

# GoCertiflo Support (new)
GOCERTIFLO_SUPPORT_USER=support@gocertiflo.com   # Server-side only
GOCERTIFLO_SUPPORT_PASSWORD=your_password         # Server-side only
NEXT_PUBLIC_GOCERTIFLO_SUPPORT_HOST=smtp...       # Optional, client-side
```

## Security Notes

⚠️ **IMPORTANT**: 
- Variables with `NEXT_PUBLIC_` prefix are exposed to the browser
- Never put sensitive data (passwords, API keys) in `NEXT_PUBLIC_` variables
- The system validates required variables on modal open
- Missing variables will show a helpful error message

## Adding New Email Providers

To add a new email provider in the future:

1. **Add to `lib/email-providers.ts`**:
```typescript
{
  id: 'new-provider',
  name: 'New Provider',
  email: 'email@newprovider.com',
  displayName: 'New Provider Display',
  host: process.env.NEXT_PUBLIC_NEW_PROVIDER_HOST || 'smtp.default.com',
  port: parseInt(process.env.NEXT_PUBLIC_NEW_PROVIDER_PORT || '587'),
  secure: process.env.NEXT_PUBLIC_NEW_PROVIDER_SECURE !== 'false',
  description: 'Provider description',
  envPrefix: 'NEW_PROVIDER',
  icon: '📧',
  color: 'from-blue-500 to-indigo-500',
}
```

2. **Add environment variables** following the naming convention:
```env
# Required
NEW_PROVIDER_USER=email@newprovider.com
NEW_PROVIDER_PASSWORD=password_here

# Optional (with defaults)
NEXT_PUBLIC_NEW_PROVIDER_HOST=smtp.newprovider.com
NEXT_PUBLIC_NEW_PROVIDER_PORT=587
NEXT_PUBLIC_NEW_PROVIDER_SECURE=true
```

The modal will automatically detect and display the new provider!

## Testing

1. Add the variables to `.env.local`
2. Restart your development server: `npm run dev`
3. Visit `/dev-dev` page
4. Click "Compose Email" button
5. Select a provider from the dropdown
6. The system will validate configuration and show errors if variables are missing

## SMTP Settings by Provider

### Common SMTP Configurations

If using standard email providers, here are typical settings:

**Gmail**:
```env
HOST=smtp.gmail.com
PORT=587
SECURE=true
# Requires App Password, not regular password
```

**Outlook/Office365**:
```env
HOST=smtp.office365.com
PORT=587
SECURE=true
```

**SendGrid**:
```env
HOST=smtp.sendgrid.net
PORT=587
SECURE=true
USERNAME=apikey
PASSWORD=your_sendgrid_api_key
```

**Resend**:
```env
HOST=smtp.resend.com
PORT=587
SECURE=true
API_KEY=re_xxxx
```

## Architecture Benefits

✅ **DRY (Don't Repeat Yourself)**
- Single source of truth for provider configuration
- Reusable across entire application

✅ **SOLID Principles**
- Single Responsibility: Each component has one job
- Open/Closed: Easy to add providers without modifying core code
- Liskov Substitution: All providers follow same interface
- Interface Segregation: Clean, minimal interfaces
- Dependency Inversion: Depends on abstractions

✅ **Scalability**
- Add unlimited providers by following the pattern
- Configuration-driven, not hardcoded
- Environment-based for different deployment targets

✅ **Security**
- Clear separation of public vs private data
- Server-side credential protection
- Runtime validation of configuration

## Next Steps

1. ✅ Copy variables to `.env.local`
2. ✅ Replace placeholder values with actual credentials
3. ✅ Restart development server
4. ✅ Test email modal on `/dev-dev` page
5. 🔨 Implement actual email sending API endpoint at `/api/email/send`

## API Endpoint Implementation (TODO)

Create `app/api/email/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getProviderById } from '@/lib/email-providers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, to, subject, body: emailBody, cc, bcc } = body
    
    const provider = getProviderById(providerId)
    if (!provider) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }
    
    // Get server-side credentials using the provider's envPrefix
    const user = process.env[`${provider.envPrefix}_USER`]
    const password = process.env[`${provider.envPrefix}_PASSWORD`]
    
    if (!user || !password) {
      return NextResponse.json(
        { error: 'Provider credentials not configured' },
        { status: 500 }
      )
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: { user, pass: password },
    })
    
    // Send email
    const info = await transporter.sendMail({
      from: provider.email,
      to,
      cc,
      bcc,
      subject,
      text: emailBody,
      html: emailBody,
    })
    
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
```

Don't forget to install nodemailer:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```
