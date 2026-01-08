import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IAdminLog extends Document {
  adminId?: mongoose.Types.ObjectId | null
  adminEmail: string
  action: string // e.g., 'APPROVED_ACCESS_REQUEST', 'DELETED_USER', 'EDITED_ORG'
  targetType: 'user' | 'organization' | 'privateOrg' | 'event' | 'certificate' | 'accessRequest' | 'admin'
  targetId: mongoose.Types.ObjectId
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'organization', 'privateOrg', 'event', 'certificate', 'accessRequest', 'admin'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Indexes for efficient querying
AdminLogSchema.index({ createdAt: -1 })
AdminLogSchema.index({ adminId: 1, createdAt: -1 })
AdminLogSchema.index({ targetType: 1, targetId: 1 })

const AdminLog: Model<IAdminLog> =
  mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', AdminLogSchema)

export default AdminLog
