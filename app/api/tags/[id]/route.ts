import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeTag } from '@/lib/serializers';
import { tagCreateSchema } from '@/lib/validators';

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = tagCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const duplicated = await prisma.tag.findFirst({
    where: {
      name: parsed.data.name,
      NOT: { id: params.id }
    }
  });
  if (duplicated) {
    return fail('标签名称已存在', 'TAG_EXISTS', 409);
  }

  const updated = await prisma.tag.update({
      where: { id: params.id, userId: session.user.id },
    data: { name: parsed.data.name }
  });

  return ok(serializeTag(updated));
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  await prisma.tag.delete({
      where: { id: params.id, userId: session.user.id },
  });

  return ok({ success: true });
}
