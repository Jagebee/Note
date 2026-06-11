'use client';

import { BackgroundProvider } from '@/components/background-provider';
import { ToastProvider } from '@/components/toast-provider';
import { SessionProvider } from 'next-auth/react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BackgroundProvider>
        <ToastProvider>{children}</ToastProvider>
      </BackgroundProvider>
    </SessionProvider>
  );
}
