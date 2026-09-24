'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { User, Sparkles } from 'lucide-react';

export const AppTopBar: React.FC = () => {
  const pathname = usePathname();
  const { medium, toggleMedium, student, isRegistered, openGate, plan } = useApp();

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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF5FF]/90 dark:bg-[#230542]/90 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#DDD6FE]/20 px-4 py-2.5 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: "Centum 💯" pill */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 shadow-xs hover:border-[#7C3AED] transition-all group"
        >
          <span className="text-sm font-black tracking-tight text-[#7C3AED] dark:text-[#A3E635] group-hover:text-[#6D28D9]">
            {texts.app.name}
          </span>
          <span className="text-xs">💯</span>
        </Link>

        {/* Right: profile avatar (guests: 👤 opens gate) */}
        <div>
          {isRegistered && student ? (
            <Link
              href="/profile"
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all cursor-pointer shadow-xs ${
                isProfileActive
                  ? 'bg-[#7C3AED] text-white ring-2 ring-[#A3E635]'
                  : plan === 'pro' || plan === 'live'
                  ? 'bg-[#7C3AED] text-white ring-2 ring-[#7C3AED] border-2 border-white'
                  : 'bg-[#F3E8FF] dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#FAF5FF] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:bg-[#EDE9FE]'
              }`}
              aria-label="Profile"
            >
              {getInitials(student.name)}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openGate()}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#DDD6FE] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] flex items-center justify-center transition-all cursor-pointer shadow-xs"
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
