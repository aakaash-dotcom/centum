import React from 'react';
import Link from 'next/link';
import { texts } from '@/data/texts';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in min-h-[60vh]">
      <div className="w-20 h-20 rounded-3xl bg-[#FAF5FF] dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center justify-center text-4xl shadow-md mb-4">
        🧭
      </div>
      <h1 className="text-4xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight mb-2">
        404
      </h1>
      <p className="text-base font-extrabold text-[#7C3AED] dark:text-[#A3E635] mb-6">
        {texts.states.lost}
      </p>
      <Link
        href="/"
        className="min-h-[48px] px-6 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span>back to home 🏠</span>
      </Link>
    </div>
  );
}
