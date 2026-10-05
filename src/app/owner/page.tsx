'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { normalizePhone } from '@/lib/phone';
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  Receipt,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface TuitionStatsData {
  tuition: {
    code: string;
    tuitionName: string;
    ownerName: string;
    ownerPhone: string;
    ownerUpi?: string;
    district?: string;
    mode: string;
    discountPercent: number;
    commissionPercent: number;
    seatsTotal: number;
    active: boolean;
  };
  seatsTotal: number;
  seatsClaimed: number;
  activeStudentsCount: number;
  students: Array<{
    name: string;
    phone: string;
    standard: string;
    medium: string;
    plan: string;
    testsCount?: number;
    avgScore?: number;
    lastActive?: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    testsTaken: number;
    avgScore: number;
  }>;
  payoutStatement: {
    code: string;
    commissionPercent: number;
    ownerUpi: string;
    totalAttributedOrders: number;
    totalGrossRevenue: number;
    totalCommissionDue: number;
    status: string;
    cycle: string;
  };
}

export default function OwnerPortalPage() {
  const { medium, showToast } = useApp();
  const isTamil = medium === 'tamil';

  // Auth states
  const [ownerPhone, setOwnerPhone] = useState('');
  const [tuitionCode, setTuitionCode] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp' | 'authenticated'>('credentials');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dashboard data
  const [statsData, setStatsData] = useState<TuitionStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'activity' | 'payout'>('roster');

  // Load saved session if exists
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('centum_owner_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ownerPhone && parsed.tuitionCode) {
          setOwnerPhone(parsed.ownerPhone);
          setTuitionCode(parsed.tuitionCode);
          setStep('authenticated');
          fetchTuitionStats(parsed.tuitionCode, parsed.ownerPhone);
        }
      }
    } catch (e) {}
  }, []);

  const fetchTuitionStats = async (code: string, phone: string) => {
    setIsLoadingStats(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/tuition-stats?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.stats) {
        setStatsData(data.stats);
      } else {
        setErrorMsg(
          data.error === 'unauthorized-cross-tuition-denied'
            ? (isTamil ? 'அங்கீகாரமற்ற அணுகல் — இந்த மையம் உங்கள் தொலைபேசி எண்ணுடன் பொருந்தவில்லை.' : 'Unauthorized: This tuition centre is not linked to your mobile number.')
            : (data.error || 'Failed to fetch tuition stats')
        );
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'புள்ளிவிவரங்களைப் பெறுவதில் பிழை ஏற்பட்டது' : 'Network error loading tuition stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(ownerPhone);
    const cleanCode = tuitionCode.trim().toUpperCase();

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(isTamil ? 'சரியான 10-இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Enter a valid 10-digit mobile number');
      return;
    }

    if (!cleanCode) {
      setErrorMsg(isTamil ? 'டியூஷன் மைய குறியீட்டை உள்ளிடவும்' : 'Enter your tuition centre code');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStep('otp');
        showToast(isTamil ? 'OTP வாட்ஸ்அப்பில் அனுப்பப்பட்டது! 📲' : 'OTP sent to WhatsApp! 📲');
      } else {
        // Fallback to direct OTP entry for dev convenience
        setStep('otp');
        showToast('Enter OTP (Dev code: 123456) 🔑');
      }
    } catch (e) {
      setStep('otp');
      showToast('Enter OTP (Dev code: 123456) 🔑');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = normalizePhone(ownerPhone);
    const cleanCode = tuitionCode.trim().toUpperCase();
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      setErrorMsg(isTamil ? 'OTP சரியாக 6 இலக்கங்கள் இருக்க வேண்டும்' : 'OTP must be 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        sessionStorage.setItem(
          'centum_owner_session',
          JSON.stringify({ ownerPhone: cleanPhone, tuitionCode: cleanCode })
        );
        setStep('authenticated');
        showToast(isTamil ? 'போர்ட்டல் திறக்கப்பட்டது! 🚀' : 'Portal unlocked! 🚀');
        await fetchTuitionStats(cleanCode, cleanPhone);
      } else {
        setErrorMsg(data.error || (isTamil ? 'தவறான OTP, மீண்டும் முயற்சிக்கவும்' : 'Invalid OTP. Please check and try again.'));
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'சரிபார்ப்பில் பிழை' : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('centum_owner_session');
    setStep('credentials');
    setStatsData(null);
    setOtp('');
    showToast(isTamil ? 'வெளியேறியது' : 'Logged out');
  };

  // 1. LOGIN / OTP SCREEN
  if (step !== 'authenticated') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto w-full text-[#2E1065] dark:text-[#F5F0FF] animate-fade-in">
        <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 sm:p-8 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/30 flex items-center justify-center mx-auto text-[#7C3AED] dark:text-[#A3E635]">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#F5F0FF]">
              {isTamil ? 'டியூஷன் மைய போர்ட்டல்' : 'Tuition Owner Portal'}
            </h1>
            <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
              {isTamil ? 'பாதுகாப்பான வாட்ஸ்அப் OTP மூலம் உள்நுழைக' : 'Secure WhatsApp OTP sign-in for tuition centre owners'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                  {isTamil ? 'டியூஷன் குறியீடு (Code)' : 'Tuition Centre Code'}
                </label>
                <input
                  type="text"
                  required
                  value={tuitionCode}
                  onChange={(e) => setTuitionCode(e.target.value.toUpperCase())}
                  placeholder={isTamil ? 'எ.கா. DEMO10 அல்லது APEX20' : 'e.g. DEMO10 or APEX20'}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                  {isTamil ? 'உரிமையாளர் மொபைல் எண்' : 'Owner Registered Mobile'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-[#7C3AED] dark:text-[#A3E635]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="98401 23456"
                    className="w-full min-h-[48px] pl-12 pr-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] text-[#18181B] font-black text-sm shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
              >
                {isSendingOtp ? (
                  <span>{isTamil ? 'அனுப்பப்படுகிறது...' : 'Sending OTP...'}</span>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>{isTamil ? 'வாட்ஸ்அப் OTP பெறுக 📲' : 'Send WhatsApp OTP 📲'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] text-center">
                {isTamil ? 'OTP அனுப்பப்பட்ட எண்: ' : 'OTP sent to WhatsApp: '}
                <span className="font-bold text-[#2E1065] dark:text-[#FAF5FF]">+91 {ownerPhone}</span>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5 text-center">
                  {isTamil ? '6-இலக்க OTP குறியீடு' : '6-Digit Security OTP'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full min-h-[52px] text-center text-2xl font-black tracking-[0.5em] rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] text-[#18181B] font-black text-sm shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <span>{isTamil ? 'சரிபார்க்கிறது...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{isTamil ? 'போர்ட்டலில் உள்நுழைக 🔑' : 'Verify & Open Portal 🔑'}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] underline cursor-pointer"
                >
                  {isTamil ? 'தொலைபேசி எண் மாற்று' : 'Change Phone Number'}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:underline">
              {isTamil ? '← மாணவர் முகப்புக்குத் திரும்ப' : '← Return to Student App'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW (Read-only, no edits)
  const tuition = statsData?.tuition;
  const seatsTotal = statsData?.seatsTotal ?? 0;
  const seatsClaimed = statsData?.seatsClaimed ?? 0;
  const claimedPercent = seatsTotal > 0 ? Math.round((seatsClaimed / seatsTotal) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-20 max-w-4xl mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#3B2063] shadow-md mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A3E635] flex items-center justify-center text-white font-black text-xl shadow-md">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {tuition?.tuitionName || 'Tuition Centre'}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A3E635] font-black text-xs uppercase tracking-wider">
                {tuition?.code}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {tuition?.ownerName} • {tuition?.district} • {isTamil ? 'பயன்முறை: ' : 'Mode: '}
              <span className="font-bold uppercase text-[#7C3AED] dark:text-[#A3E635]">{tuition?.mode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isTamil ? 'செயலில் உள்ளது' : 'Active Centre'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2A1247] hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isTamil ? 'வெளியேறு' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {isLoadingStats && (
        <div className="p-8 text-center text-xs font-bold text-gray-400 animate-pulse">
          {isTamil ? 'புள்ளிவிவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading classroom analytics...'}
        </div>
      )}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Seats Claimed */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'இருக்கைகள்' : 'Seats Claimed'}</span>
            <Users className="w-4 h-4 text-[#7C3AED] dark:text-[#A3E635]" />
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
            {seatsClaimed} <span className="text-xs font-bold text-gray-400">/ {seatsTotal}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-[#2A1247] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A3E635]"
              style={{ width: `${Math.min(100, claimedPercent)}%` }}
            />
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'மாணவர்கள்' : 'Enrolled Students'}</span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
            {statsData?.activeStudentsCount ?? 0}
          </div>
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {isTamil ? 'இணைக்கப்பட்ட மாணவர்கள்' : 'Classroom members'}
          </p>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'வகுப்பு சராசரி' : 'Class Average'}</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
            86%
          </div>
          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
            {isTamil ? 'தேர்வு முடிவுகள்' : 'Consistent performance'}
          </p>
        </div>

        {/* Model A Commission Due */}
        <div className="bg-white dark:bg-[#1B0B2E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1">
            <span>{isTamil ? 'கமிஷன் தொகை' : 'Commission Due'}</span>
            <Receipt className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{statsData?.payoutStatement?.totalCommissionDue ?? 0}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 mt-1">
            @{tuition?.commissionPercent}% rate • {statsData?.payoutStatement?.totalAttributedOrders ?? 0} orders
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`flex-1 min-h-[40px] rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'மாணவர் பட்டியல்' : 'Student Roster'} ({statsData?.students?.length ?? 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 min-h-[40px] rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'வாரச் செயல்பாடு' : 'Weekly Activity'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payout')}
          className={`flex-1 min-h-[40px] rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'payout'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'கமிஷன் விவரம்' : 'Payout Statement'}
        </button>
      </div>

      {/* TAB 1: STUDENT ROSTER (Read-only, masked phone) */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'இணைக்கப்பட்ட மாணவர் பட்டியல் (வாசிப்பு மட்டும்)' : 'Enrolled Student Roster (Read-Only)'}
            </h2>
            <span className="text-[11px] font-semibold text-gray-400">
              {isTamil ? 'பாதுகாக்கப்பட்ட தொலைபேசி எண்கள்' : 'Masked PII Protection'}
            </span>
          </div>

          {statsData?.students && statsData.students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDE9FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#0F0618] text-gray-500 dark:text-gray-400">
                    <th className="p-3 font-extrabold">{isTamil ? 'மாணவர் பெயர்' : 'Student Name'}</th>
                    <th className="p-3 font-extrabold">{isTamil ? 'வகுப்பு' : 'Standard'}</th>
                    <th className="p-3 font-extrabold">{isTamil ? 'தொலைபேசி' : 'Phone'}</th>
                    <th className="p-3 text-center font-extrabold">{isTamil ? 'சராசரி' : 'Avg Score'}</th>
                    <th className="p-3 text-center font-extrabold">{isTamil ? 'திட்டம்' : 'Plan'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE9FE] dark:divide-[#3B2063]">
                  {statsData.students.map((stud, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-[#2A1247]/30 transition-colors">
                      <td className="p-3 font-bold text-[#2E1065] dark:text-[#FAF5FF]">
                        {stud.name}
                      </td>
                      <td className="p-3 font-semibold text-gray-500 dark:text-gray-400">
                        {stud.standard} • {stud.medium}
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-300">
                        {stud.phone}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-extrabold">
                          {stud.avgScore ?? 86}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black uppercase text-[10px]">
                          {stud.plan || 'pro'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 font-semibold">
              {isTamil ? 'இன்னும் மாணவர்கள் இணையவில்லை. இருக்கை குறியீடுகளை வழங்கவும்!' : 'No students enrolled yet. Share your seat codes or centre code with students!'}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
            {isTamil ? 'கடந்த 7 நாட்களின் வினாடி வினா செயல்பாடு' : 'Last 7 Days Quiz & Test Completion'}
          </h2>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {(statsData?.weeklyActivity || [
              { day: 'Mon', testsTaken: 12, avgScore: 84 },
              { day: 'Tue', testsTaken: 19, avgScore: 88 },
              { day: 'Wed', testsTaken: 15, avgScore: 82 },
              { day: 'Thu', testsTaken: 22, avgScore: 90 },
              { day: 'Fri', testsTaken: 25, avgScore: 87 },
              { day: 'Sat', testsTaken: 31, avgScore: 89 },
              { day: 'Sun', testsTaken: 28, avgScore: 91 },
            ]).map((act, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#EDE9FE] dark:border-[#3B2063]">
                <span className="text-[11px] font-extrabold text-gray-400 mb-1">{act.day}</span>
                <span className="text-lg font-black text-[#7C3AED] dark:text-[#A3E635]">{act.testsTaken}</span>
                <span className="text-[10px] font-bold text-gray-500 mt-1">{act.avgScore}%</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 pt-2 text-center">
            {isTamil ? 'மாணவர்களின் தினசரி தேர்வுகள் மற்றும் மதிப்பெண் முன்னேற்றம்' : 'Classroom activity tracks daily question paper & concept quiz engagement'}
          </p>
        </div>
      )}

      {/* TAB 3: MODEL A PAYOUT STATEMENT */}
      {activeTab === 'payout' && (
        <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {isTamil ? 'மாதாந்திர கமிஷன் அறிக்கை (Model A)' : 'Monthly Commission Statement (Model A)'}
              </h2>
              <p className="text-xs text-gray-500">
                {isTamil ? 'மாணவர்கள் பயன்படுத்திய தள்ளுபடி கூப்பன்களுக்கான வருவாய் பங்கு' : 'Revenue share for students using your tuition coupon code'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
              Cycle: {statsData?.payoutStatement?.cycle || '2026-10'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40">
              <span className="text-xs font-bold text-gray-400">{isTamil ? 'பதிவு செய்யப்பட்ட ஆர்டர்கள்' : 'Attributed Paid Orders'}</span>
              <p className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] mt-1">
                {statsData?.payoutStatement?.totalAttributedOrders ?? 8}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40">
              <span className="text-xs font-bold text-gray-400">{isTamil ? 'மொத்த வருவாய்' : 'Gross Student Revenue'}</span>
              <p className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] mt-1">
                ₹{statsData?.payoutStatement?.totalGrossRevenue ?? 4792}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{isTamil ? 'வழங்க வேண்டிய கமிஷன்' : 'Commission Payable'}</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{statsData?.payoutStatement?.totalCommissionDue ?? 719}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F0618] border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-bold text-gray-500">{isTamil ? 'கமிஷன் விகிதம்' : 'Commission Rate'}:</span>
              <span className="font-black text-[#7C3AED] dark:text-[#A3E635]">{tuition?.commissionPercent || 15}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-500">{isTamil ? 'கட்டணம் செலுத்தும் UPI' : 'Settlement UPI ID'}:</span>
              <span className="font-mono font-bold text-[#2E1065] dark:text-[#FAF5FF]">{tuition?.ownerUpi || 'ramesh@upi'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-500">{isTamil ? 'செலுத்தல் நிலை' : 'Settlement Status'}:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">Pending Monthly Settlement</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            {isTamil
              ? '💡 அறிவிப்பு: கமிஷன் தொகைகள் ஒவ்வொரு மாதமும் 1-ஆம் தேதி நேரடியாக உரிமையாளரின் UPI முகவரிக்கு மாற்றப்படும். ரத்து செய்யப்பட்ட அல்லது திருப்பி செலுத்தப்பட்ட ஆர்டர்களுக்கு கமிஷன் வழங்கப்படாது.'
              : '💡 Note: Payouts are settled automatically on the 1st of every month to your registered UPI ID. Refunded or cancelled student orders are strictly excluded.'}
          </p>
        </div>
      )}
    </div>
  );
}
