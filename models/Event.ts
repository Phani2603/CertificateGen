import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IEvent extends Document {
  name: string
  description?: string
  date: Date
  clubId: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  certificatesGenerated: number
  templateS3Key?: string // S3 key for certificate template
  fieldConfiguration?: Array<{
    id: string
    name: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    fontWeight: number
    color: string
    alignment: string
    maxWidth?: number
  }>
  createdAt: Date
  updatedAt: Date
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    date: {
      type: Date,
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
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
    certificatesGenerated: {
      type: Number,
      default: 0,
    },
    templateS3Key: {
      type: String,
      required: false,
    },
    fieldConfiguration: {
      type: [
        {
          id: String,
          name: String,
          x: Number,
          y: Number,
          fontSize: Number,
          fontFamily: String,
          color: String,
          align: String,
        },
      ],
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
EventSchema.index({ clubId: 1, date: -1 })
EventSchema.index({ organizationId: 1 })
EventSchema.index({ createdBy: 1 })

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema)

export default Event
