/**
 * CLI 备份脚本
 *
 * 用法:
 *   npx tsx scripts/backup.ts
 *
 * 配合 crontab 定时运行（每天凌晨 3 点）:
 *   0 3 * * * cd /path/to/project && npx tsx scripts/backup.ts >> backups/cron.log 2>&1
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const backupDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
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
    subjects: subjects.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    })),
    tags: tags.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    })),
    images: images.map((img) => ({
      ...img,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString()
    })),
    notes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      contentJson: note.contentJson,
      plainText: note.plainText,
      isWrongQuestion: note.isWrongQuestion,
      subjectId: note.subjectId,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      deletedAt: note.deletedAt?.toISOString() ?? null,
      subject: {
        id: note.subject.id,
        name: note.subject.name,
        description: note.subject.description,
        createdAt: note.subject.createdAt.toISOString(),
        updatedAt: note.subject.updatedAt.toISOString()
      },
      tags: note.tags.map((t) => ({
        id: t.id,
        name: t.name,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString()
      })),
      images: note.images.map((img) => ({
        id: img.id,
        path: img.path,
        alt: img.alt,
        mimeType: img.mimeType,
        size: img.size,
        noteId: img.noteId,
        createdAt: img.createdAt.toISOString(),
        updatedAt: img.updatedAt.toISOString()
      }))
    }))
  };

  const filename = `kaoyan-notes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[backup] ✅ 备份成功: ${filepath} (${(payload.subjects.length + payload.tags.length + payload.notes.length + payload.images.length)} 条记录)`);
}

main()
  .catch((err) => {
    console.error('[backup] ❌ 备份失败:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
