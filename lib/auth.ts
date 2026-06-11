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
  // 单用户场景用 JWT session，减少数据库会话表维护成本
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
        // 仅允许用户名 + 密码，登录数据来自数据库 seed 的 admin 账号
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        let dbUser = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        const candidateUser = dbUser ?? (credentials.username === FALLBACK_ADMIN.username ? FALLBACK_ADMIN : null);
        if (!candidateUser) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, candidateUser.passwordHash);
        if (!isValid) {
          return null;
        }

        // 当 seed 尚未执行成功时，首次登录自动补全管理员记录，避免后续再次回退到内置账号。
        if (!dbUser && credentials.username === FALLBACK_ADMIN.username) {
          dbUser = await prisma.user.create({
            data: {
              username: FALLBACK_ADMIN.username,
              passwordHash: FALLBACK_ADMIN.passwordHash
            }
          });
        }

        return {
          id: dbUser?.id ?? 'fallback-admin',
          name: candidateUser.username
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 首次登录时把用户关键信息写入 token，后续请求复用
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // 暴露给前端会话的最小必要字段
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    }
  }
};
