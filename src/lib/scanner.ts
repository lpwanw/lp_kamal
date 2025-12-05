import { readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';

const SKIP_DIRS = ['node_modules', '.git', 'vendor', 'dist', 'build', '.next'];

export interface DiscoveredProject {
  name: string;
  path: string;
  deployConfigs: string[];
}

export async function scanForProjects(
  dir: string,
  maxDepth: number = 3
): Promise<DiscoveredProject[]> {
  const projects: DiscoveredProject[] = [];
  await scanDir(dir, 0, maxDepth, projects);
  return projects;
}

async function scanDir(
  dir: string,
  depth: number,
  maxDepth: number,
  results: DiscoveredProject[]
): Promise<void> {
  if (depth > maxDepth) return;

  try {
    const gitDir = join(dir, '.git');
    const configDir = join(dir, 'config');

    // Check if this is a git repo with deploy configs
    if (existsSync(gitDir) && existsSync(configDir)) {
      const deployConfigs = await findDeployConfigs(configDir);
      if (deployConfigs.length > 0) {
        results.push({
          name: basename(dir),
          path: dir,
          deployConfigs,
        });
        return; // Don't scan subdirs of a project
      }
    }

    // Scan subdirectories
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.includes(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;

      await scanDir(join(dir, entry.name), depth + 1, maxDepth, results);
    }
  } catch {
    // Skip dirs we can't read
  }
}

async function findDeployConfigs(configDir: string): Promise<string[]> {
  const configs: string[] = [];

  try {
    const entries = await readdir(configDir);
    for (const entry of entries) {
      if (entry.match(/^deploy(\..+)?\.yml$/)) {
        configs.push(entry);
      }
    }
  } catch {
    // Ignore errors
  }

  return configs;
}

export function extractBranchFromConfig(filename: string): string {
  // deploy.yml → main
  // deploy.staging.yml → staging
  // deploy.production.yml → production
  if (filename === 'deploy.yml') return 'main';
  const match = filename.match(/^deploy\.(.+)\.yml$/);
  return match ? match[1] : 'main';
}
