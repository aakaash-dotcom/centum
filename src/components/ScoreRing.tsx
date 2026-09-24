'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  total: number;
  accuracy: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, total, accuracy }) => {
  const radius = 64;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  const isGreat = accuracy >= 80;
  const ringColor = isGreat ? '#A3E635' : '#7C3AED';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
        {/* Background Circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-[#EDE9FE] dark:text-[#230542]"
        />
        {/* Progress Circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
          {score}/{total}
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#A3E635] mt-0.5">
          {Math.round(accuracy)}% accuracy
        </span>
      </div>
    </div>
  );
};
