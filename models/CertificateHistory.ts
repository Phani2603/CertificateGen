import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ICertificateHistory extends Document {
  eventId: mongoose.Types.ObjectId
  eventName: string
  clubId?: mongoose.Types.ObjectId
  clubName?: string
  organizationId?: mongoose.Types.ObjectId
  privateOrgId?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  certificateCount: number
  totalSize: number // in bytes
  successRate: number
  batchId: string
  certificateIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const CertificateHistorySchema = new Schema<ICertificateHistory>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: false,
    },
    clubName: {
      type: String,
      required: false,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: false,
    },
    privateOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateOrg',
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    certificateCount: {
      type: Number,
      required: true,
    },
    totalSize: {
      type: Number,
      required: true,
    },
    successRate: {
      type: Number,
      default: 100,
    },
    batchId: {
      type: String,
      required: true,
      unique: true,
    },
    certificateIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
    }],
  },
  {
    timestamps: true,
  }
)

// Indexes for pagination and filtering
CertificateHistorySchema.index({ userId: 1, createdAt: -1 })
CertificateHistorySchema.index({ organizationId: 1, createdAt: -1 })
CertificateHistorySchema.index({ clubId: 1, createdAt: -1 })
// Note: batchId index is created by unique: true constraint

const CertificateHistory: Model<ICertificateHistory> =
  mongoose.models.CertificateHistory ||
  mongoose.model<ICertificateHistory>('CertificateHistory', CertificateHistorySchema)

export default CertificateHistory
