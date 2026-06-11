import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeTag } from '@/lib/serializers';
import { tagCreateSchema } from '@/lib/validators';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  return ok(tags.map(serializeTag));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = tagCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const existing = await prisma.tag.findUnique({
    where: { name: parsed.data.name }
  });
  if (existing) {
    return fail('标签已存在', 'TAG_EXISTS', 409);
  }

  const created = await prisma.tag.create({
    data: {
      name: parsed.data.name
    }
  });

  return ok(serializeTag(created), 201);
}
