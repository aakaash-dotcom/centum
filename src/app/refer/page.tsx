'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { ReferralData } from '@/types';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Coins,
  Clock,
  CheckCircle2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

export default function ReferPage() {
  const router = useRouter();
  const { student, isRegistered, openGate, showToast } = useApp();
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isRegistered || !student) {
      setIsLoading(false);
      return;
    }

    fetch(`/api/referrals?phone=${encodeURIComponent(student.phone)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.ok) {
          setData(resData);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [isRegistered, student]);

  const handleCopy = () => {
    if (!data?.couponCode) return;
    navigator.clipboard.writeText(data.couponCode);
    setCopied(true);
    showToast(texts.refer.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!data?.couponCode) return;
    const shareMessage = texts.refer.shareText.replace('{CODE}', data.couponCode);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank');
  };

  const handleAskWhatsApp = () => {
    const waUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
      'Hey Centum team! I want to activate my student referral code 🐣'
    )}`;
    window.open(waUrl, '_blank');
  };

  if (!isRegistered || !student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl mb-3">💸</span>
        <h1 className="text-xl font-black text-[#2E1065] mb-2">
          {texts.refer.title}
        </h1>
        <p className="text-xs font-semibold text-[#6D28D9]/75 mb-6 max-w-xs">
          Unlock your student profile to access your unique referral code and earn on every friend who joins Pro.
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

  const couponCode = data?.couponCode;
  const discountPercent = data?.discountPercent || 20;
  const shareAmount = data?.share || 150;
  const earnings = data?.earnings || { total: 0, pending: 0, paid: 0 };
  const referrals = data?.referrals || [];

  const ruleText = texts.refer.rule
    .replace('{discountPercent}', String(discountPercent))
    .replace('{share}', String(shareAmount));

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
            {texts.refer.title}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED]">
            {texts.refer.subtitle}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED]">loading your rewards... ⚡</p>
        </div>
      ) : couponCode ? (
        /* ACTIVE REFERRAL DASHBOARD */
        <div className="space-y-4">
          {/* Coupon Code Card */}
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white rounded-3xl p-6 shadow-xl shadow-[#7C3AED]/20 text-center flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E9D5FF] mb-1">
              Your Referral Code
            </span>

            <div className="my-2 px-5 py-2.5 rounded-2xl bg-white/15 border border-white/25 flex items-center gap-3">
              <span className="text-2xl font-black tracking-widest text-[#A3E635]">
                {couponCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                aria-label="Copy coupon code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#A3E635] stroke-[3]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-xs font-bold text-[#E9D5FF] max-w-xs mt-1">
              Friends get {discountPercent}% off & you earn ₹{shareAmount} per upgrade!
            </p>

            {/* Big WhatsApp Share CTA */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full min-h-[50px] mt-4 flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>{texts.refer.shareWhatsApp}</span>
            </button>
          </div>

          {/* Rule Card */}
          <div className="bg-[#FAF5FF] border border-[#DDD6FE] rounded-2xl p-3.5 text-xs font-bold text-[#5B21B6] flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-[#7C3AED] shrink-0" />
            <p className="leading-snug">{ruleText}</p>
          </div>

          {/* Earnings Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#EDE9FE] shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] mb-3">
              Earnings Summary
            </h3>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-[#FAF5FF] rounded-2xl border border-[#EDE9FE]">
                <span className="block text-[10px] font-extrabold uppercase text-[#6D28D9]/70">
                  {texts.refer.earningsTotal}
                </span>
                <span className="text-lg font-black text-[#2E1065]">
                  ₹{earnings.total}
                </span>
              </div>

              <div className="p-3 bg-[#FFFBEB] rounded-2xl border border-[#FEF3C7]">
                <span className="block text-[10px] font-extrabold uppercase text-[#B45309]">
                  {texts.refer.earningsPending}
                </span>
                <span className="text-lg font-black text-[#B45309]">
                  ₹{earnings.pending}
                </span>
              </div>

              <div className="p-3 bg-[#F0FDF4] rounded-2xl border border-[#DCFCE7]">
                <span className="block text-[10px] font-extrabold uppercase text-[#15803D]">
                  {texts.refer.earningsPaid}
                </span>
                <span className="text-lg font-black text-[#15803D]">
                  ₹{earnings.paid}
                </span>
              </div>
            </div>
          </div>

          {/* Referrals Activity List */}
          {referrals.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-[#EDE9FE] shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] mb-3">
                Recent Referrals
              </h3>

              <div className="space-y-2.5">
                {referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#EDE9FE] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#2E1065]">
                          {ref.maskedPhone}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                            ref.status === 'paid'
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {ref.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#6D28D9]/60">
                        {ref.date}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-[#16A34A] block">
                        +₹{ref.share}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NO COUPON ASSIGNED YET */
        <div className="bg-white rounded-3xl p-6 border border-[#EDE9FE] shadow-md shadow-[#7C3AED]/5 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center mb-3 border border-[#DDD6FE]">
            <span className="text-3xl">🐣</span>
          </div>

          <h2 className="text-base font-black text-[#2E1065] mb-2">
            Referral Program
          </h2>

          <p className="text-xs font-semibold text-[#6D28D9]/80 mb-6 max-w-xs leading-relaxed">
            {texts.refer.noCodeMessage}
          </p>

          <button
            type="button"
            onClick={handleAskWhatsApp}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] rounded-2xl shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{texts.refer.askWhatsApp}</span>
          </button>
        </div>
      )}
    </div>
  );
}
