'use client';

import { AuthProvider } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FarmGuard from '@/components/layout/FarmGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex" style={{ background: '#F8FAF8' }}>
        <Sidebar />
        
        {/* Main Content Area */}
        <div
          className="flex-1 flex flex-col min-h-screen transition-all duration-300"
          style={{ marginLeft: '0' }}
        >
          {/* Desktop margin for sidebar */}
          <style jsx>{`
            @media (min-width: 768px) {
              div { margin-left: 260px; }
            }
          `}</style>
          
          <Header />
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto animate-fade-in">
              <FarmGuard>
                {children}
              </FarmGuard>
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
