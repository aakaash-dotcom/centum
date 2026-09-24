'use client';

import React from 'react';
import Link from 'next/link';
import { texts } from '@/data/texts';
import { ArrowLeft, ShieldCheck, FileCheck2, HeartHandshake } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#EDE9FE] text-[#7C3AED] hover:bg-[#F3E8FF] transition-all cursor-pointer shadow-xs"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </Link>
        <h1 className="text-2xl font-black text-[#2E1065] tracking-tight">
          {texts.privacy.title}
        </h1>
      </div>

      <div className="space-y-4">
        {/* Promise Highlight */}
        <div className="bg-[#A3E635]/20 border border-[#A3E635] rounded-3xl p-5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#A3E635] text-[#18181B] shrink-0 mt-0.5">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#18181B] mb-1">
              Student Promise
            </h2>
            <p className="text-sm font-extrabold text-[#2E1065]">
              {texts.privacy.promise}
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE9FE] shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-sm font-black text-[#2E1065]">
              {texts.privacy.section1Title}
            </h2>
          </div>
          <p className="text-xs font-semibold text-[#6D28D9]/80 leading-relaxed">
            {texts.privacy.section1Text}
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-3xl p-5 border border-[#EDE9FE] shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-sm font-black text-[#2E1065]">
              {texts.privacy.section2Title}
            </h2>
          </div>
          <p className="text-xs font-semibold text-[#6D28D9]/80 leading-relaxed">
            {texts.privacy.section2Text}
          </p>
        </div>

        <div className="text-center pt-6">
          <p className="text-xs font-bold text-[#6D28D9]/60">
            Centum Tamil Nadu Board Portal · Built for students 🎓
          </p>
        </div>
      </div>
    </div>
  );
}
