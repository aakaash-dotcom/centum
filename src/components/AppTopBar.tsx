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
    <header className="sticky top-0 z-40 w-full bg-[#FAF5FF]/90 backdrop-blur-md border-b border-[#EDE9FE] px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: "Centum 💯" pill */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#DDD6FE] shadow-xs hover:border-[#7C3AED] transition-all group"
        >
          <span className="text-sm font-black tracking-tight text-[#7C3AED] group-hover:text-[#6D28D9]">
            {texts.app.name}
          </span>
          <span className="text-xs">💯</span>
        </Link>

        {/* Right: compact medium switch + profile avatar */}
        <div className="flex items-center gap-2">
          {/* Compact Medium Switch */}
          <button
            type="button"
            onClick={toggleMedium}
            className="h-8 px-2.5 rounded-full bg-white border border-[#DDD6FE] text-[11px] font-black text-[#7C3AED] hover:bg-[#F3E8FF] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            aria-label="Toggle Medium"
          >
            <span>{medium === 'english' ? 'English' : 'தமிழ்'}</span>
            <span className="text-[10px] text-[#A3E635] bg-[#2E1065] px-1 py-0.2 rounded-full">
              {medium === 'english' ? 'EN' : 'TA'}
            </span>
          </button>

          {/* Profile Avatar */}
          {isRegistered && student ? (
            <Link
              href="/profile"
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all cursor-pointer shadow-xs ${
                isProfileActive
                  ? 'bg-[#7C3AED] text-white ring-2 ring-[#A3E635]'
                  : plan === 'pro' || plan === 'live'
                  ? 'bg-[#7C3AED] text-white ring-2 ring-[#7C3AED] border-2 border-white'
                  : 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE] hover:bg-[#EDE9FE]'
              }`}
              aria-label="Profile"
            >
              {getInitials(student.name)}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openGate()}
              className="w-8 h-8 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED] hover:bg-[#F3E8FF] flex items-center justify-center transition-all cursor-pointer shadow-xs"
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
