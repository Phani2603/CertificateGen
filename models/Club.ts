import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IClub extends Document {
  name: string
  description?: string
  color: string
  logoUrl?: string
  organizationId: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  members: mongoose.Types.ObjectId[]
  admins: mongoose.Types.ObjectId[]
  events: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const ClubSchema = new Schema<IClub>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    color: {
      type: String,
      default: '#3B82F6',
    },
    logoUrl: String,
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    admins: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    events: [{
      type: Schema.Types.ObjectId,
      ref: 'Event',
    }],
  },
  {
    timestamps: true,
  }
)

// Compound index for unique club names within an organization
ClubSchema.index({ organizationId: 1, name: 1 }, { unique: true })
ClubSchema.index({ members: 1 })

const Club: Model<IClub> =
  mongoose.models.Club || mongoose.model<IClub>('Club', ClubSchema)

export default Club
