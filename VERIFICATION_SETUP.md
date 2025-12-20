# Certificate Verification Setup Guide

## What We Built

✅ **Complete certificate verification system** with MongoDB backend
✅ **Secure hash-based integrity checking** (SHA-256)
✅ **UUID-based verification IDs** (cryptographically secure)
✅ **Automatic registration** during certificate generation
✅ **Public verification page** with real-time API lookups
✅ **Revocation support** (for future admin panel)

---

## Setup Instructions

### 1. Create MongoDB Database

**Option A: MongoDB Atlas (Recommended - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (free M0 tier)
4. Create database user (Database Access)
5. Whitelist your IP (Network Access) - or use `0.0.0.0/0` for all IPs
6. Get connection string from "Connect" → "Connect your application"

**Option B: Local MongoDB**
```bash
# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/data
```

### 2. Configure Environment Variables

Create `.env.local` file in project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/certificate-forge?retryWrites=true&w=majority

# Application URL (for verification links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email Configuration (already exists)
RESEND_API_KEY=your_resend_api_key_here
```

**Important:** Replace:
- `username` → your MongoDB username
- `password` → your MongoDB password
- `cluster` → your cluster name
- `certificate-forge` → your database name (can keep as is)

### 3. Test the Setup

```bash
# Start development server
npm run dev

# Generate some certificates through the UI
# Check the console for "[Certificate Registration]" logs
# You should see: "Successfully registered X/Y certificates"
```

### 4. Test Verification

1. After generating certificates, check console for verification URLs
2. Copy one of the URLs (format: `http://localhost:3000/verify/abc-123-def-456`)
3. Open in new tab - should show certificate details
4. Verify the data matches what was generated

---

## Architecture Overview

### Database Schema

```typescript
Certificate {
  verificationId: string (UUID, indexed)
  certificateHash: string (SHA-256)
  recipientName: string
  recipientEmail: string
  eventName: string
  eventDate: string
  organizationName: string
  clubName: string
  issueDate: Date
  isValid: boolean
  metadata: {
    batchId: string
    generatedBy: string
  }
  timestamps: true
}
```

### Security Features

1. **Hash Verification**: Each certificate has SHA-256 hash of its data
   - Hash = SHA256(name + email + event + date + org + club + issueDate)
   - Recalculated during verification
   - If data is tampered → hash won't match → invalid ❌

2. **Unique Verification IDs**: Cryptographically secure UUIDs
   - Format: `a3f2c8b1-4d5e-6f7g-8h9i-0j1k2l3m4n5o`
   - Impossible to guess or brute force
   - Indexed in database for fast lookups

3. **Revocation Support**: `isValid` flag
   - Can be set to `false` to revoke certificate
   - Future: Admin panel to manage revocations

### API Endpoints

**Register Certificates**
```http
POST /api/certificates/register
Content-Type: application/json

{
  "certificates": [
    {
      "recipientName": "John Doe",
      "recipientEmail": "john@example.com",
      "eventName": "Tech Fest 2025",
      "eventDate": "2025-12-20",
      "organizationName": "KLH Bachupally",
      "clubName": "ACM x KLH"
    }
  ],
  "batchId": "batch-1234567890",
  "generatedBy": "admin@example.com"
}

Response:
{
  "success": true,
  "registered": 1,
  "total": 1,
  "certificates": [
    {
      "recipientEmail": "john@example.com",
      "recipientName": "John Doe",
      "verificationId": "abc-123-def-456",
      "verificationUrl": "http://localhost:3000/verify/abc-123-def-456"
    }
  ]
}
```

**Verify Certificate**
```http
GET /api/certificates/verify/[id]

Response (Valid):
{
  "success": true,
  "valid": true,
  "certificate": {
    "id": "abc-123-def-456",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com",
    "eventName": "Tech Fest 2025",
    "eventDate": "2025-12-20",
    "organizationName": "KLH Bachupally",
    "clubName": "ACM x KLH",
    "issueDate": "2025-12-20T10:30:00Z",
    "verificationCode": "CERT-ABC123"
  }
}

Response (Not Found):
{
  "success": false,
  "error": "Certificate not found"
}

Response (Tampered):
{
  "success": false,
  "error": "Certificate data has been tampered with"
}
```

---

## Integration Flow

### Certificate Generation Flow

1. User uploads template + CSV
2. User clicks "Generate Certificates"
3. System generates certificate images
4. System calls `/api/certificates/register` with metadata
5. MongoDB stores records with unique verification IDs
6. System downloads ZIP file
7. Console logs verification URLs

### Verification Flow

1. Someone visits `/verify/[id]`
2. Page calls `/api/certificates/verify/[id]`
3. API looks up certificate in MongoDB
4. API recalculates hash to check integrity
5. API returns certificate data
6. Page displays certificate details with ✅ or ❌

---

## What's NOT Included (Future Enhancements)

❌ **Verification link embedded on certificate image**
   - Would require generating IDs BEFORE creating images
   - Can be added by modifying canvas generation
   - Would show as: "Verify: forge.app/verify/abc-123"

❌ **QR code on certificate**
   - Requires QR code generation library
   - Would embed verification URL in QR code
   - Easy to add with `qrcode` npm package

❌ **Admin panel for revocation**
   - Need to build UI to mark certificates as invalid
   - Would set `isValid: false` in database
   - Verification page already handles revoked certs

❌ **Authentication system**
   - Currently anyone can generate certificates
   - Would need signup/login
   - Would track who issued which certificates

---

## Troubleshooting

### "Cannot connect to MongoDB"
- Check your `MONGODB_URI` in `.env.local`
- Verify IP whitelist in MongoDB Atlas
- Test connection: `mongosh "mongodb+srv://..."`

### "Certificate not found"
- Check if certificates were actually registered (console logs)
- Verify the verification ID is correct
- Check MongoDB database for records

### "Registration failed"
- Check server console for errors
- Verify MongoDB connection is working
- Check if all required fields are provided

---

## Production Deployment

### Environment Variables

Add to Vercel/Netlify:
```
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### MongoDB Atlas Production Setup

1. Change IP whitelist from `0.0.0.0/0` to specific IPs
2. Use strong passwords for database users
3. Enable audit logs
4. Set up database backups
5. Monitor connection limits

---

## Next Steps

1. ✅ Set up MongoDB (Atlas or local)
2. ✅ Add `MONGODB_URI` to `.env.local`
3. ✅ Test certificate generation
4. ✅ Test verification page
5. 🚀 Deploy to production
6. 📧 (Optional) Add verification links to email notifications
7. 🎨 (Optional) Embed verification links on certificate images
8. 🔐 (Optional) Add authentication system

---

**Ganapati Bappa Moriyaa! 🙏**
Your certificate verification system is ready to use!
