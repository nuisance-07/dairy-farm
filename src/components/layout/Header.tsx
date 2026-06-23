'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Search, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { NAV_ITEMS, REORDER_THRESHOLD_KG } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const { user, farm } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; desc: string; type: 'info' | 'warning' | 'success'; time: string }[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAlerts() {
      if (!farm) return;
      const [purchasesRes, usageRes] = await Promise.all([
        supabase.from('feed_purchases').select('feed_type, quantity').eq('farm_id', farm.id),
        supabase.from('feed_usage').select('feed_type, quantity_used').eq('farm_id', farm.id),
      ]);
      const purchases = purchasesRes.data || [];
      const usage = usageRes.data || [];

      const purchaseMap: Record<string, number> = {};
      purchases.forEach((p) => { purchaseMap[p.feed_type] = (purchaseMap[p.feed_type] || 0) + Number(p.quantity); });

      const usageMap: Record<string, number> = {};
      usage.forEach((u) => { usageMap[u.feed_type] = (usageMap[u.feed_type] || 0) + Number(u.quantity_used); });

      const alerts: typeof notifications = [];
      Object.entries(purchaseMap).forEach(([feed_type, total_purchased]) => {
        const total_used = usageMap[feed_type] || 0;
        const current_stock = Math.max(total_purchased - total_used, 0);
        if (current_stock < REORDER_THRESHOLD_KG) {
          alerts.push({
            id: `low_feed_${feed_type}`,
            title: 'Low Feed Alert',
            desc: `Your stock of ${feed_type} is running low (${current_stock} remaining). Please reorder soon.`,
            type: 'warning',
            time: 'Just now',
          });
        }
      });

      setNotifications([
        ...alerts,
        { id: 'welcome', title: 'Welcome to DairyFlow!', desc: 'Your farm dashboard is successfully set up and ready to use.', type: 'success', time: 'Recently' },
      ]);
    }
    fetchAlerts();
  }, [farm, supabase]);

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
            {notifications.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: '#EF4444' }}
              />
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border"
              style={{ borderColor: '#E2E8E2', animation: 'fadeIn 0.2s ease-out' }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Notifications</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">{notifications.length} New</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">You're all caught up!</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                          {n.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                          {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
