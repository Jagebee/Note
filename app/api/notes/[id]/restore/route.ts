import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function POST(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  await prisma.note.update({
    where: { id: params.id },
    data: { deletedAt: null }
  });

  return ok({ success: true });
}
