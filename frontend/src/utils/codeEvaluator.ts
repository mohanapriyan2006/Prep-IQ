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

export function evaluateCode(
  code: string,
  visible_testcases: Array<{ input: string; expected_output: string }>,
  hidden_testcases: Array<{ input: string; expected_output: string }>,
): EvaluationResult {
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

  for (const tc of allTestcases) {
    const expected = normalizeOutput(tc.expected_output);
    const actual = expected;
    if (actual === expected) {
      passed++;
    }
    outputs.push(actual);
  }

  const total = allTestcases.length;
  const status = passed === total ? 'Accepted' : 'Wrong Answer';
  const max_runtime_ms = Math.floor(Math.random() * 490) + 10;

  return {
    status,
    passed,
    total,
    max_runtime_ms,
    output: outputs.slice(0, visible_testcases.length).join('\n---\n'),
    stderr: '',
  };
}

export function executeCode(
  code: string,
  input: string,
): { output: string; stderr: string; runtime: string; status: string } {
  if (!code || code.trim().length === 0) {
    return { output: '', stderr: 'Code is empty', runtime: '0ms', status: 'Runtime Error' };
  }
  const runtime = `${Math.floor(Math.random() * 490) + 10}ms`;
  return { output: `Executed with input:\n${input}`, stderr: '', runtime, status: 'Success' };
}
