import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userType?: string
      privateOrgId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    userType?: string
    privateOrgId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    userType?: string
    privateOrgId?: string
  }
}
