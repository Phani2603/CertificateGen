import mongoose, { Schema, Document, Model } from 'mongoose'
import { IOrganization } from './Organization'
import { IClub } from './Club'

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  image?: string
  phone?: string
  bio?: string
  address?: string
  organization?: string
  bannerColor?: string // Profile banner color
  organizationId?: mongoose.Types.ObjectId | IOrganization
  privateOrgId?: mongoose.Types.ObjectId // NEW: For corporate organizations
  userType?: 'corporate' | 'individual' | 'academic' | null // NEW: User type selection
  clubs: mongoose.Types.ObjectId[] | IClub[]
  adminOfClubs: mongoose.Types.ObjectId[] | IClub[]
  provider?: string
  providerId?: string
  emailVerified?: Date
  isBlocked?: boolean
  isSuspended?: boolean
  suspendedUntil?: Date
  banReason?: string
  bannedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Not required - can sign in with OAuth
    },
    image: {
      type: String,
    },
    phone: {
      type: String,
    },
    bio: {
      type: String,
    },
    address: {
      type: String,
    },
    organization: {
      type: String,
    },
    bannerColor: {
      type: String,
      default: '#21808D',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    privateOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateOrg',
    },
    userType: {
      type: String,
      enum: ['corporate', 'individual', 'academic', null],
      default: null,
    },
    clubs: [{
      type: Schema.Types.ObjectId,
      ref: 'Club',
    }],
    adminOfClubs: [{
      type: Schema.Types.ObjectId,
      ref: 'Club',
    }],
    provider: {
      type: String,
      enum: ['credentials', 'google', 'github'],
      default: 'credentials',
    },
    providerId: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedUntil: {
      type: Date,
    },
    banReason: {
      type: String,
    },
    bannedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation during hot reload
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema)

export default User
