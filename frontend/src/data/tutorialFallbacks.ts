import type { TutorialItem } from '../types/coding';

export const tutorialFallbacks: TutorialItem[] = [
  {
    topic: 'Arrays',
    title: 'Arrays Fundamentals',
    concept: 'Arrays are core to DSA. Used in prefix sums, sliding window, hashing, and two-pointer problems.',
    code_example:
      'def two_sum(nums, target):\n    seen = {}\n    for i, value in enumerate(nums):\n        if target - value in seen:\n            return [seen[target - value], i]\n        seen[value] = i',
    complexity: 'O(n) time, O(n) space',
    practice_tips: 'Focus on sliding window, prefix sum, Kadane’s algorithm, and two-pointer patterns.',
    resource_link: 'https://takeuforward.org/blogs/array/',
    video_links: [
      'https://www.youtube.com/watch?v=37E9ckMDdTk', // Striver Arrays Playlist
      'https://www.youtube.com/watch?v=1pkOgXD63yU'  // NeetCode Arrays
    ],
    article_snippets: [
      {
        title: 'Kadane Algorithm',
        language: 'python',
        code: 'def max_subarray(nums):\n    curr = max_sum = nums[0]\n    for x in nums[1:]:\n        curr = max(x, curr + x)\n        max_sum = max(max_sum, curr)\n    return max_sum',
      },
    ],
  },

  {
    topic: 'Strings',
    title: 'String Patterns',
    concept: 'Covers frequency maps, sliding window, palindrome, hashing, and substring matching.',
    code_example:
      'from collections import Counter\n\ndef is_anagram(a, b):\n    return Counter(a) == Counter(b)',
    complexity: 'O(n)',
    practice_tips: 'Master sliding window and hashing for substring problems.',
    resource_link: 'https://takeuforward.org/blogs/string/',
    video_links: [
      'https://www.youtube.com/watch?v=3IETreEybaA',
      'https://www.youtube.com/watch?v=wiGpQwVHdE0'
    ],
    article_snippets: [],
  },

  {
    topic: 'Binary Search',
    title: 'Binary Search Mastery',
    concept: 'Efficient search in sorted/monotonic data.',
    code_example:
      'def binary_search(nums, target):\n    l, r = 0, len(nums)-1\n    while l <= r:\n        m = (l+r)//2\n        if nums[m] == target:\n            return m\n        elif nums[m] < target:\n            l = m + 1\n        else:\n            r = m - 1\n    return -1',
    complexity: 'O(log n)',
    practice_tips: 'Practice lower_bound, upper_bound, and answer-space problems.',
    resource_link: 'https://takeuforward.org/blogs/binary-search/',
    video_links: [
      'https://www.youtube.com/watch?v=Y4Vj3ywV1xY',
      'https://www.youtube.com/watch?v=GU7DpgHINWQ'
    ],
    article_snippets: [],
  },

  {
    topic: 'Linked List',
    title: 'Linked List Patterns',
    concept: 'Pointer manipulation, cycle detection, reversing, merging.',
    code_example:
      'def reverse_list(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev',
    complexity: 'O(n)',
    practice_tips: 'Master slow-fast pointer and in-place reversal.',
    resource_link: 'https://takeuforward.org/blogs/linked-list/',
    video_links: [
      'https://www.youtube.com/watch?v=7vC0cE8nZ0o',
      'https://www.youtube.com/watch?v=G0_I-ZF0S38'
    ],
    article_snippets: [],
  },

  {
    topic: 'Tree',
    title: 'Binary Tree & BST',
    concept: 'Tree traversals, recursion, DFS, BFS, BST properties.',
    code_example:
      'def inorder(root):\n    if not root:\n        return\n    inorder(root.left)\n    print(root.val)\n    inorder(root.right)',
    complexity: 'O(n)',
    practice_tips: 'Master recursion + traversal patterns.',
    resource_link: 'https://takeuforward.org/blogs/binary-tree/',
    video_links: [
      'https://www.youtube.com/watch?v=I2lbI6r4X5Q',
      'https://www.youtube.com/watch?v=9RHO6jU--GU'
    ],
    article_snippets: [],
  },

  {
    topic: 'Graph',
    title: 'Graph Algorithms',
    concept: 'Graph traversal using BFS, DFS, shortest path, topological sort.',
    code_example:
      'from collections import deque\n\ndef bfs(graph, start):\n    visited = set([start])\n    q = deque([start])\n    while q:\n        node = q.popleft()\n        for nei in graph[node]:\n            if nei not in visited:\n                visited.add(nei)\n                q.append(nei)',
    complexity: 'O(V + E)',
    practice_tips: 'Focus on BFS, DFS, cycle detection, shortest path.',
    resource_link: 'https://takeuforward.org/graph/graph-blogs-and-algorithms/',
    video_links: [
      'https://www.youtube.com/watch?v=pcKY4hjDrxk',
      'https://www.youtube.com/watch?v=tWVWeAqZ0WU'
    ],
    article_snippets: [],
  },

  {
    topic: 'Dynamic Programming',
    title: 'DP Patterns',
    concept: 'Solve overlapping subproblems using memoization and tabulation.',
    code_example:
      'def fib(n, dp={}):\n    if n <= 1:\n        return n\n    if n in dp:\n        return dp[n]\n    dp[n] = fib(n-1) + fib(n-2)\n    return dp[n]',
    complexity: 'O(n)',
    practice_tips: 'Learn state, transition, base case clearly.',
    resource_link: 'https://takeuforward.org/dynamic-programming/',
    video_links: [
      'https://www.youtube.com/watch?v=oBt53YbR9Kk',
      'https://www.youtube.com/watch?v=tyB0ztf0DNY'
    ],
    article_snippets: [],
  },

  {
    topic: 'Greedy',
    title: 'Greedy Algorithms',
    concept: 'Make locally optimal choices to achieve global optimum.',
    code_example:
      'def activity_selection(start, end):\n    activities = sorted(zip(start, end), key=lambda x: x[1])\n    count = 1\n    last_end = activities[0][1]\n    for s, e in activities[1:]:\n        if s >= last_end:\n            count += 1\n            last_end = e\n    return count',
    complexity: 'O(n log n)',
    practice_tips: 'Identify sorting + greedy choice patterns.',
    resource_link: 'https://takeuforward.org/blogs/greedy-algorithm/',
    video_links: [
      'https://www.youtube.com/watch?v=ARvQcqJ_-NY'
    ],
    article_snippets: [],
  },

  {
    topic: 'Heap',
    title: 'Heap / Priority Queue',
    concept: 'Used for top-k problems, scheduling, and priority handling.',
    code_example:
      'import heapq\n\ndef top_k(nums, k):\n    return heapq.nlargest(k, nums)',
    complexity: 'O(n log k)',
    practice_tips: 'Practice top-k and heap push/pop operations.',
    resource_link: 'https://takeuforward.org/blogs/heap-priority-queue/',
    video_links: [
      'https://www.youtube.com/watch?v=HqPJF2L5h9U'
    ],
    article_snippets: [],
  },

  {
    topic: 'Backtracking',
    title: 'Backtracking Patterns',
    concept: 'Explore all possibilities using recursion and pruning.',
    code_example:
      'def subsets(nums):\n    res = []\n    def backtrack(i, path):\n        res.append(path[:])\n        for j in range(i, len(nums)):\n            path.append(nums[j])\n            backtrack(j+1, path)\n            path.pop()\n    backtrack(0, [])\n    return res',
    complexity: 'Exponential',
    practice_tips: 'Visualize recursion tree and prune early.',
    resource_link: 'https://takeuforward.org/blogs/backtracking/',
    video_links: [
      'https://www.youtube.com/watch?v=DKCbsiDBN6c'
    ],
    article_snippets: [],
  },

  {
    topic: 'Trie',
    title: 'Trie (Prefix Tree)',
    concept: 'Efficient prefix-based searching.',
    code_example:
      'class Trie:\n    def __init__(self):\n        self.children = {}\n        self.end = False',
    complexity: 'O(L)',
    practice_tips: 'Use for autocomplete and prefix matching.',
    resource_link: 'https://takeuforward.org/blogs/trie/',
    video_links: [
      'https://www.youtube.com/watch?v=oobqoCJlHA0'
    ],
    article_snippets: [],
  },
];