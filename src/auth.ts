import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // 1. GitHub OAuth Provider
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    
    // 2. Credentials Provider (Untuk login email demo/pengujian)
    Credentials({
      name: "Email & Passkey",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "dev@mili.id" },
        password: { label: "Passkey", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Demo User (Developer)
        if (credentials.email === "dev@mili.id" && credentials.password === "dev123") {
          return {
            id: "usr-dev-001",
            name: "Yudi Asmoro",
            email: "dev@mili.id",
            role: "Developer"
          };
        }
        
        // Demo User (Manajemen)
        if (credentials.email === "manager@mili.id" && credentials.password === "manager123") {
          return {
            id: "usr-mgr-001",
            name: "Mili Manager",
            email: "manager@mili.id",
            role: "Manajemen"
          };
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Saat login pertama kali
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "Developer";
      }
      if (account && profile) {
        token.accessToken = account.access_token;
        token.username = (profile as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
        (session as any).username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
