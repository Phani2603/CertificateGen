import mongoose from 'mongoose'
import { emitToUser, emitToOrganization, emitToAdmins } from './socket-handlers'
import AccessRequest from '@/models/AccessRequest'
import Certificate from '@/models/Certificate'
import Invitation from '@/models/Invitation'
import User from '@/models/User'

let changeStreamsInitialized = false

export async function initializeChangeStreams() {
  if (changeStreamsInitialized) {
    console.log('⚡ Change streams already initialized')
    return
  }

  try {
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection...')
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve)
      })
    }

    console.log('⚡ Initializing MongoDB Change Streams...')

    // Watch Access Requests
    const accessRequestStream = AccessRequest.watch([], {
      fullDocument: 'updateLookup',
    })

    accessRequestStream.on('change', async (change) => {
      console.log('📢 Access Request change detected:', change.operationType)

      if (change.operationType === 'insert') {
        // New access request - notify admins
        const doc = change.fullDocument
        emitToAdmins('new-access-request', {
          id: doc._id,
          userEmail: doc.userEmail,
          requestedType: doc.requestedType,
          reason: doc.reason,
          createdAt: doc.createdAt,
        })
      } else if (change.operationType === 'update') {
        // Access request updated (approved/denied)
        const doc = change.fullDocument
        if (doc) {
          // Notify the user who made the request
          emitToUser(doc.userId.toString(), 'access-request-updated', {
            id: doc._id,
            status: doc.status,
            requestedType: doc.requestedType,
          })

          // Notify admins
          emitToAdmins('access-request-updated', {
            id: doc._id,
            status: doc.status,
          })
        }
      }
    })

    // Watch Certificates
    const certificateStream = Certificate.watch([], {
      fullDocument: 'updateLookup',
    })

    certificateStream.on('change', async (change) => {
      console.log('📢 Certificate change detected:', change.operationType)

      if (change.operationType === 'insert') {
        const doc = change.fullDocument
        
        // Notify the recipient
        if (doc.recipientEmail) {
          // Find user by email
          const user = await User.findOne({ email: doc.recipientEmail })
          if (user) {
            emitToUser(user._id.toString(), 'new-certificate', {
              id: doc._id,
              eventName: doc.eventName,
              organizationName: doc.organizationName,
              recipientName: doc.recipientName,
              verificationId: doc.verificationId,
            })
          }
        }

        // Notify organization members
        if (doc.privateOrgId) {
          emitToOrganization(doc.privateOrgId.toString(), 'certificate-issued', {
            id: doc._id,
            eventName: doc.eventName,
            recipientName: doc.recipientName,
            count: 1,
          })
        }
      }
    })

    // Watch Invitations
    const invitationStream = Invitation.watch([], {
      fullDocument: 'updateLookup',
    })

    invitationStream.on('change', async (change) => {
      console.log('📢 Invitation change detected:', change.operationType)

      if (change.operationType === 'insert') {
        // New invitation created
        const doc = change.fullDocument
        emitToOrganization(doc.organizationId.toString(), 'invitation-sent', {
          id: doc._id,
          email: doc.email,
          status: doc.status,
        })
      } else if (change.operationType === 'update') {
        // Invitation updated (accepted/declined)
        const doc = change.fullDocument
        if (doc) {
          emitToOrganization(doc.organizationId.toString(), 'invitation-updated', {
            id: doc._id,
            email: doc.email,
            status: doc.status,
          })
        }
      }
    })

    changeStreamsInitialized = true
    console.log('✅ MongoDB Change Streams initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing change streams:', error)
    // Retry after 5 seconds
    setTimeout(initializeChangeStreams, 5000)
  }
}

// Handle stream errors
function handleStreamError(streamName: string, error: any) {
  console.error(`❌ ${streamName} stream error:`, error)
  // Attempt to reinitialize
  changeStreamsInitialized = false
  setTimeout(initializeChangeStreams, 5000)
}
