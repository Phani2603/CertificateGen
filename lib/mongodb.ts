import mongoose from 'mongoose'

const MONGODB_URI: string = process.env.MONGODB_URI || ''

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached.conn = await cached.promise
    console.log('[MongoDB] Connected successfully')
  } catch (e) {
    cached.promise = null
    console.error('[MongoDB] Connection error:', e)
    throw e
  }

  return cached.conn
}

export default connectDB
