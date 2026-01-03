# S3 CORS Configuration Guide

## Problem
Your S3 bucket is blocking requests from your application because CORS (Cross-Origin Resource Sharing) is not configured. You're seeing this error:

```
Access to image at 'https://prishaventures.s3.ap-south-2.amazonaws.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution: Configure CORS on S3 Bucket

### Step 1: Go to AWS S3 Console
1. Open [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Find your bucket: **prishaventures**
3. Click on the bucket name

### Step 2: Add CORS Configuration
1. Click on the **"Permissions"** tab
2. Scroll down to **"Cross-origin resource sharing (CORS)"**
3. Click **"Edit"**
4. Paste the following CORS configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

5. Click **"Save changes"**

### Step 3: Update for Production
When you deploy your app, add your production domain to `AllowedOrigins`:

```json
"AllowedOrigins": [
    "http://localhost:3000",
    "https://your-production-domain.com",
    "https://www.your-production-domain.com"
]
```

### Alternative: Allow All Origins (Not Recommended for Production)
If you want to allow all origins (only for testing):

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

⚠️ **Warning**: Using `"*"` for `AllowedOrigins` is not recommended for production as it allows any website to access your S3 resources.

## Verify CORS Configuration

After applying CORS configuration:

1. **Clear Browser Cache**: Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. **Hard Refresh**: Press `Ctrl+F5` (or `Cmd+Shift+R` on Mac)
3. **Try generating certificates again**
4. **Check browser console** - CORS error should be gone

## Additional Notes

### Why CORS is Needed
- Browsers block cross-origin requests by default for security
- Your app runs on `http://localhost:3000`
- S3 resources are on `https://prishaventures.s3.ap-south-2.amazonaws.com`
- These are different origins, so CORS policy must allow it

### Signed URLs and CORS
- Even with signed URLs, CORS is still required
- Signed URLs only handle authentication, not CORS
- Both must be configured for browser access

### If CORS Still Doesn't Work
1. **Check bucket policy** - Make sure it allows GetObject
2. **Verify IAM permissions** - Your IAM user needs `s3:GetObject` permission
3. **Check bucket ownership** - Public access settings shouldn't block requests
4. **Wait a few minutes** - CORS changes may take time to propagate

## Current Configuration Status

✅ AWS SDK installed  
✅ Environment variables set  
✅ S3 service created  
✅ Signed URLs working  
❌ **CORS not configured** ← Fix this now!

Once CORS is configured, your certificate templates will load correctly in both:
- Live preview during generation
- Verification page display
