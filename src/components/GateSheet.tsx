'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { TN_DISTRICTS } from '@/data/districts';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const STREAMS = [
  'Science — Maths',
  'Science — Biology',
  'Commerce',
  'Arts',
] as const;

export const GateSheet: React.FC = () => {
  const { isGateOpen, closeGate, registerStudent, showToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [standard, setStandard] = useState('10th');
  const [stream, setStream] = useState<string>('Science — Maths');
  const [district, setDistrict] = useState('Chennai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isGateOpen) return null;

  const isHigherSecondary = standard === '11th' || standard === '12th';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanName) {
      setErrorMsg('what should we call you? ✍️');
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg('enter a valid 10-digit mobile number 📱');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerStudent({
        name: cleanName,
        phone: cleanPhone,
        standard,
        stream: isHigherSecondary ? stream : undefined,
        district,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#7C3AED', '#A3E635', '#F472B6'],
        });
      } catch (e) {}

      showToast('unlocked everything! 🚀');
    } catch (err) {
      setErrorMsg('oops, try again! 👻');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-0 sm:p-4"
      onClick={closeGate}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#3B0F6E] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 border-t border-[#E9D5FF] dark:border-[#DDD6FE]/20 sm:border animate-slide-up text-[#2E1065] dark:text-[#FAF5FF] relative max-h-[92vh] overflow-y-auto no-scrollbar transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#DDD6FE] dark:bg-[#DDD6FE]/20 rounded-full mx-auto mb-4" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeGate}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FAF5FF] dark:bg-[#230542] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] text-[#6D28D9] dark:text-[#A3E635] transition-colors cursor-pointer border border-[#DDD6FE]/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] mb-2 shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {texts.gate.title}
          </h2>
          <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A3E635] mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            {texts.gate.subtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-[#FEE2E2] dark:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
              {texts.gate.nameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={texts.gate.namePlaceholder}
              className="w-full min-h-[48px] px-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
              {texts.gate.phoneLabel}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-bold text-[#7C3AED] dark:text-[#A3E635]">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={texts.gate.phonePlaceholder}
                className="w-full min-h-[48px] pl-12 pr-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all tracking-wider"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                {texts.gate.standardLabel}
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all cursor-pointer"
              >
                {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => (
                  <option key={cls} value={cls} className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF]">
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                {texts.gate.districtLabel}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all cursor-pointer"
              >
                {TN_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist} className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF]">
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Stream Dropdown for 11th & 12th only */}
          {isHigherSecondary && (
            <div className="animate-fade-in">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                {texts.gate.streamLabel}
              </label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all cursor-pointer"
              >
                {STREAMS.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Big Lime Accent Button with Dark Text */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] mt-2 flex items-center justify-center font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/30 transition-all cursor-pointer"
          >
            {isSubmitting ? texts.gate.saving : texts.gate.button}
          </button>
        </form>

        {/* Registration footer micro-line linking /privacy */}
        <p className="text-center text-[11px] text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 font-semibold mt-4">
          <Link
            href="/privacy"
            onClick={closeGate}
            className="hover:underline hover:text-[#7C3AED] dark:hover:text-[#A3E635] transition-colors"
          >
            {texts.gate.termsNotice}
          </Link>
        </p>
      </div>
    </div>
  );
};
