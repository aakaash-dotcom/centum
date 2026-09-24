'use client';

import React from 'react';

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-white dark:bg-[#3B0F6E] rounded-2xl p-4 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-[#EDE9FE] dark:bg-[#230542] rounded-md w-1/3" />
            <div className="h-4 bg-[#F3E8FF] dark:bg-[#230542] rounded-md w-16" />
          </div>
          <div className="h-6 bg-[#FAF5FF] dark:bg-[#230542] rounded-lg w-3/4 mb-3" />
          <div className="flex justify-end gap-2 pt-1">
            <div className="h-9 bg-[#EDE9FE] dark:bg-[#230542] rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};
