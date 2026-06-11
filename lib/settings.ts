import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function getUserBackgroundImage(userId: string) {
  const setting = await prisma.userSetting.findUnique({
    where: { userId }
  });

  return setting?.backgroundImage ?? null;
}

export async function upsertUserBackgroundImage(userId: string, backgroundImage: string | null) {
  return prisma.userSetting.upsert({
    where: { userId },
    update: { backgroundImage },
    create: {
      userId,
      backgroundImage
    }
  });
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      nickname: true,
      avatar: true,
      settings: {
        select: { backgroundImage: true, accentColor: true }
      }
    }
  });

  if (!user) return null;

  return {
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    backgroundImage: user.settings?.backgroundImage ?? null,
    accentColor: user.settings?.accentColor ?? null
  };
}

export async function updateUserProfile(
  userId: string,
  data: { nickname?: string | null; avatar?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
    }
  });
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
}

export async function upsertUserAccentColor(userId: string, accentColor: string | null) {
  return prisma.userSetting.upsert({
    where: { userId },
    update: { accentColor },
    create: { userId, accentColor }
  });
}
