'use client';

import React, { useState, useEffect } from 'react';
import { texts } from '@/data/texts';
import { X, Share2, PlusSquare, Sparkles, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallChip: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(standaloneMode));

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isAppleDevice);

    // Listen for beforeinstallprompt on Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // If already standalone or user manually dismissed for this session
  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if deferred prompt is captured OR on iOS
  const canShow = Boolean(deferredPrompt) || isIOS;
  if (!canShow) {
    return null;
  }

  const handleChipClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Home Page Install Chip */}
      <div className="w-full flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED]/15 via-[#8B5CF6]/20 to-[#A3E635]/20 dark:from-[#3B2063]/60 dark:via-[#2A1247] dark:to-[#3B2063]/80 border border-[#7C3AED]/30 dark:border-[#3B2063] shadow-xs">
        <button
          type="button"
          onClick={handleChipClick}
          className="flex-1 flex items-center gap-2 text-left cursor-pointer group"
        >
          <span className="text-base group-hover:scale-110 transition-transform">📲</span>
          <span className="text-xs font-black text-[#2E1065] dark:text-[#F5F0FF] group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors leading-tight">
            {texts.pwa.addHomeChip}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-[#6D28D9]/60 dark:text-[#B9A6D9] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iOS 3-Step Animated Instructions Bottom-Sheet */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1B0B2E] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-[#EDE9FE] dark:border-[#3B2063] animate-slide-up text-[#2E1065] dark:text-[#F5F0FF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF] flex items-center gap-2">
                  <span>{texts.pwa.iosTitle}</span>
                </h3>
                <p className="text-xs font-semibold text-[#6D28D9]/70 dark:text-[#B9A6D9] mt-0.5">
                  {texts.pwa.iosSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-[#2A1247] flex items-center justify-center text-[#6D28D9] dark:text-[#B9A6D9] hover:bg-[#F3E8FF] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Animated Steps with CSS Mockups */}
            <div className="space-y-3.5 my-4">
              {/* Step 1: Share Icon */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-blue-600 dark:text-blue-400">Step 1</div>
                  <div className="text-xs font-bold text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                    {texts.pwa.step1}
                  </div>
                </div>
              </div>

              {/* Step 2: Add to Home Screen */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-[#7C3AED] dark:text-[#A78BFA]">Step 2</div>
                  <div className="text-xs font-bold text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                    {texts.pwa.step2}
                  </div>
                </div>
              </div>

              {/* Step 3: Done ✨ */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF5FF] dark:bg-[#0F0618] border border-[#EDE9FE] dark:border-[#3B2063]">
                <div className="w-10 h-10 rounded-xl bg-[#A3E635]/25 text-[#166534] dark:text-[#A3E635] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-[#166534] dark:text-[#A3E635]">Step 3</div>
                  <div className="text-xs font-bold text-[#2E1065] dark:text-[#F5F0FF] leading-snug">
                    {texts.pwa.step3}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full min-h-[46px] rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer mt-2"
            >
              Got it 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
};
