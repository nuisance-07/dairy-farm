'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Search, Info, CheckCircle2 } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';

export default function Header() {
  const pathname = usePathname();
  const { user, farm } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={notificationRef}>
          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: '#4A5568' }}
            onClick={() => setShowNotifications(!showNotifications)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E8F5E9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Bell className="w-[18px] h-[18px]" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: '#EF4444' }}
            />
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border"
              style={{ borderColor: '#E2E8E2', animation: 'fadeIn 0.2s ease-out' }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Notifications</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">2 New</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Welcome to DairyFlow!</p>
                      <p className="text-xs text-gray-500 mt-0.5">Your farm dashboard is successfully set up and ready to use.</p>
                      <p className="text-[10px] text-gray-400 mt-1">Just now</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <div className="mt-0.5"><Info className="w-5 h-5 text-blue-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">System Tip</p>
                      <p className="text-xs text-gray-500 mt-0.5">You can install this app to your home screen from your mobile browser menu.</p>
                      <p className="text-[10px] text-gray-400 mt-1">2 mins ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 text-center border-t border-gray-100">
                <button className="text-sm font-medium text-green-700 hover:text-green-800">Mark all as read</button>
              </div>
            </div>
          )}
        </div>

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
