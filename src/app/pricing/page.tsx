'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { ArrowLeft, Check, Sparkles, Crown, Video, Zap, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { plan, student, openPaywall, showToast } = useApp();
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const handleJoinWaitlist = () => {
    setWaitlistJoined(true);
    showToast(texts.pricing.waitlistSuccess);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#EDE9FE] text-[#7C3AED] hover:bg-[#F3E8FF] transition-all cursor-pointer shadow-xs"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="text-right">
          <h1 className="text-xl font-black text-[#2E1065] tracking-tight">
            {texts.pricing.title}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED]">
            {texts.pricing.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* FREE CARD */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE9FE] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-[#6D28D9] tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5FF] border border-[#EDE9FE]">
                {texts.pricing.free}
              </span>
              <span className="text-xl font-black text-[#2E1065]">
                {texts.pricing.freePrice}
              </span>
            </div>

            <p className="text-xs font-semibold text-[#6D28D9]/75 mb-4">
              All essentials to start your TN Board revision.
            </p>

            <ul className="space-y-2 text-xs font-bold text-[#2E1065] mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Selected Public Exam PYQ Papers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Daily Quiz of the Day & Streak</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>District Leaderboard Access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>DGE Student Timetable & News</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled
            className="w-full min-h-[44px] rounded-xl bg-[#FAF5FF] text-[#6D28D9]/60 font-black text-xs border border-[#EDE9FE] flex items-center justify-center cursor-default"
          >
            {plan === 'free' ? texts.pricing.currentPlan : 'Basic Included'}
          </button>
        </div>

        {/* PRO CARD (LIVE CHECKOUT) */}
        <div className="bg-gradient-to-br from-[#FAF5FF] via-white to-[#F3E8FF] rounded-3xl p-5 border-2 border-[#7C3AED] shadow-xl shadow-[#7C3AED]/15 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-[#A3E635] text-[#18181B] font-black text-[10px] uppercase px-4 py-1 rounded-bl-xl shadow-xs tracking-wider">
            Most Popular 🔥
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-sm font-black text-[#7C3AED]">
                  {texts.pricing.pro}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#2E1065] block leading-none">
                  {texts.pricing.proPrice}
                </span>
                <span className="text-[11px] font-extrabold text-[#7C3AED]">
                  {texts.pricing.proPerDay}
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#6D28D9]/80 mb-4">
              Unlock every question paper, answer key, and mock test.
            </p>

            <ul className="space-y-2 text-xs font-black text-[#2E1065] mb-5">
              <li className="flex items-center gap-2">
                <span className="p-0.5 rounded-full bg-[#A3E635] text-[#18181B]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>All 10th & 12th Official PYQs + Answer Keys</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-0.5 rounded-full bg-[#A3E635] text-[#18181B]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Unlimited Chapter Tests & One-words</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-0.5 rounded-full bg-[#A3E635] text-[#18181B]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Golden 5-Mark & Centum Question Sets</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-0.5 rounded-full bg-[#A3E635] text-[#18181B]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>High-Speed Direct Drive PDF Downloads</span>
              </li>
            </ul>
          </div>

          {plan === 'pro' || plan === 'live' ? (
            <div className="w-full min-h-[48px] rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] font-black text-xs flex items-center justify-center gap-1.5 shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>You are on Centum Pro 👑</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPaywall}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer"
            >
              <span>{texts.pricing.goPro}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

        {/* LIVE CARD (COMING SOON / WAITLIST ONLY) */}
        <div className="bg-white/80 rounded-3xl p-5 border border-[#EDE9FE] shadow-xs flex flex-col justify-between opacity-90">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#6D28D9]" />
                <span className="text-xs font-black uppercase text-[#6D28D9] tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5FF] border border-[#EDE9FE]">
                  {texts.pricing.live}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-[#FAF5FF] text-[#7C3AED] px-2 py-0.5 rounded-md border border-[#DDD6FE]">
                  {texts.pricing.comingSoon}
                </span>
                <span className="text-xl font-black text-[#2E1065]/70">
                  {texts.pricing.livePrice}
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#6D28D9]/70 mb-4">
              Live mentor guidance and centum masterclasses.
            </p>

            <ul className="space-y-2 text-xs font-bold text-[#6D28D9]/70 mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6D28D9]/50 shrink-0" />
                <span>Weekend Live Centum Masterclasses</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6D28D9]/50 shrink-0" />
                <span>1-on-1 Doubt Clearing with Board Toppers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6D28D9]/50 shrink-0" />
                <span>Personal Weekly Study Schedule</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleJoinWaitlist}
            disabled={waitlistJoined}
            className={`w-full min-h-[46px] rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              waitlistJoined
                ? 'bg-[#F0FDF4] text-[#166534] border border-[#86EFAC] cursor-default'
                : 'bg-white hover:bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE] shadow-xs cursor-pointer'
            }`}
          >
            <span>{waitlistJoined ? 'on the waitlist 🎟️' : texts.pricing.joinWaitlist}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
