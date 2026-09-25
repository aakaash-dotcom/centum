'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { COMING_SOON } from '@/data/config';
import { X, Sparkles, Check, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PaywallSheet: React.FC = () => {
  const {
    isPaywallOpen,
    paywallPitch,
    closePaywall,
    student,
    openGate,
    showToast,
  } = useApp();

  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  if (!isPaywallOpen) return null;

  const handleClose = () => {
    closePaywall();
  };

  const handleJoinWaitlist = async () => {
    if (!student) {
      handleClose();
      openGate();
      return;
    }

    setIsJoiningWaitlist(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: student.phone,
          name: student.name,
          plan: 'pro',
          timestamp: new Date().toISOString(),
        }),
      });
      setWaitlistJoined(true);
      showToast(texts.pricing.waitlistSuccess || "You're on the early-bird waitlist! 🐣");
    } catch {
      setWaitlistJoined(true);
      showToast(texts.pricing.waitlistSuccess || "You're on the early-bird waitlist! 🐣");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Centum Pro Paywall"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1B0B2E] rounded-t-3xl p-6 shadow-2xl border-t border-[#EDE9FE] dark:border-[#3B2063] animate-slide-up flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-[#2E1065] dark:text-[#F5F0FF] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle & Close Button */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border border-amber-400/40">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Centum Pro 👑
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] text-[#6D28D9] dark:text-[#B9A6D9] flex items-center justify-center hover:bg-[#EDE9FE] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Coming Soon Waitlist Mode */}
        <div className="flex flex-col items-center text-center gap-3 pt-1 pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-3xl shadow-md shadow-amber-500/20 animate-pulse">
            🚧
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-[#2E1065] dark:text-[#F5F0FF] tracking-tight">
              {texts.paywall.comingSoonTitle || 'centum pro — coming soon 🚧'}
            </h2>
            <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
              {texts.paywall.earlyBirdOffer || 'join the waitlist for the early-bird offer 🐣'}
            </p>
          </div>

          {paywallPitch && (
            <div className="w-full px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/30 text-xs font-black text-amber-900 dark:text-amber-200 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{paywallPitch}</span>
            </div>
          )}
        </div>

        {/* Pro Benefits Highlights */}
        <div className="space-y-2 bg-[#FAF5FF] dark:bg-[#0F0618] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#3B2063]">
          <div className="flex items-start gap-2.5 text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
            <span className="p-1 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <span>{texts.paywall.pitch1}</span>
          </div>

          <div className="flex items-start gap-2.5 text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
            <span className="p-1 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <span>{texts.paywall.pitch2}</span>
          </div>

          <div className="flex items-start gap-2.5 text-xs font-black text-[#2E1065] dark:text-[#F5F0FF]">
            <span className="p-1 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <span>{texts.paywall.pitch3}</span>
          </div>
        </div>

        {/* Early-Bird Offer Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-400/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/40 text-amber-950 dark:text-amber-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
              Early-Bird Priority Pass
            </span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-200">
              Get 50% discount on launch day 🐣
            </span>
          </div>
          <span className="text-2xl">⚡</span>
        </div>

        {/* Action Button */}
        {waitlistJoined ? (
          <div className="w-full min-h-[50px] rounded-2xl bg-amber-500/20 text-amber-950 dark:text-amber-200 font-black text-xs flex items-center justify-center gap-2 border border-amber-400">
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{texts.pricing.waitlistSuccess || "you're on the early-bird list! 🐣"}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleJoinWaitlist}
            disabled={isJoiningWaitlist}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 font-black text-sm text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 active:scale-[0.98] rounded-2xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-60 border border-amber-300"
          >
            {isJoiningWaitlist ? (
              <div className="w-5 h-5 rounded-full border-2 border-amber-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{texts.paywall.joinWaitlistEarly || 'join the early-bird waitlist 🐣'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
