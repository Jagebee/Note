'use client';

import { ChangeEvent, useState } from 'react';

import { useBackground } from '@/components/background-provider';

const PRESET_BACKGROUNDS = [
  {
    label: '晨雾山脊',
    value:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80'
  },
  {
    label: '黑金建筑',
    value:
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=80'
  },
  {
    label: '胶片书桌',
    value:
      'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1600&q=80'
  }
];

async function uploadBackground(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? '背景图片上传失败');
  }

  const data = (await response.json()) as { path: string };
  return data.path;
}

export function BackgroundCustomizer() {
  const { backgroundImage, setBackgroundImage } = useBackground();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const path = await uploadBackground(file);
      try {
        await setBackgroundImage(path);
      } catch {
        setMessage('背景上传成功，但保存失败，请检查数据库迁移后重试');
        return;
      }
      setMessage('背景已更新');
    } catch {
      setMessage('背景图片处理失败，请查看终端或提示信息');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="relative">
      <button className="btn-secondary" onClick={() => setIsOpen((open) => !open)} type="button">
        背景
      </button>

      {isOpen ? (
        <div className="glass-card absolute right-0 top-14 w-[320px] space-y-4 p-4">
          <div>
            <p className="text-sm font-semibold text-white">背景设置</p>
            <p className="mt-1 text-xs text-zinc-400">可以换成自己喜欢的图片，系统会自动叠加暗色毛玻璃层。</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">精选背景</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_BACKGROUNDS.map((preset) => {
                const active = backgroundImage === preset.value;
                return (
                  <button
                  className={`overflow-hidden rounded-2xl border transition ${
                    active ? 'accent-border-70 shadow-glow' : 'border-white/10'
                  }`}
                  key={preset.label}
                    onClick={async () => {
                      try {
                        await setBackgroundImage(preset.value);
                        setMessage('背景已更新');
                      } catch {
                        setMessage('背景保存失败，请检查数据库迁移后重试');
                      }
                    }}
                    type="button"
                  >
                    <div
                      className="h-20 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${preset.value})` }}
                    />
                    <div className="border-t border-white/10 bg-black/35 px-2 py-1.5 text-xs text-zinc-200">
                      {preset.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">自定义上传</p>
            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-5 text-sm text-zinc-300 transition hover-accent-border-50 hover:text-white">
              <input accept="image/*" className="hidden" onChange={handleFileChange} type="file" />
              {isUploading ? '上传中...' : '选择图片并设为背景'}
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              className="text-sm text-zinc-400 transition hover:text-white"
              onClick={async () => {
                try {
                  await setBackgroundImage(null);
                  setMessage('已恢复默认背景');
                } catch {
                  setMessage('背景保存失败，请检查数据库迁移后重试');
                }
              }}
              type="button"
            >
              恢复默认
            </button>
            {message ? <span className="text-xs text-orange-300">{message}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
