'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Medium, StudentProfile, QuizResult, ScorePayload, PlanType } from '@/types';
import { calculateStreak } from '@/utils/streak';
import { normalizePhone } from '@/lib/phone';
import { texts, getTexts, t, setCurrentLanguage } from '@/data/texts';

interface CoinRecentItem {
  reason: string;
  amount: number;
  timestamp: string;
  ref: string;
}

interface AppContextType {
  medium: Medium;
  setMedium: (medium: Medium) => void;
  toggleMedium: () => void;
  texts: ReturnType<typeof getTexts>;
  t: (path: string) => string;
  student: StudentProfile | null;
  isRegistered: boolean;
  isGateOpen: boolean;
  gateMode: 'register' | 'login';
  setGateMode: (mode: 'register' | 'login') => void;
  openGate: (pendingAction?: () => void, mode?: 'register' | 'login') => void;
  closeGate: () => void;
  registerStudent: (data: {
    name: string;
    phone: string;
    standard: string;
    stream?: string;
    district: string;
    password?: string;
  }) => Promise<void>;
  login: (
    phone: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; student?: StudentProfile }>;
  setupPassword: (
    phone: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  quizResults: QuizResult[];
  saveQuizResult: (res: QuizResult) => Promise<void>;
  streakInfo: {
    streak: number;
    hasTakenTestToday: boolean;
    isBroken: boolean;
  };
  // Plan & Monetization
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  refreshPlan: () => Promise<void>;
  isPaywallOpen: boolean;
  paywallPitch: string | null;
  openPaywall: (pitch?: string | unknown) => void;
  closePaywall: () => void;
  // Leaderboard Refresh Signal
  leaderboardRefreshCount: number;
  triggerLeaderboardRefresh: () => void;
  // Theme & Appearance
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  // Guest Session Standard
  guestStandard: string | null;
  setGuestStandard: (std: string) => void;
  // Coins & Rewards
  coinsBalance: number;
  coinsRecent: CoinRecentItem[];
  fetchCoins: () => Promise<void>;
  earnCoins: (reason: string, ref: string, estimatedAmount?: number) => Promise<boolean>;
  spendCoins: (reason: string, ref: string, amount: number) => Promise<boolean>;
  equippedAvatar: string;
  equippedAvatarFrame: string;
  setEquippedAvatar: (avatarId: string) => void;
  equipAvatarFrame: (avatarId: string) => void;
  // Referral Code
  referralCode: string | null;
  getReferralCode: () => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MEDIUM_STORAGE_KEY = 'centum_medium';
const STUDENT_STORAGE_KEY = 'centum_student';
const QUIZ_RESULTS_KEY = 'centum_quiz_results';
const PLAN_STORAGE_KEY = 'centum_plan';
const THEME_STORAGE_KEY = 'centum_theme';
const GUEST_STANDARD_KEY = 'centum_guest_standard';
const AVATAR_FRAME_KEY = 'centum_avatar_frame';
const REFERRAL_CODE_KEY = 'centum_my_referral_code';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medium, setMediumState] = useState<Medium>('english');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [plan, setPlanState] = useState<PlanType>('free');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [guestStandard, setGuestStandardState] = useState<string | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState<'register' | 'login'>('register');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallPitch, setPaywallPitch] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [leaderboardRefreshCount, setLeaderboardRefreshCount] = useState(0);
  const [coinsBalance, setCoinsBalance] = useState<number>(20);
  const [coinsRecent, setCoinsRecent] = useState<CoinRecentItem[]>([]);
  const [equippedAvatar, setEquippedAvatarState] = useState<string>('default');
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Sync language singleton
  useEffect(() => {
    setCurrentLanguage(medium);
  }, [medium]);

  // Resolve plan from server
  const fetchPlanFromServer = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`/api/plan?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.plan) {
          const resolvedPlan = data.plan as PlanType;
          setPlanState(resolvedPlan);
          try {
            localStorage.setItem(PLAN_STORAGE_KEY, resolvedPlan);
          } catch (e) {}
          return resolvedPlan;
        }
      }
    } catch (err) {
      console.warn('Plan fetch failed, using cached plan', err);
    }
    return null;
  }, []);

  // Fetch Coins
  const fetchCoins = useCallback(async () => {
    if (!student?.phone) return;
    try {
      const res = await fetch(`/api/coins?phone=${encodeURIComponent(student.phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          setCoinsBalance(Number(data.balance ?? 0));
          if (Array.isArray(data.recent)) {
            setCoinsRecent(data.recent);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch coins', e);
    }
  }, [student?.phone]);

  // Load persisted state on client mount
  useEffect(() => {
    try {
      const rawSavedMedium = localStorage.getItem(MEDIUM_STORAGE_KEY);
      if (rawSavedMedium) {
        const norm = String(rawSavedMedium).trim().toLowerCase();
        if (norm === 'english' || norm === 'tamil') {
          setMediumState(norm as Medium);
          setCurrentLanguage(norm as Medium);
        }
      }

      const rawSavedPlan = localStorage.getItem(PLAN_STORAGE_KEY);
      if (rawSavedPlan) {
        const norm = String(rawSavedPlan).trim().toLowerCase();
        if (norm === 'free' || norm === 'pro' || norm === 'live') {
          setPlanState(norm as PlanType);
        }
      }

      const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);
      if (savedStudent) {
        const parsed: StudentProfile = JSON.parse(savedStudent);
        if (parsed.medium) {
          const normM = String(parsed.medium).trim().toLowerCase();
          parsed.medium = (normM === 'tamil' ? 'tamil' : 'english') as Medium;
        }
        if (parsed.plan) {
          const normP = String(parsed.plan).trim().toLowerCase();
          parsed.plan = (normP === 'pro' || normP === 'live' ? normP : 'free') as PlanType;
        }
        setStudent(parsed);
        if (parsed.medium) {
          setMediumState(parsed.medium);
          setCurrentLanguage(parsed.medium);
        }
        if (parsed.avatarFrame) {
          setEquippedAvatarState(parsed.avatarFrame);
        }
        if (parsed.phone) {
          fetchPlanFromServer(parsed.phone);
        }
      }

      const savedAvatar = localStorage.getItem(AVATAR_FRAME_KEY);
      if (savedAvatar) {
        setEquippedAvatarState(savedAvatar);
      }

      const savedRefCode = localStorage.getItem(REFERRAL_CODE_KEY);
      if (savedRefCode) {
        setReferralCode(savedRefCode);
      }

      // Capture ?ref=CODE from URL if visiting via referral link
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam) {
          localStorage.setItem('centum_signup_ref', refParam.trim().toUpperCase());
        }
      } catch (e) {}

      const savedQuizzes = localStorage.getItem(QUIZ_RESULTS_KEY);
      if (savedQuizzes) {
        setQuizResults(JSON.parse(savedQuizzes));
      }

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      const savedGuestStd = sessionStorage.getItem(GUEST_STANDARD_KEY);
      if (savedGuestStd) {
        setGuestStandardState(savedGuestStd);
      }
    } catch (e) {
      console.error('Storage reading error', e);
    }
  }, [fetchPlanFromServer]);

  // Fetch coins whenever student is loaded or changed
  useEffect(() => {
    if (student?.phone) {
      fetchCoins();
    }
  }, [student?.phone, fetchCoins]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const setGuestStandard = (std: string) => {
    setGuestStandardState(std);
    try {
      sessionStorage.setItem(GUEST_STANDARD_KEY, std);
    } catch (e) {}
  };

  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan);
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, newPlan);
    } catch (e) {}
  };

  const refreshPlan = async () => {
    if (student?.phone) {
      await fetchPlanFromServer(student.phone);
    }
  };

  const setMedium = (newMedium: Medium) => {
    setMediumState(newMedium);
    setCurrentLanguage(newMedium);
    try {
      localStorage.setItem(MEDIUM_STORAGE_KEY, newMedium);
      if (student) {
        const updated = { ...student, medium: newMedium };
        setStudent(updated);
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Storage error', e);
    }
  };

  const toggleMedium = () => {
    setMedium(medium === 'english' ? 'tamil' : 'english');
  };

  const openGate = (action?: () => void, mode: 'register' | 'login' = 'register') => {
    if (action) {
      setPendingAction(() => action);
    } else {
      setPendingAction(null);
    }
    setGateMode(mode);
    setIsGateOpen(true);
  };

  const closeGate = () => {
    setIsGateOpen(false);
    setPendingAction(null);
  };

  const openPaywall = (pitch?: string | unknown) => {
    setPaywallPitch(typeof pitch === 'string' ? pitch : null);
    setIsPaywallOpen(true);
  };

  const closePaywall = () => {
    setIsPaywallOpen(false);
    setPaywallPitch(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const earnCoins = async (reason: string, ref: string, estimatedAmount?: number): Promise<boolean> => {
    if (!student?.phone) return false;
    try {
      const res = await fetch('/api/coins/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: student.phone,
          reason,
          ref,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          if (typeof data.balance === 'number') {
            setCoinsBalance(data.balance);
          }
          if (data.earned && data.earned > 0) {
            showToast(`+${data.earned} 🪙`);
          } else if (estimatedAmount && !data.duplicate) {
            showToast(`+${estimatedAmount} 🪙`);
          }
          fetchCoins();
          return true;
        }
      }
    } catch (e) {
      console.warn('Silent coin earn failure', e);
    }
    return false;
  };

  const spendCoins = async (reason: string, ref: string, amount: number): Promise<boolean> => {
    if (!student?.phone) {
      showToast(texts.gate.noAccountToast);
      return false;
    }
    try {
      const res = await fetch('/api/coins/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: student.phone,
          reason,
          ref,
          amount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (typeof data.balance === 'number') {
          setCoinsBalance(data.balance);
        }
        fetchCoins();
        return true;
      }
      showToast(data.error || 'insufficient coins');
      return false;
    } catch (e) {
      showToast('failed to spend coins');
      return false;
    }
  };

  const setEquippedAvatar = (avatarId: string) => {
    setEquippedAvatarState(avatarId);
    try {
      localStorage.setItem(AVATAR_FRAME_KEY, avatarId);
      if (student) {
        const updated = { ...student, avatarFrame: avatarId };
        setStudent(updated);
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {}
  };

  const getReferralCode = async (): Promise<string | null> => {
    if (referralCode) return referralCode;
    if (!student?.phone) return null;
    try {
      const res = await fetch('/api/referrals/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: student.phone,
          name: student.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.code) {
          setReferralCode(data.code);
          try {
            localStorage.setItem(REFERRAL_CODE_KEY, data.code);
          } catch (e) {}
          return data.code;
        }
      }
    } catch (e) {
      console.warn('Failed to get referral code', e);
    }
    return null;
  };

  const registerStudent = async (data: {
    name: string;
    phone: string;
    standard: string;
    stream?: string;
    district: string;
    password?: string;
  }) => {
    try {
      const cleanPhone = normalizePhone(data.phone) || data.phone;
      const cleanPassword = data.password ? data.password.trim() : '';

      // Check URL for referral code if any
      let refCode: string | null = null;
      try {
        const params = new URLSearchParams(window.location.search);
        refCode = params.get('ref') || localStorage.getItem('centum_signup_ref');
      } catch (e) {}

      const newProfile: StudentProfile = {
        name: data.name,
        phone: cleanPhone,
        district: data.district,
        standard: data.standard,
        stream: data.stream,
        medium,
        plan: 'free',
        registeredAt: new Date().toISOString(),
        avatarFrame: equippedAvatar,
      };

      setStudent(newProfile);
      setPlanState('free');

      try {
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(newProfile));
        localStorage.setItem(PLAN_STORAGE_KEY, 'free');
      } catch (e) {
        console.error('Storage saving error', e);
      }

      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: cleanPhone,
          password: cleanPassword,
          medium,
          type: 'student',
          refCode,
        }),
      }).catch((err) => {
        console.warn('Registration POST failed (silenced)', err);
      });

      // Credit welcome bonus coins (20 coins)
      earnCoins('welcome', cleanPhone, 20);

      setIsGateOpen(false);
      if (pendingAction) {
        const actionToExecute = pendingAction;
        setPendingAction(null);
        setTimeout(() => {
          actionToExecute();
        }, 100);
      }
    } catch (err) {
      console.error('Registration error', err);
    }
  };

  const login = async (
    phone: string,
    password: string
  ): Promise<{ ok: boolean; error?: string; student?: StudentProfile }> => {
    try {
      const cleanPhone = normalizePhone(phone) || phone;
      const cleanPassword = password.trim();
      const res = await fetch(
        `/api/login?phone=${encodeURIComponent(cleanPhone)}&password=${encodeURIComponent(cleanPassword)}`
      );
      const data = await res.json();
      if (data.ok && data.student) {
        const rawMed = String(data.student.medium || medium).trim().toLowerCase();
        const normMed: Medium = rawMed === 'tamil' ? 'tamil' : 'english';
        const rawPln = String(data.student.plan || 'free').trim().toLowerCase();
        const normPln: PlanType = rawPln === 'pro' || rawPln === 'live' ? rawPln : 'free';

        const loggedStudent: StudentProfile = {
          name: data.student.name,
          phone: data.student.phone,
          district: data.student.district,
          standard: data.student.standard,
          stream: data.student.stream,
          medium: normMed,
          plan: normPln,
          registeredAt: data.student.registeredAt || new Date().toISOString(),
          isAdmin: Boolean(data.student.isAdmin),
          avatarFrame: data.student.avatarFrame || equippedAvatar,
        };

        setStudent(loggedStudent);
        try {
          localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(loggedStudent));
        } catch (e) {
          console.error('Failed to save student profile', e);
        }

        if (loggedStudent.medium) {
          setMediumState(loggedStudent.medium);
          setCurrentLanguage(loggedStudent.medium);
          try {
            localStorage.setItem(MEDIUM_STORAGE_KEY, loggedStudent.medium);
          } catch (e) {}
        }

        if (loggedStudent.plan) {
          setPlanState(loggedStudent.plan);
          try {
            localStorage.setItem(PLAN_STORAGE_KEY, loggedStudent.plan);
          } catch (e) {}
        }

        fetchPlanFromServer(loggedStudent.phone);
        fetchCoins();

        setIsGateOpen(false);
        if (pendingAction) {
          const actionToExecute = pendingAction;
          setPendingAction(null);
          setTimeout(() => {
            actionToExecute();
          }, 100);
        }

        return { ok: true, student: loggedStudent };
      }

      return { ok: false, error: data.error || 'wrong-password' };
    } catch (err) {
      return { ok: false, error: 'network-error' };
    }
  };

  const setupPassword = async (
    phone: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cleanPhone = normalizePhone(phone) || phone;
      const cleanPassword = password.trim();
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'set-password',
          phone: cleanPhone,
          password: cleanPassword,
        }),
      });
      const data = await res.json();
      return { ok: Boolean(data.ok), error: data.error };
    } catch (err) {
      return { ok: false, error: 'setup-failed' };
    }
  };

  const logout = () => {
    setStudent(null);
    setPlanState('free');
    setCoinsBalance(20);
    setCoinsRecent([]);
    try {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
      localStorage.removeItem(PLAN_STORAGE_KEY);
      localStorage.removeItem(REFERRAL_CODE_KEY);
    } catch (e) {
      console.error('Failed to clear profile', e);
    }
  };

  const triggerLeaderboardRefresh = () => {
    setLeaderboardRefreshCount((prev) => prev + 1);
  };

  const saveQuizResult = async (res: QuizResult) => {
    // 1. Save to local storage
    setQuizResults((prev) => {
      const updated = [res, ...prev];
      try {
        localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Quiz save error', e);
      }
      return updated;
    });

    // 2. Post score to Apps Script backend
    if (student) {
      try {
        const payload: ScorePayload = {
          phone: student.phone,
          name: student.name,
          district: student.district,
          standard: student.standard,
          subject: res.subject,
          chapter: res.chapter,
          testType: res.type,
          score: res.score,
          total: res.total,
          seconds: res.totalTimeSeconds,
        };

        fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(() => {
            triggerLeaderboardRefresh();
          })
          .catch((err) => console.warn('Score POST failed (silenced)', err));
      } catch (err) {}

      // 3. Earn Coins hooks!
      const todayDate = new Date().toISOString().slice(0, 10);
      const scoreRef = String(Date.now());

      if (res.type === 'daily') {
        earnCoins('daily-quiz', todayDate, 5);
      } else {
        earnCoins('test-complete', scoreRef, 2);
        if (res.accuracy === 100) {
          earnCoins('test-perfect', scoreRef, 3);
        }
      }

      // Check milestones for streak
      const updatedStreak = calculateStreak([res, ...quizResults]);
      if (updatedStreak.streak === 7) {
        earnCoins('streak-7', todayDate, 20);
      } else if (updatedStreak.streak === 30) {
        earnCoins('streak-30', todayDate, 100);
      }
    }
  };

  const streakInfo = calculateStreak(quizResults);

  return (
    <AppContext.Provider
      value={{
        medium,
        setMedium,
        toggleMedium,
        texts: getTexts(medium),
        t: (path: string) => t(path, medium),
        student,
        isRegistered: Boolean(student),
        isGateOpen,
        gateMode,
        setGateMode,
        openGate,
        closeGate,
        registerStudent,
        login,
        setupPassword,
        logout,
        toastMessage,
        showToast,
        quizResults,
        saveQuizResult,
        streakInfo,
        plan,
        setPlan,
        refreshPlan,
        isPaywallOpen,
        paywallPitch,
        openPaywall,
        closePaywall,
        leaderboardRefreshCount,
        triggerLeaderboardRefresh,
        theme,
        setTheme,
        toggleTheme,
        guestStandard,
        setGuestStandard,
        coinsBalance,
        coinsRecent,
        fetchCoins,
        earnCoins,
        spendCoins,
        equippedAvatar,
        equippedAvatarFrame: equippedAvatar,
        setEquippedAvatar,
        equipAvatarFrame: setEquippedAvatar,
        referralCode,
        getReferralCode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
