'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { SubjectDTO } from '@/types/note';
import { useToast } from '@/components/toast-provider';

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? '请求失败';
  } catch {
    return '请求失败';
  }
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const editingSubject = useMemo(
    () => subjects.find((item) => item.id === editingId) ?? null,
    [subjects, editingId]
  );

  async function loadSubjects() {
    setLoading(true);
    const res = await fetch('/api/subjects', { cache: 'no-store' });
    if (!res.ok) {
      toast.error(await readError(res));
      setSubjects([]);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as SubjectDTO[];
    setSubjects(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadSubjects();
  }, []);

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setDescription(editingSubject.description ?? '');
    }
  }, [editingSubject]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const payload = { name, description: description || null };

    const res = await fetch(editingId ? `/api/subjects/${editingId}` : '/api/subjects', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }

    setName('');
    setDescription('');
    setEditingId(null);
    toast.success(editingId ? '科目更新成功' : '科目创建成功');
    await loadSubjects();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('确认删除该科目？如果有笔记关联会阻止删除。');
    if (!confirmed) return;

    const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }

    await loadSubjects();
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <h1 className="text-xl font-semibold text-white">科目管理</h1>
        <p className="mt-1 text-sm text-mutedText">支持新增、编辑、删除科目。</p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <input
            className="input-base"
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：政治"
            required
            value={name}
          />
          <input
            className="input-base"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="科目描述（可选）"
            value={description}
          />

          <div className="flex gap-2 md:col-span-2">
            <button className="btn-primary" type="submit">
              {editingId ? '更新科目' : '创建科目'}
            </button>
            {editingId ? (
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setDescription('');
                }}
                type="button"
              >
                取消编辑
              </button>
            ) : null}
          </div>
        </form>

      </section>

      <section className="glass-card p-6">
        <h2 className="text-lg font-medium text-white">科目列表</h2>
        {loading ? <p className="mt-3 text-sm text-mutedText">加载中...</p> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={subject.id}>
              <h3 className="font-semibold text-white">{subject.name}</h3>
              <p className="mt-1 text-sm text-mutedText">{subject.description || '暂无描述'}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary" onClick={() => setEditingId(subject.id)} type="button">
                  编辑
                </button>
                <button className="btn-secondary" onClick={() => void handleDelete(subject.id)} type="button">
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
