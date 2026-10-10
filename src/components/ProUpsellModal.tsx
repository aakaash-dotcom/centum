'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, X, CheckCircle2, Sparkles, Tag, ArrowRight, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface ProUpsellContext {
  subject?: string;
  chapter?: string;
  videoCount?: number;
  conceptCount?: number;
  paperCount?: number;
}

interface ProUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ProUpsellContext;
}

export function ProUpsellModal({ isOpen, onClose, context }: ProUpsellModalProps) {
  const router = useRouter();
  const { medium } = useApp();
  const isTamil = medium === 'tamil';

  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    valid: boolean;
    discountPercent?: number;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const subject = context?.subject || 'Maths';
  const chapter = context?.chapter || 'Current Chapter';
  const vCount = context?.videoCount ?? 2;
  const cCount = context?.conceptCount ?? 18;
  const pCount = context?.paperCount ?? 12;

  // Base pricing
  const strikePrice = 2500;
  const standardPrice = 1499;
  const payablePrice = appliedCoupon?.valid ? 999 : standardPrice;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;

    setIsValidatingCoupon(true);
    try {
      const res = await fetch(`/api/coupon?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: clean,
          valid: true,
          discountPercent: data.discountPercent,
          message: isTamil
            ? `✓ ஆசிரியர்/பரிந்துரை குறியீடு ஏற்கப்பட்டது! கட்டணம்: ₹999`
            : `✓ Referral code applied! Special price: ₹999`,
        });
      } else {
        // Fallback for valid community/influencer codes
        if (['CENTUM10', 'TEACHER500', 'APEX20', 'FRIEND20', 'CENTUM500'].includes(clean)) {
          setAppliedCoupon({
            code: clean,
            valid: true,
            message: isTamil
              ? `✓ சமூக பரிந்துரை குறியீடு ஏற்கப்பட்டது! கட்டணம்: ₹999`
              : `✓ Community code applied! Special price: ₹999`,
          });
        } else {
          setAppliedCoupon({
            code: clean,
            valid: false,
            message: isTamil ? 'தவறான அல்லது காலாவதியான குறியீடு' : 'Invalid or expired coupon code',
          });
        }
      }
    } catch {
      setAppliedCoupon({
        code: clean,
        valid: false,
        message: 'Network error validating coupon',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleProceed = () => {
    onClose();
    const cParam = appliedCoupon?.valid ? `?coupon=${encodeURIComponent(appliedCoupon.code)}` : '';
    router.push(`/pricing${cParam}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-title"
      data-testid="pro-upsell-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1B0B2E] border-2 border-amber-400 dark:border-amber-500/40 shadow-2xl p-5 sm:p-6 text-[#2E1065] dark:text-[#FAF5FF] relative overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#3B2063]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center font-black shadow-xs">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                PRO UNLOCK
              </span>
              <h2 id="upsell-title" className="text-sm sm:text-base font-black leading-tight">
                {isTamil ? 'முழு Pro தொகுப்பைத் திறக்கவும்' : 'Unlock Everything in Pro'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Honest Ledger Live Context */}
        <div className="my-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {isTamil
                ? `இந்த அத்தியாயத்தில் (${subject}):`
                : `Instant Unlock for ${subject}:`}
            </span>
          </div>
          <p className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF] leading-relaxed">
            {isTamil
              ? `${vCount} வீடியோ பாடங்கள் · ${cCount} concept கேள்விகள் · ${pCount} தேர்வு தாள்கள் உடனடியாக திறக்கும்!`
              : `${vCount} video lectures · ${cCount} concept MCQs · ${pCount} past papers instantly unlocked!`}
          </p>
        </div>

        {/* Pricing Block */}
        <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#3B2063] mb-4 text-center">
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 line-through">
              ₹{strikePrice.toLocaleString()}
            </span>
            {appliedCoupon?.valid && (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 line-through">
                ₹{standardPrice.toLocaleString()}
              </span>
            )}
            <span className="text-2xl sm:text-3xl font-black text-[#7C3AED] dark:text-[#A3E635]">
              ₹{payablePrice.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-slate-500">/ முழு ஆண்டு</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {isTamil ? 'அனைத்து 5 பாடங்கள் + வீடியோக்கள் + மாதிரி தேர்வுகள்' : 'All 5 subjects + Videos + Practice Quizzes'}
          </p>
        </div>

        {/* Coupon Code Input Field */}
        <form onSubmit={handleApplyCoupon} className="space-y-2 mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder={isTamil ? 'ஆசிரியர் குறியீடு (e.g. CENTUM10)' : 'Referral Code (e.g. CENTUM10)'}
                className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-[#DDD6FE] dark:border-[#3B2063] bg-white dark:bg-[#1B0B2E] text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#7C3AED] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isValidatingCoupon || !couponInput.trim()}
              className="px-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isValidatingCoupon ? '...' : (isTamil ? 'பயன்படுத்து' : 'Apply')}
            </button>
          </div>

          {appliedCoupon && (
            <div
              className={`p-2 rounded-xl text-[11px] font-bold ${
                appliedCoupon.valid
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
              }`}
            >
              {appliedCoupon.message}
            </div>
          )}
        </form>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleProceed}
          className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-amber-500 via-[#7C3AED] to-[#9333EA] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-[#7C3AED]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <span>{isTamil ? 'உடனே Pro பெறுக →' : 'Upgrade to Pro Now →'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          {isTamil
            ? 'மாணவர் கல்வி உதவித்தொகை & பரிந்துரை தள்ளுபடி மட்டுமே'
            : 'Direct student access & community referral pricing'}
        </p>
      </div>
    </div>
  );
}
