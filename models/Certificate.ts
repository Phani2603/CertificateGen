import mongoose, { Schema, Document, Model } from 'mongoose'
import crypto from 'crypto'

export interface ICertificate extends Document {
  verificationId: string
  certificateHash: string
  recipientName: string
  recipientEmail: string
  eventName: string
  eventDate: string
  organizationName: string
  clubName: string
  issueDate: Date
  isValid: boolean
  metadata?: {
    templateUsed?: string
    generatedBy?: string
    batchId?: string
  }
  createdAt: Date
  updatedAt: Date
}

// Static methods interface
interface ICertificateModel extends Model<ICertificate> {
  generateHash(data: {
    recipientName: string
    recipientEmail: string
    eventName: string
    eventDate: string
    organizationName: string
    clubName: string
    issueDate: Date
  }): string
  verifyHash(certificate: ICertificate): boolean
}

const CertificateSchema = new Schema<ICertificate>(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateHash: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    eventDate: {
      type: String,
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    clubName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    metadata: {
      templateUsed: String,
      generatedBy: String,
      batchId: String,
    },
  },
  {
    timestamps: true,
  }
)

// Static method to generate hash
CertificateSchema.statics.generateHash = function (data: {
  recipientName: string
  recipientEmail: string
  eventName: string
  eventDate: string
  organizationName: string
  clubName: string
  issueDate: Date
}): string {
  const hashString = `${data.recipientName}|${data.recipientEmail}|${data.eventName}|${data.eventDate}|${data.organizationName}|${data.clubName}|${data.issueDate.toISOString()}`
  return crypto.createHash('sha256').update(hashString).digest('hex')
}

// Static method to verify hash
CertificateSchema.statics.verifyHash = function (certificate: ICertificate): boolean {
  // Ensure issueDate is a Date object
  const issueDate = certificate.issueDate instanceof Date 
    ? certificate.issueDate 
    : new Date(certificate.issueDate)
    
  const recalculatedHash = Certificate.generateHash({
    recipientName: certificate.recipientName,
    recipientEmail: certificate.recipientEmail,
    eventName: certificate.eventName,
    eventDate: certificate.eventDate,
    organizationName: certificate.organizationName,
    clubName: certificate.clubName,
    issueDate: issueDate,
  })
  
  console.log('[Hash Verification]', {
    stored: certificate.certificateHash,
    calculated: recalculatedHash,
    match: recalculatedHash === certificate.certificateHash
  })
  
  return recalculatedHash === certificate.certificateHash
}

// Prevent model recompilation during hot reload
const Certificate: ICertificateModel =
  (mongoose.models.Certificate as ICertificateModel) ||
  mongoose.model<ICertificate, ICertificateModel>('Certificate', CertificateSchema)

export default Certificate
