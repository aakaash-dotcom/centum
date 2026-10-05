'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  MessageCircle,
} from 'lucide-react';
import { ProVideoPlayer } from '@/components/ProVideoPlayer';
import { ProVideoItem } from '@/lib/server-mock-store';

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
}

const SUBJECT_LIST: Record<string, string[]> = {
  '10': ['Maths', 'Science', 'Social Science', 'English', 'Tamil'],
  '12': ['Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
};

function ProMaterialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { student, openPaywall } = useApp();

  const initialClass = searchParams.get('classLevel') || student?.standard?.replace(/\D/g, '') || '10';
  const initialSubject = searchParams.get('subject') || 'Maths';

  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [materials, setMaterials] = useState<ProMaterialItem[]>([]);
  const [videos, setVideos] = useState<ProVideoItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const isPro = student?.plan === 'pro' || student?.plan === 'live';
  const availableSubjects = SUBJECT_LIST[selectedClass] || ['Maths', 'Science', 'Social Science'];

  useEffect(() => {
    async function loadMaterials() {
      setIsLoading(true);
      try {
        const [matRes, vidRes] = await Promise.all([
          fetch(
            `/api/pro-materials?classLevel=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
          fetch(
            `/api/pro-videos?classLevel=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
        ]);

        if (matRes.ok) {
          const data = await matRes.json();
          if (data.ok && Array.isArray(data.materials)) {
            setMaterials(data.materials);
            if (data.materials.length > 0) {
              setExpandedChapter(data.materials[0].id);
            }
          } else {
            setMaterials([]);
          }
        }

        if (vidRes.ok) {
          const vData = await vidRes.json();
          if (vData.ok && Array.isArray(vData.videos)) {
            setVideos(vData.videos);
          } else {
            setVideos([]);
          }
        }
      } catch (e) {
        console.warn('Failed to load pro materials or videos', e);
        setMaterials([]);
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadMaterials();
  }, [selectedClass, selectedSubject]);

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-24 max-w-md mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#FAF5FF]">
      {/* Top Bar with Back Link */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#DDD6FE]/20">
        <Link
          href="/materials"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] dark:text-[#DDD6FE] hover:text-[#7C3AED] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Materials</span>
        </Link>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
          <Crown className="w-3.5 h-3.5" />
          <span>Pro Hub</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">👑</span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#2E1065] dark:text-[#FAF5FF]">
            Pro Materials & Masterclass
          </h1>
        </div>
        <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 leading-relaxed">
          Chapter-by-chapter video walkthroughs, high-yield PDF revision notes & concept mastery quizzes.
        </p>
      </div>

      {/* Class Level Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-3 p-1 bg-white dark:bg-[#3B0F6E] rounded-2xl border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs">
        {['10', '12'].map((cls) => {
          const isSelected = selectedClass === cls;
          return (
            <button
              key={cls}
              type="button"
              onClick={() => {
                setSelectedClass(cls);
                setSelectedSubject(SUBJECT_LIST[cls]?.[0] || 'Maths');
              }}
              className={`min-h-[40px] rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'text-[#6D28D9] dark:text-[#DDD6FE] hover:bg-[#FAF5FF] dark:hover:bg-[#230542]'
              }`}
            >
              <span>{cls}th Standard</span>
              {isSelected && <Sparkles className="w-3 h-3 text-[#A3E635]" />}
            </button>
          );
        })}
      </div>

      {/* Subject Pill Bar Top */}
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635] block px-1 mb-1.5">
          Select Subject
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableSubjects.map((sub) => {
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

      {/* Pro Materials Chapter Rails */}
      {isLoading ? (
        <div className="py-12 text-center text-xs font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70 animate-pulse">
          Loading chapter masterclasses... ⚡
        </div>
      ) : materials.length === 0 ? (
        /* Empty State: Content dropping chapter by chapter from next week */
        <div className="my-6 p-6 rounded-3xl bg-white dark:bg-[#3B0F6E] border-2 border-dashed border-[#DDD6FE] dark:border-[#DDD6FE]/30 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] flex items-center justify-center mx-auto text-2xl">
            📅
          </div>
          <div>
            <h3 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
              Content dropping chapter by chapter from next week ✨
            </h3>
            <p className="text-xs font-semibold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 mt-1 max-w-xs mx-auto">
              Our verified Tamil Nadu board educators are recording videos and finalizing high-yield revision notes for {selectedSubject}.
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
        /* Active Chapter Rails */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#6D28D9] dark:text-[#A3E635]">
              Chapter Curriculum ({materials.length} Chapters Live)
            </span>
            <span className="text-[10px] font-bold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
              swipe rail →
            </span>
          </div>

          {/* Horizontal Scroll Rail with snap cards (~40vw card width on mobile) */}
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none">
            {materials.map((item, idx) => {
              const isExpanded = expandedChapter === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setExpandedChapter(isExpanded ? null : item.id)}
                  className={`min-w-[42vw] sm:min-w-[280px] max-w-[340px] shrink-0 snap-start p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isExpanded
                      ? 'bg-white dark:bg-[#2A1247] border-[#7C3AED] dark:border-[#A3E635] shadow-lg shadow-[#7C3AED]/15'
                      : 'bg-white/80 dark:bg-[#3B0F6E]/80 border-[#EDE9FE] dark:border-[#DDD6FE]/20 hover:border-[#7C3AED]/40 shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F3E8FF] dark:bg-[#581C87] text-[#6B21A8] dark:text-[#E9D5FF]">
                        Chapter {idx + 1}
                      </span>
                      <span className="text-[10px] font-black text-[#16A34A] dark:text-[#86EFAC] flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Live
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/15 flex items-center justify-between text-xs font-bold text-[#7C3AED] dark:text-[#A3E635]">
                    <span>{isExpanded ? 'Hide Slots ▲' : 'View 5 Slots ▼'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-900 dark:text-amber-300 font-extrabold">
                      5 Assets
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Chapter Details: 5 Asset Slots */}
          {expandedChapter && (
            <div className="animate-fade-in space-y-3">
              {materials
                .filter((m) => m.id === expandedChapter)
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#3B0F6E] border-2 border-[#DDD6FE] dark:border-[#DDD6FE]/20 shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635] block mb-0.5">
                          {m.chapter}
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-[#2E1065] dark:text-[#FAF5FF]">
                          {m.title}
                        </h2>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black uppercase">
                        Pro Pack
                      </span>
                    </div>

                    {/* 5 ASSET SLOTS */}
                    <div className="space-y-2.5 relative">
                      {/* Slot 1: Video Masterclasses (16:9 Landscape Only) */}
                      {(() => {
                        const chNum = parseInt(m.chapter.replace(/\D/g, ''), 10) || 1;
                        const chapterVideos = videos.filter((v) => v.chapterNo === chNum);
                        const vList = chapterVideos.length > 0 ? chapterVideos : videos;

                        return (
                          <div className="p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center text-xs">
                                  <Play className="w-3 h-3 fill-current" />
                                </span>
                                <span>1. In-App Video Masterclasses (16:9 Landscape)</span>
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#DDD6FE]">
                                {vList.length} Lessons
                              </span>
                            </div>

                            {/* Chapter Videos Accordion List */}
                            <div className="space-y-2 pt-1">
                              {vList.map((vid) => {
                                const isOpen = activeVideoId === vid.id;
                                const isPortrait =
                                  vid.aspectRatio === 'portrait' ||
                                  vid.aspectRatio === '9:16' ||
                                  vid.aspectRatio === 'vertical';

                                return (
                                  <div
                                    key={vid.id}
                                    className={`rounded-2xl border transition-all overflow-hidden ${
                                      isOpen
                                        ? 'bg-white dark:bg-[#200538] border-[#7C3AED] dark:border-[#A3E635] shadow-md'
                                        : 'bg-white/70 dark:bg-[#2A104E]/50 border-[#EDE9FE] dark:border-[#DDD6FE]/15 hover:border-[#7C3AED]/40'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isPro) {
                                          openPaywall('pro-materials');
                                          return;
                                        }
                                        setActiveVideoId(isOpen ? null : vid.id);
                                      }}
                                      className="w-full p-3 flex items-start justify-between gap-2 text-left cursor-pointer"
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <div
                                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                            isOpen
                                              ? 'bg-[#7C3AED] text-white'
                                              : 'bg-[#EDE9FE] dark:bg-[#3B0F6E] text-[#6D28D9] dark:text-[#DDD6FE]'
                                          }`}
                                        >
                                          <Play className={`w-3.5 h-3.5 ${isOpen ? 'fill-current' : ''}`} />
                                        </div>
                                        <div>
                                          <h4 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] leading-snug line-clamp-2">
                                            {vid.topic}
                                          </h4>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                            {/* Type chip: concept-explainer / question-solution / formula-recap */}
                                            <span
                                              className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                vid.videoType === 'concept-explainer'
                                                  ? 'bg-[#F3E8FF] dark:bg-[#581C87] text-[#6B21A8] dark:text-[#E9D5FF]'
                                                  : vid.videoType === 'question-solution'
                                                  ? 'bg-[#E0F2FE] dark:bg-[#075985] text-[#0369A1] dark:text-[#BAE6FD]'
                                                  : 'bg-[#DCFCE7] dark:bg-[#14532D] text-[#15803D] dark:text-[#86EFAC]'
                                              }`}
                                            >
                                              {vid.videoType === 'concept-explainer'
                                                ? '🧠 Concept Explainer'
                                                : vid.videoType === 'question-solution'
                                                ? '✍️ Question Solution'
                                                : '⚡ Formula Recap'}
                                            </span>

                                            {/* Target Duration chip */}
                                            <span className="text-[10px] font-extrabold text-[#6D28D9]/70 dark:text-[#DDD6FE]/70">
                                              ⏱ {Math.floor(vid.targetSec / 60)}m {vid.targetSec % 60 ? `${vid.targetSec % 60}s` : ''}
                                            </span>

                                            {/* Format pending badge if portrait */}
                                            {isPortrait && (
                                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-800 dark:text-amber-300">
                                                🎬 Format Pending
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="shrink-0 pt-1 text-[#7C3AED] dark:text-[#A3E635]">
                                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </div>
                                    </button>

                                    {/* Inline Accordion Player */}
                                    {isOpen && isPro && (
                                      <div className="px-3 pb-3 pt-1 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/15 animate-fade-in">
                                        <ProVideoPlayer video={vid} subjectName={selectedSubject} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Slot 2: Notes PDF */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs">
                            <FileText className="w-3 h-3" />
                          </span>
                          <div>
                            <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] block">
                              2. High-Yield Revision Notes (PDF)
                            </span>
                            <span className="text-[10px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/60">
                              Formula sheet, theorem proofs & step-by-step solutions
                            </span>
                          </div>
                        </div>

                        {isPro && m.notesPdfUrl ? (
                          <a
                            href={m.notesPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl font-black text-xs bg-[#7C3AED] text-white hover:bg-[#6D28D9] flex items-center gap-1 shadow-xs"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs font-black text-[#6D28D9] dark:text-[#DDD6FE]/80">
                            🔒 Lock
                          </span>
                        )}
                      </div>

                      {/* Slot 3: Concept Quiz */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#16A34A] text-white flex items-center justify-center text-xs">
                            <HelpCircle className="w-3 h-3" />
                          </span>
                          <div>
                            <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] block">
                              3. Deep Concept Mastery Quiz
                            </span>
                            <span className="text-[10px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/60">
                              Diagnostic testing targeting common exam traps
                            </span>
                          </div>
                        </div>

                        {isPro && m.conceptQuizUrl ? (
                          <Link
                            href={m.conceptQuizUrl}
                            className="px-3 py-1.5 rounded-xl font-black text-xs bg-[#16A34A] text-white hover:bg-[#15803D] flex items-center gap-1 shadow-xs"
                          >
                            <span>Start</span>
                            <Sparkles className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-xs font-black text-[#6D28D9] dark:text-[#DDD6FE]/80">
                            🔒 Lock
                          </span>
                        )}
                      </div>

                      {/* Slot 4: Book-back Quiz */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#EA580C] text-white flex items-center justify-center text-xs">
                            <BookOpen className="w-3 h-3" />
                          </span>
                          <div>
                            <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] block">
                              4. Samacheer Book-Back One-Word Drill
                            </span>
                            <span className="text-[10px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/60">
                              100% textbook one-marks with instant answer keys
                            </span>
                          </div>
                        </div>

                        {isPro && m.bookbackQuizUrl ? (
                          <Link
                            href={m.bookbackQuizUrl}
                            className="px-3 py-1.5 rounded-xl font-black text-xs bg-[#EA580C] text-white hover:bg-[#C2410C] flex items-center gap-1 shadow-xs"
                          >
                            <span>Drill</span>
                            <Sparkles className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-xs font-black text-[#6D28D9] dark:text-[#DDD6FE]/80">
                            🔒 Lock
                          </span>
                        )}
                      </div>

                      {/* Slot 5: Important Questions Link */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE]/40 dark:border-[#DDD6FE]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#9333EA] text-white flex items-center justify-center text-xs">
                            <Sparkles className="w-3 h-3" />
                          </span>
                          <div>
                            <span className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] block">
                              5. Guaranteed 2-Mark & 5-Mark Questions
                            </span>
                            <span className="text-[10px] font-semibold text-[#6D28D9]/70 dark:text-[#DDD6FE]/60">
                              Hand-picked expected questions with model working
                            </span>
                          </div>
                        </div>

                        {isPro && m.importantQuestionsUrl ? (
                          <Link
                            href={m.importantQuestionsUrl}
                            className="px-3 py-1.5 rounded-xl font-black text-xs bg-[#7C3AED] text-white hover:bg-[#6D28D9] flex items-center gap-1 shadow-xs"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-xs font-black text-[#6D28D9] dark:text-[#DDD6FE]/80">
                            🔒 Lock
                          </span>
                        )}
                      </div>

                      {/* NON-PRO GATE OVERLAY */}
                      {!isPro && (
                        <div className="absolute inset-0 bg-[#2E1065]/70 dark:bg-[#0F0618]/80 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center p-6 text-center text-white shadow-xl animate-fade-in z-10">
                          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center mb-2 shadow-lg shadow-amber-400/30">
                            <Lock className="w-6 h-6 stroke-[2.5]" />
                          </div>
                          <h3 className="text-lg font-black tracking-tight text-white mb-1">
                            Unlock Full Pro Pack 👑
                          </h3>
                          <p className="text-xs font-semibold text-white/80 max-w-xs mb-4 leading-relaxed">
                            Get all 5 slots: video masterclasses, high-yield PDF notes, concept tests & textbook drills.
                          </p>

                          <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs">
                            <Link
                              href="/pricing"
                              className="w-full min-h-[46px] rounded-xl font-black text-xs text-[#18181B] bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-105 flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>Pro ₹799/yr — Upgrade Now</span>
                            </Link>
                          </div>
                          <span className="text-[10px] font-bold text-amber-200/80 mt-2 block">
                            Special student launch pricing · Instant activation
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProMaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20 text-xs font-bold text-[#6D28D9]">
          Loading Pro Materials... ⚡
        </div>
      }
    >
      <ProMaterialsContent />
    </Suspense>
  );
}
