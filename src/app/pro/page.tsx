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
import {
  getCanonicalSubjects,
  normalizeSubject,
  hasSubjectContent,
  normalizeStream,
} from '@/data/canonicalSubjects';
import { isLanguageSubject } from '@/lib/data';
import rawPapers from '@/data/papers.json';
import { Paper, Question } from '@/types';

export interface ProMaterialShelfItem {
  id: string;
  labelEn: string;
  labelTa: string;
  icon: string;
  substrate: 'concept-quiz' | 'pyq-solved' | 'video-lessons' | 'notes-formula' | 'impq-bank' | 'mock-tests' | 'oneword-drill' | 'doubt-clearing';
  status: 'live' | 'coming';
}

export const proMaterials: ProMaterialShelfItem[] = [
  {
    id: 'concept-quiz',
    labelEn: 'Concept Quiz',
    labelTa: 'கருத்துத் தேர்வு',
    icon: '🧠',
    substrate: 'concept-quiz',
    status: 'live',
  },
  {
    id: 'pyq-solved',
    labelEn: 'PYQ with Full Solutions',
    labelTa: 'முழு விடையுடன் முந்தைய தாள்கள்',
    icon: '📄',
    substrate: 'pyq-solved',
    status: 'live',
  },
  {
    id: 'video-lessons',
    labelEn: 'Video Lessons',
    labelTa: 'வீடியோ வகுப்புகள்',
    icon: '▶',
    substrate: 'video-lessons',
    status: 'coming',
  },
  {
    id: 'notes-formula',
    labelEn: 'Notes & Formula Sheets',
    labelTa: 'நோட்டுகள் & சூத்திரத் தாள்கள்',
    icon: '📝',
    substrate: 'notes-formula',
    status: 'coming',
  },
  {
    id: 'impq-bank',
    labelEn: 'Important Questions Bank',
    labelTa: 'முக்கிய வினா வங்கி',
    icon: '🎯',
    substrate: 'impq-bank',
    status: 'live',
  },
  {
    id: 'mock-tests',
    labelEn: 'Full Mock Tests',
    labelTa: 'முழு மாதிரித் தேர்வுகள்',
    icon: '⏱️',
    substrate: 'mock-tests',
    status: 'coming',
  },
  {
    id: 'oneword-drill',
    labelEn: 'One-Word Drill',
    labelTa: 'ஒரு மதிப்பெண் பயிற்சி',
    icon: '⚡',
    substrate: 'oneword-drill',
    status: 'live',
  },
  {
    id: 'doubt-clearing',
    labelEn: 'Doubt Clearing',
    labelTa: 'சந்தேக தீர்வு',
    icon: '💬',
    substrate: 'doubt-clearing',
    status: 'coming',
  },
];

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
  id?: string;
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

  const [streamOverride, setStreamOverride] = useState<string>('');
  const effectiveStream = streamOverride || student?.stream;

  const canonicalSubjects = useMemo(() => {
    return getCanonicalSubjects(effectiveClass, effectiveStream);
  }, [effectiveClass, effectiveStream]);

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
  const [onewordQuestions, setOnewordQuestions] = useState<Question[]>([]);
  const [lockedChapters, setLockedChapters] = useState<Array<{ chapter: string; count: number; locked: boolean }>>([]);
  const [conceptTotalCount, setConceptTotalCount] = useState<number>(240);
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
        const [matRes, vidRes, qRes, owRes] = await Promise.all([
          fetch(
            `/api/pro-materials?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
          fetch(
            `/api/pro-videos?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`
          ),
          fetch(
            `/api/questions?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}&type=concept&count=all&medium=${encodeURIComponent(medium || 'english')}`
          ),
          fetch(
            `/api/questions?classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}&type=oneword&count=10&medium=${encodeURIComponent(medium || 'english')}`
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
            setAllVideosCount(scopedVids.length);
          } else {
            setVideos([]);
            setAllVideosCount(0);
          }
        }

        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData && qData.ok && Array.isArray(qData.questions)) {
            setConceptQuestions(qData.questions);
            if (Array.isArray(qData.lockedChapters)) {
              setLockedChapters(qData.lockedChapters);
            } else {
              setLockedChapters([]);
            }
            const poolCount = qData.sheetTotal ?? qData.totalMatching ?? (medium ? 240 : 480);
            setConceptTotalCount(poolCount);
          } else {
            setConceptQuestions([]);
            setLockedChapters([]);
            setConceptTotalCount(medium ? 240 : 480);
          }
        }

        if (owRes.ok) {
          const owData = await owRes.json();
          if (owData && owData.ok && Array.isArray(owData.questions)) {
            setOnewordQuestions(owData.questions);
          } else {
            setOnewordQuestions([]);
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

    // Free user server-side paywall: append locked chapters 2–8
    if (!isPro) {
      if (lockedChapters.length > 0) {
        lockedChapters.forEach((lc) => {
          const match = String(lc.chapter).match(/(\d+)/);
          const chNo = match ? parseInt(match[1], 10) : 2;
          if (!rows.some((r) => r.chapterNo === chNo)) {
            rows.push({
              chapterNo: chNo,
              title: `Chapter ${chNo}`,
              count: lc.count || 30,
              isFreeTeaser: false,
              questions: [],
            });
          }
        });
      } else if (rows.length < 8) {
        // Fallback for standard 8 chapters
        for (let ch = 2; ch <= 8; ch++) {
          if (!rows.some((r) => r.chapterNo === ch)) {
            rows.push({
              chapterNo: ch,
              title: `Chapter ${ch}`,
              count: 30,
              isFreeTeaser: false,
              questions: [],
            });
          }
        }
      }
    }

    rows.sort((a, b) => a.chapterNo - b.chapterNo);

    // Free teaser is lowest-numbered chapter with >=10 rows (or ch 1)
    if (rows.length > 0) {
      const teaserFound = rows.find((r) => r.count >= 10) || rows[0];
      rows.forEach((r) => {
        r.isFreeTeaser = r === teaserFound;
      });
    }

    return rows;
  }, [conceptQuestions, lockedChapters, isPro]);

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
      conceptCount: questionCount || 30,
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

  const isTamil = Boolean(student?.medium ? String(student.medium).toLowerCase().startsWith('t') : medium === 'tamil');

  // Handler for opening Locked tile from the proMaterials shelf
  const handleLockedTileClick = (item: ProMaterialShelfItem) => {
    setUpsellContext({
      subject: selectedSubject,
      chapter: isTamil ? item.labelTa : item.labelEn,
      videoCount: 2,
      conceptCount: 30,
      paperCount: classPapers.length || 12,
    });
    setUpsellModalOpen(true);
  };

  const handleConceptQuizClick = () => {
    if (sectionRefs.concept.current) {
      sectionRefs.concept.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(
        `/test-runner?subject=${encodeURIComponent(selectedSubject)}&type=concept&standard=${encodeURIComponent(effectiveClass)}&count=15`
      );
    }
  };

  const renderSubstrate = (item: ProMaterialShelfItem) => {
    switch (item.id) {
      case 'concept-quiz': {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>{conceptChapterRows.length} {isTamil ? 'பாட அலகுகள்' : 'Chapters Available'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">{isTamil ? 'நேரலை' : 'Ready to Play'}</span>
            </div>
            <div className="space-y-1.5">
              {conceptChapterRows.slice(0, 3).map((ch) => (
                <div key={ch.title} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#230D3E] text-xs">
                  <span className="font-bold text-[#2E1065] dark:text-[#FAF5FF] truncate max-w-[170px]">
                    {ch.title}
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {ch.count} Qs
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConceptQuizClick();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-[#A3E635] hover:bg-[#86efac] text-[#18181B] text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{isTamil ? 'தொடங்குக' : 'Launch Concept Quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      }

      case 'pyq-solved': {
        const pyqPapers = classPapers.filter(
          (p) => (p.category || 'pyq').toLowerCase() === 'pyq'
        );
        const displayPapers =
          pyqPapers.length > 0
            ? pyqPapers.slice(0, 3)
            : livePapers
                .filter((p) => (p.category || 'pyq').toLowerCase() === 'pyq')
                .slice(0, 3);

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>{pyqPapers.length || livePapers.length} {isTamil ? 'முழு விடைத்தாள்கள்' : 'Papers with Solutions'}</span>
              <span className="text-amber-600 font-bold">100% Solved</span>
            </div>
            <div className="space-y-1.5">
              {displayPapers.map((paper, idx) => (
                <div key={paper.id || idx} className="p-2 rounded-xl bg-slate-50 dark:bg-[#230D3E] text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#7C3AED] dark:text-[#A78BFA]">
                      {paper.year} · {paper.exam}
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-700 dark:text-amber-300">
                      Step Solutions
                    </span>
                  </div>
                  <p className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                    {paper.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'video-lessons': {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-amber-600 dark:text-amber-400 font-bold">{isTamil ? 'விரைவில் 🌱' : 'Coming soon 🌱'}</span>
              <span>6 Skeleton Tiles</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#230D3E] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 h-[60px] text-center"
                >
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] text-slate-400">
                    ▶
                  </div>
                  <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
                  <span className="text-[7.5px] font-bold text-slate-400">{isTamil ? 'விரைவில்' : 'Coming soon'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'notes-formula': {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-amber-600 dark:text-amber-400 font-bold">{isTamil ? 'விரைவில் 🌱' : 'Coming soon 🌱'}</span>
              <span>6 Skeleton Cards</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#230D3E] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 h-[60px] text-center"
                >
                  <div className="w-4 h-4 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] text-slate-400">
                    📝
                  </div>
                  <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
                  <span className="text-[7.5px] font-bold text-slate-400">{isTamil ? 'விரைவில்' : 'Coming soon'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'impq-bank': {
        const impTitles =
          materials.length > 0
            ? materials.map((m) => m.title)
            : [
                '10th Maths Top Centum 5-Mark Questions (Golden Questions)',
                '10th Science Essential Diagrams & Laws ImpQ Bank',
                'Chapter 1 · Relations & Functions Top 2-Mark & 5-Mark Bank',
                'Chapter 2 · Numbers & Sequences Compulsory Questions Bank',
              ];

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>Drive Curated Bank</span>
              <span className="text-amber-600 font-bold">5-Mark & 2-Mark</span>
            </div>
            <div className="space-y-1.5">
              {impTitles.slice(0, 3).map((title, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-[#230D3E] text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">
                      DRIVE VAULT
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-800 dark:text-amber-200">
                      Golden ImpQ
                    </span>
                  </div>
                  <p className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                    {title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'mock-tests': {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-amber-600 dark:text-amber-400 font-bold">{isTamil ? 'விரைவில் 🌱' : 'Coming soon 🌱'}</span>
              <span>4 Skeleton Cards</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#230D3E] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col justify-between h-[64px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">⏱️</span>
                    <span className="text-[8px] font-bold text-slate-400">{isTamil ? 'விரைவில்' : 'Coming soon'}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'oneword-drill': {
        const questionsToShow =
          onewordQuestions.length > 0
            ? onewordQuestions.slice(0, 3)
            : [
                {
                  id: 'ow-1',
                  question: 'If n(A × B) = 20 and n(A) = 5 then n(B) is',
                  options: ['5', '4', '15', '25'],
                  chapter: 'Chapter 1',
                },
                {
                  id: 'ow-2',
                  question: 'The range of relation R = {(x, x²) | x is prime < 13} is',
                  options: ['{4, 9, 25, 49, 121}', '{2, 3, 5, 7, 11}'],
                  chapter: 'Chapter 1',
                },
                {
                  id: 'ow-3',
                  question: 'If ordered pairs (a + 2, 4) and (5, 2a + b) are equal, then (a, b) is',
                  options: ['(3, -2)', '(2, -2)'],
                  chapter: 'Chapter 1',
                },
              ];

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>Instant 1-Mark Bank</span>
              <span className="text-emerald-600 font-bold">Real Live Rows</span>
            </div>
            <div className="space-y-1.5">
              {questionsToShow.map((q, idx) => (
                <div key={q.id || idx} className="p-2 rounded-xl bg-slate-50 dark:bg-[#230D3E] text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#7C3AED] dark:text-[#A78BFA]">
                      {q.chapter || 'Book-Back Drill'}
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      1-Mark
                    </span>
                  </div>
                  <p className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                    {q.question}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'doubt-clearing': {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-amber-600 dark:text-amber-400 font-bold">{isTamil ? 'விரைவில் 🌱' : 'Coming soon 🌱'}</span>
              <span>3 Skeleton Cards</span>
            </div>
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#230D3E] border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                      💬
                    </div>
                    <div className="space-y-1">
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{isTamil ? 'விரைவில்' : 'Coming soon'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const SECTION_CHIPS: Array<{ id: ProSection; label: string; icon: string; count?: number | string }> = [
    { id: 'all', label: isTamil ? 'அனைத்தும்' : 'All', icon: '✨' },
    { id: 'videos', label: isTamil ? 'வீடியோக்கள்' : 'Videos', icon: '▶', count: videos.length },
    { id: 'concept', label: isTamil ? 'கருத்துத் தேர்வு' : 'Concept Quiz', icon: '🧠', count: conceptChapterRows.length },
    { id: 'notes', label: isTamil ? 'நோட்டுகள்' : 'Notes', icon: '📝', count: materials.length },
    { id: 'papers', label: isTamil ? 'தாள்கள் (PYQ)' : 'Papers (PYQ)', icon: '📄', count: classPapers.length },
    { id: 'textbooks', label: isTamil ? 'பாடநூல்கள்' : 'Textbooks', icon: '📚', count: textbooks.length || '8+' },
    { id: 'diagrams', label: isTamil ? 'படங்கள்' : 'Diagrams', icon: '🎨', count: isTamil ? 'விரைவில்' : 'Soon' },
    { id: 'handwritten', label: isTamil ? 'கையேடுகள்' : 'Handwritten', icon: '✍️', count: isTamil ? 'விரைவில்' : 'Soon' },
  ];

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-24 max-w-2xl mx-auto w-full animate-fade-in text-[#2E1065] dark:text-[#FAF5FF]">
      {/* Ghost Breadcrumb Back Pill */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EDE9FE] dark:border-[#3B2063]">
        <button
          type="button"
          onClick={() => {
            setActiveSection('all');
            router.push('/pro');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF5FF] dark:bg-[#1B0B2E] border border-[#DDD6FE] dark:border-[#3B2063] text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#EDE9FE] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isTamil ? '← அனைத்து Pro பொருட்கள்' : '← All Pro Materials'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>Class {effectiveClass}th Pro</span>
          </span>
        </div>
      </div>

      {/* Clean Pro Hub Hero (Brief C - No count numbers) */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#2E1065] text-white shadow-xl shadow-[#7C3AED]/25 border border-white/20 mb-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#A3E635] text-[11px] font-black uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>CENTUM Pro Masterclass Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1">
            {isTamil ? `${effectiveClass}ஆம் வகுப்பு Pro கற்றல் தளம்` : `Class ${effectiveClass}th Pro Learning Hub`}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-white/85 leading-relaxed max-w-sm">
            {isTamil
              ? 'வீடியோ வகுப்புகள், அத்தியாய வாரியான கருத்துத் தேர்வுகள், அரசு பாடநூல்கள் & முந்தைய ஆண்டு வினாத்தாள்கள்.'
              : 'Masterclasses, chapter concept mastery quizzes, official state textbooks & past examination papers.'}
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-[#A3E635]/15 blur-2xl pointer-events-none" />
        <div className="absolute right-4 top-4 text-4xl opacity-20 pointer-events-none">👑</div>
      </div>

      {/* Enlarged Subject Chips Row (Brief C) */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
            {isTamil ? `பாடங்கள் (${effectiveClass}th)` : `Subjects (${effectiveClass}th)`}
          </span>
          {parseInt(effectiveClass, 10) >= 11 && (
            <div className="flex items-center gap-1">
              {(['maths', 'bio', 'commerce'] as const).map((st) => {
                const activeStream = normalizeStream(effectiveStream);
                const isStActive = activeStream === st;
                const label = st === 'maths' ? (isTamil ? 'கணிதம்' : 'Maths') : st === 'bio' ? (isTamil ? 'உயிரியல்' : 'Biology') : (isTamil ? 'வணிகவியல்' : 'Commerce');
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStreamOverride(st);
                    }}
                    className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-black transition-all border ${
                      isStActive
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'bg-white dark:bg-[#1B0B2E] text-slate-500 border-[#DDD6FE] dark:border-[#3B2063]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
          {canonicalSubjects.map((sub) => {
            const isSelected = selectedSubject.toLowerCase() === sub.toLowerCase();
            const hasContent = hasSubjectContent(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-[#7C3AED]/30 scale-[1.02]'
                    : 'bg-white dark:bg-[#1B0B2E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/50 hover:bg-[#FAF5FF]'
                }`}
              >
                <span>{sub}</span>
                {!hasContent && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400">
                    {isTamil ? 'விரைவில் 🌱' : 'Soon 🌱'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enlarged Type/Section Filters (Brief C) */}
      <div className="mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
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
                className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white border-[#6D28D9] shadow-md shadow-[#7C3AED]/30 scale-[1.02]'
                    : 'bg-white/90 dark:bg-[#1B0B2E] text-[#6D28D9] dark:text-[#DDD6FE] border-[#EDE9FE] dark:border-[#3B2063] hover:bg-[#FAF5FF]'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#EDE9FE] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA]'
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

      {/* PRO MATERIALS SHELF (Locked-and-blurred 8-item shelf) */}
      {activeSection === 'all' && (
        <div className="mb-8 space-y-3" data-testid="pro-materials-shelf">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500 fill-current" />
              <span>{isTamil ? 'Pro பாடப்பொருட்கள் பெட்டகம் (Material Shelf)' : 'Pro Materials Shelf'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              8 Material Vaults
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {proMaterials.map((item) => {
              const isUnlocked = item.id === 'concept-quiz' || isPro;
              const isComingSoon = item.status === 'coming';
              const label = isTamil ? item.labelTa : item.labelEn;

              return (
                <div
                  key={item.id}
                  data-testid={`pro-tile-${item.id}`}
                  data-substrate={item.status === 'live' ? 'real' : 'skeleton'}
                  data-status={item.status}
                  data-locked={!isUnlocked}
                  onClick={() => {
                    if (!isUnlocked) {
                      handleLockedTileClick(item);
                    } else if (item.id === 'concept-quiz') {
                      handleConceptQuizClick();
                    }
                  }}
                  className={`pro-material-tile relative rounded-2xl border text-left flex flex-col justify-between overflow-hidden shadow-xs transition-all h-[240px] sm:h-[260px] ${
                    isUnlocked
                      ? 'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/50'
                      : 'bg-white dark:bg-[#1B0B2E] border-slate-200 dark:border-slate-800/90 cursor-pointer hover:border-[#7C3AED]/50'
                  }`}
                >
                  {/* Tile Header Bar */}
                  <div className="p-3.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0 z-10 bg-white/60 dark:bg-[#1B0B2E]/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] truncate">
                          {label}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                          {item.status === 'live'
                            ? (isTamil ? 'உடனடி நேரலை' : 'Live Material')
                            : (isTamil ? 'விரைவில்' : 'Coming soon')}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {isTamil ? 'திறக்கப்பட்டது ✓' : 'UNLOCKED'}
                        </span>
                      ) : isComingSoon ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {isTamil ? 'விரைவில் 🌱' : 'COMING SOON'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400/25 text-amber-900 dark:text-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>PRO</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Substrate Area (Real content or Coming Soon skeletons) */}
                  <div className="relative flex-1 p-3.5 pt-2.5 overflow-hidden">
                    {renderSubstrate(item)}

                    {/* Lock & Blur Overlay (Rendered when NOT unlocked) */}
                    {!isUnlocked && (
                      <div
                        className="pro-lock-overlay absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center select-none"
                        style={{
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-lg shadow-[#7C3AED]/35 flex items-center justify-center border-2 border-white/60 dark:border-white/20">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs sm:text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight block">
                              {isTamil ? 'Pro-வில் திறக்கவும்' : 'Unlock with Pro'}
                            </span>
                            <span className="text-[10px] font-bold text-[#7C3AED] dark:text-[#C4B5FD] block">
                              {isTamil ? 'அனைத்து அணுகல்களுக்கும் கிளிக் செய்யவும்' : 'Tap to unlock full access'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* "New This Week" Strip */}
      {newThisWeekItems.length > 0 && (activeSection === 'all' || activeSection === 'videos') && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isTamil ? 'இந்த வாரம் புதிதாக (New this week)' : 'New This Week'}</span>
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
                    <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[9px] font-black">
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
                    className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer"
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

      {/* SHELF 1: VIDEOS MASTERCLASS (Brief D: Horizontal Scroll Cards) */}
      {(activeSection === 'all' || activeSection === 'videos') && (
        <div ref={sectionRefs.videos} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>{isTamil ? 'அத்தியாய வீடியோ வகுப்புகள்' : 'Chapter Video Masterclasses'} ({videos.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              In-app 16:9
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#FAF5FF] dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EDE9FE] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] mx-auto flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
                {isTamil ? `${selectedSubject} வீடியோக்கள் தயாரிப்பில் உள்ளன` : `${selectedSubject} masterclasses in production`}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isTamil ? 'டிசம்பர் முதல் வாரம் நேரலையாகும் 🌱' : 'Releasing in December 🌱'}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-1 px-1">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="w-[260px] sm:w-[280px] shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs hover:border-[#7C3AED]/50 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] text-[10px] font-black">
                        Ch {vid.chapterNo || 1}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {vid.targetSec ? Math.round(vid.targetSec / 60) : 15} min
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] line-clamp-2 leading-tight">
                      {vid.topic}
                    </h4>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(vid.id)}
                      className="w-full py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTamil ? 'பார்க்க' : 'Watch'}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="understand-check-pill"
                      onClick={() => handleStartUnderstandCheck(vid)}
                      className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-black transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{isTamil ? 'உணர்ந்தேனா? (3–5 Q)' : 'Got it? (3–5 Q)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SHELF 2: CONCEPT QUIZZES (Brief D: Horizontal Scroll Cards) */}
      {(activeSection === 'all' || activeSection === 'concept' || activeSection === 'quiz') && (
        <div ref={sectionRefs.concept} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>{isTamil ? 'கருத்துத் தேர்வுகள் (Concept Mastery)' : 'Concept Mastery Quizzes (Pro)'}</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              Ch 1 Free Teaser
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-1 px-1">
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
                  className={`w-[240px] sm:w-[260px] shrink-0 snap-start p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                    isLocked
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-400/40 hover:border-amber-500 hover:bg-amber-500/10'
                      : 'bg-white dark:bg-[#1B0B2E] border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      {row.isFreeTeaser ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          FREE TEASER
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/25 text-amber-900 dark:text-amber-200">
                          PRO 🔒
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {row.count} Qs
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] line-clamp-2 leading-tight">
                      {row.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {isLocked ? (
                      <span className="w-full py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5">
                        <span>{isTamil ? 'திறக்க' : 'Unlock'}</span>
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-full py-1.5 px-3 rounded-xl bg-[#A3E635] text-[#18181B] text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5">
                        <span>{isTamil ? 'தொடங்குக' : 'Play'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SHELF 3: NOTES & STUDY MATERIALS (Brief D: Horizontal Scroll Cards) */}
      {(activeSection === 'all' || activeSection === 'notes') && (
        <div ref={sectionRefs.notes} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>{isTamil ? 'அத்தியாய நோட்டுகள் (Study Notes)' : 'Chapter Notes & Study Materials'} ({materials.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              High-yield PDF
            </span>
          </div>

          {materials.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                {isTamil ? 'டிசம்பர் முதல் வாரம் — ஆசிரியர் சரிபார்த்த நோட்டுகள் வருகிறது 🌱' : 'Verified teacher notes arriving in December 🌱'}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-1 px-1">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="w-[230px] sm:w-[250px] shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between gap-3 text-left"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {mat.chapter}
                    </span>
                    <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] line-clamp-2 leading-tight">
                      {mat.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {mat.notesPdfUrl ? (
                      <Link
                        href={`/viewer?page=notes&id=${encodeURIComponent(mat.notesPdfUrl)}&title=${encodeURIComponent(mat.title)}&subject=${encodeURIComponent(mat.subject)}`}
                        className="w-full py-1.5 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isTamil ? 'படிக்க' : 'Read'}</span>
                      </Link>
                    ) : (
                      <span className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold text-center block">
                        {isTamil ? 'விரைவில்' : 'Coming soon'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SHELF 4: PYQ PAPERS (Brief D: Horizontal Scroll Cards) */}
      {(activeSection === 'all' || activeSection === 'papers') && (
        <div ref={sectionRefs.papers} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>{isTamil ? 'முந்தைய ஆண்டு தாள்கள் (PYQ)' : 'Past Year Question Papers (PYQ)'} ({classPapers.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {isTamil ? 'தமிழ் வழி' : 'English Medium'}
            </span>
          </div>

          {classPapers.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                {isTamil ? 'டிசம்பர் முதல் வாரம் — மேலும் தாள்கள் சேர்க்கப்படும் 🌱' : 'More past papers arriving in December 🌱'}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-1 px-1">
              {classPapers.slice(0, 15).map((paper) => (
                <div
                  key={paper.id}
                  className="w-[230px] sm:w-[250px] shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs transition-all flex flex-col justify-between gap-3 text-left"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                      {paper.year} · {paper.exam}
                    </span>
                    <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] line-clamp-2 leading-tight">
                      {paper.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/viewer?page=papers&id=${encodeURIComponent(paper.pdfUrl || paper.driveFileId || paper.id)}&title=${encodeURIComponent(paper.title)}&subject=${encodeURIComponent(paper.subject)}&year=${encodeURIComponent(paper.year)}`}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>{isTamil ? 'திறக்க' : 'Open'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SHELF 5: OFFICIAL TEXTBOOKS (Brief D: Horizontal Scroll Cards) */}
      {(activeSection === 'all' || activeSection === 'textbooks') && (
        <div ref={sectionRefs.textbooks} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA]" />
              <span>{isTamil ? 'அரசு பாடநூல்கள் (TN Board Textbooks)' : 'Official Textbooks (TN State Board)'} ({textbooks.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              In-app PDF
            </span>
          </div>

          {isLoadingTextbooks ? (
            <div className="p-6 text-center text-xs font-bold text-slate-500 animate-pulse">
              {isTamil ? 'பாடநூல்கள் பதிவிறக்கம் செய்யப்படுகிறது... 📚' : 'Loading textbooks... 📚'}
            </div>
          ) : textbooks.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center">
              <p className="text-xs font-bold text-slate-500">
                {isTamil ? `டிசம்பர் முதல் வாரம் — ${selectedSubject} பாடநூல் அலகுகள் சேர்க்கப்படும் 🌱` : `${selectedSubject} textbook units releasing in December 🌱`}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-1 px-1">
              {(() => {
                const fullBook = textbooks.find((t) => t.isFullBook || t.unitNo === 0);
                const otherBooks = textbooks.filter((t) => t !== fullBook);
                return (
                  <>
                    {fullBook && (
                      <div
                        key="full-book-card"
                        className="w-[250px] sm:w-[270px] shrink-0 snap-start p-3.5 rounded-2xl bg-gradient-to-br from-[#7C3AED]/15 via-purple-500/10 to-amber-500/10 border-2 border-[#7C3AED]/40 hover:border-[#7C3AED] transition-all flex flex-col justify-between gap-3 text-left shadow-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#7C3AED] text-white">
                              FULL BOOK
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {fullBook.pages} {isTamil ? 'பக்' : 'pages'}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] line-clamp-2 leading-tight">
                            {fullBook.title}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-[#7C3AED]/20">
                          <Link
                            href={`/viewer?page=textbooks&id=${encodeURIComponent(fullBook.driveFileId)}&title=${encodeURIComponent(fullBook.title)}&classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`}
                            className="w-full py-1.5 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>{isTamil ? 'முழு நூல் திறக்க' : 'Open Full Book'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {otherBooks.map((unit) => (
                      <div
                        key={`unit-${unit.id || unit.unitNo || unit.title}`}
                        className="w-[230px] sm:w-[250px] shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] hover:border-[#7C3AED]/40 shadow-xs transition-all flex flex-col justify-between gap-3 text-left"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] text-xs font-black flex items-center justify-center">
                              {unit.unitNo > 0 ? unit.unitNo : '📖'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {unit.pages} {isTamil ? 'பக்' : 'pages'}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF] line-clamp-2 leading-tight">
                            {unit.title}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <Link
                            href={`/viewer?page=textbooks&id=${encodeURIComponent(unit.driveFileId)}&title=${encodeURIComponent(unit.title)}&classLevel=${encodeURIComponent(effectiveClass)}&subject=${encodeURIComponent(selectedSubject)}`}
                            className="w-full py-1.5 px-3 rounded-xl bg-[#FAF5FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] border border-[#DDD6FE] dark:border-[#3B2063] hover:bg-[#7C3AED] hover:text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <span>{isTamil ? 'திறக்க' : 'Open'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: DIAGRAMS */}
      {(activeSection === 'all' || activeSection === 'diagrams') && (
        <div ref={sectionRefs.diagrams} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <span>🎨</span>
              <span>{isTamil ? 'முக்கிய வரைபடங்கள் (High-Yield Diagrams)' : 'High-Yield Diagrams'}</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              {isTamil ? 'டிசம்பர் முதல் வாரம்' : 'December Launch'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center space-y-2">
            <span className="text-3xl">📐</span>
            <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? 'அறிவியல் & கணித வரைபட விளக்கங்கள் தயாரிக்கப்படுகிறது' : 'Science & Mathematics diagram modules in preparation'}
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {isTamil ? 'முக்கிய 5-மதிப்பெண் வரைபடங்கள் மற்றும் லேபிளிங் பயிற்சிகள் டிசம்பர் முதல் வாரம் வெளியாகும்.' : 'High-yield 5-mark diagram labeling and step-by-step illustrations releasing in December.'}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 7: HANDWRITTEN NOTES */}
      {(activeSection === 'all' || activeSection === 'handwritten') && (
        <div ref={sectionRefs.handwritten} className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] flex items-center gap-1.5">
              <span>✍️</span>
              <span>{isTamil ? 'டாப்பர் கையெழுத்து பிரதிகள் (Topper Handwritten Notes)' : 'Topper Handwritten Notes'}</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
              {isTamil ? 'டிசம்பர் முதல் வாரம்' : 'December Launch'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-dashed border-[#DDD6FE] dark:border-[#3B2063] text-center space-y-2">
            <span className="text-3xl">📝</span>
            <h4 className="text-xs font-black text-[#2E1065] dark:text-[#FAF5FF]">
              {isTamil ? '100/100 பெற்ற மாணவர்களின் அசல் விடைத்தாள்கள்' : 'Original answer copies of 100/100 state rankers'}
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {isTamil ? 'டாப்பர்களின் விடைத்தாள் அமைப்பு மற்றும் திருத்த குறிப்புகள் டிசம்பர் முதல் வாரம் இணைக்கப்படும்.' : 'Presentation layouts and evaluator margin guidelines releasing in December.'}
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
