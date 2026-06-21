import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Bookmark, CheckCircle2, Clock3, Maximize2, MemoryStick, Minimize2, Play, Send, TriangleAlert } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';

import { AuthRequiredCard } from '../components/auth/AuthRequiredCard';
import { CodeReviewPanel } from '../components/problems/CodeReviewPanel';
import { EditorialTab } from '../components/problems/EditorialTab';
import { ProblemEditor } from '../components/problems/ProblemEditor';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/useAuth';
import {
  executeCode,
  fetchProblem,
  fetchProgressAnalytics,
  fetchRoadmap,
  fetchSubmissions,
  fetchTopicStrength,
  submitCode,
  toggleProblemBookmark,
} from '../services/api';
import type { CodeLanguage, CodingProblem, SubmissionItem } from '../types/coding';

const STARTERS: Record<CodeLanguage, string> = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  // write code here\n  return 0;\n}\n',
  python: 'def solve():\n    # write code here\n    pass\n\nif __name__ == "__main__":\n    solve()\n',
  java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n    // write code here\n  }\n}\n',
  javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\n\n// write code here\nconsole.log(input);\n",
};

const languageLabel: Array<{ value: CodeLanguage; label: string; monaco: string }> = [
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];

export default function ProblemWorkspace() {
  const { problemId } = useParams<{ problemId: string }>();
  const location = useLocation();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [language, setLanguage] = useState<CodeLanguage>('cpp');
  const [code, setCode] = useState(STARTERS.cpp);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Idle');
  const [runtime, setRuntime] = useState<string>('');
  const [memory, setMemory] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [split, setSplit] = useState(47);
  const [roadmapDayTag, setRoadmapDayTag] = useState<number | null>(null);
  const [postSubmitInsight, setPostSubmitInsight] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'code-review' | 'editorial'>('description');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!problemId) return;
    void (async () => {
      const [fetchedProblem, fetchedSubmissions] = await Promise.all([
        fetchProblem(Number(problemId)),
        isAuthenticated ? fetchSubmissions(Number(problemId)) : Promise.resolve([]),
      ]);
      setProblem(fetchedProblem);
      setSubmissions(fetchedSubmissions);
      setInput(fetchedProblem.examples[0]?.input ?? '');

      if (isAuthenticated) {
        try {
          const roadmap = await fetchRoadmap();
          const match = roadmap.days.find((day) => day.topic.toLowerCase() === fetchedProblem.topic.toLowerCase());
          setRoadmapDayTag(match ? match.day_number : null);
        } catch {
          setRoadmapDayTag(null);
        }
      }
    })();
  }, [problemId, isAuthenticated]);

  useEffect(() => {
    setCode(STARTERS[language]);
  }, [language]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'editorial') {
      setActiveTab('editorial');
    }
  }, [location.search]);

  const onDragDivider = useCallback((event: MouseEvent) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(70, Math.max(30, next)));
  }, []);

  const startDragging = () => {
    const move = (event: MouseEvent) => onDragDivider(event);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await (arenaRef.current ?? document.documentElement).requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors and keep normal layout.
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const onRun = useCallback(async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      setStatus('Authentication Required');
      return;
    }
    setRunning(true);
    try {
      const result = await executeCode({ language, code, input });
      setStatus(result.status);
      setRuntime(result.runtime);
      setOutput([result.output, result.stderr].filter(Boolean).join('\n'));
      setMemory('N/A');
    } catch {
      setStatus('Error');
      setOutput('Execution failed. Check backend service and authentication.');
    } finally {
      setRunning(false);
    }
  }, [isAuthenticated, openAuthModal, language, code, input]);

  const onSubmit = useCallback(async () => {
    if (!problem) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      setStatus('Authentication Required');
      return;
    }
    setRunning(true);
    try {
      const result = await submitCode({
        problem_id: problem.id,
        language,
        code,
      });
      setStatus(result.status);
      setRuntime(result.runtime_ms !== null ? `${result.runtime_ms}ms` : 'N/A');
      setMemory(result.memory_kb !== null ? `${result.memory_kb} KB` : 'N/A');
      setOutput(`Passed ${result.passed}/${result.total} testcases\nStatus: ${result.status}`);
      const updated = await fetchSubmissions(problem.id);
      setSubmissions(updated);
      setProblem((prev) => (prev ? { ...prev, solved: result.status === 'Accepted' || prev.solved } : prev));

      try {
        const [progress, topicStrength] = await Promise.all([
          fetchProgressAnalytics(),
          fetchTopicStrength(),
        ]);
        const topicItem = topicStrength.topics.find((topic) => topic.topic.toLowerCase() === problem.topic.toLowerCase());
        const topicImpact = topicItem ? `${topicItem.classification} (${topicItem.accuracy}% accuracy)` : 'updating';
        setPostSubmitInsight(
          `${result.roadmap_progress_update ?? `Roadmap progress ${progress.roadmap_completion}%`} • ${result.topic_mastery_update ?? `Topic mastery impact for ${problem.topic}: ${topicImpact}`}.`
        );
      } catch {
        setPostSubmitInsight('Submission recorded. Analytics refresh is temporarily unavailable.');
      }
    } catch {
      setStatus('Error');
      setOutput('Submission failed. Verify backend, token, and problem data.');
    } finally {
      setRunning(false);
    }
  }, [problem, isAuthenticated, openAuthModal, language, code]);

  const onToggleBookmark = async () => {
    if (!problem) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const result = await toggleProblemBookmark(problem.id);
    setProblem((prev) => (prev ? { ...prev, is_bookmarked: result.bookmarked } : prev));
  };

  const monacoLanguage = useMemo(() => {
    return languageLabel.find((item) => item.value === language)?.monaco ?? 'cpp';
  }, [language]);

  if (!problem) {
    return <Card hover={false}>Loading workspace...</Card>;
  }

  return (
    <div ref={arenaRef} className="space-y-3">
      {!isAuthenticated ? (
        <AuthRequiredCard
          title="Login Required For Run And Submit"
          message="You can read problem statements freely. Sign in to run code, submit, bookmark, and track submission history."
        />
      ) : null}

      <div className="flex items-center justify-between rounded-2xl border border-[#222A33] bg-[#11161C] px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-[#E2E8F0]">{problem.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className="rounded-full border border-[#334155] bg-[#111827] px-2 py-0.5">{problem.difficulty}</span>
            <span>{problem.topic_tags.join(' • ') || problem.topic}</span>
            {roadmapDayTag ? (
              <span className="rounded-md border border-[#1D4ED8]/50 bg-[#1D4ED8]/15 px-2 py-0.5 text-[#93C5FD]">
                Roadmap Day {roadmapDayTag}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void toggleFullscreen()}
            className="rounded-lg border border-[#1F2937] bg-[#111827] p-2 text-[#CBD5E1]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {problem.solved ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : null}
          <button
            onClick={() => void onToggleBookmark()}
            className="rounded-lg border border-[#1F2937] bg-[#111827] p-2 text-[#CBD5E1]"
          >
            <Bookmark className={`h-4 w-4 ${problem.is_bookmarked ? 'fill-yellow-300 text-yellow-300' : ''}`} />
          </button>
        </div>
      </div>

      <div ref={splitContainerRef} className="hidden h-[66vh] overflow-hidden rounded-2xl border border-[#222A33] bg-[#0B0F14] xl:flex">
        <section style={{ width: `${split}%` }} className="h-full overflow-y-auto border-r border-[#222A33] bg-[#11161C]">
          <div className="sticky top-0 z-10 border-b border-[#222A33] bg-[#11161C] px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'description', label: 'Description' },
                { key: 'submissions', label: 'Submissions' },
                { key: 'code-review', label: 'Code Review' },
                { key: 'editorial', label: 'Editorial' },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'description' | 'submissions' | 'code-review' | 'editorial')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    activeTab === tab.key ? 'bg-[#2563EB] text-white' : 'border border-[#334155] bg-[#0B1120] text-[#CBD5E1]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-5 p-5">
            {activeTab === 'description' ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#CBD5E1]">{problem.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Examples</h3>
                  <div className="mt-2 space-y-3">
                    {problem.examples.map((item, index) => (
                      <div key={`${problem.id}-example-${index}`} className="rounded-xl border border-[#1F2937] bg-[#0F172A] p-3 text-xs text-[#CBD5E1]">
                        <p className="font-semibold text-[#E2E8F0]">Example {index + 1}</p>
                        <p>Input: {item.input}</p>
                        <p>Output: {item.output}</p>
                        {item.explanation ? <p>Explanation: {item.explanation}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>

                {problem.constraints ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Constraints</h3>
                    <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-[#1F2937] bg-[#0F172A] p-3 text-xs text-[#CBD5E1]">
                      {problem.constraints}
                    </pre>
                  </div>
                ) : null}

                {problem.hints.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Hints</h3>
                    <ul className="mt-2 space-y-1 text-sm text-[#CBD5E1]">
                      {problem.hints.map((hint) => (
                        <li key={`${problem.id}-${hint}`}>• {hint}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {problem.tutorial_link ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Tutorial</h3>
                    <a
                      href={problem.tutorial_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-[#60A5FA] underline underline-offset-2"
                    >
                      Open tutorial resource
                    </a>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {problem.topic_tags.map((tag) => (
                      <span key={`${problem.id}-${tag}`} className="rounded-full border border-[#334155] bg-[#111827] px-2.5 py-1 text-xs text-[#CBD5E1]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Company Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {problem.company_tags.map((tag) => (
                      <span key={`${problem.id}-company-${tag}`} className="rounded-full border border-[#1E3A8A] bg-[#172554] px-2.5 py-1 text-xs text-[#BFDBFE]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === 'submissions' ? (
              <div className="max-h-[52vh] overflow-auto rounded-xl border border-[#1F2937] bg-[#0F172A]">
                {submissions.length === 0 ? (
                  <p className="p-3 text-xs text-[#94A3B8]">No submissions yet for this problem.</p>
                ) : (
                  submissions.slice(0, 30).map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-t border-[#1F2937] px-3 py-2 text-xs text-[#CBD5E1] first:border-t-0">
                      <span>{item.language.toUpperCase()}</span>
                      <span>{item.status}</span>
                      <span>{item.runtime_ms ?? '-'} ms</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === 'code-review' ? <CodeReviewPanel problemId={problem.id} language={language} code={code} status={status} /> : null}
            {activeTab === 'editorial' ? <EditorialTab problemId={problem.id} problemTopic={problem.topic} /> : null}
          </div>
        </section>

        <div onMouseDown={startDragging} className="h-full w-1 cursor-col-resize bg-[#1F2937] hover:bg-[#2563EB]" />

        <ProblemEditor
          language={language}
          monacoLanguage={monacoLanguage}
          code={code}
          runtime={runtime}
          memory={memory}
          status={status}
          output={output}
          running={running}
          onLanguageChange={(nextLanguage) => setLanguage(nextLanguage)}
          onCodeChange={(nextCode) => setCode(nextCode)}
          onRun={() => void onRun()}
          onSubmit={() => void onSubmit()}
        />
      </div>

      <div className="xl:hidden space-y-4">
        <Card hover={false} className="space-y-3">
          <h3 className="text-sm font-semibold text-[#E2E8F0]">Problem Description</h3>
          <p className="whitespace-pre-wrap text-sm text-[#CBD5E1]">{problem.description}</p>
        </Card>
        <Card hover={false} className="p-0">
          <div className="border-b border-[#1F2937] px-4 py-3">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as CodeLanguage)}
              className="rounded-lg border border-[#1F2937] bg-[#111827] px-2.5 py-1.5 text-xs text-[#E2E8F0]"
            >
              {languageLabel.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <Editor
            height="340px"
            theme="vs-dark"
            language={monacoLanguage}
            value={code}
            onChange={(value) => setCode(value ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card hover={false} className="space-y-3 border-[#1F2937] bg-[#0B1220]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Test Cases</h3>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="h-36 w-full rounded-xl border border-[#1F2937] bg-[#0F172A] p-3 text-xs text-[#E2E8F0]"
            placeholder="Provide stdin test cases"
          />
          <div className="flex gap-2">
            <button
              onClick={() => void onRun()}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-2 text-xs font-semibold text-[#E2E8F0] disabled:opacity-60"
            >
              <Play className="h-3.5 w-3.5" />
              Run Code
            </button>
            <button
              onClick={() => void onSubmit()}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              Submit Code
            </button>
          </div>
        </Card>

        <Card hover={false} className="space-y-3 border-[#1F2937] bg-[#0B1220]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#94A3B8]">Output Console</h3>
            <div className="flex items-center gap-3 text-xs text-[#CBD5E1]">
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {runtime || 'N/A'}</span>
              <span className="inline-flex items-center gap-1"><MemoryStick className="h-3.5 w-3.5" /> {memory || 'N/A'}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#1F2937] bg-[#0F172A] p-3 text-xs text-[#CBD5E1]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#E2E8F0]">
              <TriangleAlert className="h-3.5 w-3.5" />
              {status}
            </div>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap">{output || 'Run code to see output.'}</pre>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Submission History</h4>
            <div className="max-h-40 overflow-auto rounded-xl border border-[#1F2937] bg-[#0F172A]">
              {submissions.length === 0 ? (
                <p className="p-3 text-xs text-[#94A3B8]">No submissions yet for this problem.</p>
              ) : (
                submissions.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-t border-[#1F2937] px-3 py-2 text-xs text-[#CBD5E1] first:border-t-0">
                    <span>{item.language.toUpperCase()}</span>
                    <span>{item.status}</span>
                    <span>{item.runtime_ms ?? '-'} ms</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {postSubmitInsight ? (
            <div className="rounded-xl border border-[#1D4ED8]/30 bg-[#1D4ED8]/10 p-3 text-xs text-[#BFDBFE]">
              {postSubmitInsight}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
