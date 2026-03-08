import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        // Check if user account is blocked or suspended
        if (user.isBlocked) {
          throw new Error("Your account has been blocked. Please contact support.")
        }

        if (user.isSuspended) {
          const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null
          if (suspendedUntil && suspendedUntil > new Date()) {
            throw new Error(`Your account is suspended until ${suspendedUntil.toLocaleDateString()}`)
          } else if (!suspendedUntil) {
            throw new Error("Your account has been suspended. Please contact support.")
          }
          // If suspension has expired, clear the flag
          user.isSuspended = false
          user.suspendedUntil = undefined
          await user.save()
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials")
        }

        // Additional safety check - ensure user account is valid
        if (!user._id || !user.email) {
          throw new Error("Invalid user account")
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await connectDB()
          
          const existingUser = await User.findOne({ email: user.email })
          
          // Check if existing user is blocked or suspended
          if (existingUser) {
            if (existingUser.isBlocked) {
              console.error("[SignIn] Blocked user attempted login:", user.email)
              return false
            }
            
            if (existingUser.isSuspended) {
              const suspendedUntil = existingUser.suspendedUntil ? new Date(existingUser.suspendedUntil) : null
              if (suspendedUntil && suspendedUntil > new Date()) {
                console.error("[SignIn] Suspended user attempted login:", user.email)
                return false
              }
              // If suspension has expired, clear the flag
              existingUser.isSuspended = false
              existingUser.suspendedUntil = undefined
            }
            
            // Update existing user
            existingUser.name = user.name || existingUser.name
            existingUser.image = user.image || existingUser.image
            await existingUser.save()
          } else if (user.email && user.name) {
            // Create new user for OAuth
            const newUser = new User({
              email: user.email,
              name: user.name,
              image: user.image || undefined,
              provider: account.provider,
              providerId: account.providerAccountId,
            })
            await newUser.save()
          }
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
      }
      
      // Always verify user still exists in database
      try {
        await connectDB()
        const dbUser = await User.findOne({ email: token.email })
        
        // If user doesn't exist in database (deleted), invalidate the token
        if (!dbUser) {
          console.log("[JWT] User not found in database, invalidating token:", token.email)
          return null as any // This will cause the session to be invalid
        }
        
        // Refresh user data from database on session update or if missing
        if (trigger === "update" || !token.userType) {
          token.userType = dbUser.userType
          token.privateOrgId = dbUser.privateOrgId?.toString()
        }
      } catch (error) {
        console.error("Error refreshing user data in JWT:", error)
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.userType = token.userType as string
        session.user.privateOrgId = token.privateOrgId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
})
