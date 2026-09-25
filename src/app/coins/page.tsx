'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { ArrowLeft, Sparkles, Crown, Check, ShieldCheck, Zap } from 'lucide-react';

interface AvatarFrameItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  ringClass: string;
  badge: string;
}

const AVATAR_FRAMES: AvatarFrameItem[] = [
  {
    id: 'neon-flame',
    name: 'Flame Aura',
    price: 50,
    emoji: '🔥',
    ringClass: 'ring-2 ring-orange-500 border border-amber-300',
    badge: 'Popular',
  },
  {
    id: 'centum-gold',
    name: 'Gold Crown',
    price: 100,
    emoji: '👑',
    ringClass: 'ring-2 ring-amber-400 border border-yellow-200 shadow-md shadow-amber-400/20',
    badge: 'Pro Pick',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    price: 150,
    emoji: '⚡',
    ringClass: 'ring-2 ring-lime-400 border border-emerald-300',
    badge: 'Neon',
  },
  {
    id: 'royal-purple',
    name: 'Royal Violet',
    price: 200,
    emoji: '🟣',
    ringClass: 'ring-2 ring-purple-500 border border-violet-300 shadow-md shadow-purple-500/20',
    badge: 'Royal',
  },
  {
    id: 'diamond-star',
    name: 'Diamond Shine',
    price: 300,
    emoji: '💎',
    ringClass: 'ring-2 ring-cyan-400 border border-blue-200 shadow-md shadow-cyan-400/20',
    badge: 'Elite',
  },
  {
    id: 'master-topper',
    name: 'Topper Master',
    price: 500,
    emoji: '🏆',
    ringClass: 'ring-2 ring-yellow-400 border-2 border-amber-300 shadow-lg shadow-amber-400/30',
    badge: 'Legendary',
  },
];

export function formatCoins(amount: number): string {
  if (amount >= 1000) {
    const kVal = (amount / 1000).toFixed(1).replace(/\.0$/, '');
    return `${kVal}k`;
  }
  return String(amount);
}

export default function CoinsPage() {
  const router = useRouter();
  const {
    student,
    isRegistered,
    openGate,
    plan,
    coinsBalance,
    coinsRecent,
    fetchCoins,
    spendCoins,
    equippedAvatarFrame,
    equipAvatarFrame,
    showToast,
  } = useApp();

  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>(['default']);

  useEffect(() => {
    if (isRegistered) {
      fetchCoins();
    }
  }, [isRegistered]);

  // Read owned avatars from localStorage + ledger
  useEffect(() => {
    try {
      const stored = localStorage.getItem('centum_owned_avatars');
      const list: string[] = stored ? JSON.parse(stored) : ['default'];
      // Also sync from recent transactions where reason == 'avatar'
      coinsRecent.forEach((tx) => {
        if (tx.reason === 'avatar' && tx.ref && !list.includes(tx.ref)) {
          list.push(tx.ref);
        }
      });
      setOwnedAvatars(list);
    } catch {
      // Ignore
    }
  }, [coinsRecent]);

  const handleBuyOrEquip = async (frame: AvatarFrameItem) => {
    if (!isRegistered) {
      openGate();
      return;
    }

    const isOwned = ownedAvatars.includes(frame.id);

    if (isOwned) {
      // Equip directly
      equipAvatarFrame(frame.id);
      showToast(`Equipped ${frame.name}! ✨`);
      return;
    }

    if (coinsBalance < frame.price) {
      showToast(`Save ${frame.price - coinsBalance} more 🪙 to unlock ${frame.name}`);
      return;
    }

    setPurchasingId(frame.id);
    const success = await spendCoins('avatar', frame.id, frame.price);
    setPurchasingId(null);

    if (success) {
      const updated = [...ownedAvatars, frame.id];
      setOwnedAvatars(updated);
      try {
        localStorage.setItem('centum_owned_avatars', JSON.stringify(updated));
      } catch {}
      equipAvatarFrame(frame.id);
      showToast(`Unlocked & equipped ${frame.name}! 🎨`);
    } else {
      showToast('Could not complete purchase. Please try again.');
    }
  };

  const isUserPro = plan === 'pro' || plan === 'live';

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-16 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] transition-all cursor-pointer shadow-xs"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="text-right">
          <h1 className="text-xl font-black tracking-tight text-[#2E1065] dark:text-[#F5F0FF]">
            {texts.coins.title}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.coins.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* BIG BALANCE HERO CARD */}
        <div className="w-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-amber-950 rounded-3xl p-6 shadow-xl shadow-amber-500/20 border border-amber-300 relative overflow-hidden text-center">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-900/80 block mb-1">
            {texts.coins.balanceLabel}
          </span>
          <div className="flex items-center justify-center gap-3 my-1">
            <span className="text-5xl animate-bounce-slight">🪙</span>
            <span className="text-5xl font-black tracking-tight">
              {formatCoins(coinsBalance)}
            </span>
          </div>

          {isUserPro ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/15 border border-amber-950/20 mt-3 text-xs font-black">
              <Crown className="w-3.5 h-3.5" />
              <span>2× coins active forever 👑</span>
            </div>
          ) : (
            <p className="text-[11px] font-bold text-amber-900/90 mt-2">
              Pro members earn 2× coins on all tests & activities ⚡
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-amber-950/15 text-[11px] font-extrabold text-amber-950">
            {texts.coins.explainer}
          </div>
        </div>

        {/* HOW TO EARN COINS CARD */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {texts.coins.earnCardTitle}
              </h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063]">
              Daily & Milestones
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063] flex flex-col justify-between">
              <span className="text-gray-600 dark:text-[#B9A6D9] font-bold">Daily quiz</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">+5 🪙</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063] flex flex-col justify-between">
              <span className="text-gray-600 dark:text-[#B9A6D9] font-bold">Finish a test</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">+2 🪙</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063] flex flex-col justify-between">
              <span className="text-gray-600 dark:text-[#B9A6D9] font-bold">Perfect score</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">+3 🪙</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063] flex flex-col justify-between">
              <span className="text-gray-600 dark:text-[#B9A6D9] font-bold">7-day streak</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">+20 🪙</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063] flex flex-col justify-between">
              <span className="text-gray-600 dark:text-[#B9A6D9] font-bold">30-day streak</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">+100 🪙</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063] flex flex-col justify-between">
              <span className="text-gray-600 dark:text-[#B9A6D9] font-bold">Friend joins</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">+20 🪙</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/30 flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-200">
            <span>Friend finishes 3 quizzes on 2 days</span>
            <span className="text-sm text-amber-600 dark:text-amber-400">+80 🪙</span>
          </div>
        </div>

        {/* AVATAR STORE CARD */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <h3 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {texts.coins.storeTitle}
              </h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063]">
              Frames
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {AVATAR_FRAMES.map((frame) => {
              const isOwned = ownedAvatars.includes(frame.id);
              const isEquipped = equippedAvatarFrame === frame.id;
              const canAfford = coinsBalance >= frame.price;
              const isBusy = purchasingId === frame.id;

              return (
                <div
                  key={frame.id}
                  className={`p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border transition-all flex flex-col items-center text-center justify-between gap-2.5 ${
                    isEquipped
                      ? 'border-amber-400 dark:border-amber-400/80 shadow-md shadow-amber-400/15'
                      : 'border-[#EDE9FE] dark:border-[#3B2063]'
                  }`}
                >
                  {/* Badge */}
                  <div className="w-full flex items-center justify-between text-[9px] font-black uppercase text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                    <span>{frame.badge}</span>
                    <span>{frame.price} 🪙</span>
                  </div>

                  {/* Frame Avatar Preview */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-white dark:bg-[#1B0B2E] ${frame.ringClass}`}
                  >
                    <span>{frame.emoji}</span>
                  </div>

                  {/* Title */}
                  <div className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] truncate max-w-full">
                    {frame.name}
                  </div>

                  {/* Action Button */}
                  {isEquipped ? (
                    <button
                      type="button"
                      disabled
                      className="w-full min-h-[36px] rounded-xl bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-400/40 text-[11px] font-black flex items-center justify-center gap-1 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{texts.coins.avatarEquipped}</span>
                    </button>
                  ) : isOwned ? (
                    <button
                      type="button"
                      onClick={() => handleBuyOrEquip(frame)}
                      className="w-full min-h-[36px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-black shadow-xs transition-all cursor-pointer"
                    >
                      {texts.coins.avatarEquip}
                    </button>
                  ) : canAfford ? (
                    <button
                      type="button"
                      onClick={() => handleBuyOrEquip(frame)}
                      disabled={isBusy}
                      className="w-full min-h-[36px] rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-[#18181B] text-[11px] font-black shadow-xs transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isBusy ? '...' : `Buy ${frame.price} 🪙`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full min-h-[36px] rounded-xl bg-gray-100 dark:bg-[#1B0B2E] text-gray-400 dark:text-[#B9A6D9]/50 border border-gray-200 dark:border-[#3B2063] text-[10px] font-bold cursor-not-allowed"
                    >
                      save {frame.price - coinsBalance} more 🪙
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT ACTIVITY CARD */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF]">
              {texts.coins.recentActivity}
            </h3>
            <span className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
              {coinsRecent.length} items
            </span>
          </div>

          {coinsRecent.length === 0 ? (
            <div className="p-6 text-center bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-dashed border-[#DDD6FE] dark:border-[#3B2063]">
              <span className="text-2xl block mb-1">🪙</span>
              <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                {texts.coins.emptyRecent}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {coinsRecent.map((tx, idx) => {
                const isEarn = tx.amount > 0;
                const formattedDate = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'Recent';
                return (
                  <div
                    key={tx.ref ? `${tx.ref}-${idx}` : idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]"
                  >
                    <div>
                      <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] block">
                        {tx.reason === 'daily-quiz'
                          ? texts.coins.reasonDailyQuiz
                          : tx.reason === 'test-complete'
                          ? texts.coins.reasonTestComplete
                          : tx.reason === 'test-perfect'
                          ? texts.coins.reasonTestPerfect
                          : tx.reason === 'streak-7'
                          ? texts.coins.reasonStreak7
                          : tx.reason === 'streak-30'
                          ? texts.coins.reasonStreak30
                          : tx.reason === 'referral-signup' || tx.reason === 'referral-qualified'
                          ? texts.coins.reasonReferral
                          : tx.reason === 'welcome'
                          ? texts.coins.reasonWelcome
                          : tx.reason === 'avatar'
                          ? texts.coins.reasonAvatar
                          : tx.reason}
                      </span>
                      <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#B9A6D9]/60">
                        {formattedDate}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        isEarn
                          ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isEarn ? `+${tx.amount} 🪙` : `${tx.amount} 🪙`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
