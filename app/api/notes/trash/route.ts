import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeNote } from '@/lib/serializers';
import type { PaginatedResponse } from '@/types/note';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

  const where = { deletedAt: { not: null } };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      include: { subject: true, tags: true },
      orderBy: { deletedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.note.count({ where })
  ]);

  const response: PaginatedResponse<(typeof notes)[number]> = {
    items: notes.map(serializeNote),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };

  return ok(response);
}
