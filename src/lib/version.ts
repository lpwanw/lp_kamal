import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';

const VERSION = '0.4.1';
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/lpwanw/lp_kamal/releases/latest';
const HOME = Bun.env.HOME ?? Bun.env.USERPROFILE ?? '';
const CONFIG_DIR = join(HOME, '.config', 'lp_kamal');
const CACHE_FILE = join(CONFIG_DIR, 'update-cache.json');
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateCache {
  lastCheck: number;
  latestVersion: string | null;
}

export function getVersion(): string {
  return VERSION;
}

export async function checkForUpdates(): Promise<void> {
  try {
    // Check cache first
    const cache = await readCache();
    const now = Date.now();

    if (cache && now - cache.lastCheck < CHECK_INTERVAL) {
      // Use cached result
      if (cache.latestVersion && isNewerVersion(cache.latestVersion, VERSION)) {
        showUpdateNotice(cache.latestVersion);
      }
      return;
    }

    // Fetch latest version (with timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { 'User-Agent': 'lp_kamal' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return;

    const data = await response.json() as { tag_name: string };
    const latestVersion = data.tag_name.replace(/^v/, '');

    // Update cache
    await writeCache({ lastCheck: now, latestVersion });

    // Notify if newer
    if (isNewerVersion(latestVersion, VERSION)) {
      showUpdateNotice(latestVersion);
    }
  } catch {
    // Silent fail - don't block CLI
  }
}

async function readCache(): Promise<UpdateCache | null> {
  try {
    const file = Bun.file(CACHE_FILE);
    if (await file.exists()) {
      return await file.json();
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

async function writeCache(cache: UpdateCache): Promise<void> {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    await Bun.write(CACHE_FILE, JSON.stringify(cache));
  } catch {
    // Ignore cache write errors
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  const [latestMajor, latestMinor, latestPatch] = latest.split('.').map(Number);
  const [currentMajor, currentMinor, currentPatch] = current.split('.').map(Number);

  if (latestMajor > currentMajor) return true;
  if (latestMajor < currentMajor) return false;
  if (latestMinor > currentMinor) return true;
  if (latestMinor < currentMinor) return false;
  return latestPatch > currentPatch;
}

function showUpdateNotice(latestVersion: string): void {
  p.log.warn(`Update available: ${VERSION} → ${latestVersion}`);
  p.log.info('Run: lp_kamal --update');
}
