import mongoose, { Schema, Document } from 'mongoose';

export type EmailJobStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'config_error' | 'bounced';

export interface IEmailJob extends Document {
  type: string;
  certificateId: mongoose.Types.ObjectId;
  batchId: string;
  status: EmailJobStatus;
  lockedAt?: Date;
  attempts: number;
  lastError?: string;
  data: any; // payload specific to the type (e.g., recipient info, links)
  createdAt: Date;
  updatedAt: Date;
}

const EmailJobSchema = new Schema<IEmailJob>(
  {
    type: { type: String, required: true, index: true },
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate', required: true },
    batchId: { type: String, required: true, index: true },
    
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'sending', 'sent', 'failed', 'config_error', 'bounced'],
      default: 'pending',
      index: true 
    },
    
    lockedAt: { type: Date, index: true }, // Used for timeout recovery (dead worker detection)
    
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

EmailJobSchema.index({ certificateId: 1, type: 1 }, { unique: true });

const EmailJob = mongoose.models.EmailJob || mongoose.model<IEmailJob>('EmailJob', EmailJobSchema);

export default EmailJob;
