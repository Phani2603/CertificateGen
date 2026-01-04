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
