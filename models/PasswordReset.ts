import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPasswordReset extends Document {
  userId: mongoose.Types.ObjectId
  email: string
  token: string
  expiresAt: Date
  used: boolean
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Tokens expire after 1 hour
      default: () => new Date(Date.now() + 60 * 60 * 1000),
    },
    used: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries and automatic cleanup
// Note: token field already has unique index from schema definition
PasswordResetSchema.index({ email: 1, createdAt: -1 })
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Prevent model recompilation during hot reload
const PasswordReset: Model<IPasswordReset> =
  (mongoose.models.PasswordReset as Model<IPasswordReset>) || 
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema)

export default PasswordReset
