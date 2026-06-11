'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      className="btn-secondary"
      onClick={() => {
        signOut({ callbackUrl: '/login' });
      }}
      type="button"
    >
      退出登录
    </button>
  );
}
