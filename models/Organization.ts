import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IOrganization extends Document {
  name: string
  type: 'college' | 'university' | 'custom'
  city?: string
  state?: string
  country?: string
  website?: string
  description?: string
  logoUrl?: string
  nirfRank?: number
  createdBy: mongoose.Types.ObjectId
  members: mongoose.Types.ObjectId[]
  clubs: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['college', 'university', 'custom'],
      required: true,
    },
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India',
    },
    website: String,
    description: String,
    logoUrl: String,
    nirfRank: Number,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    clubs: [{
      type: Schema.Types.ObjectId,
      ref: 'Club',
    }],
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
OrganizationSchema.index({ name: 1 })
OrganizationSchema.index({ type: 1 })
OrganizationSchema.index({ members: 1 })

const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema)

export default Organization
