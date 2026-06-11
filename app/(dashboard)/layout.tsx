import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { Navbar } from '@/components/navbar';
import { ErrorBoundary } from '@/components/error-boundary';
import { PageTransition } from '@/components/page-transition';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
   <div className="pb-8">
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>
      <main className="mx-auto mt-5 w-full px-4 lg:mt-6 lg:pl-48">
        <div className="mx-auto min-w-0 max-w-[860px] xl:max-w-[920px]">
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
