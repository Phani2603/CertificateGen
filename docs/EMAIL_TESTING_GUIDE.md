# Email Sending Debug & Testing Guide

## Quick Summary of the Issue

After generating certificates, the email sending was failing silently because:
1. **Missing Logo File Check** - Code tried to attach `public/klh.png` without verifying it exists
2. **No Fallback Mechanism** - If logo was missing, the entire email send would fail
3. **HTML Template Issue** - Email template always referenced the logo CID, even if not attached

## What Was Fixed

### Changes in `lib/email-service.tsx`:

1. **Added File System Import**
   - Added `import fs from "fs"` to check file existence

2. **Created Safe Logo Attachment Function**
   - New function `getLogoAttachment()` checks if logo file exists
   - Returns attachment object only if file found
   - Gracefully returns `null` if file missing

3. **Updated Email Sending Functions**
   - `sendCertificateEmail()` - For single certificate emails
   - `sendBulkCertificatesPooled()` - For bulk Gmail sending
   - Both now use safe logo attachment

4. **Made HTML Template Conditional**
   - Logo image tag only renders if `logoAttachment` exists
   - Email template is flexible and works with or without logo

## Testing Steps

### Step 1: Verify Logo File Exists
```bash
# Check if logo file is in the public folder
ls -la public/klh.png
# Should show the file exists
```

### Step 2: Test Email Sending

**Option A: With Logo (Success Case)**
1. Make sure `public/klh.png` exists
2. Generate certificates
3. Click "Send Emails"
4. Check browser console for logs:
   - Should see: `[Email Service] Logo file found at: ...`
   - Email sends successfully
   - Logo appears in recipient's email

**Option B: Without Logo (Graceful Fallback)**
1. Temporarily rename/move `public/klh.png`
2. Generate certificates  
3. Click "Send Emails"
4. Check browser console for logs:
   - Should see: `[Email Service] Logo file not found at: ...`
   - Email STILL sends successfully (no logo, but content intact)
5. Restore `public/klh.png` for production use

### Step 3: Monitor Server Logs

Look for these log messages in your server console:

**Success:**
```
[Email Service] Logo file found at: /path/to/public/klh.png
[Email Service] Sending email via GMAIL to: user@example.com
[Email Service] Gmail Success! Message ID: ...
```

**With Missing Logo (Still Works):**
```
[Email Service] Logo file not found at: /path/to/public/klh.png
[Email Service] Sending email via GMAIL to: user@example.com
[Email Service] Gmail Success! Message ID: ...
```

**Error (Should Not Happen Now):**
```
[Email Service] Error checking logo file: [error details]
```

## How the Fix Works

### Before (Broken):
```typescript
attachments: [
  {
    filename: "klh-logo.png",
    path: path.join(process.cwd(), "public", "klh.png"),  // ❌ No check if exists
    cid: "klh-logo",
  },
  // ... certificate
]
```

### After (Fixed):
```typescript
const logoAttachment = getLogoAttachment()  // ✅ Safe check

const attachments: any[] = []
if (logoAttachment) {
  attachments.push(logoAttachment)  // ✅ Only add if exists
}
attachments.push({
  filename: recipient.fileName,
  content: buffer,
  contentType: "image/png",
})
```

### HTML Template:
```html
<!-- Before (Broken) -->
<img src="cid:klh-logo" ... />  <!-- ❌ Always expected -->

<!-- After (Fixed) -->
${logoAttachment ? '<img src="cid:klh-logo" ...' : ''}  <!-- ✅ Conditional -->
```

## Troubleshooting

### Issue: Still Getting Email Send Errors

**Check:**
1. Are you using Resend or Gmail provider?
   - Resend uses different email sending mechanism
   - Gmail requires credentials
2. Check server console for full error messages
3. Verify credentials are correctly configured
4. Check network tab in browser for API response details

### Issue: Logo Not Appearing in Emails

**Check:**
1. Verify `public/klh.png` exists
2. Check server logs for: `[Email Service] Logo file found at:`
3. If not found, copy logo file to `public/` folder
4. Resend provider emails: Logo might need different handling (file vs URL)

### Issue: Emails Going to Spam

**Not related to this fix, but check:**
1. DKIM, SPF, DMARC records configured
2. Gmail app password has correct permissions
3. Sender email is verified with Resend (if using Resend)

## Provider-Specific Notes

### Gmail Provider (SMTP)
- Uses `nodemailer` library
- Supports CID attachments (what we fixed)
- Requires app password
- Now works with or without logo file

### Resend Provider
- Cloud email service
- May handle attachments differently
- Logo attachment implementation might differ (check Resend docs)

## Files Modified

- [lib/email-service.tsx](lib/email-service.tsx) - Main fix
  - Added `fs` import
  - Added `getLogoAttachment()` function  
  - Updated `sendCertificateEmail()` function
  - Updated `sendBulkCertificatesPooled()` function

## Next Steps (If Still Having Issues)

1. **Check API Response:**
   - Open browser DevTools → Network tab
   - Look for `/api/send-certificates` request
   - Check Response tab for error details

2. **Check Client Logs:**
   - Open browser Console (F12)
   - Search for `[Client]` logs
   - Look for error messages

3. **Check Server Logs:**
   - Look for `[API]` and `[Email Service]` logs
   - Check full error stack traces

4. **Enable Debug Mode:**
   - Add more detailed logging if needed
   - Check environment variables are set correctly

## Success Indicators

✅ Browser console shows: `[Client] Email API response: { success: true, sentCount: X }`
✅ Server console shows: `[Email Service] Gmail Success! Message ID: ...`
✅ Email status shows: "Emails Sent Successfully!"
✅ Recipient receives email with certificate attachment
✅ Email layout is intact (logo present or gracefully absent)
