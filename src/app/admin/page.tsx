'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { texts } from '@/data/texts';
import { normalizePhone } from '@/lib/phone';
import { AdminStats, AdminStudentRow } from '@/types';
import { TN_DISTRICTS } from '@/data/districts';
import {
  ShieldAlert,
  BarChart3,
  Users,
  PlusCircle,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Crown,
  FileText,
  Building2,
  Ticket,
  Copy,
  Check,
  Flame,
  MessageSquare,
  Zap,
  TrendingUp,
  Trophy,
  Calendar,
} from 'lucide-react';

export default function AdminPage() {
  // Screen 1 Auth Credentials - In component memory ONLY (cleared on reload)
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Screen 2 State
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'classrooms' | 'content'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);

  interface FounderActiveStats {
    registeredTotal: number;
    registeredToday: number;
    registered7d: number;
    waOptedIn: number;
    active24h: number;
    active7d: number;
    byClass: Array<{ classLevel: string; registered: number; active7d: number }>;
    topStreaks: Array<{ name: string; phone: string; classLevel: string; streakDays: number }>;
  }
  const [founderStats, setFounderStats] = useState<FounderActiveStats | null>(null);

  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Classrooms Tab State
  interface AdminTuitionRow {
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
    seatsClaimed: number;
    studentsCount: number;
    active: boolean;
    createdAt: string;
  }
  const [classrooms, setClassrooms] = useState<AdminTuitionRow[]>([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const [showAddClassroomModal, setShowAddClassroomModal] = useState(false);
  const [classroomFormError, setClassroomFormError] = useState('');
  const [newTuitionCode, setNewTuitionCode] = useState('');
  const [newTuitionName, setNewTuitionName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerUpi, setNewOwnerUpi] = useState('');
  const [newDistrict, setNewDistrict] = useState('Chennai');
  const [newMode, setNewMode] = useState<'coupon' | 'seats'>('coupon');
  const [newDiscountPercent, setNewDiscountPercent] = useState('10');
  const [newCommissionPercent, setNewCommissionPercent] = useState('15');
  const [newInitialSeats, setNewInitialSeats] = useState('20');
  const [isSubmittingClassroom, setIsSubmittingClassroom] = useState(false);

  // Generate seats state
  const [selectedTuitionForSeats, setSelectedTuitionForSeats] = useState('');
  const [seatCountToGenerate, setSeatCountToGenerate] = useState(20);
  const [isGeneratingSeats, setIsGeneratingSeats] = useState(false);
  const [generatedSeatCodes, setGeneratedSeatCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Students Tab Filter
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'live'>('all');

  // Add Content Form State
  const [contentTab, setContentTab] = useState<'Papers' | 'News' | 'Questions'>('Papers');
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);
  const [contentFormError, setContentFormError] = useState('');

  // Paper form fields
  const [paperClass, setPaperClass] = useState('10th');
  const [paperCategory, setPaperCategory] = useState<'pyq' | 'model' | 'important' | 'book'>('pyq');
  const [paperSubject, setPaperSubject] = useState('');
  const [paperExam, setPaperExam] = useState('Public');
  const [paperYear, setPaperYear] = useState('2024');
  const [paperMedium, setPaperMedium] = useState<'tamil' | 'english'>('tamil');
  const [paperTitle, setPaperTitle] = useState('');
  const [paperDriveFileId, setPaperDriveFileId] = useState('');
  const [paperPlan, setPaperPlan] = useState<'free' | 'pro'>('free');

  // News form fields
  const [newsTitle, setNewsTitle] = useState('');
  const [newsDate, setNewsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newsCategory, setNewsCategory] = useState('Exams');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsSourceUrl, setNewsSourceUrl] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsPinned, setNewsPinned] = useState(false);

  // Questions form fields
  const [qClass, setQClass] = useState('10th');
  const [qSubject, setQSubject] = useState('');
  const [qChapter, setQChapter] = useState('');
  const [qType, setQType] = useState<'oneword' | 'concept' | 'daily'>('oneword');
  const [qText, setQText] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qOpt4, setQOpt4] = useState('');
  const [qAnswerIndex, setQAnswerIndex] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qMedium, setQMedium] = useState<'tamil' | 'english'>('tamil');
  const [qPlan, setQPlan] = useState<'free' | 'pro'>('free');

  // Settings: Change Admin Password
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  // Founder Diagnostics
  const [diagnostics, setDiagnostics] = useState<{
    source: string;
    papersCount: number;
    checkedTime: string;
  } | null>(null);

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/papers');
      const sourceHeader = res.headers.get('x-data-source');
      const data = await res.json();
      const count = Array.isArray(data?.papers) ? data.papers.length : 0;
      const src = data?.source || sourceHeader || (data?.ok ? 'live' : 'unknown');
      setDiagnostics({
        source: src,
        papersCount: count,
        checkedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (e) {
      setDiagnostics({
        source: 'live-failed',
        papersCount: 0,
        checkedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    }
  };

  // Screen 1: Founder Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanPhone = normalizePhone(adminPhone);
    if (!cleanPhone) {
      setAuthError('enter a valid 10-digit mobile number 📱');
      return;
    }

    const cleanPassword = adminPassword.trim();
    if (!cleanPassword) {
      setAuthError('password required 🔑');
      return;
    }

    try {
      setIsAuthenticating(true);
      const res = await fetch(
        `/api/login?phone=${encodeURIComponent(cleanPhone)}&password=${encodeURIComponent(cleanPassword)}`
      );
      const data = await res.json();

      if (data.ok) {
        if (data.student?.isAdmin === true) {
          setAdminPhone(cleanPhone);
          setAdminPassword(cleanPassword);
          setIsAuthenticated(true);
          // Load initial dashboard data using in-memory credentials in request body
          fetchStats(cleanPhone, cleanPassword);
          fetchFounderStats(cleanPhone, cleanPassword);
          fetchStudents(cleanPhone, cleanPassword);
          fetchClassrooms(cleanPhone, cleanPassword);
          fetchDiagnostics();
        } else {
          // Founder rejection rule: "this way is for the founder 🦉"
          setAuthError(texts.admin.notFounder);
        }
        return;
      }

      // Specific error copy per backend error
      if (data.error === 'no-account') {
        setAuthError('no account with this number 🐣');
      } else if (data.error === 'wrong-password') {
        setAuthError('wrong password, try again 🔑');
      } else {
        setAuthError(texts.admin.notFounder);
      }
    } catch (err) {
      setAuthError('network error, retry 👻');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Data Call: Founder Active Stats
  const fetchFounderStats = async (phone = normalizePhone(adminPhone), pass = adminPassword) => {
    try {
      const res = await fetch('/api/admin/founder-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: phone,
          adminPassword: pass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setFounderStats(data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch founder active stats');
    }
  };

  // Data Call 1: Stats
  const fetchStats = async (phone = normalizePhone(adminPhone), pass = adminPassword) => {
    try {
      setIsLoadingData(true);
      fetchFounderStats(phone, pass);
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: phone,
          adminPassword: pass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.stats) {
          setStats(data.stats);
        }
      } else if (res.status === 403) {
        setAuthError(texts.admin.notFounder);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Failed to fetch admin stats');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Data Call 2: Students
  const fetchStudents = async (phone = normalizePhone(adminPhone), pass = adminPassword) => {
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: phone,
          adminPassword: pass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.students) {
          setStudents(data.students);
        }
      } else if (res.status === 403) {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('Failed to fetch admin students');
    }
  };

  // Data Call: Classrooms
  const fetchClassrooms = async (phone = normalizePhone(adminPhone), pass = adminPassword) => {
    try {
      setIsLoadingClassrooms(true);
      const res = await fetch('/api/admin/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          adminPhone: phone,
          adminPassword: pass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.tuitions)) {
          setClassrooms(data.tuitions);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch classrooms');
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassroomFormError('');
    if (!newTuitionName.trim() || !newOwnerName.trim() || !newOwnerPhone.trim()) {
      setClassroomFormError('Tuition Name, Owner Name, and Owner Phone are required');
      return;
    }

    setIsSubmittingClassroom(true);
    try {
      const res = await fetch('/api/admin/classroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          adminPhone: normalizePhone(adminPhone) || adminPhone,
          adminPassword,
          code: newTuitionCode.trim().toUpperCase() || undefined,
          tuitionName: newTuitionName.trim(),
          ownerName: newOwnerName.trim(),
          ownerPhone: newOwnerPhone.trim(),
          ownerUpi: newOwnerUpi.trim(),
          district: newDistrict,
          mode: newMode,
          discountPercent: Number(newDiscountPercent) || 10,
          commissionPercent: Number(newCommissionPercent) || 15,
          seatsTotal: Number(newInitialSeats) || 20,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        triggerToast('Tuition centre added! 🎓');
        setShowAddClassroomModal(false);
        setNewTuitionCode('');
        setNewTuitionName('');
        setNewOwnerName('');
        setNewOwnerPhone('');
        setNewOwnerUpi('');
        fetchClassrooms();
      } else {
        setClassroomFormError(data.error || 'Failed to add tuition');
      }
    } catch (e) {
      setClassroomFormError('Network error adding tuition');
    } finally {
      setIsSubmittingClassroom(false);
    }
  };

  const handleGenerateSeats = async (tuitionCode: string, count: number) => {
    setIsGeneratingSeats(true);
    try {
      const res = await fetch('/api/admin/classroom/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: normalizePhone(adminPhone) || adminPhone,
          adminPassword,
          tuitionCode,
          count,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        triggerToast(`Generated ${count} seats for ${tuitionCode}! 🎫`);
        const codes = (data.seats || []).map((s: any) => s.seatCode);
        setGeneratedSeatCodes(codes);
        setSelectedTuitionForSeats(tuitionCode);
        fetchClassrooms();
      } else {
        triggerToast(data.error || 'Failed to generate seats');
      }
    } catch (e) {
      triggerToast('Network error generating seats');
    } finally {
      setIsGeneratingSeats(false);
    }
  };

  // Data Call 3: Add Material
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentFormError('');

    let rowData: Record<string, unknown> = {};

    if (contentTab === 'Papers') {
      if (!paperSubject.trim() || !paperTitle.trim() || !paperDriveFileId.trim()) {
        setContentFormError('Subject, Title, and Drive File ID are required');
        return;
      }
      rowData = {
        classLevel: paperClass,
        category: paperCategory,
        subject: paperSubject.trim(),
        exam: paperExam,
        year: paperYear,
        medium: paperMedium,
        title: paperTitle.trim(),
        driveFileId: paperDriveFileId.trim(),
        plan: paperPlan,
      };
    } else if (contentTab === 'News') {
      if (!newsTitle.trim() || !newsSummary.trim()) {
        setContentFormError('Title and Summary are required');
        return;
      }
      rowData = {
        title: newsTitle.trim(),
        date: newsDate,
        category: newsCategory,
        summary: newsSummary.trim(),
        body: newsBody.trim(),
        sourceUrl: newsSourceUrl.trim(),
        imageUrl: newsImageUrl.trim(),
        pinned: newsPinned,
      };
    } else if (contentTab === 'Questions') {
      if (!qSubject.trim() || !qText.trim() || !qOpt1.trim() || !qOpt2.trim()) {
        setContentFormError('Subject, Question, and at least 2 options are required');
        return;
      }
      const options = [qOpt1.trim(), qOpt2.trim()];
      if (qOpt3.trim()) options.push(qOpt3.trim());
      if (qOpt4.trim()) options.push(qOpt4.trim());

      rowData = {
        classLevel: qClass,
        subject: qSubject.trim(),
        chapter: qChapter.trim() || 'General',
        type: qType,
        question: qText.trim(),
        options: options,
        answerIndex: parseInt(qAnswerIndex, 10),
        explanation: qExplanation.trim(),
        medium: qMedium,
        plan: qPlan,
      };
    }

    try {
      setIsSubmittingContent(true);
      const res = await fetch('/api/admin/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: normalizePhone(adminPhone) || adminPhone,
          adminPassword,
          tab: contentTab,
          row: rowData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        triggerToast(texts.admin.contentAdded);
        fetchDiagnostics();
        // Reset inputs
        if (contentTab === 'Papers') {
          setPaperTitle('');
          setPaperDriveFileId('');
          setPaperSubject('');
        } else if (contentTab === 'News') {
          setNewsTitle('');
          setNewsSummary('');
          setNewsBody('');
        } else if (contentTab === 'Questions') {
          setQText('');
          setQOpt1('');
          setQOpt2('');
          setQOpt3('');
          setQOpt4('');
          setQExplanation('');
        }
      } else if (res.status === 403) {
        setContentFormError(texts.admin.notFounder);
      } else {
        setContentFormError(data.error || 'Failed to upload material');
      }
    } catch (err) {
      setContentFormError('network issue, try again 👻');
    } finally {
      setIsSubmittingContent(false);
    }
  };

  // Change Admin Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus('');

    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();

    if (cleanNew.length < 6) {
      setPasswordChangeStatus('new password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: normalizePhone(adminPhone) || adminPhone,
          oldPassword: cleanOld,
          newPassword: cleanNew,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        // Update in-memory password so subsequent requests work without re-login
        setAdminPassword(cleanNew);
        setOldPassword('');
        setNewPassword('');
        setShowPasswordChangeForm(false);
        triggerToast(texts.admin.passwordUpdated);
      } else {
        setPasswordChangeStatus('current password incorrect 💥');
      }
    } catch (err) {
      setPasswordChangeStatus('network glitch, retry 👻');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setAdminPhone('');
    setAdminPassword('');
    setIsAuthenticated(false);
    setStats(null);
    setStudents([]);
  };

  // Filter students by selected plan filter chip
  const filteredStudents = students.filter((s) => {
    if (planFilter === 'all') return true;
    return (s.plan || 'free').toLowerCase() === planFilter;
  });

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 max-w-md mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#FAF5FF]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#2E1065] text-[#FAF5FF] dark:bg-[#FAF5FF] dark:text-[#2E1065] text-xs font-black rounded-full shadow-xl flex items-center gap-1.5 animate-slide-down">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SCREEN 1: AUTHENTICATION */}
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col justify-center py-6">
          <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-6 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xl shadow-[#7C3AED]/10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] mb-3 shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-1">
              {texts.admin.authTitle}
            </h1>
            <p className="text-xs font-bold text-[#6D28D9]/70 dark:text-[#A3E635]/80 mb-5">
              {texts.admin.authSubtitle}
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-[#FEE2E2] dark:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] text-xs font-black rounded-xl text-center flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                  {texts.admin.phoneLabel}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-bold text-[#7C3AED] dark:text-[#A3E635]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder={texts.admin.phonePlaceholder}
                    className="w-full min-h-[48px] pl-12 pr-4 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] mb-1.5">
                  {texts.admin.passwordLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder={texts.admin.passwordPlaceholder}
                    className="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[#2E1065] dark:text-[#FAF5FF] text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1.5 text-[#6D28D9]/70 dark:text-[#A3E635] hover:text-[#7C3AED] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full min-h-[52px] mt-2 flex items-center justify-center font-black text-base text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-lg shadow-[#A3E635]/30 transition-all cursor-pointer"
              >
                {isAuthenticating ? texts.admin.loggingIn : texts.admin.loginBtn}
              </button>
            </form>

            <div className="mt-5 pt-3 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 hover:text-[#7C3AED] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>back to centum</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* SCREEN 2: FOUNDER DASHBOARD */
        <div className="space-y-4">
          {/* Top Bar with Founder Console Title and Logout */}
          <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE] dark:border-[#DDD6FE]/20">
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5">
                <span>{texts.admin.title}</span>
              </h1>
              <p className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#A3E635]">
                founder session verified ✨
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#6D28D9] dark:text-[#FAF5FF] hover:bg-[#FEE2E2] hover:text-[#991B1B] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{texts.admin.logout}</span>
            </button>
          </div>

          {/* 4 Dashboard Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{texts.admin.tabStats}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{texts.admin.tabStudents}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('classrooms');
                fetchClassrooms();
              }}
              className={`min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'classrooms'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Classrooms</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{texts.admin.tabContent}</span>
            </button>
          </div>

          {/* TAB 1: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Founder Live Active Metrics</span>
                  </span>
                  <p className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                    real-time active users & streak telemetry
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetchStats();
                    fetchFounderStats();
                  }}
                  disabled={isLoadingData}
                  className="min-h-[34px] px-2.5 rounded-lg text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center gap-1 hover:bg-[#FAF5FF] cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>refresh</span>
                </button>
              </div>

              {/* FOUNDER STATS: 5 LIVE CARDS */}
              {founderStats ? (
                <div className="space-y-3">
                  {/* Row 1: Registered Students & WhatsApp Opt-In */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card 1: Registered Students (Total, + today, + 7d) */}
                    <div className="bg-gradient-to-br from-[#FAF5FF] to-white dark:from-[#3B0F6E] dark:to-[#230542] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs relative overflow-hidden">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#DDD6FE]/80 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A3E635]" />
                          <span>Registered Students</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#86EFAC]">
                            +{founderStats.registeredToday} today
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F3E8FF] text-[#6B21A8] dark:bg-[#581C87] dark:text-[#E9D5FF]">
                            +{founderStats.registered7d} 7d
                          </span>
                        </div>
                      </div>
                      <div className="text-3xl font-black tracking-tight text-[#2E1065] dark:text-[#FAF5FF]">
                        {founderStats.registeredTotal.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/60 mt-1">
                        Active Tamil Nadu student accounts in database
                      </p>
                    </div>

                    {/* Card 2: WhatsApp Opted-In Count */}
                    <div className="bg-gradient-to-br from-[#F0FDF4] to-white dark:from-[#14532D]/40 dark:to-[#230542] p-4 rounded-2xl border border-[#BBF7D0] dark:border-[#22C55E]/20 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#166534] dark:text-[#86EFAC] flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#22C55E]" />
                          <span>WhatsApp Opt-In</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#86EFAC]">
                          {Math.round((founderStats.waOptedIn / (founderStats.registeredTotal || 1)) * 100)}% opt-in
                        </span>
                      </div>
                      <div className="text-3xl font-black tracking-tight text-[#166534] dark:text-[#86EFAC]">
                        {founderStats.waOptedIn.toLocaleString('en-IN')}
                      </div>
                      <p className="text-[11px] font-bold text-[#166534]/70 dark:text-[#86EFAC]/70 mt-1">
                        Verified student mobile numbers receiving daily alerts
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Active in last 24h & Active in last 7d (>= 1 score row in Scores) */}
                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Active Quiz & Test Takers (Logged Scores)</span>
                      </span>
                      <span className="text-[10px] font-black text-[#6D28D9]/70 dark:text-[#DDD6FE]/60">
                        active = ≥1 test in Scores
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-[#FAF5FF] dark:bg-[#230542] rounded-xl border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10">
                        <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block mb-0.5">
                          Active in last 24h ⚡
                        </span>
                        <span className="text-2xl font-black text-[#7C3AED] dark:text-[#A3E635]">
                          {founderStats.active24h.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/50 block mt-0.5">
                          distinct students today
                        </span>
                      </div>

                      <div className="p-3 bg-[#FAF5FF] dark:bg-[#230542] rounded-xl border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10">
                        <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block mb-0.5">
                          Active in last 7d 📅
                        </span>
                        <span className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                          {founderStats.active7d.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/50 block mt-0.5">
                          {Math.round((founderStats.active7d / (founderStats.registeredTotal || 1)) * 100)}% weekly active rate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Per-class breakdown (6..12) of registered vs active7d */}
                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Per-Class Breakdown (Class 6 to 12)</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/60">
                        Registered vs Active 7d
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {founderStats.byClass.map((c) => {
                        const ratio = c.registered > 0 ? Math.round((c.active7d / c.registered) * 100) : 0;
                        return (
                          <div key={c.classLevel} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-6 font-black text-[#7C3AED] dark:text-[#A3E635]">
                                  {c.classLevel}th
                                </span>
                                <span className="text-[#2E1065] dark:text-[#FAF5FF]">
                                  {c.registered} students
                                </span>
                              </span>
                              <span className="text-[11px] font-black text-[#16A34A] dark:text-[#86EFAC]">
                                {c.active7d} active ({ratio}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#EDE9FE] dark:bg-[#230542] rounded-full h-2 overflow-hidden flex">
                              <div
                                className="bg-[#7C3AED] dark:bg-[#A3E635] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(ratio, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 5: Top-10 streak leaderboard (phone masked · name, class, streak days) */}
                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635] flex items-center gap-1">
                        <Flame className="w-4 h-4 text-[#F97316]" />
                        <span>Top 10 Consecutive Streak Leaders</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#C2410C] dark:bg-[#7C2D12] dark:text-[#FDBA74]">
                        Daily Quiz Streaks
                      </span>
                    </div>

                    <div className="divide-y divide-[#EDE9FE] dark:divide-[#DDD6FE]/10">
                      {founderStats.topStreaks.map((item, idx) => (
                        <div
                          key={idx}
                          className="py-2 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                                idx === 0
                                  ? 'bg-[#FEF08A] text-[#854D0E]'
                                  : idx === 1
                                  ? 'bg-[#E2E8F0] text-[#334155]'
                                  : idx === 2
                                  ? 'bg-[#FED7AA] text-[#9A3412]'
                                  : 'bg-[#F3E8FF] dark:bg-[#230542] text-[#6D28D9] dark:text-[#DDD6FE]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
                                <span>{item.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40 text-[#6D28D9] dark:text-[#A3E635]">
                                  {item.classLevel}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#6D28D9]/60 dark:text-[#DDD6FE]/50">
                                {item.phone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 font-black text-sm text-[#EA580C] dark:text-[#FB923C]">
                            <Flame className="w-3.5 h-3.5 fill-[#EA580C] text-[#EA580C]" />
                            <span>{item.streakDays}d</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-center text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                  Loading active users & streak telemetry... ⚡
                </div>
              )}

              {/* SECONDARY STATS: REVENUE & PLATFORM METRICS */}
              <div className="pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] block px-1 mb-2">
                  Subscription & Financial Telemetry
                </span>

              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsStudents}
                    </span>
                    <span className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                      {stats.studentsTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsPro} 👑
                    </span>
                    <span className="text-2xl font-black text-[#7C3AED] dark:text-[#A3E635]">
                      {stats.proTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsLive} 🎥
                    </span>
                    <span className="text-2xl font-black text-[#EC4899] dark:text-[#F472B6]">
                      {stats.liveTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsTests}
                    </span>
                    <span className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                      {stats.testsTaken.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsRevenue}
                    </span>
                    <span className="text-2xl font-black text-[#16A34A] dark:text-[#86EFAC]">
                      INR {stats.revenueTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsRevenueMonth}
                    </span>
                    <span className="text-2xl font-black text-[#16A34A] dark:text-[#86EFAC]">
                      INR {stats.revenueThisMonth.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsPayments}
                    </span>
                    <span className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF]">
                      {stats.paymentsCount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsCoupons}
                    </span>
                    <span className="text-2xl font-black text-[#7C3AED] dark:text-[#A3E635]">
                      {stats.couponsUsed.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                  loading telemetry... ⚡
                </div>
              )}
            </div>
          </div>
        )}

          {/* TAB 2: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-3">
              {/* Plan Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {(['all', 'free', 'pro', 'live'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPlanFilter(filter)}
                    className={`min-h-[38px] px-3.5 rounded-full text-xs font-extrabold capitalize transition-all cursor-pointer ${
                      planFilter === filter
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-white dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE] border border-[#DDD6FE] dark:border-[#DDD6FE]/20'
                    }`}
                  >
                    {filter === 'all' ? texts.admin.filterAll : filter}
                  </button>
                ))}
              </div>

              {/* Masked Students List / Table */}
              <div className="space-y-2.5">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#3B0F6E] rounded-2xl p-3.5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">
                            {st.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full ${
                              (st.plan || 'free').toLowerCase() === 'pro'
                                ? 'bg-[#7C3AED] text-white'
                                : (st.plan || 'free').toLowerCase() === 'live'
                                ? 'bg-[#EC4899] text-white'
                                : 'bg-[#FAF5FF] dark:bg-[#230542] text-[#6D28D9] dark:text-[#DDD6FE] border border-[#DDD6FE]/40'
                            }`}
                          >
                            {st.plan || 'free'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                          <span>{st.phone}</span>
                          <span>•</span>
                          <span>{st.standard}</span>
                          {st.stream && st.stream !== '—' && (
                            <>
                              <span>•</span>
                              <span>{st.stream}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{st.medium}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60 shrink-0 pl-2">
                        {st.joined}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs font-bold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60 bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                    {texts.admin.emptyStudents}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CLASSROOMS */}
          {activeTab === 'classrooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635]">
                  Tuition Classrooms ({classrooms.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddClassroomModal(!showAddClassroomModal)}
                    className="min-h-[34px] px-2.5 rounded-lg text-xs font-black text-white bg-[#7C3AED] hover:bg-[#6D28D9] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{showAddClassroomModal ? 'Cancel' : 'Add Centre'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchClassrooms()}
                    disabled={isLoadingClassrooms}
                    className="min-h-[34px] px-2 rounded-lg text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center gap-1 hover:bg-[#FAF5FF] cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingClassrooms ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Add Tuition Centre Form */}
              {showAddClassroomModal && (
                <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border-2 border-[#7C3AED]/30 shadow-md animate-slide-down space-y-3">
                  <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#7C3AED] dark:text-[#A3E635]" />
                    <span>Register New Tuition Centre</span>
                  </h3>

                  {classroomFormError && (
                    <div className="p-2.5 bg-[#FEE2E2] dark:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] text-xs font-bold rounded-xl text-center">
                      {classroomFormError}
                    </div>
                  )}

                  <form onSubmit={handleAddClassroom} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Centre Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTuitionCode}
                          onChange={(e) => setNewTuitionCode(e.target.value.toUpperCase())}
                          placeholder="e.g. APEX20"
                          className="w-full min-h-[40px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-black uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          District
                        </label>
                        <select
                          value={newDistrict}
                          onChange={(e) => setNewDistrict(e.target.value)}
                          className="w-full min-h-[40px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          {TN_DISTRICTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Tuition Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTuitionName}
                        onChange={(e) => setNewTuitionName(e.target.value)}
                        placeholder="e.g. Apex Centum Academy"
                        className="w-full min-h-[40px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Owner Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full min-h-[40px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Owner Mobile *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={newOwnerPhone}
                          onChange={(e) => setNewOwnerPhone(e.target.value)}
                          placeholder="9840123456"
                          className="w-full min-h-[40px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Owner UPI ID (for Model A payouts)
                      </label>
                      <input
                        type="text"
                        value={newOwnerUpi}
                        onChange={(e) => setNewOwnerUpi(e.target.value)}
                        placeholder="ramesh@oksbi"
                        className="w-full min-h-[40px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Mode
                        </label>
                        <select
                          value={newMode}
                          onChange={(e) => setNewMode(e.target.value as any)}
                          className="w-full min-h-[38px] px-1 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-[11px] font-bold"
                        >
                          <option value="coupon">Coupon</option>
                          <option value="seats">Seats</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Discount %
                        </label>
                        <input
                          type="number"
                          value={newDiscountPercent}
                          onChange={(e) => setNewDiscountPercent(e.target.value)}
                          className="w-full min-h-[38px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Comm %
                        </label>
                        <input
                          type="number"
                          value={newCommissionPercent}
                          onChange={(e) => setNewCommissionPercent(e.target.value)}
                          className="w-full min-h-[38px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Seats
                        </label>
                        <input
                          type="number"
                          value={newInitialSeats}
                          onChange={(e) => setNewInitialSeats(e.target.value)}
                          className="w-full min-h-[38px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingClassroom}
                      className="w-full min-h-[46px] rounded-xl bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] font-black text-xs transition-all cursor-pointer shadow-xs"
                    >
                      {isSubmittingClassroom ? 'Saving Centre...' : 'Save Tuition Centre ✨'}
                    </button>
                  </form>
                </div>
              )}

              {/* Generated Seat Codes Banner if any */}
              {generatedSeatCodes.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 animate-fade-in space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                      Generated {generatedSeatCodes.length} Seat Codes for {selectedTuitionForSeats}:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedSeatCodes.join('\n'));
                        setCopiedCodes(true);
                        setTimeout(() => setCopiedCodes(false), 2000);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-400 text-amber-950 font-black text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCodes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCodes ? 'Copied!' : 'Copy All'}</span>
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto bg-white/80 dark:bg-black/40 rounded-xl p-2 font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-1">
                    {generatedSeatCodes.map((code) => (
                      <span key={code} className="text-amber-900 dark:text-amber-200 select-all">{code}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Classrooms Rollup Table / Cards */}
              {classrooms.length > 0 ? (
                <div className="space-y-3">
                  {classrooms.map((t) => (
                    <div
                      key={t.code}
                      className="bg-white dark:bg-[#3B0F6E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF]">{t.tuitionName}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A3E635] font-black text-[10px] uppercase">
                              {t.code}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                            {t.ownerName} • {t.ownerPhone} • {t.district}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase border border-emerald-300">
                          {t.mode}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">Seats</span>
                          <span className="font-black text-[#2E1065] dark:text-[#FAF5FF]">
                            {t.seatsClaimed} / {t.seatsTotal}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">Students</span>
                          <span className="font-black text-[#7C3AED] dark:text-[#A3E635]">{t.studentsCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">Economics</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {t.discountPercent}% off / {t.commissionPercent}% com
                          </span>
                        </div>
                      </div>

                      {/* Generate Seat Codes (10 / 20 / 50) */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
                        <span className="text-[11px] font-bold text-gray-400">Quick Generate:</span>
                        <div className="flex items-center gap-1.5">
                          {[10, 20, 50].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              disabled={isGeneratingSeats}
                              onClick={() => handleGenerateSeats(t.code, cnt)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#2A1247] hover:bg-[#7C3AED] hover:text-white text-xs font-black transition-colors cursor-pointer"
                            >
                              +{cnt} seats
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-8 text-center text-xs text-gray-400 border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                  {isLoadingClassrooms ? 'Loading tuition centres...' : 'No tuition centres registered yet. Click "Add Centre" above!'}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD CONTENT */}
          {activeTab === 'content' && (
            <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wide">
                  {texts.admin.addContentTitle}
                </h2>

                {/* Section Selector */}
                <div className="inline-flex p-1 bg-[#FAF5FF] dark:bg-[#230542] rounded-xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20">
                  {(['Papers', 'News', 'Questions'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setContentTab(tab)}
                      className={`min-h-[32px] px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        contentTab === tab
                          ? 'bg-[#7C3AED] text-white shadow-xs'
                          : 'text-[#6D28D9] dark:text-[#DDD6FE]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {contentFormError && (
                <div className="p-2.5 bg-[#FEE2E2] dark:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] text-xs font-bold rounded-xl text-center">
                  {contentFormError}
                </div>
              )}

              <form onSubmit={handleMaterialSubmit} className="space-y-3.5">
                {/* 1. PAPERS DYNAMIC FORM */}
                {contentTab === 'Papers' && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Standard
                        </label>
                        <select
                          value={paperClass}
                          onChange={(e) => setPaperClass(e.target.value)}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          {['6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Category
                        </label>
                        <select
                          value={paperCategory}
                          onChange={(e) => setPaperCategory(e.target.value as any)}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="pyq">previous year questions</option>
                          <option value="model">model question papers</option>
                          <option value="important">study materials</option>
                          <option value="book">text books</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          required
                          value={paperSubject}
                          onChange={(e) => setPaperSubject(e.target.value)}
                          placeholder="e.g. Maths"
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Exam
                        </label>
                        <select
                          value={paperExam}
                          onChange={(e) => setPaperExam(e.target.value)}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="Public">Public</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Half-Yearly">Half-Yearly</option>
                          <option value="Revision 1">Revision 1</option>
                          <option value="Revision 2">Revision 2</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Year
                        </label>
                        <input
                          type="text"
                          value={paperYear}
                          onChange={(e) => setPaperYear(e.target.value)}
                          className="w-full min-h-[44px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Medium
                        </label>
                        <select
                          value={paperMedium}
                          onChange={(e) => setPaperMedium(e.target.value as any)}
                          className="w-full min-h-[44px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="tamil">Tamil</option>
                          <option value="english">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Plan
                        </label>
                        <select
                          value={paperPlan}
                          onChange={(e) => setPaperPlan(e.target.value as any)}
                          className="w-full min-h-[44px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="free">free</option>
                          <option value="pro">pro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        placeholder="e.g. 10th Maths Public Exam 2024 Paper"
                        className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Drive File ID / URL *
                      </label>
                      <input
                        type="text"
                        required
                        value={paperDriveFileId}
                        onChange={(e) => setPaperDriveFileId(e.target.value)}
                        placeholder="Google Drive file ID or link"
                        className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                      />
                    </div>
                  </>
                )}

                {/* 2. NEWS DYNAMIC FORM */}
                {contentTab === 'News' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        placeholder="News headline"
                        className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={newsDate}
                          onChange={(e) => setNewsDate(e.target.value)}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newsCategory}
                          onChange={(e) => setNewsCategory(e.target.value)}
                          placeholder="e.g. Exams"
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Summary *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={newsSummary}
                        onChange={(e) => setNewsSummary(e.target.value)}
                        placeholder="Short summary for preview"
                        className="w-full p-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Full Body
                      </label>
                      <textarea
                        rows={3}
                        value={newsBody}
                        onChange={(e) => setNewsBody(e.target.value)}
                        placeholder="Detailed body text"
                        className="w-full p-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Source URL
                        </label>
                        <input
                          type="url"
                          value={newsSourceUrl}
                          onChange={(e) => setNewsSourceUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newsPinned}
                            onChange={(e) => setNewsPinned(e.target.checked)}
                            className="w-4 h-4 rounded text-[#7C3AED]"
                          />
                          <span>Pin to top 📌</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. QUESTIONS DYNAMIC FORM */}
                {contentTab === 'Questions' && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Class
                        </label>
                        <select
                          value={qClass}
                          onChange={(e) => setQClass(e.target.value)}
                          className="w-full min-h-[44px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          {['10th', '12th', '11th', '9th', '8th'].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          required
                          value={qSubject}
                          onChange={(e) => setQSubject(e.target.value)}
                          placeholder="e.g. Science"
                          className="w-full min-h-[44px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Chapter
                        </label>
                        <input
                          type="text"
                          value={qChapter}
                          onChange={(e) => setQChapter(e.target.value)}
                          placeholder="e.g. Optics"
                          className="w-full min-h-[44px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Question *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="Write question here..."
                        className="w-full p-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Option 1 (Index 0) *
                        </label>
                        <input
                          type="text"
                          required
                          value={qOpt1}
                          onChange={(e) => setQOpt1(e.target.value)}
                          className="w-full min-h-[40px] px-2.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Option 2 (Index 1) *
                        </label>
                        <input
                          type="text"
                          required
                          value={qOpt2}
                          onChange={(e) => setQOpt2(e.target.value)}
                          className="w-full min-h-[40px] px-2.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Option 3 (Index 2)
                        </label>
                        <input
                          type="text"
                          value={qOpt3}
                          onChange={(e) => setQOpt3(e.target.value)}
                          className="w-full min-h-[40px] px-2.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Option 4 (Index 3)
                        </label>
                        <input
                          type="text"
                          value={qOpt4}
                          onChange={(e) => setQOpt4(e.target.value)}
                          className="w-full min-h-[40px] px-2.5 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Correct Answer
                        </label>
                        <select
                          value={qAnswerIndex}
                          onChange={(e) => setQAnswerIndex(e.target.value)}
                          className="w-full min-h-[40px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="0">Option 1</option>
                          <option value="1">Option 2</option>
                          <option value="2">Option 3</option>
                          <option value="3">Option 4</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Medium
                        </label>
                        <select
                          value={qMedium}
                          onChange={(e) => setQMedium(e.target.value as any)}
                          className="w-full min-h-[40px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="tamil">Tamil</option>
                          <option value="english">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                          Plan
                        </label>
                        <select
                          value={qPlan}
                          onChange={(e) => setQPlan(e.target.value as any)}
                          className="w-full min-h-[40px] px-2 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                        >
                          <option value="free">free</option>
                          <option value="pro">pro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                        Explanation
                      </label>
                      <input
                        type="text"
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        placeholder="Solution explanation"
                        className="w-full min-h-[40px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingContent}
                  className="w-full min-h-[50px] mt-2 flex items-center justify-center font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] active:scale-[0.98] rounded-2xl shadow-md shadow-[#A3E635]/25 transition-all cursor-pointer"
                >
                  {isSubmittingContent ? texts.admin.publishing : texts.admin.publishBtn}
                </button>
              </form>
            </div>
          )}

          {/* SETTINGS ROW: CHANGE ADMIN PASSWORD */}
          <div className="bg-white dark:bg-[#3B0F6E] rounded-3xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635]">
                  {texts.admin.settingsTitle}
                </h3>
                <p className="text-[11px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                  founder security controls
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordChangeForm(!showPasswordChangeForm)}
                className="min-h-[36px] px-3 rounded-xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] text-xs font-bold hover:bg-[#F3E8FF] transition-all cursor-pointer"
              >
                {texts.admin.changePassword}
              </button>
            </div>

            {showPasswordChangeForm && (
              <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-[#FAF5FF] dark:border-[#230542] space-y-3">
                {passwordChangeStatus && (
                  <div className="p-2.5 bg-[#FEE2E2] dark:bg-[#991B1B]/40 border border-[#FCA5A5] dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] text-xs font-bold rounded-xl text-center">
                    {passwordChangeStatus}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                    {texts.admin.oldPasswordLabel}
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6D28D9] dark:text-[#A3E635] mb-1">
                    {texts.admin.newPasswordLabel}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="min 6 characters"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[#DDD6FE] dark:border-[#DDD6FE]/20 bg-[#FAF5FF] dark:bg-[#230542] text-xs font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full min-h-[46px] font-black text-xs text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isChangingPassword ? 'updating... ⏳' : texts.admin.savePasswordBtn}
                </button>
              </form>
            )}
          </div>

          {/* Founder Diagnostics Footer Strip */}
          {diagnostics && (
            <div className="pt-4 pb-2 text-center border-t border-[#EDE9FE] dark:border-[#DDD6FE]/15">
              <p className="text-[11px] font-mono font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                data: <span className={diagnostics.source === 'live' ? 'text-[#16A34A] dark:text-[#4ADE80] font-black' : 'text-[#DC2626] font-black'}>{diagnostics.source}</span> • papers: {diagnostics.papersCount} • checked {diagnostics.checkedTime}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
