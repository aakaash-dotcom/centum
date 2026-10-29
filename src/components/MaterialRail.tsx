'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { MaterialTypeDefinition } from '@/data/materialsTaxonomy';

interface MaterialRailProps {
  material: MaterialTypeDefinition;
  isTamil: boolean;
  isPro: boolean;
  onUnlock: () => void;
  children?: React.ReactNode;
  hasContent?: boolean;
  showOverlay?: boolean;
}

export const MaterialRail: React.FC<MaterialRailProps> = ({
  material,
  isTamil,
  isPro,
  onUnlock,
  children,
  hasContent = false,
  showOverlay,
}) => {
  const isComingSoon = material.status === 'coming';
  const label = isTamil ? material.labelTa : material.labelEn;
  const description = isTamil ? material.descriptionTa : material.descriptionEn;
  const shouldShowOverlay = showOverlay !== undefined ? showOverlay : !isPro;

  // Render skeleton substrate (strictly grey placeholder bars; no fake counts, no invented inventory)
  const renderSkeletonSubstrate = () => {
    switch (material.id) {
      case 'videos': {
        return [1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[260px] sm:w-[280px] shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 select-none"
          >
            <div className="space-y-2.5">
              <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  ▶
                </div>
              </div>
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        ));
      }

      case 'concept': {
        return [1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[260px] sm:w-[280px] shrink-0 snap-start p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 select-none"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded mt-1" />
              <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="space-y-1.5 pt-2">
                <div className="h-7 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                <div className="h-7 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              </div>
            </div>
            <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ));
      }

      case 'notes':
      case 'diagrams':
      case 'handwritten': {
        return [1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[240px] sm:w-[260px] shrink-0 snap-start p-4 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 select-none"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {material.icon}
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
            </div>
            <div className="h-7 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ));
      }

      case 'papers':
      case 'textbooks':
      default: {
        return [1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[220px] sm:w-[240px] shrink-0 snap-start p-3.5 rounded-2xl bg-white dark:bg-[#1B0B2E] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 select-none"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ));
      }
    }
  };

  return (
    <div
      data-testid={`material-rail-${material.id}`}
      data-material={material.id}
      data-locked={!isPro}
      data-status={material.status}
      className="mb-6 space-y-2.5"
    >
      {/* Rail Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{material.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] truncate flex items-center gap-1.5">
              <span>{label}</span>
            </h3>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              {description}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {isComingSoon ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {isTamil ? 'விரைவில் 🌱' : 'Coming soon'}
            </span>
          ) : !isPro ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-900 dark:text-amber-200 border border-amber-400/40 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>PRO</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {isTamil ? 'திறக்கப்பட்டது ✓' : 'UNLOCKED'}
            </span>
          )}
        </div>
      </div>

      {/* Rail Horizontal Side-Scrolling Substrate Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#120524]/50 p-2 sm:p-2.5">
        <div className="flex gap-3 overflow-x-auto pb-1 pt-1 scrollbar-none snap-x">
          {hasContent ? children : renderSkeletonSubstrate()}
        </div>

        {/* Lock Overlay for Free Visitors: Blurred and Locked */}
        {shouldShowOverlay && (
          <div
            onClick={onUnlock}
            className="pro-lock-overlay absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center select-none cursor-pointer group"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background:
                'linear-gradient(180deg, rgba(15, 6, 24, 0.45) 0%, rgba(15, 6, 24, 0.75) 100%)',
            }}
          >
            <div className="flex flex-col items-center gap-2 max-w-xs transition-transform group-hover:scale-[1.02]">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-xl shadow-[#7C3AED]/40 flex items-center justify-center border-2 border-white/40">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-black text-white tracking-tight block drop-shadow-sm">
                  {isTamil ? 'Pro-வில் திறக்கவும்' : 'Unlock with Pro'}
                </span>
                <span className="text-[11px] font-bold text-[#DDD6FE] block drop-shadow-xs">
                  {isTamil ? 'அனைத்து அணுகல்களுக்கும் கிளிக் செய்யவும்' : 'Tap to unlock full access'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
