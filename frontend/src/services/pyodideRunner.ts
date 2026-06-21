import { loadPyodide, type PyodideInterface } from 'pyodide';

export interface RunResult {
  status: string;
  output: string;
  stderr: string;
  runtime: string;
}

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoading: Promise<PyodideInterface> | null = null;

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = loadPyodide({ indexURL: '/pyodide/' });
  pyodideInstance = await pyodideLoading;
  return pyodideInstance;
}

export async function runPythonCode(code: string, stdin: string): Promise<RunResult> {
  const start = performance.now();
  try {
    const pyodide = await getPyodide();

    const inputLines = stdin.split('\n');
    let lineIndex = 0;

    pyodide.setStdin({
      stdin: () => {
        const line = inputLines[lineIndex] ?? '';
        lineIndex++;
        return line + '\n';
      },
    });

    let stdout = '';
    pyodide.setStdout({
      batched: (text: string) => {
        stdout += text;
      },
    });

    let stderr = '';
    pyodide.setStderr({
      batched: (text: string) => {
        stderr += text;
      },
    });

    await pyodide.runPythonAsync(code);

    const runtime = `${Math.round(performance.now() - start)}ms`;
    return { status: 'Success', output: stdout, stderr, runtime };
  } catch (err) {
    const runtime = `${Math.round(performance.now() - start)}ms`;
    return {
      status: 'Runtime Error',
      output: '',
      stderr: err instanceof Error ? err.message : String(err),
      runtime,
    };
  }
}
