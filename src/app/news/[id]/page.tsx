'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { texts } from '@/data/texts';
import { News } from '@/types';
import { SAMPLE_NEWS } from '@/data/sampleData';
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react';

export default function NewsDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          const list: News[] = data?.news || SAMPLE_NEWS;
          const found = list.find((n) => n.id === id) || SAMPLE_NEWS[0];
          setArticle(found);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          const found = SAMPLE_NEWS.find((n) => n.id === id) || SAMPLE_NEWS[0];
          setArticle(found);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading || !article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#EDE9FE] dark:border-[#3B0F6E] border-t-[#7C3AED] animate-spin mb-4" />
        <p className="text-sm font-bold text-[#7C3AED] dark:text-[#A3E635]">{texts.states.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 animate-fade-in">
      {/* Back button */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/news"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#3B0F6E] border border-[#EDE9FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635] hover:bg-[#F3E8FF] dark:hover:bg-[#4C1D95] transition-all cursor-pointer shadow-xs"
          aria-label="Back to news"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </Link>
        <span className="px-3 py-1 rounded-full bg-[#F3E8FF] dark:bg-[#3B0F6E] text-[#7C3AED] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider border border-[#DDD6FE]/20">
          {article.category}
        </span>
      </div>

      {/* Main Card */}
      <article className="bg-white dark:bg-[#3B0F6E] rounded-3xl overflow-hidden border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-md shadow-[#7C3AED]/5 transition-colors">
        {/* Cover Image */}
        <div className="w-full h-52 bg-[#F3E8FF] dark:bg-[#230542] relative">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] dark:text-[#A3E635] mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{article.date}</span>
          </div>

          {/* Headline */}
          <h1 className="text-lg sm:text-xl font-black text-[#2E1065] dark:text-[#FAF5FF] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Body */}
          <div className="text-sm font-medium text-[#2E1065]/90 dark:text-[#DDD6FE]/90 leading-relaxed space-y-3 mb-6">
            <p className="font-bold text-[#6D28D9] dark:text-[#A3E635]">{article.summary}</p>
            <p>{article.body}</p>
          </div>

          {/* Official Source Outbound Link */}
          <div className="pt-4 border-t border-[#EDE9FE] dark:border-[#DDD6FE]/20">
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] flex items-center justify-center gap-2 font-black text-sm text-[#18181B] bg-[#A3E635] hover:bg-[#92D928] rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <span>{texts.news.source}</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
