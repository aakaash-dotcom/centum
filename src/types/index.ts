export type Medium = 'english' | 'tamil';

export type ClassLevel = '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th';

export type PaperCategory = 'pyq' | 'model' | 'important' | 'book';

export type TestType = 'oneword' | 'concept';

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
}

export interface StudentProfile {
  name: string;
  phone: string;
  district: string;
  standard: string;
  medium: Medium;
  registeredAt?: string;
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
