import { Server as SocketIOServer, Socket } from 'socket.io'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
}

export function initSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('🔌 Client connected:', socket.id)

    // Handle authentication
    socket.on('authenticate', (data: { userId: string; email: string }) => {
      socket.userId = data.userId
      socket.userEmail = data.email
      
      // Join user's personal room
      socket.join(`user:${data.userId}`)
      
      console.log(`✅ User authenticated: ${data.email} (${data.userId})`)
      socket.emit('authenticated', { success: true })
    })

    // Join organization room
    socket.on('join-organization', (orgId: string) => {
      socket.join(`org:${orgId}`)
      console.log(`🏢 User joined organization room: ${orgId}`)
    })

    // Leave organization room
    socket.on('leave-organization', (orgId: string) => {
      socket.leave(`org:${orgId}`)
      console.log(`🏢 User left organization room: ${orgId}`)
    })

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin')
      console.log('👑 Admin joined admin room')
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)
    })
  })

  // Store io instance globally for use in API routes
  ;(global as any).io = io
}

// Helper function to emit to user
export function emitToUser(userId: string, event: string, data: any) {
  const io = (global as any).io as SocketIOServer
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
  }
}

// Helper function to emit to organization
export function emitToOrganization(orgId: string, event: string, data: any) {
  const io = (global as any).io as SocketIOServer
  if (io) {
    io.to(`org:${orgId}`).emit(event, data)
  }
}

// Helper function to emit to all admins
export function emitToAdmins(event: string, data: any) {
  const io = (global as any).io as SocketIOServer
  if (io) {
    io.to('admin').emit(event, data)
  }
}
