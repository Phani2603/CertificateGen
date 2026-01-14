# Bulk Email Sending with Pooled Transport

## Overview
The certificate generator now supports efficient bulk email sending using **Nodemailer's pooled SMTP transport**. This feature dramatically improves performance when sending certificates to many recipients.

## Performance Comparison

### Sequential Mode (Original)
- Sends one email at a time with 500ms delay
- **Time for 100 emails**: ~50 seconds
- Best for: Small batches (<50 recipients)

### Pooled Mode (New)
- Uses 5 parallel SMTP connections
- Sends up to 100 messages per connection before reconnecting
- Rate limited to 5 emails per second (respects Gmail limits)
- **Time for 100 emails**: ~20 seconds
- Best for: Bulk sends (50+ recipients)

## How It Works

### Auto-Selection
By default, the system automatically chooses the best mode:
- **< 50 recipients**: Sequential mode (safer, more stable)
- **≥ 50 recipients**: Pooled mode (faster, efficient)

### Manual Override
In the UI, you can manually select:
1. **Auto** - Let the system decide based on recipient count
2. **Sequential** - Force one-at-a-time sending (safer for small batches)
3. **Pooled** - Force parallel sending (faster for bulk)

## Configuration

### Pooled Transport Settings
Located in `lib/email-service.tsx`:

```typescript
{
  pool: true,
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  maxConnections: 5,        // Max parallel SMTP connections
  maxMessages: 100,         // Messages per connection before reconnect
  rateDelta: 1000,          // Time window for rate limiting (1 second)
  rateLimit: 5,             // Max emails per rateDelta window
}
```

### Gmail Limits
- **Daily limit**: 500 emails/day (free Gmail)
- **Rate limit**: 5 emails/second (enforced by our config)
- **Recommended**: Use Google Workspace for higher limits

## Usage

### 1. Configure Gmail Credentials
Create `.env.local`:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

See [GMAIL_SETUP.md](./GMAIL_SETUP.md) for generating app passwords.

### 2. Select Email Provider
In the certificate generation UI:
- Choose **Gmail SMTP** from the Email Provider dropdown

### 3. Choose Sending Mode
- **Auto**: Recommended - automatically selects based on recipient count
- **Sequential**: For <50 recipients or when stability is critical
- **Pooled**: For bulk sends (50+) when speed matters

### 4. Generate & Send
1. Upload CSV with recipient data
2. Map fields to template
3. Click "Generate Certificates"
4. Click "Send Emails" (mode is automatically selected)

## Features

### Connection Pooling
- Reuses SMTP connections for multiple emails
- Reduces handshake overhead
- Maintains 5 parallel connections

### Rate Limiting
- Respects Gmail's rate limits
- Sends max 5 emails per second
- Prevents account suspension

### Graceful Shutdown
- Properly closes connections on server stop
- No orphaned SMTP connections
- Clean process termination

### Progress Tracking
- Real-time logging of sent emails
- Tracks successful and failed sends
- Detailed error reporting

## Code Architecture

### Files Modified
1. `lib/email-service.tsx`
   - `createPooledGmailTransporter()` - Creates singleton pooled transport
   - `sendBulkCertificatesPooled()` - Handles bulk sending with pooling
   - `sendBulkCertificates()` - Intelligently routes to sequential/pooled

2. `components/steps/certificate-generation.tsx`
   - Added sending mode UI dropdown
   - Passes mode to API endpoint

3. `app/api/send-certificates/route.ts`
   - Accepts `sendingMode` parameter
   - Returns mode used in response

4. `types/certificate.ts`
   - Added `SendingMode` type

### Event-Driven Architecture
The pooled transport uses Nodemailer's `idle` event:

```typescript
pooledTransporter.on('idle', async () => {
  // Transporter has free connections available
  while (pooledTransporter.isIdle() && queuedRecipients.length > 0) {
    // Send next email
  }
})
```

This ensures:
- Emails are sent as soon as connections are available
- No manual queue management needed
- Efficient connection utilization

## Troubleshooting

### Pooled Mode Not Working
1. Check Gmail credentials in `.env.local`
2. Verify app password (not regular password)
3. Enable "Less secure app access" if needed
4. Check console for detailed error logs

### Emails Sending Too Slowly
- Ensure you're using **Gmail** provider (pooled mode Gmail-only)
- Check sending mode is set to **Pooled** or **Auto** with 50+ recipients
- Verify no firewall blocking SMTP connections

### Rate Limit Errors
- Reduce `rateLimit` in pooled config (currently 5/second)
- Increase `rateDelta` for longer time windows
- Consider Google Workspace for higher limits

### Connection Timeouts
- Check internet connectivity
- Verify SMTP host/port (smtp.gmail.com:587)
- Reduce `maxConnections` if network unstable

## Best Practices

1. **Test with small batches first** - Try 5-10 recipients before bulk
2. **Use Auto mode** - Let the system choose for you
3. **Monitor console logs** - Watch for errors during sending
4. **Stay within limits** - Gmail has 500/day limit
5. **Use sequential for critical sends** - When every email must succeed

## Future Enhancements

Potential improvements:
- [ ] Real-time progress bar in UI
- [ ] Resume failed sends
- [ ] Export send report (CSV/PDF)
- [ ] Support for other email providers (SendGrid, AWS SES)
- [ ] Retry logic for failed emails
- [ ] Email queue persistence (database)

## References

- [Nodemailer Pooled SMTP](https://nodemailer.com/smtp/pooled/)
- [Gmail SMTP Settings](https://support.google.com/a/answer/176600)
- [Google Workspace Limits](https://support.google.com/a/answer/166852)
