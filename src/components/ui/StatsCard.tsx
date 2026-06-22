'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeLabel?: string;
  variant?: 'default' | 'green' | 'blue' | 'yellow' | 'red';
}

const variantStyles = {
  default: {
    bg: '#FFFFFF',
    iconBg: '#E8F5E9',
    iconColor: '#388E3C',
    border: '#E2E8E2',
  },
  green: {
    bg: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
    iconBg: 'rgba(255,255,255,0.15)',
    iconColor: '#FFFFFF',
    border: 'transparent',
  },
  blue: {
    bg: '#FFFFFF',
    iconBg: '#DBEAFE',
    iconColor: '#3B82F6',
    border: '#E2E8E2',
  },
  yellow: {
    bg: '#FFFFFF',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    border: '#E2E8E2',
  },
  red: {
    bg: '#FFFFFF',
    iconBg: '#FEE2E2',
    iconColor: '#EF4444',
    border: '#E2E8E2',
  },
};

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  variant = 'default',
}: StatsCardProps) {
  const style = variantStyles[variant];
  const isGreen = variant === 'green';

  return (
    <div
      className="stat-card rounded-xl p-5 transition-all duration-200 hover:shadow-lg"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: style.iconBg, color: style.iconColor }}
        >
          {icon}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs font-medium" style={{
            color: change > 0 ? (isGreen ? '#A5D6A7' : '#22C55E') : change < 0 ? '#EF4444' : '#94A3B8',
          }}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {formatNumber(Math.abs(change))}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-2xl font-bold" style={{
          fontFamily: 'Outfit, sans-serif',
          color: isGreen ? '#FFFFFF' : '#1A1A2E',
        }}>
          {value}
        </p>
        <p className="text-xs mt-1" style={{
          color: isGreen ? '#A5D6A7' : '#94A3B8',
        }}>
          {title}
          {changeLabel && <span className="ml-1">({changeLabel})</span>}
        </p>
      </div>
    </div>
  );
}
