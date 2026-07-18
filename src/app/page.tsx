'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import StaffDashboard from '@/components/staff-dashboard';
import ClientPage from '@/components/client-page';

function AppRouter() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <ClientPage />;
  }

  return <StaffDashboard />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <AppRouter />
    </Suspense>
  );
}