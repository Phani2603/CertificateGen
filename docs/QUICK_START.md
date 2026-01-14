# Quick Setup & Testing Guide

## ✅ Fixed TypeScript Errors

All compilation errors have been fixed:
- MongoDB connection typing issue → Fixed
- Certificate model static method → Fixed

## 🔗 Yes, Verify Page is Connected!

The verification flow is fully wired:

**Frontend** (`/app/verify/[id]/page.tsx`):
```typescript
// Line 58: Makes API call
const response = await fetch(`/api/certificates/verify/${params.id}`)
const result = await response.json()

// Handles response and displays certificate data
```

**Backend** (`/app/api/certificates/verify/[id]/route.ts`):
```typescript
// Looks up certificate in MongoDB
// Validates hash integrity
// Returns certificate data or error
```

## 🚀 Setup MongoDB (5 minutes)

### Option 1: MongoDB Atlas (Free, Cloud)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Click "Build a Database" → "Free" (M0)
3. Choose cloud provider (AWS/Google/Azure) and region
4. Create cluster (takes ~3 minutes)
5. Security Setup:
   - **Database Access**: Add user (remember username/password)
   - **Network Access**: Add IP → `0.0.0.0/0` (allow all) for testing
6. Click "Connect" → "Connect your application"
7. Copy connection string

### Option 2: Local MongoDB

```bash
# Windows
winget install MongoDB.Server

# Mac
brew install mongodb-community

# Linux
sudo apt-get install mongodb
```

## ⚙️ Configure Environment

Create `.env.local` in project root:

```env
# Replace with your actual connection string
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/certificate-forge?retryWrites=true&w=majority

# Your app URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email (you already have this)
RESEND_API_KEY=your_key_here
```

**Important:** Replace `username`, `password`, and cluster details with your actual values!

## 🧪 Test Everything

### 1. Start the app
```bash
npm run dev
```

### 2. Generate certificates
1. Go to `http://localhost:3000/dashboard`
2. Create/join an organization
3. Create a club
4. Create an event
5. Upload template + CSV
6. Generate certificates

### 3. Check console
You should see:
```
[Certificate Registration] Registering certificates in database...
[Certificate Registration] Successfully registered 5/5 certificates
[Certificate Registration] Verification URLs generated:
  John Doe: http://localhost:3000/verify/abc-123-def-456
```

### 4. Test verification
1. Copy one of the verification URLs from console
2. Open in new tab
3. Should see:
   - ✅ "Certificate Verified"
   - Recipient name
   - Event details
   - Organization/club info
   - Issue date

### 5. Test invalid ID
Visit: `http://localhost:3000/verify/invalid-id-12345`

Should show:
- ❌ "Verification Failed"
- "Certificate not found or invalid"

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
**Check:**
- Is `MONGODB_URI` in `.env.local`?
- Did you restart the dev server after adding `.env.local`?
- Is your IP whitelisted in MongoDB Atlas?

**Test connection:**
```bash
# Install MongoDB CLI tools
npm install -g mongodb-runner

# Test connection
mongosh "your-connection-string"
```

### "Certificate not found"
**Check:**
- Did certificates actually get registered? (check console logs)
- Is MongoDB running?
- Try visiting MongoDB Atlas → Browse Collections → Should see "certificates" collection

### "Registration failed"
**Check server console** (terminal running `npm run dev`):
- Should show `[MongoDB] Connected successfully`
- Should show `[Certificate Registration]` logs
- Any error messages?

## 📊 Verify MongoDB Data

1. Go to MongoDB Atlas → Database → Browse Collections
2. Select your database → `certificates` collection
3. Should see documents like:
```json
{
  "_id": "...",
  "verificationId": "abc-123-def-456",
  "certificateHash": "sha256-hash-here",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "eventName": "Tech Fest 2025",
  "eventDate": "2025-12-20",
  "organizationName": "KLH Bachupally",
  "clubName": "ACM x KLH",
  "issueDate": "2025-12-20T10:30:00.000Z",
  "isValid": true,
  "createdAt": "2025-12-20T10:30:00.000Z",
  "updatedAt": "2025-12-20T10:30:00.000Z"
}
```

## ✅ Success Checklist

- [ ] MongoDB connection string added to `.env.local`
- [ ] Dev server restarted after adding env file
- [ ] Generated certificates through UI
- [ ] Console shows "Successfully registered X certificates"
- [ ] Copied verification URL from console
- [ ] Opened URL in browser - shows certificate details
- [ ] Tested invalid URL - shows error message
- [ ] Checked MongoDB Atlas - sees certificate records

## 🎯 Next Steps (After Testing)

Once verification works:
1. [ ] Add verification links to email notifications
2. [ ] (Optional) Embed verification URL on certificate images
3. [ ] (Optional) Add QR code with verification link
4. [ ] Deploy to production
5. [ ] Add authentication system (if needed)

---

**Need help?** Check the console logs - they show exactly what's happening at each step!
