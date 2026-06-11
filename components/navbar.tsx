'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';


const navItems = [
  { href: '/notes', label: '📝 Notes', hint: 'Notes' },
  { href: '/subjects', label: '📚 Subjects', hint: 'Subjects' },
  { href: '/tags', label: '🏷️ Tags', hint: 'Tags' },
  { href: '/wrong', label: '❌ Wrong Qs', hint: 'Review' }
];

function isActive(pathname: string, href: string) {
  if (href === '/notes') {
    return pathname === '/notes' || pathname.startsWith('/notes/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setAvatar(data.avatar ?? null);
      setNickname(data.nickname ?? null);
    }
    void loadProfile();
  }, []);

  const displayName = nickname || session?.user?.username || 'U';

  return (
    <>
      <header className="mx-auto w-full max-w-7xl px-4 pt-4 lg:hidden">
        <div className="glass-card flex items-center gap-2 px-4 py-3">
          <Link className="flex-shrink-0" href="/notes">
            <span className="text-2xl font-black tracking-[0.15em] text-white">N</span>
          </Link>
          <Link
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border accent-border-30 bg-gradient-to-br accent-from-20 to-white/5 text-xs font-bold accent-text transition hover:ring-2 hover-accent-ring-50"
            href="/settings"
          >
            {avatar ? (
              <img className="h-full w-full object-cover" src={avatar} alt="avatar" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </Link>
          <Link
            href="/settings"
            className="min-w-0 truncate text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            {displayName}
          </Link>
        </div>

        <nav className="mt-3 grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={`rounded-2xl border px-3 py-3 text-center text-sm transition ${
                  active
                    ? 'accent-border-55 accent-bg-15 text-white shadow-glow'
                    : 'border-white/10 bg-black/20 text-zinc-300 hover-accent-border-35 hover:text-white'
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ===== 侧边栏 开始 ===== */}
     <aside className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-white/[0.06] bg-black/60 backdrop-blur-2xl">
          <div className="flex items-center gap-2 px-4 pt-5 pb-4">
            <Link className="flex-shrink-0" href="/notes">
              <span className="text-4xl font-black tracking-[0.15em] accent-text">N</span>
            </Link>
            <Link
              className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border accent-border-30 bg-gradient-to-br accent-from-20 to-white/5 transition hover:ring-2 hover-accent-ring-50"
              href="/settings"
            >
              {avatar ? (
                <img className="h-full w-full object-cover" src={avatar} alt="avatar" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold accent-text">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <Link
              href="/settings"
              className="min-w-0 flex-shrink truncate text-sm font-semibold text-white transition hover:accent-text"
            >
              {displayName}
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-4 pb-4">
            {navItems.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  className={`group rounded-[1.25rem] px-4 py-3 text-left transition ${
                    active
                      ? 'accent-bg-15 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <p className="text-sm font-bold">{item.label}</p>
                </Link>
              );
            })}
         </nav>

          <Link
            className={`group mx-4 rounded-[1.25rem] px-4 py-2.5 text-left transition ${
              isActive(pathname, '/trash')
                ? 'accent-bg-15 text-white'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
            href="/trash"
          >
            <p className="text-sm font-bold">🗑️ Trash</p>
          </Link>

          <Link
            className={`group mb-2 mx-4 rounded-[1.25rem] px-4 py-2.5 text-left transition ${
              isActive(pathname, '/settings')
                ? 'accent-bg-15 text-white'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
            href="/settings"
          >
            <p className="text-sm font-bold">⚙️ Settings</p>
          </Link>

          <div className="border-t border-white/[0.06] px-4 py-2">
            <button
              className="w-full rounded-[1.25rem] px-4 py-2.5 text-left text-sm font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white"
              onClick={() => {
                const a = document.createElement('a');
                a.href = '/api/export';
                a.download = '';
                a.click();
              }}
              type="button"
            >
              📥 Export
            </button>
          </div>

        </div>
     </aside>
      {/* ===== 侧边栏 结束 ===== */}
    </>
  );
}
