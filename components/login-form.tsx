'use client';

import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleLogin() {
    const res = await signIn('credentials', { username, password, redirect: false });
    if (!res || res.error) {
      setError('账号或密码错误');
      return false;
    }
    return true;
  }

  async function handleRegister() {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, nickname: nickname || undefined })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message || '注册失败');
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    if (mode === 'register') {
      if (password.length < 6) { setError('密码至少 6 位'); setPending(false); return; }
      if (password !== confirmPw) { setError('两次密码不一致'); setPending(false); return; }
      if (username.length < 3) { setError('用户名至少 3 位'); setPending(false); return; }

      const registered = await handleRegister();
      if (!registered) { setPending(false); return; }
    }

    const loggedIn = await handleLogin();
    if (!loggedIn) { setPending(false); return; }

    // 根据角色跳转不同页面
    window.location.href = '/notes';
  }

  return (
    <form className="glass-card mx-auto w-full max-w-md space-y-4 p-8" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">
          {mode === 'login' ? '登录' : '注册'}
        </h1>
        <p className="text-sm text-zinc-400">
          {mode === 'login' ? '已有账号？直接登录' : '创建新账号，开始记笔记'}
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-zinc-200">用户名</span>
        <input className="input-base" onChange={e => setUsername(e.target.value)}
          placeholder={mode === 'login' ? '输入用户名' : '至少 3 位字符'} required value={username} />
      </label>

      {mode === 'register' ? (
        <label className="block space-y-2">
          <span className="text-sm text-zinc-200">昵称（可选）</span>
          <input className="input-base" onChange={e => setNickname(e.target.value)}
            placeholder="你的显示名称" value={nickname} />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm text-zinc-200">密码</span>
        <input className="input-base" onChange={e => setPassword(e.target.value)}
          placeholder={mode === 'register' ? '至少 6 位密码' : '请输入密码'}
          required type="password" value={password} />
      </label>

      {mode === 'register' ? (
        <label className="block space-y-2">
          <span className="text-sm text-zinc-200">确认密码</span>
          <input className="input-base" onChange={e => setConfirmPw(e.target.value)}
            placeholder="再次输入密码" required type="password" value={confirmPw} />
        </label>
      ) : null}

      {error ? <p className="text-sm text-orange-300">{error}</p> : null}

      <button className="btn-primary w-full" disabled={pending} type="submit">
        {pending ? '处理中...' : (mode === 'login' ? '登录' : '注册并登录')}
      </button>

      <div className="text-center">
        <button className="text-sm text-zinc-400 transition hover:text-white" type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? '没有账号？点此注册' : '已有账号？点此登录'}
        </button>
      </div>
    </form>
  );
}
