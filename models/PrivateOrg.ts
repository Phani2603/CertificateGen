import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IPrivateOrg extends Document {
  name: string
  slug: string // e.g., "xyz-corp-a1b2c3"
  description?: string
  logoUrl?: string
  website?: string
  ownerId: mongoose.Types.ObjectId
  allowedUsers: mongoose.Types.ObjectId[]
  isPublic: boolean
  watermarkDisabledByAdmin?: boolean
  // Certificate Quota System
  certificateQuota: number // -1 = unlimited, positive number = limit
  certificatesUsed: number
  quotaMetadata?: {
    allocatedBy?: mongoose.Types.ObjectId | string // ObjectId or 'admin' string
    allocatedAt?: Date
    lastUpdatedBy?: mongoose.Types.ObjectId | string // ObjectId or 'admin' string
    lastUpdatedAt?: Date
    notes?: string
    // Future Phase 2 fields (optional)
    quotaType?: 'one-time' | 'monthly' | 'yearly' | 'rolling'
    resetDay?: number
    autoRefund?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

interface IPrivateOrgModel extends Model<IPrivateOrg> {
  generateSlug(name: string): Promise<string>
}

const PrivateOrgSchema = new Schema<IPrivateOrg, IPrivateOrgModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    allowedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isPublic: {
      type: Boolean,
      default: false,
    },
    watermarkDisabledByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Certificate Quota System
    certificateQuota: {
      type: Number,
      default: 0, // New orgs start with 0 quota until admin allocates
      min: -1,    // -1 = unlimited, 0+ = limited quota
      index: true, // For admin analytics queries
    },
    certificatesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    quotaMetadata: {
      allocatedBy: {
        type: Schema.Types.Mixed, // Can be ObjectId or string for cookie auth
        ref: 'User',
      },
      allocatedAt: Date,
      lastUpdatedBy: {
        type: Schema.Types.Mixed, // Can be ObjectId or string for cookie auth
        ref: 'User',
      },
      lastUpdatedAt: Date,
      notes: String,
      // Future Phase 2 fields (optional, not implemented yet)
      quotaType: {
        type: String,
        enum: ['one-time', 'monthly', 'yearly', 'rolling'],
      },
      resetDay: Number,
      autoRefund: Boolean,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure owner is always in allowedUsers
PrivateOrgSchema.pre('save', async function() {
  if (this.isNew && !this.allowedUsers.includes(this.ownerId)) {
    this.allowedUsers.push(this.ownerId)
  }
})

// Static method to generate unique slug
PrivateOrgSchema.statics.generateSlug = async function(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30)
  
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const slug = `${baseSlug}-${randomSuffix}`
  
  // Check if slug already exists
  const existing = await this.findOne({ slug })
  if (existing) {
    // Retry with new random suffix
    return (this.constructor as IPrivateOrgModel).generateSlug(name)
  }
  
  return slug
}

const PrivateOrg = (mongoose.models.PrivateOrg as IPrivateOrgModel) || 
  mongoose.model<IPrivateOrg, IPrivateOrgModel>('PrivateOrg', PrivateOrgSchema)

export default PrivateOrg
