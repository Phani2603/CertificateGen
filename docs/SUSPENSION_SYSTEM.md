# Suspension System Implementation

## Overview
Implemented a complete suspension/unsuspension system with user appeals functionality for the admin panel.

## Features Implemented

### 1. **User-Facing Suspension Modal**
- **Location**: `components/SuspensionModal.tsx`
- **Features**:
  - Beautiful modal using shadcn UI components
  - Shows suspension reason and expiry date
  - Allows users to lodge complaints/appeals
  - Success confirmation after submission
  - Contact information for support

### 2. **Automatic Suspension Detection**
- **Location**: `components/SuspensionChecker.tsx`
- **Integrated in**:
  - Individual Dashboard (`app/individual-dashboard/page.tsx`)
  - Corporate Dashboard (`app/[orgSlug]/dashboard/page.tsx`)
- **Behavior**:
  - Automatically checks suspension status on dashboard load
  - Shows modal if user is suspended
  - Prevents dashboard access while modal is open

### 3. **Suspension Appeals System**
- **Model**: `models/SuspensionAppeal.ts`
- **Fields**:
  - userId, userEmail, userName
  - message (user's complaint)
  - status (pending/reviewed/resolved)
  - adminResponse
  - reviewedBy, reviewedAt

### 4. **API Endpoints**

#### User Endpoints:
- **`GET /api/user/suspension-status`**
  - Checks if current user is suspended
  - Auto-unsuspends if suspension period expired
  
- **`POST /api/user/suspension-appeal`**
  - Allows suspended users to submit appeals
  - Validates minimum message length
  - Prevents duplicate pending appeals

#### Admin Endpoints:
- **`GET /api/admin/suspension-appeals`**
  - Fetches all suspension appeals
  - Supports filtering by userId and status
  - Pagination support

- **`POST /api/admin/users/[id]/actions`** (Updated)
  - Enhanced unsuspend action to auto-resolve pending appeals

### 5. **Admin Panel Integration**
- **Location**: `components/admin/UserDetailsPanel.tsx`
- **Features**:
  - Shows suspension appeals in Overview tab
  - Color-coded status badges (pending/reviewed/resolved)
  - Displays appeal message and admin responses
  - Auto-refreshes after unsuspend action

## How It Works

### For Users:
1. **Suspended user tries to access dashboard**
   - SuspensionChecker detects suspension status
   - Modal appears blocking dashboard access
   
2. **User can lodge a complaint**
   - Fills out appeal form (minimum 10 characters)
   - Submits to admin for review
   - Receives confirmation message

3. **After admin unsuspends**
   - User can access dashboard normally
   - Appeals are automatically marked as resolved

### For Admins:
1. **View user details in admin panel**
   - See any pending/resolved appeals in Overview tab
   - Appeals shown with status badges

2. **Suspend a user**
   - Click "Suspend" in Actions tab
   - Enter duration (default 7 days)
   - User immediately blocked from dashboards

3. **Unsuspend a user**
   - Click "Unsuspend" in Actions tab
   - All pending appeals auto-resolved
   - User can access dashboards again

## Database Schema

### SuspensionAppeal Collection
```javascript
{
  userId: ObjectId,
  userEmail: String,
  userName: String,
  message: String,
  status: 'pending' | 'reviewed' | 'resolved',
  adminResponse: String (optional),
  reviewedBy: String (optional),
  reviewedAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### User Model (existing fields used)
```javascript
{
  isSuspended: Boolean,
  suspendedUntil: Date,
  banReason: String
}
```

## UI Components Used
- Dialog (shadcn)
- Alert (shadcn)
- Button (shadcn)
- Textarea (shadcn)
- Card (shadcn)
- Badge (shadcn)
- Lucide Icons (AlertTriangle, Send, CheckCircle2)

## Security Features
- Admin authentication required for all admin endpoints
- User must be authenticated to check status or submit appeals
- Validates user is actually suspended before accepting appeals
- Prevents duplicate pending appeals

## Future Enhancements (Optional)
- Email notifications when appeals are submitted/resolved
- Admin ability to respond to appeals directly in the panel
- Appeal history tracking
- Bulk suspension management
- Suspension templates with predefined reasons
