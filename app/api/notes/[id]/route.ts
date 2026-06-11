import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeNote } from '@/lib/serializers';
import { extractPlainTextFromTipTapJSON } from '@/lib/utils';
import { noteUpdateSchema } from '@/lib/validators';

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const note = await prisma.note.findUnique({
    where: { id: params.id },
    include: {
      subject: true,
      tags: true,
      images: true
    }
  });

  if (!note) {
    return fail('笔记不存在', 'NOTE_NOT_FOUND', 404);
  }

  return ok(serializeNote(note));
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = noteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  const updated = await prisma.note.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title,
      subjectId: parsed.data.subjectId,
      contentJson: parsed.data.contentJson,
      plainText: parsed.data.contentJson
        ? parsed.data.plainText ?? extractPlainTextFromTipTapJSON(parsed.data.contentJson)
        : parsed.data.plainText,
      isWrongQuestion: parsed.data.isWrongQuestion,
      tags: parsed.data.tagIds
        ? {
            set: parsed.data.tagIds.map((id) => ({ id }))
          }
        : undefined
    },
    include: {
      subject: true,
      tags: true,
      images: true
    }
  });

  if (parsed.data.imagePaths) {
    await prisma.imageAsset.updateMany({
      where: {
        noteId: params.id,
        path: { notIn: parsed.data.imagePaths }
      },
      data: { noteId: null }
    });

    await prisma.imageAsset.updateMany({
      where: {
        path: { in: parsed.data.imagePaths },
        OR: [{ noteId: null }, { noteId: params.id }]
      },
      data: { noteId: params.id }
    });
  }

  return ok(serializeNote(updated));
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  await prisma.note.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }
  });

  return ok({ success: true });
}
