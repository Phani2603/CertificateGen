# GoDaddy Email Setup for Corporate Invitations

This guide explains how to configure GoDaddy email (forge@senement.com) for sending corporate invitations.

## Overview

Corporate invitations are now sent from **forge@senement.com** with the display name **"Senement"** using GoDaddy's SMTP service.

## Features

✅ Professional branded emails from forge@senement.com  
✅ Display name shows as "Senement"  
✅ Beautiful HTML email templates with gradient design  
✅ Automatic GoDaddy SMTP configuration  
✅ Used for organization invitations and reminders

## Environment Variables Required

Add these variables to your `.env.local` file:

```env
# Corporate Invitation Email (GoDaddy - Senement)
CORPORATE_EMAIL_USER=forge@senement.com
CORPORATE_EMAIL_PASSWORD=your_godaddy_email_password
```

## GoDaddy SMTP Settings

The application automatically uses these settings for GoDaddy emails:

- **SMTP Host**: `smtpout.secureserver.net`
- **Port**: `465`
- **Security**: SSL/TLS (secure: true)
- **Authentication**: Username/Password

## Where It's Used

The corporate email is used in the following scenarios:

1. **Organization Invitations** (`/api/private-orgs/[slug]/invite`)
   - When an organization owner invites new members
   - Sends invitation link to join the organization

2. **Invitation Reminders** (`/api/private-orgs/[slug]/invite/resend`)
   - When an organization owner resends an invitation
   - Reminds users to accept their pending invitation

## Email Template

The emails feature:
- Professional gradient header (purple/blue theme)
- Clean, modern HTML design
- Clear call-to-action buttons
- Expiration notices (7 days)
- Mobile-responsive layout
- Senement branding throughout

## Getting Your GoDaddy Email Password

1. **Log in to GoDaddy**
   - Go to https://www.godaddy.com
   - Sign in to your account

2. **Access Workspace Email**
   - Navigate to "Email & Office"
   - Click on your Workspace Email product

3. **Get Your Password**
   - If you forgot your password, click "Manage" > "Email" > "Mailbox Settings"
   - Use the password you set up for forge@senement.com
   - Or reset it if needed

4. **Important**: Use the actual email password, NOT an app-specific password

## Testing the Setup

After adding the environment variables, test the invitation system:

1. Create a private organization (if you don't have one)
2. Try to invite a user to your organization
3. Check if the email is received from forge@senement.com
4. Verify the email displays "Senement" as the sender name

## Troubleshooting

### Email Not Sending

**Check SMTP Settings**:
```javascript
// These are automatically configured for senement.com emails
host: 'smtpout.secureserver.net'
port: 465
secure: true
```

**Verify Environment Variables**:
```bash
# Make sure these are set in .env.local
CORPORATE_EMAIL_USER=forge@senement.com
CORPORATE_EMAIL_PASSWORD=your_actual_password
```

### Authentication Errors

- Verify the password is correct
- Check if the email account is active in GoDaddy
- Ensure 2FA is not blocking SMTP access
- Try resetting the email password in GoDaddy

### Email Goes to Spam

- Ask GoDaddy to verify SPF and DKIM records for senement.com
- Add proper SPF record: `v=spf1 include:secureserver.net ~all`
- Request DKIM setup from GoDaddy support

### Connection Timeout

- Check firewall settings (port 465 should be open)
- Verify your server can reach smtpout.secureserver.net
- Try using port 587 with STARTTLS instead (requires code change)

## Alternative: Using Port 587

If port 465 doesn't work, you can modify the SMTP config to use port 587:

```javascript
// In the invite route files, change:
{
  host: 'smtpout.secureserver.net',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.CORPORATE_EMAIL_USER,
    pass: process.env.CORPORATE_EMAIL_PASSWORD,
  },
}
```

## Email Service Architecture

The system uses different email configurations for different purposes:

| Purpose | Email | Provider | Configuration |
|---------|-------|----------|---------------|
| Certificates | Varies (user's email) | Gmail/Educational | Dynamic per user |
| Corporate Invites | forge@senement.com | GoDaddy | Fixed SMTP |
| System Emails | Varies | Resend | API-based |

## Support

If you encounter issues:

1. Check GoDaddy email settings in their control panel
2. Verify the email account has sending permissions
3. Review server logs for detailed error messages
4. Contact GoDaddy support for SMTP issues

## Security Notes

- Store credentials in `.env.local` (never commit to git)
- The `.env.local` file is gitignored by default
- Use strong passwords for the email account
- Enable 2FA on your GoDaddy account (but ensure SMTP still works)
- Regularly rotate email passwords

## Related Files

- [/app/api/private-orgs/[slug]/invite/route.ts](../app/api/private-orgs/[slug]/invite/route.ts) - Main invitation endpoint
- [/app/api/private-orgs/[slug]/invite/resend/route.ts](../app/api/private-orgs/[slug]/invite/resend/route.ts) - Resend invitation endpoint
- [/lib/email-service.tsx](../lib/email-service.tsx) - Email service with GoDaddy support
- [.env.example](../.env.example) - Environment variable template

## Migration from Gmail

If you were previously using Gmail for invitations:

1. The old `EMAIL_USER` and `EMAIL_APP_PASSWORD` are still used for certificates
2. Corporate invitations now use `CORPORATE_EMAIL_USER` and `CORPORATE_EMAIL_PASSWORD`
3. This separation allows different branding for different email types
4. No changes needed to certificate sending functionality
