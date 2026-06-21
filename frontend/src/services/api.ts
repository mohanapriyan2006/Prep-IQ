import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import type {
  AssessmentProblem,
  AssessmentSubmitResult,
  AssessmentSummary,
  AnalyticsSummary,
  ContestItem,
  CodingProblem,
  ExecutePayload,
  ExecuteResult,
  PlatformAccount,
  PlatformAccountPayload,
  PlatformStat,
  ProblemListItem,
  RoadmapPlan,
  SubmissionItem,
  SubmissionResult,
  SurveyPayload,
  SurveyResponse,
  TopicStrength,
  TutorialItem,
  MockTestStartResponse,
  MockTestEvaluateResponse,
  AIAnalysisResult,
  CodeReviewResult,
  EditorialResult,
  RoadmapDayDetail,
} from '../types/coding';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const TOKEN_KEY = 'prepiq_auth_token';
export const AUTH_EMAIL_KEY = 'prepiq_auth_email';

type AuthPayload = {
  access_token: string;
  token_type: string;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function persistAuthToken(token: string, email?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (email) {
    localStorage.setItem(AUTH_EMAIL_KEY, email);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getStoredAuthEmail(): string | null {
  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
}

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<void> {
  const res = await api.post<AuthPayload>('/auth/register', payload);
  persistAuthToken(res.data.access_token, payload.email);
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<void> {
  const res = await api.post<AuthPayload>('/auth/login', payload);
  persistAuthToken(res.data.access_token, payload.email);
}

export async function registerDemoUser(): Promise<void> {
  const existingToken = localStorage.getItem(TOKEN_KEY);
  if (existingToken) return;

  const email = 'demo@prepiq.ai';
  const password = 'DemoPass123!';

  try {
    const registerRes = await api.post<AuthPayload>('/auth/register', {
      email,
      password,
      full_name: 'PrepIQ Demo',
    });
    persistAuthToken(registerRes.data.access_token, email);
  } catch {
    const loginRes = await api.post<AuthPayload>('/auth/login', { email, password });
    persistAuthToken(loginRes.data.access_token, email);
  }
}

export async function fetchProblems(params?: {
  difficulty?: string;
  topic?: string;
  company?: string;
  status?: string;
  tab?: 'all' | 'premium';
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<ProblemListItem[]> {
  const res = await api.get<ProblemListItem[]>('/problems', { params });
  return res.data;
}

export async function fetchProblem(problemId: number): Promise<CodingProblem> {
  const res = await api.get<CodingProblem>(`/problems/${problemId}`);
  return res.data;
}

export async function executeCode(payload: ExecutePayload): Promise<ExecuteResult> {
  const res = await api.post<ExecuteResult>('/execute', payload);
  return res.data;
}

export async function submitCode(payload: {
  problem_id: number;
  language: 'cpp' | 'python' | 'java' | 'javascript';
  code: string;
}): Promise<SubmissionResult> {
  const res = await api.post<SubmissionResult>('/submissions', payload);
  return res.data;
}

export async function fetchSubmissions(problemId?: number): Promise<SubmissionItem[]> {
  const res = await api.get<SubmissionItem[]>('/submissions', {
    params: problemId ? { problem_id: problemId } : undefined,
  });
  return res.data;
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await api.get<AnalyticsSummary>('/submissions/analytics/summary');
  return res.data;
}

export async function toggleProblemBookmark(problemId: number): Promise<{ problem_id: number; bookmarked: boolean }> {
  const res = await api.post<{ problem_id: number; bookmarked: boolean }>(`/problems/${problemId}/bookmark`);
  return res.data;
}

export async function fetchPlatformAccounts(): Promise<PlatformAccount[]> {
  const res = await api.get<PlatformAccount[]>('/platform-connectors/accounts');
  return res.data;
}

export async function upsertPlatformAccount(payload: PlatformAccountPayload): Promise<PlatformAccount> {
  const res = await api.post<PlatformAccount>('/platform-connectors/accounts', payload);
  return res.data;
}

export async function fetchPlatformStats(): Promise<PlatformStat[]> {
  const res = await api.get<PlatformStat[]>('/platform-connectors/stats');
  return res.data;
}

export async function syncPlatformStats(): Promise<{ synced: number; message: string }> {
  const res = await api.post<{ synced: number; message: string }>('/platform-connectors/sync');
  return res.data;
}

export async function fetchContests(section: 'all' | 'upcoming' | 'live' | 'past' = 'all'): Promise<ContestItem[]> {
  const res = await api.get<ContestItem[]>('/contests', { params: { section } });
  return res.data;
}

export async function syncContests(): Promise<{ synced: number }> {
  const res = await api.post<{ synced: number }>('/contests/sync');
  return res.data;
}

export async function submitSurvey(payload: SurveyPayload): Promise<SurveyResponse> {
  const res = await api.post<SurveyResponse>('/survey/submit', payload);
  return res.data;
}

export async function fetchSurvey(): Promise<SurveyResponse> {
  const res = await api.get<SurveyResponse>('/survey');
  return res.data;
}

export async function fetchSurveyStatus(): Promise<{ has_survey: boolean }> {
  const res = await api.get<{ has_survey: boolean }>('/survey/status');
  return res.data;
}

export async function fetchAssessmentProblems(): Promise<AssessmentProblem[]> {
  const res = await api.get<AssessmentProblem[]>('/assessment/problems');
  return res.data;
}

export async function submitAssessment(payload: {
  problem_id: number;
  language: 'cpp' | 'python' | 'java';
  code: string;
}): Promise<AssessmentSubmitResult> {
  const res = await api.post<AssessmentSubmitResult>('/assessment/submit', payload);
  return res.data;
}

export async function fetchAssessmentSummary(): Promise<AssessmentSummary> {
  const res = await api.get<AssessmentSummary>('/assessment/summary');
  return res.data;
}

export async function generateRoadmap(): Promise<RoadmapPlan> {
  const res = await api.post<RoadmapPlan>('/roadmap/generate');
  return res.data;
}

export async function fetchRoadmap(): Promise<RoadmapPlan> {
  const res = await api.get<RoadmapPlan>('/roadmap');
  return res.data;
}

export async function refreshRoadmap(): Promise<{ roadmap: RoadmapPlan; insights: string[] }> {
  const res = await api.post<{ roadmap: RoadmapPlan; insights: string[] }>('/roadmap/refresh');
  return res.data;
}

export async function fetchRoadmapDayDetails(dayId: number): Promise<RoadmapDayDetail> {
  const res = await api.get<RoadmapDayDetail>(`/roadmap/day/${dayId}/details`);
  return res.data;
}

export async function completeRoadmapDay(dayId: number): Promise<void> {
  await api.post(`/roadmap/day/${dayId}/complete`);
}

export async function fetchTopicStrength(): Promise<{ topics: TopicStrength[] }> {
  const res = await api.get<{ topics: TopicStrength[] }>('/analytics/topic-strength');
  return res.data;
}

export async function fetchCompanyReadiness(): Promise<{ readiness: Record<string, number> }> {
  const res = await api.get<{ readiness: Record<string, number> }>('/analytics/company-readiness');
  return res.data;
}

export async function fetchProgressAnalytics(): Promise<{
  roadmap_completion: number;
  accuracy: number;
  attempt_count: number;
  consistency: Array<{ date: string; attempts: number }>;
}> {
  const res = await api.get<{
    roadmap_completion: number;
    accuracy: number;
    attempt_count: number;
    consistency: Array<{ date: string; attempts: number }>;
  }>('/analytics/progress');
  return res.data;
}

export async function fetchTutorials(): Promise<TutorialItem[]> {
  const res = await api.get<TutorialItem[]>('/tutorials');
  return res.data;
}

export async function fetchTutorial(topic: string): Promise<TutorialItem> {
  const res = await api.get<TutorialItem>(`/tutorials/${topic}`);
  return res.data;
}

export async function runAIAnalysis(): Promise<AIAnalysisResult> {
  const res = await api.post<AIAnalysisResult>('/ai/analyze');
  return res.data;
}

export async function fetchProblemCodeReview(payload: {
  problem_id: number;
  language: 'cpp' | 'python' | 'java' | 'javascript';
  code: string;
  status: string;
}): Promise<CodeReviewResult> {
  const res = await api.post<CodeReviewResult>(`/problems/${payload.problem_id}/code-review`, {
    language: payload.language,
    code: payload.code,
    status: payload.status,
  });
  return res.data;
}

export async function fetchProblemEditorial(problemId: number): Promise<EditorialResult> {
  const res = await api.get<EditorialResult>(`/problems/${problemId}/editorial`);
  return res.data;
}

export async function fetchMockTestCategories(): Promise<{ pattern_categories: string[]; company_categories: string[] }> {
  const res = await api.get<{ pattern_categories: string[]; company_categories: string[] }>('/mock-tests/categories');
  return res.data;
}

export async function startMockTest(payload: {
  mode: 'pattern' | 'company' | 'overall';
  category?: string;
  question_count?: number;
}): Promise<MockTestStartResponse> {
  const res = await api.post<MockTestStartResponse>('/mock-tests/start', payload);
  return res.data;
}

export async function evaluateMockTest(payload: {
  mode: 'pattern' | 'company' | 'overall';
  category?: string;
  started_at: string;
  problem_ids: number[];
}): Promise<MockTestEvaluateResponse> {
  const res = await api.post<MockTestEvaluateResponse>('/mock-tests/evaluate', payload);
  return res.data;
}

export const fetchExternalStats = async () => {
  const res = await api.get('/stats/external');
  return res.data;
}

export const syncExternalStats = async (payload: { leetcode_username?: string, gfg_username?: string }) => {
  const res = await api.post('/stats/sync', payload);
  return res.data;
}

