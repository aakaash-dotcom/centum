export type Medium = 'english' | 'tamil';

export type ClassLevel = '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th';

export type PaperCategory = 'pyq' | 'model' | 'important' | 'book';

export type TestType = 'oneword' | 'concept' | 'daily';

export type PlanType = 'free' | 'pro' | 'live';

export type StudentStream =
  | 'Science — Maths'
  | 'Science — Biology'
  | 'Commerce'
  | 'Arts';

export interface Paper {
  id: string;
  classLevel: string; // '10th' | '12th'
  category: PaperCategory;
  subject: string;
  exam: string;
  year: string;
  medium: Medium;
  title: string;
  driveFileId: string;
  featured?: boolean;
  plan?: 'free' | 'pro';
}

export interface News {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  body: string;
  sourceUrl: string;
  imageUrl: string;
  pinned?: boolean;
}

export interface Question {
  id: string;
  classLevel: string;
  subject: string;
  chapter: string;
  type: TestType;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  medium: Medium;
  plan?: 'free' | 'pro';
}

export interface DailyQuiz {
  id: string;
  classLevel: string;
  stream?: string;
  medium: Medium;
  subject: string;
  chapter?: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  date?: string;
}

export interface LeaderboardEntry {
  name: string;
  district: string;
  points: number;
  tests: number;
  me?: boolean;
}

export interface StudentProfile {
  name: string;
  phone: string;
  district: string;
  standard: string;
  stream?: StudentStream | string;
  medium: Medium;
  plan?: PlanType;
  registeredAt?: string;
  isAdmin?: boolean;
}

export interface AdminStats {
  studentsTotal: number;
  proTotal: number;
  liveTotal: number;
  testsTaken: number;
  revenueTotal: number;
  revenueThisMonth: number;
  paymentsCount: number;
  couponsUsed: number;
}

export interface AdminStudentRow {
  joined: string;
  name: string;
  phone: string; // masked server-side, e.g. xxxxx4830
  standard: string;
  stream: string;
  medium: string;
  plan: PlanType | string;
}

export interface UserAnswerRecord {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizResult {
  testId: string;
  title: string;
  classLevel: string;
  subject: string;
  chapter: string;
  type: TestType;
  score: number;
  total: number;
  accuracy: number;
  totalTimeSeconds: number;
  answers: UserAnswerRecord[];
  completedAt: string;
}

export interface ScorePayload {
  phone: string;
  name: string;
  district: string;
  standard: string;
  subject: string;
  chapter: string;
  testType: string;
  score: number;
  total: number;
  seconds: number;
}

export interface CouponResponse {
  ok: boolean;
  valid: boolean;
  discountPercent?: number;
  error?: string;
}

export interface OrderResponse {
  ok: boolean;
  orderId?: string;
  amount?: number; // paise
  keyId?: string;
  error?: string;
}

export interface ReferralHistoryItem {
  id: string;
  date: string;
  maskedPhone: string;
  amount: number;
  share: number;
  status: 'pending' | 'paid';
}

export interface ReferralData {
  couponCode: string | null;
  discountPercent: number;
  share: number;
  earnings: {
    total: number;
    pending: number;
    paid: number;
  };
  referrals: ReferralHistoryItem[];
}
