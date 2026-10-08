'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  School,
  BookOpen,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  FileText,
  Clock,
  Bell,
  FlaskConical,
  Award,
  ChevronRight,
  Lock,
  ExternalLink,
  X,
  Copy,
  Check,
  BarChart3,
  Info,
  Users,
} from 'lucide-react';

interface DiaryEntry {
  id: string;
  tuitionCode: string;
  date: string;
  tag: 'homework' | 'notice' | 'exam' | string;
  text: string;
  createdAt: string;
}

interface ClassroomResponse {
  ok: boolean;
  joined: boolean;
  tuition?: {
    name: string;
    teacher: string;
    code: string;
  } | null;
  diary?: DiaryEntry[];
  myAttendance?: {
    pct30: number;
    lastDate?: string;
  } | null;
  preview?: {
    sampleTuition: {
      name: string;
      teacher: string;
      code: string;
    };
    sampleDiary: Array<{
      id: string;
      tag: string;
      text: string;
      date: string;
    }>;
    sampleAttendance: {
      pct30: number;
      lastDate: string;
    };
  };
}

export default function ClassroomPage() {
  const router = useRouter();
  const { student, medium } = useApp();

  // TASK VI: Initialize data from cache if present for instant rendering
  const [data, setData] = useState<ClassroomResponse | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('centum_last_classroom');
        if (cached) return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [seatInput, setSeatInput] = useState('');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  // TASK D: Guided Demo interactive states
  const [demoTab, setDemoTab] = useState<'info' | 'diary' | 'attendance' | 'stats'>('info');
  const [demoCopied, setDemoCopied] = useState(false);
  const [demoPerksExpanded, setDemoPerksExpanded] = useState(false);
  const [demoDiaryFilter, setDemoDiaryFilter] = useState<'all' | 'homework' | 'notice' | 'exam'>('all');
  const [demoActiveDiaryId, setDemoActiveDiaryId] = useState<string | null>(null);
  const [demoSelectedDay, setDemoSelectedDay] = useState<number | null>(null);
  const [demoStatsView, setDemoStatsView] = useState<'overview' | 'breakdown'>('overview');

  // TASK VI: Fetch student classroom data in parallel and swap seamlessly without blocking
  const fetchClassroom = async () => {
    try {
      const phoneParam = student?.phone ? encodeURIComponent(student.phone) : '';
      const res = await fetch(`/api/classroom?phone=${phoneParam}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (typeof window !== 'undefined') {
          if (json.joined && json.tuition) {
            localStorage.setItem('centum_last_classroom', JSON.stringify(json));
          } else {
            localStorage.removeItem('centum_last_classroom');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load classroom data', err);
    }
  };

  useEffect(() => {
    fetchClassroom();
  }, [student?.phone]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatInput.trim()) return;
    router.push(`/join?seat=${encodeURIComponent(seatInput.trim().toUpperCase())}`);
  };

  const isTamil = medium === 'tamil';

  const renderTagChip = (tag: string) => {
    switch (tag) {
      case 'homework':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span>📝</span>
            <span>{isTamil ? 'வீட்டுப்பாடம்' : 'Homework'}</span>
          </span>
        );
      case 'notice':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span>📢</span>
            <span>{isTamil ? 'அறிவிப்பு' : 'Notice'}</span>
          </span>
        );
      case 'exam':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span>🧪</span>
            <span>{isTamil ? 'தேர்வு / தேர்வுத் திட்டம்' : 'Exam & Test'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span>📌</span>
            <span>{tag}</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 pt-4 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {isTamil ? 'டியூஷன் வகுப்பறை' : 'Tuition Classroom'}
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Centum v2
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isTamil
                ? 'உங்கள் டியூஷன் நாள்குறிப்பு, வருகை & தேர்வு வழிகாட்டிகள்'
                : 'Your daily tuition diary, attendance & exclusive test guidance'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isTamil ? 'வகுப்பறை தகவல்களை ஏற்றுகிறது...' : 'Loading your classroom...'}
          </p>
        </div>
      ) : data?.joined && data.tuition ? (
        /* ==================== JOINED STATE ==================== */
        <div className="space-y-6 animate-fadeIn">
          {/* Tuition Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-5 sm:p-6 shadow-xl border border-emerald-500/30">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isTamil ? 'இணைக்கப்பட்ட மாணவர்' : 'Enrolled Student'}
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                  {data.tuition.name}
                </h2>
                <p className="text-sm text-emerald-200/90 flex items-center gap-1.5">
                  <span>👨‍🏫</span>
                  <span>{isTamil ? 'ஆசிரியர்:' : 'Teacher:'}</span>
                  <span className="font-semibold text-white">{data.tuition.teacher}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isTamil ? 'வகுப்பு குறியீடு' : 'Tuition Code'}
                  </span>
                  <span className="text-base font-black tracking-widest text-emerald-400 font-mono">
                    {data.tuition.code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats & Attendance Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* My Attendance Card */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>{isTamil ? 'எனது வருகைப்பதிவு' : 'My Attendance'}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isTamil ? 'கடந்த 30 நாட்கள்' : 'Last 30 Days'}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                    {data.myAttendance?.pct30 ?? 100}%
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {(data.myAttendance?.pct30 ?? 100) >= 80 ? '🌟 Excellent' : '⚡ Keep it up'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isTamil ? 'கடைசியாக பதிவு செய்யப்பட்ட தேதி: ' : 'Last marked date: '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {data.myAttendance?.lastDate || (isTamil ? 'இன்று' : 'Recent')}
                  </span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                {isTamil
                  ? '🎯 தொடர்ச்சியான வருகை உங்கள் பொதுத்தேர்வு மதிப்பெண்ணை உயர்த்தும்!'
                  : '🎯 Consistent attendance directly boosts your final board exam score!'}
              </div>
            </div>

            {/* Quick Quiz Stats Link */}
            <Link
              href="/profile"
              className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span>{isTamil ? 'எனது தேர்வு & தொடர் புள்ளிகள்' : 'My Quiz Stats & Streak'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {isTamil
                    ? 'உங்கள் தினசரி பயிற்சி வினாடி வினாக்கள், சராசரி மதிப்பெண்கள் மற்றும் சான்றிதழ்களைக் காணுங்கள்.'
                    : 'Track your daily quiz completions, chapter-wise accuracy and Centum streak coins.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>{isTamil ? 'சுயவிவரத்தில் பார்க்க' : 'View Full Performance'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Diary Feed */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isTamil ? 'வகுப்பறை நாள்குறிப்பு' : 'Classroom Diary Feed'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isTamil ? 'ஆசிரியரின் நேரடி அறிவிப்புகள் (புதியவை முதலில்)' : 'Direct notes & tasks from teacher (newest first)'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {data.diary?.length || 0} {isTamil ? 'பதிவுகள்' : 'entries'}
              </span>
            </div>

            {data.diary && data.diary.length > 0 ? (
              <div className="space-y-4">
                {data.diary.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        {renderTagChip(entry.tag)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{entry.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {isTamil ? 'நாள்குறிப்பு பதிவுகள் இல்லை' : 'No Diary Entries Yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {isTamil
                    ? 'உங்கள் ஆசிரியர் இன்னும் வீட்டுப்பாடம் அல்லது அறிவிப்புகளைப் பதிவிடவில்லை. அடுத்த வகுப்பிற்குப் பிறகு சரிபார்க்கவும்.'
                    : 'Your teacher has not posted any homework or announcements yet. Check back after your next class!'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== UNJOINED STATE (DISCOVERY / PREVIEW) ==================== */
        <div className="space-y-8 animate-fadeIn">
          {/* 3-Step Explainer */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="text-center max-w-lg mx-auto mb-6">
              <span className="text-xs uppercase tracking-widest font-black text-emerald-600 dark:text-emerald-400">
                {isTamil ? 'எளிய 3 படிகள்' : 'How It Works'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {isTamil
                  ? 'உங்கள் டியூஷன் வகுப்பறையை இணைப்பது எப்படி?'
                  : 'Connect Your Tuition in 3 Easy Steps'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {isTamil
                  ? 'உங்கள் ஆசிரியர் தரும் குறியீட்டை உள்ளிட்டு ஒரே இடத்தில் நாள்குறிப்பு மற்றும் வருகையைப் பெறுங்கள்.'
                  : 'Get daily homework diary, attendance tracking, and high-yield test prep all in one place.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-black text-base flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isTamil ? 'இருக்கை குறியீட்டைப் பெறுங்கள்' : 'Get Seat Code'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isTamil
                    ? 'உங்கள் டியூஷன் ஆசிரியரிடம் உங்கள் பிரத்யேக Centum இருக்கை குறியீட்டைக் கேளுங்கள்.'
                    : 'Ask your tuition teacher or master for your exclusive Centum seat code.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-black text-base flex items-center justify-center mb-3 shadow-md shadow-teal-500/20">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isTamil ? 'குறியீட்டை உள்ளிட்டு இணையுங்கள்' : 'Claim & Link Seat'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isTamil
                    ? 'குறியீட்டை உள்ளிட்டு ஒரே கிளிக்கில் உங்கள் கணக்கை டியூஷனுடன் இணைக்கவும்.'
                    : 'Enter the code to link your Centum student account directly with your tuition.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-black text-base flex items-center justify-center mb-3 shadow-md shadow-indigo-500/20">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {isTamil ? 'அனைத்தும் ஒரே இடத்தில்' : 'All In One Place'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isTamil
                    ? 'தினசரி வீட்டுப்பாடம், வருகை விவரம் & தேர்வுகளுக்கான சிறப்பு வினாக்கள் தயார்!'
                    : 'View daily homework notes, attendance reports & masterclass test sets anytime.'}
                </p>
              </div>
            </div>

            {/* Join Code Input Form */}
            <form onSubmit={handleJoinSubmit} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 max-w-md mx-auto">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                {isTamil ? 'உங்களிடம் டியூஷன் இருக்கை குறியீடு உள்ளதா?' : 'Have a Tuition Seat Code?'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isTamil ? 'எ.கா: APEX10-S01' : 'e.g. APEX10-S01'}
                  value={seatInput}
                  onChange={(e) => setSeatInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!seatInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                >
                  <span>{isTamil ? 'இணை' : 'Claim'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                {isTamil
                  ? 'குறியீட்டை உள்ளிட்டதும் உடனடியாக உங்கள் ப்ரோ அம்சங்கள் செயல்படும்.'
                  : 'Deep-links directly to seat activation with instant Pro validation.'}
              </p>
            </form>
          </div>

          {/* Blurred Sample Classroom Card Teaser */}
          <div className="relative rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header info */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {isTamil ? 'முன்னோட்டம்: மாதிரி வகுப்பறை' : 'Teaser Preview: Sample Classroom'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles className="w-3 h-3" />
                Premium Classroom
              </span>
            </div>

            {/* Blurred Teaser Content */}
            <div className="filter blur-[3px] select-none pointer-events-none opacity-60 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg">Apex Centum Academy</h4>
                  <p className="text-xs text-emerald-200">Teacher: Ramesh Kumar Sir · Code: DEMO10</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">93%</span>
                  <p className="text-[10px] text-slate-300">30-day Attendance</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                  <span className="font-bold text-blue-600">📝 Homework: </span>
                  Maths Chapter 1 Exercise 1.2 — Solve Question 1 to 5. Bring completed notebook tomorrow.
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                  <span className="font-bold text-amber-600">📢 Notice: </span>
                  Special revision masterclass this Saturday at 10:00 AM on Quadratic Equations.
                </div>
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                  <span className="font-bold text-purple-600">🧪 Exam: </span>
                  Unit Test 1 answer keys and high-yield scoring tricks uploaded to Pro Materials.
                </div>
              </div>
            </div>

            {/* Overlay Banner */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xl flex items-center justify-center mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white drop-shadow mb-1">
                {isTamil ? 'உங்கள் வகுப்பறை தகவல்களை அணுகுங்கள்' : 'Unlock Your Classroom Updates'}
              </h3>
              <p className="text-xs text-slate-200 max-w-sm drop-shadow mb-4">
                {isTamil
                  ? 'உங்கள் ஆசிரியர் வழங்கும் இருக்கை குறியீட்டைப் பெற்று இணைக்கவும்.'
                  : 'Claim your seat code provided by your tuition to unlock real-time diary notes & attendance.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDemoOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isTamil ? 'மாதிரி வகுப்பறையைக் காண்க' : 'View Demo Classroom'}</span>
                </button>
                <Link
                  href="/join"
                  className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>{isTamil ? 'இருக்கை குறியீட்டை உள்ளிடவும்' : 'Enter Seat Code'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Teacher CTA: Running a tuition? */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white p-5 sm:p-6 shadow-xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                👨‍🏫 {isTamil ? 'ஆசிரியர்களுக்கான பிரத்யேக வசதி' : 'For Tuition Teachers & Owners'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isTamil
                  ? 'டியூஷன் நடத்துகிறீர்களா? உங்கள் சொந்த வகுப்பறையைப் பெறுங்கள்!'
                  : 'Running a tuition? Get your own digital classroom!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                {isTamil
                  ? 'உங்கள் மாணவர்களுக்கான பிரத்யேக போர்டல், தினசரி வருகைப்பதிவு, டிஜிட்டல் நாள்குறிப்பு மற்றும் கட்டண பகிர்வு வசதியை உடனே தொடங்குங்கள்.'
                  : 'Empower your tuition with branded digital attendance, diary feeds, and exclusive board exam study materials.'}
              </p>
            </div>

            <a
              href="https://wa.me/918610653352?text=Hi%20Centum,%20I%20run%20a%20tuition%20centre%20and%20want%20to%20get%20my%20own%20digital%20classroom"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{isTamil ? 'வாட்ஸ்அப்பில் தொடர்புகொள்ள' : 'Chat with Founder'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* TASK D: Full-bleed interactive guided demo classroom */}
      {isDemoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Interactive Demo Classroom Preview"
          className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-slate-100 overflow-hidden animate-fade-in"
        >
          {/* Top Bar Header */}
          <div className="shrink-0 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-sm font-black shadow-xs">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Demo · DEMO10
                  </span>
                  <span className="text-xs font-black text-white">
                    {isTamil ? 'மாதிரி வகுப்பறை' : 'Classroom Demo'}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1">
                  {isTamil ? 'மாணவர்கள் அனுபவிக்கும் நேரடி வடிவம்' : 'Experience daily diary, attendance & stats'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDemoOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section Navigation Tabs: Class Info · Diary · Attendance · Stats */}
          <div className="shrink-0 px-3 py-2 bg-slate-900 border-b border-slate-800/80">
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <button
                type="button"
                data-testid="demo-tab-info"
                onClick={() => setDemoTab('info')}
                className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  demoTab === 'info'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🏫</span>
                <span className="truncate">Class Info</span>
              </button>

              <button
                type="button"
                data-testid="demo-tab-diary"
                onClick={() => setDemoTab('diary')}
                className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  demoTab === 'diary'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📖</span>
                <span className="truncate">Diary</span>
              </button>

              <button
                type="button"
                data-testid="demo-tab-attendance"
                onClick={() => setDemoTab('attendance')}
                className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  demoTab === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📅</span>
                <span className="truncate">Attendance</span>
              </button>

              <button
                type="button"
                data-testid="demo-tab-stats"
                onClick={() => setDemoTab('stats')}
                className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  demoTab === 'stats'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📊</span>
                <span className="truncate">Stats</span>
              </button>
            </div>
          </div>

          {/* Scrollable Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
            {/* TAB 1: Class Info */}
            {demoTab === 'info' && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Tuition Hero Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-5 shadow-xl border border-emerald-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Enrolled Classroom</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {data?.preview?.sampleTuition?.name || 'Apex Centum Academy'}
                      </h3>
                      <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-1.5">
                        <span>👨‍🏫</span>
                        <span>Teacher: <strong className="text-white">{data?.preview?.sampleTuition?.teacher || 'Ramesh Kumar Sir'}</strong> (M.Sc., B.Ed.)</span>
                      </p>
                    </div>

                    <div className="bg-slate-800/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 text-center self-start sm:self-auto min-w-[130px]">
                      <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                        Tuition Code
                      </span>
                      <span className="text-base font-black tracking-widest text-emerald-400 font-mono block my-0.5">
                        {data?.preview?.sampleTuition?.code || 'DEMO10'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(data?.preview?.sampleTuition?.code || 'DEMO10');
                          }
                          setDemoCopied(true);
                          setTimeout(() => setDemoCopied(false), 2000);
                        }}
                        className="w-full mt-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {demoCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{demoCopied ? 'Copied! ✓' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Batch & Schedule Card */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Batch Details
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Term
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard & Subject</span>
                      <span className="font-bold text-white mt-0.5 block">Class 10th · Maths & Science Centum Mastery</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Timings & Days</span>
                      <span className="font-bold text-white mt-0.5 block">Mon — Fri, 6:00 PM – 7:30 PM (Evening)</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Expander: Classroom Syllabus & Perks */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDemoPerksExpanded(!demoPerksExpanded)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white">
                        Classroom Perks & Syllabus Flow
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {demoPerksExpanded ? 'Hide ▲' : 'View Perks ▼'}
                    </span>
                  </button>

                  {demoPerksExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-800 text-xs space-y-2 text-slate-300 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Daily 15-minute formula recap & instant concept checking.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Personalized homework tracking & board exam answer writing drills.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Automatic WhatsApp parent notification on student attendance check-in.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Monthly Centum mock board examinations with district rank analysis.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Diary */}
            {demoTab === 'diary' && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Interactive Filter Chips */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Entries', icon: '📝' },
                    { id: 'homework', label: 'Homework', icon: '✍️' },
                    { id: 'notice', label: 'Notices', icon: '📢' },
                    { id: 'exam', label: 'Exams', icon: '🧪' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setDemoDiaryFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        demoDiaryFilter === filter.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-xs'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="mr-1">{filter.icon}</span>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>

                {/* Diary Entries Feed with Interactive Row Tap */}
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'd1',
                      tag: 'homework',
                      text: 'Maths Chapter 1 Exercise 1.2 — Solve Question 1 to 5. Bring completed notebook tomorrow.',
                      date: 'Today, 4:30 PM',
                      detail: 'Teacher Note: Show full Cartesian product step mappings. Important for 5-mark board question.',
                      status: 'Pending Submission',
                    },
                    {
                      id: 'd2',
                      tag: 'notice',
                      text: 'Special revision masterclass this Saturday at 10:00 AM on Quadratic Equations.',
                      date: 'Yesterday',
                      detail: 'Venue: Apex Academy Hall A. Carry your state board textbook and graph sheets.',
                      status: 'Mandatory Attendance',
                    },
                    {
                      id: 'd3',
                      tag: 'exam',
                      text: 'Unit Test 1 answer keys and high-yield scoring tricks uploaded to Pro Materials.',
                      date: '2 days ago',
                      detail: 'Review question #4 and #8 solution tricks. Average score: 22/25.',
                      status: 'Answer Key Live',
                    },
                    {
                      id: 'd4',
                      tag: 'homework',
                      text: 'Science Chapter 1 — Practice ray diagrams and Newton second law numericals.',
                      date: '3 days ago',
                      detail: 'Submit numerical workout sheet to Ramesh Sir before 6:15 PM.',
                      status: 'Completed ✓',
                    },
                  ]
                    .filter((item) => demoDiaryFilter === 'all' || item.tag === demoDiaryFilter)
                    .map((item) => {
                      const isExpanded = demoActiveDiaryId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setDemoActiveDiaryId(isExpanded ? null : item.id)}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            {renderTagChip(item.tag)}
                            <span className="text-[11px] font-medium text-slate-400">{item.date}</span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                            {item.text}
                          </p>

                          {/* Interactive Detail Drawer on Tap */}
                          {isExpanded ? (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 animate-fadeIn">
                              <p className="text-emerald-300 font-semibold">{item.detail}</p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                                <span className="text-slate-400">Status: <strong className="text-white">{item.status}</strong></span>
                                <span className="text-slate-500">Tap to collapse ▲</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end text-[10px] text-slate-500 font-bold">
                              <span>Tap for teacher notes & instructions ▼</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 3: Attendance */}
            {demoTab === 'attendance' && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Attendance Summary */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Classroom Attendance (Last 30 Days)</span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      🌟 Excellent
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 my-1">
                    <span className="text-4xl font-black text-emerald-400">93%</span>
                    <span className="text-xs text-slate-400 font-bold">28 of 30 Days Present</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-300 font-bold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                    <span>🔥</span>
                    <span>14 Days Continuous Active Streak! Centum Eligible.</span>
                  </div>
                </div>

                {/* Interactive 30-Day Mini Attendance Chips */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Tap a day chip to view check-in log:
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">30-Day Record</span>
                  </div>

                  {/* 30 Chips Grid */}
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: 30 }).map((_, idx) => {
                      const day = idx + 1;
                      const isLeave = day === 12 || day === 22;
                      const isSelected = demoSelectedDay === day;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDemoSelectedDay(day)}
                          className={`p-2 rounded-xl text-center text-xs font-black transition-all cursor-pointer border ${
                            isSelected
                              ? 'ring-2 ring-emerald-400 scale-105 shadow-md bg-emerald-500 text-slate-950 border-emerald-400'
                              : isLeave
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          }`}
                        >
                          <span className="block text-[10px] text-slate-400 font-normal">D{day}</span>
                          <span>{isLeave ? '—' : '✓'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Status Popover */}
                  {demoSelectedDay !== null ? (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between animate-fadeIn">
                      <div>
                        <span className="font-bold text-white">Day {demoSelectedDay}: </span>
                        {demoSelectedDay === 12 || demoSelectedDay === 22 ? (
                          <span className="text-amber-400 font-semibold">Excused Leave (Prior Notice Received)</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Present ✓ — Checked in at 6:05 PM</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDemoSelectedDay(null)}
                        className="text-[10px] text-slate-400 hover:text-white ml-2 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 text-center">
                      Tap any Day (D1–D30) above to inspect timestamp & verification details.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Stats */}
            {demoTab === 'stats' && (
              <div className="space-y-3.5 animate-fadeIn">
                {/* Seat Stats Bar */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Academy Seat Capacity
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      18 / 20 Seats Claimed (90%)
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: '90%' }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Only 2 Seats Remaining for this Batch</span>
                    <span className="text-emerald-400 font-bold">Fast Filling 🔥</span>
                  </p>
                </div>

                {/* Interactive Metric Switcher */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Performance Metrics</span>
                    <div className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setDemoStatsView('overview')}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                          demoStatsView === 'overview'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoStatsView('breakdown')}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer ${
                          demoStatsView === 'breakdown'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Subjects
                      </button>
                    </div>
                  </div>

                  {demoStatsView === 'overview' ? (
                    <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-xs text-slate-400 block font-bold">Class Average</span>
                        <span className="text-lg font-black text-emerald-400 block mt-1">88.5%</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-xs text-slate-400 block font-bold">Class Rank</span>
                        <span className="text-lg font-black text-teal-400 block mt-1">#3 / 18</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-xs text-slate-400 block font-bold">Tests Completed</span>
                        <span className="text-lg font-black text-amber-400 block mt-1">12</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {[
                        { subj: 'Mathematics', score: 92, rank: 'Top 5%' },
                        { subj: 'Science', score: 89, rank: 'Top 10%' },
                        { subj: 'Social Science', score: 85, rank: 'Top 15%' },
                      ].map((s) => (
                        <div
                          key={s.subj}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-white">{s.subj}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-black">{s.score}%</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{s.rank}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="shrink-0 p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 max-w-2xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href="/join"
              onClick={() => setIsDemoOpen(false)}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isTamil ? 'உங்கள் வகுப்பறையில் இணையவும் 🚀' : 'Join your classroom'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://wa.me/918610653352?text=Hi%20Centum,%20I%20saw%20the%20demo%20classroom%20and%20want%20to%20get%20my%20own%20tuition%20classroom"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-black border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTamil ? 'டியூஷன் நடத்துகிறீர்களா? உங்கள் சொந்தத்தைப் பெறுங்கள்' : 'Running a tuition? get yours 💬'}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
