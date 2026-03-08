# Certificate Quota System - Complete Design Document

**Date**: March 6, 2026  
**Status**: Planning Phase  
**Feature**: Certificate Generation Quota Management for Corporate Organizations  
**Discussion**: Complete conversation log and requirements analysis

---

## Table of Contents

1. [Initial Requirements](#initial-requirements)
2. [Codebase Analysis](#codebase-analysis)
3. [Requirements Evolution](#requirements-evolution)
4. [Alternative Approaches](#alternative-approaches)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Plan](#implementation-plan)
7. [API Specifications](#api-specifications)
8. [Key Design Decisions](#key-design-decisions)
9. [Open Questions](#open-questions)
10. [Future Enhancements](#future-enhancements)
11. [Migration Strategy](#migration-strategy)

---

## Initial Requirements

### Original Question
> "During the process of upgrading an individual user to corporate from admin, I want to know that for certain users/organizations, can we be able to limit the generation of certificates to a certain number? Like I want to only have a certain 'X' company to only generate up to some N certificates like limit? Is that possible?"

### Initial Understanding
- Need to limit certificate generation per organization
- Apply to corporate organizations specifically
- Admin should control these limits
- Hard enforcement (block generation when limit reached)

---

## Codebase Analysis

### Current System Architecture

#### 1. Admin Upgrade Workflow

**Direct User Upgrade:**
- Endpoint: `PATCH /api/admin/users/[id]` ([app/api/admin/users/[id]/route.ts](app/api/admin/users/[id]/route.ts))
- Updates `userType` field directly (corporate, individual, academic)
- Requires `admin-session` cookie authentication
- Returns updated user object

**Access Request Flow (User-Initiated):**
- `POST /api/access-requests` - User requests upgrade
- `GET /api/admin/access-requests` - Admin views pending requests
- `PATCH /api/admin/access-requests` - Admin approves/denies
- On approval: Updates User.userType, emits WebSocket `promotion-approved` event
- Logs to AdminLog collection with IP, user agent, geo data
- UI: [components/admin/AccessRequestDetailsPanel.tsx](components/admin/AccessRequestDetailsPanel.tsx)

#### 2. Certificate Generation Flow

**Models:**

**Certificate Model** ([models/Certificate.ts](models/Certificate.ts)):
```typescript
{
  verificationId: string (UUID, indexed)
  certificateHash: string (SHA-256)
  recipientEmail: string
  eventId: ObjectId
  issueDate: Date
  templateS3Key: string
  fieldConfiguration: array
  metadata: {
    batchId: string
    generatedBy: ObjectId
    templateUsed: string
  }
}
```

**CertificateHistory Model** ([models/CertificateHistory.ts](models/CertificateHistory.ts)):
```typescript
{
  batchId: string
  certificateCount: number  // KEY FOR QUOTA TRACKING
  totalSize: number
  certificateIds: [ObjectId]
  organizationId: ObjectId
  clubId: ObjectId
  privateOrgId: ObjectId
  userId: ObjectId
  createdAt: Date
}
```
- Indexes: `{userId:1, createdAt:-1}`, `{organizationId:1, createdAt:-1}`

**Generation Pipeline:**

1. **Register** - `POST /api/certificates/register` ([app/api/certificates/register/route.ts](app/api/certificates/register/route.ts))
   - Input: Array of certificate data + metadata
   - Creates individual Certificate documents
   - Updates Event model with templateS3Key + fieldConfiguration
   - **QUOTA CHECKPOINT**: Check before this step

2. **Send** - `POST /api/send-certificates` ([app/api/send-certificates/route.ts](app/api/send-certificates/route.ts))
   - Calls `sendBulkCertificates()` from email-service
   - Providers: gmail, resend, senement (GoCertiflo)
   - Delivery modes: "link-only" (URL) or "attachment" (PDF)

3. **Verify** - `GET /api/certificates/verify/[id]`

4. **My Certificates** - `GET /api/my-certificates` (filters by recipientEmail)

#### 3. Database Schema

**User Model** ([models/User.ts](models/User.ts)):
```typescript
{
  name: string
  email: string (unique)
  userType: 'corporate' | 'individual' | 'academic' | null
  organizationId: ObjectId  // Academic - Organization reference
  privateOrgId: ObjectId    // Corporate - PrivateOrg reference
  clubs: [ObjectId]
  isSuspended: boolean
  suspendedUntil: Date
  createdAt: Date
  updatedAt: Date
}
```

**Organization Model** ([models/Organization.ts](models/Organization.ts)) - Academic:
```typescript
{
  name: string (unique)
  type: 'college' | 'university' | 'custom'
  city: string
  state: string
  country: string
  website: string
  description: string
  createdBy: ObjectId
  members: [ObjectId]
  clubs: [ObjectId]
}
```

**PrivateOrg Model** ([models/PrivateOrg.ts](models/PrivateOrg.ts)) - Corporate:
```typescript
{
  name: string
  slug: string (unique, indexed)
  ownerId: ObjectId
  allowedUsers: [ObjectId]
  isPublic: boolean
  website: string
  description: string
  logoUrl: string
}
```
⚠️ **No existing quota fields** - Need to add

**Event Model** ([models/Event.ts](models/Event.ts)):
```typescript
{
  name: string
  date: Date
  clubId: ObjectId (optional - for academic)
  privateOrgId: ObjectId (optional - for corporate)
  createdBy: ObjectId
  certificatesGenerated: number  // Can use for simple tracking
  templateS3Key: string (optional)
  fieldConfiguration: [{
    id: string
    name: string
    x: number
    y: number
    fontSize: number
    // ...
  }]
}
```

**AccessRequest Model** ([models/AccessRequest.ts](models/AccessRequest.ts)):
```typescript
{
  userId: ObjectId
  currentType: 'corporate' | 'individual' | null
  requestedType: 'corporate' | 'individual'
  reason: string
  status: 'pending' | 'approved' | 'denied'
  reviewedBy: ObjectId
  reviewedAt: Date
}
```

#### 4. Existing Quota & Limit Systems

**Email Rate Limiting** ([lib/email-service.tsx](lib/email-service.tsx)):
- Rate: 5 emails/second
- Gmail Free Tier: 500/day limit
- Implementation: In-memory queue with 15-min window

**Admin Rate Limiting** ([app/api/validate-gmail-credentials/route.ts](app/api/validate-gmail-credentials/route.ts)):
- Mechanism: Map-based in-memory counter
- Window: 15 minutes
- Limit: 5 attempts per IP

**Dashboard Statistics** ([app/api/dashboard/stats/route.ts](app/api/dashboard/stats/route.ts)):
- Activity Score = events*2 + certificates + organizations*3
- Trust Score levels: Low/Medium/High
- Account age-based restrictions

---

## Requirements Evolution

### Phase 1: Initial Clarification Questions

**Question Set 1:**
1. Should limit apply to Corporate only, Academic only, or Both?
   - **Answer**: Corporate only

2. Should limit be Monthly (resetting) or Total Lifetime?
   - **Answer**: "Let me be able to handle the limit from the admin dashboard"

3. How should admins set limits - Tier-based or Custom per-org?
   - **Answer**: Custom per-org

4. What happens when limit reached - Hard block, Allow with warning, or Admin approval?
   - **Answer**: Hard block

5. When should limit be set - During upgrade or Separate action?
   - **Answer**: Separate action

### Phase 2: Wallet-Based System Clarification

**User's Key Statement:**
> "So I wanted to know like a wallet we assign some 'n' limit from which during the event is created we ask them to select the certificates they want for that particular event which subtracts them from the total limit assigned and once an event is used they must get permission from us to re-open that event and generate more certificates"

**Selected Notification Approach:**
- **Question**: Notifications when quota approaches/reaches limit?
- **Answer**: Option B - In-app notifications (simpler)

**Dashboard List View:**
- **Question**: Should admin have list view of all orgs with quotas?
- **Answer**: Option A - Yes, dedicated page

### Final Requirements Summary

**Wallet-Based Quota Allocation System:**
1. Admin assigns total certificate quota to organization (the "wallet")
2. When creating event, user allocates portion of available quota
3. Allocation is subtracted from organization's available balance
4. Certificate generation limited by event's allocated quota
5. When event quota exhausted, event becomes locked
6. User can request admin to reopen event with additional quota
7. Admin approves/denies reopen requests
8. Hard block enforcement - no generation when quota exceeded

---

## Alternative Approaches

### Option 1: Simple Wallet System ✓ (Selected for Initial Implementation)

**Description:**
- Organization gets total quota ("wallet balance")
- Users manually allocate to events during creation
- Once event quota exhausted, request admin approval for more

**Pros:**
- Simple and straightforward implementation
- Full control over allocations
- Clear accountability per event
- Easy to understand for users

**Cons:**
- Manual overhead for allocation
- No automatic recovery of unused quota
- Quota can get "trapped" in unused events

**Use Case:**
Best for organizations with predictable event patterns and sizes.

---

### Option 2: Tier-Based with Auto-Allocation

**Description:**
- Define tiers: Free (100/month), Pro (1000/month), Enterprise (unlimited)
- No per-event allocation - organization-wide pool only
- Monthly auto-reset of quota

**Pros:**
- Easier for users (no allocation decisions)
- Subscription-ready business model
- Simple monthly billing integration
- No quota fragmentation

**Cons:**
- Less granular control
- Single event can consume entire quota
- Can't prevent poor quota distribution
- Requires billing/subscription system

**Use Case:**
Best for SaaS pricing model with subscription tiers.

---

### Option 3: Hybrid Wallet + Rollback (Recommended for Future)

**Description:**
- Combine wallet allocation with unused quota recovery
- When event closes/deleted, unspent quota returns to wallet
- Admin can manually reclaim quota from inactive events
- Best of both worlds approach

**Pros:**
- Most flexible system
- No wasted quota
- Fair to users (get back unused allocation)
- Prevents gaming with closed events
- Still maintains control

**Cons:**
- More complex implementation
- Need event lifecycle management
- Potential edge cases with partial usage

**Use Case:**
Best for mature system with diverse organization needs.

**Implementation Notes:**
- Add `Event.status: 'active' | 'closed' | 'archived'`
- On event close: Calculate `remainingQuota = allocatedQuota - quotaUsed`
- Atomic operation: `PrivateOrg.quotaUsed -= remainingQuota`
- Add "Close Event" button in UI with confirmation
- Admin panel: "Reclaim Quota" action for events

---

### Option 4: Pay-Per-Use Tracking Only

**Description:**
- No hard limits, just track usage
- Admin reviews monthly and bills accordingly
- Soft warnings at thresholds

**Pros:**
- Best user experience (no blocking)
- No allocation friction
- Flexible for variable usage patterns
- Good for building customer trust initially

**Cons:**
- Risk of overuse/abuse
- Manual billing process required
- Can't enforce limits proactively
- Payment collection challenges

**Use Case:**
Best for enterprise clients with established trust and payment terms.

---

## Technical Architecture

### Database Schema Changes

#### PrivateOrg Model Extensions
```typescript
// File: models/PrivateOrg.ts

interface IPrivateOrg {
  // ... existing fields
  name: string;
  slug: string;
  ownerId: ObjectId;
  allowedUsers: ObjectId[];
  isPublic: boolean;
  
  // NEW QUOTA FIELDS
  certificateQuota: number | null;  // Total wallet balance (null = unlimited)
  quotaUsed: number;                // Total certificates allocated (not generated)
  // Note: availableQuota = certificateQuota - quotaUsed (computed in queries)
  
  // Existing timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Indexes to add:
// - {slug: 1} (already exists)
// - {ownerId: 1}
// - {certificateQuota: 1, quotaUsed: 1} (for admin dashboard queries)
```

#### Event Model Extensions
```typescript
// File: models/Event.ts

interface IEvent {
  // ... existing fields
  name: string;
  date: Date;
  clubId?: ObjectId;
  privateOrgId?: ObjectId;
  createdBy: ObjectId;
  certificatesGenerated: number;
  
  // NEW QUOTA FIELDS
  allocatedQuota: number | null;    // Certificates allocated to this event from org wallet
  quotaUsed: number;                // Certificates actually generated for this event
  isLocked: boolean;                // True when quotaUsed >= allocatedQuota
  
  // NEW REOPEN REQUEST SYSTEM
  reopenRequests: [{
    requestId: string;              // UUID for tracking
    requestedBy: ObjectId;          // User who made request
    requestedAt: Date;
    additionalQuota: number;        // How many more certificates needed
    reason: string;                 // User's explanation
    status: 'pending' | 'approved' | 'denied';
    reviewedBy?: ObjectId;          // Admin who reviewed
    reviewedAt?: Date;
    adminNotes?: string;            // Admin's comments
  }];
  
  // Existing fields
  templateS3Key?: string;
  fieldConfiguration?: any[];
  createdAt: Date;
  updatedAt: Date;
}

// Indexes to add:
// - {privateOrgId: 1, isLocked: 1} (for finding locked events per org)
// - {privateOrgId: 1, createdAt: -1}
// - {'reopenRequests.status': 1} (for pending requests)
```

#### New AdminLog Entries (Extend existing model)
```typescript
// Add new action types to existing AdminLog model
enum AdminAction {
  // ... existing actions
  QUOTA_ASSIGNED = 'quota_assigned',
  QUOTA_UPDATED = 'quota_updated',
  QUOTA_RESET = 'quota_reset',
  EVENT_REOPEN_APPROVED = 'event_reopen_approved',
  EVENT_REOPEN_DENIED = 'event_reopen_denied',
}
```

---

### Key Workflows & Data Flow

#### Workflow 1: Admin Assigns Quota to Organization

```
┌─────────────┐
│   Admin     │
│  Dashboard  │
└──────┬──────┘
       │
       │ 1. Select organization
       │
       ↓
┌─────────────────────────────┐
│  Admin UI                   │
│  - Current: quota=null      │
│  - Input: New quota (500)   │
│  - Option: Reset counter    │
└──────────────┬──────────────┘
               │
               │ 2. PATCH /api/admin/organizations/[id]/quota
               │    {certificateQuota: 500, reset: false}
               ↓
┌──────────────────────────────────────┐
│  API Endpoint                        │
│  - Verify admin-session cookie       │
│  - Validate quota > quotaUsed        │
│  - Update PrivateOrg document        │
└──────────────┬───────────────────────┘
               │
               │ 3. MongoDB Update
               ↓
┌──────────────────────────────────────┐
│  PrivateOrg.updateOne({_id})         │
│  {                                   │
│    certificateQuota: 500,            │
│    // quotaUsed remains unchanged    │
│  }                                   │
└──────────────┬───────────────────────┘
               │
               │ 4. Log action
               ↓
┌──────────────────────────────────────┐
│  AdminLog.create({                   │
│    action: 'quota_assigned',         │
│    performedBy: adminId,             │
│    targetOrg: orgId,                 │
│    details: {quota: 500}             │
│  })                                  │
└──────────────────────────────────────┘
```

---

#### Workflow 2: User Creates Event with Quota Allocation

```
┌─────────────┐
│    User     │
│  Dashboard  │
└──────┬──────┘
       │
       │ 1. Click "Create Event"
       │
       ↓
┌──────────────────────────────────────┐
│  Event Creation Form                 │
│  - Event Name: "Tech Workshop"       │
│  - Date: 2026-03-15                  │
│  - Organization Wallet: 500 avail    │
│  - Allocate: [__100__] certificates  │
│  - Remaining: 400                    │
└──────────────┬───────────────────────┘
               │
               │ 2. POST /api/events
               │    {
               │      name, date, privateOrgId,
               │      allocatedQuota: 100
               │    }
               ↓
┌──────────────────────────────────────┐
│  API Validation                      │
│  1. Fetch PrivateOrg                 │
│  2. Calculate available:             │
│     available = quota - quotaUsed    │
│     available = 500 - 0 = 500        │
│  3. Check: 100 <= 500 ✓              │
└──────────────┬───────────────────────┘
               │ VALID
               │
               ↓
┌──────────────────────────────────────┐
│  Atomic Transaction                  │
│                                      │
│  Step 1: Reserve quota in wallet    │
│  PrivateOrg.updateOne(               │
│    {_id: orgId},                     │
│    {$inc: {quotaUsed: 100}}          │
│  )                                   │
│                                      │
│  Step 2: Create event with allocation│
│  Event.create({                      │
│    name: "Tech Workshop",            │
│    allocatedQuota: 100,              │
│    quotaUsed: 0,                     │
│    isLocked: false,                  │
│    privateOrgId: orgId               │
│  })                                  │
└──────────────┬───────────────────────┘
               │
               │ 3. Success response
               ↓
┌──────────────────────────────────────┐
│  Result:                             │
│  - Event created ✓                   │
│  - 100 allocated to event            │
│  - Org wallet: 500 quota, 100 used   │
│  - Available: 400                    │
└──────────────────────────────────────┘
```

**Error Cases:**
```
If allocatedQuota > available:
  → Return 403: {
      error: "Insufficient quota",
      requested: 100,
      available: 50,
      message: "Your organization only has 50 certificates available"
    }

If user not in corporate org:
  → allocatedQuota ignored, event created without quota
```

---

#### Workflow 3: Certificate Generation with Quota Enforcement

```
┌─────────────┐
│    User     │
│   Uploads   │
│  CSV Data   │
└──────┬──────┘
       │
       │ 1. POST /api/certificates/register
       │    {
       │      eventId: "abc123",
       │      certificates: [25 items]
       │    }
       ↓
┌──────────────────────────────────────┐
│  Quota Validation Pipeline           │
│                                      │
│  Step 1: Fetch Event                 │
│  event = Event.findById(eventId)     │
│                                      │
│  Step 2: Check if event is locked    │
│  if (event.isLocked) {               │
│    return 403: "Event locked"        │
│  }                                   │
│                                      │
│  Step 3: Check corporate org         │
│  if (!event.privateOrgId) {          │
│    // Academic event, no quota       │
│    proceed to generation             │
│  }                                   │
│                                      │
│  Step 4: Validate against allocation │
│  newTotal = event.quotaUsed + 25     │
│  newTotal = 15 + 25 = 40             │
│                                      │
│  if (newTotal > event.allocatedQuota)│
│    // 40 > 100? No, proceed          │
│    if (40 > 100) BLOCK               │
│                                      │
└──────────────┬───────────────────────┘
               │ VALID - Proceed
               │
               ↓
┌──────────────────────────────────────┐
│  Certificate Creation                │
│                                      │
│  FOR EACH certificate in batch:      │
│    - Generate verificationId (UUID)  │
│    - Create Certificate document     │
│    - Calculate hash                  │
│    - Store metadata                  │
│                                      │
│  Create CertificateHistory:          │
│    - batchId: UUID                   │
│    - certificateCount: 25            │
│    - privateOrgId: orgId             │
└──────────────┬───────────────────────┘
               │
               │ Success - Update counters
               ↓
┌──────────────────────────────────────┐
│  Post-Generation Updates             │
│                                      │
│  Event.updateOne(                    │
│    {_id: eventId},                   │
│    {                                 │
│      $inc: {                         │
│        quotaUsed: 25,                │
│        certificatesGenerated: 25     │
│      }                               │
│    }                                 │
│  )                                   │
│                                      │
│  // New values:                      │
│  // quotaUsed: 40                    │
│  // allocatedQuota: 100              │
│                                      │
│  if (quotaUsed >= allocatedQuota):   │
│    Event.updateOne(                  │
│      {_id: eventId},                 │
│      {isLocked: true}                │
│    )                                 │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Result Summary                      │
│  - 25 certificates created ✓         │
│  - Event quota: 40/100 used          │
│  - Event still unlocked              │
│  - Organization wallet unchanged     │
│    (quota was already reserved)      │
└──────────────────────────────────────┘
```

**Blocking Scenario:**
```
Request: 25 certificates
Event quotaUsed: 90
Event allocatedQuota: 100

newTotal = 90 + 25 = 115
115 > 100 → BLOCK

Response 403: {
  error: "Event quota exceeded",
  requested: 25,
  available: 10,
  eventQuota: {
    used: 90,
    allocated: 100,
    remaining: 10
  },
  message: "This event can only generate 10 more certificates. Request admin approval to reopen."
}
```

---

#### Workflow 4: Event Reopen Request & Admin Approval

```
┌─────────────┐
│    User     │
│  (Blocked)  │
└──────┬──────┘
       │
       │ 1. POST /api/events/[id]/reopen-request
       │    {
       │      additionalQuota: 50,
       │      reason: "More attendees registered"
       │    }
       ↓
┌──────────────────────────────────────┐
│  Reopen Request Creation             │
│                                      │
│  Event.updateOne(                    │
│    {_id: eventId},                   │
│    {$push: {                         │
│      reopenRequests: {               │
│        requestId: UUID(),            │
│        requestedBy: userId,          │
│        requestedAt: new Date(),      │
│        additionalQuota: 50,          │
│        reason: "...",                │
│        status: 'pending'             │
│      }                               │
│    }}                                │
│  )                                   │
└──────────────┬───────────────────────┘
               │
               │ 2. Trigger notification
               ↓
┌──────────────────────────────────────┐
│  WebSocket Notification              │
│  emit('reopen-request', {            │
│    eventId,                          │
│    eventName: "Tech Workshop",       │
│    orgName: "Acme Corp",             │
│    requestedQuota: 50                │
│  })                                  │
│                                      │
│  // In-app notification for admins   │
└──────────────────────────────────────┘

       ═══════════════════════════════

┌─────────────┐
│    Admin    │
│  Dashboard  │
└──────┬──────┘
       │
       │ 3. GET /api/admin/events/reopen-requests
       │    (Sees pending requests list)
       ↓
┌──────────────────────────────────────┐
│  Reopen Requests Panel               │
│                                      │
│  [Pending Requests: 1]               │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Event: Tech Workshop          │   │
│  │ Org: Acme Corp (400 available)│   │
│  │ Current: 100/100 (locked)     │   │
│  │ Requested: +50 certificates   │   │
│  │ Reason: More attendees...     │   │
│  │                               │   │
│  │ [Approve] [Deny] [Custom: __] │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
       │
       │ 4. Admin clicks "Approve"
       │
       │ PATCH /api/admin/events/[eventId]/reopen-requests/[requestId]
       │ {action: 'approve', additionalQuota: 50}
       ↓
┌──────────────────────────────────────┐
│  Approval Validation                 │
│                                      │
│  1. Fetch organization               │
│  org = PrivateOrg.findById(orgId)    │
│     quota: 500, used: 100            │
│     available: 400                   │
│                                      │
│  2. Check availability               │
│  if (50 <= 400) ✓                    │
│                                      │
└──────────────┬───────────────────────┘
               │ VALID
               │
               ↓
┌──────────────────────────────────────┐
│  Atomic Transaction                  │
│                                      │
│  Step 1: Reserve additional quota    │
│  PrivateOrg.updateOne(               │
│    {_id: orgId},                     │
│    {$inc: {quotaUsed: 50}}           │
│  )                                   │
│  // New values: quota=500, used=150  │
│                                      │
│  Step 2: Update event                │
│  Event.updateOne(                    │
│    {_id: eventId},                   │
│    {                                 │
│      $inc: {allocatedQuota: 50},     │
│      isLocked: false,                │
│      'reopenRequests.$.status':      │
│        'approved',                   │
│      'reopenRequests.$.reviewedBy':  │
│        adminId,                      │
│      'reopenRequests.$.reviewedAt':  │
│        new Date()                    │
│    }                                 │
│  )                                   │
│  // New event values:                │
│  // allocatedQuota: 150              │
│  // quotaUsed: 100                   │
│  // isLocked: false                  │
└──────────────┬───────────────────────┘
               │
               │ 5. Log & notify
               ↓
┌──────────────────────────────────────┐
│  AdminLog.create({                   │
│    action: 'event_reopen_approved',  │
│    performedBy: adminId,             │
│    targetEvent: eventId,             │
│    details: {additionalQuota: 50}    │
│  })                                  │
│                                      │
│  // WebSocket to user                │
│  emit('reopen-approved', {           │
│    eventId,                          │
│    newAllocation: 150                │
│  })                                  │
└──────────────────────────────────────┘

       ═══════════════════════════════

┌─────────────┐
│    User     │
│  (Notified) │
└──────┬──────┘
       │
       │ 6. Receives notification
       │    "Your event has been reopened with 50 additional certificates"
       │
       ↓
┌──────────────────────────────────────┐
│  User Can Now Generate               │
│  - Event quota: 100/150 used         │
│  - Can generate 50 more              │
│  - isLocked: false                   │
└──────────────────────────────────────┘
```

**Denial Workflow:**
```
Admin clicks "Deny"
  → Update reopenRequests[].status = 'denied'
  → Add admin notes
  → Notify user with reason
  → Event remains locked
  → No quota changes
```

---

## Implementation Plan

### Phase 1: Database Schema Updates (Foundation)

#### Step 1: Update PrivateOrg Model
**File**: `models/PrivateOrg.ts`

**Changes:**
```typescript
// Add new fields
certificateQuota: {
  type: Number,
  default: null,  // null = unlimited
  min: 0
},
quotaUsed: {
  type: Number,
  default: 0,
  min: 0
}

// Add validation
validate: {
  validator: function(doc) {
    if (doc.certificateQuota !== null) {
      return doc.quotaUsed <= doc.certificateQuota;
    }
    return true;
  },
  message: 'Quota used cannot exceed quota limit'
}

// Add indexes
schema.index({ certificateQuota: 1, quotaUsed: 1 });
schema.index({ ownerId: 1 });

// Add virtual field
schema.virtual('availableQuota').get(function() {
  if (this.certificateQuota === null) return Infinity;
  return this.certificateQuota - this.quotaUsed;
});
```

**Dependencies**: None  
**Testing**: Create test org, verify fields exist, test virtual field

---

#### Step 2: Update Event Model
**File**: `models/Event.ts`

**Changes:**
```typescript
// Add quota fields
allocatedQuota: {
  type: Number,
  default: null,
  min: 0
},
quotaUsed: {
  type: Number,
  default: 0,
  min: 0
},
isLocked: {
  type: Boolean,
  default: false
},

// Add reopen requests
reopenRequests: [{
  requestId: {
    type: String,
    required: true,
    default: () => uuidv4()
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  additionalQuota: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  adminNotes: String
}]

// Add indexes
schema.index({ privateOrgId: 1, isLocked: 1 });
schema.index({ 'reopenRequests.status': 1 });

// Add virtual
schema.virtual('remainingQuota').get(function() {
  if (this.allocatedQuota === null) return Infinity;
  return this.allocatedQuota - this.quotaUsed;
});
```

**Dependencies**: Step 1  
**Testing**: Create test event, verify quota fields, test reopen requests array

---

### Phase 2: Event Creation with Quota Allocation

#### Step 3: Modify Event Creation Endpoint
**File**: `app/api/events/route.ts` (or similar)

**Implementation:**
```typescript
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, date, privateOrgId, allocatedQuota, ...otherFields } = body;

    // If corporate event with quota allocation
    if (privateOrgId && allocatedQuota !== undefined) {
      // Fetch organization
      const org = await PrivateOrg.findById(privateOrgId);
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      // Check if user is member
      const user = await User.findOne({ email: session.user.email });
      if (!org.allowedUsers.includes(user._id) && !org.ownerId.equals(user._id)) {
        return NextResponse.json({ error: 'Not authorized for this organization' }, { status: 403 });
      }

      // Validate quota availability
      const available = org.certificateQuota === null 
        ? Infinity 
        : org.certificateQuota - org.quotaUsed;

      if (allocatedQuota > available) {
        return NextResponse.json({
          error: 'Insufficient quota',
          requested: allocatedQuota,
          available: available === Infinity ? 'unlimited' : available,
          message: `Your organization only has ${available} certificates available in the wallet`
        }, { status: 403 });
      }

      // Atomic transaction: Reserve quota and create event
      const mongoSession = await mongoose.startSession();
      await mongoSession.startTransaction();

      try {
        // Reserve quota in organization wallet
        await PrivateOrg.updateOne(
          { _id: privateOrgId },
          { $inc: { quotaUsed: allocatedQuota } },
          { session: mongoSession }
        );

        // Create event with allocation
        const event = await Event.create([{
          name,
          date,
          privateOrgId,
          allocatedQuota,
          quotaUsed: 0,
          isLocked: false,
          reopenRequests: [],
          createdBy: user._id,
          ...otherFields
        }], { session: mongoSession });

        await mongoSession.commitTransaction();

        return NextResponse.json({
          success: true,
          event: event[0],
          wallet: {
            allocated: allocatedQuota,
            remaining: available - allocatedQuota
          }
        }, { status: 201 });

      } catch (error) {
        await mongoSession.abortTransaction();
        throw error;
      } finally {
        mongoSession.endSession();
      }
    }

    // Non-quota event (academic or no allocation)
    const event = await Event.create({
      name,
      date,
      privateOrgId,
      createdBy: user._id,
      ...otherFields
    });

    return NextResponse.json({ success: true, event }, { status: 201 });

  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Dependencies**: Steps 1, 2  
**Testing**: Create event with/without quota, test validation, test atomic transaction

---

#### Step 4: Create Event Creation UI with Quota Allocation
**File**: New component or modify existing event creation form

**Implementation:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function EventCreationForm({ organization }) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    allocatedQuota: ''
  });
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    if (organization?.privateOrgId) {
      fetch(`/api/organizations/${organization.privateOrgId}/quota`)
        .then(res => res.json())
        .then(data => setWalletBalance(data));
    }
  }, [organization]);

  const remainingAfterAllocation = walletBalance
    ? walletBalance.available - (Number(formData.allocatedQuota) || 0)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          privateOrgId: organization.privateOrgId,
          allocatedQuota: Number(formData.allocatedQuota)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || data.error);
        return;
      }

      alert('Event created successfully!');
      // Redirect or refresh
    } catch (error) {
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Event Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Tech Workshop 2026"
          required
        />
      </div>

      {/* Event Date */}
      <div>
        <label className="block text-sm font-medium mb-2">Event Date</label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      {/* Quota Allocation (Corporate only) */}
      {organization?.userType === 'corporate' && walletBalance && (
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
          <div>
            <h3 className="font-semibold text-lg mb-2">Certificate Quota Allocation</h3>
            
            {/* Wallet Balance Display */}
            <div className="mb-4 p-3 bg-white rounded border">
              <div className="flex justify-between text-sm mb-1">
                <span>Organization Wallet</span>
                <span className="font-mono">
                  {walletBalance.used} / {walletBalance.total === null ? '∞' : walletBalance.total}
                </span>
              </div>
              <Progress 
                value={walletBalance.total ? (walletBalance.used / walletBalance.total) * 100 : 0} 
                className="h-2"
              />
              <div className="text-xs text-slate-600 mt-1">
                Available: <span className="font-semibold">{walletBalance.available === Infinity ? 'Unlimited' : walletBalance.available}</span> certificates
              </div>
            </div>

            {/* Allocation Input */}
            <label className="block text-sm font-medium mb-2">
              Allocate certificates for this event
            </label>
            <Input
              type="number"
              min="1"
              max={walletBalance.available === Infinity ? undefined : walletBalance.available}
              value={formData.allocatedQuota}
              onChange={(e) => setFormData({...formData, allocatedQuota: e.target.value})}
              placeholder="e.g., 100"
              required
            />

            {/* Real-time Calculation */}
            {formData.allocatedQuota && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span>Allocating:</span>
                  <span className="font-semibold">{formData.allocatedQuota}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining in wallet after allocation:</span>
                  <span className={`font-semibold ${remainingAfterAllocation < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {remainingAfterAllocation}
                  </span>
                </div>
              </div>
            )}

            {/* Validation Warning */}
            {remainingAfterAllocation < 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  Insufficient quota. You can only allocate up to {walletBalance.available} certificates.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <Button 
        type="submit" 
        disabled={loading || remainingAfterAllocation < 0}
        className="w-full"
      >
        {loading ? 'Creating...' : 'Create Event'}
      </Button>
    </form>
  );
}
```

**Dependencies**: Step 3  
**Testing**: Test UI rendering, real-time calculations, validation, form submission

---

### Phase 3: Certificate Generation with Event Quota Enforcement

#### Step 5: Add Event Quota Validation to Certificate Registration
**File**: `app/api/certificates/register/route.ts`

**Implementation** (Add before existing certificate creation logic):
```typescript
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, certificates } = body;
    const batchCount = certificates.length;

    // Fetch event with organization
    const event = await Event.findById(eventId).populate('privateOrgId');
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // === NEW QUOTA VALIDATION ===
    
    // Check if event is locked
    if (event.isLocked) {
      return NextResponse.json({
        error: 'Event locked',
        message: 'This event has reached its certificate quota and is locked. Please request admin approval to reopen.',
        eventQuota: {
          used: event.quotaUsed,
          allocated: event.allocatedQuota
        }
      }, { status: 403 });
    }

    // Check quota for corporate events
    if (event.privateOrgId && event.allocatedQuota !== null) {
      const newTotal = event.quotaUsed + batchCount;

      if (newTotal > event.allocatedQuota) {
        const remaining = event.allocatedQuota - event.quotaUsed;
        
        return NextResponse.json({
          error: 'Event quota exceeded',
          requested: batchCount,
          available: remaining,
          eventQuota: {
            used: event.quotaUsed,
            allocated: event.allocatedQuota,
            remaining: remaining
          },
          message: `This event can only generate ${remaining} more certificate${remaining !== 1 ? 's' : ''}. Please reduce the batch size or request admin approval for additional quota.`
        }, { status: 403 });
      }
    }

    // === EXISTING CERTIFICATE CREATION LOGIC ===
    // ... (your existing certificate creation code here)
    
    const createdCertificates = await Certificate.insertMany(certificates.map(cert => ({
      ...cert,
      eventId,
      verificationId: uuidv4(),
      // ... other fields
    })));

    // === NEW: UPDATE QUOTA COUNTERS ===
    
    if (event.privateOrgId && event.allocatedQuota !== null) {
      const updateResult = await Event.updateOne(
        { _id: eventId },
        {
          $inc: {
            quotaUsed: batchCount,
            certificatesGenerated: batchCount
          }
        }
      );

      // Check if we need to lock the event
      const updatedEvent = await Event.findById(eventId);
      if (updatedEvent.quotaUsed >= updatedEvent.allocatedQuota) {
        await Event.updateOne(
          { _id: eventId },
          { isLocked: true }
        );
      }
    }

    // Create CertificateHistory
    await CertificateHistory.create({
      batchId: uuidv4(),
      certificateCount: batchCount,
      certificateIds: createdCertificates.map(c => c._id),
      privateOrgId: event.privateOrgId,
      eventId: eventId,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      count: batchCount,
      certificates: createdCertificates,
      eventQuota: event.allocatedQuota !== null ? {
        used: event.quotaUsed + batchCount,
        allocated: event.allocatedQuota,
        remaining: event.allocatedQuota - (event.quotaUsed + batchCount)
      } : null
    }, { status: 201 });

  } catch (error) {
    console.error('Certificate registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Dependencies**: Steps 1, 2  
**Testing**: 
- Generate within limit
- Generate exactly at limit
- Attempt to exceed limit
- Verify event locking
- Test non-quota events

---

#### Step 6: Increment Event Quota Usage
_(Integrated into Step 5 above)_

**Dependencies**: Step 5  
**Testing**: Verify atomic updates, concurrent generation, counter accuracy

---

### Phase 4: Event Reopen Request System

#### Step 7: Create Event Reopen Request Endpoint
**File**: `app/api/events/[id]/reopen-request/route.ts` (NEW)

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import Event from '@/models/Event';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { additionalQuota, reason } = body;

    // Validation
    if (!additionalQuota || additionalQuota < 1) {
      return NextResponse.json({ 
        error: 'Additional quota must be at least 1' 
      }, { status: 400 });
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Please provide a detailed reason (minimum 10 characters)' 
      }, { status: 400 });
    }

    // Fetch event
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is locked
    if (!event.isLocked) {
      return NextResponse.json({ 
        error: 'Event is not locked',
        message: 'You can only request reopen for locked events'
      }, { status: 400 });
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission (event creator or org member)
    if (!event.createdBy.equals(user._id)) {
      // Check org membership if not creator
      if (event.privateOrgId) {
        const PrivateOrg = (await import('@/models/PrivateOrg')).default;
        const org = await PrivateOrg.findById(event.privateOrgId);
        
        if (!org.allowedUsers.includes(user._id) && !org.ownerId.equals(user._id)) {
          return NextResponse.json({ 
            error: 'Not authorized for this event' 
          }, { status: 403 });
        }
      } else {
        return NextResponse.json({ 
          error: 'Not authorized for this event' 
        }, { status: 403 });
      }
    }

    // Check for existing pending request
    const hasPendingRequest = event.reopenRequests.some(
      req => req.status === 'pending'
    );

    if (hasPendingRequest) {
      return NextResponse.json({
        error: 'Pending request exists',
        message: 'There is already a pending reopen request for this event'
      }, { status: 400 });
    }

    // Create reopen request
    const reopenRequest = {
      requestId: uuidv4(),
      requestedBy: user._id,
      requestedAt: new Date(),
      additionalQuota,
      reason: reason.trim(),
      status: 'pending'
    };

    await Event.updateOne(
      { _id: params.id },
      { $push: { reopenRequests: reopenRequest } }
    );

    // TODO: Trigger notification to admin (WebSocket/email)
    // globalThis.io?.emit('admin:reopen-request', {
    //   eventId: params.id,
    //   eventName: event.name,
    //   requestId: reopenRequest.requestId
    // });

    return NextResponse.json({
      success: true,
      message: 'Reopen request submitted successfully',
      requestId: reopenRequest.requestId
    }, { status: 201 });

  } catch (error) {
    console.error('Reopen request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Check reopen request status
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await Event.findById(params.id)
      .select('reopenRequests')
      .populate('reopenRequests.requestedBy', 'name email')
      .populate('reopenRequests.reviewedBy', 'name email');

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      requests: event.reopenRequests
    });

  } catch (error) {
    console.error('Reopen request fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Dependencies**: Steps 1, 2  
**Testing**: Submit request, check validation, verify storage, test permissions

---

#### Step 8: Create Admin API for Reopen Request Management
**File**: `app/api/admin/events/reopen-requests/route.ts` (NEW)

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Event from '@/models/Event';
import PrivateOrg from '@/models/PrivateOrg';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';

// GET: List all pending reopen requests
export async function GET(req: Request) {
  try {
    // Verify admin session
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session');
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    // Fetch events with pending reopen requests
    const events = await Event.find({
      'reopenRequests.status': 'pending'
    })
      .populate('privateOrgId', 'name certificateQuota quotaUsed')
      .populate('createdBy', 'name email')
      .populate('reopenRequests.requestedBy', 'name email')
      .sort({ 'reopenRequests.requestedAt': -1 });

    // Format response
    const requests = events.flatMap(event => 
      event.reopenRequests
        .filter(req => req.status === 'pending')
        .map(req => ({
          requestId: req.requestId,
          eventId: event._id,
          eventName: event.name,
          eventDate: event.date,
          organization: {
            id: event.privateOrgId?._id,
            name: event.privateOrgId?.name,
            quota: event.privateOrgId?.certificateQuota,
            used: event.privateOrgId?.quotaUsed,
            available: event.privateOrgId?.certificateQuota === null 
              ? Infinity 
              : event.privateOrgId.certificateQuota - event.privateOrgId.quotaUsed
          },
          currentQuota: {
            allocated: event.allocatedQuota,
            used: event.quotaUsed
          },
          request: {
            requestedBy: req.requestedBy,
            requestedAt: req.requestedAt,
            additionalQuota: req.additionalQuota,
            reason: req.reason
          }
        }))
    );

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Fetch reopen requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**File**: `app/api/admin/events/[eventId]/reopen-requests/[requestId]/route.ts` (NEW)

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import Event from '@/models/Event';
import PrivateOrg from '@/models/PrivateOrg';
import AdminLog from '@/models/AdminLog';

export async function PATCH(
  req: Request,
  { params }: { params: { eventId: string; requestId: string } }
) {
  try {
    // Verify admin session
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session');
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { action, adminNotes, customQuota } = body;

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch event
    const event = await Event.findById(params.eventId).populate('privateOrgId');
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find the specific request
    const request = event.reopenRequests.find(
      req => req.requestId === params.requestId && req.status === 'pending'
    );

    if (!request) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 });
    }

    // Get admin info (from admin session - you might store admin email in cookie)
    const adminEmail = JSON.parse(adminSession.value).email;
    const admin = await User.findOne({ email: adminEmail });

    if (action === 'approve') {
      const additionalQuota = customQuota || request.additionalQuota;

      // Check organization's available quota
      const org = event.privateOrgId;
      const available = org.certificateQuota === null 
        ? Infinity 
        : org.certificateQuota - org.quotaUsed;

      if (available !== Infinity && additionalQuota > available) {
        return NextResponse.json({
          error: 'Insufficient organization quota',
          requested: additionalQuota,
          available,
          message: `Organization only has ${available} certificates available`
        }, { status: 400 });
      }

      // Atomic transaction: Reserve quota and reopen event
      const mongoSession = await mongoose.startSession();
      await mongoSession.startTransaction();

      try {
        // Reserve additional quota
        await PrivateOrg.updateOne(
          { _id: org._id },
          { $inc: { quotaUsed: additionalQuota } },
          { session: mongoSession }
        );

        // Update event
        await Event.updateOne(
          { 
            _id: params.eventId,
            'reopenRequests.requestId': params.requestId
          },
          {
            $inc: { allocatedQuota: additionalQuota },
            $set: {
              isLocked: false,
              'reopenRequests.$.status': 'approved',
              'reopenRequests.$.reviewedBy': admin._id,
              'reopenRequests.$.reviewedAt': new Date(),
              'reopenRequests.$.adminNotes': adminNotes || 'Approved'
            }
          },
          { session: mongoSession }
        );

        // Log admin action
        await AdminLog.create([{
          action: 'event_reopen_approved',
          performedBy: admin._id,
          targetEvent: params.eventId,
          targetOrganization: org._id,
          details: {
            requestId: params.requestId,
            additionalQuota,
            previousAllocation: event.allocatedQuota,
            newAllocation: event.allocatedQuota + additionalQuota
          }
        }], { session: mongoSession });

        await mongoSession.commitTransaction();

        // TODO: Notify user via WebSocket/email
        // globalThis.io?.emit(`user:${request.requestedBy}`, {
        //   type: 'reopen-approved',
        //   eventId: params.eventId,
        //   additionalQuota
        // });

        return NextResponse.json({
          success: true,
          message: 'Event reopened successfully',
          event: {
            id: event._id,
            newAllocation: event.allocatedQuota + additionalQuota
          }
        });

      } catch (error) {
        await mongoSession.abortTransaction();
        throw error;
      } finally {
        mongoSession.endSession();
      }

    } else if (action === 'deny') {
      // Deny request
      await Event.updateOne(
        { 
          _id: params.eventId,
          'reopenRequests.requestId': params.requestId
        },
        {
          $set: {
            'reopenRequests.$.status': 'denied',
            'reopenRequests.$.reviewedBy': admin._id,
            'reopenRequests.$.reviewedAt': new Date(),
            'reopenRequests.$.adminNotes': adminNotes || 'Denied'
          }
        }
      );

      // Log admin action
      await AdminLog.create({
        action: 'event_reopen_denied',
        performedBy: admin._id,
        targetEvent: params.eventId,
        details: {
          requestId: params.requestId,
          reason: adminNotes
        }
      });

      // TODO: Notify user
      // globalThis.io?.emit(`user:${request.requestedBy}`, {
      //   type: 'reopen-denied',
      //   eventId: params.eventId,
      //   reason: adminNotes
      // });

      return NextResponse.json({
        success: true,
        message: 'Request denied'
      });
    }

  } catch (error) {
    console.error('Reopen request approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Dependencies**: Step 7  
**Testing**: Test approval flow, denial flow, quota validation, atomic transactions

---

#### Step 9: Create Admin UI for Reopen Requests
**File**: `components/admin/EventReopenRequestsPanel.tsx` (NEW)

_(Due to length, this is an outline - full implementation available upon request)_

**Key Features:**
- List pending reopen requests in table format
- Display event details, organization quota info
- Show requested additional quota and reason
- Approve/deny buttons with modal confirmation
- Custom quota input override
- Admin notes field
- Real-time updates

**Dependencies**: Step 8  
**Testing**: Test UI rendering, approval/denial actions, form validation

---

### Phase 5: Admin Quota Management

#### Step 10: Create Admin Organization Quota Management Endpoint
**File**: `app/api/admin/organizations/[id]/quota/route.ts` (NEW)

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PrivateOrg from '@/models/PrivateOrg';
import AdminLog from '@/models/AdminLog';
import User from '@/models/User';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin session
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session');
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { certificateQuota, resetUsed, bonusQuota } = body;

    // Get admin info
    const adminEmail = JSON.parse(adminSession.value).email;
    const admin = await User.findOne({ email: adminEmail });

    // Fetch organization
    const org = await PrivateOrg.findById(params.id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updates: any = {};
    const logDetails: any = {
      previousQuota: org.certificateQuota,
      previousUsed: org.quotaUsed
    };

    // Set new quota
    if (certificateQuota !== undefined) {
      // null = unlimited, otherwise must be >= quotaUsed
      if (certificateQuota !== null && certificateQuota < org.quotaUsed) {
        return NextResponse.json({
          error: 'Invalid quota',
          message: `New quota (${certificateQuota}) cannot be less than currently used (${org.quotaUsed})`,
          currentUsed: org.quotaUsed
        }, { status: 400 });
      }

      updates.certificateQuota = certificateQuota;
      logDetails.newQuota = certificateQuota;
    }

    // Add bonus quota
    if (bonusQuota && bonusQuota > 0) {
      if (org.certificateQuota === null) {
        return NextResponse.json({
          error: 'Cannot add bonus to unlimited quota'
        }, { status: 400 });
      }

      updates.certificateQuota = org.certificateQuota + bonusQuota;
      logDetails.bonusAdded = bonusQuota;
      logDetails.newQuota = updates.certificateQuota;
    }

    // Reset usage counter
    if (resetUsed === true) {
      updates.quotaUsed = 0;
      logDetails.usageReset = true;
    }

    // Apply updates
    await PrivateOrg.updateOne({ _id: params.id }, updates);

    // Log action
    await AdminLog.create({
      action: 'quota_assigned',
      performedBy: admin._id,
      targetOrganization: params.id,
      details: logDetails
    });

    // Fetch updated org
    const updatedOrg = await PrivateOrg.findById(params.id);

    return NextResponse.json({
      success: true,
      organization: {
        id: updatedOrg._id,
        name: updatedOrg.name,
        certificateQuota: updatedOrg.certificateQuota,
        quotaUsed: updatedOrg.quotaUsed,
        available: updatedOrg.certificateQuota === null 
          ? Infinity 
          : updatedOrg.certificateQuota - updatedOrg.quotaUsed
      }
    });

  } catch (error) {
    console.error('Quota management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Dependencies**: Steps 1, 2  
**Testing**: Set quota, add bonus, reset counter, validation tests

---

#### Step 11: Create Admin Organizations List Endpoint
**File**: `app/api/admin/organizations/route.ts` (NEW or EXTEND existing)

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import PrivateOrg from '@/models/PrivateOrg';
import Event from '@/models/Event';

export async function GET(req: Request) {
  try {
    // Verify admin session
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session');
    
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Build query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Fetch organizations with pagination
    const [organizations, total] = await Promise.all([
      PrivateOrg.find(query)
        .populate('ownerId', 'name email')
        .select('name slug certificateQuota quotaUsed ownerId createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PrivateOrg.countDocuments(query)
    ]);

    // Get event counts for each org
    const orgIds = organizations.map(org => org._id);
    const eventCounts = await Event.aggregate([
      { $match: { privateOrgId: { $in: orgIds } } },
      { $group: { _id: '$privateOrgId', count: { $sum: 1 } } }
    ]);

    const eventCountMap = new Map(
      eventCounts.map(item => [item._id.toString(), item.count])
    );

    // Format response
    const formattedOrgs = organizations.map(org => ({
      id: org._id,
      name: org.name,
      slug: org.slug,
      owner: org.ownerId,
      quota: {
        total: org.certificateQuota,
        used: org.quotaUsed,
        available: org.certificateQuota === null 
          ? Infinity 
          : org.certificateQuota - org.quotaUsed,
        percentage: org.certificateQuota === null 
          ? 0 
          : (org.quotaUsed / org.certificateQuota) * 100
      },
      eventCount: eventCountMap.get(org._id.toString()) || 0,
      createdAt: org.createdAt
    }));

    return NextResponse.json({
      organizations: formattedOrgs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetch organizations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Dependencies**: Steps 1, 2  
**Testing**: Test listing, pagination, search, data accuracy

---

#### Step 12: Create Admin Organization Quota Management UI
**Files**: 
- `app/admin/organizations/page.tsx` (NEW)
- `components/admin/OrganizationQuotaPanel.tsx` (NEW)

_(Due to length, these are outlines - full implementations available upon request)_

**Admin Organizations List Page Features:**
- Table with columns: Name, Owner, Quota (used/total), Available, Events, Actions
- Search/filter functionality
- Pagination controls
- Click row to view/edit quota
- Visual indicators (progress bars, color coding)

**Organization Quota Panel Features:**
- Display current quota and usage
- Form to set/update quota
- Add bonus quota button
- Reset usage counter button (with confirmation)
- History of quota changes
- List of organization's events with allocation details

**Dependencies**: Steps 10, 11  
**Testing**: Test CRUD operations, form validation, visual feedback

---

### Phase 6: User-Facing Displays

#### Step 13: Add Wallet Balance Display to Dashboard
**File**: Modify existing organization dashboard component

**Features:**
- Prominent quota widget showing used/available
- Progress bar or gauge visual
- List of events with allocations
- Warning banner when < 10% remaining
- Link to request more quota

**Dependencies**: Step 1  
**Testing**: Test display accuracy, responsiveness, warnings

---

#### Step 14: Add Event Quota Status to Event Pages
**File**: Modify existing event detail/management page

**Features:**
- Quota badge showing status (active/locked)
- Usage stats: X/Y certificates generated
- Progress indicator
- "Request Reopen" button when locked
- Modal form for reopen request
- Display pending/approved/denied request status

**Dependencies**: Step 7  
**Testing**: Test all event states, request submission, status updates

---

## API Specifications

### Admin Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/admin/organizations` | List all orgs with quota stats | admin-session |
| PATCH | `/api/admin/organizations/[id]/quota` | Set/update organization quota | admin-session |
| GET | `/api/admin/events/reopen-requests` | List pending reopen requests | admin-session |
| PATCH | `/api/admin/events/[eventId]/reopen-requests/[requestId]` | Approve/deny reopen request | admin-session |

### User Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/events` | Create event with quota allocation | NextAuth session |
| POST | `/api/certificates/register` | Generate certificates (quota enforced) | NextAuth session |
| POST | `/api/events/[id]/reopen-request` | Request event reopening | NextAuth session |
| GET | `/api/events/[id]/reopen-request` | Check request status | NextAuth session |
| GET | `/api/organizations/[id]/quota` | View quota status | NextAuth session |

---

## Key Design Decisions

### Decision Log

| Decision Point | Choice | Rationale | Date |
|---------------|--------|-----------|------|
| **Scope** | Corporate only (PrivateOrg) | Academic orgs have different use cases, keep unlimited for now | March 6, 2026 |
| **Allocation Model** | Wallet with per-event allocation | Provides granular control and prevents single event from draining wallet | March 6, 2026 |
| **Enforcement** | Hard block | Prevents overuse, maintains clear limits | March 6, 2026 |
| **Reopen Workflow** | Admin approval required | Maintains control initially, can switch to auto-approve later | March 6, 2026 |
| **Unused Quota** | Lost when allocated | Simpler implementation, can add recovery in Phase 2 | March 6, 2026 |
| **Quota Tracking** | Organization-wide (not per-event total) | Organizations allocate from wallet, then track per-event usage | March 6, 2026 |
| **Unlimited Handling** | `certificateQuota: null` | Null indicates unlimited to distinguish from zero | March 6, 2026 |
| **Migration** | Default to unlimited (null) | No disruption to existing organizations | March 6, 2026 |
| **Notifications** | In-app only (initial) | Email notifications can be added in Phase 2 | March 6, 2026 |

### Data Integrity Considerations

1. **Atomic Operations**: All quota reservations use MongoDB transactions to prevent race conditions
2. **Validation**: Both client and server-side validation for quota amounts
3. **Consistency**: quotaUsed in PrivateOrg represents allocated quota, not generated certificates
4. **Locking**: isLocked flag prevents generation, not just a visual indicator
5. **Audit Trail**: All admin actions logged in AdminLog collection

---

## Open Questions

### Awaiting Decision

1. **Reprints/Regeneration**
   - **Question**: Should reprinting the same certificate consume quota again?
   - **Recommendation**: No - only new certificates count, reprints are free
   - **Impact**: Requires deduplication logic in certificate registration

2. **Minimum Allocation Per Event**
   - **Question**: Should there be a minimum allocation (e.g., 10 certificates)?
   - **Recommendation**: Yes - minimum 10 to prevent quota fragmentation
   - **Impact**: Add validation in event creation, UI hint

3. **Quota Expiration**
   - **Question**: Should quotas have expiration dates (monthly/yearly renewal)?
   - **Recommendation**: Depends on business model (free vs. paid)
   - **Impact**: Requires cron job, expiration tracking, renewal system

4. **Auto-Approve Reopen Requests**
   - **Question**: Should requests auto-approve if org has available balance?
   - **Recommendation**: Yes - improves UX, admin can review after-the-fact
   - **Impact**: Add auto-approve logic in reopen request creation

5. **Academic Organizations**
   - **Question**: Should academic orgs also get quotas eventually?
   - **Recommendation**: Evaluate after corporate rollout
   - **Impact**: Same system applies, just need to enable for Organization model

6. **Billing Integration**
   - **Question**: Will this be a paid feature with tiers/billing?
   - **Impact**: Affects expiration policy, need payment gateway integration, subscription management

---

## Future Enhancements

### Phase 2: Quota Recovery & Analytics

**Priority: High**

1. **Unused Quota Recovery**
   - Add Event.status: 'active' | 'closed' | 'archived'
   - When event closes, return unspent quota to wallet
   - Admin "Reclaim Quota" action for inactive events
   
2. **Usage Analytics Dashboard**
   - Quota consumption trends over time (charts)
   - Top events by certificate generation
   - Forecast quota exhaustion date
   - Export reports for auditing/billing

3. **Smart Allocation Suggestions**
   - Calculate historical average per event type
   - "Similar events allocated X certificates"
   - Warn if allocation seems too low/high

4. **Enhanced Notifications**
   - Email alerts: Low balance (<20%), event locked, reopen approved
   - Configurable notification preferences
   - Digest emails for admins (weekly summary)

**Estimated Effort**: 2-3 weeks

---

### Phase 3: Advanced Features

**Priority: Medium**

1. **Auto-Approve Reopen Requests**
   - If organization has available balance, auto-approve up to certain threshold
   - Configurable rules per organization
   - Admin review after-the-fact

2. **Bulk Admin Operations**
   - Assign quotas to multiple organizations at once (CSV import)
   - Batch approve/deny reopen requests
   - Mass quota adjustments (e.g., seasonal bonus: +100 for all)

3. **Quota Transfer/Gifting**
   - Allow organizations to transfer unused quota
   - Temporary quota loans between organizations
   - Admin-facilitated transfers

4. **Multi-Level Quotas**
   - Organization-level + user-level limits
   - Department/team sub-allocations
   - Hierarchical quota management

**Estimated Effort**: 3-4 weeks

---

### Phase 4: Enterprise Features

**Priority: Low**

1. **Tier-Based Pricing Model**
   - Define tiers: Free, Pro, Enterprise
   - Automatic quota assignment based on tier
   - Billing integration (Stripe/PayPal)
   - Subscription management

2. **Quota Marketplace**
   - Organizations can sell/trade unused quota
   - Platform takes commission
   - Real-time pricing based on demand

3. **ML-Based Forecasting**
   - Predict certificate generation patterns
   - Recommend quota allocations
   - Anomaly detection for unusual usage

4. **Webhook Support**
   - External integrations for quota events
   - Custom workflows (Zapier, Make)
   - Real-time data sync with CRM/billing systems

**Estimated Effort**: 4-6 weeks

---

## Migration Strategy

### Existing Organizations

**Approach:** Non-disruptive migration with backward compatibility

**Steps:**

1. **Database Migration**
   ```javascript
   // Migration script
   await PrivateOrg.updateMany(
     { certificateQuota: { $exists: false } },
     {
       $set: {
         certificateQuota: null,  // Unlimited
         quotaUsed: 0
       }
     }
   );
   ```

2. **Existing Events**
   ```javascript
   await Event.updateMany(
     { allocatedQuota: { $exists: false } },
     {
       $set: {
         allocatedQuota: null,  // No limit
         quotaUsed: 0,
         isLocked: false,
         reopenRequests: []
       }
     }
   );
   ```

3. **Gradual Rollout**
   - Phase 1: Deploy code, all orgs remain unlimited
   - Phase 2: Admin assigns quotas to pilot organizations
   - Phase 3: Communicate to users about new system
   - Phase 4: Set default quotas for new organizations
   - Phase 5: Migrate remaining organizations based on usage history

4. **Communication Plan**
   - In-app announcement banner
   - Email to organization owners explaining new system
   - Documentation/FAQ page
   - Support channel for questions

5. **Rollback Plan**
   - If issues arise, set all certificateQuota to null
   - Code is backward compatible (null = unlimited)
   - No data loss

**Testing:**
- Run migration on staging database first
- Verify all organizations have quota fields
- Test new orgs and migrated orgs behave correctly
- Performance test with large datasets

---

## Reference Files & Patterns

### Core Files Modified

| File | Purpose | Changes |
|------|---------|---------|
| [models/PrivateOrg.ts](models/PrivateOrg.ts) | Corporate org schema | Add certificateQuota, quotaUsed fields |
| [models/Event.ts](models/Event.ts) | Event schema | Add allocatedQuota, quotaUsed, isLocked, reopenRequests |
| [app/api/certificates/register/route.ts](app/api/certificates/register/route.ts) | Certificate generation | Add quota validation and enforcement |
| [app/api/events/route.ts](app/api/events/route.ts) | Event creation | Add quota allocation logic |

### New Files Created

| File | Purpose |
|------|---------|
| `app/api/admin/organizations/[id]/quota/route.ts` | Admin quota management API |
| `app/api/admin/organizations/route.ts` | List organizations with quota |
| `app/api/admin/events/reopen-requests/route.ts` | List reopen requests |
| `app/api/admin/events/[eventId]/reopen-requests/[requestId]/route.ts` | Approve/deny requests |
| `app/api/events/[id]/reopen-request/route.ts` | User submits reopen request |
| `app/api/organizations/[id]/quota/route.ts` | User views quota status |
| `components/admin/EventReopenRequestsPanel.tsx` | Admin UI for requests |
| `components/admin/OrganizationQuotaPanel.tsx` | Admin UI for quota management |
| `app/admin/organizations/page.tsx` | Admin org list page |

### Reference Patterns

- **Admin Authentication**: [app/api/admin/users/[id]/route.ts](app/api/admin/users/[id]/route.ts#L10-L20) - admin-session cookie check
- **WebSocket Notifications**: Existing pattern in access request approval
- **Admin Log**: [models/AdminLog.ts](models/AdminLog.ts) - Logging pattern for audit trail
- **UI Components**: [components/admin/AccessRequestDetailsPanel.tsx](components/admin/AccessRequestDetailsPanel.tsx) - Admin panel styling
- **Email Service**: [lib/email-service.tsx](lib/email-service.tsx) - Notification sending patterns

---

## Testing Checklist

### Unit Tests

- [ ] PrivateOrg model validation (quota >= quotaUsed)
- [ ] Event model validation (quotaUsed <= allocatedQuota)
- [ ] Virtual field calculations (availableQuota, remainingQuota)
- [ ] Quota allocation validation logic
- [ ] Reopen request creation validation

### Integration Tests

- [ ] Event creation with quota allocation (success)
- [ ] Event creation with insufficient quota (failure)
- [ ] Certificate generation within quota (success)
- [ ] Certificate generation exceeding quota (blocked)
- [ ] Event auto-locking when quota exhausted
- [ ] Reopen request submission and approval flow
- [ ] Admin quota assignment
- [ ] Admin quota reset
- [ ] Atomic transaction rollback scenarios

### End-to-End Tests

- [ ] Full user workflow: Allocate → Generate → Request Reopen → Approved → Generate more
- [ ] Admin workflow: Assign quota → Monitor usage → Approve reopen
- [ ] Multiple concurrent certificate generations near quota limit
- [ ] Organization with multiple events and quota distribution
- [ ] Migration of existing organizations to quota system

### Performance Tests

- [ ] Large batch certificate generation (1000+ certs)
- [ ] Concurrent event creations with quota allocation
- [ ] Admin dashboard with 100+ organizations
- [ ] Query performance with indexes on quota fields

### Security Tests

- [ ] Unauthorized quota manipulation attempts
- [ ] Admin session validation
- [ ] User attempts to exceed quota via API manipulation
- [ ] SQL injection / NoSQL injection on quota endpoints
- [ ] Rate limiting on reopen requests

---

## Notes & Considerations

### Implementation Notes

1. **Session Memory**: This plan is stored in `/memories/session/plan.md` for reference
2. **Existing Features**: System has mature admin panel, WebSocket notifications, and email service infrastructure
3. **Database**: MongoDB with Mongoose ORM
4. **Authentication**: NextAuth for users, cookie-based for admin
5. **Frontend**: React/Next.js with shadcn/ui components

### Performance Considerations

1. **Indexing**: Added indexes on quota fields for efficient queries
2. **Aggregation**: Use MongoDB aggregation pipeline for analytics
3. **Caching**: Consider Redis caching for frequently accessed quota info (Phase 2)
4. **Pagination**: Implement for all list endpoints to handle scale

### Security Considerations

1. **Validation**: Both client and server-side validation
2. **Atomic Operations**: Prevent race conditions with transactions
3. **Admin Actions**: All logged for audit trail
4. **Rate Limiting**: Add rate limits on reopen requests to prevent spam

### UX Considerations

1. **Progressive Disclosure**: Show quota info only when relevant (corporate orgs)
2. **Clear Messaging**: Error messages explain what happened and how to resolve
3. **Visual Indicators**: Color coding, progress bars for quick status assessment
4. **Tooltips**: Explain complex concepts (wallet vs. allocation vs. usage)

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | March 6, 2026 | Initial document creation | GitHub Copilot |
| 1.1 | March 6, 2026 | Added implementation plan details | GitHub Copilot |
| 1.2 | March 6, 2026 | Added complete code examples | GitHub Copilot |

---

**Next Steps:**
1. Review and approve this design document
2. Create GitHub issues for each phase
3. Set up development branch
4. Begin Phase 1 implementation (database schema updates)

**Questions or Feedback:** Please reach out to the development team or comment on the design document.
