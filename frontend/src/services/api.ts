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

import {
  registerUserLocal,
  loginUserLocal,
  listProblems,
  getProblemRead,
  toggleBookmark as toggleBookmarkDB,
  createSubmission,
  listSubmissions,
  getAnalyticsSummary,
  getTopicStrength,
  getCompanyReadiness,
  getProgressAnalytics,
  getPlatformAccounts,
  upsertPlatformAccount as upsertPlatformAccountDB,
  getPlatformStats,
  syncPlatformStats as syncPlatformStatsDB,
  getContests,
  syncContests as syncContestsDB,
  submitSurvey as submitSurveyDB,
  getSurvey,
  getSurveyStatus,
  getAssessmentProblems,
  submitAssessment as submitAssessmentDB,
  getAssessmentSummary,
  generateRoadmap as generateRoadmapDB,
  getRoadmap,
  refreshRoadmap as refreshRoadmapDB,
  getRoadmapDayDetails,
  completeRoadmapDay as completeRoadmapDayDB,
  getTutorials,
  getTutorialByTopic,
  getMockTestCategories,
  startMockTest as startMockTestDB,
  evaluateMockTest as evaluateMockTestDB,
  syncExternalStats as syncExternalStatsDB,
} from './localStorageDB';

import { evaluateCode } from '../utils/codeEvaluator';
import { runCode } from './codeRunner';
import { generateCodeReview, generateEditorial, generateAIAnalysis } from '../utils/mockAI';

export const TOKEN_KEY = 'prepiq_auth_token';
export const AUTH_EMAIL_KEY = 'prepiq_auth_email';

export const api = {
  get: async (_url: string): Promise<{ data: any }> => {
    if (_url === '/assessment/sessions') return { data: [] };
    if (_url === '/assessment/problems') return { data: await getAssessmentProblems() };
    return { data: null };
  },
  post: async (_url: string, _data?: unknown): Promise<{ data: any }> => {
    if (_url === '/assessment/start') return { data: { session_id: Date.now() } };
    if (_url.startsWith('/assessment/') && _url.endsWith('/finalize')) return { data: {} };
    if (_url === '/assessment/submit' && _data && typeof _data === 'object') {
      const d = _data as { problem_id: number; language: string; code: string };
      const { getProblemById } = await import('../services/localStorageDB');
      const problem = getProblemById(d.problem_id);
      if (!problem) throw new Error('Problem not found');
      const result = await evaluateCode(d.code, d.language, problem.visible_testcases, problem.hidden_testcases);
      return { data: await submitAssessmentDB({ problem_id: d.problem_id, language: d.language, code: d.code, status: result.status, passed: result.passed, total: result.total, runtime_ms: result.max_runtime_ms }) };
    }
    return { data: null };
  },
};

function persistAuthToken(token: string, email?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (email) localStorage.setItem(AUTH_EMAIL_KEY, email);
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
  const token = registerUserLocal(payload);
  persistAuthToken(token, payload.email);
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<void> {
  const token = loginUserLocal(payload);
  persistAuthToken(token, payload.email);
}

export async function registerDemoUser(): Promise<void> {
  const existingToken = localStorage.getItem(TOKEN_KEY);
  if (existingToken) return;
  const email = 'demo@prepiq.ai';
  const password = 'DemoPass123!';
  try {
    const token = registerUserLocal({ email, password, full_name: 'PrepIQ Demo' });
    persistAuthToken(token, email);
  } catch {
    const token = loginUserLocal({ email, password });
    persistAuthToken(token, email);
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
  return listProblems(params);
}

export async function fetchProblem(problemId: number): Promise<CodingProblem> {
  const p = getProblemRead(problemId);
  if (!p) throw new Error('Problem not found');
  return p;
}

export async function executeCode(payload: ExecutePayload): Promise<ExecuteResult> {
  return runCode(payload.language, payload.code, payload.input);
}

export async function submitCode(payload: {
  problem_id: number;
  language: 'cpp' | 'python' | 'java' | 'javascript';
  code: string;
}): Promise<SubmissionResult> {
  const { getProblemById } = await import('../services/localStorageDB');
  const problem = getProblemById(payload.problem_id);
  if (!problem) throw new Error('Problem not found');
  const result = await evaluateCode(payload.code, payload.language, problem.visible_testcases, problem.hidden_testcases);
  return createSubmission({
    problem_id: payload.problem_id,
    language: payload.language,
    code: payload.code,
    status: result.status,
    passed: result.passed,
    total: result.total,
    runtime_ms: result.max_runtime_ms,
  });
}

export async function fetchSubmissions(problemId?: number): Promise<SubmissionItem[]> {
  return listSubmissions(problemId);
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return getAnalyticsSummary();
}

export async function toggleProblemBookmark(problemId: number): Promise<{ problem_id: number; bookmarked: boolean }> {
  return toggleBookmarkDB(problemId);
}

export async function fetchPlatformAccounts(): Promise<PlatformAccount[]> {
  return getPlatformAccounts();
}

export async function upsertPlatformAccount(payload: PlatformAccountPayload): Promise<PlatformAccount> {
  return upsertPlatformAccountDB(payload);
}

export async function fetchPlatformStats(): Promise<PlatformStat[]> {
  return getPlatformStats();
}

export async function syncPlatformStats(): Promise<{ synced: number; message: string }> {
  return syncPlatformStatsDB();
}

export async function fetchContests(section: 'all' | 'upcoming' | 'live' | 'past' = 'all'): Promise<ContestItem[]> {
  return getContests(section);
}

export async function syncContests(): Promise<{ synced: number }> {
  return syncContestsDB();
}

export async function submitSurvey(payload: SurveyPayload): Promise<SurveyResponse> {
  return submitSurveyDB(payload as SurveyResponse);
}

export async function fetchSurvey(): Promise<SurveyResponse> {
  const survey = getSurvey();
  if (!survey) throw new Error('Survey not found');
  return survey;
}

export async function fetchSurveyStatus(): Promise<{ has_survey: boolean }> {
  return getSurveyStatus();
}

export async function fetchAssessmentProblems(): Promise<AssessmentProblem[]> {
  return getAssessmentProblems();
}

export async function submitAssessment(payload: {
  problem_id: number;
  language: 'cpp' | 'python' | 'java';
  code: string;
}): Promise<AssessmentSubmitResult> {
  const { getProblemById } = await import('../services/localStorageDB');
  const problem = getProblemById(payload.problem_id);
  if (!problem) throw new Error('Problem not found');
  const result = await evaluateCode(payload.code, payload.language, problem.visible_testcases, problem.hidden_testcases);
  return submitAssessmentDB({
    problem_id: payload.problem_id,
    language: payload.language,
    code: payload.code,
    status: result.status,
    passed: result.passed,
    total: result.total,
    runtime_ms: result.max_runtime_ms,
  });
}

export async function fetchAssessmentSummary(): Promise<AssessmentSummary> {
  return getAssessmentSummary();
}

export async function generateRoadmap(): Promise<RoadmapPlan> {
  return generateRoadmapDB();
}

export async function fetchRoadmap(): Promise<RoadmapPlan> {
  const plan = getRoadmap();
  if (!plan) throw new Error('No roadmap found');
  return plan;
}

export async function refreshRoadmap(): Promise<{ roadmap: RoadmapPlan; insights: string[] }> {
  return refreshRoadmapDB();
}

export async function fetchRoadmapDayDetails(dayId: number): Promise<RoadmapDayDetail> {
  const details = getRoadmapDayDetails(dayId);
  if (!details) throw new Error('Roadmap day not found');
  return details;
}

export async function completeRoadmapDay(dayId: number): Promise<void> {
  completeRoadmapDayDB(dayId);
}

export async function fetchTopicStrength(): Promise<{ topics: TopicStrength[] }> {
  return getTopicStrength();
}

export async function fetchCompanyReadiness(): Promise<{ readiness: Record<string, number> }> {
  return getCompanyReadiness();
}

export async function fetchProgressAnalytics(): Promise<{
  roadmap_completion: number;
  accuracy: number;
  attempt_count: number;
  consistency: Array<{ date: string; attempts: number }>;
}> {
  return getProgressAnalytics();
}

export async function fetchTutorials(): Promise<TutorialItem[]> {
  return getTutorials();
}

export async function fetchTutorial(topic: string): Promise<TutorialItem> {
  const t = getTutorialByTopic(topic);
  if (!t) throw new Error('Tutorial not found');
  return t;
}

export async function runAIAnalysis(): Promise<AIAnalysisResult> {
  const weak = getTopicStrength();
  const analytics = getAnalyticsSummary();
  return generateAIAnalysis(
    weak.topics.filter((t) => t.classification === 'weak').map((t) => t.topic),
    analytics.accuracy,
  );
}

export async function fetchProblemCodeReview(payload: {
  problem_id: number;
  language: 'cpp' | 'python' | 'java' | 'javascript';
  code: string;
  status: string;
}): Promise<CodeReviewResult> {
  const { getProblemById } = await import('../services/localStorageDB');
  const problem = getProblemById(payload.problem_id);
  return generateCodeReview(problem?.title ?? 'Unknown', payload.language, payload.status);
}

export async function fetchProblemEditorial(problemId: number): Promise<EditorialResult> {
  const { getProblemById } = await import('../services/localStorageDB');
  const problem = getProblemById(problemId);
  return generateEditorial(problem?.title ?? 'Unknown', problem?.topic ?? 'Array');
}

export async function fetchMockTestCategories(): Promise<{ pattern_categories: string[]; company_categories: string[] }> {
  return getMockTestCategories();
}

export async function startMockTest(payload: {
  mode: 'pattern' | 'company' | 'overall';
  category?: string;
  question_count?: number;
}): Promise<MockTestStartResponse> {
  return startMockTestDB(payload);
}

export async function evaluateMockTest(payload: {
  mode: 'pattern' | 'company' | 'overall';
  category?: string;
  started_at: string;
  problem_ids: number[];
}): Promise<MockTestEvaluateResponse> {
  return evaluateMockTestDB(payload);
}

export const fetchExternalStats = async (): Promise<{
  leetcode_data?: { username: string; solved: number };
  gfg_data?: { username: string; solved: number };
}> => {
  const accounts = getPlatformAccounts();
  const stats = getPlatformStats();
  const res: {
    leetcode_data?: { username: string; solved: number };
    gfg_data?: { username: string; solved: number };
  } = {};
  for (const a of accounts) {
    const s = stats.find((st) => st.platform === a.platform);
    if (a.platform === 'leetcode') {
      res.leetcode_data = { username: a.username, solved: s?.total_solved || 0 };
    }
    if (a.platform === 'geeksforgeeks') {
      res.gfg_data = { username: a.username, solved: s?.total_solved || 0 };
    }
  }
  return res;
};

export const syncExternalStats = async (payload: { leetcode_username?: string; gfg_username?: string }) => {
  return syncExternalStatsDB(payload);
};

