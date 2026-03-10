import mongoose from 'mongoose'
import PrivateOrg from '@/models/PrivateOrg'
import QuotaTransaction from '@/models/QuotaTransaction'

// Custom error classes for better error handling
export class QuotaExceededError extends Error {
  constructor(
    public available: number,
    public requested: number,
    public orgName: string
  ) {
    super(
      `Insufficient quota. Organization "${orgName}" has ${available} certificates remaining but trying to generate ${requested}.`
    )
    this.name = 'QuotaExceededError'
  }
}

export class QuotaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuotaValidationError'
  }
}

/**
 * Check if organization has enough quota for certificate generation
 * @param orgId - Organization MongoDB ObjectId
 * @param count - Number of certificates to generate
 * @returns Object with hasQuota boolean and available count
 */
export async function checkOrgQuota(
  orgId: mongoose.Types.ObjectId | string,
  count: number
): Promise<{ hasQuota: boolean; available: number; quota: number; used: number }> {
  const org = await PrivateOrg.findById(orgId).lean()
  
  if (!org) {
    throw new Error('Organization not found')
  }

  const quota = org.certificateQuota ?? -1
  const used = org.certificatesUsed ?? 0

  // -1 means unlimited
  if (quota === -1) {
    return {
      hasQuota: true,
      available: -1,
      quota: -1,
      used,
    }
  }

  const available = Math.max(0, quota - used)
  const hasQuota = available >= count

  return {
    hasQuota,
    available,
    quota,
    used,
  }
}

/**
 * Atomically consume organization quota for certificate generation
 * Uses MongoDB atomic operations to prevent race conditions
 * @param orgId - Organization MongoDB ObjectId
 * @param count - Number of certificates generated
 * @param batchId - Certificate batch ID for audit trail
 * @param userId - User who generated the certificates
 * @returns Updated organization document
 */
export async function consumeOrgQuota(
  orgId: mongoose.Types.ObjectId | string,
  count: number,
  batchId: string,
  userId: mongoose.Types.ObjectId | string
): Promise<any> {
  if (count <= 0) {
    throw new QuotaValidationError('Certificate count must be positive')
  }

  // Atomic update with quota check - prevents race conditions
  // This single operation ensures:
  // 1. Only one request succeeds when quota is low
  // 2. Quota is not exceeded even with concurrent requests
  const result = await PrivateOrg.findOneAndUpdate(
    {
      _id: orgId,
      $expr: {
        $or: [
          { $eq: ['$certificateQuota', -1] }, // Unlimited quota
          {
            $gte: [{ $subtract: ['$certificateQuota', '$certificatesUsed'] }, count],
          }, // Has enough quota
        ],
      },
    },
    {
      $inc: { certificatesUsed: count },
    },
    {
      new: true, // Return updated document
    }
  )

  // If result is null, quota was exceeded (or org not found)
  if (!result) {
    // Get org details for better error message
    const org = await PrivateOrg.findById(orgId).lean()
    if (!org) {
      throw new Error('Organization not found')
    }

    const available = Math.max(0, (org.certificateQuota ?? -1) - (org.certificatesUsed ?? 0))
    throw new QuotaExceededError(available, count, org.name)
  }

  // Create audit log transaction
  await QuotaTransaction.create({
    orgId: result._id,
    orgName: result.name,
    transactionType: 'usage',
    amount: -count, // Negative because quota is consumed
    previousQuota: result.certificateQuota,
    newQuota: result.certificateQuota,
    previousUsed: result.certificatesUsed - count,
    newUsed: result.certificatesUsed,
    certificateCount: count,
    batchId,
    generatedBy: userId,
    performedBy: userId,
    reason: `Generated ${count} certificate(s)`,
    metadata: {
      timestamp: new Date(),
    },
  })

  return result
}

/**
 * Allocate or update organization quota (admin only)
 * @param orgId - Organization MongoDB ObjectId
 * @param newQuota - New quota amount (-1 for unlimited, positive number for limit)
 * @param adminId - Admin user who is setting the quota
 * @param reason - Reason for quota allocation/change
 * @param mode - Operation mode: 'set' (replace) or 'add' (increment)
 * @returns Updated organization document
 */
export async function allocateOrgQuota(
  orgId: mongoose.Types.ObjectId | string,
  newQuota: number,
  adminId: mongoose.Types.ObjectId | string,
  reason: string,
  mode: 'set' | 'add' = 'set'
): Promise<any> {
  // Validate quota value
  if (newQuota !== -1 && (newQuota < 0 || !Number.isInteger(newQuota))) {
    throw new QuotaValidationError('Quota must be -1 (unlimited) or a positive integer')
  }

  const org = await PrivateOrg.findById(orgId)
  if (!org) {
    throw new Error('Organization not found')
  }

  const previousQuota = org.certificateQuota ?? -1
  const previousUsed = org.certificatesUsed ?? 0

  // Update organization quota
  org.certificateQuota = newQuota
  
  // Build quotaMetadata object - avoiding nested assignment to prevent Mongoose validation issues
  const existingMetadata = org.quotaMetadata || {}
  const isFirstAllocation = !existingMetadata.allocatedBy
  
  org.quotaMetadata = {
    allocatedBy: isFirstAllocation ? adminId : existingMetadata.allocatedBy,
    allocatedAt: isFirstAllocation ? new Date() : existingMetadata.allocatedAt,
    lastUpdatedBy: adminId,
    lastUpdatedAt: new Date(),
    notes: reason,
    // Preserve any existing fields
    quotaType: existingMetadata.quotaType,
    resetDay: existingMetadata.resetDay,
    autoRefund: existingMetadata.autoRefund,
  }

  await org.save()

  // Determine transaction type based on mode
  const transactionType = mode === 'add' ? 'addition' : 'allocation'
  
  // Create audit log transaction
  await QuotaTransaction.create({
    orgId: org._id,
    orgName: org.name,
    transactionType,
    amount: newQuota - previousQuota,
    previousQuota,
    newQuota,
    previousUsed,
    newUsed: previousUsed, // Usage doesn't change during allocation
    performedBy: adminId, // Can be ObjectId or 'admin' string
    reason,
    metadata: {
      timestamp: new Date(),
      adminAction: true,
    },
  })

  return org
}

/**
 * Get organization quota information
 * @param orgId - Organization MongoDB ObjectId
 * @returns Quota details including available, used, and limit
 */
export async function getOrgQuotaInfo(
  orgId: mongoose.Types.ObjectId | string
): Promise<{
  quota: number
  used: number
  available: number
  unlimited: boolean
  percentage: number | null
  orgName: string
  orgSlug: string
}> {
  const org = await PrivateOrg.findById(orgId).lean()
  
  if (!org) {
    throw new Error('Organization not found')
  }

  const quota = org.certificateQuota ?? -1
  const used = org.certificatesUsed ?? 0
  const unlimited = quota === -1

  let available = unlimited ? -1 : Math.max(0, quota - used)
  let percentage = unlimited ? null : quota > 0 ? (used / quota) * 100 : 100

  return {
    quota,
    used,
    available,
    unlimited,
    percentage,
    orgName: org.name,
    orgSlug: org.slug,
  }
}

/**
 * Get quota transaction history for organization
 * @param orgId - Organization MongoDB ObjectId
 * @param limit - Maximum number of transactions to return
 * @returns Array of quota transactions
 */
export async function getOrgQuotaHistory(
  orgId: mongoose.Types.ObjectId | string,
  limit: number = 50
): Promise<any[]> {
  const transactions = await QuotaTransaction.find({ orgId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('performedBy', 'name email')
    .populate('generatedBy', 'name email')
    .lean()

  return transactions
}

/**
 * Refund quota (Phase 3 - Future implementation)
 * For when certificates are deleted or invalidated
 */
export async function refundOrgQuota(
  orgId: mongoose.Types.ObjectId | string,
  count: number,
  reason: string,
  adminId: mongoose.Types.ObjectId | string
): Promise<any> {
  if (count <= 0) {
    throw new QuotaValidationError('Refund count must be positive')
  }

  const org = await PrivateOrg.findById(orgId)
  if (!org) {
    throw new Error('Organization not found')
  }

  const previousUsed = org.certificatesUsed ?? 0
  const newUsed = Math.max(0, previousUsed - count)

  org.certificatesUsed = newUsed
  await org.save()

  // Create audit log
  await QuotaTransaction.create({
    orgId: org._id,
    orgName: org.name,
    transactionType: 'refund',
    amount: count, // Positive because quota is returned
    previousQuota: org.certificateQuota,
    newQuota: org.certificateQuota,
    previousUsed,
    newUsed,
    certificateCount: count,
    performedBy: adminId,
    reason,
    metadata: {
      timestamp: new Date(),
      refundAction: true,
    },
  })

  return org
}
