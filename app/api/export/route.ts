import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { serializeImage, serializeSubject, serializeTag } from '@/lib/serializers';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const [subjects, tags, notes, images] = await Promise.all([
    prisma.subject.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.tag.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.note.findMany({
      include: { subject: true, tags: true, images: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.imageAsset.findMany({ orderBy: { createdAt: 'asc' } })
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    subjects: subjects.map(serializeSubject),
    tags: tags.map(serializeTag),
    images: images.map(serializeImage),
    notes: notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      deletedAt: note.deletedAt?.toISOString() ?? null,
      subject: serializeSubject(note.subject),
      tags: note.tags.map(serializeTag),
      images: note.images.map(serializeImage)
    }))
  };

  const body = JSON.stringify(payload, null, 2);
  const filename = `kaoyan-notes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
