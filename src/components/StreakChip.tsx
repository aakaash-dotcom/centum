'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { Flame, Skull } from 'lucide-react';

export const StreakChip: React.FC = () => {
  const { streakInfo } = useApp();
  const { streak, isBroken } = streakInfo;

  if (isBroken || streak === 0) {
    return (
      <div className="w-full bg-[#FFE4E6]/80 border border-[#FDA4AF] rounded-2xl p-3 flex items-center justify-between text-[#9F1239] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#FDA4AF]/40 text-[#BE123C]">
            <Skull className="w-4 h-4" />
          </span>
          <span className="text-xs font-black tracking-tight">
            {texts.home.streakZero}
          </span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/70 text-[#BE123C]">
          reset
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-[#F472B6]/15 to-[#7C3AED]/15 border border-[#F472B6]/40 rounded-2xl p-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-xl bg-[#F472B6] text-white animate-pulse">
          <Flame className="w-4 h-4" />
        </span>
        <span className="text-sm font-black text-[#2E1065] tracking-tight">
          {streak} {texts.home.streakActive}
        </span>
      </div>
      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] shadow-xs">
        {texts.home.streakSafe}
      </span>
    </div>
  );
};
