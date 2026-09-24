'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Medium, StudentProfile, QuizResult, ScorePayload, PlanType } from '@/types';
import { calculateStreak } from '@/utils/streak';

interface AppContextType {
  medium: Medium;
  setMedium: (medium: Medium) => void;
  toggleMedium: () => void;
  student: StudentProfile | null;
  isRegistered: boolean;
  isGateOpen: boolean;
  openGate: (pendingAction?: () => void) => void;
  closeGate: () => void;
  registerStudent: (data: {
    name: string;
    phone: string;
    standard: string;
    stream?: string;
    district: string;
  }) => Promise<void>;
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
  openPaywall: () => void;
  closePaywall: () => void;
  // Leaderboard Refresh Signal
  leaderboardRefreshCount: number;
  triggerLeaderboardRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MEDIUM_STORAGE_KEY = 'centum_medium';
const STUDENT_STORAGE_KEY = 'centum_student';
const QUIZ_RESULTS_KEY = 'centum_quiz_results';
const PLAN_STORAGE_KEY = 'centum_plan';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medium, setMediumState] = useState<Medium>('english');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [plan, setPlanState] = useState<PlanType>('free');
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [leaderboardRefreshCount, setLeaderboardRefreshCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Load persisted state on client mount
  useEffect(() => {
    try {
      const savedMedium = localStorage.getItem(MEDIUM_STORAGE_KEY) as Medium | null;
      if (savedMedium === 'english' || savedMedium === 'tamil') {
        setMediumState(savedMedium);
      }

      const savedPlan = localStorage.getItem(PLAN_STORAGE_KEY) as PlanType | null;
      if (savedPlan === 'free' || savedPlan === 'pro' || savedPlan === 'live') {
        setPlanState(savedPlan);
      }

      const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);
      if (savedStudent) {
        const parsed: StudentProfile = JSON.parse(savedStudent);
        setStudent(parsed);
        // Automatically sync medium from stored student profile if present
        if (parsed.medium) {
          setMediumState(parsed.medium);
        }
        if (parsed.phone) {
          fetchPlanFromServer(parsed.phone);
        }
      }

      const savedQuizzes = localStorage.getItem(QUIZ_RESULTS_KEY);
      if (savedQuizzes) {
        setQuizResults(JSON.parse(savedQuizzes));
      }
    } catch (e) {
      console.error('Storage reading error', e);
    } finally {
      setIsInitialized(true);
    }
  }, [fetchPlanFromServer]);

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

  const openGate = (action?: () => void) => {
    if (action) {
      setPendingAction(() => action);
    } else {
      setPendingAction(null);
    }
    setIsGateOpen(true);
  };

  const closeGate = () => {
    setIsGateOpen(false);
    setPendingAction(null);
  };

  const openPaywall = () => {
    setIsPaywallOpen(true);
  };

  const closePaywall = () => {
    setIsPaywallOpen(false);
  };

  const registerStudent = async (data: {
    name: string;
    phone: string;
    standard: string;
    stream?: string;
    district: string;
  }) => {
    const newProfile: StudentProfile = {
      ...data,
      medium,
      plan: 'free',
      registeredAt: new Date().toISOString(),
    };

    setStudent(newProfile);
    try {
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to save student profile', e);
    }

    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student',
          name: newProfile.name,
          phone: newProfile.phone,
          district: newProfile.district,
          standard: newProfile.standard,
          stream: newProfile.stream,
          medium: newProfile.medium,
        }),
      });
    } catch (err) {
      console.warn('Backend sync failed, saved locally', err);
    }

    // Also resolve plan in background
    fetchPlanFromServer(newProfile.phone);

    setIsGateOpen(false);
    if (pendingAction) {
      const actionToExecute = pendingAction;
      setPendingAction(null);
      setTimeout(() => {
        actionToExecute();
      }, 100);
    }
  };

  const logout = () => {
    setStudent(null);
    setPlanState('free');
    try {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
      localStorage.removeItem(PLAN_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear profile', e);
    }
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

    // 2. Post score to Apps Script backend (silenced error, never block UX)
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
            // Refetch leaderboard after recording score!
            triggerLeaderboardRefresh();
          })
          .catch((err) => console.warn('Score POST failed (silenced)', err));
      } catch (err) {
        // Silenced
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
        student,
        isRegistered: Boolean(student),
        isGateOpen,
        openGate,
        closeGate,
        registerStudent,
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
        openPaywall,
        closePaywall,
        leaderboardRefreshCount,
        triggerLeaderboardRefresh,
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
