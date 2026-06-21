export type CodeLanguage = 'cpp' | 'python' | 'java' | 'javascript';

export interface CodingProblem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tutorial_link?: string | null;
  topic_tags: string[];
  is_premium: boolean;
  description: string;
  input_format?: string | null;
  output_format?: string | null;
  constraints?: string | null;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  company_tags: string[];
  hints: string[];
  solved: boolean;
  is_bookmarked: boolean;
}

export interface ProblemListItem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  topic_tags: string[];
  company_tags: string[];
  is_premium: boolean;
  solved: boolean;
  is_bookmarked: boolean;
}

export interface ExecutePayload {
  language: CodeLanguage;
  code: string;
  input: string;
}

export interface ExecuteResult {
  output: string;
  stderr: string;
  runtime: string;
  status: string;
}

export interface SubmissionResult {
  submission_id: number;
  status: string;
  passed: number;
  total: number;
  runtime_ms: number | null;
  memory_kb: number | null;
  topic_mastery_update?: string | null;
  roadmap_progress_update?: string | null;
}

export interface SubmissionItem {
  id: number;
  problem_id: number;
  language: CodeLanguage;
  status: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  created_at: string;
}

export interface AnalyticsSummary {
  accuracy: number;
  attempt_count: number;
  avg_runtime_ms: number;
  topic_success_rate: Record<string, number>;
  difficulty_distribution: Record<string, number>;
}

export interface PlatformAccount {
  id: number;
  platform: string;
  username: string;
}

export interface PlatformAccountPayload {
  platform: 'leetcode' | 'geeksforgeeks';
  username: string;
}

export interface PlatformStat {
  platform: string;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_solved: number;
  topics: string[];
  latest_submission_at: string | null;
}

export interface ContestItem {
  id: number;
  platform: string;
  name: string;
  start_time: string;
  duration: number;
  url: string;
  section: 'upcoming' | 'live' | 'past';
}

export interface SurveyPayload {
  current_year: '2nd' | '3rd' | 'Final';
  dsa_experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  target_companies: string[];
  weekly_study_hours: number;
  preferred_language: 'cpp' | 'java' | 'python';
  preparation_start_date: string;
  goal_timeline_months: 3 | 6;
  weak_areas?: string[];
  confidence_level?: number;
}

export interface SurveyResponse extends SurveyPayload {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentProblem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  description: string;
  input_format?: string | null;
  output_format?: string | null;
  constraints?: string | null;
  examples: Array<{ input: string; output: string; explanation?: string }>;
}

export interface AssessmentSubmitResult {
  attempt_id: number;
  status: string;
  passed: number;
  total: number;
  runtime_ms: number | null;
}

export interface AssessmentSummary {
  attempts: number;
  solved: number;
  accuracy: number;
  avg_runtime_ms: number;
  difficulty_success_rate: Record<string, number>;
  topic_accuracy: Record<string, number>;
  last_attempt_at: string | null;
}

export interface RoadmapDay {
  id: number;
  day_number: number;
  week_number: number;
  topic: string;
  problems_count: number;
  tutorial_title: string | null;
  tutorial_link: string | null;
  estimated_minutes: number;
  task_type: string;
  is_completed: boolean;
}

export interface RoadmapDayProblemItem {
  id: number;
  title: string;
  difficulty: string;
  topic: string;
  tutorial_link: string | null;
  problem_path: string;
  editorial_path: string;
}

export interface RoadmapDayDetail {
  id: number;
  day_number: number;
  week_number: number;
  topic: string;
  estimated_minutes: number;
  task_type: string;
  tutorial_title: string | null;
  tutorial_link: string | null;
  tutorial_path: string;
  practice_path: string;
  external_resource_link: string | null;
  status: 'Completed' | 'In Progress' | 'Pending' | string;
  continue_problem_id: number | null;
  continue_problem_path: string | null;
  problems: RoadmapDayProblemItem[];
}

export interface RoadmapPlan {
  id: number;
  start_date: string;
  week_number: number;
  generated_reason: string;
  ai_provider: 'gemini' | 'groq' | 'rule-based' | string;
  generation_trace: string | null;
  ai_feedback: string | null;
  created_at: string;
  days: RoadmapDay[];
}

export interface TopicStrength {
  topic: string;
  attempts: number;
  accuracy: number;
  avg_runtime_ms: number;
  weakness_score: number;
  classification: 'weak' | 'average' | 'strong';
}

export interface TutorialItem {
  topic: string;
  title: string;
  concept: string;
  code_example: string;
  complexity: string;
  practice_tips: string;
  resource_link: string | null;
  video_links: string[];
  article_snippets: Array<{ title: string; language: string; code: string }>;
}

export interface MockTestProblemItem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  topic: string;
}

export interface MockTestStartResponse {
  mode: 'pattern' | 'company' | 'overall';
  category: string | null;
  started_at: string;
  problems: MockTestProblemItem[];
}

export interface MockTestEvaluateResponse {
  mode: 'pattern' | 'company' | 'overall';
  category: string | null;
  score: number;
  solved_count: number;
  total_questions: number;
  time_taken_minutes: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CodeReviewResult {
  review_source: 'gemini' | 'groq' | 'rule-based' | string;
  verdict: string;
  summary: string;
  time_complexity: string;
  space_complexity: string;
  optimal_solution: string;
  improvements: string[];
  alternative_approach: string;
  correctness_analysis: string;
  complexity_analysis: string;
  maintainability_analysis: string;
  interview_readiness: string;
  next_steps: string[];
  confidence: number;
}

export interface EditorialResult {
  concept_explanation: string;
  step_by_step: string[];
  optimized_code: string;
  tutorial_topic: string | null;
  tutorial_link: string | null;
}

export interface AIAnalysisResult {
  trigger: string;
  weak_topics: string[];
  learning_patterns?: string[];
  recommendations?: Array<{title: string; reason: string; action_item: string; problem_id: number}>;
  readiness: Record<string, number>;
  roadmap_refreshed: boolean;
  refresh_error: string | null;
}
