'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { TN_DISTRICTS } from '@/data/districts';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GateSheet: React.FC = () => {
  const { isGateOpen, closeGate, registerStudent, showToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [standard, setStandard] = useState('10th');
  const [district, setDistrict] = useState('Chennai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isGateOpen) return null;

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
        district,
      });

      // Confetti burst on unlock!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#7C3AED', '#A3E635', '#F472B6'],
        });
      } catch (e) {
        // Safe fallback
      }

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-fade-in p-0 sm:p-4"
      onClick={closeGate}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 border-t border-[#E9D5FF] sm:border animate-slide-up text-[#2E1065] relative max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#DDD6FE] rounded-full mx-auto mb-4" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeGate}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#6D28D9] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] mb-2 shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-[#2E1065] tracking-tight">
            {texts.gate.title}
          </h2>
          <p className="text-xs font-semibold text-[#7C3AED] mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            {texts.gate.subtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] mb-1.5">
              {texts.gate.nameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={texts.gate.namePlaceholder}
              className="w-full min-h-[48px] px-4 rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] text-[#2E1065] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] mb-1.5">
              {texts.gate.phoneLabel}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-bold text-[#7C3AED]">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={texts.gate.phonePlaceholder}
                className="w-full min-h-[48px] pl-12 pr-4 rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] text-[#2E1065] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all tracking-wider"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] mb-1.5">
                {texts.gate.standardLabel}
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] text-[#2E1065] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all cursor-pointer"
              >
                {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] mb-1.5">
                {texts.gate.districtLabel}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full min-h-[48px] px-3 rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] text-[#2E1065] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all cursor-pointer"
              >
                {TN_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Big Lime Accent Button with Dark Text */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[52px] mt-2 flex items-center justify-center font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/30 transition-all cursor-pointer"
          >
            {isSubmitting ? texts.gate.saving : texts.gate.button}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#6D28D9]/70 font-medium mt-4">
          {texts.papers.attribution}
        </p>
      </div>
    </div>
  );
};
