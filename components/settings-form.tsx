'use client';

import { signOut, useSession } from 'next-auth/react';
import { ChangeEvent, useEffect, useState } from 'react';

import { useBackground } from '@/components/background-provider';
import { useToast } from '@/components/toast-provider';

const THEME_COLORS = [
  { name: '橙色', value: '#f97316' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#10b981' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '红色', value: '#ef4444' },
  { name: '青色', value: '#14b8a6' },
  { name: '粉色', value: '#ec4899' },
  { name: '琥珀', value: '#f59e0b' }
];

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

const BG_RECOMMEND: Record<string, string> = {
  '晨雾山脊': '#14b8a6',
  '黑金建筑': '#f59e0b',
  '胶片书桌': '#a855f7'
};

interface ProfileData {
  username: string;
  nickname: string | null;
  avatar: string | null;
  backgroundImage: string | null;
  accentColor: string | null;
}

export function SettingsForm() {
  const { data: session } = useSession();
  const { backgroundImage, setBackgroundImage, accentColor, setAccentColor } = useBackground();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // 密码表单
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwPending, setPwPending] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as ProfileData;
      setProfile(data);
      setNickname(data.nickname ?? '');
    }
    void load();
  }, []);

  async function saveProfile() {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() || null })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error?.message ?? '保存失败');
      return;
    }
    toast.success('昵称已更新');
  }

  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('上传失败');
      const { path } = (await uploadRes.json()) as { path: string };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: path })
      });
      if (!res.ok) throw new Error('保存头像失败');

      setAvatarPreview(path);
      setProfile((prev) => (prev ? { ...prev, avatar: path } : prev));
      toast.success('头像已更新');
    } catch {
      toast.error('头像处理失败');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleBackgroundSelect(value: string | null) {
    try {
      await setBackgroundImage(value);
      // 如果背景是预设，自动推荐对应配色
      if (value) {
        for (const [label, color] of Object.entries(BG_RECOMMEND)) {
          if (value.includes(label) || value.includes('unsplash')) {
            // 用标签匹配预设
            const preset = PRESET_BACKGROUNDS.find((p) => p.value === value);
            if (preset && BG_RECOMMEND[preset.label]) {
              await setAccentColor(BG_RECOMMEND[preset.label]);
            }
            break;
          }
        }
      }
      toast.success('背景已更新');
    } catch {
      toast.error('背景保存失败');
    }
  }

  async function handleBackgroundUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('上传失败');
      const { path } = (await uploadRes.json()) as { path: string };

      await setBackgroundImage(path);
      toast.success('背景已更新');
    } catch {
      toast.error('背景上传失败');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleColorSelect(color: string | null) {
    try {
      await setAccentColor(color);
      toast.success('配色已更新');
    } catch {
      toast.error('配色保存失败');
    }
  }

  function handleAutoRecommend() {
    if (!backgroundImage) {
      handleColorSelect('#f97316');
      return;
    }
    for (const [label, color] of Object.entries(BG_RECOMMEND)) {
      if (backgroundImage.includes(label)) {
        handleColorSelect(color);
        return;
      }
    }
    handleColorSelect('#f97316');
  }

  async function handlePasswordChange() {
    setPwMessage('');

    if (!currentPw || !newPw) {
      setPwMessage('请填写所有密码字段');
      return;
    }
    if (newPw.length < 6) {
      setPwMessage('新密码至少 6 位');
      return;
    }
    if (newPw !== confirmPw) {
      setPwMessage('两次新密码不一致');
      return;
    }

    setPwPending(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setPwMessage(err?.error?.message ?? '密码修改失败');
        return;
      }
      setPwMessage('密码已修改');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } finally {
      setPwPending(false);
    }
  }

  const displayName = profile?.nickname || profile?.username || '用户';
  const avatarSrc = avatarPreview ?? profile?.avatar ?? null;
  const currentAccent = accentColor || profile?.accentColor || null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ===== 个人资料 ===== */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white">个人资料</h2>
        <p className="mt-1 text-sm text-zinc-400">修改昵称和头像</p>

        <div className="mt-6 flex items-center gap-5">
          <div className="relative h-16 w-16 flex-shrink-0">
            {avatarSrc ? (
              <img
                className="h-full w-full rounded-full object-cover ring-2"
                className="h-full w-full rounded-full object-cover ring-2 accent-ring-40"
                src={avatarSrc}
                alt="avatar"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br accent-from-30 to-white/10 text-xl font-bold accent-text ring-2 accent-ring-40">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
              <input accept="image/*" className="hidden" onChange={handleAvatarUpload} type="file" />
              +
            </label>
          </div>

          <div className="flex-1 space-y-2">
            <label className="block text-sm text-zinc-300">昵称</label>
            <input
              className="input-base w-full"
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入昵称"
              value={nickname}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="btn-primary"
            disabled={isUploading}
            onClick={saveProfile}
            type="button"
          >
            {isUploading ? '保存中...' : '保存'}
          </button>
        </div>
      </section>

      {/* ===== 主题配色 ===== */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white">主题配色</h2>
        <p className="mt-1 text-sm text-zinc-400">选择你喜欢的主题色，或根据背景图片自动推荐</p>

        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">预设配色</p>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map((color) => {
              const active = currentAccent === color.value;
              return (
                <button
                  key={color.name}
                  className={`h-10 w-10 rounded-full transition ${
                    active ? 'ring-2 ring-white ring-offset-2 ring-offset-black/80' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                  type="button"
                />
              );
            })}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-zinc-800 text-xs text-zinc-400 transition hover-accent-border-50 hover:text-white"
              onClick={() => handleColorSelect(null)}
              title="恢复默认"
              type="button"
            >
              ↺
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover-accent-border-50">
              <span>自定义颜色</span>
              <input
                className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                type="color"
                value={currentAccent ?? '#f97316'}
                onChange={(e) => handleColorSelect(e.target.value)}
              />
            </label>
            <button
              className="rounded-xl border accent-border-30 accent-bg-10 px-3 py-2 text-sm accent-text-light transition hover-accent-bg-20"
              onClick={handleAutoRecommend}
              type="button"
            >
              根据背景推荐
            </button>
          </div>
        </div>
      </section>

      {/* ===== 背景设置 ===== */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white">背景设置</h2>
        <p className="mt-1 text-sm text-zinc-400">自定义工作区背景</p>

        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">预设背景</p>
          <div className="grid grid-cols-3 gap-3">
            {PRESET_BACKGROUNDS.map((preset) => {
              const active = backgroundImage === preset.value;
              return (
                <button
                  className={`overflow-hidden rounded-2xl border transition ${
                    active ? 'accent-border-70 shadow-glow' : 'border-white/10'
                  }`}
                  key={preset.label}
                  onClick={() => handleBackgroundSelect(preset.value)}
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

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">自定义上传</p>
            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-5 text-sm text-zinc-300 transition hover-accent-border-50 hover:text-white">
              <input accept="image/*" className="hidden" onChange={handleBackgroundUpload} type="file" />
              {isUploading ? '上传中...' : '选择图片并设为背景'}
            </label>
          </div>

          <button
            className="text-sm text-zinc-400 transition hover:text-white"
            onClick={() => handleBackgroundSelect(null)}
            type="button"
          >
            恢复默认
          </button>
        </div>
      </section>

      {/* ===== 账户 ===== */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white">账户</h2>
        <p className="mt-1 text-sm text-zinc-400">密码与登录</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-300">用户名</label>
            <input
              className="input-base mt-1 w-full bg-black/30 text-zinc-500"
              disabled
              value={profile?.username ?? ''}
            />
            <p className="mt-1 text-xs text-zinc-500">用户名不可修改</p>
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <p className="mb-3 text-sm font-medium text-white">修改密码</p>
            <div className="space-y-3">
              <input
                className="input-base w-full"
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="当前密码"
                type="password"
                value={currentPw}
              />
              <input
                className="input-base w-full"
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="新密码（至少 6 位）"
                type="password"
                value={newPw}
              />
              <input
                className="input-base w-full"
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="确认新密码"
                type="password"
                value={confirmPw}
              />
              {pwMessage ? (
                <p className={`text-sm ${pwMessage.includes('已修改') ? 'text-green-400' : 'text-orange-300'}`}>
                  {pwMessage}
                </p>
              ) : null}
              <button
                className="btn-primary"
                disabled={pwPending}
                onClick={handlePasswordChange}
                type="button"
              >
                {pwPending ? '修改中...' : '更新密码'}
              </button>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <button
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
              onClick={() => signOut({ callbackUrl: '/login' })}
              type="button"
            >
              退出登录
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
