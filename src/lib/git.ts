import { existsSync } from 'node:fs';
import { join } from 'node:path';

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

export async function checkoutBranch(branch: string, cwd?: string): Promise<void> {
  const proc = Bun.spawn(['git', 'checkout', branch], {
    stdout: 'inherit',
    stderr: 'inherit',
    cwd,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Failed to checkout branch: ${branch}`);
  }
}

export async function fetchOrigin(cwd?: string): Promise<void> {
  const proc = Bun.spawn(['git', 'fetch', 'origin'], {
    stdout: 'inherit',
    stderr: 'inherit',
    cwd,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error('Failed to fetch from origin');
  }
}

export async function pullOrigin(branch: string, cwd?: string): Promise<void> {
  const proc = Bun.spawn(['git', 'pull', 'origin', branch], {
    stdout: 'inherit',
    stderr: 'inherit',
    cwd,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Failed to pull branch: ${branch}`);
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
