'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MediumToggle } from '@/components/MediumToggle';
import { texts } from '@/data/texts';
import { Sparkles, ArrowRight, BookOpen, FileText, CheckCircle2 } from 'lucide-react';

interface ClassBoxConfig {
  level: string;
  emoji: string;
  isAvailable: boolean;
  tag?: string;
}

const CLASSES: ClassBoxConfig[] = [
  { level: '6th', emoji: '🐣', isAvailable: false },
  { level: '7th', emoji: '⚡', isAvailable: false },
  { level: '8th', emoji: '🚀', isAvailable: false },
  { level: '9th', emoji: '🔮', isAvailable: false },
  { level: '10th', emoji: '🎯', isAvailable: true, tag: 'SSLC' },
  { level: '11th', emoji: '💎', isAvailable: false },
  { level: '12th', emoji: '👑', isAvailable: true, tag: 'HSC' },
];

export default function HomePage() {
  const { student, isRegistered, showToast } = useApp();

  const handleUnavailableClick = () => {
    showToast(texts.classes.cookingToast);
  };

  // User registered standard (e.g. "10th" or fallback to "10th")
  const userStandard = student?.standard || '10th';
  const isUserStandardAvailable = userStandard === '10th' || userStandard === '12th';

  return (
    <div className="flex-1 flex flex-col px-4 pt-6 pb-6">
      {/* Top Section: Medium Toggle & Header */}
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        {/* Top App Name Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EDE9FE] shadow-xs">
          <span className="text-sm font-black tracking-tight text-[#7C3AED]">
            {texts.app.name}
          </span>
          <span className="text-xs">💯</span>
        </div>

        {/* Big Thumb-Friendly Medium Toggle */}
        <MediumToggle />

        {/* Personalized greeting when registered */}
        {isRegistered && student && (
          <div className="w-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white rounded-2xl p-4 shadow-lg shadow-[#7C3AED]/20 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#E9D5FF] uppercase tracking-wider">
                  welcome back
                </p>
                <h1 className="text-xl font-black tracking-tight">
                  {texts.profile.greeting} {student.name} 👋
                </h1>
              </div>
              <div className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-extrabold text-[#A3E635] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{student.standard}</span>
              </div>
            </div>

            {/* Quick Categories for their class */}
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs font-bold text-white/90 mb-2">
                jump to {userStandard} categories:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/class/${isUserStandardAvailable ? userStandard : '10th'}?category=pyq`}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all p-2 rounded-xl text-xs font-bold flex items-center justify-between text-white"
                >
                  <span>{texts.categories.pyq}</span>
                  <ArrowRight className="w-3 h-3 text-[#A3E635]" />
                </Link>
                <Link
                  href={`/class/${isUserStandardAvailable ? userStandard : '10th'}?category=model`}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all p-2 rounded-xl text-xs font-bold flex items-center justify-between text-white"
                >
                  <span>{texts.categories.model}</span>
                  <ArrowRight className="w-3 h-3 text-[#A3E635]" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7 Class Boxes in a thumb-friendly grid */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
          {CLASSES.map((cls) => {
            if (cls.isAvailable) {
              return (
                <Link
                  key={cls.level}
                  href={`/class/${cls.level}`}
                  className="min-h-[110px] bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white rounded-2xl p-4 shadow-md shadow-[#7C3AED]/25 flex flex-col justify-between transition-all cursor-pointer border border-[#8B5CF6]/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cls.emoji}</span>
                    {cls.tag && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-[#A3E635]">
                        {cls.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black tracking-tight">
                      {cls.level}
                    </span>
                    <ArrowRight className="w-5 h-5 text-[#A3E635]" />
                  </div>
                </Link>
              );
            }

            // Inactive class box ("soon 👀", fires toast on tap)
            return (
              <button
                key={cls.level}
                type="button"
                onClick={handleUnavailableClick}
                className="min-h-[110px] bg-white hover:bg-[#F3E8FF]/30 active:scale-[0.98] rounded-2xl p-4 border border-[#EDE9FE] shadow-xs flex flex-col justify-between transition-all cursor-pointer text-left opacity-75"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl opacity-60">{cls.emoji}</span>
                  <span className="text-[10px] font-extrabold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded-full">
                    {texts.classes.soonBadge}
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-black text-[#6D28D9]/70">
                    {cls.level}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
