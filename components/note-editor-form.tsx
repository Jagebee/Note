'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TipTapEditor } from '@/components/tiptap-editor';
import { NoteDetailDTO, SubjectDTO, TagDTO } from '@/types/note';
import { useToast } from '@/components/toast-provider';

interface Props {
  noteId?: string;
}

interface EditorPayload {
  contentJson: unknown;
  plainText: string;
  imagePaths: string[];
}

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? '请求失败';
  } catch {
    return '请求失败';
  }
}

export function NoteEditorForm({ noteId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [tags, setTags] = useState<TagDTO[]>([]);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isWrongQuestion, setIsWrongQuestion] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [initialEditorContent, setInitialEditorContent] = useState<unknown>({
    type: 'doc',
    content: [{ type: 'paragraph' }]
  });

  const [editorPayload, setEditorPayload] = useState<EditorPayload>({
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
    plainText: '',
    imagePaths: []
  });

  const onEditorChange = useCallback((payload: EditorPayload) => {
    setEditorPayload(payload);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);

      const [subjectRes, tagRes] = await Promise.all([
        fetch('/api/subjects', { cache: 'no-store' }),
        fetch('/api/tags', { cache: 'no-store' })
      ]);

      if (!subjectRes.ok) {
        toast.error(await readError(subjectRes));
        setLoading(false);
        return;
      }

      if (!tagRes.ok) {
        toast.error(await readError(tagRes));
        setLoading(false);
        return;
      }

      const subjectData = (await subjectRes.json()) as SubjectDTO[];
      const tagData = (await tagRes.json()) as TagDTO[];
      setSubjects(subjectData);
      setTags(tagData);

      if (noteId) {
        const noteRes = await fetch(`/api/notes/${noteId}`, { cache: 'no-store' });
        if (!noteRes.ok) {
          toast.error(await readError(noteRes));
          setLoading(false);
          return;
        }

        const note = (await noteRes.json()) as NoteDetailDTO;
        setTitle(note.title);
        setSubjectId(note.subject.id);
        setIsWrongQuestion(note.isWrongQuestion);
        setSelectedTagIds(note.tags.map((item) => item.id));
        setInitialEditorContent(note.contentJson);
        setEditorPayload({
          contentJson: note.contentJson,
          plainText: note.plainText,
          imagePaths: note.images.map((img) => img.path)
        });
      }

      setLoading(false);
    }

    void bootstrap();
  }, [noteId]);

  async function handleSubmit() {

    if (!title.trim()) {
      toast.error('请填写笔记标题');
      return;
    }

    if (!subjectId) {
      toast.error('请选择科目');
      return;
    }

    setSaving(true);

    const payload = {
      title,
      subjectId,
      contentJson: editorPayload.contentJson,
      plainText: editorPayload.plainText,
      isWrongQuestion,
      tagIds: selectedTagIds,
      imagePaths: editorPayload.imagePaths
    };

    const res = await fetch(noteId ? `/api/notes/${noteId}` : '/api/notes', {
      method: noteId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      toast.error(await readError(res));
      setSaving(false);
      return;
    }

    router.push('/notes');
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-mutedText">加载中...</p>;
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-white">{noteId ? '编辑笔记' : '新建笔记'}</h1>
          <Link className="btn-secondary" href="/notes">
            返回列表
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className="input-base md:col-span-2"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入笔记标题"
            required
            value={title}
          />

          <select className="input-base" onChange={(e) => setSubjectId(e.target.value)} value={subjectId}>
            <option value="">请选择科目</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm">
            <input
              checked={isWrongQuestion}
              onChange={(e) => setIsWrongQuestion(e.target.checked)}
              type="checkbox"
            />
            标记为错题
          </label>
        </div>

        {!subjects.length ? (
          <p className="mt-3 text-sm text-orange-300">当前没有可用科目，请先到科目管理页面创建科目。</p>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-zinc-200">标签（可多选）</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = selectedTagIds.includes(tag.id);
              return (
                <button
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    active ? 'accent-border-60 accent-bg-20 accent-text-light' : 'border-white/15 text-zinc-300'
                  }`}
                  key={tag.id}
                  onClick={() => {
                    setSelectedTagIds((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    );
                  }}
                  type="button"
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <TipTapEditor initialContent={initialEditorContent} noteId={noteId} onChange={onEditorChange} />


      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={() => void handleSubmit()} type="button">
          {saving ? '保存中...' : '保存笔记'}
        </button>
        <Link className="btn-secondary" href="/notes">
          取消
        </Link>
      </div>
    </section>
  );
}
