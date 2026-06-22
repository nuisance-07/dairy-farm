'use client';

import { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state py-16">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: '#E8F5E9', color: '#388E3C' }}
      >
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}
      >
        {title}
      </h3>
      <p className="text-sm max-w-sm mb-6" style={{ color: '#94A3B8' }}>
        {description}
      </p>
      {action}
    </div>
  );
}
