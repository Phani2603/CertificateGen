"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinOrganization: (orgId: string) => void
  leaveOrganization: (orgId: string) => void
  joinAdmin: () => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinOrganization: () => {},
  leaveOrganization: () => {},
  joinAdmin: () => {},
})

export function useSocket() {
  return useContext(SocketContext)
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (status !== 'authenticated' || !session?.user) {
      return
    }

    // Check if WebSocket server is available (only in development with custom server)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    
    // Skip WebSocket in production if not configured (Vercel doesn't support custom servers)
    if (!socketUrl || socketUrl === '') {
      console.log('ℹ️ WebSocket server not configured, skipping socket connection')
      console.log('ℹ️ Real-time features will use polling instead')
      return
    }

    // Initialize socket connection
    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id)
      setIsConnected(true)

      // Authenticate with user info
      if (session.user) {
        socketInstance.emit('authenticate', {
          userId: (session.user as any).id,
          email: session.user.email,
        })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      console.log('🔌 Cleaning up socket connection')
      socketInstance.disconnect()
    }
  }, [status, session])

  const joinOrganization = (orgId: string) => {
    if (socket && isConnected) {
      socket.emit('join-organization', orgId)
    }
  }

  const leaveOrganization = (orgId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-organization', orgId)
    }
  }

  const joinAdmin = () => {
    if (socket && isConnected) {
      socket.emit('join-admin')
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrganization,
        leaveOrganization,
        joinAdmin,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
