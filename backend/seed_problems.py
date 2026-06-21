"""Seed the database with sample coding problems."""

import sys
import os

# Ensure the backend app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.config import get_settings
from app.database import Base, engine, SessionLocal
from app.models.company_pattern import CompanyPattern
from app.models.problem import Problem
from app.models.tutorial import Tutorial
import app.models  # noqa: F401

PROBLEMS = [
    {
        "title": "Two Sum",
        "difficulty": "Easy",
        "topic": "Arrays",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return the "
            "indices of the two numbers such that they add up to `target`.\n\n"
            "You may assume that each input would have exactly one solution, and you "
            "may not use the same element twice.\n\n"
            "Print the two indices separated by a space (0-indexed), smaller index first."
        ),
        "input_format": "First line: space-separated integers (the array).\nSecond line: the target integer.",
        "output_format": "Two space-separated indices.",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9",
        "examples": [
            {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
        ],
        "company_tags": ["Google", "Amazon", "Microsoft", "Meta"],
        "hints": [
            "Try using a hash map to store values you have already seen.",
            "For each element, check if target - element exists in the map.",
        ],
        "visible_testcases": [
            {"input": "2 7 11 15\n9", "expected_output": "0 1"},
            {"input": "3 2 4\n6", "expected_output": "1 2"},
        ],
        "hidden_testcases": [
            {"input": "3 3\n6", "expected_output": "0 1"},
            {"input": "1 5 3 7\n8", "expected_output": "1 2"},
        ],
    },
    {
        "title": "Reverse String",
        "difficulty": "Easy",
        "topic": "Strings",
        "description": (
            "Write a program that reverses a given string.\n\n"
            "Read a string from standard input and print the reversed string."
        ),
        "input_format": "A single line containing a string.",
        "output_format": "The reversed string.",
        "constraints": "1 <= s.length <= 10^5\ns consists of printable ASCII characters.",
        "examples": [
            {"input": "hello", "output": "olleh"},
            {"input": "PrepIQ", "output": "QIperP"},
        ],
        "company_tags": ["Microsoft", "Apple"],
        "hints": ["Two-pointer approach: swap characters from both ends moving inward."],
        "visible_testcases": [
            {"input": "hello", "expected_output": "olleh"},
            {"input": "PrepIQ", "expected_output": "QIperP"},
        ],
        "hidden_testcases": [
            {"input": "a", "expected_output": "a"},
            {"input": "racecar", "expected_output": "racecar"},
            {"input": "abcdef", "expected_output": "fedcba"},
        ],
    },
    {
        "title": "Fibonacci Number",
        "difficulty": "Easy",
        "topic": "Dynamic Programming",
        "description": (
            "The Fibonacci numbers form a sequence such that each number is the sum "
            "of the two preceding ones, starting from 0 and 1.\n\n"
            "Given an integer `n`, return the n-th Fibonacci number.\n\n"
            "F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) for n > 1."
        ),
        "input_format": "A single integer n.",
        "output_format": "The n-th Fibonacci number.",
        "constraints": "0 <= n <= 30",
        "examples": [
            {"input": "5", "output": "5", "explanation": "F(5) = F(4) + F(3) = 3 + 2 = 5"},
            {"input": "10", "output": "55"},
        ],
        "company_tags": ["Amazon", "Goldman Sachs"],
        "hints": ["Use iterative approach to avoid exponential time complexity of recursion."],
        "visible_testcases": [
            {"input": "5", "expected_output": "5"},
            {"input": "10", "expected_output": "55"},
        ],
        "hidden_testcases": [
            {"input": "0", "expected_output": "0"},
            {"input": "1", "expected_output": "1"},
            {"input": "20", "expected_output": "6765"},
            {"input": "30", "expected_output": "832040"},
        ],
    },
    {
        "title": "Maximum Subarray",
        "difficulty": "Medium",
        "topic": "Arrays",
        "description": (
            "Given an integer array `nums`, find the subarray with the largest sum "
            "and return its sum.\n\n"
            "A subarray is a contiguous non-empty sequence of elements within an array."
        ),
        "input_format": "A single line of space-separated integers.",
        "output_format": "A single integer — the maximum subarray sum.",
        "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        "examples": [
            {"input": "-2 1 -3 4 -1 2 1 -5 4", "output": "6", "explanation": "The subarray [4,-1,2,1] has the largest sum 6."},
            {"input": "1", "output": "1"},
        ],
        "company_tags": ["Amazon", "Microsoft", "LinkedIn", "Apple"],
        "hints": [
            "Use Kadane's algorithm.",
            "Keep track of the current subarray sum. If it becomes negative, reset it to 0.",
        ],
        "visible_testcases": [
            {"input": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6"},
            {"input": "1", "expected_output": "1"},
        ],
        "hidden_testcases": [
            {"input": "5 4 -1 7 8", "expected_output": "23"},
            {"input": "-1", "expected_output": "-1"},
            {"input": "-2 -1", "expected_output": "-1"},
        ],
    },
    {
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "topic": "Stacks",
        "description": (
            "Given a string `s` containing just the characters '(', ')', '{', '}', "
            "'[' and ']', determine if the input string is valid.\n\n"
            "An input string is valid if:\n"
            "- Open brackets are closed by the same type of brackets.\n"
            "- Open brackets are closed in the correct order.\n"
            "- Every close bracket has a corresponding open bracket of the same type.\n\n"
            "Print `true` if valid, `false` otherwise."
        ),
        "input_format": "A single line containing the string s.",
        "output_format": "'true' or 'false'.",
        "constraints": "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
        "examples": [
            {"input": "()", "output": "true"},
            {"input": "()[]{}", "output": "true"},
            {"input": "(]", "output": "false"},
        ],
        "company_tags": ["Google", "Amazon", "Meta", "Bloomberg"],
        "hints": [
            "Use a stack to keep track of opening brackets.",
            "When you encounter a closing bracket, check if the top of the stack matches.",
        ],
        "visible_testcases": [
            {"input": "()", "expected_output": "true"},
            {"input": "()[]{}", "expected_output": "true"},
            {"input": "(]", "expected_output": "false"},
        ],
        "hidden_testcases": [
            {"input": "([)]", "expected_output": "false"},
            {"input": "{[]}", "expected_output": "true"},
            {"input": "", "expected_output": "true"},
            {"input": "((()))", "expected_output": "true"},
        ],
    },
    {
        "title": "Merge Two Sorted Arrays",
        "difficulty": "Easy",
        "topic": "Arrays",
        "description": (
            "Given two sorted arrays of integers, merge them into a single sorted array.\n\n"
            "Print the merged array as space-separated integers."
        ),
        "input_format": "First line: space-separated integers of array 1.\nSecond line: space-separated integers of array 2.",
        "output_format": "Space-separated integers of the merged sorted array.",
        "constraints": "0 <= length of each array <= 10^4",
        "examples": [
            {"input": "1 3 5\n2 4 6", "output": "1 2 3 4 5 6"},
            {"input": "1\n", "output": "1"},
        ],
        "company_tags": ["Microsoft", "Adobe"],
        "hints": ["Use two pointers, one for each array, and compare elements."],
        "visible_testcases": [
            {"input": "1 3 5\n2 4 6", "expected_output": "1 2 3 4 5 6"},
            {"input": "1\n", "expected_output": "1"},
        ],
        "hidden_testcases": [
            {"input": "\n1 2 3", "expected_output": "1 2 3"},
            {"input": "1 2 3\n4 5 6", "expected_output": "1 2 3 4 5 6"},
            {"input": "1 1 1\n1 1 1", "expected_output": "1 1 1 1 1 1"},
        ],
    },
    {
        "title": "Longest Common Subsequence",
        "difficulty": "Medium",
        "topic": "Dynamic Programming",
        "description": (
            "Given two strings `text1` and `text2`, return the length of their "
            "longest common subsequence. If there is no common subsequence, return 0.\n\n"
            "A subsequence of a string is a new string generated from the original "
            "string with some characters (can be none) deleted without changing the "
            "relative order of the remaining characters."
        ),
        "input_format": "First line: string text1.\nSecond line: string text2.",
        "output_format": "A single integer — length of the longest common subsequence.",
        "constraints": "1 <= text1.length, text2.length <= 1000\nStrings consist of lowercase English letters only.",
        "examples": [
            {"input": "abcde\nace", "output": "3", "explanation": "The LCS is 'ace' with length 3."},
            {"input": "abc\nabc", "output": "3"},
            {"input": "abc\ndef", "output": "0"},
        ],
        "company_tags": ["Amazon", "Google", "Uber"],
        "hints": [
            "Use 2D DP where dp[i][j] = LCS of text1[:i] and text2[:j].",
            "If text1[i-1] == text2[j-1], dp[i][j] = dp[i-1][j-1] + 1.",
        ],
        "visible_testcases": [
            {"input": "abcde\nace", "expected_output": "3"},
            {"input": "abc\nabc", "expected_output": "3"},
            {"input": "abc\ndef", "expected_output": "0"},
        ],
        "hidden_testcases": [
            {"input": "a\na", "expected_output": "1"},
            {"input": "abcdefg\nbdfg", "expected_output": "4"},
            {"input": "oxcpqrsvwf\nshmtulqrypy", "expected_output": "2"},
        ],
    },
    {
        "title": "Binary Search",
        "difficulty": "Easy",
        "topic": "Searching",
        "description": (
            "Given a sorted array of integers and a target value, implement binary "
            "search to find the target.\n\n"
            "If the target exists, print its index (0-indexed). Otherwise, print -1."
        ),
        "input_format": "First line: space-separated sorted integers.\nSecond line: the target integer.",
        "output_format": "Index of the target, or -1.",
        "constraints": "1 <= nums.length <= 10^4\n-10^4 <= nums[i], target <= 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.",
        "examples": [
            {"input": "-1 0 3 5 9 12\n9", "output": "4"},
            {"input": "-1 0 3 5 9 12\n2", "output": "-1"},
        ],
        "company_tags": ["Google", "Microsoft", "Amazon"],
        "hints": ["Use two pointers (low, high) and check the midpoint each iteration."],
        "visible_testcases": [
            {"input": "-1 0 3 5 9 12\n9", "expected_output": "4"},
            {"input": "-1 0 3 5 9 12\n2", "expected_output": "-1"},
        ],
        "hidden_testcases": [
            {"input": "5\n5", "expected_output": "0"},
            {"input": "1 2 3 4 5\n1", "expected_output": "0"},
            {"input": "1 2 3 4 5\n5", "expected_output": "4"},
            {"input": "1 2 3 4 5\n6", "expected_output": "-1"},
        ],
    },
    {
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "topic": "Dynamic Programming",
        "description": (
            "You are climbing a staircase. It takes `n` steps to reach the top.\n\n"
            "Each time you can either climb 1 or 2 steps. In how many distinct ways "
            "can you climb to the top?"
        ),
        "input_format": "A single integer n.",
        "output_format": "A single integer — the number of distinct ways.",
        "constraints": "1 <= n <= 45",
        "examples": [
            {"input": "2", "output": "2", "explanation": "1+1 or 2"},
            {"input": "3", "output": "3", "explanation": "1+1+1, 1+2, or 2+1"},
        ],
        "company_tags": ["Amazon", "Apple", "Adobe"],
        "hints": [
            "This is a Fibonacci variant.",
            "dp[i] = dp[i-1] + dp[i-2]",
        ],
        "visible_testcases": [
            {"input": "2", "expected_output": "2"},
            {"input": "3", "expected_output": "3"},
        ],
        "hidden_testcases": [
            {"input": "1", "expected_output": "1"},
            {"input": "5", "expected_output": "8"},
            {"input": "10", "expected_output": "89"},
            {"input": "45", "expected_output": "1836311903"},
        ],
    },
    {
        "title": "Container With Most Water",
        "difficulty": "Medium",
        "topic": "Two Pointers",
        "description": (
            "You are given an integer array `height` of length n. There are n vertical "
            "lines drawn such that the two endpoints of the i-th line are (i, 0) and "
            "(i, height[i]).\n\n"
            "Find two lines that together with the x-axis form a container that holds "
            "the most water.\n\n"
            "Return the maximum amount of water a container can store."
        ),
        "input_format": "A single line of space-separated integers representing heights.",
        "output_format": "A single integer — the maximum area.",
        "constraints": "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
        "examples": [
            {"input": "1 8 6 2 5 4 8 3 7", "output": "49"},
            {"input": "1 1", "output": "1"},
        ],
        "company_tags": ["Amazon", "Goldman Sachs", "Google", "Meta"],
        "hints": [
            "Use two pointers starting at both ends.",
            "Move the pointer with the shorter line inward.",
        ],
        "visible_testcases": [
            {"input": "1 8 6 2 5 4 8 3 7", "expected_output": "49"},
            {"input": "1 1", "expected_output": "1"},
        ],
        "hidden_testcases": [
            {"input": "4 3 2 1 4", "expected_output": "16"},
            {"input": "1 2 1", "expected_output": "2"},
        ],
    },
]


def _build_problem(
    title: str,
    difficulty: str,
    topic: str,
    sample_input: str,
    sample_output: str,
    description: str,
    *,
    is_premium: bool = False,
) -> dict:
    return {
        "title": title,
        "difficulty": difficulty,
        "topic": topic,
        "topic_tags": [topic],
        "is_premium": is_premium,
        "description": description,
        "input_format": "Read input from standard input as defined in the problem statement.",
        "output_format": "Print the expected result exactly as required.",
        "constraints": "Follow standard interview constraints for this problem.",
        "examples": [
            {"input": sample_input, "output": sample_output},
        ],
        "company_tags": ["Amazon", "Google", "Microsoft"],
        "hints": [
            "Start with the brute-force approach first.",
            "Then optimize using the topic-specific pattern.",
        ],
        "visible_testcases": [
            {"input": sample_input, "expected_output": sample_output},
        ],
        "hidden_testcases": [
            {"input": sample_input, "expected_output": sample_output},
        ],
    }


PROBLEMS.extend(
    [
        _build_problem("Subarray Sum Equals K", "Medium", "Array", "1 1 1\n2", "2", "Count contiguous subarrays whose sum equals k."),
        _build_problem("3Sum", "Medium", "Array", "-1 0 1 2 -1 -4", "-1 -1 2 | -1 0 1", "Return unique triplets that sum to zero."),
        _build_problem("Minimum Window Substring", "Hard", "String", "ADOBECODEBANC\nABC", "BANC", "Find the minimum window substring containing all characters of t."),
        _build_problem("Palindrome Partitioning", "Medium", "Backtracking", "aab", "a a b | aa b", "Return all palindrome partitionings of the string."),
        _build_problem("Clone Graph", "Medium", "Graph", "1-2,1-4,2-3,3-4", "cloned", "Clone an undirected graph and return the cloned structure."),
        _build_problem("Word Ladder", "Hard", "Graph", "hit\ncog\nhot dot dog lot log cog", "5", "Find shortest transformation sequence length between words."),
        _build_problem("House Robber", "Medium", "DP", "1 2 3 1", "4", "Maximize robbed money without taking adjacent houses."),
        _build_problem("Decode Ways", "Medium", "DP", "226", "3", "Count the number of valid decodings of a digit string."),
        _build_problem("Kth Largest Element", "Medium", "Heap", "3 2 1 5 6 4\n2", "5", "Find the k-th largest element in an unsorted array."),
        _build_problem("Top K Frequent Elements", "Medium", "Heap", "1 1 1 2 2 3\n2", "1 2", "Return the k most frequent elements."),
        _build_problem("Implement Trie", "Medium", "Trie", "insert apple; search apple; startsWith app", "true true", "Implement insert/search/prefix operations in a Trie."),
        _build_problem("Longest Increasing Subsequence", "Medium", "DP", "10 9 2 5 3 7 101 18", "4", "Find length of the longest strictly increasing subsequence."),
        _build_problem("Median of Two Sorted Arrays", "Hard", "Binary Search", "1 3\n2", "2.0", "Find the median of two sorted arrays in log complexity."),
        _build_problem("Spiral Matrix", "Medium", "Array", "1 2 3;4 5 6;7 8 9", "1 2 3 6 9 8 7 4 5", "Return elements of the matrix in spiral order."),
        _build_problem("Reorder List", "Medium", "Linked List", "1 2 3 4", "1 4 2 3", "Reorder linked list L0->Ln->L1->Ln-1 pattern."),
        _build_problem("Diameter of Binary Tree", "Easy", "Tree", "1 2 3 4 5", "3", "Return the length of the longest path between two nodes."),
        _build_problem("Serialize and Deserialize Tree", "Hard", "Tree", "1 2 3 null null 4 5", "1 2 3 null null 4 5", "Serialize and deserialize a binary tree consistently."),
        _build_problem("Sliding Window Maximum", "Hard", "Queue", "1 3 -1 -3 5 3 6 7\n3", "3 3 5 5 6 7", "Return max value in each sliding window."),
        _build_problem("N Queens", "Hard", "Backtracking", "4", "2", "Return the number of valid N-Queens configurations."),
        _build_problem("Course Schedule II", "Medium", "Graph", "4\n1 0,2 0,3 1,3 2", "0 1 2 3", "Return a valid course order using topological sorting."),
        _build_problem("Unique Paths", "Medium", "DP", "3 7", "28", "Count unique paths from top-left to bottom-right in a grid."),
        _build_problem("Word Break", "Medium", "DP", "leetcode\nleet code", "true", "Check if string can be segmented with dictionary words."),
        _build_problem("Merge Intervals", "Medium", "Greedy", "1 3,2 6,8 10,15 18", "1 6,8 10,15 18", "Merge all overlapping intervals."),
        _build_problem("Insert Interval", "Medium", "Greedy", "1 3,6 9\n2 5", "1 5,6 9", "Insert a new interval and merge overlaps."),
        _build_problem("Find Minimum in Rotated Sorted Array", "Medium", "Binary Search", "3 4 5 1 2", "1", "Find minimum element in a rotated sorted array."),
        _build_problem("4Sum", "Medium", "Array", "1 0 -1 0 -2 2\n0", "-2 -1 1 2 | -2 0 0 2 | -1 0 0 1", "Return unique quadruplets that sum to target."),
        _build_problem("Continuous Subarray Sum", "Medium", "Array", "23 2 4 6 7\n6", "true", "Check if subarray sum is a multiple of k."),
        _build_problem("Path Sum", "Easy", "Tree", "5 4 8 11 null 13 4 7 2 null null null 1\n22", "true", "Check if root-to-leaf path equals target sum."),
        _build_problem("Path Sum II", "Medium", "Tree", "5 4 8 11 null 13 4 7 2 null null 5 1\n22", "2", "Return all root-to-leaf paths that sum to target."),
        _build_problem("Path Sum III", "Medium", "Tree", "10 5 -3 3 2 null 11 3 -2 null 1\n8", "3", "Count all downward paths whose values sum to target."),
        _build_problem("Target Sum", "Medium", "DP", "1 1 1 1 1\n3", "5", "Count ways to assign +/- signs to reach target."),
        _build_problem("Combination Sum", "Medium", "Backtracking", "2 3 6 7\n7", "2 2 3 | 7", "Return combinations where numbers sum to target."),
        _build_problem("Combination Sum II", "Medium", "Backtracking", "10 1 2 7 6 1 5\n8", "1 1 6 | 1 2 5 | 1 7 | 2 6", "Return unique combinations where each element is used once."),
        _build_problem("Max Sum of Rectangle No Larger Than K", "Hard", "DP", "1 0 1;0 -2 3\n2", "2", "Find max rectangle sum no larger than k.", is_premium=True),
        _build_problem("2D Range Sum Query - Mutable", "Hard", "Segment Tree", "NumMatrix init; sumRegion 2 1 4 3", "8", "Design mutable 2D range sum query data structure.", is_premium=True),
        _build_problem("Maximum Sum of 3 Non-Overlapping Subarrays", "Hard", "DP", "1 2 1 2 6 7 5 1\n2", "0 3 5", "Find starting indices of three non-overlapping subarrays with max total sum.", is_premium=True),
        _build_problem("Split Array Largest Sum", "Hard", "Binary Search", "7 2 5 10 8\n2", "18", "Split array into m parts minimizing largest part sum.", is_premium=True),
        _build_problem("Maximum Subarray Sum With One Deletion", "Medium", "DP", "1 -2 0 3", "4", "Find max subarray sum when one deletion is allowed.", is_premium=True),
    ]
)

COMPANY_PATTERNS = [
    {"company": "Amazon", "topic": "Graphs", "weight": 0.3},
    {"company": "Amazon", "topic": "Dynamic Programming", "weight": 0.25},
    {"company": "Amazon", "topic": "Arrays", "weight": 0.25},
    {"company": "Amazon", "topic": "Strings", "weight": 0.2},
    {"company": "Google", "topic": "Graphs", "weight": 0.3},
    {"company": "Google", "topic": "Dynamic Programming", "weight": 0.3},
    {"company": "Google", "topic": "Arrays", "weight": 0.2},
    {"company": "Google", "topic": "Trees", "weight": 0.2},
    {"company": "Microsoft", "topic": "Arrays", "weight": 0.3},
    {"company": "Microsoft", "topic": "Strings", "weight": 0.25},
    {"company": "Microsoft", "topic": "Trees", "weight": 0.25},
    {"company": "Microsoft", "topic": "Hashing", "weight": 0.2},
]

TUTORIALS = [
    {
        "topic": "Arrays",
        "title": "Arrays Fundamentals",
        "concept": "Arrays store elements in contiguous memory and are best for indexed access and scanning patterns.",
        "code_example": "# Python\narr = [2, 7, 11, 15]\nfor i, val in enumerate(arr):\n    print(i, val)",
        "complexity": "Access: O(1), Search: O(n)",
        "practice_tips": "Master prefix sums, sliding window, and two-pointer transformations.",
        "resource_link": "https://takeuforward.org/arrays/",
        "video_links": [
            "https://www.youtube.com/watch?v=37E9ckMDdTk",
            "https://www.youtube.com/watch?v=Jg4E4K5M1f8",
        ],
        "article_snippets": [
            {
                "title": "Prefix Sum Pattern",
                "language": "python",
                "code": "def prefix_sum(nums):\n    pref = [0]\n    for x in nums:\n        pref.append(pref[-1] + x)\n    return pref",
            }
        ],
    },
    {
        "topic": "Strings",
        "title": "Strings Essentials",
        "concept": "String problems often combine frequency counting, windowing, and pattern matching.",
        "code_example": "# Python\ns = 'prepiq'\nprint(s[::-1])",
        "complexity": "Traversal: O(n)",
        "practice_tips": "Practice anagram checks, palindrome variants, and substring windows.",
        "resource_link": "https://takeuforward.org/strings/",
        "video_links": [
            "https://www.youtube.com/watch?v=4T7iM3K5n9s",
            "https://www.youtube.com/watch?v=0n7x4A2k8R8",
        ],
        "article_snippets": [
            {
                "title": "Frequency Counter",
                "language": "python",
                "code": "from collections import Counter\n\ndef is_anagram(a, b):\n    return Counter(a) == Counter(b)",
            }
        ],
    },
    {
        "topic": "Recursion",
        "title": "Recursion Patterns",
        "concept": "Recursion solves a problem by reducing it into smaller instances until base conditions are met.",
        "code_example": "def fib(n):\n    if n < 2:\n        return n\n    return fib(n-1) + fib(n-2)",
        "complexity": "Depends on branching; optimize with memoization.",
        "practice_tips": "Trace call stacks by hand and identify overlapping subproblems.",
        "resource_link": "https://takeuforward.org/recursion/",
        "video_links": [
            "https://www.youtube.com/watch?v=IJDJ0kBx2LM",
        ],
        "article_snippets": [
            {
                "title": "Backtracking Template",
                "language": "python",
                "code": "def backtrack(path, choices):\n    if goal(path):\n        output(path)\n        return\n    for c in choices:\n        path.append(c)\n        backtrack(path, choices)\n        path.pop()",
            }
        ],
    },
    {
        "topic": "Binary Search",
        "title": "Binary Search Mastery",
        "concept": "Binary search reduces the search space by half on each step in sorted or monotonic domains.",
        "code_example": "def bsearch(nums, target):\n    l, r = 0, len(nums)-1\n    while l <= r:\n        m = (l+r)//2\n        if nums[m] == target:\n            return m\n        if nums[m] < target:\n            l = m + 1\n        else:\n            r = m - 1\n    return -1",
        "complexity": "O(log n)",
        "practice_tips": "Learn first/last occurrence and answer-space binary search.",
        "resource_link": "https://takeuforward.org/binary-search/",
        "video_links": [
            "https://www.youtube.com/watch?v=Y4Vj3ywV1xY",
            "https://www.youtube.com/watch?v=QSPwI2jaWkI",
        ],
        "article_snippets": [
            {
                "title": "Lower Bound",
                "language": "python",
                "code": "def lower_bound(nums, target):\n    l, r = 0, len(nums)\n    while l < r:\n        m = (l + r) // 2\n        if nums[m] < target:\n            l = m + 1\n        else:\n            r = m\n    return l",
            }
        ],
    },
    {
        "topic": "Dynamic Programming",
        "title": "DP Core Concepts",
        "concept": "DP converts repeated recursive states into memoized or tabulated transitions.",
        "code_example": "def climb(n):\n    a, b = 1, 1\n    for _ in range(n-1):\n        a, b = b, a+b\n    return b",
        "complexity": "State dependent",
        "practice_tips": "Always define state, transition, and base cases explicitly.",
        "resource_link": "https://takeuforward.org/dynamic-programming/",
        "video_links": [
            "https://www.youtube.com/watch?v=tyB0ztf0DNY",
            "https://www.youtube.com/watch?v=oBt53YbR9Kk",
        ],
        "article_snippets": [
            {
                "title": "1D DP Scaffold",
                "language": "python",
                "code": "def solve(n):\n    dp = [0] * (n + 1)\n    dp[0] = 1\n    for i in range(1, n + 1):\n        dp[i] = dp[i - 1]\n        if i > 1:\n            dp[i] += dp[i - 2]\n    return dp[n]",
            }
        ],
    },
    {
        "topic": "Trees",
        "title": "Trees Basics and Traversals",
        "concept": "Trees are hierarchical structures; traversal order defines many problem solutions.",
        "code_example": "def inorder(root):\n    if not root:\n        return\n    inorder(root.left)\n    print(root.val)\n    inorder(root.right)",
        "complexity": "Traversal O(n)",
        "practice_tips": "Practice recursion and iterative stack/queue traversals.",
        "resource_link": "https://takeuforward.org/data-structure/tree-data-structure/",
        "video_links": [
            "https://www.youtube.com/watch?v=_ANrF3FJm7I",
        ],
        "article_snippets": [
            {
                "title": "Level Order BFS",
                "language": "python",
                "code": "from collections import deque\n\ndef level_order(root):\n    if not root:\n        return []\n    q, ans = deque([root]), []\n    while q:\n        node = q.popleft()\n        ans.append(node.val)\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)\n    return ans",
            }
        ],
    },
    {
        "topic": "Graphs",
        "title": "Graphs Foundation",
        "concept": "Graph traversal with BFS/DFS is central to connectivity and shortest path reasoning.",
        "code_example": "def dfs(graph, node, seen):\n    seen.add(node)\n    for nxt in graph[node]:\n        if nxt not in seen:\n            dfs(graph, nxt, seen)",
        "complexity": "O(V + E)",
        "practice_tips": "Master adjacency list representation and visited handling.",
        "resource_link": "https://takeuforward.org/graph/graph-data-structure-and-algorithms/",
        "video_links": [
            "https://www.youtube.com/watch?v=tWVWeAqZ0WU",
            "https://www.youtube.com/watch?v=pcKY4hjDrxk",
        ],
        "article_snippets": [
            {
                "title": "BFS Template",
                "language": "python",
                "code": "from collections import deque\n\ndef bfs(graph, src):\n    q, seen = deque([src]), {src}\n    while q:\n        node = q.popleft()\n        for nxt in graph[node]:\n            if nxt not in seen:\n                seen.add(nxt)\n                q.append(nxt)",
            }
        ],
    },
]

TOPIC_TUTORIAL_MAP = {row["topic"]: row["resource_link"] for row in TUTORIALS}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_titles = {row[0] for row in db.query(Problem.title).all()}
        inserted_count = 0
        for data in PROBLEMS:
            if data["title"] in existing_titles:
                continue
            seed_data = {**data, "tutorial_link": TOPIC_TUTORIAL_MAP.get(data["topic"])}
            problem = Problem(**seed_data)
            db.add(problem)
            inserted_count += 1
        print(f"Prepared {inserted_count} new problems for insert ({len(PROBLEMS)} total seed definitions).")

        existing_patterns = db.query(CompanyPattern).count()
        if existing_patterns == 0:
            for row in COMPANY_PATTERNS:
                db.add(CompanyPattern(**row))
            print(f"Prepared {len(COMPANY_PATTERNS)} company pattern rows for insert.")
        else:
            print(f"Database already has {existing_patterns} company patterns. Skipping pattern insert.")

        tutorial_upserts = 0
        for row in TUTORIALS:
            existing = db.query(Tutorial).filter(Tutorial.topic == row["topic"]).first()
            if existing:
                existing.title = row["title"]
                existing.concept = row["concept"]
                existing.code_example = row["code_example"]
                existing.complexity = row["complexity"]
                existing.practice_tips = row["practice_tips"]
                existing.resource_link = row["resource_link"]
                existing.video_links = row.get("video_links", [])
                existing.article_snippets = row.get("article_snippets", [])
            else:
                db.add(Tutorial(**row))
            tutorial_upserts += 1
        print(f"Prepared {tutorial_upserts} tutorials for upsert.")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
