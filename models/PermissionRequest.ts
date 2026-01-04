import mongoose, { Schema, Document } from 'mongoose';

export interface IPermissionRequest extends Document {
  privateOrgId: mongoose.Types.ObjectId;
  requestedBy: string; // email of the member requesting permission
  requestType: 'create_event' | 'delete_event';
  eventData?: {
    eventName?: string;
    eventDescription?: string;
    eventDate?: Date;
    eventId?: mongoose.Types.ObjectId; // for delete requests
  };
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: string; // email of owner who reviewed
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionRequestSchema: Schema = new Schema(
  {
    privateOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateOrg',
      required: true,
      index: true,
    },
    requestedBy: {
      type: String,
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['create_event', 'delete_event'],
      required: true,
    },
    eventData: {
      eventName: String,
      eventDescription: String,
      eventDate: Date,
      eventId: Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
      index: true,
    },
    reviewedBy: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.PermissionRequest ||
  mongoose.model<IPermissionRequest>('PermissionRequest', PermissionRequestSchema);
