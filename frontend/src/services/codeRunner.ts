import { runPythonCode } from './pyodideRunner';

export interface RunResult {
  status: string;
  output: string;
  stderr: string;
  runtime: string;
}

function runJavaScriptInBrowser(code: string, stdin: string): RunResult {
  const start = performance.now();
  try {
    let stdout = '';
    let stderr = '';

    const mockConsole = {
      log: (...args: unknown[]) => {
        stdout += args.map((a) => String(a)).join(' ') + '\n';
      },
      error: (...args: unknown[]) => {
        stderr += args.map((a) => String(a)).join(' ') + '\n';
      },
    };

    const safeStdin = JSON.stringify(stdin);
    const wrappedCode = `
      "use strict";
      (async function() {
        const console = {
          log: (...args) => { __c_log__(...args); },
          error: (...args) => { __c_error__(...args); },
        };
        const input = ${safeStdin};
        ${code}
      })();
    `;

    const fn = new Function('__c_log__', '__c_error__', wrappedCode);
    fn(mockConsole.log, mockConsole.error);

    const runtime = `${Math.round(performance.now() - start)}ms`;
    return { status: 'Success', output: stdout, stderr, runtime };
  } catch (err) {
    const runtime = `${Math.round(performance.now() - start)}ms`;
    return { status: 'Runtime Error', output: '', stderr: err instanceof Error ? err.message : String(err), runtime };
  }
}

async function runWithExternalAPI(language: string, code: string, stdin: string): Promise<RunResult> {
  const versionMap: Record<string, string> = {
    cpp: '10.2.0',
    java: '15.0.2',
  };
  const version = versionMap[language];
  if (!version) {
    return { status: 'Unsupported Language', output: '', stderr: `${language} is not supported.`, runtime: '0ms' };
  }

  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        files: [{ content: code }],
        stdin,
      }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { status: 'Service Unavailable', output: '', stderr: `${language.toUpperCase()} execution requires a backend compiler (Piston API now requires auth). C++ and Java cannot run in a browser without a backend service. Use JavaScript or Python for frontend-only execution.`, runtime: '0ms' };
      }
      return { status: 'Runtime Error', output: '', stderr: `Execution service returned ${res.status}`, runtime: '0ms' };
    }

    const data = await res.json();
    const run = data.run || {};
    const stdout = run.stdout ?? '';
    const stderr = run.stderr ?? '';
    const codeExit = run.code ?? 0;
    const signal = run.signal;

    if (signal) {
      return { status: 'Runtime Error', output: stdout, stderr: `Signal: ${signal}\n${stderr}`, runtime: `${run.runtime ?? 0}ms` };
    }

    if (codeExit !== 0) {
      return { status: 'Runtime Error', output: stdout, stderr: stderr || `Exit code: ${codeExit}`, runtime: `${run.runtime ?? 0}ms` };
    }

    return {
      status: 'Success',
      output: stdout,
      stderr: stderr,
      runtime: `${run.runtime ?? 0}ms`,
    };
  } catch (err) {
    return { status: 'Runtime Error', output: '', stderr: err instanceof Error ? err.message : 'Network error', runtime: '0ms' };
  }
}

export async function runCode(
  language: string,
  code: string,
  stdin: string,
): Promise<RunResult> {
  if (!code || code.trim().length === 0) {
    return { status: 'Runtime Error', output: '', stderr: 'Code is empty', runtime: '0ms' };
  }

  if (language === 'javascript') {
    return runJavaScriptInBrowser(code, stdin);
  }

  if (language === 'python') {
    return runPythonCode(code, stdin);
  }

  return runWithExternalAPI(language, code, stdin);
}
