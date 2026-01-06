# Real-Time Notifications with Socket.io

This application now features **real-time notifications** using Socket.io and MongoDB Change Streams, eliminating the need for manual page refreshes.

## 🚀 Features Implemented

### 1. **Socket.io Server Setup**
- Custom server with Next.js integration ([server.ts](server.ts))
- WebSocket server running alongside Next.js
- Automatic reconnection and fallback to polling

### 2. **MongoDB Change Streams**
- Real-time database monitoring ([lib/change-streams.ts](lib/change-streams.ts))
- Watches for changes in:
  - Access Requests
  - Certificates
  - Invitations
  - User updates

### 3. **Real-Time Features**

#### Admin Dashboard
- 🔔 Instant notification when new access requests arrive
- 🔄 Live updates when requests are approved/denied
- No need to refresh the page

#### Individual Dashboard
- 📜 Automatic notification when new certificates are received
- Real-time certificate list updates
- Toast notifications for user feedback

#### Organization Dashboard
- 👥 Live updates when invitations are sent
- 🎉 Instant notification when members accept invitations
- Real-time member list synchronization

## 🏗️ Architecture

```
Client Browser
     ↓
Socket Provider (React Context)
     ↓
Socket.io Client
     ↓
WebSocket Connection
     ↓
Socket.io Server (server.ts)
     ↓
MongoDB Change Streams
     ↓
Database Changes → Emit Events
```

## 📂 Key Files

### Server-Side
- **[server.ts](server.ts)** - Custom Next.js server with Socket.io
- **[lib/socket-handlers.ts](lib/socket-handlers.ts)** - Socket event handlers and room management
- **[lib/change-streams.ts](lib/change-streams.ts)** - MongoDB Change Streams setup

### Client-Side
- **[components/socket-provider.tsx](components/socket-provider.tsx)** - React context for Socket.io
- **[app/layout.tsx](app/layout.tsx)** - Wrapped with SocketProvider
- **[app/admin/(protected)/requests/page.tsx](app/admin/(protected)/requests/page.tsx)** - Admin page with real-time updates
- **[components/dashboard/individual/MyCertificatesSection.tsx](components/dashboard/individual/MyCertificatesSection.tsx)** - Real-time certificates
- **[components/dashboard/corporate/InvitationsSection.tsx](components/dashboard/corporate/InvitationsSection.tsx)** - Real-time invitations

## 🎨 Admin User Details Panel

Created a polished **AWS-style UI** component for viewing user access requests:

**[components/admin/UserDetailsPanel.tsx](components/admin/UserDetailsPanel.tsx)**

### Features:
- 🎯 **Beautiful gradient header** with avatar
- 📊 **Tabbed interface** (Overview, Request Details, Activity)
- 🏷️ **Color-coded badges** for status and user types
- 📋 **Dropdown menu** for additional actions
- ✅ **Large action buttons** for approve/deny
- 🎨 **Modern card-based layout**

### Usage Example:
```tsx
<UserDetailsPanel
  userId={request.userId._id}
  userEmail={request.userId.email}
  userName={request.userId.name}
  userImage={request.userId.image}
  userType={request.userId.userType}
  requestedType={request.requestedType}
  reason={request.reason}
  status={request.status}
  createdAt={request.createdAt}
  onApprove={() => handleAction(request._id, 'approved')}
  onDeny={() => handleAction(request._id, 'denied')}
/>
```

## 🔧 Environment Variables

Add to `.env.local`:

```env
# Socket.io Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Existing MongoDB connection
MONGODB_URI=your_mongodb_connection_string
```

## 🚀 How to Run

### Development Mode (with Socket.io):
```bash
npm run dev
```

This now runs the custom server with Socket.io support.

### Standard Next.js Dev (without Socket.io):
```bash
npm run dev:next
```

## 📡 Socket Events

### Client → Server
- `authenticate` - User authentication
- `join-organization` - Join organization room
- `leave-organization` - Leave organization room
- `join-admin` - Join admin room

### Server → Client

#### Admin Events
- `new-access-request` - New access request submitted
- `access-request-updated` - Request approved/denied

#### User Events
- `new-certificate` - New certificate issued
- `access-request-updated` - Your request was processed

#### Organization Events
- `invitation-sent` - New invitation sent
- `invitation-updated` - Invitation accepted/declined
- `certificate-issued` - New certificate in organization

## 🎯 How It Works

### Example: New Certificate Flow

1. **Admin sends certificate** → Saved to MongoDB
2. **MongoDB Change Stream** detects insert
3. **Server emits event** to user's room: `new-certificate`
4. **Client receives event** → Shows toast notification
5. **Component refreshes** → Certificate appears in list
6. **No page refresh needed!** ✨

### Example: Access Request Flow

1. **User submits request** → Saved to MongoDB
2. **Change Stream** detects insert
3. **Server emits** to admin room: `new-access-request`
4. **Admin sees notification** → Request appears instantly
5. **Admin approves** → API updates MongoDB
6. **Change Stream** detects update
7. **Server emits** to user: `access-request-updated`
8. **User gets notified** → Account upgraded!

## 🔒 Security

- ✅ User authentication required for socket connection
- ✅ Room-based isolation (users can only receive their own notifications)
- ✅ Server-side validation of socket events
- ✅ CORS configured for production

## 📊 Monitoring

Socket connections are logged:
```
🔌 Client connected: abc123
✅ User authenticated: user@example.com (userId)
🏢 User joined organization room: org-id
👑 Admin joined admin room
📢 Access Request change detected: insert
```

## 🎨 UI Components Used

All components follow shadcn/ui design system:
- Card, CardHeader, CardContent
- Badge (with custom colors)
- Avatar, AvatarImage, AvatarFallback
- Tabs, TabsList, TabsTrigger, TabsContent
- Button (with variants)
- DropdownMenu
- ScrollArea
- Separator

## 🐛 Troubleshooting

### Socket not connecting?
1. Check that server is running with `npm run dev`
2. Verify NEXT_PUBLIC_SOCKET_URL in `.env.local`
3. Check browser console for connection errors

### Change Streams not working?
1. Ensure MongoDB is replica set (required for change streams)
2. Check MongoDB connection in server logs
3. Verify models are imported correctly

### Notifications not showing?
1. Check that user is authenticated
2. Verify socket connection in browser dev tools
3. Check server logs for emitted events

## 🚀 Production Deployment

### Requirements:
- MongoDB Replica Set (for change streams)
- WebSocket support on hosting platform
- Updated NEXT_PUBLIC_SOCKET_URL to production domain

### Recommended Platforms:
- Vercel (with custom server)
- Railway
- Render
- AWS EC2 / ECS

## 📝 Next Steps

Potential enhancements:
- [ ] Add typing indicators
- [ ] Add online/offline status
- [ ] Add read receipts for notifications
- [ ] Add push notifications (browser)
- [ ] Add notification preferences
- [ ] Add notification history panel

## 🎉 Success!

Your application now has production-ready real-time notifications without polling or manual refreshes!

---

**Built with**: Next.js 16, Socket.io, MongoDB Change Streams, TypeScript, shadcn/ui
