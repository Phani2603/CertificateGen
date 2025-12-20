# OAuth Redirect URLs - Quick Reference

## 🔗 Google OAuth Setup

### Google Cloud Console
https://console.cloud.google.com/

### Authorized JavaScript Origins
Add all three:
```
http://localhost:3000
https://getcertificates.senement.com
https://certificate-gen-cyan.vercel.app
```

### Authorized Redirect URIs
Add all three:
```
http://localhost:3000/api/auth/callback/google
https://getcertificates.senement.com/api/auth/callback/google
https://certificate-gen-cyan.vercel.app/api/auth/callback/google
```

---

## 🔗 GitHub OAuth Setup

### GitHub Developer Settings
https://github.com/settings/developers

### For Local Development
**Application name:** CertificateHash Local
**Homepage URL:** `http://localhost:3000`
**Authorization callback URL:** 
```
http://localhost:3000/api/auth/callback/github
```

### For Production (getcertificates.senement.com)
**Application name:** CertificateHash Production
**Homepage URL:** `https://getcertificates.senement.com`
**Authorization callback URL:** 
```
https://getcertificates.senement.com/api/auth/callback/github
```

### For Vercel (certificate-gen-cyan.vercel.app)
**Application name:** CertificateHash Vercel
**Homepage URL:** `https://certificate-gen-cyan.vercel.app`
**Authorization callback URL:** 
```
https://certificate-gen-cyan.vercel.app/api/auth/callback/github
```

---

## 📝 Quick Copy-Paste

### All Google Redirect URIs (comma-separated)
```
http://localhost:3000/api/auth/callback/google, https://getcertificates.senement.com/api/auth/callback/google, https://certificate-gen-cyan.vercel.app/api/auth/callback/google
```

### All GitHub Callback URLs (create 3 separate apps)
```
Local: http://localhost:3000/api/auth/callback/github
Prod:  https://getcertificates.senement.com/api/auth/callback/github
Vercel: https://certificate-gen-cyan.vercel.app/api/auth/callback/github
```

---

## ⚙️ Environment Variables

### .env.local (for development)
```bash
AUTH_SECRET=UVwPSU/saGNkLBkevhJpOGUqNTtdcDfOmVNd4pA6Vm0=
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Vercel Environment Variables (for production)
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
AUTH_SECRET=UVwPSU/saGNkLBkevhJpOGUqNTtdcDfOmVNd4pA6Vm0=
NEXTAUTH_URL=https://getcertificates.senement.com  # or your Vercel URL

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id-for-production
GITHUB_CLIENT_SECRET=your-github-client-secret-for-production

MONGODB_URI=mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates
```

---

## ✅ Current Status

- ✅ AUTH_SECRET: Generated and added
- ✅ Google Client ID: Added to .env.local
- ✅ Google Client Secret: Added to .env.local
- ⚠️ GitHub OAuth: Optional, needs setup if you want GitHub login
- ✅ MongoDB: Connected and configured

---

## 🧪 Testing

After setup, test each flow:

1. **Email/Password Signup**
   - Go to `/signup`
   - Fill form and submit
   - Should create account and redirect to `/dashboard`

2. **Email/Password Login**
   - Go to `/login`
   - Enter credentials
   - Should authenticate and redirect to `/dashboard`

3. **Google OAuth**
   - Go to `/login` or `/signup`
   - Click "Continue with Google"
   - Select account
   - Should create/login user and redirect to `/dashboard`

4. **GitHub OAuth** (if configured)
   - Click "Continue with GitHub"
   - Authorize app
   - Should create/login user and redirect to `/dashboard`

---

## 🚨 Common Issues

### "redirect_uri_mismatch"
- Check that redirect URIs in Google Console match exactly
- No trailing slashes
- Correct protocol (http vs https)

### "Invalid client"
- Verify Client ID and Secret are correct
- Check they're properly saved in .env.local
- Restart dev server after adding env variables

### "User not created"
- Check MongoDB connection
- Verify MONGODB_URI in .env.local
- Check browser console for errors

---

**Your Current URLs:**
- 🏠 Local: http://localhost:3000
- 🌐 Production: https://getcertificates.senement.com
- ☁️ Vercel: https://certificate-gen-cyan.vercel.app
