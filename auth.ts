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

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials")
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
          
          if (!existingUser && user.email && user.name) {
            // Create new user for OAuth
            const newUser = new User({
              email: user.email,
              name: user.name,
              image: user.image || undefined,
              provider: account.provider,
              providerId: account.providerAccountId,
            })
            await newUser.save()
          } else if (existingUser) {
            // Update existing user
            existingUser.name = user.name || existingUser.name
            existingUser.image = user.image || existingUser.image
            await existingUser.save()
          }
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
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
