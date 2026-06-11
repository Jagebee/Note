import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeSubject } from '@/lib/serializers';
import { subjectCreateSchema } from '@/lib/validators';

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const subject = await prisma.subject.findFirst({
      where: { id: params.id, userId: session.user.id },
  });

  if (!subject) {
    return fail('科目不存在', 'SUBJECT_NOT_FOUND', 404);
  }

  return ok(serializeSubject(subject));
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = subjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const duplicated = await prisma.subject.findFirst({
    where: {
      name: parsed.data.name,
      NOT: { id: params.id }
    }
  });

  if (duplicated) {
    return fail('科目名称已存在', 'SUBJECT_EXISTS', 409);
  }

  const updated = await prisma.subject.update({
      where: { id: params.id, userId: session.user.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null
    }
  });

  return ok(serializeSubject(updated));
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const noteCount = await prisma.note.count({
    where: { subjectId: params.id }
  });

  if (noteCount > 0) {
    return fail('该科目下存在笔记，请先迁移或删除笔记', 'SUBJECT_HAS_NOTES', 409);
  }

  await prisma.subject.delete({
      where: { id: params.id, userId: session.user.id },
  });

  return ok({ success: true });
}
