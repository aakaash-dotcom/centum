'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-slide-up"
    >
      <div className="bg-[#2E1065] text-white px-5 py-2.5 rounded-full shadow-xl shadow-[#2E1065]/20 text-sm font-bold flex items-center gap-2 border border-[#7C3AED]/40">
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
