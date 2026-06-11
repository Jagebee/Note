import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import {
  changeUserPassword,
  getUserProfile,
  updateUserProfile,
  upsertUserAccentColor,
  upsertUserBackgroundImage
} from '@/lib/settings';

const updateProfileSchema = z.object({
  nickname: z.string().trim().max(50).optional().nullable(),
  avatar: z.string().trim().max(500).optional().nullable(),
  backgroundImage: z.string().trim().max(2000).optional().nullable(),
  accentColor: z.string().trim().max(7).optional().nullable()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少 6 位')
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return fail('用户不存在', 'USER_NOT_FOUND', 404);
  }

  return ok(profile);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();

  // Detect if this is a password change or profile update
  if (body.currentPassword !== undefined) {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return fail('用户不存在', 'USER_NOT_FOUND', 404);
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return fail('当前密码错误', 'INVALID_PASSWORD', 400);
    }

    await changeUserPassword(session.user.id, parsed.data.newPassword);
    return ok({ success: true });
  }

  // Otherwise it's a profile update
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  if (parsed.data.nickname !== undefined) {
    await updateUserProfile(session.user.id, { nickname: parsed.data.nickname || null });
  }

  if (parsed.data.avatar !== undefined) {
    await updateUserProfile(session.user.id, { avatar: parsed.data.avatar || null });
  }

  if (parsed.data.backgroundImage !== undefined) {
    await upsertUserBackgroundImage(session.user.id, parsed.data.backgroundImage || null);
  }

  if (parsed.data.accentColor !== undefined) {
    await upsertUserAccentColor(session.user.id, parsed.data.accentColor || null);
  }

  const profile = await getUserProfile(session.user.id);
  return ok(profile);
}
