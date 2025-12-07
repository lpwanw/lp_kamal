import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import * as p from '@clack/prompts';

const VERSION = '0.2.0';
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/lpwanw/lp_kamal/releases/latest';
const CONFIG_DIR = join(homedir(), '.config', 'lp_kamal');
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
    const cache = readCache();
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
    writeCache({ lastCheck: now, latestVersion });

    // Notify if newer
    if (isNewerVersion(latestVersion, VERSION)) {
      showUpdateNotice(latestVersion);
    }
  } catch {
    // Silent fail - don't block CLI
  }
}

function readCache(): UpdateCache | null {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

function writeCache(cache: UpdateCache): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache));
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
