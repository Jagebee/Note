'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  _count: { notes: number; subjects: number; tags: number };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      window.location.href = '/notes';
      return;
    }
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status]);

  return (
    <div className="space-y-6">
      <section className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">管理后台</h1>
            <p className="mt-1 text-sm text-zinc-400">用户管理 · 共 {users.length} 个用户</p>
          </div>
          <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
            onClick={() => signOut({ callbackUrl: '/login' })} type="button">
            退出
          </button>
        </div>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">角色</th>
                <th className="px-4 py-3 text-center">笔记</th>
                <th className="px-4 py-3 text-center">科目</th>
                <th className="px-4 py-3 text-center">标签</th>
                <th className="px-4 py-3">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">加载中...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">暂无用户</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-t border-white/[0.06] transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-accent/30 bg-gradient-to-br from-accent/20 to-white/5 text-xs font-bold text-accent">
                        {u.nickname?.[0] || u.username[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.nickname || u.username}</p>
                        <p className="text-xs text-zinc-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${u.role === 'ADMIN' ? 'bg-accent/15 text-accent-text' : 'bg-white/10 text-zinc-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-300">{u._count.notes}</td>
                  <td className="px-4 py-3 text-center text-zinc-300">{u._count.subjects}</td>
                  <td className="px-4 py-3 text-center text-zinc-300">{u._count.tags}</td>
                  <td className="px-4 py-3 text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
