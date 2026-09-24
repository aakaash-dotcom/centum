'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { texts } from '@/data/texts';
import { LeaderboardEntry } from '@/types';
import { Trophy } from 'lucide-react';

export const LeaderboardBox: React.FC = () => {
  const { student, quizResults, leaderboardRefreshCount } = useApp();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const studentStandard = student?.standard || '10th';
  const studentPhone = student?.phone || '';
  const studentName = student?.name || '';
  const studentDistrict = student?.district || '';

  const fetchLeaderboard = () => {
    const url = `/api/leaderboard?standard=${encodeURIComponent(studentStandard)}&phone=${encodeURIComponent(studentPhone)}&name=${encodeURIComponent(studentName)}&district=${encodeURIComponent(studentDistrict)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.leaderboard && Array.isArray(data.leaderboard)) {
          setEntries(data.leaderboard);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [studentStandard, studentPhone, quizResults.length, leaderboardRefreshCount]);

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-xs animate-pulse">
        <div className="h-5 bg-[#EDE9FE] dark:bg-[#230542] rounded-lg w-1/3 mb-4" />
        <div className="space-y-2.5">
          <div className="h-10 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl" />
          <div className="h-10 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl" />
          <div className="h-10 bg-[#FAF5FF] dark:bg-[#230542] rounded-2xl" />
        </div>
      </div>
    );
  }

  const top5 = entries.slice(0, 5);
  const userEntry = entries.find((e) => e.me);
  const isUserInTop5 = top5.some((e) => e.me);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-base leading-none">🥇</span>;
    if (rank === 2) return <span className="text-base leading-none">🥈</span>;
    if (rank === 3) return <span className="text-base leading-none">🥉</span>;
    return (
      <span className="w-5 h-5 rounded-lg bg-white dark:bg-[#230542] text-[#7C3AED] dark:text-[#A3E635] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 flex items-center justify-center font-black text-[10px]">
        {rank}
      </span>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-[#3B0F6E] rounded-3xl p-5 border border-[#EDE9FE] dark:border-[#DDD6FE]/20 shadow-md shadow-[#7C3AED]/5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#FEF08A] dark:bg-[#854D0E]/50 text-[#854D0E] dark:text-[#FEF08A]">
            <Trophy className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-black text-[#2E1065] dark:text-[#FAF5FF] tracking-tight">
            {texts.home.leaderboardTitle}
          </h2>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#230542] border border-[#DDD6FE] dark:border-[#DDD6FE]/20 text-[#7C3AED] dark:text-[#A3E635]">
          {texts.home.windowLabel}
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {top5.map((row, idx) => {
          const rank = idx + 1;
          const isMe = row.me;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                isMe
                  ? 'bg-[#A3E635]/25 border-2 border-[#A3E635] ring-2 ring-[#A3E635]/40 shadow-xs'
                  : 'bg-[#FAF5FF]/70 dark:bg-[#230542]/70 border-[#EDE9FE] dark:border-[#DDD6FE]/20'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {getRankBadge(rank)}
                </div>

                <div className="truncate min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                      {row.name}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#A3E635] text-[#18181B]">
                        {texts.home.you}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                    {row.district}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-[#7C3AED] dark:text-[#A3E635] block leading-none">
                  {row.points} {texts.home.points}
                </span>
                <span className="text-[10px] font-bold text-[#6D28D9]/50 dark:text-[#DDD6FE]/50">
                  {row.tests} {texts.home.testsDone}
                </span>
              </div>
            </div>
          );
        })}

        {/* If user is not in top 5, always show lime "you" row */}
        {!isUserInTop5 && userEntry && (
          <>
            <div className="flex items-center justify-center gap-1 py-0.5 text-[#DDD6FE] dark:text-[#DDD6FE]/40">
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>

            <div className="p-2.5 rounded-2xl border bg-[#A3E635]/25 border-2 border-[#A3E635] ring-2 ring-[#A3E635]/40 shadow-xs flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-lg bg-white dark:bg-[#230542] border border-[#7C3AED] dark:border-[#A3E635] flex items-center justify-center font-black text-[10px] text-[#7C3AED] dark:text-[#A3E635] shrink-0">
                  ★
                </span>

                <div className="truncate min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-extrabold text-[#2E1065] dark:text-[#FAF5FF] truncate">
                      {userEntry.name}
                    </span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#A3E635] text-[#18181B]">
                      {texts.home.you}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#6D28D9]/60 dark:text-[#DDD6FE]/60">
                    {userEntry.district}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-[#7C3AED] dark:text-[#A3E635] block leading-none">
                  {userEntry.points} {texts.home.points}
                </span>
                <span className="text-[10px] font-bold text-[#6D28D9]/50 dark:text-[#DDD6FE]/50">
                  {userEntry.tests} {texts.home.testsDone}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
