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
    
    Credentials({
      name: "Email & Passkey",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "nama@domain.com" },
        password: { label: "Passkey", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        
        const devEmail = process.env.DEV_EMAIL || "dev@mili.id";
        const devPassword = process.env.DEV_PASSWORD || "dev123";
        const mgrEmail = process.env.MGR_EMAIL || "mail@miliciptakarya.com";
        
        // Developer Role
        if (credentials.email === devEmail && credentials.password === devPassword) {
          return {
            id: "usr-dev-001",
            name: "Mili Developer",
            email: devEmail,
            role: "Developer"
          };
        }
        
        // Manajemen Role (via PIN or traditional Email/Password)
        const mgrPin = process.env.MGR_PIN || "83708370";
        const isPinMatch = credentials.password === mgrPin;
        
        const mgrPassword = process.env.MGR_PASSWORD || "manager123";
        const isCredentialsMatch = credentials.email === mgrEmail && credentials.password === mgrPassword;

        if (isPinMatch || isCredentialsMatch) {
          return {
            id: "usr-mgr-001",
            name: "Mili Manajemen",
            email: mgrEmail,
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
        token.role = user.role || "Developer";
      }
      if (account && profile) {
        token.accessToken = account.access_token;
        token.username = (profile as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
        session.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
