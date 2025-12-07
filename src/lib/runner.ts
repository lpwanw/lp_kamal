export interface RunResult {
  success: boolean;
  exitCode: number;
}

const SENSITIVE_PATTERNS = /(\w*(?:PASSWORD|SECRET|TOKEN|KEY|CREDENTIAL)\w*)=([^\s]+)/gi;

export async function runCommand(
  command: string,
  cwd?: string,
  verbose?: boolean
): Promise<RunResult> {
  if (!command.trim()) {
    return { success: false, exitCode: 1 };
  }

  // Show masked command in verbose mode
  if (verbose) {
    console.log(`$ ${maskSecrets(command)}`);
  }

  try {
    // Use shell to handle inline env vars and shell syntax
    const proc = Bun.spawn(['bash', '-c', command], {
      stdout: 'inherit',
      stderr: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
      cwd,
    });

    const exitCode = await proc.exited;

    // Show exit code in verbose mode
    if (verbose) {
      console.log(`Exit code: ${exitCode}`);
    }

    return { success: exitCode === 0, exitCode };
  } catch (error) {
    if (verbose) {
      console.error(`Error: ${error}`);
    }
    return { success: false, exitCode: 1 };
  }
}

function maskSecrets(command: string): string {
  return command.replace(SENSITIVE_PATTERNS, '$1=***');
}
