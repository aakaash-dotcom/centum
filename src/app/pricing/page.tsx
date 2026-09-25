'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { PLAN_FEATURES, PlanFeature } from '@/data/planFeatures';
import { COMING_SOON } from '@/data/config';
import { ArrowLeft, Check, X as XIcon, Crown, Video, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { plan, student, medium, showToast } = useApp();
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinWaitlist = async (targetPlan: string) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: student?.phone || 'guest',
          name: student?.name || 'Student',
          plan: targetPlan,
          timestamp: new Date().toISOString(),
        }),
      });
      setWaitlistJoined(true);
      showToast(texts.pricing.waitlistSuccess || "You're on the early-bird waitlist! 🐣");
    } catch {
      setWaitlistJoined(true);
      showToast(texts.pricing.waitlistSuccess || "You're on the early-bird waitlist! 🐣");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeatureName = (f: PlanFeature): string => {
    return medium === 'tamil' ? f.name.ta : f.name.en;
  };

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
            {texts.pricing.title}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.pricing.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. FREE CARD - "the basics, fr" (deliberately humble, exactly 3 lines) */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-[#6D28D9] dark:text-[#A78BFA] tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]">
                🟢 {texts.pricing.free}
              </span>
              <span className="text-xs font-black text-[#6D28D9]/70 dark:text-[#B9A6D9]">
                {texts.pricing.freePrice}
              </span>
            </div>

            <h2 className="text-sm font-black text-[#2E1065] dark:text-[#F5F0FF] mb-1">
              &ldquo;the basics, fr&rdquo;
            </h2>
            <p className="text-[11px] font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mb-4">
              essential practice tools every TN student gets for free.
            </p>

            {/* Exactly 3 lines, humble */}
            <ul className="space-y-2 text-xs font-bold text-[#2E1065] dark:text-[#F5F0FF] mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                <span>previous year questions ✔</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                <span>book-back quiz ✔</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] shrink-0" />
                <span>student news ✔</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled
            className="w-full min-h-[44px] rounded-xl bg-[#FAF5FF] dark:bg-[#0F0618] text-[#6D28D9]/60 dark:text-[#B9A6D9]/60 font-black text-xs border border-[#EDE9FE] dark:border-[#3B2063] flex items-center justify-center cursor-default"
          >
            {plan === 'free' ? texts.pricing.currentPlan : 'Free Tier Included'}
          </button>
        </div>

        {/* 2. PRO CARD - "the main character era" (gold premium card, exaggerated, BIGGEST) */}
        <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] dark:from-[#2A1705] dark:via-[#1B0B2E] dark:to-[#2A1247] rounded-3xl p-6 border-2 border-amber-400 dark:border-amber-400/90 shadow-xl shadow-amber-500/15 relative overflow-hidden flex flex-col justify-between transition-colors">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black text-[10px] uppercase px-4 py-1 rounded-bl-xl shadow-xs tracking-wider">
            Most Popular 🔥
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 mt-1">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-base font-black text-amber-950 dark:text-amber-200">
                🟡 {texts.pricing.pro}
              </span>
            </div>

            <h2 className="text-lg font-black text-amber-950 dark:text-amber-100 tracking-tight leading-tight mb-1">
              &ldquo;the main character era&rdquo; 👑
            </h2>
            <p className="text-xs font-bold text-amber-900/80 dark:text-amber-200/80 mb-4">
              every question paper, step solution, and AI speed battle to secure your centum.
            </p>

            <ul className="space-y-2.5 text-xs font-black text-amber-950 dark:text-[#F5F0FF] mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>🔑 answer keys + step solutions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>🧠 concept quiz all chapters</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⚡ AI pro quiz battles <span className="text-[10px] bg-amber-400/30 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">soon</span></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>📝 full mock exams</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>📚 topper + last-minute note packs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>🏆 important-questions ranks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>🪙 2× coins forever</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>🎯 adaptive daily quiz from weak chapters <span className="text-[10px] bg-amber-400/30 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">soon</span></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>⭕ chapter mastery rings <span className="text-[10px] bg-amber-400/30 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">soon</span></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>📊 parent report card <span className="text-[10px] bg-amber-400/30 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">soon</span></span>
              </li>
            </ul>
          </div>

          {waitlistJoined ? (
            <div className="w-full min-h-[50px] rounded-2xl bg-amber-500/20 text-amber-950 dark:text-amber-200 font-black text-xs flex items-center justify-center gap-2 border border-amber-400">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{texts.pricing.waitlistSuccess || "you're on the early-bird waitlist! 🐣"}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleJoinWaitlist('pro')}
              disabled={isSubmitting}
              className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 active:scale-[0.98] text-amber-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-300"
            >
              <Sparkles className="w-4 h-4" />
              <span>{texts.pricing.joinWaitlistBtn}</span>
            </button>
          )}
        </div>

        {/* 3. LIVE CARD - "pro + a real teacher" */}
        <div className="bg-gradient-to-br from-[#FFF1F2] via-white to-[#FFE4E6] dark:from-[#2B0E17] dark:via-[#1B0B2E] dark:to-[#2A1247] rounded-3xl p-5 border-2 border-rose-300 dark:border-rose-500/40 shadow-md shadow-rose-500/10 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-rose-500" />
              <span className="text-base font-black text-rose-950 dark:text-rose-200">
                🔴 {texts.pricing.live}
              </span>
            </div>

            <h2 className="text-base font-black text-rose-950 dark:text-rose-100 tracking-tight leading-tight mb-1">
              &ldquo;pro + a real teacher&rdquo; 👨‍🏫
            </h2>
            <p className="text-xs font-semibold text-rose-900/80 dark:text-rose-200/80 mb-4">
              live weekly subject mastery, interactive doubt solving, and structured study blueprints.
            </p>

            <ul className="space-y-2 text-xs font-bold text-[#2E1065] dark:text-[#F5F0FF] mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>everything in Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>👨‍🏫 weekly live class per subject</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>🎥 recordings on demand</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>💬 doubt chat (24h)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>📲 parent WhatsApp report</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>📋 personal study plan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-rose-500 shrink-0" />
                <span>📜 term certificate</span>
              </li>
            </ul>
          </div>

          {waitlistJoined ? (
            <div className="w-full min-h-[48px] rounded-2xl bg-rose-500/20 text-rose-950 dark:text-rose-200 font-black text-xs flex items-center justify-center gap-2 border border-rose-300">
              <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{texts.pricing.waitlistSuccess || "you're on the early-bird waitlist! 🐣"}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleJoinWaitlist('live')}
              disabled={isSubmitting}
              className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 active:scale-[0.98] text-white font-black text-xs shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{texts.pricing.joinWaitlistBtn}</span>
            </button>
          )}
        </div>

        {/* 4. COMPARISON TABLE - Driven strictly by PLAN_FEATURES array */}
        <div className="pt-4">
          <h2 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF] mb-3 text-center">
            {texts.pricing.comparePlansTitle}
          </h2>

          <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDE9FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#0F0618]">
                    <th className="p-3.5 font-black text-[#2E1065] dark:text-[#F5F0FF] w-[46%]">
                      Feature
                    </th>
                    <th className="p-3.5 text-center font-black text-[#6D28D9] dark:text-[#A78BFA] w-[18%]">
                      Free
                    </th>
                    <th className="p-3.5 text-center font-black text-amber-600 dark:text-amber-400 w-[18%]">
                      Pro
                    </th>
                    <th className="p-3.5 text-center font-black text-rose-600 dark:text-rose-400 w-[18%]">
                      Live
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE9FE] dark:divide-[#3B2063]">
                  {PLAN_FEATURES.map((feat) => {
                    const name = getFeatureName(feat);
                    return (
                      <tr
                        key={feat.id}
                        className="hover:bg-[#FAF5FF]/60 dark:hover:bg-[#2A1247]/40 transition-colors"
                      >
                        <td className="p-3 text-[11px] font-bold text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                          <span>{name}</span>
                          {feat.status === 'soon' && (
                            <span className="ml-1.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300">
                              soon
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-black">
                          {feat.free ? (
                            <span className="text-[#16A34A] dark:text-[#4ADE80] text-sm">✓</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">✗</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-black">
                          {feat.pro ? (
                            <span className="text-amber-500 dark:text-amber-400 text-sm">✓</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">✗</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-black">
                          {feat.live ? (
                            <span className="text-rose-500 dark:text-rose-400 text-sm">✓</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
