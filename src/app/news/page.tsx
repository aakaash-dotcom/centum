'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { texts } from '@/data/texts';
import { News } from '@/types';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Calendar, ArrowRight } from 'lucide-react';

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchNews = () => {
    setIsLoading(true);
    setIsError(false);

    fetch('/api/news')
      .then(async (res) => {
        if (!res.ok) {
          setIsError(true);
          setNewsList([]);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.news)) {
          setNewsList(data.news);
          setIsFallback(data.source === 'fallback');
        } else {
          setIsError(true);
          setNewsList([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setNewsList([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-12 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Header - Title, summary, and date only */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2E1065] dark:text-[#F5F0FF] tracking-tight">
            {texts.news.headline}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA]">
            {texts.news.subheadline}
          </p>
        </div>
      </div>

      {/* Fallback Sample News Notice */}
      {isFallback && !isLoading && !isError && (
        <div
          data-testid="news-sample-banner"
          className="mb-4 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span className="font-semibold">
              Sample Updates · Live news feed currently offline
            </span>
          </div>
          <button
            type="button"
            onClick={fetchNews}
            className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:opacity-80 ml-2 shrink-0 cursor-pointer"
          >
            Check Live 🔄
          </button>
        </div>
      )}

      {/* News Card Feed */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <SkeletonCard count={3} />
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">📡</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#B9A6D9] mb-3 max-w-xs">
              {texts.states.signalGhost}
            </p>
            <button
              type="button"
              onClick={fetchNews}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer"
            >
              Retry 🔄
            </button>
          </div>
        ) : newsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-2">🐶</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#B9A6D9]">
              {texts.states.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-white dark:bg-[#1B0B2E] rounded-3xl overflow-hidden border border-[#EDE9FE] dark:border-[#3B2063] shadow-xs hover:shadow-md transition-all group"
              >
                {/* Image on Top */}
                <div className="relative w-full h-44 bg-[#F3E8FF] dark:bg-[#0F0618] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Category Tag Pill Floating */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-[#2E1065]/90 backdrop-blur-xs text-white text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
                      {item.category}
                    </span>
                  </div>

                  {item.pinned && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#18181B] text-[10px] font-black uppercase shadow-xs">
                        Featured 📌
                      </span>
                    </div>
                  )}
                </div>

                {/* Content - title · summary · date only */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>

                  <h2 className="text-base font-black text-[#2E1065] dark:text-[#F5F0FF] leading-snug line-clamp-2 group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors mb-2">
                    {item.title}
                  </h2>

                  <p className="text-xs font-semibold text-[#6D28D9]/80 dark:text-[#B9A6D9] line-clamp-2 leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs font-extrabold text-[#7C3AED] dark:text-[#A78BFA] pt-2 border-t border-[#FAF5FF] dark:border-[#3B2063]">
                    <span>read brief ⚡</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
