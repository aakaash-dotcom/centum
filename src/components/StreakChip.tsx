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

  // Hero-level lime streak card
  return (
    <div className="w-full bg-[#A3E635] border-2 border-[#84CC16] text-[#18181B] rounded-3xl p-4 shadow-lg shadow-[#A3E635]/25 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/50 flex items-center justify-center text-[#18181B] shadow-xs">
          <Flame className="w-6 h-6 fill-current animate-pulse text-[#18181B]" />
        </div>
        <div>
          <span className="text-base font-black tracking-tight block leading-tight">
            {streak} {texts.home.streakActive}
          </span>
          <span className="text-[11px] font-black text-[#18181B]/75 uppercase tracking-wide">
            {texts.home.streakSafe}
          </span>
        </div>
      </div>
      <div className="px-3 py-1 rounded-full bg-[#18181B] text-[#A3E635] text-xs font-black shadow-xs">
        {streak}d 🔥
      </div>
    </div>
  );
};
