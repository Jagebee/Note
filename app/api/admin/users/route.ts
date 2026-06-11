import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return fail('无权限', 'FORBIDDEN', 403);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      role: true,
      createdAt: true,
      _count: { select: { notes: true, subjects: true, tags: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return ok(users);
}
