'use client';

import React from 'react';

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-white rounded-2xl p-4 border border-[#EDE9FE] shadow-xs animate-pulse"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-[#EDE9FE] rounded-md w-1/3" />
            <div className="h-4 bg-[#F3E8FF] rounded-md w-16" />
          </div>
          <div className="h-6 bg-[#FAF5FF] rounded-lg w-3/4 mb-3" />
          <div className="flex justify-end gap-2 pt-1">
            <div className="h-9 bg-[#EDE9FE] rounded-xl w-20" />
            <div className="h-9 bg-[#EDE9FE] rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};
