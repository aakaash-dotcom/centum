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
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

export default function ProfilePage() {
  const {
    student,
    isRegistered,
    logout,
    openGate,
    quizResults,
    showToast,
    plan,
    openPaywall,
    theme,
    setTheme,
    medium,
    setMedium,
  } = useApp();

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

  const handleShareCentum = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://centum.app';
    const text = `Centum 💯 - ${texts.profile.shareLine}\n${url}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Centum 💯',
          text: `Centum 💯 - ${texts.profile.shareLine}`,
          url: url,
        })
        .catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const testsCount = quizResults.length;
  const avgAccuracy =
    testsCount > 0
      ? Math.round(quizResults.reduce((acc, q) => acc + q.accuracy, 0) / testsCount)
      : 0;

  const isPro = plan === 'pro' || plan === 'live';

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
          {texts.profile.title}
        </h1>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
              isPro
                ? 'bg-[#7C3AED] text-white ring-2 ring-[#A3E635]'
                : 'bg-white dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#A3E635] border border-[#DDD6FE] dark:border-[#DDD6FE]/20'
            }`}
          >
            {isPro && <Crown className="w-3 h-3 text-[#A3E635]" />}
            <span>{plan}</span>
          </span>
        </div>
      </div>

      {/* Main Student Card (Registered) or Guest Mode Card */}
      {isRegistered && student ? (
        <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-md shadow-[#7C3AED]/5 flex flex-col items-center text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shadow-lg mb-3 border-4 border-white dark:border-[#230542] ${
              isPro
                ? 'bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] text-white ring-4 ring-[#A3E635] shadow-[#7C3AED]/30'
                : 'bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white ring-2 ring-[#EDE9FE] shadow-[#7C3AED]/20'
            }`}
          >
            {getInitials(student.name)}
          </div>

          <h2 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {student.name}
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] text-xs font-black flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {student.standard} Standard
            </span>

            <span className="px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#5B21B6] dark:text-[#DDD6FE] text-xs font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635]" />
              {student.district}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 mt-3">
            <Phone className="w-3 h-3 text-[#16A34A]" />
            <span>+91 {student.phone}</span>
          </div>
        </div>
      ) : (
        /* Guest Mode Card */
        <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-md shadow-[#7C3AED]/5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center mb-3 border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
            <User className="w-8 h-8 opacity-75" />
          </div>

          <h2 className="text-lg font-black text-[#2E1065] dark:text-[#FAF5FF] mb-1">
            {texts.profile.unlockPrompt}
          </h2>
          <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 mb-6 max-w-xs">
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

      {/* Pro Membership Card */}
      {isRegistered && (
        <>
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
            <div className="bg-[#F0FDF4] dark:bg-[#14532D]/40 border border-[#86EFAC] dark:border-[#86EFAC]/30 rounded-3xl p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#DCFCE7] dark:bg-[#166534] text-[#16A34A] dark:text-[#86EFAC] flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#166534] dark:text-[#86EFAC] uppercase tracking-wide">
                    Centum Pro Active 👑
                  </h3>
                  <p className="text-[11px] font-semibold text-[#15803D] dark:text-[#BBF7D0]">
                    All question papers and tests unlocked
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="text-[11px] font-black text-[#166534] dark:text-[#86EFAC] underline"
              >
                details
              </Link>
            </div>
          )}
        </>
      )}

      {/* SETTINGS CARD: Appearance, Medium, Share */}
      <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635]">
          Settings ⚙️
        </h3>

        {/* 1. Appearance Row: appearance 🌗 -> light | dark */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {texts.profile.appearance}
              </span>
              <p className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                light or dark mode
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-[#FAF5FF] dark:bg-[#230542] rounded-xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-[#7C3AED] shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#7C3AED]'
              }`}
            >
              {texts.profile.themeLight}
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#A3E635]'
              }`}
            >
              {texts.profile.themeDark}
            </button>
          </div>
        </div>

        {/* 2. Medium Setting Row: medium 🔀 -> English | தமிழ் */}
        <div className="flex items-center justify-between py-1 border-t border-[#FAF5FF] dark:border-[#230542]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {texts.profile.mediumSetting}
              </span>
              <p className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                content language
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-[#FAF5FF] dark:bg-[#230542] rounded-xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
            <button
              type="button"
              onClick={() => setMedium('english')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                medium === 'english'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#7C3AED]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setMedium('tamil')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                medium === 'tamil'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#A3E635]'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* 3. Share Centum Row: share centum 💜 */}
        <div className="pt-2 border-t border-[#FAF5FF] dark:border-[#230542]">
          <button
            type="button"
            onClick={handleShareCentum}
            className="w-full min-h-[46px] flex items-center justify-between px-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-black">
                {texts.profile.shareCentum}
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 group-hover:underline">
              share ↗
            </span>
          </button>
        </div>
      </div>

      {/* Refer & Earn Navigation Card */}
      <Link
        href="/refer"
        className="w-full bg-white dark:bg-[#3B0F6E] rounded-3xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/50 shadow-xs flex items-center justify-between transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center group-hover:bg-[#F3E8FF] transition-colors">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
              {texts.refer.title}
            </h3>
            <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
              Earn on UPI when friends use your code
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#7C3AED] dark:text-[#A3E635] group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Membership Plans Link */}
      <Link
        href="/pricing"
        className="w-full bg-white dark:bg-[#3B0F6E] rounded-3xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/50 shadow-xs flex items-center justify-between transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center group-hover:bg-[#F3E8FF] transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
              {texts.pricing.title}
            </h3>
            <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
              Compare Free, Pro & Live tiers
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#7C3AED] dark:text-[#A3E635] group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Test Performance Dashboard */}
      {isRegistered && (
        <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-3">
            Test Performance
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl">
              <span className="block text-[11px] font-extrabold text-[#7C3AED] dark:text-[#A3E635]">
                {texts.profile.statsTests}
              </span>
              <span className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {testsCount}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl">
              <span className="block text-[11px] font-extrabold text-[#7C3AED] dark:text-[#A3E635]">
                {texts.profile.statsAvgScore}
              </span>
              <span className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {avgAccuracy}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Switch Account CTA */}
      {isRegistered && (
        <div>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 font-bold text-sm text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] hover:bg-[#FAF5FF] dark:hover:bg-[#4C1D95] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{texts.profile.switchAccount}</span>
          </button>
        </div>
      )}

      {/* Privacy Policy Link */}
      <div className="mt-8 pt-4 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-center">
        <Link
          href="/privacy"
          className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] hover:underline"
        >
          {texts.profile.privacyLink}
        </Link>
        <p className="text-[11px] text-[#6D28D9]/60 dark:text-[#DDD6FE]/60 font-medium mt-1">
          {texts.papers.attribution}
        </p>
      </div>
    </div>
  );
}
