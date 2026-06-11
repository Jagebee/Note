'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { NoteDetailDTO } from '@/types/note';

interface Props {
  noteId: string;
}

interface TipTapNode {
  type?: string;
  text?: string;
  marks?: Array<{ type?: string }>;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
}

function renderText(node: TipTapNode, key: string) {
  let content: React.ReactNode = node.text ?? '';

  node.marks?.forEach((mark, index) => {
    const nestedKey = `${key}-${mark.type}-${index}`;
    if (mark.type === 'bold') {
      content = <strong key={nestedKey}>{content}</strong>;
      return;
    }
    if (mark.type === 'italic') {
      content = <em key={nestedKey}>{content}</em>;
      return;
    }
    if (mark.type === 'code') {
      content = (
        <code className="rounded bg-black/35 px-1.5 py-0.5 accent-text-light" key={nestedKey}>
          {content}
        </code>
      );
      return;
    }
    if (mark.type === 'strike') {
      content = <s key={nestedKey}>{content}</s>;
    }
  });

  return <span key={key}>{content}</span>;
}

function renderNodes(nodes: TipTapNode[] | undefined): React.ReactNode {
  if (!nodes?.length) return null;

  return nodes.map((node, index) => {
    const key = `${node.type ?? 'node'}-${index}`;

    if (node.type === 'text') {
      return renderText(node, key);
    }

    if (node.type === 'paragraph') {
      return (
        <p className="mb-4 leading-8 text-zinc-200" key={key}>
          {renderNodes(node.content)}
        </p>
      );
    }

    if (node.type === 'heading') {
      const level = Number(node.attrs?.level ?? 2);
      if (level === 1) {
        return (
          <h1 className="mb-4 text-3xl font-bold text-white" key={key}>
            {renderNodes(node.content)}
          </h1>
        );
      }

      if (level === 3) {
        return (
          <h3 className="mb-3 text-xl font-semibold text-white" key={key}>
            {renderNodes(node.content)}
          </h3>
        );
      }

      return (
        <h2 className="mb-3 text-2xl font-semibold text-white" key={key}>
          {renderNodes(node.content)}
        </h2>
      );
    }

    if (node.type === 'bulletList') {
      return (
        <ul className="mb-4 list-disc space-y-2 pl-6 text-zinc-200" key={key}>
          {renderNodes(node.content)}
        </ul>
      );
    }

    if (node.type === 'orderedList') {
      return (
        <ol className="mb-4 list-decimal space-y-2 pl-6 text-zinc-200" key={key}>
          {renderNodes(node.content)}
        </ol>
      );
    }

    if (node.type === 'listItem') {
      return <li key={key}>{renderNodes(node.content)}</li>;
    }

    if (node.type === 'blockquote') {
      return (
        <blockquote className="mb-4 rounded-2xl border-l-4 accent-border-60 bg-black/20 px-4 py-3 text-zinc-200" key={key}>
          {renderNodes(node.content)}
        </blockquote>
      );
    }

    if (node.type === 'codeBlock') {
      return (
        <pre className="mb-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-sm text-zinc-100" key={key}>
          <code>{node.content?.map((child) => child.text).join('') ?? ''}</code>
        </pre>
      );
    }

    if (node.type === 'hardBreak') {
      return <br key={key} />;
    }

    if (node.type === 'horizontalRule') {
      return <hr className="my-6 border-white/10" key={key} />;
    }

    if (node.type === 'image') {
      const src = typeof node.attrs?.src === 'string' ? node.attrs.src : '';
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : 'note image';
      if (!src) return null;

      return (
        <img
          alt={alt}
          className="mb-4 rounded-3xl border border-white/10 shadow-soft"
          key={key}
          src={src}
        />
      );
    }

    if (node.type === 'mathematics') {
      const latex = typeof node.attrs?.latex === 'string' ? node.attrs.latex : '';
      return (
        <div className="mb-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-sm accent-text-light" key={key}>
          {latex || renderNodes(node.content)}
        </div>
      );
    }

    if (node.type === 'doc') {
      return <div key={key}>{renderNodes(node.content)}</div>;
    }

    return (
      <div key={key} className="mb-4 text-zinc-200">
        {renderNodes(node.content)}
      </div>
    );
  });
}

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? '请求失败';
  } catch {
    return '请求失败';
  }
}

export function NoteReader({ noteId }: Props) {
  const [note, setNote] = useState<NoteDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadNote() {
      setLoading(true);
      const res = await fetch(`/api/notes/${noteId}`, { cache: 'no-store' });
      if (!res.ok) {
        setMessage(await readError(res));
        setLoading(false);
        return;
      }

      const data = (await res.json()) as NoteDetailDTO;
      setNote(data);
      setLoading(false);
    }

    void loadNote();
  }, [noteId]);

  if (loading) {
    return <p className="text-sm text-mutedText">加载中...</p>;
  }

  if (!note) {
    return <p className="text-sm text-orange-300">{message || '笔记不存在'}</p>;
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-zinc-400">{note.subject.name}</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{note.title}</h1>
          </div>
          <div className="flex gap-2">
            <Link className="btn-secondary" href="/notes">
              返回列表
            </Link>
            <Link className="btn-primary" href={`/notes/${note.id}`}>
              编辑笔记
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {note.isWrongQuestion ? (
            <span className="rounded-full border accent-border-40 accent-bg-10 px-3 py-1 text-xs accent-text-light">
              错题
            </span>
          ) : null}
          {note.tags.map((tag) => (
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300" key={tag.id}>
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      <article className="glass-card p-6">{renderNodes([note.contentJson as TipTapNode])}</article>
    </section>
  );
}
