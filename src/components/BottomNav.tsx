'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Home, Brain, Newspaper, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { student, isRegistered } = useApp();

  const navItems = [
    {
      name: texts.nav.home,
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      name: texts.nav.tests,
      href: '/tests',
      icon: Brain,
      isActive: pathname.startsWith('/tests'),
    },
    {
      name: texts.nav.news,
      href: '/news',
      icon: Newspaper,
      isActive: pathname.startsWith('/news'),
    },
  ];

  // Helper for initials (e.g. "Arun Kumar" -> "AK")
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
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE9FE] shadow-[0_-4px_20px_rgba(124,58,237,0.06)]"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 h-full min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all ${
                item.isActive
                  ? 'text-[#7C3AED] font-black scale-105'
                  : 'text-[#6D28D9]/60 hover:text-[#2E1065] font-semibold'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-all ${
                  item.isActive ? 'bg-[#FAF5FF] shadow-xs' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[11px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}

        {/* Profile Tab - Shows Avatar + Initials when Registered! */}
        <Link
          href="/profile"
          className={`flex-1 h-full min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all ${
            isProfileActive
              ? 'text-[#7C3AED] font-black scale-105'
              : 'text-[#6D28D9]/60 hover:text-[#2E1065] font-semibold'
          }`}
        >
          {isRegistered && student ? (
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                isProfileActive
                  ? 'bg-[#7C3AED] text-white ring-2 ring-[#A3E635]'
                  : 'bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]'
              }`}
            >
              {getInitials(student.name)}
            </div>
          ) : (
            <div
              className={`p-1.5 rounded-full transition-all ${
                isProfileActive ? 'bg-[#FAF5FF] shadow-xs' : ''
              }`}
            >
              <User className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
          )}
          <span className="text-[11px] tracking-tight">{texts.nav.profile}</span>
        </Link>
      </div>
    </nav>
  );
};
