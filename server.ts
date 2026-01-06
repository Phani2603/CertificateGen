import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { initSocketHandlers } from './lib/socket-handlers'
import { initializeChangeStreams } from './lib/change-streams'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
  })

  console.log('🔌 Socket.io server initialized')

  // Initialize socket handlers
  initSocketHandlers(io)

  // Initialize MongoDB Change Streams
  initializeChangeStreams()

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.io ready on ws://${hostname}:${port}`)
  })
})
