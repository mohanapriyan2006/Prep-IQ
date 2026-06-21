// ========== Core Types ==========

export interface TopicPerformance {
  topic: string;
  attempts: number;
  solved: number;
  avgTime: number; // minutes
}

export interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPremium?: boolean;
  timeTaken?: number;
  attemptCount?: number;
  confidence?: number; // 1-5
  solved: boolean;
  solvedAt?: string;
}

export interface CompanyWeights {
  [topic: string]: number;
}

export interface CompanyPatterns {
  [company: string]: CompanyWeights;
}

export interface RoadmapDay {
  day: number;
  topic: string;
  problems: number;
  isMockInterview: boolean;
  completed: boolean;
}

export interface MockTestResult {
  id: string;
  type: 'pattern' | 'company';
  category: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  date: string;
  strengths: string[];
  weaknesses: string[];
}

export interface WeaknessResult {
  topic: string;
  score: number;
  classification: 'Weak' | 'Average' | 'Strong';
  accuracy: number;
}

export interface DayPerformance {
  day: string;
  problems: number;
  accuracy: number;
}

export interface HeatmapCell {
  topic: string;
  week: number;
  intensity: number; // 0-4
}

export type NavItem = {
  label: string;
  path: string;
  icon: string;
};
