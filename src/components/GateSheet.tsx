'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { normalizePhone } from '@/lib/phone';
import { TN_DISTRICTS } from '@/data/districts';
import { X, Sparkles, ShieldCheck, Smartphone, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

const STREAMS = [
  'Science — Maths',
  'Science — Biology',
  'Commerce',
  'Arts',
] as const;

export const GateSheet: React.FC = () => {
  const {
    isGateOpen,
    gateMode,
    closeGate,
    registerStudent,
    sendOtp,
    verifyOtp,
    showToast,
    guestStandard,
    medium,
  } = useApp();

  const [mode, setMode] = useState<'register' | 'login' | 'otp'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [standard, setStandard] = useState(guestStandard || '10th');
  const [stream, setStream] = useState<string>('Science — Maths');
  const [district, setDistrict] = useState('Chennai');
  const [waOptIn, setWaOptIn] = useState(true);
  const [tuitionCode, setTuitionCode] = useState('');
  const [tuitionValid, setTuitionValid] = useState<boolean | null>(null);
  const [tuitionInfo, setTuitionInfo] = useState<{ tuitionName: string; discountPercent: number; code: string } | null>(null);
  const [isValidatingTuition, setIsValidatingTuition] = useState(false);
  const [tuitionError, setTuitionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Sync mode whenever gate opens
  useEffect(() => {
    if (isGateOpen) {
      setMode(gateMode);
      setErrorMsg('');
      setOtpCode('');
      if (guestStandard) {
        setStandard(guestStandard);
      }
    }
  }, [isGateOpen, gateMode, guestStandard]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validateTuitionCode = async (codeToTest: string): Promise<boolean> => {
    const clean = codeToTest.trim().toUpperCase();
    if (!clean) {
      setTuitionValid(null);
      setTuitionInfo(null);
      setTuitionError('');
      return true;
    }
    setIsValidatingTuition(true);
    setTuitionError('');
    try {
      const res = await fetch(`/api/classroom-info?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.tuition) {
        setTuitionValid(true);
        setTuitionInfo({
          tuitionName: data.tuition.tuitionName,
          discountPercent: Number(data.tuition.discountPercent) || 0,
          code: clean,
        });
        return true;
      } else {
        setTuitionValid(false);
        setTuitionInfo(null);
        setTuitionError(data.error === 'tuition-inactive' ? 'Tuition centre is inactive' : texts.gate.tuitionInvalid);
        return false;
      }
    } catch (e) {
      setTuitionValid(false);
      setTuitionError(texts.gate.tuitionInvalid);
      return false;
    } finally {
      setIsValidatingTuition(false);
    }
  };

  if (!isGateOpen) return null;

  const hasStream = standard === '11th' || standard === '12th';

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanPhone = normalizePhone(phone);

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Enter your full name (minimum 2 characters) ✍️');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Enter a valid 10-digit mobile number 📱');
      return;
    }

    if (hasStream && !stream.trim()) {
      setErrorMsg('Please select your stream (e.g. Science, Commerce, Arts) 📚');
      return;
    }

    const cleanTuition = tuitionCode.trim().toUpperCase();
    if (cleanTuition) {
      const ok = await validateTuitionCode(cleanTuition);
      if (!ok) {
        setErrorMsg(texts.gate.tuitionInvalid);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const regRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          classLevel: standard,
          standard,
          stream: hasStream ? stream : undefined,
          medium,
          district,
          tuitionCode: cleanTuition || undefined,
          waOptIn,
        }),
      });

      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok || !regData.ok) {
        setErrorMsg(regData.error || 'Registration failed, please check your details');
        return;
      }

      // Automatically dispatch OTP and switch to OTP mode
      await sendOtp(cleanPhone);
      setCooldown(60);
      setMode('otp');
      showToast('Registration saved! Verification code sent 📱');
    } catch (err: any) {
      setErrorMsg('Registration error, please retry 👻');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Enter a valid 10-digit mobile number 📱');
      return;
    }

    try {
      setIsSubmitting(true);
      await sendOtp(cleanPhone);
      setCooldown(60);
      setMode('otp');
      showToast('Login code sent to your phone! 📱');
    } catch {
      setErrorMsg('Failed to dispatch code, please try again 👻');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(phone);
    const cleanCode = otpCode.trim();

    if (!cleanPhone) {
      setErrorMsg('Missing phone number 📱');
      return;
    }

    if (!cleanCode) {
      setErrorMsg('Enter your login code 🔑');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await verifyOtp(cleanPhone, cleanCode);
      if (res.ok) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#7C3AED', '#A3E635', '#F472B6'],
          });
        } catch (e) {}

        showToast('welcome back! 🚀');
        return;
      }

      setErrorMsg(res.error || 'Invalid verification code');
    } catch {
      setErrorMsg('Verification failed, please retry 👻');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) return;
    try {
      setIsSubmitting(true);
      await sendOtp(cleanPhone);
      setCooldown(60);
      showToast('New code sent! 📱');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDemoNumber = ['9123456780', '9840123456'].includes(phone.replace(/\D/g, '').slice(-10));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-0 sm:p-4"
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
            {mode === 'otp' ? (
              <Smartphone className="w-6 h-6 animate-pulse" />
            ) : mode === 'login' ? (
              <Smartphone className="w-6 h-6 animate-pulse" />
            ) : (
              <Sparkles className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <h2 className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {mode === 'otp'
              ? 'Enter Verification Code'
              : mode === 'login'
              ? 'Sign In with Mobile'
              : texts.gate.title}
          </h2>
          <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A3E635] mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            {mode === 'otp'
              ? `Code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`
              : mode === 'login'
              ? 'Fast & secure OTP login'
              : texts.gate.subtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-[#FEE2E2] dark:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* 1. REGISTRATION FORM (First time only) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
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

            {/* Class Selector: All 6th–12th prominently displayed & tappable */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-2">
                {texts.gate.standardLabel}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
                {[
                  { id: '6th', label: texts.classes.c6 },
                  { id: '7th', label: texts.classes.c7 },
                  { id: '8th', label: texts.classes.c8 },
                  { id: '9th', label: texts.classes.c9 },
                  { id: '10th', label: texts.classes.c10 },
                  { id: '11th', label: texts.classes.c11 },
                  { id: '12th', label: texts.classes.c12 },
                ].map(({ id, label }) => {
                  const isSelected = standard === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStandard(id)}
                      className={`min-h-[42px] rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25 scale-[1.02]'
                          : 'text-[#6D28D9] dark:text-[#FAF5FF] hover:bg-white/60 dark:hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Stream Dropdown for 11th and 12th */}
            {hasStream && (
              <div className="animate-fade-in">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                  Stream (Required for 11th & 12th)
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full min-h-[48px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all cursor-pointer"
                >
                  {STREAMS.map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF]"
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* District Dropdown */}
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
                  <option
                    key={dist}
                    value={dist}
                    className="bg-white dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF]"
                  >
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Tuition Centre Code Input */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5 flex items-center justify-between">
                <span>{texts.gate.tuitionLabel}</span>
                {isValidatingTuition && (
                  <span className="text-[10px] text-[#7C3AED] dark:text-[#A3E635] animate-pulse">
                    {texts.gate.tuitionValidating}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tuitionCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setTuitionCode(val);
                    if (!val) {
                      setTuitionValid(null);
                      setTuitionInfo(null);
                      setTuitionError('');
                    }
                  }}
                  onBlur={() => {
                    if (tuitionCode.trim()) {
                      validateTuitionCode(tuitionCode);
                    }
                  }}
                  placeholder={texts.gate.tuitionPlaceholder}
                  className={`w-full min-h-[48px] px-3.5 pr-20 rounded-xl border ${
                    tuitionValid === true
                      ? 'border-[#16A34A] focus:ring-[#16A34A]'
                      : tuitionValid === false
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-[#DDD6FE] dark:border-[#DDD6FE]/20 focus:ring-[#7C3AED]'
                  } bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 transition-all`}
                />
                {tuitionCode.trim() && (
                  <button
                    type="button"
                    disabled={isValidatingTuition}
                    onClick={() => validateTuitionCode(tuitionCode)}
                    className="absolute right-2 top-2 bottom-2 px-2.5 rounded-lg text-xs font-extrabold bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#A3E635] transition-colors cursor-pointer"
                  >
                    Verify
                  </button>
                )}
              </div>

              {tuitionValid === true && tuitionInfo && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎓</span>
                    <div>
                      <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                        {tuitionInfo.tuitionName}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {tuitionInfo.discountPercent > 0
                          ? `${tuitionInfo.discountPercent}% Student Discount Unlocked! ✨`
                          : 'Linked to Tuition Centre'}
                      </p>
                    </div>
                  </div>
                  {tuitionInfo.discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#A3E635] text-[#18181B] font-black text-[11px] shadow-xs">
                      SAVE {tuitionInfo.discountPercent}%
                    </span>
                  )}
                </div>
              )}

              {tuitionValid === false && tuitionError && (
                <p className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">
                  {tuitionError}
                </p>
              )}
            </div>

            {/* WhatsApp Opt-in Checkbox */}
            <div
              onClick={() => setWaOptIn(!waOptIn)}
              className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 cursor-pointer hover:border-[#7C3AED]/40 transition-colors select-none"
            >
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="waOptInCheckbox"
                  checked={waOptIn}
                  onChange={(e) => setWaOptIn(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A] border-gray-300 dark:border-gray-600 cursor-pointer accent-[#16A34A]"
                />
              </div>
              <label htmlFor="waOptInCheckbox" className="text-xs leading-snug cursor-pointer select-none">
                <span className="block font-bold text-[#2E1065] dark:text-[#FAF5FF]">
                  வாட்ஸ்அப்பில் தேர்வு அறிவிப்புகள் & வினாத்தாள்களைப் பெறுங்கள்
                </span>
                <span className="block text-[11px] font-medium text-[#7C3AED] dark:text-[#A3E635] mt-0.5">
                  Get exam updates, question papers & test alerts on WhatsApp
                </span>
              </label>
            </div>

            {/* Big Lime Accent Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[52px] mt-2 flex items-center justify-center font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/30 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Register & Get OTP 🚀'}
            </button>

            {/* Switch to Login Mode button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('login');
                }}
                className="min-h-[44px] text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] hover:underline cursor-pointer"
              >
                Already registered? Sign in with OTP 📱
              </button>
            </div>
          </form>
        )}

        {/* 2. LOGIN FORM (Enter Phone & Dispatch OTP) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                Mobile Number
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
                  placeholder="9876543210"
                  className="w-full min-h-[48px] pl-12 pr-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all tracking-wider"
                />
              </div>
            </div>

            {/* Demo badge helper */}
            <div className="p-3 bg-[#FAF5FF] dark:bg-[#230542] rounded-xl border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/20 text-[11px] text-[#7C3AED] dark:text-[#A3E635]">
              <span className="font-bold">Demo Accounts:</span> 9123456780 (10th) or 9840123456 (12th Pro) — fixed OTP is <strong>4321</strong>.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[52px] mt-2 flex items-center justify-center font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/30 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Sending Code...' : 'Send Login Code 🚀'}
            </button>

            {/* Switch to Register Mode button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('register');
                }}
                className="min-h-[44px] text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] hover:underline cursor-pointer"
              >
                New student? Create an account ✍️
              </button>
            </div>
          </form>
        )}

        {/* 3. OTP VERIFICATION FORM */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-[#6D28D9] dark:text-[#A3E635]">
              <span>Phone: +91 {phone.replace(/\D/g, '').slice(-10)}</span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('login');
                }}
                className="flex items-center gap-1 hover:underline cursor-pointer text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                Verification Code (6 Digits)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                placeholder={isDemoNumber ? '4321' : '123456'}
                className="w-full min-h-[52px] px-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-2xl font-black text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
              />
            </div>

            {isDemoNumber && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 rounded-xl text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                ✨ Demo account detected — enter fixed code <strong>4321</strong>.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[52px] mt-2 flex items-center justify-center font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/30 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Enter 🚀'}
            </button>

            {/* Resend OTP button with cooldown */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={cooldown > 0 || isSubmitting}
                onClick={handleResendOtp}
                className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  cooldown > 0
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-[#7C3AED] dark:text-[#A3E635] hover:underline'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('register');
                }}
                className="font-bold text-[#7C3AED] dark:text-[#A3E635] hover:underline cursor-pointer"
              >
                Register instead
              </button>
            </div>
          </form>
        )}

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
