import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeNote } from '@/lib/serializers';
import type { PaginatedResponse } from '@/types/note';
import { extractPlainTextFromTipTapJSON } from '@/lib/utils';
import { noteCreateSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const tag = searchParams.get('tag');
  const title = searchParams.get('title');
  const isWrongQuestion = searchParams.get('isWrongQuestion');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

  const where = {
    deletedAt: null,
      userId: session.user.id,
    ...(subjectId ? { subjectId } : {}),
    ...(typeof isWrongQuestion === 'string' ? { isWrongQuestion: isWrongQuestion === 'true' } : {}),
    ...(title
      ? {
          title: { contains: title }
        }
      : {}),
    ...(tag
      ? {
          tags: { some: { name: { contains: tag } } }
        }
      : {})
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      include: { subject: true, tags: true },
      orderBy: { updatedAt: 'desc' },
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const body = await request.json();
  const parsed = noteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail('参数校验失败', 'VALIDATION_ERROR', 400, parsed.error.flatten());
  }

  // plainText 用于关键词搜索与列表摘要，避免直接在 JSON 上做复杂检索
  const plainText = parsed.data.plainText ?? extractPlainTextFromTipTapJSON(parsed.data.contentJson);

  const created = await prisma.note.create({
    data: {
      title: parsed.data.title,
      subjectId: parsed.data.subjectId,
      userId: session.user.id,
      contentJson: parsed.data.contentJson as any,
      plainText,
      isWrongQuestion: parsed.data.isWrongQuestion ?? false,
      tags: parsed.data.tagIds?.length
        ? {
            connect: parsed.data.tagIds.map((id) => ({ id }))
          }
        : undefined
    },
    include: {
      subject: true,
      tags: true,
      images: true
    }
  });

  if (parsed.data.imagePaths?.length) {
    // 把上传时暂存为 noteId=null 的图片关联到新建笔记
    await prisma.imageAsset.updateMany({
      where: {
        path: { in: parsed.data.imagePaths },
        noteId: null
      },
      data: { noteId: created.id }
    });
  }

  const result = await prisma.note.findUniqueOrThrow({
    where: { id: created.id },
    include: {
      subject: true,
      tags: true,
      images: true
    }
  });

  return ok(serializeNote(result), 201);
}
