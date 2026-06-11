import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';

import './globals.css';
import { AppProviders } from '@/components/providers';

export const metadata: Metadata = {
  title: '考研笔记存储站',
  description: '单用户考研笔记管理系统'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
