import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeSubject } from '@/lib/serializers';
import { subjectCreateSchema } from '@/lib/validators';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const subjects = await prisma.subject.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return ok(subjects.map(serializeSubject));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = subjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const existing = await prisma.subject.findUnique({
    where: { name: parsed.data.name }
  });
  if (existing) {
    return fail('科目名称已存在', 'SUBJECT_EXISTS', 409);
  }

  const created = await prisma.subject.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null
    }
  });

  return ok(serializeSubject(created), 201);
}
