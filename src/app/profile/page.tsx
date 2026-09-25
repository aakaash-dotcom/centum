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
  Coins,
} from 'lucide-react';

export function formatCoins(amount: number): string {
  if (amount >= 1000) {
    const kVal = (amount / 1000).toFixed(1).replace(/\.0$/, '');
    return `${kVal}k`;
  }
  return String(amount);
}

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
    coinsBalance,
    equippedAvatarFrame,
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
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 space-y-4 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Header with Title + Coins Chip */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#F5F0FF]">
          {texts.profile.title}
        </h1>

        <div className="flex items-center gap-2">
          {/* Coins Chip in Profile */}
          <Link
            href="/coins"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#1B0B2E] border border-amber-400/40 dark:border-amber-400/30 text-xs font-black shadow-xs hover:border-amber-400 cursor-pointer"
          >
            <span className="text-sm">🪙</span>
            <span className="text-amber-700 dark:text-amber-300">{formatCoins(coinsBalance)}</span>
          </Link>

          {/* Plan badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
              isPro
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black border border-amber-300'
                : 'bg-white dark:bg-[#1B0B2E] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063]'
            }`}
          >
            {isPro && <Crown className="w-3 h-3 text-amber-950" />}
            <span>{plan}</span>
          </span>
        </div>
      </div>

      {/* Main Student Card (Registered) or Guest Mode Card */}
      {isRegistered && student ? (
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md shadow-[#7C3AED]/5 flex flex-col items-center text-center">
          {/* Avatar with Equipped Frame Ring */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shadow-lg mb-3 border-4 border-white dark:border-[#0F0618] ${
              isPro
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-amber-950 font-black'
                : 'bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] text-white'
            } ${
              equippedAvatarFrame === 'centum-gold'
                ? 'ring-4 ring-amber-400 shadow-amber-400/30'
                : equippedAvatarFrame === 'neon-flame'
                ? 'ring-4 ring-orange-500 shadow-orange-500/30'
                : equippedAvatarFrame === 'cyber-neon'
                ? 'ring-4 ring-lime-400 shadow-lime-400/30'
                : equippedAvatarFrame === 'royal-purple'
                ? 'ring-4 ring-purple-500 shadow-purple-500/30'
                : equippedAvatarFrame === 'diamond-star'
                ? 'ring-4 ring-cyan-400 shadow-cyan-400/30'
                : equippedAvatarFrame === 'master-topper'
                ? 'ring-4 ring-yellow-400 shadow-amber-500/40'
                : 'ring-2 ring-[#EDE9FE] dark:ring-[#3B2063]'
            }`}
          >
            {getInitials(student.name)}
          </div>

          <h2 className="text-xl font-black text-[#2E1065] dark:text-[#F5F0FF] tracking-tight">
            {student.name}
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full bg-[#F3E8FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA] text-xs font-black flex items-center gap-1 border border-[#DDD6FE]/30 dark:border-[#3B2063]">
              <GraduationCap className="w-3.5 h-3.5" />
              {student.standard} Standard
            </span>

            <span className="px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#DDD6FE] dark:border-[#3B2063] text-[#5B21B6] dark:text-[#B9A6D9] text-xs font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
              {student.district}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mt-3">
            <Phone className="w-3 h-3 text-[#16A34A]" />
            <span>+91 {student.phone}</span>
          </div>
        </div>
      ) : (
        /* Guest Mode Card */
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md shadow-[#7C3AED]/5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center mb-3 border border-[#EDE9FE] dark:border-[#3B2063]">
            <User className="w-8 h-8 opacity-75" />
          </div>

          <h2 className="text-lg font-black text-[#2E1065] dark:text-[#F5F0FF] mb-1">
            {texts.profile.unlockPrompt}
          </h2>
          <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#B9A6D9] mb-6 max-w-xs">
            Unlock your profile to keep test stats, bookmark papers, and download unlimited materials.
          </p>

          <button
            type="button"
            onClick={() => openGate(undefined, 'register')}
            className="w-full min-h-[50px] flex items-center justify-center gap-2 font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#84CC16] rounded-2xl shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{texts.profile.unlockCta}</span>
          </button>

          <button
            type="button"
            onClick={() => openGate(undefined, 'login')}
            className="w-full min-h-[44px] mt-2.5 flex items-center justify-center gap-1.5 font-bold text-xs text-[#7C3AED] dark:text-[#A78BFA] hover:underline cursor-pointer"
          >
            <span>{texts.profile.loginLink}</span>
          </button>
        </div>
      )}

      {/* SPECIAL HIGHLIGHTED MEMBERSHIP BUTTON (Gold Gradient Ring/Badge) -> /pricing */}
      <Link
        href="/pricing"
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-400/20 via-yellow-400/25 to-amber-500/20 dark:from-amber-500/25 dark:via-yellow-500/20 dark:to-amber-400/30 border-2 border-amber-400 dark:border-amber-400/80 shadow-md shadow-amber-400/10 flex items-center justify-between text-left group transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-amber-950 font-black text-lg shadow-xs shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                {texts.membership.cardTitle}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-2xs">
                Pro
              </span>
            </div>
            <p className="text-[11px] font-bold text-amber-900/80 dark:text-amber-300/80 leading-snug">
              {texts.membership.cardSubtitle}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-700 dark:text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" />
      </Link>

      {/* Refer & Earn Navigation Card (Coins Rewards, NO UPI) */}
      <Link
        href="/refer"
        className="w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/50 shadow-xs flex items-center justify-between transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-[#F3E8FF] transition-colors">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF] tracking-tight">
              {texts.refer.title}
            </h3>
            <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
              Invite friends & earn up to 100 🪙 each
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#7C3AED] dark:text-[#A78BFA] group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* SETTINGS CARD: Appearance, Medium, Share */}
      <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A78BFA]">
          Settings ⚙️
        </h3>

        {/* 1. Appearance Row: light | dark */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA]">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {texts.profile.appearance}
              </span>
              <p className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#B9A6D9]/60">
                light or dark mode
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-xl border border-[#EDE9FE] dark:border-[#3B2063]">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-[#7C3AED] shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#B9A6D9] hover:text-[#7C3AED]'
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
                  : 'text-[#6D28D9] dark:text-[#B9A6D9] hover:text-[#A78BFA]'
              }`}
            >
              {texts.profile.themeDark}
            </button>
          </div>
        </div>

        {/* 2. Medium Setting Row: English | தமிழ் */}
        <div className="flex items-center justify-between py-1 border-t border-[#FAF5FF] dark:border-[#0F0618]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {texts.profile.mediumSetting}
              </span>
              <p className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#B9A6D9]/60">
                content language
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-xl border border-[#EDE9FE] dark:border-[#3B2063]">
            <button
              type="button"
              onClick={() => setMedium('english')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                medium === 'english'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#B9A6D9] hover:text-[#7C3AED]'
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
                  : 'text-[#6D28D9] dark:text-[#B9A6D9] hover:text-[#A78BFA]'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* 3. Share Centum Row */}
        <div className="pt-2 border-t border-[#FAF5FF] dark:border-[#0F0618]">
          <button
            type="button"
            onClick={handleShareCentum}
            className="w-full min-h-[46px] flex items-center justify-between px-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-black">
                {texts.profile.shareCentum}
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9] group-hover:underline">
              share ↗
            </span>
          </button>
        </div>
      </div>

      {/* Test Performance Dashboard */}
      {isRegistered && (
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A78BFA] mb-3">
            Test Performance
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
              <span className="block text-[11px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">
                {texts.profile.statsTests}
              </span>
              <span className="text-2xl font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {testsCount}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
              <span className="block text-[11px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">
                {texts.profile.statsAvgScore}
              </span>
              <span className="text-2xl font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {avgAccuracy}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Founder Console Link (ONLY when isAdmin was returned by login) */}
      {isRegistered && student?.isAdmin && (
        <div className="text-center pt-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]/70 dark:text-[#A78BFA]/80 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] py-2 px-3 rounded-full hover:bg-[#FAF5FF] dark:hover:bg-[#0F0618] transition-colors"
          >
            <span>{texts.profile.adminLink}</span>
          </Link>
        </div>
      )}

      {/* Switch Account CTA */}
      {isRegistered && (
        <div>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 font-bold text-sm text-[#7C3AED] dark:text-[#A78BFA] bg-white dark:bg-[#1B0B2E] hover:bg-[#FAF5FF] dark:hover:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{texts.profile.switchAccount}</span>
          </button>
        </div>
      )}

      {/* Privacy Policy Link */}
      <div className="mt-8 pt-4 border-t border-[#EDE9FE] dark:border-[#3B2063] text-center">
        <Link
          href="/privacy"
          className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:underline"
        >
          {texts.profile.privacyLink}
        </Link>
        <p className="text-[11px] text-[#6D28D9]/60 dark:text-[#B9A6D9] font-medium mt-1">
          {texts.papers.attribution}
        </p>
      </div>
    </div>
  );
}
