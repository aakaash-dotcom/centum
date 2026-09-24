'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medium, StudentProfile, QuizResult } from '@/types';

interface AppContextType {
  medium: Medium;
  setMedium: (medium: Medium) => void;
  toggleMedium: () => void;
  student: StudentProfile | null;
  isRegistered: boolean;
  isGateOpen: boolean;
  openGate: (pendingAction?: () => void) => void;
  closeGate: () => void;
  registerStudent: (data: { name: string; phone: string; standard: string; district: string }) => Promise<void>;
  logout: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  quizResults: QuizResult[];
  saveQuizResult: (res: QuizResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MEDIUM_STORAGE_KEY = 'centum_medium';
const STUDENT_STORAGE_KEY = 'centum_student';
const QUIZ_RESULTS_KEY = 'centum_quiz_results';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medium, setMediumState] = useState<Medium>('english');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load persisted state on client mount
  useEffect(() => {
    try {
      const savedMedium = localStorage.getItem(MEDIUM_STORAGE_KEY) as Medium | null;
      if (savedMedium === 'english' || savedMedium === 'tamil') {
        setMediumState(savedMedium);
      }

      const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);
      if (savedStudent) {
        setStudent(JSON.parse(savedStudent));
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
  }, []);

  const setMedium = (newMedium: Medium) => {
    setMediumState(newMedium);
    try {
      localStorage.setItem(MEDIUM_STORAGE_KEY, newMedium);
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

  const registerStudent = async (data: { name: string; phone: string; standard: string; district: string }) => {
    const newProfile: StudentProfile = {
      ...data,
      medium,
      registeredAt: new Date().toISOString(),
    };

    // Save locally
    setStudent(newProfile);
    try {
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to save student profile', e);
    }

    // Call server API route (forwards to Google Apps Script)
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
          medium: newProfile.medium,
        }),
      });
    } catch (err) {
      console.warn('Backend sync failed, saved locally', err);
    }

    // Close gate and execute queued action immediately
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
    try {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
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

  const saveQuizResult = (res: QuizResult) => {
    setQuizResults((prev) => {
      const updated = [res, ...prev];
      try {
        localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Quiz save error', e);
      }
      return updated;
    });
  };

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
