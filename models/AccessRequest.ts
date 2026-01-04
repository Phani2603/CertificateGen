import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IAccessRequest extends Document {
  userId: mongoose.Types.ObjectId
  currentType: 'corporate' | 'individual' | null
  requestedType: 'corporate' | 'individual'
  reason?: string
  status: 'pending' | 'approved' | 'denied'
  requestedAt: Date
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentType: {
      type: String,
      enum: ['corporate', 'individual', null],
      default: null,
    },
    requestedType: {
      type: String,
      enum: ['corporate', 'individual'],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient querying
AccessRequestSchema.index({ userId: 1, status: 1 })
AccessRequestSchema.index({ status: 1, requestedAt: -1 })

const AccessRequest: Model<IAccessRequest> =
  mongoose.models.AccessRequest || mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema)

export default AccessRequest
