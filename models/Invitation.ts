import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IInvitation extends Document {
  email: string
  privateOrgId: mongoose.Types.ObjectId
  privateOrgName: string
  invitedBy: mongoose.Types.ObjectId
  invitedByEmail: string
  token: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  expiresAt: Date
  acceptedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    privateOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateOrg',
      required: true,
      index: true,
    },
    privateOrgName: {
      type: String,
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedByEmail: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient querying
InvitationSchema.index({ email: 1, privateOrgId: 1, status: 1 })

// Static method to generate unique token
InvitationSchema.statics.generateToken = function(): string {
  return require('crypto').randomBytes(32).toString('hex')
}

// Check if invitation is expired
InvitationSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt
}

const Invitation: Model<IInvitation> & { generateToken: () => string } =
  (mongoose.models.Invitation as any) || mongoose.model<IInvitation>('Invitation', InvitationSchema)

export default Invitation
