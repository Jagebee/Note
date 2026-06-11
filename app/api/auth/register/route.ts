import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3位').max(30, '用户名最长30位'),
  password: z.string().min(6, '密码至少6位').max(100),
  nickname: z.string().max(50).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数错误', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username }
  });
  if (existing) {
    return fail('用户名已存在', 'USERNAME_EXISTS', 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash,
      nickname: parsed.data.nickname || null,
      role: 'USER'
    }
  });

  return ok({ id: user.id, username: user.username, nickname: user.nickname }, 201);
}
