import mongoose, { Schema, Document } from 'mongoose';

export interface IContactForm extends Document {
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  emailSent: boolean;
  emailSentAt?: Date;
  readAt?: Date;
  repliedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactFormSchema = new Schema<IContactForm>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    repliedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ContactFormSchema.index({ email: 1 });
ContactFormSchema.index({ status: 1 });
ContactFormSchema.index({ createdAt: -1 });

export default mongoose.models.ContactForm || mongoose.model<IContactForm>('ContactForm', ContactFormSchema);
