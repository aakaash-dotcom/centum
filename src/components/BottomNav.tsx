'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { texts } from '@/data/texts';
import { Home, BookOpen, Brain, Newspaper } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: texts.nav.home,
      href: '/',
      icon: Home,
      isActive: pathname === '/',
      emoji: '🏠',
    },
    {
      name: texts.nav.materials,
      href: '/materials',
      icon: BookOpen,
      isActive: pathname.startsWith('/materials') || pathname.startsWith('/class'),
      emoji: '📚',
    },
    {
      name: texts.nav.tests,
      href: '/tests',
      icon: Brain,
      isActive: pathname.startsWith('/tests'),
      emoji: '🧠',
    },
    {
      name: texts.nav.news,
      href: '/news',
      icon: Newspaper,
      isActive: pathname.startsWith('/news'),
      emoji: '📰',
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#3B0F6E]/95 backdrop-blur-md border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-[0_-4px_20px_rgba(124,58,237,0.06)] transition-colors"
    >
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 h-full min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all ${
                item.isActive
                  ? 'text-[#7C3AED] dark:text-[#A3E635] font-black scale-105'
                  : 'text-[#6D28D9]/60 dark:text-[#DDD6FE]/60 hover:text-[#2E1065] dark:hover:text-[#FAF5FF] font-semibold'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-all ${
                  item.isActive ? 'bg-[#FAF5FF] dark:bg-[#230542] shadow-xs' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[11px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
