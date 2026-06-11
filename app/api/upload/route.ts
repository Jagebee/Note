import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function getSafeExtension(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (!ext) return '.png';
  if (ext.length > 10) return '.png';
  return ext;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('未登录', 'UNAUTHORIZED', 401);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const noteId = formData.get('noteId');

  if (!(file instanceof File)) {
    return fail('缺少文件', 'FILE_REQUIRED', 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return fail('文件大小不能超过 10MB', 'FILE_TOO_LARGE', 400);
  }

  // 统一落地到 public/uploads，便于 Next.js 静态路径直接访问
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = getSafeExtension(file.name);
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const absolutePath = path.join(UPLOAD_DIR, filename);
  const publicPath = `/uploads/${filename}`;

  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  const image = await prisma.imageAsset.create({
    data: {
      path: publicPath,
      mimeType: file.type || null,
      size: file.size,
      noteId: typeof noteId === 'string' && noteId ? noteId : null
    }
  });

  return ok({
    path: publicPath,
    mimeType: image.mimeType,
    size: image.size
  });
}
