export interface RunResult {
  success: boolean;
  exitCode: number;
}

export async function runCommand(
  command: string,
  cwd?: string,
  verbose?: boolean
): Promise<RunResult> {
  const parts = parseCommand(command);
  if (parts.length === 0) {
    return { success: false, exitCode: 1 };
  }

  const [cmd, ...args] = parts;

  // Show command in verbose mode
  if (verbose) {
    console.log(`$ ${command}`);
  }

  try {
    const proc = Bun.spawn([cmd, ...args], {
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
  } catch {
    return { success: false, exitCode: 1 };
  }
}

function parseCommand(command: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of command) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}
