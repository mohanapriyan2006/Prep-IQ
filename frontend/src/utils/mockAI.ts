import type { CodeReviewResult, EditorialResult, AIAnalysisResult } from '../types/coding';

export function generateCodeReview(
  problemTitle: string,
  language: string,
  status: string,
): CodeReviewResult {
  const isAccepted = status === 'Accepted';
  const verdict = isAccepted
    ? 'Excellent implementation! Your code is correct and handles the core logic well.'
    : 'Your approach has potential but needs refinement. Focus on edge cases and correctness.';

  return {
    review_source: 'rule-based',
    verdict,
    summary: isAccepted
      ? `Your ${language} solution for "${problemTitle}" demonstrates solid understanding of the problem. The algorithm correctly identifies the required pattern.`
      : `The ${language} solution for "${problemTitle}" has logical gaps. Review the constraints and consider alternative approaches.`,
    time_complexity: 'O(n) or O(n log n) depending on approach',
    space_complexity: 'O(n) auxiliary space',
    optimal_solution: isAccepted
      ? 'Your current approach is near-optimal. Consider if a single-pass solution is possible.'
      : 'An optimal solution typically uses a hash map or two-pointer technique for this problem type.',
    improvements: [
      'Add more comments explaining the logic.',
      'Handle edge cases like empty input explicitly.',
      'Consider memory optimization for large inputs.',
    ],
    alternative_approach: 'Consider using a sliding window or divide-and-conquer strategy if applicable.',
    correctness_analysis: isAccepted
      ? 'The solution produces correct outputs for tested cases.'
      : 'The solution fails on some test cases. Trace through with a small example manually.',
    complexity_analysis: 'Time complexity aligns with expected bounds for this problem difficulty.',
    maintainability_analysis: 'Code structure is readable. Use more descriptive variable names.',
    interview_readiness: isAccepted
      ? 'Ready for medium-difficulty interview questions on this topic.'
      : 'Needs more practice. Review core algorithm patterns before interviews.',
    next_steps: [
      'Practice 2-3 more problems of the same pattern.',
      'Try solving it in a different language.',
      'Review space complexity optimizations.',
    ],
    confidence: isAccepted ? 0.85 : 0.55,
  };
}

export function generateEditorial(
  problemTitle: string,
  topic: string,
): EditorialResult {
  const editorials: Record<string, string> = {
    Array: 'Use a hash map to track seen elements and their indices. Iterate once, checking if the complement exists.',
    'Linked List': 'Maintain three pointers: previous, current, and next. Iterate and reverse the next pointer direction.',
    Stack: 'Use a stack to push opening brackets. On closing bracket, pop and check match.',
    'Binary Search': 'Compare target with middle element. Eliminate half the array each iteration.',
    'Dynamic Programming': 'Define state as the optimal answer up to index i. Build bottom-up or memoize top-down.',
    String: 'Use a sliding window and a frequency map. Expand and contract the window while maintaining invariants.',
    Graph: 'Model as adjacency list. Use BFS or DFS to explore connected components or detect cycles.',
    Tree: 'Use recursion to traverse. For each node, compute the desired value from its children.',
    Backtracking: 'Explore all possibilities recursively. Prune branches that violate constraints early.',
    Heap: 'Use a min-heap of size k. Push elements and pop the smallest when size exceeds k.',
    Design: 'Combine a hash map for O(1) lookups with a doubly linked list for O(1) move-to-front operations.',
    Math: 'Reverse half the number digit by digit. Compare the reversed half with the remaining half.',
    Greedy: 'Sort by a key property. Iterate and make locally optimal choices that lead to global optimum.',
  };

  return {
    concept_explanation:
      editorials[topic] ||
      'The core idea is to identify the optimal substructure or invariant property of the problem and exploit it with an efficient algorithm.',
    step_by_step: [
      `Understand the problem constraints for "${problemTitle}".`,
      'Identify the pattern (e.g., hash map, two pointers, DP).',
      'Implement the core logic with clean variable names.',
      'Validate against edge cases (empty input, single element, maximum size).',
      'Optimize for time and space complexity.',
    ],
    optimized_code:
      '// Optimized pseudocode\nfunction solve(input):\n    // Initialize data structures\n    // Iterate through input\n    // Apply core logic\n    // Return result',
    tutorial_topic: topic,
    tutorial_link: `/tutorials?topic=${encodeURIComponent(topic)}`,
  };
}

export function generateAIAnalysis(
  weakTopics: string[],
  accuracy: number,
): AIAnalysisResult {
  const readiness: Record<string, number> = {
    Amazon: Math.min(100, Math.round(accuracy * 0.9 + Math.random() * 10)),
    Google: Math.min(100, Math.round(accuracy * 0.85 + Math.random() * 10)),
    Meta: Math.min(100, Math.round(accuracy * 0.88 + Math.random() * 10)),
    Microsoft: Math.min(100, Math.round(accuracy * 0.92 + Math.random() * 10)),
    Adobe: Math.min(100, Math.round(accuracy * 0.95 + Math.random() * 5)),
  };

  return {
    trigger: 'weekly',
    weak_topics: weakTopics.length ? weakTopics : ['Graph', 'Dynamic Programming'],
    learning_patterns: [
      'Consistent daily practice shows positive correlation with accuracy.',
      'Attempting problems above current level improves long-term retention.',
    ],
    recommendations: [
      {
        title: 'Focus on Weak Topics',
        reason: `Your accuracy in ${weakTopics[0] || 'Graph'} is below average.`,
        action_item: 'Complete 5 medium problems in this topic this week.',
        problem_id: 1,
      },
      {
        title: 'Mock Interview Practice',
        reason: 'Simulated pressure improves real interview performance.',
        action_item: 'Take a timed mock test every weekend.',
        problem_id: 2,
      },
    ],
    readiness,
    roadmap_refreshed: true,
    refresh_error: null,
  };
}
