import * as p from '@clack/prompts';
import { resolve } from 'node:path';
import { loadConfig, saveConfig, getConfigPath } from '../lib/config.js';
import { scanForProjects, extractBranchFromConfig } from '../lib/scanner.js';
import type { ProjectConfig, BranchConfig } from '../types.js';

export async function runInit(): Promise<void> {
  p.intro('lp_kamal Setup');

  const config = await loadConfig();

  // Ask for directory to scan
  const scanDir = await p.text({
    message: 'Directory to scan for projects:',
    placeholder: '. (current directory)',
    initialValue: '.',
  });

  if (p.isCancel(scanDir)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }

  const resolvedDir = resolve(scanDir);

  // Scan for projects
  const s = p.spinner();
  s.start('Scanning for projects...');

  const discovered = await scanForProjects(resolvedDir);

  if (discovered.length === 0) {
    s.stop('No projects found');
    p.log.warn('No git repos with config/deploy*.yml found');
    p.outro('Try a different directory');
    return;
  }

  s.stop(`Found ${discovered.length} project(s)`);

  // Multi-select projects
  const selectedNames = await p.multiselect({
    message: 'Select projects to register:',
    options: discovered.map((proj) => ({
      value: proj.name,
      label: proj.name,
      hint: proj.path,
    })),
    required: true,
  });

  if (p.isCancel(selectedNames)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }

  const selectedProjects = discovered.filter((proj) =>
    (selectedNames as string[]).includes(proj.name)
  );

  // Configure each project
  const projects: ProjectConfig[] = [...config.projects];

  for (const proj of selectedProjects) {
    p.log.step(`Configuring ${proj.name}...`);

    const branches: BranchConfig[] = [];

    // Auto-detect branches from config files
    for (const configFile of proj.deployConfigs) {
      const branch = extractBranchFromConfig(configFile);
      const defaultCmd = `kamal deploy -c config/${configFile}`;

      const command = await p.text({
        message: `Command for ${branch}:`,
        initialValue: defaultCmd,
      });

      if (p.isCancel(command)) {
        p.cancel('Setup cancelled');
        process.exit(0);
      }

      branches.push({ branch, command });
    }

    // Update or add project
    const existingIdx = projects.findIndex((existing) => existing.path === proj.path);
    const projectConfig: ProjectConfig = {
      name: proj.name,
      path: proj.path,
      branches,
    };

    if (existingIdx >= 0) {
      projects[existingIdx] = projectConfig;
    } else {
      projects.push(projectConfig);
    }
  }

  await saveConfig({ version: 2, projects });

  p.log.success(`Config saved to ${getConfigPath()}`);
  p.log.info(`Registered ${selectedProjects.length} project(s)`);
  p.outro('Setup complete');
}
