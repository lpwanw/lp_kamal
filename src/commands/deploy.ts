import * as p from '@clack/prompts';
import { resolve } from 'node:path';
import { loadConfig } from '../lib/config.js';
import {
  isGitRepo,
  getCurrentBranch,
  checkoutBranch,
  fetchOrigin,
  pullOrigin,
  hasUncommittedChanges,
} from '../lib/git.js';
import { runCommand } from '../lib/runner.js';
import type { ProjectConfig } from '../types.js';

export async function runDeploy(): Promise<void> {
  p.intro('lp_kamal Deploy');

  const config = await loadConfig();

  if (config.projects.length === 0) {
    p.log.error('No projects configured. Run: lp_kamal --init');
    process.exit(1);
  }

  // Check if current directory is a registered project
  const cwd = resolve(process.cwd());
  let project: ProjectConfig | undefined = config.projects.find(
    (proj) => resolve(proj.path) === cwd
  );

  if (project) {
    // Already in a registered project directory
    p.log.info(`Project: ${project.name}`);
  } else if (config.projects.length === 1) {
    // Only one project registered
    project = config.projects[0];
    p.log.info(`Project: ${project.name}`);
  } else {
    // Multiple projects, prompt selection
    const selectedName = await p.select({
      message: 'Select project:',
      options: config.projects.map((proj) => ({
        value: proj.name,
        label: proj.name,
        hint: proj.path,
      })),
    });

    if (p.isCancel(selectedName)) {
      p.cancel('Cancelled');
      process.exit(0);
    }

    project = config.projects.find((proj) => proj.name === selectedName)!;
  }

  const projectPath = project.path;

  // Validate git repo
  if (!isGitRepo(projectPath)) {
    p.log.error(`Not a git repository: ${projectPath}`);
    process.exit(1);
  }

  if (await hasUncommittedChanges(projectPath)) {
    p.log.error(`Uncommitted changes in ${project.name}`);
    process.exit(1);
  }

  if (project.branches.length === 0) {
    p.log.error('No branches configured for this project');
    process.exit(1);
  }

  // Branch selection
  const currentBranch = await getCurrentBranch(projectPath);
  const selectedBranch = await p.select({
    message: 'Select branch to deploy:',
    options: project.branches.map((b) => ({
      value: b.branch,
      label: b.branch === currentBranch ? `${b.branch} (current)` : b.branch,
    })),
    initialValue: currentBranch,
  });

  if (p.isCancel(selectedBranch)) {
    p.cancel('Cancelled');
    process.exit(0);
  }

  // Git operations
  const s = p.spinner();

  if (selectedBranch !== currentBranch) {
    s.start(`Checking out ${selectedBranch}`);
    try {
      await checkoutBranch(selectedBranch, projectPath);
      s.stop(`Checked out ${selectedBranch}`);
    } catch (error) {
      s.stop(`Failed to checkout ${selectedBranch}`);
      p.log.error(String(error));
      process.exit(1);
    }
  }

  s.start('Fetching origin');
  try {
    await fetchOrigin(projectPath);
    s.stop('Fetched origin');
  } catch (error) {
    s.stop('Failed to fetch');
    p.log.error(String(error));
    process.exit(1);
  }

  s.start(`Pulling ${selectedBranch}`);
  try {
    await pullOrigin(selectedBranch, projectPath);
    s.stop(`Pulled ${selectedBranch}`);
  } catch (error) {
    s.stop(`Failed to pull ${selectedBranch}`);
    p.log.error(String(error));
    process.exit(1);
  }

  // Confirm and execute
  const branchConfig = project.branches.find((b) => b.branch === selectedBranch)!;

  p.log.info(`Path: ${projectPath}`);
  p.log.info(`Command: ${branchConfig.command}`);

  const confirmed = await p.confirm({
    message: `Deploy ${project.name}/${selectedBranch}?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Cancelled');
    process.exit(0);
  }

  p.log.step('Deploying...');
  console.log('');

  const result = await runCommand(branchConfig.command, projectPath);

  console.log('');

  if (result.success) {
    p.outro('Deployment successful!');
  } else {
    p.log.error(`Failed (exit ${result.exitCode})`);
    process.exit(result.exitCode);
  }
}
