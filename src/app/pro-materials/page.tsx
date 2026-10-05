'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft,
  Crown,
  Lock,
  Play,
  FileText,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  GraduationCap,
  Sparkle,
} from 'lucide-react';
import { ProVideoPlayer } from '@/components/ProVideoPlayer';
import { ProVideoItem } from '@/lib/server-mock-store';
import { getCanonicalSubjects, normalizeSubject } from '@/data/canonicalSubjects';
import { isLanguageSubject } from '@/lib/data';
import rawPapers from '@/data/papers.json';
import { Paper } from '@/types';

interface ProMaterialItem {
  id: string;
  classLevel: string;
  subject: string;
  chapter: string;
  title: string;
  videoEmbedUrl?: string;
  notesPdfUrl?: string;
  conceptQuizUrl?: string;
  bookbackQuizUrl?: string;
  importantQuestionsUrl?: string;
  status: 'live' | 'draft';
  createdAt: string;
  interactiveNotes?: string;
}

type MaterialTypeFilter = 'all' | 'video' | 'quiz' | 'notes' | 'paper';

function ProMaterialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { student, plan, openPaywall, medium, setMedium } = useApp();

  // TASK C: Class scoping first (hard)
  // Derive student's class (default 10). QA/Admin test bypass via ?class= or ?classLevel=
  const qaClassOverride = searchParams.get('class') || searchParams.get('classLevel');
  const studentStoredClass = student?.standard?.replace(/\D/g, '') || '10';
  const effectiveClass = qaClassOverride ? qaClassOverride.replace(/\D/g, '') : studentStoredClass;

  const isPro = String(plan || '').toLowerCase() === 'pro' || String(plan || '').toLowerCase() === 'live' || student?.plan === 'pro' || student?.plan === 'live';

  // Sourced strictly from canonical subjects for student's class (no cross-class subjects)
  const canonicalSubjects = useMemo(() => {
    return getCanonicalSubjects(effectiveClass, student?.stream);
  }, [effectiveClass, student?.stream]);

  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    const qSubj = searchParams.get('subject');
    if (qSubj && canonicalSubjects.some((s) => s.toLowerCase() === qSubj.toLowerCase())) {
      return qSubj;
    }
    return canonicalSubjects[0] || 'Maths';
  });

  // Type filter row: All · Video · Pro Quiz · Notes/Diagrams · Papers
  const [selectedType, setSelectedType] = useState<MaterialTypeFilter>('all');

  const [materials, setMaterials] = useState<ProMaterialItem[]>([]);
  const [videos, setVideos] = useState<ProVideoItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When class changes, reset subject if not in canonical list
  useEffect(() => {
    if (!canonicalSubjects.some((s) => s.toLowerCase() === selectedSubject.toLowerCase())) {
      setSelectedSubject(canonicalSubjects[0] || 'Maths');
    }
  }, [canonicalSubjects, selectedSubject]);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      try {
        const [matRes, vidRes] = await Promise.all([
          fetch(
            `/api/pro-materials?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
          fetch(
            `/api/pro-videos?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
        ]);

        if (matRes.ok) {
          const data = await matRes.json();
          if (data.ok && Array.isArray(data.materials)) {
            // Strictly enforce classLevel scoping
            const scoped = data.materials.filter((m: ProMaterialItem) => String(m.classLevel).replace(/\D/g, '') === effectiveClass);
            setMaterials(scoped);
          } else {
            setMaterials([]);
          }
        }

        if (vidRes.ok) {
          const vData = await vidRes.json();
          if (vData.ok && Array.isArray(vData.videos)) {
            // Strictly enforce classLevel scoping
            const scopedVids = vData.videos.filter((v: ProVideoItem) => String(v.classLevel).replace(/\D/g, '') === effectiveClass);
            setVideos(scopedVids);
          } else {
            setVideos([]);
          }
        }
      } catch (e) {
        console.warn('Failed to load class-scoped pro materials or videos', e);
        setMaterials([]);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [effectiveClass, selectedSubject]);

  // Group content under Chapter Headers
  interface ChapterGroup {
    chapterNo: number;
    title: string;
    videos: ProVideoItem[];
    materials: ProMaterialItem[];
  }

  const chapterGroups = useMemo<ChapterGroup[]>(() => {
    const map = new Map<number, ChapterGroup>();

    // 1. Group materials
    materials.forEach((m) => {
      const match = m.chapter.match(/(\d+)/);
      const chNo = match ? parseInt(match[1], 10) : 1;
      if (!map.has(chNo)) {
        map.set(chNo, {
          chapterNo: chNo,
          title: m.chapter,
          videos: [],
          materials: [],
        });
      }
      map.get(chNo)!.materials.push(m);
    });

    // 2. Group videos
    videos.forEach((v) => {
      const chNo = v.chapterNo || 1;
      if (!map.has(chNo)) {
        const fallbackTitle = `Chapter ${chNo}`;
        map.set(chNo, {
          chapterNo: chNo,
          title: fallbackTitle,
          videos: [],
          materials: [],
        });
      }
      map.get(chNo)!.videos.push(v);
    });

    // Sort chapters ascending
    return Array.from(map.values()).sort((a, b) => a.chapterNo - b.chapterNo);
  }, [materials, videos]);

  // TASK V: Filter PYQ papers strictly for this class, subject, and medium
  const classPapers = useMemo(() => {
    const userMed = String(medium || 'english').trim().toLowerCase();
    const targetSubj = normalizeSubject(selectedSubject).toLowerCase();

    return (rawPapers as unknown as Paper[]).filter((p) => {
      const pStd = String(p.classLevel || (p as any).standard || '').replace(/\D/g, '');
      if (pStd !== effectiveClass) return false;

      // Subject filter
      if (normalizeSubject(p.subject || '').toLowerCase() !== targetSubj) return false;

      // Medium filter (Tamil and English languages apply to all; others strict)
      const isLang = isLanguageSubject(p.subject || '');
      if (isLang) return true;

      const pMed = String(p.medium || '').trim().toLowerCase();
      return pMed === userMed || (userMed.length > 0 && pMed.startsWith(userMed.slice(0, 1)));
    });
  }, [effectiveClass, selectedSubject, medium]);

  const handleProGate = (action: () => void) => {
    if (!isPro) {
      openPaywall('Unlock Pro Chapter Masterclasses, Video Walkthroughs & Concept Quizzes');
      return;
    }
    action();
  };

  const TYPE_TABS: Array<{ id: MaterialTypeFilter; label: string; icon: string }> = [
    { id: 'all', label: 'All Content', icon: '✨' },
    { id: 'video', label: 'Video', icon: '▶' },
    { id: 'quiz', label: 'Pro Quiz', icon: '🎯' },
    { id: 'notes', label: 'Notes/Diagrams', icon: '📝' },
    { id: 'paper', label: 'Papers', icon: '📄' },
  ];

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-24 max-w-md mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#FAF5FF]">
      {/* Top Bar with Back Link & Pro Badge & Language Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#DDD6FE]/20">
        <Link
          href="/materials"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#7C3AED] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        {/* Language Toggle & Pro Hub Badge */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
            <button
              type="button"
              onClick={() => setMedium('tamil')}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                medium === 'tamil'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#7C3AED]'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setMedium('english')}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                medium === 'english'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#7C3AED]'
              }`}
            >
              EM
            </button>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
            <Crown className="w-3.5 h-3.5" />
            <span>Class {effectiveClass}th Pro</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">👑</span>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#2E1065] dark:text-[#FAF5FF]">
            Pro Masterclass & Materials
          </h1>
        </div>
        <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 leading-snug">
          Class {effectiveClass}th chapter walkthroughs, 16:9 in-app video lectures, and concept mastery quizzes.
        </p>
      </div>

      {/* TASK C Filter Row 1: Subject Chips on Top (Class-Scoped) */}
      <div className="mb-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] block px-0.5 mb-1.5">
          Subjects ({effectiveClass}th)
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {canonicalSubjects.map((sub) => {
            const isSelected = selectedSubject.toLowerCase() === sub.toLowerCase();
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`min-h-[36px] px-3.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white border-[#7C3AED] shadow-sm'
                    : 'bg-white dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#DDD6FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* TASK C Filter Row 2: Type Chips Directly Below */}
      <div className="mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TYPE_TABS.map((tab) => {
            const isSelected = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`min-h-[32px] px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#A3E635] text-[#18181B] border-[#84CC16] shadow-xs'
                    : 'bg-white/80 dark:bg-[#2A104E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#DDD6FE]/15 hover:bg-[#FAF5FF]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Single Vertical Scrolling Feed with Chapter Headers */}
      {isLoading ? (
        <div className="py-16 text-center text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 animate-pulse">
          Loading chapter masterclasses... ⚡
        </div>
      ) : selectedType === 'paper' ? (
        /* TASK V: Compact, dense PYQ Papers list matching Pro Quiz small card pattern */
        classPapers.length === 0 ? (
          <div className="my-6 p-6 rounded-3xl bg-white dark:bg-[#3B0F6E] border-2 border-dashed border-[#DDD6FE] dark:border-[#DDD6FE]/30 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center mx-auto text-2xl">
              📄
            </div>
            <div>
              <h3 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
                No PYQ Papers Found
              </h3>
              <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 mt-1 max-w-xs mx-auto">
                No past year question papers found for Class {effectiveClass}th {selectedSubject} in {medium || 'English'} medium yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635]">
                {normalizeSubject(selectedSubject)} Past Exam Papers ({classPapers.length})
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {medium === 'tamil' ? 'தமிழ் வழி' : 'English Medium'}
              </span>
            </div>
            {classPapers.map((paper) => (
              <div
                key={paper.id}
                className="w-full min-h-[50px] p-3 rounded-2xl bg-white dark:bg-[#200538] border border-[#DDD6FE] dark:border-[#DDD6FE]/15 hover:border-[#7C3AED]/40 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs text-sm">
                    📄
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#EDE9FE] dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE]">
                        {normalizeSubject(paper.subject)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200">
                        {paper.exam}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {paper.year} · {paper.medium}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={paper.pdfUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shrink-0 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )
      ) : chapterGroups.length === 0 ? (
        /* Empty State */
        <div className="my-6 p-6 rounded-3xl bg-white dark:bg-[#3B0F6E] border-2 border-dashed border-[#DDD6FE] dark:border-[#DDD6FE]/30 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center mx-auto text-2xl">
            📅
          </div>
          <div>
            <h3 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
              Content dropping chapter by chapter ✨
            </h3>
            <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 mt-1 max-w-xs mx-auto">
              Our verified board educators are recording videos and finalizing high-yield revision notes for {selectedSubject}.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] shadow-md shadow-[#A3E635]/20 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Get Pro Access ₹799/yr</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {chapterGroups.map((group) => {
            // Filter chapter items by selectedType
            const chapterVids = group.videos;
            const chapterMats = group.materials;

            const hasVideos = (selectedType === 'all' || selectedType === 'video') && chapterVids.length > 0;
            const hasQuizzes = (selectedType === 'all' || selectedType === 'quiz') && chapterMats.some((m) => Boolean(m.conceptQuizUrl));
            const hasNotes = (selectedType === 'all' || selectedType === 'notes') && chapterMats.some((m) => Boolean(m.notesPdfUrl || m.interactiveNotes));
            const hasPapers = selectedType === 'all' && chapterMats.some((m) => m.title.toLowerCase().includes('paper') || m.id.includes('paper'));

            const isGroupEmpty = !hasVideos && !hasQuizzes && !hasNotes && !hasPapers;
            if (isGroupEmpty) return null;

            // Surface chapter title: "Chapter 1 · Laws of Motion" style
            const cleanTitle = group.title.replace(/^Chapter\s*\d+[:.\s–-]*/i, '').trim();
            const headerDisplay = `Chapter ${group.chapterNo} · ${cleanTitle || selectedSubject}`;

            return (
              <section key={group.chapterNo} className="space-y-3">
                {/* Chapter Section Header */}
                <div className="sticky top-0 z-10 py-1.5 bg-[#FAF5FF]/95 dark:bg-[#1B0B2E]/95 backdrop-blur-xs flex items-center justify-between border-b border-[#DDD6FE]/60 dark:border-[#DDD6FE]/20">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED] dark:bg-[#A3E635]" />
                    <span>{headerDisplay}</span>
                  </h2>
                  <span className="text-[10px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 bg-white dark:bg-[#2A104E] px-2 py-0.5 rounded-full border border-[#EDE9FE] dark:border-[#DDD6FE]/15">
                    {chapterVids.length} vids · {chapterMats.length} assets
                  </span>
                </div>

                <div className="space-y-3">
                  {/* 1. Video Cards */}
                  {hasVideos && (
                    <div className="space-y-2.5">
                      {chapterVids.map((vid) => {
                        const isPlayerActive = activeVideoId === vid.id;

                        return (
                          <div
                            key={vid.id}
                            className="bg-white dark:bg-[#200538] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/15 shadow-xs overflow-hidden transition-all"
                          >
                            {/* Inline Video Player Container (Active) */}
                            {isPlayerActive ? (
                              <div className="p-3 space-y-2.5 bg-black/5 dark:bg-black/40">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[10px] font-black uppercase text-[#7C3AED] dark:text-[#A3E635] flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    <span>In-App Video Masterclasses (16:9 Landscape)</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveVideoId(null)}
                                    className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                  >
                                    Close Player ✕
                                  </button>
                                </div>
                                <ProVideoPlayer video={vid} subjectName={selectedSubject} />
                              </div>
                            ) : (
                              /* Video Card Preview */
                              <button
                                type="button"
                                onClick={() => {
                                  handleProGate(() => {
                                    setActiveVideoId(vid.id);
                                  });
                                }}
                                className="w-full p-3.5 flex items-start justify-between gap-3 text-left cursor-pointer hover:bg-[#FAF5FF] dark:hover:bg-[#2A104E]/50 transition-colors"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#F3E8FF] dark:bg-[#581C87] text-[#6B21A8] dark:text-[#E9D5FF]">
                                        Video · {vid.videoType === 'concept-explainer' ? 'concept-explainer' : vid.videoType === 'question-solution' ? 'question-solution' : vid.videoType}
                                      </span>
                                      <span className="text-[10px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                                        ⏱ {Math.round(vid.targetSec / 60)} mins
                                      </span>
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] leading-snug line-clamp-2">
                                      {vid.topic}
                                    </h3>
                                  </div>
                                </div>

                                <div className="shrink-0 flex flex-col items-end gap-1">
                                  {!isPro ? (
                                    <span title="Unlock Full Pro Pack 👑" className="p-1 rounded-lg bg-amber-400/20 text-amber-800 dark:text-amber-200 text-xs">
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A3E635] text-[10px] font-black">
                                      Play ▶
                                    </span>
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Pro Quiz Cards */}
                  {hasQuizzes && (
                    <div className="space-y-2">
                      {chapterMats.map((mat) => {
                        const quizUrl = `/test-runner?standard=${encodeURIComponent(effectiveClass)}th&subject=${encodeURIComponent(selectedSubject)}&chapter=${encodeURIComponent(mat.chapter)}&type=concept`;

                        return (
                          <div
                            key={`quiz-${mat.id}`}
                            className="p-3.5 rounded-2xl bg-white dark:bg-[#200538] border border-[#DDD6FE] dark:border-[#DDD6FE]/15 shadow-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs text-base">
                                🎯
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    Pro Concept Quiz
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                    ✓ 10 MCQs
                                  </span>
                                </div>
                                <h3 className="text-xs sm:text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                                  {cleanTitle || selectedSubject} — Concept Mastery
                                </h3>
                              </div>
                            </div>

                            <Link
                              href={quizUrl}
                              className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shrink-0 transition-all shadow-xs flex items-center gap-1"
                            >
                              <span>Play</span>
                              <span>→</span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Notes & Diagrams Cards */}
                  {hasNotes && (
                    <div className="space-y-2">
                      {chapterMats.map((mat) => {
                        const isNotesOpen = expandedNotesId === mat.id;
                        const hasInteractive = Boolean(mat.interactiveNotes);

                        return (
                          <div
                            key={`notes-${mat.id}`}
                            className="rounded-2xl bg-white dark:bg-[#200538] border border-[#EDE9FE] dark:border-[#DDD6FE]/15 shadow-xs overflow-hidden"
                          >
                            <div className="p-3.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                                      High-Yield Notes
                                    </span>
                                  </div>
                                  <h3 className="text-xs sm:text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                                    {mat.title}
                                  </h3>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {hasInteractive && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedNotesId(isNotesOpen ? null : mat.id)}
                                    className="px-2.5 py-1.5 rounded-lg border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[10px] font-black text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#FAF5FF] cursor-pointer"
                                  >
                                    {isNotesOpen ? 'Hide' : 'Quick Read 📖'}
                                  </button>
                                )}
                                {mat.notesPdfUrl && (
                                  <a
                                    href={mat.notesPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-[#A3E635] hover:bg-[#92D928] text-[#18181B] text-xs font-black flex items-center gap-1 shadow-xs"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Anatomia Accordion for Interactive Notes */}
                            {isNotesOpen && hasInteractive && (
                              <div className="p-4 pt-0 border-t border-[#FAF5FF] dark:border-[#2A104E] text-xs space-y-2 bg-[#FAF5FF]/50 dark:bg-[#1B0B2E]/50 animate-fade-in">
                                <div className="p-3 rounded-xl bg-white dark:bg-[#200538] border border-[#DDD6FE]/60 dark:border-[#DDD6FE]/15 whitespace-pre-line text-[#2E1065]/90 dark:text-[#FAF5FF]/90 font-medium">
                                  {mat.interactiveNotes}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. Papers Cards */}
                  {hasPapers && (
                    <div className="space-y-2">
                      {chapterMats
                        .filter((m) => m.title.toLowerCase().includes('paper') || m.id.includes('paper'))
                        .map((mat) => (
                          <div
                            key={`paper-${mat.id}`}
                            className="p-3.5 rounded-2xl bg-white dark:bg-[#200538] border border-[#DDD6FE] dark:border-[#DDD6FE]/15 shadow-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200">
                                    Exam Paper
                                  </span>
                                </div>
                                <h3 className="text-xs sm:text-sm font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                                  {mat.title}
                                </h3>
                              </div>
                            </div>

                            <a
                              href={mat.notesPdfUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shrink-0 transition-all shadow-xs flex items-center gap-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProMaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-[#7C3AED] animate-pulse">
          Loading Pro Hub... 👑
        </div>
      }
    >
      <ProMaterialsContent />
    </Suspense>
  );
}
