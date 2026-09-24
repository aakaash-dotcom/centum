import { QuizResult } from '@/types';

export function calculateStreak(results: QuizResult[]): {
  streak: number;
  hasTakenTestToday: boolean;
  isBroken: boolean;
} {
  if (!results || results.length === 0) {
    return { streak: 0, hasTakenTestToday: false, isBroken: true };
  }

  // Extract unique active dates in local timezone (YYYY-MM-DD)
  const activeDates = new Set<string>();
  results.forEach((r) => {
    if (r.completedAt) {
      const d = new Date(r.completedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      activeDates.add(dateStr);
    }
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const hasTakenTestToday = activeDates.has(todayStr);

  let currentCheckDate = new Date(now);
  if (!hasTakenTestToday) {
    // If not taken today, check starting from yesterday
    if (!activeDates.has(yesterdayStr)) {
      // Broken streak
      return { streak: 0, hasTakenTestToday: false, isBroken: true };
    }
    currentCheckDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const checkStr = `${currentCheckDate.getFullYear()}-${String(currentCheckDate.getMonth() + 1).padStart(2, '0')}-${String(currentCheckDate.getDate()).padStart(2, '0')}`;
    if (activeDates.has(checkStr)) {
      streak += 1;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    streak,
    hasTakenTestToday,
    isBroken: streak === 0,
  };
}
