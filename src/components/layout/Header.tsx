'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Search } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';

export default function Header() {
  const pathname = usePathname();
  const { user, farm } = useAuth();

  const currentPage = NAV_ITEMS.find((item) => {
    if (item.href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(item.href);
  });

  const pageTitle = currentPage?.label || 'Dashboard';

  // Get user initials for avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
      style={{
        background: 'rgba(248, 250, 248, 0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: '#E2E8E2',
        minHeight: '64px',
      }}
    >
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        {/* Spacer for mobile hamburger */}
        <div className="md:hidden w-10" />
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
            {pageTitle}
          </h1>
          {farm && (
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              {farm.name} {farm.location ? `• ${farm.location}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F1F8F1', border: '1px solid #E2E8E2' }}>
          <Search className="w-4 h-4" style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-40"
            style={{ color: '#4A5568' }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: '#4A5568' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E8F5E9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell className="w-[18px] h-[18px]" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#EF4444' }}
          />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #388E3C, #2E7D32)' }}
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium" style={{ color: '#1A1A2E' }}>
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Farm Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}
