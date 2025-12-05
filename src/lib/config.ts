import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Config, ConfigV1 } from '../types.js';
import { DEFAULT_CONFIG } from '../types.js';

const CONFIG_DIR = join(homedir(), '.config', 'lp_kamal');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export async function loadConfig(): Promise<Config> {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return DEFAULT_CONFIG;
    }
    const file = Bun.file(CONFIG_PATH);
    const raw = (await file.json()) as Config | ConfigV1;

    // Migrate v1 to v2
    if (raw.version === 1) {
      const migrated = migrateV1toV2(raw as ConfigV1);
      await saveConfig(migrated);
      return migrated;
    }

    return validateConfig(raw) ? raw : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

function migrateV1toV2(v1: ConfigV1): Config {
  if (v1.branches.length > 0) {
    return {
      version: 2,
      projects: [
        {
          name: 'default',
          path: process.cwd(),
          branches: v1.branches,
        },
      ],
    };
  }
  return DEFAULT_CONFIG;
}

function validateConfig(config: unknown): config is Config {
  if (!config || typeof config !== 'object') return false;
  const c = config as Config;
  return c.version === 2 && Array.isArray(c.projects);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
