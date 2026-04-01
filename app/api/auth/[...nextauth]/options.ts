import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";

declare module "next-auth" {
  interface Session {
    user: { id: string; name: string; email: string; role: string };
  }
  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Só executa para OAuth (Google)
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          // Cria usuário novo via Google
          const newUser = await prisma.user.create({
            data: {
              name: user.name ?? "Usuário",
              email: user.email,
              passwordHash: null,
              provider: "google",
              emailVerified: true,
            },
          });
          // Cria trial de 7 dias
          await prisma.subscription.create({
            data: {
              userId: newUser.id,
              plan: "PROPOSTA",
              status: "TRIAL",
              trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
          user.id = newUser.id;
          (user as { role?: string }).role = newUser.role;
        } else {
          user.id = existing.id;
          (user as { role?: string }).role = existing.role;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Default: send to dashboard if going to root/sign-in callback
      if (url === baseUrl || url === `${baseUrl}/`) return `${baseUrl}/dashboard`;
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
};
