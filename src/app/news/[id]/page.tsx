'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { texts } from '@/data/texts';
import { News } from '@/types';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';

export default function NewsDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchArticle = () => {
    setIsLoading(true);
    setIsError(false);

    fetch('/api/news')
      .then(async (res) => {
        if (!res.ok) {
          setIsError(true);
          setArticle(null);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        const list: News[] = Array.isArray(data?.news) ? data.news : [];
        const found = list.find((n) => n.id === id);
        if (found) {
          setArticle(found);
        } else {
          setIsError(true);
          setArticle(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setArticle(null);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchArticle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B2063] border-t-[#7C3AED] animate-spin mb-4" />
        <p className="text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA]">{texts.states.loading}</p>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl mb-3">👻</span>
        <p className="text-sm font-bold text-[#6D28D9]/75 dark:text-[#B9A6D9] mb-3">
          {texts.states.signalGhost}
        </p>
        <button
          type="button"
          onClick={fetchArticle}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-black shadow-xs hover:bg-[#6D28D9] transition-all cursor-pointer mb-3"
        >
          retry 🔄
        </button>
        <Link
          href="/news"
          className="text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:underline"
        >
          back to news 📰
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in text-[#2E1065] dark:text-[#F5F0FF]">
      {/* Back button */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/news"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1B0B2E] border border-[#EDE9FE] dark:border-[#3B2063] text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1247] transition-all cursor-pointer shadow-xs"
          aria-label="Back to news"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </Link>
        <span className="px-3 py-1 rounded-full bg-[#F3E8FF] dark:bg-[#2A1247] text-[#7C3AED] dark:text-[#A78BFA] text-xs font-black uppercase tracking-wider border border-[#DDD6FE]/30 dark:border-[#3B2063]">
          {article.category}
        </span>
      </div>

      {/* Main Card */}
      <article className="bg-white dark:bg-[#1B0B2E] rounded-3xl overflow-hidden border border-[#EDE9FE] dark:border-[#3B2063] shadow-md shadow-[#7C3AED]/5 transition-colors">
        {/* Cover Image */}
        <div className="w-full h-52 bg-[#F3E8FF] dark:bg-[#0F0618] relative">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{article.date}</span>
          </div>

          {/* Headline */}
          <h1 className="text-lg sm:text-xl font-black text-[#2E1065] dark:text-[#F5F0FF] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Body */}
          <div className="text-sm font-medium text-[#2E1065]/90 dark:text-[#F5F0FF]/90 leading-relaxed space-y-3 mb-6">
            <p className="font-bold text-[#7C3AED] dark:text-[#A78BFA]">{article.summary}</p>
            <p>{article.body}</p>
          </div>

          {/* Outbound Link */}
          {article.sourceUrl && (
            <div className="pt-4 border-t border-[#EDE9FE] dark:border-[#3B2063]">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[48px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#84CC16] rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <span>{texts.news.source}</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
