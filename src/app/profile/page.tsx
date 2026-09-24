'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import {
  User,
  MapPin,
  GraduationCap,
  Phone,
  RotateCcw,
  Sparkles,
  Crown,
  Share2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function ProfilePage() {
  const { student, isRegistered, logout, openGate, quizResults, showToast, plan, openPaywall } = useApp();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSwitchAccount = () => {
    logout();
    showToast('switched to guest mode 🔄');
  };

  // Calculate statistics from completed quizzes
  const testsCount = quizResults.length;
  const avgAccuracy =
    testsCount > 0
      ? Math.round(quizResults.reduce((acc, q) => acc + q.accuracy, 0) / testsCount)
      : 0;

  const isPro = plan === 'pro' || plan === 'live';

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-[#2E1065] tracking-tight">
          {texts.profile.title}
        </h1>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
              isPro
                ? 'bg-[#7C3AED] text-white ring-2 ring-[#A3E635]'
                : 'bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]'
            }`}
          >
            {isPro && <Crown className="w-3 h-3 text-[#A3E635]" />}
            <span>{plan}</span>
          </span>
        </div>
      </div>

      {/* Main Student Card */}
      {isRegistered && student ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#EDE9FE] shadow-md shadow-[#7C3AED]/5 flex flex-col items-center text-center">
            {/* Avatar with Initials */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shadow-lg mb-3 border-4 border-white ${
                isPro
                  ? 'bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] text-white ring-4 ring-[#A3E635] shadow-[#7C3AED]/30'
                  : 'bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white ring-2 ring-[#EDE9FE] shadow-[#7C3AED]/20'
              }`}
            >
              {getInitials(student.name)}
            </div>

            <h2 className="text-xl font-black text-[#2E1065] tracking-tight">
              {student.name}
            </h2>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-black flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {student.standard} Standard
              </span>

              <span className="px-3 py-1 rounded-full bg-[#FAF5FF] border border-[#DDD6FE] text-[#5B21B6] text-xs font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                {student.district}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-[#6D28D9]/70 mt-3">
              <Phone className="w-3 h-3 text-[#16A34A]" />
              <span>+91 {student.phone}</span>
            </div>
          </div>

          {/* Membership Banner (If Free: Upgrade prompt. If Pro: Active badge) */}
          {!isPro ? (
            <div
              onClick={openPaywall}
              className="bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white rounded-3xl p-4 shadow-lg shadow-[#7C3AED]/20 flex items-center justify-between cursor-pointer hover:opacity-95 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Crown className="w-5 h-5 text-[#A3E635]" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight leading-tight">
                    Upgrade to Centum Pro 👑
                  </h3>
                  <p className="text-[11px] font-extrabold text-[#E9D5FF]">
                    ₹799/yr — unlock all papers & mock tests
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A3E635] group-hover:translate-x-1 transition-transform" />
            </div>
          ) : (
            <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-3xl p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#166534] uppercase tracking-wide">
                    Centum Pro Active 👑
                  </h3>
                  <p className="text-[11px] font-semibold text-[#15803D]">
                    All question papers and tests unlocked
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="text-[11px] font-black text-[#166534] underline"
              >
                details
              </Link>
            </div>
          )}

          {/* Refer & Earn Navigation Card */}
          <Link
            href="/refer"
            className="w-full bg-white rounded-3xl p-4 border border-[#EDE9FE] hover:border-[#7C3AED]/50 shadow-xs flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center group-hover:bg-[#F3E8FF] transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#2E1065] tracking-tight">
                  {texts.refer.title}
                </h3>
                <p className="text-xs font-semibold text-[#6D28D9]/70">
                  Earn on UPI when friends use your code
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#7C3AED] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Membership Plans Link */}
          <Link
            href="/pricing"
            className="w-full bg-white rounded-3xl p-4 border border-[#EDE9FE] hover:border-[#7C3AED]/50 shadow-xs flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center group-hover:bg-[#F3E8FF] transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#2E1065] tracking-tight">
                  {texts.pricing.title}
                </h3>
                <p className="text-xs font-semibold text-[#6D28D9]/70">
                  Compare Free, Pro & Live tiers
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#7C3AED] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Test Performance Dashboard */}
          <div className="bg-white rounded-3xl p-5 border border-[#EDE9FE] shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] mb-3">
              Test Performance
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#FAF5FF] rounded-2xl">
                <span className="block text-[11px] font-extrabold text-[#7C3AED]">
                  {texts.profile.statsTests}
                </span>
                <span className="text-2xl font-black text-[#2E1065]">
                  {testsCount}
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF5FF] rounded-2xl">
                <span className="block text-[11px] font-extrabold text-[#7C3AED]">
                  {texts.profile.statsAvgScore}
                </span>
                <span className="text-2xl font-black text-[#2E1065]">
                  {avgAccuracy}%
                </span>
              </div>
            </div>
          </div>

          {/* Switch Account CTA */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 font-bold text-sm text-[#7C3AED] bg-white hover:bg-[#FAF5FF] border border-[#DDD6FE] rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{texts.profile.switchAccount}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Guest Mode Card */
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9FE] shadow-md shadow-[#7C3AED]/5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center mb-3 border border-[#EDE9FE]">
            <User className="w-8 h-8 opacity-75" />
          </div>

          <h2 className="text-lg font-black text-[#2E1065] mb-1">
            {texts.profile.unlockPrompt}
          </h2>
          <p className="text-xs font-semibold text-[#6D28D9]/75 mb-6 max-w-xs">
            Unlock your profile to keep test stats, bookmark papers, and download unlimited materials.
          </p>

          <button
            type="button"
            onClick={() => openGate()}
            className="w-full min-h-[50px] flex items-center justify-center gap-2 font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] rounded-2xl shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{texts.profile.unlockCta}</span>
          </button>
        </div>
      )}

      {/* Privacy Policy Link */}
      <div className="mt-8 pt-4 border-t border-[#EDE9FE] text-center">
        <Link
          href="/privacy"
          className="text-xs font-bold text-[#7C3AED] hover:underline"
        >
          {texts.profile.privacyLink}
        </Link>
        <p className="text-[11px] text-[#6D28D9]/60 font-medium mt-1">
          {texts.papers.attribution}
        </p>
      </div>
    </div>
  );
}
