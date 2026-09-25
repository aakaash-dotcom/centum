'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { texts } from '@/data/texts';
import { normalizePhone } from '@/lib/phone';
import { AdminStats, AdminStudentRow } from '@/types';
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
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'content'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Screen 1: Founder Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanPhone = normalizePhone(adminPhone);
    if (!cleanPhone) {
      setAuthError('enter a valid 10-digit mobile number 📱');
      return;
    }

    if (!adminPassword) {
      setAuthError('password required 🔑');
      return;
    }

    try {
      setIsAuthenticating(true);
      const res = await fetch(
        `/api/login?phone=${encodeURIComponent(cleanPhone)}&password=${encodeURIComponent(adminPassword)}`
      );
      const data = await res.json();

      if (data.ok) {
        if (data.student?.isAdmin === true) {
          setAdminPhone(cleanPhone);
          setIsAuthenticated(true);
          // Load initial dashboard data using in-memory credentials in request body
          fetchStats(cleanPhone, adminPassword);
          fetchStudents(cleanPhone, adminPassword);
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

  // Data Call 1: Stats
  const fetchStats = async (phone = normalizePhone(adminPhone), pass = adminPassword) => {
    try {
      setIsLoadingData(true);
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

    if (newPassword.length < 6) {
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
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        // Update in-memory password so subsequent requests work without re-login
        setAdminPassword(newPassword);
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

          {/* 3 Dashboard Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635]">
                  Platform Telemetry
                </span>
                <button
                  type="button"
                  onClick={() => fetchStats()}
                  disabled={isLoadingData}
                  className="min-h-[34px] px-2.5 rounded-lg text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] bg-white dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center gap-1 hover:bg-[#FAF5FF] cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>refresh</span>
                </button>
              </div>

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
                      ₹{stats.revenueTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-[#3B0F6E] p-4 rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
                    <span className="text-[11px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 block">
                      {texts.admin.statsRevenueMonth}
                    </span>
                    <span className="text-2xl font-black text-[#16A34A] dark:text-[#86EFAC]">
                      ₹{stats.revenueThisMonth.toLocaleString('en-IN')}
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
        </div>
      )}
    </div>
  );
}
