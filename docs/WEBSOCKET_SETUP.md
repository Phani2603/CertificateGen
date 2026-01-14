# WebSocket Setup & Production Notes

## Overview

This application uses WebSocket (Socket.IO) for real-time notifications, with automatic fallback to HTTP polling when WebSocket is unavailable.

## Features

### Real-time Notifications
1. **Admin Notifications**: When users request account promotions (individual → corporate)
2. **User Notifications**: When admin approves promotion requests
3. **Dynamic Island Alerts**: Visual notifications using the island-alerts component

## Development Setup

### Running with WebSocket Support

In development, use the custom server to enable WebSocket:

```bash
# Start with custom server (supports WebSocket)
npm run dev
```

The custom server (`server.ts`) runs Socket.IO alongside Next.js, enabling real-time features.

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Production Deployment

### Vercel Limitations

⚠️ **Important**: Vercel's serverless platform does NOT support custom servers or persistent WebSocket connections.

The WebSocket errors you're seeing in production:
```
WebSocket connection to 'wss://getcertificates.senement.com/socket.io/' failed
```

This is expected behavior on Vercel. The app automatically falls back to HTTP polling.

### Fallback Mechanism

When WebSocket is unavailable (production), the app uses:

1. **Admin Dashboard**: Polls `/api/admin/stats` every 10 seconds for new requests
2. **Individual Dashboard**: Polls `/api/profile` every 5 seconds to detect promotion approval

### Production Solutions

#### Option 1: Accept HTTP Polling (Current)
- ✅ Works on Vercel without changes
- ✅ No additional infrastructure needed
- ⚠️ 5-10 second delay for notifications
- ⚠️ Increased API calls

#### Option 2: Use External WebSocket Service
Services like Ably, Pusher, or Socket.IO managed hosting:

```typescript
// Example with Ably
import Ably from 'ably'
const client = new Ably.Realtime(process.env.ABLY_API_KEY)
```

#### Option 3: Deploy Custom Server
Deploy `server.ts` to a platform that supports custom servers:
- Railway
- Render
- DigitalOcean App Platform
- AWS EC2/ECS
- Google Cloud Run

Then point `NEXT_PUBLIC_SOCKET_URL` to that server.

## Current Implementation

### Files Modified

1. **`components/socket-provider.tsx`**
   - Gracefully handles missing WebSocket server
   - Provides socket context to components

2. **`app/individual-dashboard/page.tsx`**
   - Listens for `promotion-approved` WebSocket event
   - Falls back to polling user profile every 5 seconds
   - Shows Dynamic Island alert on approval

3. **`app/admin/(protected)/page.tsx`**
   - Joins admin room via WebSocket
   - Listens for `new-access-request` events
   - Falls back to polling stats every 10 seconds

4. **`app/api/access-requests/route.ts`**
   - Emits WebSocket event to admin room on new requests

5. **`app/api/admin/access-requests/route.ts`**
   - Emits WebSocket event to user room on approval
   - Updates user type in database

6. **`app/api/private-orgs/route.ts`**
   - Fixed duplicate organization name validation
   - Now calls `connectDB()` before querying database

## Testing

### Test Duplicate Organization Names

1. Create an organization with name "Test Company"
2. Try creating another with same name (case-insensitive)
3. Should see Dynamic Island error alert

### Test Promotion Workflow (Development)

With WebSocket (custom server running):

1. **User**: Submit promotion request from individual dashboard
2. **Admin**: Should see instant Dynamic Island notification
3. **Admin**: Approve request in admin panel
4. **User**: Should see instant approval notification and auto-redirect

### Test Promotion Workflow (Production)

Without WebSocket (Vercel):

1. **User**: Submit promotion request
2. **Admin**: Will see notification within 10 seconds (polling)
3. **Admin**: Approve request
4. **User**: Will detect approval within 5 seconds (polling)

## Troubleshooting

### "WebSocket connection failed" in console

This is normal in production on Vercel. The app automatically uses polling instead.

To suppress these warnings, set in production:
```env
NEXT_PUBLIC_SOCKET_URL=
```

(Leave empty to skip WebSocket initialization entirely)

### Notifications not working

1. Check that user is authenticated
2. Verify Dynamic Island alerts are visible (check z-index)
3. Check browser console for errors
4. In production, wait 5-10 seconds for polling to detect changes

### Database connection issues

If duplicate validation fails, ensure:
1. MongoDB connection is established
2. `connectDB()` is called before queries
3. Database credentials are correct in `.env`

## Future Improvements

- [ ] Implement Redis pub/sub for multi-instance deployments
- [ ] Add WebSocket health check endpoint
- [ ] Optimize polling intervals based on user activity
- [ ] Add push notifications for mobile
- [ ] Implement server-sent events (SSE) as middle ground
