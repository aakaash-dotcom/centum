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
  Clock,
  ChevronRight,
  ExternalLink,
  X,
  Sun,
  Moon,
  ArrowLeft,
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
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [seatInput, setSeatInput] = useState('');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  // Redesigned Student Demo states
  const [demoTheme, setDemoTheme] = useState<'light' | 'dark'>('light');
  const [demoView, setDemoView] = useState<'dashboard' | 'diary' | 'attendance' | 'performance'>('dashboard');
  const [demoDiaryFilter, setDemoDiaryFilter] = useState<'all' | 'homework' | 'notice' | 'exam'>('all');
  const [demoActiveDiaryId, setDemoActiveDiaryId] = useState<string | null>(null);
  const [demoSelectedDay, setDemoSelectedDay] = useState<number | null>(null);

  // Initialize theme preference from localStorage and check ?demo=1 query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('centum_demo_theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setDemoTheme(savedTheme);
        }
        const params = new URLSearchParams(window.location.search);
        if (params.get('demo') === '1' || params.get('demo') === 'true') {
          setIsDemoOpen(true);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleDemoTheme = () => {
    const nextTheme = demoTheme === 'light' ? 'dark' : 'light';
    setDemoTheme(nextTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('centum_demo_theme', nextTheme);
      } catch {
        // ignore
      }
    }
  };

  // TASK VI: Fetch student classroom data in parallel and swap seamlessly without blocking
  useEffect(() => {
    let active = true;
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        const phoneParam = student?.phone ? encodeURIComponent(String(student.phone)) : '';
        const res = await fetch(`/api/classroom?phone=${phoneParam}`);
        if (res.ok && active) {
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
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchClassroom();

    return () => {
      active = false;
    };
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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>{isTamil ? 'டியூஷன் வகுப்பறை' : 'Tuition Classroom'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                Centum v2
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words">
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-4 sm:p-6 shadow-xl border border-emerald-500/30">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{isTamil ? 'இணைக்கப்பட்ட மாணவர்' : 'Enrolled Student'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 break-words">
                  {data.tuition.name}
                </h2>
                <p className="text-sm text-emerald-200/90 flex items-center gap-1.5 break-words">
                  <span>👨‍🏫</span>
                  <span>{isTamil ? 'ஆசிரியர்:' : 'Teacher:'}</span>
                  <span className="font-semibold text-white">{data.tuition.teacher}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
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
        /* ==================== UNJOINED STATE: 3 CLEAN BOXES (Brief F) ==================== */
        <div className="space-y-5 animate-fade-in max-w-lg mx-auto w-full">
          {/* Box 1: Students (Seat Code Input) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#1B0B2E] border-2 border-[#7C3AED]/30 dark:border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/5">
            <div className="flex items-center gap-3 mb-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center text-lg font-black shrink-0">
                🎓
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA] block">
                  {isTamil ? 'மாணவர்கள்' : 'For Students'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#FAF5FF] leading-tight break-words">
                  {isTamil ? 'டியூஷன் இருக்கை குறியீடு உள்ளதா?' : 'Have a Tuition Seat Code?'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-purple-200/80 leading-relaxed mb-4 break-words">
              {isTamil
                ? 'உங்கள் ஆசிரியர் வழங்கிய இருக்கை குறியீட்டை உள்ளிட்டு தினசரி வீட்டுப்பாடம், வருகை விவரம் & சிறப்பு தேர்வுகளை அணுகுங்கள்.'
                : 'Enter your exclusive seat code from your tuition centre to unlock daily diary feeds, attendance tracking & board exam masterclasses.'}
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder={isTamil ? 'எ.கா: APEX10-S01' : 'e.g. APEX10-S01'}
                  value={seatInput}
                  onChange={(e) => setSeatInput(e.target.value.toUpperCase())}
                  className="w-full sm:flex-1 px-4 py-3 rounded-2xl border border-[#DDD6FE] dark:border-[#3B2063] bg-[#FAF5FF] dark:bg-[#2A1247] text-[#2E1065] dark:text-[#FAF5FF] font-mono uppercase text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
                <button
                  type="submit"
                  disabled={!seatInput.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white text-sm font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#7C3AED]/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{isTamil ? 'இணை' : 'Claim'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Box 2: Tuition Owners (Benefits + WhatsApp CTA) */}
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#2E1065] via-[#3B0F6E] to-[#1B0B2E] border-2 border-[#7C3AED]/40 text-white shadow-xl shadow-[#7C3AED]/15">
            <div className="flex items-center gap-3 mb-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/30 text-[#A3E635] flex items-center justify-center text-lg font-black shrink-0 border border-[#7C3AED]/40">
                🏫
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A3E635] block">
                  {isTamil ? 'டியூஷன் ஆசிரியர்கள் & உரிமையாளர்கள்' : 'Tuition Owners & Teachers'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight break-words">
                  {isTamil ? 'உங்கள் டியூஷனுக்கு டிஜிட்டல் வகுப்பறை' : 'Get Your Own Digital Classroom'}
                </h3>
              </div>
            </div>

            <ul className="text-xs space-y-2 mb-5 text-purple-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">{isTamil ? 'பிரத்யேக டிஜிட்டல் நாள்குறிப்பு & வீட்டுப்பாட அறிவிப்புகள்' : 'Branded Digital Diary & Daily Homework Feed'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">{isTamil ? 'நேரடி வருகைப்பதிவு & மாணவர் முன்னேற்றப் பார்வை' : 'Real-time 30-day Attendance & Student Tracking'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">{isTamil ? '100/100 பொதுத்தேர்வு சிறப்பு வினாக்கள் & பொருட்கள்' : '100/100 High-Yield Board Exam Study Materials'}</span>
              </li>
            </ul>

            <a
              href="https://wa.me/918610653352?text=Hi%20Centum,%20I%20run%20a%20tuition%20centre%20and%20want%20to%20get%20my%20own%20digital%20classroom"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 sm:px-5 py-3 rounded-2xl bg-[#A3E635] hover:bg-[#bef264] text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#A3E635]/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] text-center"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950 shrink-0" />
              <span className="break-words">{isTamil ? 'வாட்ஸ்அப்பில் நிறுவனருடன் பேசுக' : 'Chat with Founder on WhatsApp'}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          {/* Box 3: Demo Classroom ("Explore Demo Classroom") */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#1B0B2E] border-2 border-[#DDD6FE] dark:border-[#3B2063] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center text-lg font-black shrink-0">
                ✨
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isTamil ? 'முன்னோட்டம்' : 'Interactive Preview'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-[#2E1065] dark:text-[#FAF5FF] leading-tight break-words">
                  {isTamil ? 'மாதிரி வகுப்பறையைக் காண்க' : 'Explore Demo Classroom'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-0.5 break-words">
                  {isTamil ? 'நேரடி நாள்குறிப்பு, வருகைப்பதிவு & புள்ளிவிவரங்களை சோதிக்கவும்.' : 'Preview how diary notes, attendance & student reports work.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="explore-demo-btn"
              onClick={() => setIsDemoOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FAF5FF] dark:bg-[#2A1247] border border-[#7C3AED] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#7C3AED] hover:text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTamil ? 'மாதிரி பார்க்க' : 'Explore Demo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Student Demo Classroom Modal */}
      {isDemoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Interactive Demo Classroom Preview"
          className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden animate-fade-in ${
            demoTheme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
          }`}
        >
          {/* Top Bar Header */}
          <div
            className={`shrink-0 px-4 py-3 backdrop-blur-md border-b flex items-center justify-between gap-3 ${
              demoTheme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
                : 'bg-slate-900/90 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src="https://i.imgur.com/PxSCGbL.png"
                alt="Ravi's Tuition Centre"
                className={`w-9 h-9 object-contain rounded-xl p-0.5 border shadow-xs ${
                  demoTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Student Demo
                  </span>
                  <span className="text-xs sm:text-sm font-black">
                    {data?.preview?.sampleTuition?.name || "Ravi's Tuition Centre"}
                  </span>
                </div>
                <p
                  className={`text-[11px] font-medium line-clamp-1 ${
                    demoTheme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {isTamil ? 'மாணவர் மாதிரி வகுப்பறை (மாதிரி தரவு)' : 'Student demo classroom · Sample data preview'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                type="button"
                data-testid="demo-theme-toggle"
                onClick={toggleDemoTheme}
                aria-label={demoTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  demoTheme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {demoTheme === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px]">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px]">Dark</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                data-testid="close-demo-btn"
                onClick={() => setIsDemoOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors border ${
                  demoTheme === 'light'
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Pill Bar */}
          <div
            className={`shrink-0 px-3 py-2 border-b ${
              demoTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div
              className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border ${
                demoTheme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                type="button"
                data-testid="demo-tab-dashboard"
                onClick={() => setDemoView('dashboard')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  demoView === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : demoTheme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🏠</span>
                <span className="truncate">{isTamil ? 'முகப்பு' : 'Overview'}</span>
              </button>

              <button
                type="button"
                data-testid="demo-tab-attendance"
                onClick={() => setDemoView('attendance')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  demoView === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : demoTheme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📅</span>
                <span className="truncate">{isTamil ? 'வருகை' : 'Attendance'}</span>
              </button>

              <button
                type="button"
                data-testid="demo-tab-diary"
                onClick={() => setDemoView('diary')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  demoView === 'diary'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : demoTheme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📖</span>
                <span className="truncate">{isTamil ? 'நாள்குறிப்பு' : 'Diary'}</span>
              </button>

              <button
                type="button"
                data-testid="demo-tab-performance"
                onClick={() => setDemoView('performance')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  demoView === 'performance'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : demoTheme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📊</span>
                <span className="truncate">{isTamil ? 'முன்னேற்றம்' : 'Performance'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
            {/* ENROLLED CLASSROOM CARD (shows ONLY classroom name and teacher name, NO access code, NO batch details) */}
            <div
              data-testid="demo-enrolled-card"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-4 sm:p-5 shadow-lg border border-emerald-400/30"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src="https://i.imgur.com/PxSCGbL.png"
                  alt="Ravi's Tuition Centre"
                  className="w-12 h-12 object-contain rounded-xl bg-white p-1 shadow-xs border border-white/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>{isTamil ? 'இணைக்கப்பட்ட வகுப்பறை · மாதிரி' : 'Enrolled Classroom · Demo Preview'}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                    {data?.preview?.sampleTuition?.name || "Ravi's Tuition Centre"}
                  </h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                    <span>👨‍🏫</span>
                    <span>{isTamil ? 'ஆசிரியர்:' : 'Teacher:'}</span>
                    <strong className="text-white font-bold">
                      {data?.preview?.sampleTuition?.teacher || 'Dr. Ravi'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* VIEW 1: FIRST DASHBOARD (Compact with Three Tiles: Attendance, Diary, Performance) */}
            {demoView === 'dashboard' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tile 1: Attendance */}
                  <div
                    data-testid="demo-tile-attendance"
                    onClick={() => setDemoView('attendance')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 hover:border-emerald-500'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          🌟 93% · Demo
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {isTamil ? 'வருகை (மாதிரி)' : 'Attendance (Demo)'}
                      </h4>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-1">
                        93%
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        28 / 30 {isTamil ? 'நாட்கள் (மாதிரி பதிவு)' : 'Days (Demo Record)'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>{isTamil ? 'பதிவை காண்க' : 'Open Record'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Tile 2: Diary (Opens teacher's notes) */}
                  <div
                    data-testid="demo-tile-diary"
                    onClick={() => setDemoView('diary')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 hover:border-blue-500'
                        : 'bg-slate-900 border-slate-800 hover:border-blue-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          📝 3 Sample Notes
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {isTamil ? 'நாள்குறிப்பு' : 'Diary'}
                      </h4>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400 my-1">
                        3 Notes
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {isTamil ? 'மாதிரி ஆசிரியர் குறிப்புகள்' : 'Sample Teacher Diary'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      <span>{isTamil ? 'குறிப்புகள் திறக்க' : 'Open Notes'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Tile 3: Performance (Individual stats only) */}
                  <div
                    data-testid="demo-tile-performance"
                    onClick={() => setDemoView('performance')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 hover:border-purple-500'
                        : 'bg-slate-900 border-slate-800 hover:border-purple-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          🔥 14d Streak · Demo
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {isTamil ? 'முன்னேற்றம் (மாதிரி)' : 'Performance (Demo)'}
                      </h4>
                      <div className="text-2xl font-black text-purple-600 dark:text-purple-400 my-1">
                        92%
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        12 {isTamil ? 'தேர்வுகள் (மாதிரி விவரம்)' : 'Tests (Demo Stats)'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      <span>{isTamil ? 'புள்ளிகள் காண்க' : 'View Stats'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Explicit Demo Data Notice */}
                <div
                  data-testid="classroom-demo-banner"
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                    demoTheme === 'light'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-900'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-black uppercase tracking-wider text-[10px] block mb-0.5 text-amber-700 dark:text-amber-300">
                      {isTamil ? 'மாதிரி வகுப்பறை அறிவிப்பு · டெமோ தரவு' : 'Demo Classroom Notice · Sample Data'}
                    </span>
                    <p>
                      {isTamil
                        ? 'இங்கு காட்டப்பட்டுள்ள வருகை (93%), ஆசிரியர் குறிப்புகள் மற்றும் தேர்வு தேர்ச்சி (92%) புள்ளிவிவரங்கள் மாதிரி வகுப்பறை வடிவத்தை மாணவர்களுக்கு விளக்க உருவாக்கப்பட்ட மாதிரி எண்களாகும்.'
                        : 'The attendance (93%), teacher diary notes, and quiz performance (92%) metrics displayed here are sample demonstration figures to illustrate your daily dashboard at Ravi’s Tuition Centre.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: DIARY (Teacher's Notes Feed) */}
            {demoView === 'diary' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    data-testid="demo-back-dashboard"
                    onClick={() => setDemoView('dashboard')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isTamil ? 'முகப்புக்குத் திரும்பு' : 'Back to Dashboard'}</span>
                  </button>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    👨‍🏫 {isTamil ? 'ஆசிரியரின் நாள்குறிப்பு' : "Teacher's Notes"}
                  </span>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: isTamil ? 'அனைத்தும்' : 'All Notes', icon: '📝' },
                    { id: 'homework', label: isTamil ? 'வீட்டுப்பாடம்' : 'Homework', icon: '✍️' },
                    { id: 'notice', label: isTamil ? 'அறிவிப்புகள்' : 'Notices', icon: '📢' },
                    { id: 'exam', label: isTamil ? 'தேர்வுகள்' : 'Exams', icon: '🧪' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setDemoDiaryFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        demoDiaryFilter === filter.id
                          ? 'bg-emerald-600 text-white border-emerald-500 font-black shadow-xs'
                          : demoTheme === 'light'
                          ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="mr-1">{filter.icon}</span>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>

                {/* Notes Feed */}
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'd1',
                      tag: 'homework',
                      text: isTamil
                        ? 'கணிதம் பாடம் 1 பயிற்சி 1.2 — வினா 1 முதல் 5 வரை தீர்க்கவும். நாளை நோட்டுப் புத்தகத்தை கொண்டு வரவும்.'
                        : 'Maths Chapter 1 Exercise 1.2 — Solve Question 1 to 5. Bring completed notebook tomorrow.',
                      date: isTamil ? 'இன்று, மாலை 4:30' : 'Today, 4:30 PM',
                      detail: isTamil
                        ? 'ஆசிரியர் குறிப்பு: கார்ட்டீசியன் பெருக்கல் வரைபடங்களை முழுமையாக வரையவும். 5 மதிப்பெண் வினாவிற்கு முக்கியமானது.'
                        : 'Teacher Note: Show full Cartesian product step mappings. Important for 5-mark board question.',
                      status: isTamil ? 'நிலுவையில் உள்ளது' : 'Pending Submission',
                    },
                    {
                      id: 'd2',
                      tag: 'notice',
                      text: isTamil
                        ? 'இருபடிச் சமன்பாடுகள் திருப்புதல் சிறப்பு வகுப்பு இந்த சனிக்கிழமை காலை 10:00 மணிக்கு நடைபெறும்.'
                        : 'Special revision masterclass this Saturday at 10:00 AM on Quadratic Equations.',
                      date: isTamil ? 'நேற்று' : 'Yesterday',
                      detail: isTamil
                        ? "இடம்: ரவி டியூஷன் அரங்கம். பாடப்புத்தகம் மற்றும் வரைபடத்தாள்களை உடன் கொண்டு வரவும்."
                        : "Venue: Ravi's Tuition Centre Main Hall. Carry your state board textbook and graph sheets.",
                      status: isTamil ? 'முக்கிய அறிவிப்பு' : 'Important Notice',
                    },
                    {
                      id: 'd3',
                      tag: 'exam',
                      text: isTamil
                        ? 'அலகுத் தேர்வு 1 விடைக்குறிப்புகள் பதிவேற்றப்பட்டுள்ளன.'
                        : 'Unit Test 1 answer keys and high-yield scoring tricks uploaded to Pro Materials.',
                      date: isTamil ? '2 நாட்களுக்கு முன்' : '2 days ago',
                      detail: isTamil
                        ? 'கேள்வி #4 மற்றும் #8 தீர்வு வழிமுறைகளை சரிபார்க்கவும். சராசரி மதிப்பெண்: 22/25.'
                        : 'Review question #4 and #8 solution tricks. Average score: 22/25.',
                      status: isTamil ? 'விடைகள் தயார்' : 'Answer Key Available',
                    },
                    {
                      id: 'd4',
                      tag: 'homework',
                      text: isTamil
                        ? 'அறிவியல் பாடம் 1 — கதிர் வரைபடங்கள் மற்றும் நியூட்டனின் இரண்டாம் விதி கணக்குகளை பயிற்சி செய்யவும்.'
                        : 'Science Chapter 1 — Practice ray diagrams and Newton second law numericals.',
                      date: isTamil ? '3 நாட்களுக்கு முன்' : '3 days ago',
                      detail: isTamil
                        ? 'கணக்கு தீர்வுத்தாளை மாலை 6:15 மணிக்குள் டாக்டர் ரவி சாரிடம் சமர்ப்பிக்கவும்.'
                        : 'Submit numerical workout sheet to Dr. Ravi before 6:15 PM.',
                      status: isTamil ? 'நிறைவுற்றது ✓' : 'Completed ✓',
                    },
                  ]
                    .filter((item) => demoDiaryFilter === 'all' || item.tag === demoDiaryFilter)
                    .map((item) => {
                      const isExpanded = demoActiveDiaryId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setDemoActiveDiaryId(isExpanded ? null : item.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2 ${
                            demoTheme === 'light'
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {renderTagChip(item.tag)}
                            <span className="text-[11px] font-medium text-slate-400">{item.date}</span>
                          </div>

                          <p
                            className={`text-xs sm:text-sm font-medium leading-relaxed ${
                              demoTheme === 'light' ? 'text-slate-800' : 'text-slate-200'
                            }`}
                          >
                            {item.text}
                          </p>

                          {/* Expandable Teacher Note */}
                          {isExpanded ? (
                            <div
                              className={`p-3 rounded-xl border text-xs space-y-1.5 animate-fadeIn ${
                                demoTheme === 'light'
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-slate-950/80 border-slate-800'
                              }`}
                            >
                              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.detail}</p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                                <span className="text-slate-500">
                                  Status: <strong className="font-bold">{item.status}</strong>
                                </span>
                                <span className="text-slate-400">Tap to collapse ▲</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end text-[10px] text-slate-400 font-bold">
                              <span>Tap for teacher notes & instructions ▼</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* VIEW 3: ATTENDANCE (30-day interactive record) */}
            {demoView === 'attendance' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    data-testid="demo-back-dashboard"
                    onClick={() => setDemoView('dashboard')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isTamil ? 'முகப்புக்குத் திரும்பு' : 'Back to Dashboard'}</span>
                  </button>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    📅 {isTamil ? 'வருகைப் பதிவு' : 'Attendance Log'}
                  </span>
                </div>

                {/* Summary Box */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    demoTheme === 'light'
                      ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>{isTamil ? 'எனது வருகை (கடந்த 30 நாட்கள்)' : 'My Attendance (Last 30 Days)'}</span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      🌟 93% · Demo Record
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 my-1">
                    <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">93%</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      28 of 30 Days Present (Sample)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-bold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                    <span>🔥</span>
                    <span>14 Days Continuous Active Streak! (Demo Preview)</span>
                  </div>
                </div>

                {/* Interactive 30-Day Mini Chips */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    demoTheme === 'light'
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isTamil ? 'தேதியைத் தட்டி பதிவு விவரங்களைக் காணுங்கள்:' : 'Tap a day chip to view check-in log:'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">30-Day Record</span>
                  </div>

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
                              ? 'ring-2 ring-emerald-500 scale-105 shadow-md bg-emerald-600 text-white border-emerald-500'
                              : isLeave
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                        >
                          <span className="block text-[10px] text-slate-400 font-normal">D{day}</span>
                          <span>{isLeave ? '—' : '✓'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {demoSelectedDay !== null ? (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                        demoTheme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div>
                        <span className="font-bold">Day {demoSelectedDay}: </span>
                        {demoSelectedDay === 12 || demoSelectedDay === 22 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Excused Leave (Prior Notice Received)
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Present ✓ — Checked in at 6:05 PM
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDemoSelectedDay(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white ml-2 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center">
                      Tap any Day (D1–D30) above to inspect timestamp details.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 4: PERFORMANCE (Individual Student Stats ONLY — never batch-wide) */}
            {demoView === 'performance' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    data-testid="demo-back-dashboard"
                    onClick={() => setDemoView('dashboard')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isTamil ? 'முகப்புக்குத் திரும்பு' : 'Back to Dashboard'}</span>
                  </button>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    📊 {isTamil ? 'எனது தனிப்பட்ட தேர்வு விவரங்கள்' : 'My Personal Stats'}
                  </span>
                </div>

                {/* Demo Data Notice */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    <strong>{isTamil ? 'மாதிரி தரவு:' : 'Demo Data:'}</strong> {isTamil ? 'கீழே காட்டப்பட்டுள்ள வினாடி வினா துல்லியம் (92%) மற்றும் பாடவாரியான மதிப்பெண்கள் மாதிரி எண்களாகும்.' : 'The quiz accuracy (92%) and subject scores shown below are sample demonstration figures.'}
                  </span>
                </div>

                {/* Individual 3-Card Metrics (NO batch averages, NO class ranks) */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div
                    className={`p-3.5 rounded-2xl border text-center ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {isTamil ? 'சராசரி (மாதிரி)' : 'Quiz Accuracy'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 block mt-1">
                      92%
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                      Sample Data
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-center ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {isTamil ? 'தேர்வுகள் (மாதிரி)' : 'Tests Done'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                      12
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                      Sample Data
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-center ${
                      demoTheme === 'light'
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      {isTamil ? 'தொடர் கற்றல்' : 'Daily Streak'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-500 block mt-1">
                      14d 🔥
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                      Sample Data
                    </span>
                  </div>
                </div>

                {/* Individual Subject Mastery */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    demoTheme === 'light'
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isTamil ? 'எனது பாடவாரியான தேர்ச்சி' : 'My Subject Mastery'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Personal Record</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { subj: 'Mathematics', score: 92, count: '5 tests' },
                      { subj: 'Science', score: 89, count: '4 tests' },
                      { subj: 'Social Science', score: 85, count: '3 tests' },
                    ].map((s) => (
                      <div
                        key={s.subj}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          demoTheme === 'light'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{s.subj}</span>
                          <span className="text-[10px] text-slate-400">{s.count} completed</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                            {s.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Actions */}
          <div
            className={`shrink-0 p-3 sm:p-4 border-t max-w-2xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
              demoTheme === 'light'
                ? 'bg-white/95 border-slate-200'
                : 'bg-slate-900/95 border-slate-800'
            }`}
          >
            <Link
              href="/join"
              onClick={() => setIsDemoOpen(false)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isTamil ? 'உங்கள் வகுப்பறையில் இணையவும் 🚀' : 'Join your classroom'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://wa.me/918610653352?text=Hi%20Centum,%20I%20saw%20the%20demo%20classroom%20and%20want%20to%20get%20my%20own%20tuition%20classroom"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-black border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                demoTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isTamil ? 'டியூஷன் நடத்துகிறீர்களா? உங்கள் சொந்தத்தைப் பெறுங்கள்' : 'Running a tuition? get yours 💬'}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
