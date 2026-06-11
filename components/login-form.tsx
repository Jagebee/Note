'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false
    });

    if (!res || res.error) {
      setError('账号或密码错误。');
      setPending(false);
      return;
    }

    router.push('/notes');
    router.refresh();
  }

  return (
    <form className="glass-card mx-auto w-full max-w-md space-y-4 p-8" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">管理员登录</h1>
        <p className="text-sm text-mutedText">仅支持固定管理员账号登录</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-zinc-200">用户名</span>
        <input
          className="input-base"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          required
          value={username}
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-zinc-200">密码</span>
        <input
          className="input-base"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="text-sm text-orange-300">{error}</p> : null}

      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
