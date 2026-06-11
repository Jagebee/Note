'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { NoteListItemDTO, PaginatedResponse, PaginationMeta, TagDTO } from '@/types/note';
import { useToast } from '@/components/toast-provider';

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? '请求失败';
  } catch {
    return '请求失败';
  }
}

export function TrashBoard() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const { toast } = useToast();
  const PAGE_SIZE = 20;

  async function loadTrash() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));

    const res = await fetch(`/api/notes/trash?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      toast.error(await readError(res));
      setNotes([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as PaginatedResponse<NoteListItemDTO>;
    setNotes(data.items);
    setPagination(data.pagination);
    setLoading(false);
  }

  useEffect(() => {
    void loadTrash();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, []);

  async function restoreNote(id: string) {
    const res = await fetch(`/api/notes/${id}/restore`, { method: 'POST' });
    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }
    await loadTrash();
  }

  async function forceDelete(id: string) {
    const confirmed = window.confirm('确认永久删除？此操作不可恢复。');
    if (!confirmed) return;

    const res = await fetch(`/api/notes/${id}/force`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }
    await loadTrash();
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">回收站</h1>
            <p className="mt-1 text-sm text-mutedText">
              {pagination ? `共 ${pagination.total} 条已删除笔记` : '加载中...'}
            </p>
          </div>
          {notes.length > 0 ? (
            <button
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
              onClick={async () => {
                const confirmed = window.confirm(`确认永久清空全部 ${pagination?.total ?? 0} 条笔记？此操作不可恢复。`);
                if (!confirmed) return;
                for (const note of notes) {
                  await fetch(`/api/notes/${note.id}/force`, { method: 'DELETE' });
                }
                await loadTrash();
              }}
              type="button"
            >
              清空回收站
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {loading ? <p className="text-sm text-mutedText">加载中...</p> : null}

        {!loading && notes.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-sm text-zinc-500">
            回收站为空
          </div>
        ) : null}

        {notes.map((note) => (
          <article
            className="glass-card cursor-pointer p-5 transition hover:accent-border-40 hover:bg-card/80"
            key={note.id}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{note.title}</h2>
            </div>

            <p className="mt-2 text-sm text-mutedText">{note.subject.name}</p>
            <p className="mt-2 text-sm text-zinc-300">{note.plainText || '暂无摘要'}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {note.tags.map((tag: TagDTO) => (
                <span className="rounded-full border border-white/15 px-2 py-1 text-xs text-zinc-300" key={tag.id}>
                  #{tag.name}
                </span>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300 transition hover:bg-green-500/20"
                onClick={(event) => {
                  event.stopPropagation();
                  void restoreNote(note.id);
                }}
                type="button"
              >
                恢复
              </button>
              <button
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                onClick={(event) => {
                  event.stopPropagation();
                  void forceDelete(note.id);
                }}
                type="button"
              >
                永久删除
              </button>
              <button
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover-accent-border-35 hover:text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/notes/${note.id}/view`);
                }}
                type="button"
              >
                查看
              </button>
            </div>
          </article>
        ))}
      </section>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              page <= 1
                ? 'border-white/5 text-zinc-600'
                : 'border-white/10 text-zinc-300 hover-accent-border-35 hover:text-white'
            }`}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            上一页
          </button>
          <span className="text-sm text-zinc-400">
            第 {page} / {pagination.totalPages} 页
          </span>
          <button
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              page >= pagination.totalPages
                ? 'border-white/5 text-zinc-600'
                : 'border-white/10 text-zinc-300 hover-accent-border-35 hover:text-white'
            }`}
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            type="button"
          >
            下一页
          </button>
        </div>
      ) : null}
    </div>
  );
}
