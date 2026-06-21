import type { TopicPerformance, CompanyPatterns, Problem, DayPerformance, MockTestResult, HeatmapCell } from '../types';

// ========== User Topic Performance ==========
export const userPerformance: TopicPerformance[] = [
  { topic: 'Array', attempts: 48, solved: 36, avgTime: 21 },
  { topic: 'String', attempts: 35, solved: 26, avgTime: 19 },
  { topic: 'Linked List', attempts: 28, solved: 19, avgTime: 26 },
  { topic: 'Stack', attempts: 20, solved: 15, avgTime: 17 },
  { topic: 'Queue', attempts: 14, solved: 10, avgTime: 14 },
  { topic: 'Tree', attempts: 42, solved: 25, avgTime: 34 },
  { topic: 'Graph', attempts: 30, solved: 9, avgTime: 52 },
  { topic: 'DP', attempts: 40, solved: 14, avgTime: 47 },
  { topic: 'Greedy', attempts: 22, solved: 15, avgTime: 23 },
  { topic: 'Binary Search', attempts: 26, solved: 20, avgTime: 18 },
  { topic: 'Backtracking', attempts: 18, solved: 6, avgTime: 44 },
  { topic: 'Heap', attempts: 16, solved: 9, avgTime: 29 },
  { topic: 'Trie', attempts: 10, solved: 4, avgTime: 40 },
  { topic: 'Segment Tree', attempts: 6, solved: 2, avgTime: 60 },
];

// ========== Company Patterns & Weightage ==========
export const companyPatterns: CompanyPatterns = {
  Amazon: {
    Array: 0.20, DP: 0.25, Graph: 0.15, Tree: 0.15,
    'Linked List': 0.05, String: 0.10, Greedy: 0.05, 'Binary Search': 0.05,
  },
  Google: {
    Array: 0.15, DP: 0.30, Graph: 0.20, Tree: 0.10,
    String: 0.05, Backtracking: 0.10, 'Binary Search': 0.05, Heap: 0.05,
  },
  Meta: {
    Array: 0.25, String: 0.15, DP: 0.20, Graph: 0.10,
    Tree: 0.10, 'Binary Search': 0.10, Stack: 0.05, Queue: 0.05,
  },
  Microsoft: {
    Array: 0.20, DP: 0.20, Graph: 0.15, Tree: 0.15,
    String: 0.10, Heap: 0.05, Greedy: 0.05, 'Binary Search': 0.10,
  },
  Adobe: {
    Array: 0.25, String: 0.20, Tree: 0.15,
    'Linked List': 0.15, Stack: 0.10, Queue: 0.05, Greedy: 0.10,
  },
  Flipkart: {
    Array: 0.20, DP: 0.20, Graph: 0.15,
    Tree: 0.15, Heap: 0.10, Greedy: 0.10, 'Binary Search': 0.10,
  },
};

// ========== Problem Bank ==========
export const problemBank: Problem[] = [
  // Existing kept + NEW added

  { id: 'p26', title: 'Subarray Sum Equals K', topic: 'Array', difficulty: 'Medium', solved: true, timeTaken: 30, attemptCount: 2, confidence: 3, solvedAt: '2026-02-25' },
  { id: 'p27', title: '3Sum', topic: 'Array', difficulty: 'Medium', solved: true, timeTaken: 40, attemptCount: 3, confidence: 2, solvedAt: '2026-02-26' },
  { id: 'p28', title: 'Minimum Window Substring', topic: 'String', difficulty: 'Hard', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p29', title: 'Palindrome Partitioning', topic: 'Backtracking', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p30', title: 'Clone Graph', topic: 'Graph', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p31', title: 'Word Ladder', topic: 'Graph', difficulty: 'Hard', solved: false, attemptCount: 1, confidence: 1 },
  { id: 'p32', title: 'House Robber', topic: 'DP', difficulty: 'Medium', solved: true, timeTaken: 22, attemptCount: 1, confidence: 4, solvedAt: '2026-02-26' },
  { id: 'p33', title: 'Decode Ways', topic: 'DP', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2 },
  { id: 'p34', title: 'Kth Largest Element', topic: 'Heap', difficulty: 'Medium', solved: true, timeTaken: 28, attemptCount: 2, confidence: 3, solvedAt: '2026-02-27' },
  { id: 'p35', title: 'Top K Frequent Elements', topic: 'Heap', difficulty: 'Medium', solved: true, timeTaken: 25, attemptCount: 1, confidence: 4, solvedAt: '2026-02-27' },
  { id: 'p36', title: 'Implement Trie', topic: 'Trie', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2 },
  { id: 'p37', title: 'Longest Increasing Subsequence', topic: 'DP', difficulty: 'Medium', solved: false, attemptCount: 3, confidence: 1 },
  { id: 'p38', title: 'Median of Two Sorted Arrays', topic: 'Binary Search', difficulty: 'Hard', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p39', title: 'Spiral Matrix', topic: 'Array', difficulty: 'Medium', solved: true, timeTaken: 20, attemptCount: 1, confidence: 4, solvedAt: '2026-02-28' },
  { id: 'p40', title: 'Reorder List', topic: 'Linked List', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2 },
  { id: 'p41', title: 'Diameter of Binary Tree', topic: 'Tree', difficulty: 'Easy', solved: true, timeTaken: 18, attemptCount: 1, confidence: 4, solvedAt: '2026-02-28' },
  { id: 'p42', title: 'Serialize and Deserialize Tree', topic: 'Tree', difficulty: 'Hard', solved: false, attemptCount: 1, confidence: 1 },
  { id: 'p43', title: 'Sliding Window Maximum', topic: 'Queue', difficulty: 'Hard', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p44', title: 'N Queens', topic: 'Backtracking', difficulty: 'Hard', solved: false, attemptCount: 1, confidence: 1 },
  { id: 'p45', title: 'Course Schedule II', topic: 'Graph', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p46', title: 'Unique Paths', topic: 'DP', difficulty: 'Medium', solved: true, timeTaken: 20, attemptCount: 1, confidence: 4, solvedAt: '2026-03-01' },
  { id: 'p47', title: 'Word Break', topic: 'DP', difficulty: 'Medium', solved: false, attemptCount: 3, confidence: 1 },
  { id: 'p48', title: 'Merge Intervals', topic: 'Greedy', difficulty: 'Medium', solved: true, timeTaken: 18, attemptCount: 1, confidence: 4, solvedAt: '2026-03-01' },
  { id: 'p49', title: 'Insert Interval', topic: 'Greedy', difficulty: 'Medium', solved: true, timeTaken: 22, attemptCount: 2, confidence: 3, solvedAt: '2026-03-02' },
  { id: 'p50', title: 'Find Minimum in Rotated Sorted Array', topic: 'Binary Search', difficulty: 'Medium', solved: true, timeTaken: 15, attemptCount: 1, confidence: 4, solvedAt: '2026-03-02' },
  { id: 'p51', title: 'Two Sum', topic: 'Array', difficulty: 'Easy', solved: true, timeTaken: 12, attemptCount: 1, confidence: 5, solvedAt: '2026-03-03' },
  { id: 'p52', title: 'Two Sum II - Input Array Is Sorted', topic: 'Binary Search', difficulty: 'Medium', solved: true, timeTaken: 18, attemptCount: 2, confidence: 4, solvedAt: '2026-03-03' },
  { id: 'p53', title: '4Sum', topic: 'Array', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2 },
  { id: 'p54', title: 'Continuous Subarray Sum', topic: 'Array', difficulty: 'Medium', solved: false, attemptCount: 3, confidence: 2 },
  { id: 'p55', title: 'Path Sum', topic: 'Tree', difficulty: 'Easy', solved: true, timeTaken: 16, attemptCount: 1, confidence: 4, solvedAt: '2026-03-04' },
  { id: 'p56', title: 'Path Sum II', topic: 'Tree', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2 },
  { id: 'p57', title: 'Path Sum III', topic: 'Tree', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 1 },
  { id: 'p58', title: 'Target Sum', topic: 'DP', difficulty: 'Medium', solved: false, attemptCount: 3, confidence: 1 },
  { id: 'p59', title: 'Combination Sum', topic: 'Backtracking', difficulty: 'Medium', solved: true, timeTaken: 24, attemptCount: 2, confidence: 3, solvedAt: '2026-03-05' },
  { id: 'p60', title: 'Combination Sum II', topic: 'Backtracking', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2 },
  { id: 'p61', title: 'Max Sum of Rectangle No Larger Than K', topic: 'DP', difficulty: 'Hard', solved: false, attemptCount: 1, confidence: 1, isPremium: true },
  { id: 'p62', title: '2D Range Sum Query - Mutable', topic: 'Segment Tree', difficulty: 'Hard', solved: false, attemptCount: 1, confidence: 1, isPremium: true },
  { id: 'p63', title: 'Maximum Sum of 3 Non-Overlapping Subarrays', topic: 'DP', difficulty: 'Hard', solved: false, attemptCount: 1, confidence: 1, isPremium: true },
  { id: 'p64', title: 'Split Array Largest Sum', topic: 'Binary Search', difficulty: 'Hard', solved: false, attemptCount: 2, confidence: 1, isPremium: true },
  { id: 'p65', title: 'Maximum Subarray Sum With One Deletion', topic: 'DP', difficulty: 'Medium', solved: false, attemptCount: 2, confidence: 2, isPremium: true },
];

// ========== 7-Day Performance Trend ==========
export const weeklyPerformance: DayPerformance[] = [
  { day: 'Mon', problems: 5, accuracy: 72 },
  { day: 'Tue', problems: 4, accuracy: 80 },
  { day: 'Wed', problems: 6, accuracy: 68 },
  { day: 'Thu', problems: 3, accuracy: 85 },
  { day: 'Fri', problems: 7, accuracy: 74 },
  { day: 'Sat', problems: 8, accuracy: 78 },
  { day: 'Sun', problems: 5, accuracy: 82 },
];

// ========== Mock Test History ==========
export const mockTestHistory: MockTestResult[] = [
  {
    id: 'mt1', type: 'pattern', category: 'Array',
    score: 85, totalQuestions: 10, timeTaken: 45,
    date: '2026-02-20',
    strengths: ['Two pointer technique', 'Sliding window'],
    weaknesses: ['Kadane\'s algorithm edge cases'],
  },
  {
    id: 'mt2', type: 'company', category: 'Amazon',
    score: 62, totalQuestions: 10, timeTaken: 55,
    date: '2026-02-22',
    strengths: ['Array manipulation', 'Hash maps'],
    weaknesses: ['Graph traversal', 'DP optimization'],
  },
  {
    id: 'mt3', type: 'pattern', category: 'DP',
    score: 40, totalQuestions: 10, timeTaken: 60,
    date: '2026-02-24',
    strengths: ['Basic memoization'],
    weaknesses: ['State transition', 'Space optimization', 'Interval scheduling'],
  },
];

// ========== Heatmap Data ==========
export const heatmapData: HeatmapCell[] = [
  { topic: 'Array', week: 1, intensity: 4 },
  { topic: 'Array', week: 2, intensity: 3 },
  { topic: 'Array', week: 3, intensity: 4 },
  { topic: 'Array', week: 4, intensity: 3 },
  { topic: 'String', week: 1, intensity: 3 },
  { topic: 'String', week: 2, intensity: 2 },
  { topic: 'String', week: 3, intensity: 3 },
  { topic: 'String', week: 4, intensity: 4 },
  { topic: 'DP', week: 1, intensity: 1 },
  { topic: 'DP', week: 2, intensity: 1 },
  { topic: 'DP', week: 3, intensity: 2 },
  { topic: 'DP', week: 4, intensity: 2 },
  { topic: 'Graph', week: 1, intensity: 0 },
  { topic: 'Graph', week: 2, intensity: 1 },
  { topic: 'Graph', week: 3, intensity: 1 },
  { topic: 'Graph', week: 4, intensity: 2 },
  { topic: 'Tree', week: 1, intensity: 2 },
  { topic: 'Tree', week: 2, intensity: 2 },
  { topic: 'Tree', week: 3, intensity: 3 },
  { topic: 'Tree', week: 4, intensity: 2 },
  { topic: 'Linked List', week: 1, intensity: 2 },
  { topic: 'Linked List', week: 2, intensity: 3 },
  { topic: 'Linked List', week: 3, intensity: 2 },
  { topic: 'Linked List', week: 4, intensity: 1 },
  { topic: 'Stack', week: 1, intensity: 3 },
  { topic: 'Stack', week: 2, intensity: 2 },
  { topic: 'Stack', week: 3, intensity: 3 },
  { topic: 'Stack', week: 4, intensity: 2 },
  { topic: 'Binary Search', week: 1, intensity: 3 },
  { topic: 'Binary Search', week: 2, intensity: 4 },
  { topic: 'Binary Search', week: 3, intensity: 3 },
  { topic: 'Binary Search', week: 4, intensity: 3 },
  { topic: 'Backtracking', week: 1, intensity: 0 },
  { topic: 'Backtracking', week: 2, intensity: 1 },
  { topic: 'Backtracking', week: 3, intensity: 1 },
  { topic: 'Backtracking', week: 4, intensity: 0 },
  { topic: 'Greedy', week: 1, intensity: 2 },
  { topic: 'Greedy', week: 2, intensity: 3 },
  { topic: 'Greedy', week: 3, intensity: 2 },
  { topic: 'Greedy', week: 4, intensity: 3 },
  { topic: 'Heap', week: 1, intensity: 1 },
  { topic: 'Heap', week: 2, intensity: 1 },
  { topic: 'Heap', week: 3, intensity: 2 },
  { topic: 'Heap', week: 4, intensity: 1 },
];

// ========== AI Insight Messages ==========
export const aiInsights = [
  "Your DP skills need focused attention. Consider spending 45 min daily on medium-level DP problems.",
  "Graph traversal patterns show inconsistency. Review BFS/DFS fundamentals before attempting hard problems.",
  "Strong improvement in Array-based problems this week! Keep the momentum going.",
  "Your mock test performance suggests readiness for Amazon OA. Focus on Graph + DP for the next 2 weeks.",
  "Backtracking is your weakest area. Start with N-Queens and Sudoku Solver for pattern recognition.",
];
