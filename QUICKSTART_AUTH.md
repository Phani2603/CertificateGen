# 🚀 Quick Start - Authentication

## ⏱️ 5-Minute Setup (Minimum Viable Auth)

### Step 1: Add SECRET (1 minute)
Add this to `.env.local`:
```bash
AUTH_SECRET=UVwPSU/saGNkLBkevhJpOGUqNTtdcDfOmVNd4pA6Vm0=
```

### Step 2: Start Server (1 minute)
```bash
npm run dev
```

### Step 3: Test Email/Password Auth (3 minutes)
1. Go to `http://localhost:3000/signup`
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
3. Click "Create account"
4. You should see the dashboard!

### ✅ You Now Have:
- ✅ Working email/password authentication
- ✅ User data in MongoDB
- ✅ Protected dashboard route
- ✅ Session management

---

## 📱 Add Google Sign-In (10 minutes)

### Quick Google OAuth Setup:

1. **Google Cloud Console:** https://console.cloud.google.com/
2. **Create Project** → Name: "CertificateAuth"
3. **APIs & Services** → **OAuth consent screen**
   - External → Fill app name → Save
4. **Credentials** → **Create OAuth Client ID**
   - Web application
   - **Redirect URI:** `http://localhost:3000/api/auth/callback/google`
   - Click Create
5. **Copy credentials to `.env.local`:**
```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```
6. **Restart server:** `npm run dev`
7. **Test:** Click "Continue with Google" on `/login`

---

## 🎯 What's Working Right Now

| Feature | Status |
|---------|--------|
| Email/Password Signup | ✅ Working |
| Email/Password Login | ✅ Working |
| Google OAuth | ⚙️ Needs credentials |
| GitHub OAuth | ⚙️ Needs credentials |
| Protected Routes | ✅ Working |
| MongoDB Storage | ✅ Working |
| Password Hashing | ✅ Working (bcrypt) |

---

## 📂 Files You Need to Know

```
├── auth.ts                          ← Auth configuration
├── middleware.ts                    ← Route protection
├── models/User.ts                   ← User data structure
├── app/
│   ├── login/page.tsx              ← Sign in page
│   ├── signup/page.tsx             ← Sign up page
│   ├── dashboard/page.tsx          ← Protected dashboard
│   └── api/
│       └── auth/
│           ├── [...nextauth]/route.ts  ← Auth handlers
│           └── signup/route.ts         ← User registration
└── .env.local                       ← Your secrets (DON'T COMMIT!)
```

---

## 🔥 Common Commands

```bash
# Start development server
npm run dev

# Check for TypeScript errors
npm run build

# Clear Next.js cache (if issues)
rm -rf .next

# Check MongoDB connection
# (Look for "MongoDB connected" in console)
```

---

## 🐛 Quick Fixes

### "Cannot connect to MongoDB"
Check `.env.local` has:
```bash
MONGODB_URI=mongodb+srv://Hashing:Hashing1@cluster0.bsjufwe.mongodb.net/certificates
```

### "Invalid credentials" when logging in
- Make sure you signed up first!
- Email is case-insensitive
- Password must match exactly

### OAuth buttons do nothing
- Add CLIENT_ID and CLIENT_SECRET to `.env.local`
- Restart server after adding environment variables

### Can't access dashboard
- You must be logged in first
- Sign up → redirects to dashboard
- Login → redirects to dashboard

---

## 🎨 Customization Points

### Change redirect after login:
In `auth.ts`, line ~50:
```ts
callbackUrl: '/your-page'  // Change from '/dashboard'
```

### Add more protected routes:
In `middleware.ts`:
```ts
matcher: ['/dashboard/:path*', '/your-route/:path*']
```

### Require email verification:
Add to `User` model:
```ts
emailVerified: { type: Date, default: null }
```

---

## 📞 Need Help?

1. **Check `NEXTAUTH_SETUP.md`** for detailed OAuth setup
2. **Check `NEXTAUTH_SUMMARY.md`** for architecture overview
3. **Console errors?** Open browser DevTools (F12)
4. **Server errors?** Check terminal running `npm run dev`

---

## ✨ Next Features to Build

```
[ ] Add sign-out button
[ ] Show user name in dashboard
[ ] Link certificates to user accounts
[ ] Add profile page
[ ] Add email verification
[ ] Add password reset
[ ] Add admin role
```

---

**🎉 Your auth system is ready! Start with email/password, add OAuth later.**

**Time to Working Auth: ~5 minutes**
**Time to Full OAuth: ~20 minutes**
