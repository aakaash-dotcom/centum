'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { User, Sparkles } from 'lucide-react';

export function formatCoins(amount: number): string {
  if (amount >= 1000) {
    const kVal = (amount / 1000).toFixed(1).replace(/\.0$/, '');
    return `${kVal}k`;
  }
  return String(amount);
}

export const AppTopBar: React.FC = () => {
  const pathname = usePathname();
  const { student, isRegistered, openGate, plan, coinsBalance, equippedAvatarFrame } = useApp();

  // Helper for initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isProfileActive = pathname === '/profile';
  const isCoinsActive = pathname === '/coins';
  const isUserPro = plan === 'pro' || plan === 'live';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF5FF]/95 dark:bg-[#0F0618]/95 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#3B2063] px-4 py-2.5 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: "Centum 💯" pill */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] shadow-xs hover:border-[#7C3AED] transition-all group"
        >
          <span className="text-sm font-black tracking-tight text-[#7C3AED] dark:text-[#A78BFA] group-hover:text-[#6D28D9]">
            {texts.app.name}
          </span>
          <span className="text-xs">💯</span>
        </Link>

        {/* Right Section: Coins Chip + Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* Coins Chip: 🪙 {balance} -> /coins */}
          <Link
            href="/coins"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs border ${
              isCoinsActive
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] text-[#2E1065] dark:text-[#F5F0FF] hover:border-amber-400/70 hover:shadow-amber-400/10'
            }`}
            title="Centum Coins"
          >
            <span className="text-sm">🪙</span>
            <span>{formatCoins(coinsBalance)}</span>
          </Link>

          {/* Profile Avatar (guests: 👤 opens gate) */}
          {isRegistered && student ? (
            <Link
              href="/profile"
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all cursor-pointer shadow-xs relative ${
                isProfileActive
                  ? 'bg-[#7C3AED] text-white ring-2 ring-[#A3E635]'
                  : isUserPro
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 ring-2 ring-amber-400 font-extrabold shadow-sm'
                  : 'bg-[#F3E8FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#F5F0FF] border border-[#DDD6FE] dark:border-[#3B2063] hover:bg-[#EDE9FE]'
              } ${
                equippedAvatarFrame === 'centum-gold'
                  ? 'ring-2 ring-amber-400 border border-yellow-200'
                  : equippedAvatarFrame === 'neon-flame'
                  ? 'ring-2 ring-orange-500 border border-amber-300'
                  : equippedAvatarFrame === 'cyber-neon'
                  ? 'ring-2 ring-lime-400 border border-emerald-300'
                  : equippedAvatarFrame === 'diamond-star'
                  ? 'ring-2 ring-cyan-400 border border-blue-200'
                  : ''
              }`}
              aria-label="Profile"
            >
              {getInitials(student.name)}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openGate()}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#B9A6D9] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              aria-label="Unlock profile"
            >
              <User className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
