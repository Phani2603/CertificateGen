import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId
  actorType: 'user' | 'admin'
  actorId?: mongoose.Types.ObjectId | null
  actorEmail?: string
  action: string
  category?: 'auth' | 'profile' | 'security' | 'admin' | 'data'
  description?: string
  meta?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorType: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
      default: 'admin',
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    actorEmail: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['auth', 'profile', 'security', 'admin', 'data'],
      default: 'admin',
    },
    description: {
      type: String,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

UserActivitySchema.index({ userId: 1, createdAt: -1 })
UserActivitySchema.index({ action: 1, createdAt: -1 })

const UserActivity: Model<IUserActivity> =
  mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema)

export default UserActivity
