/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Play, Send, Clock, Maximize2, Minimize2 } from "lucide-react";

import { executeCode, api } from "../services/api";
import { Card } from "../components/ui/Card";
import type { CodeLanguage, CodingProblem } from "../types/coding";
import { fetchProblem } from "../services/api";

const STARTERS: Record<CodeLanguage, string> = {
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n",
  python: 'def solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n',
  java: "public class Main {\n  public static void main(String[] args) {\n  }\n}\n",
  javascript: "console.log('started');\n",
};

export default function AssessmentArena() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionProblems, setSessionProblems] = useState<Array<{ id: number }>>(
    [],
  );
  const [activeProblemId, setActiveProblemId] = useState<number | null>(null);
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(90 * 60);

  const [language, setLanguage] = useState<CodeLanguage>("python");
  const [code, setCode] = useState(STARTERS.python);
  const [input] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [sessionsResponse, fallbackProblemsResponse] = await Promise.all([
          api.get("/assessment/sessions").catch(() => ({ data: [] })),
          api.get("/assessment/problems").catch(() => ({ data: [] })),
        ]);

        const session = sessionsResponse.data.find(
          (s: any) => s.id === Number(sessionId),
        );
        const metricProblems = session?.metrics?.problems || [];
        const fallbackProblems = (fallbackProblemsResponse.data || []).map(
          (p: { id: number }) => ({ id: p.id }),
        );
        const resolvedProblems =
          metricProblems.length > 0 ? metricProblems : fallbackProblems;

        if (session) {
          setSessionData(session);
        } else {
          setSessionData({
            id: Number(sessionId),
            metrics: { problems: resolvedProblems },
          });
        }

        setSessionProblems(resolvedProblems);
        if (resolvedProblems.length > 0) {
          setActiveProblemId(resolvedProblems[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [sessionId]);

  useEffect(() => {
    if (activeProblemId) {
      fetchProblem(activeProblemId).then((data) => {
        setProblem(data);
        setCode(STARTERS[language]);
      });
    }
  }, [activeProblemId, language]);

  const handleSubmitAssessment = useCallback(async () => {
    try {
      await api.post(`/assessment/${sessionId}/finalize`);
      navigate("/assessment");
    } catch (err) {
      console.error(err);
    }
  }, [navigate, sessionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSubmitAssessment]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleRun = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setOutput("Running...");
    try {
      const res = await executeCode({ language, code, input: input || "0\n" });
      setOutput(res.output || res.stderr || "Status: " + res.status);
    } catch (error: any) {
      setOutput(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem || loading) return;
    setLoading(true);
    setOutput("Submitting...");
    try {
      const res = await api.post("/assessment/submit", {
        problem_id: problem.id,
        language,
        code,
        session_id: Number(sessionId),
        time_taken_seconds: 90 * 60 - timeLeft,
      });
      setOutput(
        `Result: ${res.data.status}\nPassed: ${res.data.passed}/${res.data.total}`,
      );
    } catch (error: any) {
      setOutput("Failed to submit code" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors and continue with normal view.
    }
  };

  if (!sessionData)
    return <div className="p-8 text-white">Loading Arena...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#020617] p-4 font-sans max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">DSA Assessment</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-[#334155] text-gray-200 hover:bg-[#0F172A]"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2 text-red-400 font-mono text-lg bg-red-400/10 px-4 py-1.5 rounded-lg border border-red-400/20">
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleSubmitAssessment}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            End Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Left: Problem & Navigation */}
        <div className="flex flex-col space-y-4 overflow-hidden">
          <Card className="p-4 bg-[#0F172A] border-[#1F2937] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-2">
              Problem List
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {sessionProblems.map((p: any, idx: number) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProblemId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    activeProblemId === p.id
                      ? "bg-blue-600 text-white"
                      : "bg-[#1F2937] text-gray-300 hover:bg-[#374151]"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            {sessionProblems.length === 0 ? (
              <div className="text-gray-400 text-sm">
                No assessment problems found for this session.
              </div>
            ) : null}

            {problem ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-white">
                    {problem.title}
                  </h1>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      problem.difficulty === "Easy"
                        ? "bg-green-100 text-green-800"
                        : problem.difficulty === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <div
                  className="prose prose-invert max-w-none text-sm text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: problem.description.replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            ) : (
              <div className="text-gray-500">Select a problem</div>
            )}
          </Card>

          <Card className="h-48 bg-[#0F172A] border-[#1F2937] p-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F2937]">
              <h3 className="text-sm font-semibold text-gray-300">Terminal</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Context
                </button>
              </div>
            </div>
            <div className="flex-1 p-3 font-mono text-xs text-gray-300 overflow-y-auto whitespace-pre-wrap">
              {output || "Output will appear here..."}
            </div>
          </Card>
        </div>

        {/* Right: Coding Arena */}
        <div className="flex flex-col space-y-4">
          <Card className="flex-1 h-[20%] bg-[#1E1E1E] border-[#333] flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#252526]">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                className="bg-[#333] text-sm text-gray-300 rounded px-2 py-1 border-none focus:ring-0"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            <div className="h-[90%]">
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  padding: { top: 16 },
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
