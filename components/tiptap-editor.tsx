'use client';

import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Mathematics from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { all, createLowlight } from 'lowlight';
import { useEffect, useRef } from 'react';

interface Props {
  initialContent?: unknown;
  noteId?: string;
  onChange: (payload: { contentJson: unknown; plainText: string; imagePaths: string[] }) => void;
}

const lowlight = createLowlight(all);

function collectImagePaths(json: unknown): string[] {
  if (!json || typeof json !== 'object') return [];

  const paths: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const typed = node as { type?: string; attrs?: { src?: string }; content?: unknown[] };

    if (typed.type === 'image' && typed.attrs?.src?.startsWith('/uploads/')) {
      paths.push(typed.attrs.src);
    }

    if (Array.isArray(typed.content)) {
      typed.content.forEach((child) => walk(child));
    }
  };

  walk(json);
  return Array.from(new Set(paths));
}

async function uploadImage(file: File, noteId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (noteId) formData.append('noteId', noteId);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error('图片上传失败');
  }

  const data = (await res.json()) as { path: string };
  return data.path;
}

export function TipTapEditor({ initialContent, noteId, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    content:
      initialContent ?? {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      },
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false
        }
      }),
      Image,
      Placeholder.configure({
        placeholder: '输入你的笔记内容，支持 Markdown 快捷输入、代码块、公式和图片...'
      })
    ],
    editorProps: {
      attributes: {
        class: 'tiptap prose-dark'
      },
      handlePaste(view, event) {
        // 支持从剪贴板直接粘贴图片，自动上传并插入编辑器
        const files = event.clipboardData?.files;
        if (!files?.length) return false;

        Array.from(files).forEach((file) => {
          if (!file.type.startsWith('image/')) return;

          void (async () => {
            const path = await uploadImage(file, noteId);
            view.dispatch(view.state.tr);
            editor?.chain().focus().setImage({ src: path }).run();
          })();
        });

        return true;
      }
    },
    onUpdate({ editor: currentEditor }) {
      // 实时把 JSON + 纯文本 + 图片路径同步给父组件，提交时直接可用
      const json = currentEditor.getJSON();
      onChange({
        contentJson: json,
        plainText: currentEditor.getText(),
        imagePaths: collectImagePaths(json)
      });
    }
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(
      initialContent ?? {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      },
      false
    );
    onChange({
      contentJson: editor.getJSON(),
      plainText: editor.getText(),
      imagePaths: collectImagePaths(editor.getJSON())
    });
  }, [editor, initialContent, onChange]);

  async function handleImageFile(file: File) {
    if (!editor) return;
    try {
      const path = await uploadImage(file, noteId);
      editor.chain().focus().setImage({ src: path }).run();
    } catch {
      window.alert('图片上传失败，请稍后重试。');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => editor?.chain().focus().toggleBold().run()} type="button">
          粗体
        </button>
        <button className="btn-secondary" onClick={() => editor?.chain().focus().toggleItalic().run()} type="button">
          斜体
        </button>
        <button
          className="btn-secondary"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          type="button"
        >
          标题
        </button>
        <button
          className="btn-secondary"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          type="button"
        >
          代码块
        </button>
        <button
          className="btn-secondary"
          onClick={() => editor?.chain().focus().insertContent('$$\\n\\frac{a}{b}\\n$$').run()}
          type="button"
        >
          公式
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            fileInputRef.current?.click();
          }}
          type="button"
        >
          上传图片
        </button>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void handleImageFile(file);
          event.currentTarget.value = '';
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="glass-card p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
