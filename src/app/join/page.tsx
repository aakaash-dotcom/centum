'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { normalizePhone } from '@/lib/phone';
import { Crown, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { student, setPlan, medium, showToast } = useApp();

  const seatParam = searchParams.get('seat') || '';
  const [seatCode, setSeatCode] = useState(seatParam.toUpperCase());
  const [phone, setPhone] = useState(student?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [claimSuccess, setClaimSuccess] = useState<any | null>(null);

  useEffect(() => {
    if (seatParam) {
      setSeatCode(seatParam.toUpperCase());
    }
  }, [seatParam]);

  useEffect(() => {
    if (student?.phone && !phone) {
      setPhone(student.phone);
    }
  }, [student?.phone, phone]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(phone);
    const cleanSeat = seatCode.trim().toUpperCase();

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(medium === 'tamil' ? 'சரியான 10-இலக்க மொபைல் எண்ணை உள்ளிடவும் 📱' : 'Enter a valid 10-digit mobile number 📱');
      return;
    }

    if (!cleanSeat) {
      setErrorMsg(medium === 'tamil' ? 'இருக்கை குறியீட்டை உள்ளிடவும் 🎫' : 'Enter your seat code 🎫');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/seat-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          seatCode: cleanSeat,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setClaimSuccess(data);
        setPlan('pro');
        try {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#10B981', '#7C3AED'],
          });
        } catch (e) {}
        showToast(medium === 'tamil' ? 'ப்ரோ திட்டம் செயல்படுத்தப்பட்டது! 👑' : 'Pro plan activated! 👑');
      } else {
        if (data.error === 'seat-already-claimed') {
          setErrorMsg(
            medium === 'tamil'
              ? 'இந்த இருக்கை குறியீடு ஏற்கனவே மற்றொரு மாணவரால் பெறப்பட்டுள்ளது. உங்கள் டியூஷன் ஆசிரியரைத் தொடர்பு கொள்ளவும்.'
              : 'This seat code has already been claimed by another student. Please contact your tuition teacher.'
          );
        } else if (data.error === 'seat-expired') {
          setErrorMsg(medium === 'tamil' ? 'இந்த இருக்கை குறியீடு காலாவதியானது.' : 'This seat code has expired.');
        } else if (data.error === 'seat-not-found') {
          setErrorMsg(medium === 'tamil' ? 'இருக்கை குறியீடு தவறானது. மீண்டும் சரிபார்க்கவும்.' : 'Seat code not found. Please double-check.');
        } else {
          setErrorMsg(data.message || (medium === 'tamil' ? 'செயல்பாட்டில் பிழை, மீண்டும் முயற்சிக்கவும்' : 'Failed to claim seat, please retry.'));
        }
      }
    } catch (e) {
      setErrorMsg(medium === 'tamil' ? 'இணைப்புப் பிழை, மீண்டும் முயற்சிக்கவும்' : 'Network error, please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTamil = medium === 'tamil';

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-16 max-w-lg mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
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
            {isTamil ? 'இருக்கை அனுமதி 🎫' : 'Claim Your Seat 🎫'}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {isTamil ? 'டியூஷன் மையம் மூலமாக ப்ரோ திட்டம்' : 'Tuition Classroom Pro Activation'}
          </p>
        </div>
      </div>

      {claimSuccess ? (
        /* PRO ACTIVATION CONFIRMATION CARD */
        <div className="bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] dark:from-[#2A1705] dark:via-[#1B0B2E] dark:to-[#2A1247] rounded-3xl p-6 border-2 border-amber-400 dark:border-amber-400/90 shadow-xl shadow-amber-500/20 text-center animate-slide-up space-y-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-400 flex items-center justify-center mx-auto shadow-md shadow-amber-500/30">
            <Crown className="w-8 h-8 text-amber-950" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-400/30 text-amber-900 dark:text-amber-200">
              {isTamil ? 'உறுதிப்படுத்தப்பட்டது ✨' : 'PRO ACTIVATED ✨'}
            </span>
            <h2 className="text-2xl font-black text-amber-950 dark:text-amber-100 tracking-tight mt-2">
              {isTamil ? 'சென்டம் ப்ரோ செயல்படுத்தப்பட்டது! 👑' : 'Centum Pro Activated! 👑'}
            </h2>
            <p className="text-xs font-bold text-amber-900/80 dark:text-amber-200/80 mt-1">
              {claimSuccess.alreadyClaimed
                ? (isTamil ? 'உங்கள் இருக்கை ஏற்கனவே செயல்பட்டுள்ளது!' : 'Your seat code was already claimed & is active!')
                : (isTamil ? 'உங்கள் டியூஷன் மையம் வழங்கிய இலவச ப்ரோ அனுமதி!' : 'Complimentary Pro access granted by your tuition centre!')}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-[#1B0B2E]/90 rounded-2xl p-4 text-left border border-amber-300 dark:border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-100 pb-2 border-b border-amber-200 dark:border-amber-500/20">
              <span>{isTamil ? 'டியூஷன் குறியீடு' : 'Tuition Code'}:</span>
              <span className="font-black text-sm uppercase text-[#7C3AED] dark:text-[#A78BFA]">{claimSuccess.tuitionCode}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-100 pb-2 border-b border-amber-200 dark:border-amber-500/20">
              <span>{isTamil ? 'திட்டம்' : 'Plan'}:</span>
              <span className="font-black text-amber-700 dark:text-amber-400 uppercase">Centum Pro (1 Year)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-100">
              <span>{isTamil ? 'காலாவதி தேதி' : 'Valid Until'}:</span>
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                {claimSuccess.expiresAt ? new Date(claimSuccess.expiresAt).toLocaleDateString() : '1 Year Access'}
              </span>
            </div>
          </div>

          {/* Unlocked Pro Features */}
          <div className="text-left space-y-1.5 text-xs font-bold text-amber-950 dark:text-amber-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isTamil ? 'வினாத்தாள் விடைகள் & படிநிலை தீர்வுகள்' : 'Full answer keys + step solutions'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isTamil ? 'அனைத்துப் பாடப் புத்தக வினாடி வினாக்கள்' : 'All chapters concept quizzes & mock tests'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isTamil ? 'முழுமையான மாதிரி தேர்வுகள்' : 'Full model exam papers'}</span>
            </div>
          </div>

          <Link
            href="/"
            className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 active:scale-[0.98] text-amber-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer border border-amber-300"
          >
            <span>{isTamil ? 'பயிற்சி செய்ய தொடங்குக 🚀' : 'Start Practicing 🚀'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* CLAIM FORM */
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#3B2063] shadow-lg space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#7C3AED] dark:text-[#A3E635]" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF]">
                {isTamil ? 'டியூஷன் இருக்கை குறியீடு வைத்துள்ளீர்களா?' : 'Have a Tuition Centre Seat Code?'}
              </p>
              <p className="text-[11px] font-medium text-[#7C3AED] dark:text-[#A78BFA] mt-0.5">
                {isTamil ? 'உடனடியாக 1 வருட இலவச ப்ரோ திட்டத்தைப் பெறுங்கள்' : 'Unlock 1 year of full Centum Pro features instantly'}
              </p>
            </div>
          </div>

          <form onSubmit={handleClaim} className="space-y-4">
            {/* Seat Code input */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                {isTamil ? 'இருக்கை குறியீடு (Seat Code)' : 'Seat Code'}
              </label>
              <input
                type="text"
                required
                value={seatCode}
                onChange={(e) => setSeatCode(e.target.value.toUpperCase())}
                placeholder={isTamil ? 'எ.கா. DEMO10-S02' : 'e.g. DEMO10-S02'}
                className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            {/* Student Phone input */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                {isTamil ? 'உங்கள் மொபைல் எண்' : 'Your Mobile Number'}
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
                  placeholder="98765 43210"
                  className="w-full min-h-[48px] pl-12 pr-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tracking-wider"
                />
              </div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                {isTamil
                  ? 'இருக்கை உங்கள் தொலைபேசி எண்ணுடன் நிரந்தரமாக இணைக்கப்படும்.'
                  : 'The seat is permanently bound to this mobile number.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] text-[#18181B] font-black text-sm shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>{isTamil ? 'சரிபார்க்கிறது...' : 'Claiming Seat...'}</span>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>{isTamil ? 'ப்ரோ திட்டத்தைப் பெறுங்கள் 👑' : 'Claim Pro Seat 👑'}</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            {isTamil ? (
              <p>டியூஷன் ஆசிரியரா? <Link href="/owner" className="font-bold text-[#7C3AED] dark:text-[#A3E635] underline">மைய போர்ட்டல் இங்கே</Link></p>
            ) : (
              <p>Tuition owner? <Link href="/owner" className="font-bold text-[#7C3AED] dark:text-[#A3E635] underline">Owner portal here</Link></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-gray-400">Loading seat claim...</div>}>
      <JoinContent />
    </Suspense>
  );
}
