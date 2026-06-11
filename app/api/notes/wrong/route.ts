import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeNote } from '@/lib/serializers';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const notes = await prisma.note.findMany({
    where: {
      isWrongQuestion: true,
      deletedAt: null
    },
    include: {
      subject: true,
      tags: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return ok(notes.map(serializeNote));
}
