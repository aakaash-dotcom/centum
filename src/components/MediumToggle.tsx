'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';

interface MediumToggleProps {
  compact?: boolean;
}

export const MediumToggle: React.FC<MediumToggleProps> = ({ compact = false }) => {
  const { medium, setMedium } = useApp();

  return (
    <div
      role="group"
      aria-label="Select Medium"
      className={`inline-flex items-center bg-[#EDE9FE]/70 p-1.5 rounded-full shadow-inner border border-[#DDD6FE] ${
        compact ? 'scale-90' : 'w-full max-w-[280px]'
      }`}
    >
      <button
        type="button"
        onClick={() => setMedium('english')}
        aria-pressed={medium === 'english'}
        className={`flex-1 min-h-[44px] flex items-center justify-center font-bold text-sm tracking-wide rounded-full transition-all duration-200 cursor-pointer ${
          medium === 'english'
            ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25 scale-[1.02]'
            : 'text-[#5B21B6] hover:text-[#2E1065] opacity-80 hover:opacity-100'
        }`}
      >
        {texts.medium.english}
      </button>

      <button
        type="button"
        onClick={() => setMedium('tamil')}
        aria-pressed={medium === 'tamil'}
        className={`flex-1 min-h-[44px] flex items-center justify-center font-bold text-sm tracking-wide rounded-full transition-all duration-200 cursor-pointer ${
          medium === 'tamil'
            ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25 scale-[1.02]'
            : 'text-[#5B21B6] hover:text-[#2E1065] opacity-80 hover:opacity-100'
        }`}
      >
        {texts.medium.tamil}
      </button>
    </div>
  );
};
