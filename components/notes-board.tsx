'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { NoteListItemDTO, PaginatedResponse, PaginationMeta, SubjectDTO, TagDTO } from '@/types/note';
import { useToast } from '@/components/toast-provider';

interface Props {
  wrongOnly?: boolean;
}

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? '请求失败';
  } catch {
    return '请求失败';
  }
}

export function NotesBoard({ wrongOnly = false }: Props) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [notes, setNotes] = useState<NoteListItemDTO[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [tagKeyword, setTagKeyword] = useState('');
  const [titleKeyword, setTitleKeyword] = useState('');
  const [onlyWrong, setOnlyWrong] = useState(wrongOnly);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const { toast } = useToast();
  const PAGE_SIZE = 20;

  const noteCountText = useMemo(() => {
    if (pagination) return `共 ${pagination.total} 条笔记`;
    return `${notes.length} 条笔记`;
  }, [notes.length, pagination]);

  async function loadSubjects() {
    const res = await fetch('/api/subjects', { cache: 'no-store' });
    if (!res.ok) {
      toast.error(await readError(res));
      setSubjects([]);
      return;
    }

    const data = (await res.json()) as SubjectDTO[];
    setSubjects(data);
  }

  async function loadNotes() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedSubject) params.set('subjectId', selectedSubject);
    if (tagKeyword.trim()) params.set('tag', tagKeyword.trim());
    if (titleKeyword.trim()) params.set('title', titleKeyword.trim());
    if (onlyWrong) params.set('isWrongQuestion', 'true');
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));

    const endpoint = `/api/notes?${params.toString()}`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      toast.error(await readError(res));
      setNotes([]);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as PaginatedResponse<NoteListItemDTO>;
    setNotes(data.items);
    setPagination(data.pagination);
    setLoading(false);
  }

  useEffect(() => {
    void loadSubjects();
  }, []);

  useEffect(() => {
   void loadNotes();
 }, [page, selectedSubject, tagKeyword, titleKeyword, onlyWrong, wrongOnly]);

  useEffect(() => {
    setPage(1);
  }, [selectedSubject, tagKeyword, titleKeyword, onlyWrong, wrongOnly]);

  async function deleteNote(id: string) {
    const confirmed = window.confirm('确认删除该笔记？');
    if (!confirmed) return;

    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }

    await loadNotes();
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">{wrongOnly ? '错题本' : '笔记管理'}</h1>
            <p className="mt-1 text-sm text-mutedText">{noteCountText}</p>
          </div>
          <Link className="btn-primary" href="/notes/new">
            新建笔记
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            className="input-base"
            onChange={(e) => { setSelectedSubject(e.target.value); setPage(1); }}
            value={selectedSubject}
          >
            <option value="">全部科目</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <input
            className="input-base"
            onChange={(e) => { setTitleKeyword(e.target.value); setPage(1); }}
            placeholder="标题关键词"
            value={titleKeyword}
          />

          <input
            className="input-base"
            onChange={(e) => { setTagKeyword(e.target.value); setPage(1); }}
            placeholder="标签关键词"
            value={tagKeyword}
          />

          {!wrongOnly ? (
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm">
              <input checked={onlyWrong} onChange={(e) => { setOnlyWrong(e.target.checked); setPage(1); }} type="checkbox" />
              仅看错题
            </label>
          ) : (
            <div className="rounded-2xl border accent-border-40 accent-bg-10 px-4 py-2 text-sm accent-text-light">
              已固定展示错题
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
       {loading ? <p className="text-sm text-mutedText">加载中...</p> : null}

        {notes.map((note) => (
          <article
            className="glass-card cursor-pointer p-5 transition hover:accent-border-40 hover:bg-card/80"
            key={note.id}
            onClick={() => {
              router.push(`/notes/${note.id}/view`);
            }}
            onDoubleClick={() => {
              router.push(`/notes/${note.id}`);
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{note.title}</h2>
              {note.isWrongQuestion ? (
                <span className="rounded-full border accent-border-40 accent-bg-10 px-2 py-1 text-xs accent-text-light">
                  错题
                </span>
              ) : null}
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
              <Link
                className="btn-secondary"
                href={`/notes/${note.id}/view`}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                查看
              </Link>
              <Link
                className="btn-secondary"
                href={`/notes/${note.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                编辑
              </Link>
              <button
                className="btn-secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  void deleteNote(note.id);
                }}
                type="button"
              >
                删除
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-500">单击查看，双击快速进入编辑</p>
          </article>
        ))}
      </section>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              pagination.page <= 1
                ? 'border-white/5 text-zinc-600'
                : 'border-white/10 text-zinc-300 hover-accent-border-35 hover:text-white'
            }`}
            disabled={pagination.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            上一页
          </button>
          <span className="text-sm text-zinc-400">
            第 {pagination.page} / {pagination.totalPages} 页
          </span>
          <button
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              pagination.page >= pagination.totalPages
                ? 'border-white/5 text-zinc-600'
                : 'border-white/10 text-zinc-300 hover-accent-border-35 hover:text-white'
            }`}
            disabled={pagination.page >= pagination.totalPages}
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
