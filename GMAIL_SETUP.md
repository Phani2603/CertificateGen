# Gmail SMTP Setup Guide

## How to Send Emails from Your Personal Gmail

Follow these steps to configure Gmail SMTP for sending certificates:

### Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Click on **2-Step Verification**
3. Follow the prompts to enable it (you'll need your phone)

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. You might need to sign in again
3. Select **"Mail"** from the app dropdown
4. Select **"Windows Computer"** (or other device)
5. Click **Generate**
6. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)
   - Remove spaces: `abcdefghijklmnop`

### Step 3: Update `.env.local`

Open your `.env.local` file and update:

```env
GMAIL_USER=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important**: Use the 16-character app password, NOT your regular Gmail password!

### Step 4: Select Gmail in the UI

1. Start your development server: `npm run dev`
2. Go to Step 3: Generate Certificates
3. In **Processing Options**, select **"Gmail SMTP (Personal Email)"**
4. Generate certificates and click **"Send Emails"**

### Gmail Sending Limits

- **Free Gmail**: ~100-500 emails per day
- **Google Workspace**: ~2,000 emails per day

If you hit the limit, you'll see an error message.

### Troubleshooting

**Error: "Invalid credentials"**
- Double-check you copied the app password correctly (no spaces)
- Make sure 2FA is enabled
- Try generating a new app password

**Error: "Daily sending quota exceeded"**
- You've hit Gmail's daily limit
- Wait 24 hours or use a different account
- Consider upgrading to Google Workspace

**Emails going to spam**
- This is normal for bulk emails
- Ask recipients to mark as "Not Spam"
- Consider using a professional domain with Resend instead

### Security Note

⚠️ Never commit your `.env.local` file to Git!
It's already in `.gitignore`, but double-check before pushing.

## Alternative: Use Resend with Your Own Domain

If you want more reliability and higher limits:

1. Buy a domain ($1-10/year) from Namecheap/Cloudflare
2. Add it to [Resend Domains](https://resend.com/domains)
3. Add DNS records to verify
4. Use emails like `certificates@yourdomain.com`
5. Select "Resend" as the email provider

### Need Help?

Check the console logs in your browser (F12) and terminal for detailed error messages.
