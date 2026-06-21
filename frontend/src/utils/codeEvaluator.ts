import { runCodeWithPiston } from '../services/pistonRunner';

export interface EvaluationResult {
  status: string;
  passed: number;
  total: number;
  max_runtime_ms: number;
  output: string;
  stderr: string;
}

function normalizeOutput(out: string): string {
  return out
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export async function evaluateCode(
  code: string,
  language: string,
  visible_testcases: Array<{ input: string; expected_output: string }>,
  hidden_testcases: Array<{ input: string; expected_output: string }>,
): Promise<EvaluationResult> {
  if (!code || code.trim().length === 0) {
    return {
      status: 'Runtime Error',
      passed: 0,
      total: visible_testcases.length + hidden_testcases.length,
      max_runtime_ms: 0,
      output: '',
      stderr: 'Code is empty',
    };
  }

  const allTestcases = [...visible_testcases, ...hidden_testcases];
  let passed = 0;
  const outputs: string[] = [];
  let maxRuntime = 0;
  let combinedStderr = '';

  for (const tc of allTestcases) {
    const result = await runCodeWithPiston(language, code, tc.input);
    const actual = normalizeOutput(result.output);
    const expected = normalizeOutput(tc.expected_output);
    const runtimeNum = parseFloat(result.runtime.replace('ms', '')) || 0;
    maxRuntime = Math.max(maxRuntime, runtimeNum);
    if (result.stderr) combinedStderr += result.stderr + '\n';

    if (actual === expected) {
      passed++;
    }
    outputs.push(actual);
  }

  const total = allTestcases.length;
  const status = passed === total ? 'Accepted' : 'Wrong Answer';

  return {
    status,
    passed,
    total,
    max_runtime_ms: maxRuntime,
    output: outputs.slice(0, visible_testcases.length).join('\n---\n'),
    stderr: combinedStderr.trim(),
  };
}
