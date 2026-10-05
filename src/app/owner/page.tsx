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
  BookOpen,
  Trash2,
  Clock,
  AlertTriangle,
  Send,
  UserCheck,
  UserX,
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

interface DiaryEntry {
  id: string;
  tuitionCode: string;
  date: string;
  tag: 'homework' | 'notice' | 'exam' | string;
  text: string;
  createdAt: string;
}

interface AttendanceStudentRow {
  name: string;
  phone: string;
  standard: string;
  medium: string;
  pct30: number;
  status: 'P' | 'A';
  note?: string;
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
  const [activeTab, setActiveTab] = useState<'roster' | 'diary' | 'attendance' | 'activity' | 'payout'>('roster');

  // Diary Tab State
  const [diaryList, setDiaryList] = useState<DiaryEntry[]>([]);
  const [isLoadingDiary, setIsLoadingDiary] = useState(false);
  const [diaryDate, setDiaryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [diaryTag, setDiaryTag] = useState<'homework' | 'notice' | 'exam'>('homework');
  const [diaryText, setDiaryText] = useState('');
  const [isPostingDiary, setIsPostingDiary] = useState(false);
  const [deletingDiaryId, setDeletingDiaryId] = useState<string | null>(null);

  // Attendance Tab State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRoster, setAttendanceRoster] = useState<AttendanceStudentRow[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

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
          fetchDiary(parsed.tuitionCode, parsed.ownerPhone);
          fetchAttendance(parsed.tuitionCode, parsed.ownerPhone, attendanceDate);
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

  const fetchDiary = async (code: string, phone: string) => {
    setIsLoadingDiary(true);
    try {
      const res = await fetch(`/api/owner-diary?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.diary) {
        setDiaryList(data.diary);
      }
    } catch (e) {
      console.error('Failed to load owner diary', e);
    } finally {
      setIsLoadingDiary(false);
    }
  };

  const fetchAttendance = async (code: string, phone: string, date: string) => {
    setIsLoadingAttendance(true);
    try {
      const res = await fetch(`/api/owner-attendance?code=${encodeURIComponent(code)}&ownerPhone=${encodeURIComponent(phone)}&date=${encodeURIComponent(date)}`);
      const data = await res.json();
      if (res.ok && data.ok && data.roster) {
        setAttendanceRoster(data.roster);
      }
    } catch (e) {
      console.error('Failed to load owner attendance', e);
    } finally {
      setIsLoadingAttendance(false);
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
      const res = await fetch('/api/tuition-owner-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: cleanPhone,
          tuitionCode: cleanCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStep('otp');
        showToast(isTamil ? 'சரிபார்ப்பு OTP அனுப்பப்பட்டது 📲' : 'Verification OTP sent 📲');
      } else {
        setErrorMsg(
          data.error === 'not-found'
            ? (isTamil ? 'இந்த குறியீட்டில் டியூஷன் மையம் காணப்படவில்லை' : 'No tuition found with this code')
            : (data.error || 'Failed to send OTP')
        );
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'OTP அனுப்புவதில் பிழை ஏற்பட்டது' : 'Network error sending OTP');
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

    if (!cleanOtp) {
      setErrorMsg(isTamil ? 'OTP எண்ணை உள்ளிடவும்' : 'Enter the 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/tuition-owner-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: cleanPhone,
          tuitionCode: cleanCode,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        sessionStorage.setItem(
          'centum_owner_session',
          JSON.stringify({ ownerPhone: cleanPhone, tuitionCode: cleanCode })
        );
        setStep('authenticated');
        showToast(isTamil ? 'உள்நுழைவு வெற்றிகரமாக முடிந்தது! 🎉' : 'Portal unlocked successfully! 🎉');
        fetchTuitionStats(cleanCode, cleanPhone);
        fetchDiary(cleanCode, cleanPhone);
        fetchAttendance(cleanCode, cleanPhone, attendanceDate);
      } else {
        setErrorMsg(data.error || (isTamil ? 'தவறான OTP' : 'Invalid OTP entered'));
      }
    } catch (e) {
      setErrorMsg(isTamil ? 'சரிபார்ப்பதில் பிழை ஏற்பட்டது' : 'Network error verifying OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('centum_owner_session');
    } catch (e) {}
    setStep('credentials');
    setStatsData(null);
    setOtp('');
    showToast(isTamil ? 'வெளியேற்றப்பட்டது' : 'Logged out');
  };

  // Diary Handlers
  const handlePostDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryText.trim() || isPostingDiary) return;
    if (diaryText.length > 500) {
      showToast(isTamil ? 'அதிகபட்சம் 500 எழுத்துக்கள் மட்டுமே அனுமதிக்கப்படும்' : 'Text must be 500 characters or less');
      return;
    }

    setIsPostingDiary(true);
    try {
      const res = await fetch('/api/owner-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ownerDiarySave',
          code: tuitionCode,
          ownerPhone,
          date: diaryDate,
          tag: diaryTag,
          text: diaryText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setDiaryText('');
        showToast(isTamil ? 'நாள்குறிப்பு பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது! 📝' : 'Diary entry published to classroom! 📝');
        fetchDiary(tuitionCode, ownerPhone);
      } else {
        showToast(data.error || 'Failed to post diary entry');
      }
    } catch (e) {
      showToast('Error posting diary');
    } finally {
      setIsPostingDiary(false);
    }
  };

  const handleDeleteDiary = async (id: string) => {
    if (!window.confirm(isTamil ? 'இந்த நாள்குறிப்பு பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this diary entry?')) {
      return;
    }

    setDeletingDiaryId(id);
    try {
      const res = await fetch('/api/owner-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ownerDiaryDelete',
          code: tuitionCode,
          ownerPhone,
          id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isTamil ? 'பதிவு நீக்கப்பட்டது 🗑️' : 'Diary entry deleted 🗑️');
        setDiaryList((prev) => prev.filter((item) => item.id !== id));
      } else {
        showToast(data.error || 'Failed to delete');
      }
    } catch (e) {
      showToast('Error deleting diary');
    } finally {
      setDeletingDiaryId(null);
    }
  };

  // Attendance Handlers
  const handleDateChange = (newDate: string) => {
    setAttendanceDate(newDate);
    fetchAttendance(tuitionCode, ownerPhone, newDate);
  };

  const handleStatusToggle = (phone: string, nextStatus: 'P' | 'A') => {
    setAttendanceRoster((prev) =>
      prev.map((row) => (row.phone === phone ? { ...row, status: nextStatus } : row))
    );
  };

  const handleSaveAttendance = async () => {
    if (isSavingAttendance) return;
    setIsSavingAttendance(true);

    try {
      const records = attendanceRoster.map((r) => ({
        phone: r.phone,
        status: r.status,
        note: '',
      }));

      const res = await fetch('/api/owner-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ownerAttendanceSave',
          code: tuitionCode,
          ownerPhone,
          date: attendanceDate,
          records,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        const pCount = records.filter((r) => r.status === 'P').length;
        const aCount = records.filter((r) => r.status === 'A').length;
        showToast(
          isTamil
            ? `வருகைப்பதிவு சேமிக்கப்பட்டது! (P: ${pCount}, A: ${aCount}) 💾`
            : `Attendance saved for ${attendanceDate}! (P: ${pCount}, A: ${aCount}) 💾`
        );
        fetchAttendance(tuitionCode, ownerPhone, attendanceDate);
      } else {
        showToast(data.error || 'Failed to save attendance');
      }
    } catch (e) {
      showToast('Error saving attendance');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // 1. AUTH / LOGIN VIEW
  if (step !== 'authenticated') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
        <div className="w-full bg-white dark:bg-[#1B0B2E] rounded-3xl p-6 sm:p-8 border border-[#EDE9FE] dark:border-[#3B2063] shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A3E635] text-white shadow-md">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'டியூஷன் உரிமையாளர் தளம்' : 'Tuition Owner Portal'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isTamil
                ? 'உங்கள் மாணவர் பட்டியல், வருகைப்பதிவு மற்றும் நாள்குறிப்பைக் கண்காணிக்கவும்'
                : 'Secure portal for tuition owners to track student roster, attendance & diary'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isTamil ? 'டியூஷன் மைய குறியீடு' : 'Tuition Centre Code'}
                </label>
                <input
                  type="text"
                  required
                  value={tuitionCode}
                  onChange={(e) => setTuitionCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX10"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isTamil ? 'பதிவுசெய்த மொபைல் எண்' : 'Registered Owner Mobile Number'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white font-black text-sm shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer"
              >
                {isSendingOtp ? (
                  <span>{isTamil ? 'OTP அனுப்பப்படுகிறது...' : 'Sending OTP...'}</span>
                ) : (
                  <>
                    <span>{isTamil ? 'OTP பெறுக' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#3B2063] text-xs text-gray-600 dark:text-gray-300">
                <span>{isTamil ? 'OTP அனுப்பப்பட்ட எண்: ' : 'Enter OTP sent to: '}</span>
                <span className="font-bold text-[#7C3AED] dark:text-[#A3E635]">+91 {ownerPhone}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 text-center">
                  {isTamil ? '6-இலக்க OTP' : '6-Digit OTP'}
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

  // 2. DASHBOARD VIEW
  const tuition = statsData?.tuition;
  const seatsTotal = statsData?.seatsTotal ?? 0;
  const seatsClaimed = statsData?.seatsClaimed ?? 0;
  const claimedPercent = seatsTotal > 0 ? Math.round((seatsClaimed / seatsTotal) * 100) : 0;

  const presentCount = attendanceRoster.filter((r) => r.status === 'P').length;
  const absentCount = attendanceRoster.filter((r) => r.status === 'A').length;
  const absentStudents = attendanceRoster.filter((r) => r.status === 'A');

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24 max-w-4xl mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
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

        {/* Commission Due */}
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
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'மாணவர் பட்டியல்' : 'Roster'} ({statsData?.students?.length ?? 0})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('diary');
            fetchDiary(tuitionCode, ownerPhone);
          }}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'diary'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          📝 {isTamil ? 'நாள்குறிப்பு' : 'Diary'}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('attendance');
            fetchAttendance(tuitionCode, ownerPhone, attendanceDate);
          }}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          📅 {isTamil ? 'வருகைப்பதிவு' : 'Attendance'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'வாரச் செயல்பாடு' : 'Activity'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payout')}
          className={`flex-1 min-w-[110px] min-h-[40px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'payout'
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A1247]'
          }`}
        >
          {isTamil ? 'கமிஷன்' : 'Payout'}
        </button>
      </div>

      {/* TAB 1: STUDENT ROSTER */}
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

      {/* TAB 2: DIARY (COMPOSER + OWN ENTRIES) */}
      {activeTab === 'diary' && (
        <div className="space-y-6">
          {/* Composer Card */}
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#7C3AED] dark:text-[#A3E635]" />
              <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {isTamil ? 'புதிய நாள்குறிப்பு பதிவு சேர்க்க' : 'Post to Classroom Diary'}
              </h2>
            </div>

            <form onSubmit={handlePostDiary} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date Picker (defaulting today) */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    {isTamil ? 'தேதி' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={diaryDate}
                    onChange={(e) => setDiaryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>

                {/* Tag Select */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    {isTamil ? 'வகை (Tag)' : 'Category Tag'}
                  </label>
                  <select
                    value={diaryTag}
                    onChange={(e) => setDiaryTag(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="homework">📝 {isTamil ? 'வீட்டுப்பாடம் (Homework)' : 'Homework'}</option>
                    <option value="notice">📢 {isTamil ? 'அறிவிப்பு (Notice)' : 'Notice'}</option>
                    <option value="exam">🧪 {isTamil ? 'தேர்வுத் திட்டம் (Exam)' : 'Exam'}</option>
                  </select>
                </div>
              </div>

              {/* Textarea <= 500 chars */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {isTamil ? 'செய்தி அல்லது வீட்டுப்பாட விவரம்' : 'Note Content'}
                  </label>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      diaryText.length > 500
                        ? 'text-rose-500'
                        : diaryText.length > 450
                        ? 'text-amber-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {diaryText.length}/500
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder={
                    isTamil
                      ? 'எ.கா: கணிதம் பாடம் 1 பயிற்சி 1.2 — 1 முதல் 5 வரையிலான வினாக்களை நோட்டுப்புத்தகத்தில் எழுதி வரவும்.'
                      : 'e.g. Maths Chapter 1 Exercise 1.2 — Solve questions 1 to 5. Bring completed notebook tomorrow.'
                  }
                  className="w-full p-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPostingDiary || !diaryText.trim() || diaryText.length > 500}
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-[#7C3AED]/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isPostingDiary
                      ? (isTamil ? 'பதிவேற்றப்படுகிறது...' : 'Posting...')
                      : (isTamil ? 'பதிவிடு 📝' : 'Publish to Students 📝')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Own Entries List */}
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {isTamil ? 'வெளியிடப்பட்ட நாள்குறிப்பு பதிவுகள்' : 'Published Diary Entries (Newest First)'}
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2A1247] text-gray-500">
                {diaryList.length} {isTamil ? 'பதிவுகள்' : 'entries'}
              </span>
            </div>

            {isLoadingDiary ? (
              <div className="py-8 text-center text-xs text-gray-400 font-bold animate-pulse">
                {isTamil ? 'நாள்குறிப்பு ஏற்றப்படுகிறது...' : 'Loading diary entries...'}
              </div>
            ) : diaryList.length > 0 ? (
              <div className="space-y-3">
                {diaryList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-[#230542]/40 border border-gray-100 dark:border-[#3B2063] flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        {entry.tag === 'homework' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📝 {isTamil ? 'வீட்டுப்பாடம்' : 'Homework'}
                          </span>
                        )}
                        {entry.tag === 'notice' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            📢 {isTamil ? 'அறிவிப்பு' : 'Notice'}
                          </span>
                        )}
                        {entry.tag === 'exam' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            🧪 {isTamil ? 'தேர்வு' : 'Exam'}
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-gray-500">
                          {entry.date}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed font-medium">
                        {entry.text}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={deletingDiaryId === entry.id}
                      onClick={() => handleDeleteDiary(entry.id)}
                      className="self-end sm:self-center p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={isTamil ? 'நீக்கு' : 'Delete Entry'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-gray-400 font-semibold">
                {isTamil ? 'இன்னும் நாள்குறிப்பு பதிவுகள் இல்லை. மேலே உள்ள படிவத்தைப் பயன்படுத்தி முதல் பதிவைச் சேர்க்கவும்!' : 'No diary entries yet. Use the composer above to post your first classroom note!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE (ROSTER TOGGLE + SUMMARY + SAVE) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {isTamil ? 'வருகைப்பதிவு தேதி' : 'Attendance Date'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#2A1247] hover:bg-gray-200 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    {isTamil ? 'இன்று' : 'Today'}
                  </button>
                </div>
              </div>

              {/* Summary Chip */}
              <div className="self-end pb-0.5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#3B2063] text-xs font-bold text-[#2E1065] dark:text-[#FAF5FF]">
                  <span className="text-emerald-600 dark:text-emerald-400">P: {presentCount}</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-rose-600 dark:text-rose-400">A: {absentCount}</span>
                  <span className="text-gray-400 font-normal">({attendanceRoster.length} total)</span>
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              disabled={isSavingAttendance || attendanceRoster.length === 0}
              onClick={handleSaveAttendance}
              className="px-6 py-2.5 rounded-2xl bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] disabled:opacity-50 text-[#18181B] font-black text-xs sm:text-sm shadow-md shadow-[#A3E635]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSavingAttendance
                  ? (isTamil ? 'சேமிக்கப்படுகிறது...' : 'Saving...')
                  : (isTamil ? 'வருகைப்பதிவைச் சேமி 💾' : 'Save Attendance 💾')}
              </span>
            </button>
          </div>

          {/* Absent Today Alert List */}
          {absentStudents.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black">
                  {isTamil
                    ? `இன்று விடுப்பு எடுத்தவர்கள் (${absentStudents.length})`
                    : `Absent on ${attendanceDate} (${absentStudents.length} students)`}
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {absentStudents.map((st, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-[11px] font-bold"
                    >
                      {st.name} ({st.standard})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="bg-white dark:bg-[#1B0B2E] rounded-3xl border border-[#EDE9FE] dark:border-[#3B2063] p-5 shadow-xs">
            {isLoadingAttendance ? (
              <div className="py-10 text-center text-xs text-gray-400 font-bold animate-pulse">
                {isTamil ? 'வருகைப்பட்டியல் ஏற்றப்படுகிறது...' : 'Loading attendance roster...'}
              </div>
            ) : attendanceRoster.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE9FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#0F0618] text-gray-500 dark:text-gray-400">
                      <th className="p-3 font-extrabold">{isTamil ? 'மாணவர் பெயர்' : 'Student Name'}</th>
                      <th className="p-3 font-extrabold">{isTamil ? 'வகுப்பு' : 'Standard'}</th>
                      <th className="p-3 font-extrabold">{isTamil ? 'தொலைபேசி' : 'Phone'}</th>
                      <th className="p-3 text-center font-extrabold">{isTamil ? '30-நாள் வருகை %' : '30-Day %'}</th>
                      <th className="p-3 text-center font-extrabold">{isTamil ? 'இன்றைய நிலை' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9FE] dark:divide-[#3B2063]">
                    {attendanceRoster.map((stud) => (
                      <tr key={stud.phone} className="hover:bg-gray-50/50 dark:hover:bg-[#2A1247]/30 transition-colors">
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
                          <span
                            className={`px-2 py-0.5 rounded-md font-extrabold ${
                              stud.pct30 >= 80
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : stud.pct30 >= 60
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {stud.pct30}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex rounded-xl bg-gray-100 dark:bg-[#230542] p-1 border border-gray-200 dark:border-[#3B2063]">
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(stud.phone, 'P')}
                              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                stud.status === 'P'
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600'
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(stud.phone, 'A')}
                              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                stud.status === 'A'
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-rose-600'
                              }`}
                            >
                              A
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-gray-400 font-semibold">
                {isTamil
                  ? 'மாணவர்கள் இன்னும் இணையவில்லை. இருக்கை குறியீடுகள் வழங்கப்பட்டதும் இங்கு வருகைப்பதிவு செய்யலாம்!'
                  : 'No claimed students found in this tuition yet. Attendance roster will appear once students claim seats!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WEEKLY ACTIVITY */}
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

      {/* TAB 5: MODEL A PAYOUT STATEMENT */}
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
