import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  await prisma.imageAsset.updateMany({
    where: { noteId: params.id },
    data: { noteId: null }
  });

  await prisma.note.delete({
    where: { id: params.id }
  });

  return ok({ success: true });
}
