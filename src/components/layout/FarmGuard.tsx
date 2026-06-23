'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function FarmGuard({ children }: { children: React.ReactNode }) {
  const { farm, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!farm && pathname !== '/dashboard/farm-setup') {
    return (
      <EmptyState
        title="Welcome to DairyFlow!"
        description="Please set up your farm to access this module and start tracking your operations."
        action={
          <Link href="/dashboard/farm-setup" className="btn btn-primary">
            Set Up Your Farm
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
