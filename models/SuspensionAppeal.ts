import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ISuspensionAppeal extends Document {
    userId: mongoose.Types.ObjectId
    userEmail: string
    userName: string
    message: string
    status: 'pending' | 'reviewed' | 'resolved'
    adminResponse?: string
    reviewedBy?: string
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const SuspensionAppealSchema = new Schema<ISuspensionAppeal>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userEmail: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending',
            index: true,
        },
        adminResponse: {
            type: String,
        },
        reviewedBy: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

// Index for filtering appeals
SuspensionAppealSchema.index({ status: 1, createdAt: -1 })

const SuspensionAppeal: Model<ISuspensionAppeal> =
    mongoose.models.SuspensionAppeal ||
    mongoose.model<ISuspensionAppeal>('SuspensionAppeal', SuspensionAppealSchema)

export default SuspensionAppeal
