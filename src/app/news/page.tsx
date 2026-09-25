'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { texts } from '@/data/texts';
import { News } from '@/types';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Calendar, ArrowRight } from 'lucide-react';

export default function NewsFeedPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

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
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {texts.news.headline}
          </h1>
          <p className="text-xs font-bold text-[#7C3AED] dark:text-[#A3E635]">
            official DGE & SCERT updates
          </p>
        </div>
      </div>

      {/* News Card Feed */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <SkeletonCard count={3} />
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">👻</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75 mb-3">
              {texts.states.signalGhost}
            </p>
            <button
              type="button"
              onClick={fetchNews}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer"
            >
              retry 🔄
            </button>
          </div>
        ) : newsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-2">🐶</span>
            <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#DDD6FE]/75">
              {texts.states.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="block bg-white dark:bg-[#3B0F6E] rounded-3xl overflow-hidden border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs hover:shadow-md transition-all group"
              >
                {/* Image on Top */}
                <div className="relative w-full h-44 bg-[#F3E8FF] dark:bg-[#230542] overflow-hidden">
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

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7C3AED] dark:text-[#A3E635] mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.date}</span>
                  </div>

                  <h2 className="text-base font-black text-[#2E1065] dark:text-[#FAF5FF] leading-snug line-clamp-2 group-hover:text-[#7C3AED] dark:group-hover:text-[#A3E635] transition-colors mb-2">
                    {item.title}
                  </h2>

                  <p className="text-xs font-semibold text-[#6D28D9]/80 dark:text-[#DDD6FE]/80 line-clamp-2 leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-xs font-extrabold text-[#7C3AED] dark:text-[#A3E635] pt-2 border-t border-[#FAF5FF] dark:border-[#230542]">
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
