# NextAuth.js Setup Guide 🔐

Complete guide to set up authentication for your certificate generation platform.

## ✅ What's Already Done

- ✅ NextAuth packages installed (`next-auth@beta`, `bcryptjs`)
- ✅ AUTH_SECRET generated
- ✅ MongoDB User model created
- ✅ Auth configuration files created
- ✅ Login/Signup pages updated with OAuth buttons
- ✅ Route protection middleware configured
- ✅ Signup API endpoint created

## 📋 What You Need to Do

### Step 1: Add AUTH_SECRET to .env.local

Open your `.env.local` file and add:

```bash
AUTH_SECRET=UVwPSU/saGNkLBkevhJpOGUqNTtdcDfOmVNd4pA6Vm0=
```

### Step 2: Set Up Google OAuth (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   
2. **Create a New Project** (or select existing)
   - Click "Select a Project" → "New Project"
   - Name: "CertificateGen Auth" or similar
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" (for testing)
   - Fill in:
     - App name: "CertificateHash"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip "Scopes" for now
   - Add test users (your email addresses)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "CertificateHash Web Client"
   - **Authorized JavaScript origins:**
     - For local development: `http://localhost:3000`
     - For production: `https://getcertificates.senement.com`
     - For Vercel: `https://certificate-gen-cyan.vercel.app`
   - **Authorized redirect URIs:**
     - Local: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://getcertificates.senement.com/api/auth/callback/google`
     - Vercel: `https://certificate-gen-cyan.vercel.app/api/auth/callback/google`
   - Click "Create"

6. **Copy Credentials**
   - You'll get a "Client ID" and "Client secret"
   - Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### Step 3: Set Up GitHub OAuth (Optional)

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   
2. **Register New OAuth App**
   - Click "New OAuth App" or "OAuth Apps" → "New Application"
   - Fill in:
     - Application name: "CertificateHash"
     - Homepage URL: `https://getcertificates.senement.com`
     - Authorization callback URL: `https://getcertificates.senement.com/api/auth/callback/github`
   - Click "Register application"

3. **For Multiple Environments** (Create separate apps):
   - **Local Development:**
     - Callback: `http://localhost:3000/api/auth/callback/github`
   - **Production:**
     - Callback: `https://getcertificates.senement.com/api/auth/callback/github`
   - **Vercel:**
     - Callback: `https://certificate-gen-cyan.vercel.app/api/auth/callback/github`

4. **Generate Client Secret**
   - Click "Generate a new client secret"
   - Add to `.env.local`:

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Step 4: Complete .env.local File

Your `.env.local` should now look like:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates

# Email (existing)
RESEND_API_KEY=re_GYi3Amiv_LLfL1PrRt81MFqpdq78JAEwF
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=2320030451@klh.edu.in
SMTP_PASS=your-gmail-app-password

# Authentication
AUTH_SECRET=UVwPSU/saGNkLBkevhJpOGUqNTtdcDfOmVNd4pA6Vm0=
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GITHUB_CLIENT_ID=your-github-client-id  # Optional
GITHUB_CLIENT_SECRET=your-github-client-secret  # Optional
```

### Step 5: Test Authentication

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test Email/Password Signup:**
   - Go to `http://localhost:3000/signup`
   - Fill in name, email, password
   - Click "Create account"
   - Should redirect to `/dashboard` if successful

3. **Test Email/Password Login:**
   - Go to `http://localhost:3000/login`
   - Enter your credentials
   - Click "Sign in"

4. **Test Google OAuth:**
   - Go to `/login` or `/signup`
   - Click "Continue with Google"
   - Select Google account
   - Should create user and redirect to `/dashboard`

5. **Test GitHub OAuth (if configured):**
   - Click "Continue with GitHub"
   - Authorize the app
   - Should redirect to `/dashboard`

## 🔒 Protected Routes

The following routes are automatically protected by middleware:
- `/dashboard/*` - Main dashboard
- `/api/certificates/*` - Certificate management APIs
- `/settings/*` - User settings (when you create it)

Users must be logged in to access these routes.

## 🚀 Deployment Setup

### For Vercel (Production):

1. **Add Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from `.env.local`
   - Make sure to update OAuth callbacks to use your production URLs

2. **Update OAuth Providers:**
   - Go back to Google Cloud Console
   - Add production URLs to authorized origins and redirects
   - Do the same for GitHub

### Important Production URLs:
- **Production:** `https://getcertificates.senement.com`
- **Vercel:** `https://certificate-gen-cyan.vercel.app`

## 🎯 Next Steps

Once authentication is working:

1. **Update Dashboard** to show user info:
   ```tsx
   import { auth } from '@/auth'
   
   export default async function DashboardPage() {
     const session = await auth()
     return <div>Welcome, {session?.user?.name}!</div>
   }
   ```

2. **Link Certificates to Users:**
   - Add `userId` field to Certificate model
   - Update certificate generation to track issuer
   - Show user's certificates in dashboard

3. **Add Profile Page:**
   - Create `/app/profile/page.tsx`
   - Allow users to update name, email
   - Show certificate generation stats

4. **Add Sign Out Button:**
   ```tsx
   import { signOut } from 'next-auth/react'
   
   <Button onClick={() => signOut({ callbackUrl: '/login' })}>
     Sign Out
   </Button>
   ```

## 🐛 Troubleshooting

### "Invalid client" error with Google:
- Double-check redirect URIs match exactly
- Make sure no trailing slashes
- Check that Google+ API is enabled

### "redirect_uri_mismatch":
- Redirect URI in Google Console must match exactly
- Format: `http://localhost:3000/api/auth/callback/google`

### User not being created:
- Check MongoDB connection in console
- Verify MONGODB_URI is correct
- Check browser console for errors

### OAuth buttons not working:
- Verify CLIENT_ID and CLIENT_SECRET are set
- Check browser console for errors
- Ensure NextAuth API route is accessible

## 📚 Resources

- **NextAuth Docs:** https://next-auth.js.org/
- **Google OAuth:** https://console.cloud.google.com/
- **GitHub OAuth:** https://github.com/settings/developers
- **MongoDB Atlas:** https://cloud.mongodb.com/

## ✨ Features You Get

- ✅ Email/password authentication with bcrypt
- ✅ Google OAuth (one-click sign in)
- ✅ GitHub OAuth (one-click sign in)
- ✅ Automatic user creation in MongoDB
- ✅ JWT session management
- ✅ Protected routes
- ✅ Server-side session checks
- ✅ Client-side session hooks
- ✅ Type-safe user data

Your authentication system is production-ready! 🎉
