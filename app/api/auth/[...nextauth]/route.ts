import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getUserByEmail, validateUser } from "@/lib/user-database"
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth"
import type { JWT } from "next-auth/jwt"

// Extend Session and JWT types for custom fields
interface CustomSession extends Session {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    phone?: string
    location?: string
  }
}
interface CustomJWT extends JWT {
  role?: string
  phone?: string
  location?: string
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const user = validateUser(credentials.email, credentials.password)
        if (user) {
          return {
            id: user.email,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            location: user.location,
          }
        }
        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      const s = session as CustomSession
      s.user.role = (token as CustomJWT).role
      s.user.phone = (token as CustomJWT).phone
      s.user.location = (token as CustomJWT).location
      return s
    },
    async jwt({ token, user }) {
      const t = token as CustomJWT
      if (user) {
        const u = user as NextAuthUser & { role?: string; phone?: string; location?: string }
        t.role = u.role
        t.phone = u.phone
        t.location = u.location
      }
      return t
    },
  },
} as NextAuthOptions)

export { handler as GET, handler as POST }
