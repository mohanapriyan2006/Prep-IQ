import { useState } from 'react';
import { AlertTriangle, Brain, CheckCircle2, Gauge, Sparkles, Zap } from 'lucide-react';

import { Card } from '../ui/Card';
import { fetchProblemCodeReview } from '../../services/api';
import type { CodeLanguage, CodeReviewResult } from '../../types/coding';

interface CodeReviewPanelProps {
  problemId: number;
  language: CodeLanguage;
  code: string;
  status: string;
}

export function CodeReviewPanel({ problemId, language, code, status }: CodeReviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const codeLines = code.split('\n').length;
  const hasRecursion = /(\w+)\s*\([^)]*\)\s*\{?[\s\S]*\1\s*\(/m.test(code);
  const nestedLoopCount = (code.match(/for\s*\(|while\s*\(/g) || []).length;
  const styleWarnings = [
    code.includes('bits/stdc++.h') ? 'Avoid non-standard headers in interview-grade C++ submissions.' : null,
    codeLines > 140 ? 'Solution is lengthy; consider extraction of reusable helpers and tighter logic.' : null,
    nestedLoopCount >= 3 ? 'Multiple loops detected; re-check asymptotic behavior for worst-case inputs.' : null,
    status !== 'Accepted' ? 'Last known status is not Accepted; prioritize correctness before micro-optimizations.' : null,
  ].filter(Boolean) as string[];

  const qualityScore = review
    ? Math.max(
        40,
        Math.min(
          98,
          84 +
            (review.improvements.length === 0 ? 4 : -review.improvements.length * 2) +
            Math.round((review.confidence - 50) / 4) +
            (status === 'Accepted' ? 4 : -4)
        )
      )
    : null;

  const onRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProblemCodeReview({
        problem_id: problemId,
        language,
        code,
        status,
      });
      setReview(result);
    } catch {
      setError('Code review is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card hover={false} className="space-y-3 border-[#1F2937] bg-[#0B1220]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#E2E8F0]">AI Code Review</h3>
          <p className="mt-0.5 text-[11px] text-[#94A3B8]">Detailed breakdown: correctness, complexity, maintainability, and interview readiness.</p>
        </div>
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? 'Reviewing...' : 'Run Review'}
        </button>
      </div>
      {error ? <p className="text-xs text-[#FCA5A5]">{error}</p> : null}
      {review ? (
        <div className="space-y-3 text-sm text-[#CBD5E1]">
          <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Review Source</p>
            <p className="mt-1 text-xs text-[#E2E8F0]">{review.review_source} • Confidence {review.confidence}%</p>
            <p className="mt-1 text-xs text-[#CBD5E1]">{review.summary}</p>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Verdict</p>
              <p className="mt-1 font-semibold text-[#E2E8F0]">{review.verdict}</p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Time</p>
              <p className="mt-1 font-semibold text-[#E2E8F0]">{review.time_complexity}</p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Space</p>
              <p className="mt-1 font-semibold text-[#E2E8F0]">{review.space_complexity}</p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Quality Score</p>
              <p className="mt-1 inline-flex items-center gap-1 font-semibold text-[#93C5FD]">
                <Gauge className="h-3.5 w-3.5" />
                {qualityScore ?? 'N/A'} / 100
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Optimality Check</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-[#E2E8F0]">
              {review.confidence >= 70 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              {review.optimal_solution}
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Correctness</p>
              <p className="mt-1 text-xs text-[#CBD5E1]">{review.correctness_analysis}</p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Complexity</p>
              <p className="mt-1 text-xs text-[#CBD5E1]">{review.complexity_analysis}</p>
            </div>
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
              <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Maintainability</p>
              <p className="mt-1 text-xs text-[#CBD5E1]">{review.maintainability_analysis}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Critical Improvements</p>
            <ul className="mt-1 space-y-1 text-xs rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
              {review.improvements.map((item) => (
                <li key={item} className="inline-flex items-start gap-2">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#60A5FA]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Alternative Approach</p>
            <p className="mt-1 text-sm text-[#CBD5E1]">{review.alternative_approach}</p>
          </div>

          <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
            <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Interview Readiness</p>
            <p className="mt-1 text-sm text-[#CBD5E1]">{review.interview_readiness}</p>
            <ul className="mt-2 space-y-1 text-xs text-[#CBD5E1]">
              {review.next_steps.map((step) => (
                <li key={step}>- {step}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
              <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-[#94A3B8]">
                <Brain className="h-3.5 w-3.5" />
                Structural Signals
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#CBD5E1]">
                <li>Lines of code: {codeLines}</li>
                <li>Loop count: {nestedLoopCount}</li>
                <li>Recursion detected: {hasRecursion ? 'Yes' : 'No'}</li>
                <li>Last execution status: {status || 'Idle'}</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] p-3">
              <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-[#94A3B8]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Risk Flags
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#CBD5E1]">
                {styleWarnings.length === 0 ? (
                  <li>No obvious structural risks found.</li>
                ) : (
                  styleWarnings.map((warning) => <li key={warning}>- {warning}</li>)
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#94A3B8]">Run code review after execution to get a full optimization checklist and interview readiness score.</p>
      )}
    </Card>
  );
}
