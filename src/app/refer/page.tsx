'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { ReferralData } from '@/types';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Users,
  Sparkles,
  Coins,
} from 'lucide-react';

export default function ReferPage() {
  const router = useRouter();
  const { student, isRegistered, openGate, showToast, medium, getReferralCode } = useApp();
  const [data, setData] = useState<ReferralData | null>(null);
  const [code, setCode] = useState<string>('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch referrals ledger
  const fetchReferrals = async () => {
    if (!student?.phone) return;
    try {
      const res = await fetch(`/api/referrals?phone=${encodeURIComponent(student.phone)}`);
      const resData = await res.json();
      if (resData.ok) {
        setData(resData);
        if (resData.couponCode) {
          setCode(resData.couponCode);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isRegistered || !student) {
      setIsLoading(false);
      return;
    }
    fetchReferrals();
  }, [isRegistered, student]);

  const handleGetCode = async () => {
    setIsGeneratingCode(true);
    try {
      const fetchedCode = await getReferralCode();
      if (fetchedCode) {
        setCode(fetchedCode);
        showToast(texts.refer.codeGenerated || 'Your referral code is ready! 🎯');
      } else {
        showToast('Could not generate code. Please try again.');
      }
    } catch {
      showToast('Could not generate code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}?ref=${code}`;
  };

  const getShareMessage = () => {
    const url = getShareUrl();
    const rawTemplate = texts.refer.shareTemplate;
    return rawTemplate.replace(/{CODE}/g, code).replace(/{url}/g, url);
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast(texts.refer.copied || 'pasted ✅');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    const text = getShareMessage();
    const url = getShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Centum - TN Board Exam Prep',
          text,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(`${text}`);
    setCopied(true);
    showToast(texts.refer.copied || 'pasted ✅');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isRegistered || !student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
        <span className="text-5xl mb-3">🪙</span>
        <h1 className="text-xl font-black mb-2">
          {texts.refer.title}
        </h1>
        <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#B9A6D9] mb-6 max-w-xs">
          Unlock your profile to generate your unique referral code and earn coins for every friend who joins!
        </p>
        <button
          type="button"
          onClick={() => openGate()}
          className="min-h-[48px] px-6 rounded-2xl bg-[#A3E635] text-[#18181B] font-black text-sm shadow-md shadow-[#A3E635]/25 cursor-pointer"
        >
          Unlock your profile ✨
        </button>
      </div>
    );
  }

  const referrals = data?.referrals || [];

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
            {texts.refer.title}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.refer.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Code Activation Card or Big Share Card */}
        {!code ? (
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs text-center flex flex-col items-center gap-3">
            <span className="text-4xl">🎯</span>
            <h2 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF]">
              Get your unique student code
            </h2>
            <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#B9A6D9] max-w-xs">
              Generate your persistent referral link to invite classmates and earn coins on every signup.
            </p>
            <button
              type="button"
              onClick={handleGetCode}
              disabled={isGeneratingCode}
              className="mt-2 min-h-[48px] px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-sm shadow-md shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isGeneratingCode ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>get my code 🎯</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#FAF5FF] via-white to-[#F3E8FF] dark:from-[#1B0B2E] dark:via-[#2A1247] dark:to-[#0F0618] rounded-3xl p-6 border-2 border-[#7C3AED]/30 dark:border-[#3B2063] shadow-lg shadow-[#7C3AED]/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                Your Referral Code
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] text-[10px] font-black uppercase shadow-2xs">
                Active 🟢
              </span>
            </div>

            {/* Code Box with Copy */}
            <div className="flex items-center justify-between p-3.5 bg-white dark:bg-[#0F0618] rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
              <span className="text-xl font-black tracking-wider text-[#2E1065] dark:text-[#F5F0FF] select-all">
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[38px] px-3.5 rounded-xl bg-[#FAF5FF] dark:bg-[#2A1247] border border-[#DDD6FE] dark:border-[#3B2063] text-xs font-black text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[3]" />
                    <span>pasted ✅</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Gen-Z Share Message Preview */}
            <div className="p-3 bg-[#FAF5FF] dark:bg-[#0F0618]/70 rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]/60 text-[11px] font-medium text-[#2E1065]/85 dark:text-[#B9A6D9] leading-relaxed">
              &ldquo;{getShareMessage()}&rdquo;
            </div>

            {/* Big Share CTA */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full min-h-[52px] rounded-2xl bg-[#A3E635] hover:bg-[#84CC16] active:scale-[0.98] text-[#18181B] font-black text-sm shadow-md shadow-[#A3E635]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>{texts.refer.shareCta || 'share with friends 🚀'}</span>
            </button>
          </div>
        )}

        {/* In-Coins Rewards Explainer Card */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF]">
              {texts.refer.rewardsTitle || 'How coins work'}
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🤝</span>
                <div>
                  <div className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
                    Friend joins with your code
                  </div>
                  <div className="text-[10px] font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                    Credited immediately on signup
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-400/15 px-2.5 py-1 rounded-full">
                +20 🪙
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
                    Friend finishes 3 quizzes on 2 days
                  </div>
                  <div className="text-[10px] font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                    Auto-verified qualification bonus
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-400/15 px-2.5 py-1 rounded-full">
                +80 🪙
              </span>
            </div>
          </div>

          <p className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] pt-1">
            💡 coins can cut up to 50% off Centum Pro 🤑
          </p>
        </div>

        {/* Live Progress Chips / Friends List */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <h3 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF]">
                {texts.refer.friendsJoined || 'Friends invited'}
              </h3>
            </div>
            <span className="text-xs font-black text-[#7C3AED] dark:text-[#A78BFA]">
              {referrals.length} total
            </span>
          </div>

          {isLoading ? (
            <div className="py-6 text-center text-xs font-bold text-[#6D28D9]/60 dark:text-[#B9A6D9]/60">
              loading progress...
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-6 text-center bg-[#FAF5FF] dark:bg-[#0F0618] rounded-2xl border border-dashed border-[#DDD6FE] dark:border-[#3B2063]">
              <span className="text-2xl block mb-1">🐣</span>
              <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                no friends invited yet. share your code to start earning coins!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] truncate block">
                      {r.name || 'Student'}
                    </span>
                    <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#B9A6D9]/60">
                      {r.date || 'Joined'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      r.status === 'qualified'
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-300'
                        : 'bg-[#A3E635]/20 text-[#166534] dark:text-[#A3E635]'
                    }`}
                  >
                    {r.status === 'qualified' ? 'Qualified (+80 🪙)' : 'Joined (+20 🪙)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
