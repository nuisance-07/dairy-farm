'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Settings, Beef, Milk, ShoppingCart, Wallet,
  Wheat, Stethoscope, Users, Receipt, Tractor, FileBarChart,
  TrendingUp, ArrowLeftRight, Package, ChevronLeft, ChevronRight,
  Menu, X, LogOut, BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS } from '@/lib/constants';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Settings, Beef, Milk, ShoppingCart, Wallet,
  Wheat, Stethoscope, Users, Receipt, Tractor, FileBarChart,
  TrendingUp, ArrowLeftRight, Package, BookOpen,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { farm, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}>
          <Milk className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>DairyFlow</h1>
            {farm && <p className="text-xs truncate max-w-[140px]" style={{ color: '#81C784' }}>{farm.name}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
              style={{
                background: active ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                color: active ? '#FFFFFF' : '#A5D6A7',
              }}
              title={collapsed ? item.label : undefined}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#A5D6A7';
                }
              }}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {active && (
                <div
                  className="absolute left-0 w-[3px] h-6 rounded-r-full"
                  style={{ background: '#4CAF50' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200"
          style={{ color: '#EF9A9A' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300"
        style={{
          width: collapsed ? '72px' : '260px',
          background: 'linear-gradient(180deg, #0A1F0E 0%, #0F2B14 50%, #132F17 100%)',
          boxShadow: '4px 0 16px rgba(0,0,0,0.2)',
        }}
      >
        <NavContent />
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-50"
          style={{
            background: '#1B5E20',
            border: '2px solid #0F2B14',
            color: 'white',
          }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: '#1B5E20', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-[280px] h-full flex flex-col animate-slide-in-left"
            style={{
              background: 'linear-gradient(180deg, #0A1F0E 0%, #0F2B14 50%, #132F17 100%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-green-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
