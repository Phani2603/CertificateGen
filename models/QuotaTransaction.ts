import mongoose, { Document, Schema } from 'mongoose'

export interface IQuotaTransaction extends Document {
  orgId: mongoose.Types.ObjectId
  orgName: string // Denormalized for faster queries
  transactionType: 'allocation' | 'usage' | 'refund' | 'reset' | 'adjustment'
  amount: number // +/- change
  previousQuota: number
  newQuota: number
  previousUsed: number
  newUsed: number
  certificateCount?: number // For usage transactions
  batchId?: string // Link to CertificateHistory
  generatedBy?: mongoose.Types.ObjectId // User who generated (for usage type)
  performedBy: mongoose.Types.ObjectId | string // Admin userId or 'admin' string for cookie auth
  reason: string // Why this transaction happened
  metadata?: any // Flexible for future data (e.g., IP, user agent)
  createdAt: Date
}

const QuotaTransactionSchema = new Schema<IQuotaTransaction>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateOrg',
      required: true,
      index: true,
    },
    orgName: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['allocation', 'usage', 'refund', 'reset', 'adjustment'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    previousQuota: {
      type: Number,
      required: true,
    },
    newQuota: {
      type: Number,
      required: true,
    },
    previousUsed: {
      type: Number,
      required: true,
    },
    newUsed: {
      type: Number,
      required: true,
    },
    certificateCount: {
      type: Number,
    },
    batchId: {
      type: String,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    performedBy: {
      type: Schema.Types.Mixed, // Can be ObjectId or string ('admin' for cookie auth)
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for efficient queries
QuotaTransactionSchema.index({ orgId: 1, createdAt: -1 })
QuotaTransactionSchema.index({ transactionType: 1, createdAt: -1 })
QuotaTransactionSchema.index({ generatedBy: 1, createdAt: -1 })

const QuotaTransaction = mongoose.models.QuotaTransaction || 
  mongoose.model<IQuotaTransaction>('QuotaTransaction', QuotaTransactionSchema)

export default QuotaTransaction
