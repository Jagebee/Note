'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { TagDTO } from '@/types/note';
import { useToast } from '@/components/toast-provider';

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? '请求失败';
  } catch {
    return '请求失败';
  }
}

export function TagManager() {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const editingTag = useMemo(() => tags.find((item) => item.id === editingId) ?? null, [tags, editingId]);

  async function loadTags() {
    const res = await fetch('/api/tags', { cache: 'no-store' });
    if (!res.ok) {
      toast.error(await readError(res));
      setTags([]);
      return;
    }

    const data = (await res.json()) as TagDTO[];
    setTags(data);
  }

  useEffect(() => {
    void loadTags();
  }, []);

  useEffect(() => {
    if (editingTag) {
      setName(editingTag.name);
    }
  }, [editingTag]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch(editingId ? `/api/tags/${editingId}` : '/api/tags', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }

    setName('');
    setEditingId(null);
    toast.success(editingId ? '标签更新成功' : '标签创建成功');
    await loadTags();
  }

  async function onDelete(id: string) {
    const confirmed = window.confirm('确认删除该标签？');
    if (!confirmed) return;

    const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readError(res));
      return;
    }

    await loadTags();
  }

  return (
    <section className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white">标签管理</h2>

      <form className="mt-4 flex flex-wrap gap-3" onSubmit={onSubmit}>
        <input
          className="input-base max-w-xs"
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：高频考点"
          required
          value={name}
        />
        <button className="btn-primary" type="submit">
          {editingId ? '更新标签' : '创建标签'}
        </button>
        {editingId ? (
          <button
            className="btn-secondary"
            onClick={() => {
              setEditingId(null);
              setName('');
            }}
            type="button"
          >
            取消
          </button>
        ) : null}
      </form>


      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1" key={tag.id}>
            <span className="text-sm text-zinc-200">#{tag.name}</span>
            <button className="text-xs text-zinc-400 hover:text-white" onClick={() => setEditingId(tag.id)} type="button">
              编辑
            </button>
            <button className="text-xs text-zinc-400 hover:text-orange-300" onClick={() => void onDelete(tag.id)} type="button">
              删除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
