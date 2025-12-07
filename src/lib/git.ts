import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface GitOptions {
  cwd?: string;
  verbose?: boolean;
}

export function isGitRepo(cwd: string = process.cwd()): boolean {
  return existsSync(join(cwd, '.git'));
}

export async function getCurrentBranch(cwd?: string): Promise<string> {
  const proc = Bun.spawn(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], {
    stdout: 'pipe',
    cwd,
  });
  const output = await new Response(proc.stdout).text();
  return output.trim();
}

export async function checkoutBranch(branch: string, options: GitOptions = {}): Promise<void> {
  const { cwd, verbose } = options;
  const proc = Bun.spawn(['git', 'checkout', branch], {
    stdout: verbose ? 'inherit' : 'pipe',
    stderr: 'pipe',
    cwd,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(stderr.trim() || `Failed to checkout branch: ${branch}`);
  }
}

export async function fetchOrigin(options: GitOptions = {}): Promise<void> {
  const { cwd, verbose } = options;
  const proc = Bun.spawn(['git', 'fetch', 'origin'], {
    stdout: verbose ? 'inherit' : 'pipe',
    stderr: 'pipe',
    cwd,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(stderr.trim() || 'Failed to fetch from origin');
  }
}

export async function pullOrigin(branch: string, options: GitOptions = {}): Promise<void> {
  const { cwd, verbose } = options;
  const proc = Bun.spawn(['git', 'pull', 'origin', branch], {
    stdout: verbose ? 'inherit' : 'pipe',
    stderr: 'pipe',
    cwd,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(stderr.trim() || `Failed to pull branch: ${branch}`);
  }
}

export async function hasUncommittedChanges(cwd?: string): Promise<boolean> {
  const proc = Bun.spawn(['git', 'status', '--porcelain'], {
    stdout: 'pipe',
    cwd,
  });
  const output = await new Response(proc.stdout).text();
  return output.trim().length > 0;
}
