const PISTON_URL = 'https://emkc.org/api/v2/piston';

const languageVersions: Record<string, string> = {
  python: '3.10.0',
  javascript: '18.15.0',
  cpp: '10.2.0',
  java: '15.0.2',
};

export interface PistonResult {
  status: string;
  output: string;
  stderr: string;
  runtime: string;
}

export async function runCodeWithPiston(
  language: string,
  code: string,
  stdin: string,
): Promise<PistonResult> {
  const version = languageVersions[language];
  if (!version) {
    return { status: 'Unsupported Language', output: '', stderr: `${language} is not supported by the online runner.`, runtime: '0ms' };
  }

  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
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
      return { status: 'Runtime Error', output: '', stderr: `Piston API returned ${res.status}`, runtime: '0ms' };
    }

    const data = await res.json();
    const run = data.run || {};
    const stdout = run.stdout ?? '';
    const stderr = run.stderr ?? '';
    const codeExit = run.code ?? 0;
    const signal = run.signal;

    if (signal) {
      return { status: 'Runtime Error', output: stdout, stderr: `Signal: ${signal}\n${stderr}`, runtime: `${data.run?.runtime ?? 0}ms` };
    }

    if (codeExit !== 0) {
      return { status: 'Runtime Error', output: stdout, stderr: stderr || `Exit code: ${codeExit}`, runtime: `${data.run?.runtime ?? 0}ms` };
    }

    return {
      status: 'Success',
      output: stdout,
      stderr: stderr,
      runtime: `${data.run?.runtime ?? 0}ms`,
    };
  } catch (err) {
    return { status: 'Runtime Error', output: '', stderr: err instanceof Error ? err.message : 'Network error', runtime: '0ms' };
  }
}
