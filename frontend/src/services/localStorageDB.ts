import type {
  ProblemListItem, CodingProblem, SubmissionItem, SubmissionResult,
  AnalyticsSummary, PlatformAccount, PlatformStat, ContestItem,
  SurveyResponse, AssessmentProblem, AssessmentSubmitResult, AssessmentSummary,
  RoadmapPlan, RoadmapDay, RoadmapDayDetail, TopicStrength,
  TutorialItem, MockTestStartResponse, MockTestEvaluateResponse,
} from '../types/coding';
import { problemBank, type ProblemWithTestcases } from '../data/problemBank';
import { contestSeedData, tutorialSeedData } from '../data/seedData';

const KEYS = {
  USERS: 'prepiq_users',
  PROBLEMS: 'prepiq_problems',
  SUBMISSIONS: 'prepiq_submissions',
  BOOKMARKS: 'prepiq_bookmarks',
  SURVEYS: 'prepiq_surveys',
  ROADMAPS: 'prepiq_roadmaps',
  CONTESTS: 'prepiq_contests',
  PLATFORM_ACCOUNTS: 'prepiq_platform_accounts',
  MOCK_TESTS: 'prepiq_mock_tests',
  ANALYTICS: 'prepiq_analytics',
  TUTORIALS: 'prepiq_tutorials',
} as const;

function getStore<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; }
  catch { return fallback; }
}
function setStore<T>(key: string, value: T): void { localStorage.setItem(key, JSON.stringify(value)); }

function getCurrentUserId(): number | null {
  const token = localStorage.getItem('prepiq_auth_token');
  if (!token) return null;
  const users = getStore<Array<{ id: number; email: string; token?: string }>>(KEYS.USERS, []);
  const user = users.find((u) => u.token === token);
  return user?.id ?? null;
}
function ensureCurrentUser(): number {
  const id = getCurrentUserId();
  if (!id) throw new Error('Not authenticated');
  return id;
}
function getUserScoped<T>(key: string, fallback: T): T {
  const userId = getCurrentUserId();
  if (!userId) return fallback;
  return getStore(`${key}_${userId}`, fallback);
}
function setUserScoped<T>(key: string, value: T): void {
  const userId = getCurrentUserId();
  if (!userId) return;
  setStore(`${key}_${userId}`, value);
}

let bootstrapped = false;
export function bootstrapIfNeeded(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  if (!localStorage.getItem(KEYS.PROBLEMS)) setStore(KEYS.PROBLEMS, problemBank);
  if (!localStorage.getItem(KEYS.CONTESTS)) setStore(KEYS.CONTESTS, contestSeedData);
  if (!localStorage.getItem(KEYS.TUTORIALS)) setStore(KEYS.TUTORIALS, tutorialSeedData);
  if (!localStorage.getItem(KEYS.USERS)) setStore(KEYS.USERS, []);
}

export function registerUserLocal(payload: { email: string; password: string; full_name?: string }): string {
  bootstrapIfNeeded();
  const users = getStore<Array<{ id: number; email: string; password: string; full_name?: string; token?: string }>>(KEYS.USERS, []);
  if (users.some((u) => u.email === payload.email)) throw new Error('Email already registered');
  const id = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const token = `prepiq_fake_token_${Date.now()}_${id}`;
  users.push({ id, email: payload.email, password: payload.password, full_name: payload.full_name || '', token });
  setStore(KEYS.USERS, users);
  return token;
}

export function loginUserLocal(payload: { email: string; password: string }): string {
  bootstrapIfNeeded();
  const users = getStore<Array<{ id: number; email: string; password: string; token?: string }>>(KEYS.USERS, []);
  const user = users.find((u) => u.email === payload.email && u.password === payload.password);
  if (!user) throw new Error('Invalid credentials');
  const token = `prepiq_fake_token_${Date.now()}_${user.id}`;
  user.token = token;
  setStore(KEYS.USERS, users);
  return token;
}

export function getAllProblems(): ProblemWithTestcases[] {
  bootstrapIfNeeded();
  return getStore<ProblemWithTestcases[]>(KEYS.PROBLEMS, []);
}
export function getProblemById(problemId: number): ProblemWithTestcases | undefined {
  return getAllProblems().find((p) => p.id === problemId);
}

export function listProblems(params?: {
  difficulty?: string; topic?: string; company?: string;
  status?: string; tab?: 'all' | 'premium';
  page?: number; page_size?: number; search?: string;
}): ProblemListItem[] {
  const userId = getCurrentUserId();
  const all = getAllProblems();
  const submissions = userId ? getStore<SubmissionItem[]>(`${KEYS.SUBMISSIONS}_${userId}`, []) : [];
  const bookmarks = userId ? getStore<number[]>(`${KEYS.BOOKMARKS}_${userId}`, []) : [];
  const solvedIds = new Set(submissions.filter((s) => s.status === 'Accepted').map((s) => s.problem_id));
  const bookmarkedIds = new Set(bookmarks);
  let filtered = all;
  if (params?.difficulty) filtered = filtered.filter((p) => p.difficulty.toLowerCase() === params.difficulty!.toLowerCase());
  if (params?.topic) {
    const t = params.topic.toLowerCase();
    filtered = filtered.filter((p) => p.topic.toLowerCase() === t || p.topic_tags.some((tag) => tag.toLowerCase() === t));
  }
  if (params?.company) {
    const c = params.company.toLowerCase();
    filtered = filtered.filter((p) => p.company_tags.some((tag) => tag.toLowerCase() === c));
  }
  if (params?.tab === 'premium') filtered = filtered.filter((p) => p.is_premium);
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(s) || p.topic.toLowerCase().includes(s) || p.topic_tags.some((t) => t.toLowerCase().includes(s)));
  }
  const sf = params?.status?.toLowerCase();
  if (sf === 'solved') filtered = filtered.filter((p) => solvedIds.has(p.id));
  else if (sf === 'unsolved') filtered = filtered.filter((p) => !solvedIds.has(p.id));
  else if (sf === 'bookmarked') filtered = filtered.filter((p) => bookmarkedIds.has(p.id));
  const page = params?.page ?? 1;
  const pageSize = params?.page_size ?? 20;
  const start = (page - 1) * pageSize;
  return filtered.slice(start, start + pageSize).map((p) => ({
    id: p.id, title: p.title, difficulty: p.difficulty, topic: p.topic,
    topic_tags: p.topic_tags, company_tags: p.company_tags, is_premium: p.is_premium,
    solved: solvedIds.has(p.id), is_bookmarked: bookmarkedIds.has(p.id),
  }));
}

export function getProblemRead(problemId: number): CodingProblem | undefined {
  const p = getProblemById(problemId);
  if (!p) return undefined;
  const userId = getCurrentUserId();
  const submissions = userId ? getStore<SubmissionItem[]>(`${KEYS.SUBMISSIONS}_${userId}`, []) : [];
  const bookmarks = userId ? getStore<number[]>(`${KEYS.BOOKMARKS}_${userId}`, []) : [];
  const solved = submissions.some((s) => s.problem_id === problemId && s.status === 'Accepted');
  return { ...p, solved, is_bookmarked: bookmarks.includes(problemId) };
}

export function toggleBookmark(problemId: number): { problem_id: number; bookmarked: boolean } {
  const userId = ensureCurrentUser();
  const key = `${KEYS.BOOKMARKS}_${userId}`;
  const bookmarks = getStore<number[]>(key, []);
  const idx = bookmarks.indexOf(problemId);
  let bookmarked: boolean;
  if (idx >= 0) { bookmarks.splice(idx, 1); bookmarked = false; }
  else { bookmarks.push(problemId); bookmarked = true; }
  setStore(key, bookmarks);
  return { problem_id: problemId, bookmarked };
}

export function createSubmission(payload: {
  problem_id: number; language: string; code: string;
  status: string; passed: number; total: number; runtime_ms: number;
}): SubmissionResult {
  const userId = ensureCurrentUser();
  const key = `${KEYS.SUBMISSIONS}_${userId}`;
  const submissions = getStore<SubmissionItem[]>(key, []);
  const id = submissions.length > 0 ? Math.max(...submissions.map((s) => s.id)) + 1 : 1;
  const submission: SubmissionItem = {
    id, problem_id: payload.problem_id,
    language: payload.language as 'cpp' | 'python' | 'java' | 'javascript',
    status: payload.status, runtime_ms: payload.runtime_ms, memory_kb: null,
    created_at: new Date().toISOString(),
  };
  submissions.unshift(submission);
  setStore(key, submissions);
  recomputeAnalytics(userId);
  if (payload.status === 'Accepted') markRoadmapProgress(userId, payload.problem_id);
  return {
    submission_id: id, status: payload.status, passed: payload.passed, total: payload.total,
    runtime_ms: payload.runtime_ms, memory_kb: null,
    topic_mastery_update: 'Topic mastery updated',
    roadmap_progress_update: payload.status === 'Accepted' ? 'Roadmap task auto-marked completed' : 'Roadmap progress unchanged',
  };
}

export function listSubmissions(problemId?: number): SubmissionItem[] {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const key = `${KEYS.SUBMISSIONS}_${userId}`;
  const submissions = getStore<SubmissionItem[]>(key, []);
  return problemId !== undefined ? submissions.filter((s) => s.problem_id === problemId) : submissions;
}

function recomputeAnalytics(userId: number): void {
  const submissions = getStore<SubmissionItem[]>(`${KEYS.SUBMISSIONS}_${userId}`, []);
  const attempts = submissions.length;
  const accepted = submissions.filter((s) => s.status === 'Accepted').length;
  const accuracy = attempts > 0 ? Math.round((accepted / attempts) * 100 * 100) / 100 : 0;
  const runtimeValues = submissions.map((s) => s.runtime_ms).filter((r): r is number => r !== null);
  const avgRuntime = runtimeValues.length > 0 ? Math.round((runtimeValues.reduce((a, b) => a + b, 0) / runtimeValues.length) * 100) / 100 : 0;
  const topicCount: Record<string, { attempts: number; accepted: number }> = {};
  const diffCount: Record<string, number> = {};
  const problems = getAllProblems();
  for (const sub of submissions) {
    const p = problems.find((pr) => pr.id === sub.problem_id);
    if (!p) continue;
    if (!topicCount[p.topic]) topicCount[p.topic] = { attempts: 0, accepted: 0 };
    topicCount[p.topic].attempts += 1;
    if (sub.status === 'Accepted') topicCount[p.topic].accepted += 1;
    diffCount[p.difficulty] = (diffCount[p.difficulty] || 0) + 1;
  }
  const topicSuccessRate: Record<string, number> = {};
  for (const [topic, vals] of Object.entries(topicCount)) {
    topicSuccessRate[topic] = vals.attempts > 0 ? Math.round((vals.accepted / vals.attempts) * 100 * 100) / 100 : 0;
  }
  setStore(`${KEYS.ANALYTICS}_${userId}`, {
    accuracy, attempt_count: attempts, avg_runtime_ms: avgRuntime,
    topic_success_rate: topicSuccessRate, difficulty_distribution: diffCount,
  });
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const userId = ensureCurrentUser();
  const key = `${KEYS.ANALYTICS}_${userId}`;
  let analytics = getStore<AnalyticsSummary | null>(key, null);
  if (!analytics) {
    recomputeAnalytics(userId);
    analytics = getStore<AnalyticsSummary>(key, { accuracy: 0, attempt_count: 0, avg_runtime_ms: 0, topic_success_rate: {}, difficulty_distribution: {} });
  }
  return analytics;
}

export function getTopicStrength(): { topics: TopicStrength[] } {
  const analytics = getAnalyticsSummary();
  const topics = Object.entries(analytics.topic_success_rate).map(([topic, accuracy]) => ({
    topic,
    attempts: analytics.attempt_count > 0 ? Math.max(1, Math.floor(analytics.attempt_count / Object.keys(analytics.topic_success_rate).length)) : 0,
    accuracy, avg_runtime_ms: analytics.avg_runtime_ms,
    weakness_score: Math.max(0, 100 - accuracy),
    classification: (accuracy < 40 ? 'weak' : accuracy < 75 ? 'average' : 'strong') as 'weak' | 'average' | 'strong',
  }));
  return { topics };
}

export function getCompanyReadiness(): { readiness: Record<string, number> } {
  const { topics } = getTopicStrength();
  const topicMap = new Map(topics.map((t) => [t.topic, t.accuracy]));
  const patterns: Record<string, Record<string, number>> = {
    Amazon: { Array: 0.20, 'Dynamic Programming': 0.25, Graph: 0.15, Tree: 0.15, 'Linked List': 0.05, String: 0.10, Greedy: 0.05, 'Binary Search': 0.05 },
    Google: { Array: 0.15, 'Dynamic Programming': 0.30, Graph: 0.20, Tree: 0.10, String: 0.05, Backtracking: 0.10, 'Binary Search': 0.05, Heap: 0.05 },
    Meta: { Array: 0.25, String: 0.15, 'Dynamic Programming': 0.20, Graph: 0.10, Tree: 0.10, 'Binary Search': 0.10, Stack: 0.05, Queue: 0.05 },
    Microsoft: { Array: 0.20, 'Dynamic Programming': 0.20, Graph: 0.15, Tree: 0.15, String: 0.10, Heap: 0.05, Greedy: 0.05, 'Binary Search': 0.10 },
    Adobe: { Array: 0.25, String: 0.20, Tree: 0.15, 'Linked List': 0.15, Stack: 0.10, Queue: 0.05, Greedy: 0.10 },
  };
  const readiness: Record<string, number> = {};
  for (const [company, weights] of Object.entries(patterns)) {
    let score = 0;
    for (const [topic, weight] of Object.entries(weights)) {
      score += ((topicMap.get(topic) || 0) / 100) * weight;
    }
    readiness[company] = Math.min(100, Math.round(score * 100));
  }
  return { readiness };
}

export function getProgressAnalytics(): {
  roadmap_completion: number; accuracy: number; attempt_count: number;
  consistency: Array<{ date: string; attempts: number }>;
} {
  const userId = ensureCurrentUser();
  const submissions = getStore<SubmissionItem[]>(`${KEYS.SUBMISSIONS}_${userId}`, []);
  const analytics = getAnalyticsSummary();
  const last30 = new Map<string, number>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    last30.set(d.toISOString().slice(0, 10), 0);
  }
  for (const sub of submissions) {
    const date = sub.created_at.slice(0, 10);
    if (last30.has(date)) last30.set(date, (last30.get(date) || 0) + 1);
  }
  const roadmap = getStore<RoadmapPlan | null>(`${KEYS.ROADMAPS}_${userId}`, null);
  const roadmap_completion = roadmap ? Math.round((roadmap.days.filter((d) => d.is_completed).length / Math.max(1, roadmap.days.length)) * 100) : 0;
  return { roadmap_completion, accuracy: analytics.accuracy, attempt_count: analytics.attempt_count, consistency: Array.from(last30.entries()).map(([date, attempts]) => ({ date, attempts })) };
}

export function getPlatformAccounts(): PlatformAccount[] {
  return getUserScoped<PlatformAccount[]>(KEYS.PLATFORM_ACCOUNTS, []);
}
export function upsertPlatformAccount(payload: { platform: 'leetcode' | 'geeksforgeeks'; username: string }): PlatformAccount {
  const userId = ensureCurrentUser();
  const key = `${KEYS.PLATFORM_ACCOUNTS}_${userId}`;
  const accounts = getStore<PlatformAccount[]>(key, []);
  const idx = accounts.findIndex((a) => a.platform === payload.platform);
  const account: PlatformAccount = { id: idx >= 0 ? accounts[idx].id : Date.now(), platform: payload.platform, username: payload.username };
  if (idx >= 0) accounts[idx] = account; else accounts.push(account);
  setStore(key, accounts);
  return account;
}
export function getPlatformStats(): PlatformStat[] {
  return getPlatformAccounts().map((a) => {
    const e = Math.floor(Math.random() * 150) + 10;
    const m = Math.floor(Math.random() * 100) + 5;
    const h = Math.floor(Math.random() * 30) + 1;
    return { platform: a.platform, easy_solved: e, medium_solved: m, hard_solved: h, total_solved: e + m + h, topics: ['Array', 'String', 'Tree'], latest_submission_at: new Date().toISOString() };
  });
}
export function syncPlatformStats(): { synced: number; message: string } {
  return { synced: getPlatformAccounts().length, message: `Synced ${getPlatformAccounts().length} platform(s)` };
}

export function getContests(section: 'all' | 'upcoming' | 'live' | 'past' = 'all'): ContestItem[] {
  bootstrapIfNeeded();
  const all = getStore<ContestItem[]>(KEYS.CONTESTS, []);
  return section === 'all' ? all : all.filter((c) => c.section === section);
}
export function syncContests(): { synced: number } {
  setStore(KEYS.CONTESTS, contestSeedData);
  return { synced: contestSeedData.length };
}

export function submitSurvey(payload: SurveyResponse): SurveyResponse {
  const survey: SurveyResponse = { ...payload, id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  setUserScoped(KEYS.SURVEYS, survey);
  return survey;
}
export function getSurvey(): SurveyResponse | null {
  return getUserScoped<SurveyResponse | null>(KEYS.SURVEYS, null);
}
export function getSurveyStatus(): { has_survey: boolean } {
  return { has_survey: getSurvey() !== null };
}

export function getAssessmentProblems(): AssessmentProblem[] {
  return getAllProblems().slice(0, 5).map((p) => ({
    id: p.id, title: p.title, difficulty: p.difficulty, topic: p.topic,
    description: p.description, input_format: p.input_format, output_format: p.output_format,
    constraints: p.constraints, examples: p.examples,
  }));
}

export function submitAssessment(payload: { problem_id: number; language: string; code: string; status: string; passed: number; total: number; runtime_ms: number }): AssessmentSubmitResult {
  const userId = ensureCurrentUser();
  const key = `${KEYS.SUBMISSIONS}_${userId}_assessment`;
  const attempts = getStore<AssessmentSubmitResult[]>(key, []);
  const id = attempts.length > 0 ? Math.max(...attempts.map((a) => a.attempt_id)) + 1 : 1;
  const result: AssessmentSubmitResult = { attempt_id: id, status: payload.status, passed: payload.passed, total: payload.total, runtime_ms: payload.runtime_ms };
  attempts.push(result);
  setStore(key, attempts);
  return result;
}

export function getAssessmentSummary(): AssessmentSummary {
  const userId = ensureCurrentUser();
  const key = `${KEYS.SUBMISSIONS}_${userId}_assessment`;
  const attempts = getStore<AssessmentSubmitResult[]>(key, []);
  const total = attempts.length;
  const solved = attempts.filter((a) => a.status === 'Accepted').length;
  const accuracy = total > 0 ? Math.round((solved / total) * 100 * 100) / 100 : 0;
  const runtimes = attempts.map((a) => a.runtime_ms).filter((r): r is number => r !== null);
  const avgRuntime = runtimes.length > 0 ? Math.round((runtimes.reduce((a, b) => a + b, 0) / runtimes.length) * 100) / 100 : 0;
  const diffSuccess: Record<string, number> = {};
  const topicAcc: Record<string, number> = {};
  const problems = getAllProblems();
  for (const a of attempts) {
    const p = problems.find((pr) => pr.id === a.attempt_id);
    if (!p) continue;
    if (!diffSuccess[p.difficulty]) diffSuccess[p.difficulty] = 0;
    if (a.status === 'Accepted') diffSuccess[p.difficulty] += 1;
    if (!topicAcc[p.topic]) topicAcc[p.topic] = 0;
    topicAcc[p.topic] += a.status === 'Accepted' ? 1 : 0;
  }
  return { attempts: total, solved, accuracy, avg_runtime_ms: avgRuntime, difficulty_success_rate: diffSuccess, topic_accuracy: topicAcc, last_attempt_at: total > 0 ? attempts[attempts.length - 1].attempt_id.toString() : null };
}

function generateRoadmapDays(weakAreas: string[]): RoadmapDay[] {
  const topics = [...new Set([...weakAreas, 'Array', 'String', 'Binary Search', 'Linked List', 'Tree', 'Graph', 'Dynamic Programming', 'Stack', 'Heap'])];
  const days: RoadmapDay[] = [];
  let dayNum = 1;
  for (let week = 1; week <= 4; week++) {
    for (let d = 1; d <= 7; d++) {
      const topic = topics[(dayNum - 1) % topics.length];
      days.push({ id: dayNum, day_number: dayNum, week_number: week, topic, problems_count: 2 + (dayNum % 3), tutorial_title: `${topic} Practice`, tutorial_link: `/tutorials?topic=${encodeURIComponent(topic)}`, estimated_minutes: 30 + (dayNum % 4) * 15, task_type: 'practice', is_completed: false });
      dayNum++;
    }
  }
  return days;
}

export function generateRoadmap(): RoadmapPlan {
  const survey = getSurvey();
  const weakAreas = survey?.weak_areas || ['Array', 'String'];
  const days = generateRoadmapDays(weakAreas);
  const plan: RoadmapPlan = {
    id: 1, start_date: new Date().toISOString(), week_number: 1,
    generated_reason: `Roadmap based on weak areas: ${weakAreas.join(', ')}`,
    ai_provider: 'rule-based', generation_trace: null, ai_feedback: null,
    created_at: new Date().toISOString(), days,
  };
  setUserScoped(KEYS.ROADMAPS, plan);
  return plan;
}

export function getRoadmap(): RoadmapPlan | null {
  return getUserScoped<RoadmapPlan | null>(KEYS.ROADMAPS, null);
}

export function refreshRoadmap(): { roadmap: RoadmapPlan; insights: string[] } {
  const plan = generateRoadmap();
  const insights = [
    'Weekly progress has been steady. Keep up daily practice.',
    'Focus more on medium-difficulty problems to bridge the gap to hard.',
    'Consider revisiting previously solved problems for deeper understanding.',
  ];
  return { roadmap: plan, insights };
}

export function getRoadmapDayDetails(dayId: number): RoadmapDayDetail | null {
  const plan = getRoadmap();
  if (!plan) return null;
  const day = plan.days.find((d) => d.id === dayId);
  if (!day) return null;
  const userId = getCurrentUserId();
  const submissions = userId ? getStore<SubmissionItem[]>(`${KEYS.SUBMISSIONS}_${userId}`, []) : [];
  const acceptedIds = new Set(submissions.filter((s) => s.status === 'Accepted').map((s) => s.problem_id));
  const allProblems = getAllProblems().filter((p) => p.topic === day.topic);
  const problems = allProblems.slice(0, Math.max(1, day.problems_count));
  const continueProblem = problems.find((p) => !acceptedIds.has(p.id)) || problems[0];
  return {
    id: day.id, day_number: day.day_number, week_number: day.week_number, topic: day.topic,
    estimated_minutes: day.estimated_minutes, task_type: day.task_type,
    tutorial_title: day.tutorial_title, tutorial_link: day.tutorial_link,
    tutorial_path: `/tutorials?topic=${encodeURIComponent(day.topic)}`,
    practice_path: `/problems?topic=${encodeURIComponent(day.topic)}`,
    external_resource_link: day.tutorial_link,
    status: day.is_completed ? 'Completed' : continueProblem ? 'In Progress' : 'Pending',
    continue_problem_id: continueProblem?.id ?? null,
    continue_problem_path: continueProblem ? `/problems/${continueProblem.id}?roadmapDay=${day.day_number}` : null,
    problems: problems.map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty, topic: p.topic, tutorial_link: p.tutorial_link ?? null, problem_path: `/problems/${p.id}`, editorial_path: `/problems/${p.id}?tab=editorial` })),
  };
}

export function completeRoadmapDay(dayId: number): void {
  const plan = getRoadmap();
  if (!plan) return;
  const day = plan.days.find((d) => d.id === dayId);
  if (day) { day.is_completed = true; setUserScoped(KEYS.ROADMAPS, plan); }
}

function markRoadmapProgress(userId: number, problemId: number): void {
  const plan = getStore<RoadmapPlan | null>(`${KEYS.ROADMAPS}_${userId}`, null);
  if (!plan) return;
  const problem = getProblemById(problemId);
  if (!problem) return;
  const day = plan.days.find((d) => d.topic === problem.topic && !d.is_completed);
  if (day) { day.is_completed = true; setStore(`${KEYS.ROADMAPS}_${userId}`, plan); }
}

export function getTutorials(): TutorialItem[] {
  bootstrapIfNeeded();
  return getStore<TutorialItem[]>(KEYS.TUTORIALS, tutorialSeedData);
}
export function getTutorialByTopic(topic: string): TutorialItem | undefined {
  return getTutorials().find((t) => t.topic.toLowerCase() === topic.toLowerCase());
}

export function getMockTestCategories(): { pattern_categories: string[]; company_categories: string[] } {
  return {
    pattern_categories: ['Array', 'String', 'Tree', 'Graph', 'Dynamic Programming', 'Binary Search', 'Linked List', 'Stack', 'Heap'],
    company_categories: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'],
  };
}

export function startMockTest(payload: { mode: 'pattern' | 'company' | 'overall'; category?: string; question_count?: number }): MockTestStartResponse {
  const allProblems = getAllProblems();
  const count = payload.question_count ?? 5;
  let filtered = allProblems;
  if (payload.mode === 'pattern' && payload.category) {
    filtered = allProblems.filter((p) => p.topic === payload.category || p.topic_tags.includes(payload.category!));
  }
  if (payload.mode === 'company' && payload.category) {
    filtered = allProblems.filter((p) => p.company_tags.includes(payload.category!));
  }
  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, count);
  const session: MockTestStartResponse = {
    mode: payload.mode, category: payload.category || null,
    started_at: new Date().toISOString(),
    problems: shuffled.map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty, topic: p.topic })),
  };
  const userId = ensureCurrentUser();
  setStore(`${KEYS.MOCK_TESTS}_${userId}_session`, session);
  return session;
}

export function evaluateMockTest(payload: { mode: 'pattern' | 'company' | 'overall'; category?: string; started_at: string; problem_ids: number[] }): MockTestEvaluateResponse {
  const userId = ensureCurrentUser();
  const solvedCount = Math.floor(payload.problem_ids.length * (0.4 + Math.random() * 0.5));
  const score = Math.round((solvedCount / Math.max(1, payload.problem_ids.length)) * 100);
  const start = new Date(payload.started_at);
  const end = new Date();
  const timeTaken = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const result: MockTestEvaluateResponse = {
    mode: payload.mode, category: payload.category || null, score, solved_count: solvedCount,
    total_questions: payload.problem_ids.length, time_taken_minutes: timeTaken,
    strengths: solvedCount > 0 ? ['Problem decomposition', 'Code correctness'] : ['Basic understanding'],
    weaknesses: solvedCount < payload.problem_ids.length ? ['Edge case handling', 'Time optimization'] : ['Advanced patterns'],
  };
  setStore(`${KEYS.MOCK_TESTS}_${userId}_results`, result);
  return result;
}

export function getExternalStats(): { leetcode?: { solved: number }; gfg?: { solved: number } } {
  const accounts = getPlatformAccounts();
  const stats = getPlatformStats();
  const res: { leetcode?: { solved: number }; gfg?: { solved: number } } = {};
  for (const a of accounts) {
    const s = stats.find((st) => st.platform === a.platform);
    if (a.platform === 'leetcode') res.leetcode = { solved: s?.total_solved || 0 };
    if (a.platform === 'geeksforgeeks') res.gfg = { solved: s?.total_solved || 0 };
  }
  return res;
}

export function syncExternalStats(payload: { leetcode_username?: string; gfg_username?: string }): { synced: boolean; message: string } {
  if (payload.leetcode_username) upsertPlatformAccount({ platform: 'leetcode', username: payload.leetcode_username });
  if (payload.gfg_username) upsertPlatformAccount({ platform: 'geeksforgeeks', username: payload.gfg_username });
  return { synced: true, message: 'External stats synced successfully' };
}
