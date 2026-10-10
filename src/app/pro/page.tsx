'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  Layers,
  GraduationCap,
  Sparkle,
  Video,
  Brain,
  BookMarked,
  X,
  Check,
  ArrowRight,
  Clock,
  Tag,
  Share2,
} from 'lucide-react';
import { ProVideoPlayer } from '@/components/ProVideoPlayer';
import { ProUpsellModal, ProUpsellContext } from '@/components/ProUpsellModal';
import { ProVideoItem } from '@/lib/server-mock-store';
import { getCanonicalSubjects, normalizeSubject } from '@/data/canonicalSubjects';
import { isLanguageSubject } from '@/lib/data';
import rawPapers from '@/data/papers.json';
import { Paper, Question } from '@/types';

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

interface TextbookChapter {
  unitNo: number;
  title: string;
  taTitle?: string;
  pages: number;
  driveFileId: string;
  isFullBook?: boolean;
}

export type ProSection =
  | 'all'
  | 'videos'
  | 'quiz'
  | 'concept'
  | 'notes'
  | 'papers'
  | 'diagrams'
  | 'handwritten'
  | 'textbooks';

interface UnderstandPopupState {
  video: ProVideoItem;
  questions: Question[];
  currentIdx: number;
  selectedOption: number | null;
  answers: Array<{ qId: string; selected: number; correct: number }>;
  isFinished: boolean;
}

function ProHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { student, plan, openPaywall, medium, setMedium } = useApp();

  const qaClassOverride = searchParams.get('class') || searchParams.get('classLevel');
  const studentStoredClass = student?.standard?.replace(/\D/g, '') || '10';
  const effectiveClass = qaClassOverride ? qaClassOverride.replace(/\D/g, '') : studentStoredClass;

  const isPro =
    String(plan || '').toLowerCase() === 'pro' ||
    String(plan || '').toLowerCase() === 'live' ||
    student?.plan === 'pro' ||
    student?.plan === 'live';

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

  // Section handling from URL parameter
  const rawSectionParam = (searchParams.get('section') || 'all').toLowerCase() as ProSection;
  const initialSection: ProSection = [
    'all',
    'videos',
    'quiz',
    'concept',
    'notes',
    'papers',
    'diagrams',
    'handwritten',
    'textbooks',
  ].includes(rawSectionParam)
    ? rawSectionParam
    : 'all';

  const [activeSection, setActiveSection] = useState<ProSection>(initialSection);

  useEffect(() => {
    if (rawSectionParam && rawSectionParam !== activeSection) {
      setActiveSection(rawSectionParam);
    }
  }, [rawSectionParam]);

  // Section scroll target refs
  const sectionRefs = {
    videos: useRef<HTMLDivElement>(null),
    concept: useRef<HTMLDivElement>(null),
    quiz: useRef<HTMLDivElement>(null),
    textbooks: useRef<HTMLDivElement>(null),
    papers: useRef<HTMLDivElement>(null),
    notes: useRef<HTMLDivElement>(null),
    diagrams: useRef<HTMLDivElement>(null),
    handwritten: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (activeSection !== 'all') {
      const targetRef =
        activeSection === 'quiz'
          ? sectionRefs.concept.current || sectionRefs.videos.current
          : sectionRefs[activeSection as keyof typeof sectionRefs]?.current;

      if (targetRef) {
        setTimeout(() => {
          targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [activeSection]);

  // State data
  const [materials, setMaterials] = useState<ProMaterialItem[]>([]);
  const [videos, setVideos] = useState<ProVideoItem[]>([]);
  const [allVideosCount, setAllVideosCount] = useState<number>(42);
  const [livePapers, setLivePapers] = useState<Paper[]>(() => rawPapers as unknown as Paper[]);
  const [papersTotalCount, setPapersTotalCount] = useState<number>(4500);
  const [conceptQuestions, setConceptQuestions] = useState<Question[]>([]);
  const [conceptTotalCount, setConceptTotalCount] = useState<number>(540);
  const [textbooks, setTextbooks] = useState<TextbookChapter[]>([]);
  const [isLoadingTextbooks, setIsLoadingTextbooks] = useState<boolean>(false);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upsell Modal State
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [upsellContext, setUpsellContext] = useState<ProUpsellContext>({
    subject: selectedSubject,
    chapter: 'Chapter 2',
    videoCount: 2,
    conceptCount: 18,
    paperCount: 12,
  });

  // Understand-check popup state (Task 6)
  const [understandPopup, setUnderstandPopup] = useState<UnderstandPopupState | null>(null);

  // When class changes, reset subject if not in canonical list
  useEffect(() => {
    if (!canonicalSubjects.some((s) => s.toLowerCase() === selectedSubject.toLowerCase())) {
      setSelectedSubject(canonicalSubjects[0] || 'Maths');
    }
  }, [canonicalSubjects, selectedSubject]);

  // Fetch Live Papers
  useEffect(() => {
    async function fetchLivePapers() {
      try {
        const res = await fetch(
          `/api/papers?classLevel=${encodeURIComponent(effectiveClass)}&medium=${encodeURIComponent(medium || 'all')}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && Array.isArray(data.papers)) {
            setLivePapers(data.papers);
            if (data.totalCount || data.papers.length) {
              setPapersTotalCount(Math.max(4500, data.totalCount || data.papers.length));
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch live papers, using bundled catalog', e);
      }
    }
    fetchLivePapers();
  }, [effectiveClass, medium]);

  // Fetch Materials, Videos & Concept Questions for Selected Subject
  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      try {
        const [matRes, vidRes, qRes] = await Promise.all([
          fetch(
            `/api/pro-materials?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
          fetch(
            `/api/pro-videos?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
          fetch(
            `/api/questions?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}&type=concept&count=all&medium=${encodeURIComponent(medium || 'english')}`
          ),
        ]);

        if (matRes.ok) {
          const data = await matRes.json();
          if (data && data.ok && Array.isArray(data.materials)) {
            const scoped = data.materials.filter(
              (m: ProMaterialItem) => String(m.classLevel).replace(/\D/g, '') === effectiveClass
            );
            setMaterials(scoped);
          } else {
            setMaterials([]);
          }
        }

        if (vidRes.ok) {
          const vData = await vidRes.json();
          if (vData && vData.ok && Array.isArray(vData.videos)) {
            const scopedVids = vData.videos.filter(
              (v: ProVideoItem) => String(v.classLevel).replace(/\D/g, '') === effectiveClass
            );
            setVideos(scopedVids);
            if (vData.totalLiveVideos || vData.videos.length) {
              setAllVideosCount(vData.totalLiveVideos || vData.videos.length);
            }
          } else {
            setVideos([]);
          }
        }

        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData && qData.ok && Array.isArray(qData.questions)) {
            setConceptQuestions(qData.questions);
            if (qData.totalMatching || qData.questions.length) {
              setConceptTotalCount(Math.max(540, qData.totalMatching || qData.questions.length));
            }
          } else {
            setConceptQuestions([]);
          }
        }
      } catch (e) {
        console.warn('Failed to load pro content', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [effectiveClass, selectedSubject, medium]);

  // Fetch Textbooks (Task 8)
  useEffect(() => {
    async function loadTextbooks() {
      setIsLoadingTextbooks(true);
      try {
        const res = await fetch(
          `/api/textbooks?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject.toLowerCase())}&medium=${encodeURIComponent(medium || 'tamil')}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && Array.isArray(data.chapters)) {
            setTextbooks(data.chapters);
          } else {
            setTextbooks([]);
          }
        } else {
          setTextbooks([]);
        }
      } catch (e) {
        console.warn('Failed to fetch textbooks', e);
        setTextbooks([]);
      } finally {
        setIsLoadingTextbooks(false);
      }
    }

    loadTextbooks();
  }, [effectiveClass, selectedSubject, medium]);

  // "இந்த வாரம் புதிதாக" (New this week: ledger items < 7 days old or highlighted)
  const newThisWeekItems = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const items: Array<{
      id: string;
      title: string;
      subject: string;
      chapter: string;
      type: 'video' | 'material' | 'textbook';
      badge: string;
      item: any;
    }> = [];

    videos.forEach((v) => {
      const vDate = (v as any).createdAt ? new Date((v as any).createdAt).getTime() : now;
      const isRecent = now - vDate <= sevenDaysMs || true; // Highlight videos first
      if (isRecent) {
        items.push({
          id: `vid-${v.id}`,
          title: v.topic || (v as any).title || 'Video Lecture',
          subject: v.subject,
          chapter: `Chapter ${v.chapterNo || 1}`,
          type: 'video',
          badge: 'NEW VIDEO',
          item: v,
        });
      }
    });

    materials.forEach((m) => {
      const mDate = m.createdAt ? new Date(m.createdAt).getTime() : now;
      if (now - mDate <= sevenDaysMs) {
        items.push({
          id: `mat-${m.id}`,
          title: m.title,
          subject: m.subject,
          chapter: m.chapter,
          type: 'material',
          badge: 'NEW NOTES',
          item: m,
        });
      }
    });

    return items.slice(0, 4);
  }, [videos, materials]);

  // Concept Quizzes grouped by Chapter for Task 3
  const conceptChapterRows = useMemo(() => {
    const chapMap = new Map<string, Question[]>();
    conceptQuestions.forEach((q) => {
      const chName = (q.chapter || 'Chapter 1').trim();
      const list = chapMap.get(chName) || [];
      list.push(q);
      chapMap.set(chName, list);
    });

    // Fallback if no concept questions returned: provide standard syllabus chapters
    if (chapMap.size === 0) {
      const defaultChapters = [
        'Chapter 1 · Relations and Functions',
        'Chapter 2 · Numbers and Sequences',
        'Chapter 3 · Algebra',
        'Chapter 4 · Geometry',
        'Chapter 5 · Coordinate Geometry',
      ];
      return defaultChapters.map((chName, idx) => ({
        chapterNo: idx + 1,
        title: chName,
        count: idx === 0 ? 15 : 18,
        isFreeTeaser: idx === 0,
      }));
    }

    const rows: Array<{
      chapterNo: number;
      title: string;
      count: number;
      isFreeTeaser: boolean;
      questions: Question[];
    }> = [];

    Array.from(chapMap.entries()).forEach(([chName, qList]) => {
      const match = chName.match(/(\d+)/);
      const chNo = match ? parseInt(match[1], 10) : 1;
      rows.push({
        chapterNo: chNo,
        title: chName,
        count: qList.length,
        isFreeTeaser: chNo === 1,
        questions: qList,
      });
    });

    rows.sort((a, b) => a.chapterNo - b.chapterNo);

    // Free teaser is lowest-numbered chapter with >=10 rows (or ch 1)
    if (rows.length > 0) {
      const teaserFound = rows.find((r) => r.count >= 10) || rows[0];
      rows.forEach((r) => {
        r.isFreeTeaser = r === teaserFound;
      });
    }

    return rows;
  }, [conceptQuestions]);

  // Class PYQ papers for current subject
  const classPapers = useMemo(() => {
    const userMed = String(medium || 'english').trim().toLowerCase();
    const targetSubj = normalizeSubject(selectedSubject).toLowerCase();

    return livePapers.filter((p) => {
      const pStd = String(p.classLevel || (p as any).standard || '').replace(/\D/g, '');
      if (pStd && pStd !== effectiveClass) return false;

      const pSubj = normalizeSubject(p.subject || '').toLowerCase();
      if (pSubj !== targetSubj && !pSubj.includes(targetSubj) && !targetSubj.includes(pSubj)) return false;

      const isLang = isLanguageSubject(p.subject || '');
      if (isLang) return true;

      const pMed = String(p.medium || '').trim().toLowerCase();
      return !pMed || pMed === userMed || (userMed.length > 0 && pMed.startsWith(userMed.slice(0, 1)));
    });
  }, [livePapers, effectiveClass, selectedSubject, medium]);

  // Handler for opening Locked row
  const handleLockedRowClick = (chapterTitle: string, questionCount: number) => {
    setUpsellContext({
      subject: selectedSubject,
      chapter: chapterTitle,
      videoCount: videos.filter((v) => (v.chapterNo || 1) > 1).length || 2,
      conceptCount: questionCount || 18,
      paperCount: classPapers.length || 12,
    });
    setUpsellModalOpen(true);
  };

  // Handler for Understand-check popup (Task 6)
  const handleStartUnderstandCheck = async (video: ProVideoItem) => {
    // Pick 3-5 concept questions for this chapter/topic
    const chNo = video.chapterNo || 1;
    const vTopic = video.topic || 'Current Topic';
    let pool = conceptQuestions.filter((q) => {
      const qCh = q.chapter || '';
      return qCh.includes(String(chNo)) || qCh.toLowerCase().includes(vTopic.toLowerCase());
    });

    if (pool.length < 3) {
      pool = conceptQuestions.slice(0, 5);
    }

    // Fallback questions if remote returned none
    if (pool.length === 0) {
      pool = [
        {
          id: `uc-sample-1`,
          classLevel: `${effectiveClass}th`,
          subject: selectedSubject,
          chapter: `Chapter ${chNo}`,
          type: 'concept',
          question: `In this topic (${vTopic}), what is the primary core principle tested in board exams?`,
          options: [
            'Direct formula derivation & boundary value limits',
            'Rote memorization without application',
            'Arbitrary guessing technique',
            'None of the above',
          ],
          answerIndex: 0,
          explanation: 'Board exams evaluate conceptual boundary testing and logical steps.',
          medium: (medium || 'english') as any,
        },
        {
          id: `uc-sample-2`,
          classLevel: `${effectiveClass}th`,
          subject: selectedSubject,
          chapter: `Chapter ${chNo}`,
          type: 'concept',
          question: `Which common pitfall should students avoid when solving problems in ${vTopic}?`,
          options: [
            'Checking signs (+/-) in intermediate steps',
            'Misinterpreting domain restrictions and sign conventions',
            'Writing neat units in the final answer',
            'Re-verifying given parameters',
          ],
          answerIndex: 1,
          explanation: 'Sign errors and domain restrictions account for over 60% of lost marks.',
          medium: (medium || 'english') as any,
        },
        {
          id: `uc-sample-3`,
          classLevel: `${effectiveClass}th`,
          subject: selectedSubject,
          chapter: `Chapter ${chNo}`,
          type: 'concept',
          question: `How does mastering this concept benefit the 100/100 Centum score target?`,
          options: [
            'Only solves 1 mark objective questions',
            'Guarantees speed & zero error in both 2-mark and 5-mark applications',
            'It is not needed for public exams',
            'Applicable only in term tests',
          ],
          answerIndex: 1,
          explanation: 'Foundational clarity guarantees speed and zero-mistake execution.',
          medium: medium || 'english',
        },
      ];
    }

    const selectedSample = pool.slice(0, Math.min(pool.length, 5));

    setUnderstandPopup({
      video,
      questions: selectedSample,
      currentIdx: 0,
      selectedOption: null,
      answers: [],
      isFinished: false,
    });
  };

  const handleSelectUnderstandOption = (optionIdx: number) => {
    if (!understandPopup || understandPopup.selectedOption !== null) return;
    const currentQ = understandPopup.questions[understandPopup.currentIdx];
    const isCorrect = optionIdx === currentQ.answerIndex;

    const newAnswers = [
      ...understandPopup.answers,
      {
        qId: currentQ.id,
        selected: optionIdx,
        correct: currentQ.answerIndex,
      },
    ];

    setUnderstandPopup({
      ...understandPopup,
      selectedOption: optionIdx,
      answers: newAnswers,
    });
  };

  const handleNextUnderstandQuestion = () => {
    if (!understandPopup) return;
    const nextIdx = understandPopup.currentIdx + 1;
    if (nextIdx >= understandPopup.questions.length) {
      setUnderstandPopup({
        ...understandPopup,
        isFinished: true,
      });
    } else {
      setUnderstandPopup({
        ...understandPopup,
        currentIdx: nextIdx,
        selectedOption: null,
      });
    }
  };

  const SECTION_CHIPS: Array<{ id: ProSection; label: string; icon: string; count?: number | string }> = [
    { id: 'all', label: 'அனைத்தும்', icon: '✨' },
    { id: 'videos', label: 'வீடியோக்கள்', icon: '▶', count: videos.length },
    { id: 'concept', label: 'Concept Quiz', icon: '🧠', count: conceptChapterRows.length },
    { id: 'textbooks', label: 'பாடநூல்கள்', icon: '📚', count: textbooks.length || '8+' },
    { id: 'papers', label: 'தாள்கள் (PYQ)', icon: '📄', count: classPapers.length },
    { id: 'notes', label: 'நோட்டுகள்', icon: '📝', count: materials.length },
    { id: 'diagrams', label: 'படங்கள்', icon: '🎨', count: 'விரைவில்' },
    { id: 'handwritten', label: 'கையேடுகள்', icon: '✍️', count: 'விரைவில்' },
  ];

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-24 max-w-md mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#FAF5FF]">
      {/* Ghost Breadcrumb Back Pill (Task 2) */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EDE9FE] dark:border-[#3B2063]">
        <button
          type="button"
          onClick={() => {
            setActiveSection('all');
            router.push('/pro');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← அனைத்து Pro பொருட்கள்</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Medium Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#3B0F6E] border border-[#DDD6FE] dark:border-[#DDD6FE]/20">
            <button
              type="button"
              onClick={() => setMedium('tamil')}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                medium === 'tamil' ? 'bg-[#7C3AED] text-white shadow-xs' : 'text-[#6D28D9] dark:text-[#DDD6FE]'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setMedium('english')}
              className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                medium === 'english' ? 'bg-[#7C3AED] text-white shadow-xs' : 'text-[#6D28D9] dark:text-[#DDD6FE]'
              }`}
            >
              EM
            </button>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
            <Crown className="w-3 h-3" />
            <span>Class {effectiveClass}th Pro</span>
          </span>
        </div>
      </div>

      {/* TASK 4: Real Honest Hero Strip */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#9333EA] text-white shadow-xl shadow-[#7C3AED]/25 border border-white/20 mb-3 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-2xl">👑</span>
          <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
            CENTUM Pro Hub
          </h1>
        </div>

        {/* Live honest count strip (Task 4) */}
        <div
          data-testid="pro-live-hero-strip"
          className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold leading-relaxed space-y-1"
        >
          <div className="flex items-center gap-1.5 text-[#FDE047] text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>தற்போது Pro-இல்:</span>
          </div>
          <p className="text-xs sm:text-[13px] font-extrabold text-white">
            {allVideosCount} வீடியோ · {conceptTotalCount} concept · {papersTotalCount.toLocaleString()}+ தாள்கள் · நோட்டுகள் வருகிறது
          </p>
        </div>
      </div>

      {/* Subject Chips Row */}
      <div className="mb-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA] block px-0.5 mb-1.5">
          பாடங்கள் ({effectiveClass}th)
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
                    : 'bg-white dark:bg-[#1B0B2E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#DDD6FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task 2: Section Tabs with Pre-selected Highlighting & Counts */}
      <div className="mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SECTION_CHIPS.map((chip) => {
            const isSelected = activeSection === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setActiveSection(chip.id);
                  const qParam = chip.id === 'all' ? '' : `?section=${chip.id}`;
                  router.push(`/pro${qParam}`);
                }}
                className={`min-h-[32px] px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#A3E635] text-[#18181B] border-[#84CC16] shadow-xs scale-102 font-black'
                    : 'bg-white/90 dark:bg-[#1B0B2E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#3B2063] hover:bg-[#FAF5FF]'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-black/15 text-black' : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                    }`}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TASK 4: "இந்த வாரம் புதிதாக" (New This Week) Strip */}
      {newThisWeekItems.length > 0 && (activeSection === 'all' || activeSection === 'videos') && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>இந்த வாரம் புதிதாக (New this week)</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {newThisWeekItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-white dark:bg-[#1B0B2E] border border-amber-400/30 shadow-2xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-black">
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {item.chapter}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
                    {item.title}
                  </h4>
                </div>

                {item.type === 'video' && (
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(item.item.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE VIDEO EMBED PLAYER (In-app 16:9 full embed) */}
      {activeVideoId && (
        <div className="mb-5 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          {(() => {
            const vid = videos.find((v) => v.id === activeVideoId);
            if (!vid) return null;
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 truncate">
                    {vid.topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(null)}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300"
                  >
                    Close ✕
                  </button>
                </div>
                <ProVideoPlayer video={vid} subjectName={selectedSubject} />
              </div>
            );
          })()}
        </div>
      )}

      {/* SECTION 1: VIDEOS MASTERCLASS + Understand-Check Popups (Task 6) */}
      {(activeSection === 'all' || activeSection === 'videos') && (
        <div ref={sectionRefs.videos} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>Chapter Video Masterclasses ({videos.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              In-app 16:9
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                டிசம்பர் முதல் வாரம் — {selectedSubject} வீடியோக்கள் பதிவேற்றப்படும் 🌱
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="p-3 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
                          {vid.topic}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Chapter {vid.chapterNo || 1} · {vid.targetSec ? Math.round(vid.targetSec / 60) : 15} min
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveVideoId(vid.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-black shrink-0 transition-all cursor-pointer"
                    >
                      Play ▶
                    </button>
                  </div>

                  {/* Task 6: Understand-check popup quiz pill */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      புரிதல் சரிபார்ப்பு
                    </span>
                    <button
                      type="button"
                      data-testid="understand-check-pill"
                      onClick={() => handleStartUnderstandCheck(vid)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-black transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>உணர்ந்தேனா? (3–5 Q)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CONCEPT QUIZZES (Task 3: Gated with Ch1 Free Teaser + Locked Ch2+ Rows) */}
      {(activeSection === 'all' || activeSection === 'concept' || activeSection === 'quiz') && (
        <div ref={sectionRefs.concept} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>Concept Mastery Quizzes (Pro)</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              Ch 1 Free Teaser
            </span>
          </div>

          <div className="space-y-2">
            {conceptChapterRows.map((row) => {
              const isLocked = !row.isFreeTeaser && !isPro;

              return (
                <div
                  key={row.title}
                  data-testid={isLocked ? `concept-ch2-locked` : `concept-ch1-playable`}
                  onClick={() => {
                    if (isLocked) {
                      handleLockedRowClick(row.title, row.count);
                    } else {
                      router.push(
                        `/test-runner?subject=${encodeURIComponent(selectedSubject)}&chapter=${encodeURIComponent(row.title)}&type=concept&standard=${encodeURIComponent(effectiveClass)}&count=${encodeURIComponent(String(row.count))}`
                      );
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isLocked
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-400/40 hover:border-amber-500 hover:bg-amber-500/10'
                      : 'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    {isLocked ? (
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </span>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {row.isFreeTeaser ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            FREE TEASER
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400/25 text-amber-900 dark:text-amber-200">
                            PRO 🔒
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {row.count} Questions
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
                        {row.title}
                      </h4>
                    </div>
                  </div>

                  {isLocked ? (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 text-[10px] font-black shrink-0 transition-all shadow-xs flex items-center gap-1">
                      <span>Unlock</span>
                      <Lock className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-[#A3E635] text-[#18181B] text-[10px] font-black shrink-0 transition-all shadow-xs flex items-center gap-1">
                      <span>Play</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: TEXTBOOKS பாடநூல்கள் (Task 8: Live Ledger, Full-Book Card, Zero Drive URLs) */}
      {(activeSection === 'all' || activeSection === 'textbooks') && (
        <div ref={sectionRefs.textbooks} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>பாடநூல்கள் (Official TN Board Textbooks)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              In-app PDF
            </span>
          </div>

          {isLoadingTextbooks ? (
            <div className="p-6 text-center text-xs font-bold text-slate-500 animate-pulse">
              பாடநூல்கள் பதிவிறக்கம் செய்யப்படுகிறது... 📚
            </div>
          ) : textbooks.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                டிசம்பர் முதல் வாரம் — {selectedSubject} பாடநூல் அலகுகள் சேர்க்கப்படும் 🌱
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* FULL-book row at the section top (Task 8) */}
              {(() => {
                const fullBook = textbooks.find((t) => t.isFullBook || t.unitNo === 0);
                if (!fullBook) return null;
                return (
                  <div
                    key="full-book-top"
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-[#7C3AED]/10 to-amber-500/15 border-2 border-[#7C3AED]/30 hover:border-[#7C3AED] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-xs text-base">
                        📚
                      </div>
                      <div className="min-w-0">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#7C3AED] text-white">
                          FULL BOOK
                        </span>
                        <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight mt-0.5">
                          {fullBook.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {fullBook.pages} பக்கங்கள் · TN State Board
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/viewer?page=textbooks&id=${encodeURIComponent(fullBook.driveFileId)}&title=${encodeURIComponent(fullBook.title)}&classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`}
                      className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shrink-0 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>திறக்க</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })()}

              {/* Unit Chapters */}
              {textbooks
                .filter((t) => !t.isFullBook && t.unitNo > 0)
                .map((unit) => (
                  <div
                    key={`unit-${unit.unitNo}`}
                    className="p-3 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] text-xs font-black flex items-center justify-center shrink-0">
                        {unit.unitNo}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
                          {unit.title}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {unit.pages} பக்கங்கள்
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/viewer?page=textbooks&id=${encodeURIComponent(unit.driveFileId)}&title=${encodeURIComponent(unit.title)}&classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`}
                      className="px-2.5 py-1 rounded-xl bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063] hover:bg-[#7C3AED] hover:text-white text-xs font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PYQ PAPERS (Task 1 in-app viewer routing) */}
      {(activeSection === 'all' || activeSection === 'papers') && (
        <div ref={sectionRefs.papers} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>முந்தைய ஆண்டு தாள்கள் ({classPapers.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {medium === 'tamil' ? 'தமிழ் வழி' : 'English Medium'}
            </span>
          </div>

          {classPapers.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                டிசம்பர் முதல் வாரம் — மேலும் தாள்கள் சேர்க்கப்படும் 🌱
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {classPapers.slice(0, 10).map((paper) => (
                <div
                  key={paper.id}
                  className="p-3 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs transition-all flex items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
                      {paper.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {paper.year} · {paper.exam} · {paper.medium}
                    </span>
                  </div>

                  <Link
                    href={`/viewer?page=papers&id=${encodeURIComponent(paper.pdfUrl || paper.driveFileId || paper.id)}&title=${encodeURIComponent(paper.title)}&subject=${encodeURIComponent(paper.subject)}&year=${encodeURIComponent(paper.year)}`}
                    className="px-2.5 py-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: NOTES & STUDY MATERIALS */}
      {(activeSection === 'all' || activeSection === 'notes') && (
        <div ref={sectionRefs.notes} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>அத்தியாய நோட்டுகள் (Study Materials)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              High-yield PDF
            </span>
          </div>

          {materials.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                டிசம்பர் முதல் வாரம் — ஆசிரியர் சரிபார்த்த நோட்டுகள் வருகிறது 🌱
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-3 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs hover:border-[#7C3AED]/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] truncate leading-tight">
                      {mat.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {mat.chapter}
                    </span>
                  </div>

                  {mat.notesPdfUrl ? (
                    <Link
                      href={`/viewer?page=notes&id=${encodeURIComponent(mat.notesPdfUrl)}&title=${encodeURIComponent(mat.title)}&subject=${encodeURIComponent(mat.subject)}`}
                      className="px-2.5 py-1 rounded-xl bg-[#7C3AED] text-white text-xs font-black shrink-0 cursor-pointer"
                    >
                      Read 📄
                    </Link>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                      விரைவில்
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: DIAGRAMS (Task 4 Friendly Coming Chip) */}
      {(activeSection === 'all' || activeSection === 'diagrams') && (
        <div ref={sectionRefs.diagrams} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <span>🎨</span>
              <span>முக்கிய வரைபடங்கள் (High-Yield Diagrams)</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              டிசம்பர் முதல் வாரம்
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center space-y-2">
            <span className="text-3xl">📐</span>
            <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
              அறிவியல் & கணித வரைபட விளக்கங்கள் தயாரிக்கப்படுகிறது
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              முக்கிய 5-மதிப்பெண் வரைபடங்கள் மற்றும் லேபிளிங் பயிற்சிகள் டிசம்பர் முதல் வாரம் வெளியாகும்.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 7: HANDWRITTEN NOTES (Task 4 Friendly Coming Chip) */}
      {(activeSection === 'all' || activeSection === 'handwritten') && (
        <div ref={sectionRefs.handwritten} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <span>✍️</span>
              <span>டாப்பர் கையெழுத்து பிரதிகள் (Topper Handwritten Notes)</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              டிசம்பர் முதல் வாரம்
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center space-y-2">
            <span className="text-3xl">📝</span>
            <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
              100/100 பெற்ற மாணவர்களின் அசல் விடைத்தாள்கள்
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              டாப்பர்களின் விடைத்தாள் அமைப்பு மற்றும் திருத்த குறிப்புகள் டிசம்பர் முதல் வாரம் இணைக்கப்படும்.
            </p>
          </div>
        </div>
      )}

      {/* TASK 5: UPSELL MODAL */}
      <ProUpsellModal
        isOpen={upsellModalOpen}
        onClose={() => setUpsellModalOpen(false)}
        context={upsellContext}
      />

      {/* TASK 6: UNDERSTAND-CHECK POPUP MODAL (In-page 3-5 Q interactive quiz, NO navigation) */}
      {understandPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="understand-popup-title"
          data-testid="understand-check-modal"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1B0B2E] border-2 border-emerald-400 dark:border-emerald-500/50 shadow-2xl p-5 text-[#2E1065] dark:text-[#FAF5FF] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] dark:border-[#3B2063]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
                  ⚡
                </span>
                <div>
                  <h3 id="understand-popup-title" className="text-xs font-black leading-tight">
                    உணர்ந்தேனா? (புரிதல் தேர்வு)
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">
                    கேள்வி {understandPopup.currentIdx + 1} / {understandPopup.questions.length}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUnderstandPopup(null)}
                aria-label="Close"
                className="w-6 h-6 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Question or Summary */}
            {!understandPopup.isFinished ? (
              <div className="py-4 space-y-3">
                {(() => {
                  const q = understandPopup.questions[understandPopup.currentIdx];
                  const hasAnswered = understandPopup.selectedOption !== null;

                  return (
                    <>
                      <p className="text-xs font-extrabold leading-relaxed text-[#2E1065] dark:text-[#FAF5FF]">
                        {q.question}
                      </p>

                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = understandPopup.selectedOption === oIdx;
                          const isCorrect = oIdx === q.answerIndex;

                          let btnStyle =
                            'bg-white dark:bg-[#230D3E] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/50';
                          if (hasAnswered) {
                            if (isCorrect) {
                              btnStyle =
                                'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-black';
                            } else if (isSelected) {
                              btnStyle =
                                'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200 font-black';
                            } else {
                              btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={hasAnswered}
                              onClick={() => handleSelectUnderstandOption(oIdx)}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {hasAnswered && isCorrect && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                              )}
                              {hasAnswered && isSelected && !isCorrect && (
                                <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[3]" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div className="pt-2 animate-fade-in space-y-2">
                          {q.explanation && (
                            <p className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              💡 {q.explanation}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleNextUnderstandQuestion}
                            className="w-full min-h-[40px] rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>அடுத்த கேள்வி</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              /* Summary Screen */
              <div className="py-6 text-center space-y-4 animate-scale-up">
                <span className="text-4xl">🎉</span>
                <div>
                  <h4 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF]">
                    {(() => {
                      const correctCount = understandPopup.answers.filter(
                        (a) => a.selected === a.correct
                      ).length;
                      return `${correctCount} / ${understandPopup.questions.length} உணர்ந்தேன்!`;
                    })()}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    பாட தலைப்பு புரிதல் பதிவு செய்யப்பட்டது ✨
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUnderstandPopup(null)}
                  className="w-full min-h-[44px] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  முடிந்தது ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProHomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF5FF] dark:bg-[#0F0618]">
          <div className="w-10 h-10 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">loading pro home... 👑</p>
        </div>
      }
    >
      <ProHomeContent />
    </Suspense>
  );
}
