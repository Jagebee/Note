import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { prisma } from '@/lib/prisma';

const FALLBACK_ADMIN = {
  username: 'admin',
  // bcrypt hash for the default password `admin123456`
  passwordHash: '$2y$10$ZboZEtfoH2nQv0/yicTk/uFRleqxz0V4revPaY9Kc9dLycns.RDWm'
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        let dbUser = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        const candidateUser = dbUser ?? null;
        if (!candidateUser) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, candidateUser.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: candidateUser.id,
          name: candidateUser.username,
          role: candidateUser.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
};
