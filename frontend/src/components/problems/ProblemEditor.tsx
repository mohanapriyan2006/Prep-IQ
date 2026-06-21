import Editor from '@monaco-editor/react';
import { Clock3, MemoryStick, Play, Send } from 'lucide-react';

import type { CodeLanguage } from '../../types/coding';

interface ProblemEditorProps {
  language: CodeLanguage;
  monacoLanguage: string;
  code: string;
  runtime: string;
  memory: string;
  status: string;
  output: string;
  running: boolean;
  onLanguageChange: (language: CodeLanguage) => void;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset?: () => void;
}

const languageLabel: Array<{ value: CodeLanguage; label: string }> = [
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
];

export function ProblemEditor({
  language,
  monacoLanguage,
  code,
  runtime,
  memory,
  status,
  output,
  running,
  onLanguageChange,
  onCodeChange,
  onRun,
  onSubmit,
  onReset,
}: ProblemEditorProps) {
  return (
    <section className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[#222A33] bg-[#11161D] px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-[#E5E7EB]">Problem Editor</p>
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value as CodeLanguage)}
            className="rounded-lg border border-[#222A33] bg-[#0B0F14] px-2.5 py-1.5 text-xs text-[#E5E7EB]"
          >
            {languageLabel.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {onReset ? (
            <button
              onClick={onReset}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#222A33] bg-[#151B22] px-3 py-2 text-xs font-semibold text-[#E2E8F0] disabled:opacity-60"
            >
              Reset
            </button>
          ) : null}
          <button
            onClick={onRun}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#222A33] bg-[#151B22] px-3 py-2 text-xs font-semibold text-[#E2E8F0] disabled:opacity-60"
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </button>
          <button
            onClick={onSubmit}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            Submit
          </button>
        </div>
      </div>

      <Editor
        theme="vs-dark"
        language={monacoLanguage}
        value={code}
        onChange={(value) => onCodeChange(value ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
          tabSize: 2,
          smoothScrolling: true,
        }}
      />

      <div className="border-t border-[#222A33] bg-[#11161D] px-4 py-3">
        <div className="mb-2 flex items-center gap-4 text-xs text-[#CBD5E1]">
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {runtime || 'N/A'}</span>
          <span className="inline-flex items-center gap-1"><MemoryStick className="h-3.5 w-3.5" /> {memory || 'N/A'}</span>
          <span className="rounded-md border border-[#334155] bg-[#0B0F14] px-2 py-0.5">{status || 'Idle'}</span>
        </div>
        <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-xl border border-[#222A33] bg-[#0B0F14] p-3 text-xs text-[#CBD5E1]">
          {output || 'Run code to view stdout and stderr.'}
        </pre>
      </div>
    </section>
  );
}
