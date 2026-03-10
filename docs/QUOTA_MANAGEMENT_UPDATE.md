# Quota Management System - Update Documentation

**Date**: March 10, 2026  
**Status**: ✅ Implemented  
**Version**: 2.0

---

## Overview

Enhanced the admin quota management system with:
1. **Dedicated sidebar page** with full pagination
2. **Dual operation modes** (Set vs Add)
3. Following SDLC principles

---

## Navigation Structure

### **NEW: Dedicated Quota Page** 🎯

**Access:** Admin Portal → **Certificate Quotas** (sidebar)

- **Route:** `/admin/quotas`
- **Icon:** Award (🏆)
- **Position:** 4th item in sidebar (after Organizations)

### **Dashboard Summary Card**

The main dashboard now shows a **quick summary** with:
- Link to dedicated quotas page
- Quota alert banner
- Quick action items

---

## Key Improvements

### 1. **Dual Operation Modes** 🎯

Users can now choose between two quota management modes:

#### **Set Mode (Replacement)**
- **Behavior**: Replaces the total quota with a new value
- **Example**: Current quota = 100, Enter 50 → New quota = 50
- **Use Case**: Initial quota allocation, major quota adjustments, setting unlimited
- **Transaction Type**: `allocation`

#### **Add Mode (Additive)**
- **Behavior**: Adds the specified amount to the current quota
- **Example**: Current quota = 100, Add 50 → New quota = 150
- **Use Case**: Quota top-ups, incremental additions
- **Transaction Type**: `addition`
- **Restriction**: Cannot add to unlimited quota (must use Set mode)

### 2. **Pagination** 📄

- **Page Sizes**: 10, 25, 50, 100 rows per page
- **Features**:
  - Page navigation (Previous/Next)
  - Current page indicator
  - Total rows display
  - Dynamic page size selector
- **Behavior**: Automatically resets to page 1 on search/filter changes

### 3. **Enhanced UI/UX** ✨

- Clear visual distinction between Set and Add modes
- Real-time preview of new quota in Add mode
- Current quota display in modal
- Warning for unlimited quota in Add mode
- Better transaction history with color-coded badges

---

## Technical Implementation

### Frontend Changes

#### **QuotaManagement.tsx**
```typescript
// New Props
interface QuotaManagementProps {
  organizationSlug: string
  organizationName: string
  currentQuota?: number  // 🆕 Pass current quota
  onQuotaUpdated?: () => void
}

// New State
const [operationMode, setOperationMode] = useState<"set" | "add">("set")

// UI Features
- Tabs component for Set/Add mode selection
- Informational banners showing current and projected quotas
- Disabled state for Add mode when quota is unlimited
```

#### **QuotaAnalytics.tsx**
```typescript
// Pagination State
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(10)

// Paginated Data
const paginatedOrgs = filteredOrgs.slice(startIndex, endIndex)

// Pagination Controls
- Select dropdown for rows per page
- Previous/Next buttons
- Page indicator (e.g., "Page 2 of 5")
- Results summary (e.g., "Showing 11 to 20 of 47 organizations")
```

### Backend Changes

#### **API Endpoint** (`/api/admin/orgs/[slug]/quota`)

**Request:**
```json
{
  "quota": 100,
  "reason": "Monthly quota allocation",
  "mode": "add"  // 🆕 'set' or 'add'
}
```

**Validation:**
- `mode` must be "set" or "add"
- For add mode: quota must be positive (cannot be -1)
- For add mode: current quota cannot be unlimited

**Response:**
```json
{
  "success": true,
  "message": "Added 100 to quota successfully for Acme Corp",
  "data": {
    "orgName": "Acme Corp",
    "orgSlug": "acme-corp",
    "previousQuota": 500,
    "newQuota": 600,
    "amountChanged": 100,
    "mode": "add",
    "used": 234,
    "available": 366
  }
}
```

#### **Quota Service** (`lib/quota-service.ts`)

**Updated Function Signature:**
```typescript
export async function allocateOrgQuota(
  orgId: mongoose.Types.ObjectId | string,
  newQuota: number,
  adminId: mongoose.Types.ObjectId | string,
  reason: string,
  mode: 'set' | 'add' = 'set'  // 🆕 Mode parameter
): Promise<any>
```

**Transaction Types:**
- `allocation` - Set mode (replacement)
- `addition` - Add mode (additive)

---

## User Guide

### How to Set Quota (Replacement)

1. Navigate to Admin Dashboard → Certificate Quota Management
2. Click **"Manage Quota"** for an organization
3. Stay on the **"Set Quota"** tab (default)
4. Enter the new total quota amount
   - Use `-1` for unlimited
   - Enter positive number for specific limit
5. Provide a reason
6. Click **"Set Quota"**

**Example:**
- Current: 100
- Enter: 50
- Result: Quota = 50 ✅

### How to Add Quota (Additive)

1. Navigate to Admin Dashboard → Certificate Quota Management
2. Click **"Manage Quota"** for an organization
3. Switch to the **"Add Quota"** tab
4. Enter the amount to add
5. Preview the new total in the info banner
6. Provide a reason
7. Click **"Add Quota"**

**Example:**
- Current: 100
- Add: 50
- Result: Quota = 150 ✅

**Note:** Cannot add to unlimited quota - must use Set mode.

### Using Pagination

1. Use the **search bar** to filter organizations
2. Select **rows per page** from dropdown (10/25/50/100)
3. Navigate pages using **Previous/Next** buttons
4. View current page and total in the indicator

---

## Database Schema

### QuotaTransaction Model

```typescript
{
  transactionType: 'allocation' | 'addition' | 'usage' | 'refund' | 'reset'
  // 'allocation' = Set mode
  // 'addition' = Add mode ← NEW
}
```

---

## Testing Checklist

- [x] Set quota to specific number
- [x] Set quota to unlimited (-1)
- [x] Add quota to existing limited quota
- [x] Prevent adding to unlimited quota
- [x] Pagination with different page sizes
- [x] Search resets pagination
- [x] Transaction history shows correct type
- [x] Audit trail logs both modes
- [x] UI displays current quota correctly
- [x] Real-time quota preview in Add mode

---

## API Contract

### PATCH /api/admin/orgs/[slug]/quota

**Request Body:**
```typescript
{
  quota: number        // Amount (for set) or increment (for add)
  reason: string       // Required admin reason
  mode?: 'set' | 'add' // Optional, defaults to 'set'
}
```

**Validation Rules:**
- `mode === 'set'`: quota can be -1 or positive integer
- `mode === 'add'`: quota must be positive integer (> 0)
- Cannot add to unlimited quota
- Reason is always required

---

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Invalid mode | 400 | Mode must be either "set" or "add" |
| Invalid quota type | 400 | Quota must be a number |
| Add to unlimited | 400 | Cannot add to unlimited quota. Use "set" mode to change it. |
| Negative add amount | 400 | Amount to add must be a positive number |
| Organization not found | 404 | Organization not found |

---

## Migration Notes

### Breaking Changes
None - backwards compatible!

### Existing Functionality
All existing quota operations continue to work. Default mode is `set` for compatibility.

---

## Future Enhancements

- [ ] Bulk quota operations for multiple organizations
- [ ] Scheduled quota resets (monthly/yearly)
- [ ] Quota templates for different organization tiers
- [ ] Email notifications on quota changes
- [ ] Export quota history to CSV

---

## Support

For questions or issues:
- Check transaction history for audit trail
- Review admin logs for detailed error messages
- Consult `/docs/CERTIFICATE_QUOTA_SYSTEM.md` for system overview
