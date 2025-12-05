import * as p from '@clack/prompts';
import { loadConfig, saveConfig, getConfigPath } from '../lib/config.js';
import { scanForProjects, extractBranchFromConfig } from '../lib/scanner.js';
import type { Config, ProjectConfig, BranchConfig } from '../types.js';

type ConfigAction = 'edit' | 'branches' | 'remove' | 'add' | 'show' | 'exit';

export async function runConfig(): Promise<void> {
  p.intro('lp_kamal Config');

  const config = await loadConfig();

  if (config.projects.length === 0) {
    p.log.warn('No projects configured. Run: lp_kamal --init');
    process.exit(0);
  }

  while (true) {
    const action = await p.select<{ value: ConfigAction; label: string }[], ConfigAction>({
      message: 'What do you want to do?',
      options: [
        { value: 'show', label: 'Show config' },
        { value: 'edit', label: 'Edit project' },
        { value: 'branches', label: 'Manage branches' },
        { value: 'add', label: 'Add new project' },
        { value: 'remove', label: 'Remove project' },
        { value: 'exit', label: 'Exit' },
      ],
    });

    if (p.isCancel(action) || action === 'exit') {
      p.outro('Config saved');
      break;
    }

    switch (action) {
      case 'show':
        await showConfig(config);
        break;
      case 'edit':
        await editProject(config);
        break;
      case 'branches':
        await manageBranches(config);
        break;
      case 'add':
        await addProject(config);
        break;
      case 'remove':
        await removeProject(config);
        break;
    }
  }
}

async function showConfig(config: Config): Promise<void> {
  p.log.info(`Config path: ${getConfigPath()}`);
  p.log.info(`Projects: ${config.projects.length}`);

  for (const project of config.projects) {
    console.log('');
    p.log.step(`${project.name}`);
    p.log.message(`  Path: ${project.path}`);
    p.log.message(`  Branches:`);
    for (const b of project.branches) {
      p.log.message(`    - ${b.branch}: ${b.command}`);
    }
  }
  console.log('');
}

async function selectProject(config: Config, message: string): Promise<ProjectConfig | null> {
  const selected = await p.select({
    message,
    options: config.projects.map((proj) => ({
      value: proj.name,
      label: proj.name,
      hint: proj.path,
    })),
  });

  if (p.isCancel(selected)) return null;
  return config.projects.find((p) => p.name === selected) || null;
}

async function editProject(config: Config): Promise<void> {
  const project = await selectProject(config, 'Select project to edit:');
  if (!project) return;

  const field = await p.select({
    message: 'What to edit?',
    options: [
      { value: 'name', label: 'Project name' },
      { value: 'path', label: 'Project path' },
    ],
  });

  if (p.isCancel(field)) return;

  if (field === 'name') {
    const newName = await p.text({
      message: 'New project name:',
      initialValue: project.name,
      validate: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value !== project.name && config.projects.some((p) => p.name === value)) {
          return 'Name already exists';
        }
      },
    });

    if (p.isCancel(newName)) return;
    project.name = newName;
    await saveConfig(config);
    p.log.success(`Project renamed to: ${newName}`);
  } else if (field === 'path') {
    const newPath = await p.text({
      message: 'New project path:',
      initialValue: project.path,
      validate: (value) => {
        if (!value.trim()) return 'Path is required';
      },
    });

    if (p.isCancel(newPath)) return;
    project.path = newPath.replace(/^~/, process.env.HOME || '');
    await saveConfig(config);
    p.log.success(`Path updated to: ${project.path}`);
  }
}

async function manageBranches(config: Config): Promise<void> {
  const project = await selectProject(config, 'Select project:');
  if (!project) return;

  const action = await p.select({
    message: 'Branch action:',
    options: [
      { value: 'add', label: 'Add branch' },
      { value: 'edit', label: 'Edit branch command' },
      { value: 'remove', label: 'Remove branch' },
    ],
  });

  if (p.isCancel(action)) return;

  if (action === 'add') {
    const branch = await p.text({
      message: 'Branch name:',
      validate: (value) => {
        if (!value.trim()) return 'Branch name is required';
        if (project.branches.some((b) => b.branch === value)) {
          return 'Branch already exists';
        }
      },
    });

    if (p.isCancel(branch)) return;

    const configFile =
      branch === 'main'
        ? 'config/deploy.yml'
        : `config/deploy.${branch}.yml`;
    const defaultCommand = `kamal deploy -c ${configFile}`;

    const command = await p.text({
      message: 'Deploy command:',
      initialValue: defaultCommand,
      validate: (value) => {
        if (!value.trim()) return 'Command is required';
      },
    });

    if (p.isCancel(command)) return;

    project.branches.push({ branch, command });
    await saveConfig(config);
    p.log.success(`Branch "${branch}" added`);
  } else if (action === 'edit') {
    if (project.branches.length === 0) {
      p.log.warn('No branches configured');
      return;
    }

    const branchName = await p.select({
      message: 'Select branch:',
      options: project.branches.map((b) => ({
        value: b.branch,
        label: b.branch,
        hint: b.command,
      })),
    });

    if (p.isCancel(branchName)) return;

    const branchConfig = project.branches.find((b) => b.branch === branchName)!;
    const newCommand = await p.text({
      message: 'New command:',
      initialValue: branchConfig.command,
      validate: (value) => {
        if (!value.trim()) return 'Command is required';
      },
    });

    if (p.isCancel(newCommand)) return;

    branchConfig.command = newCommand;
    await saveConfig(config);
    p.log.success(`Command updated for "${branchName}"`);
  } else if (action === 'remove') {
    if (project.branches.length === 0) {
      p.log.warn('No branches configured');
      return;
    }

    if (project.branches.length === 1) {
      p.log.warn('Cannot remove last branch. Remove the project instead.');
      return;
    }

    const branchName = await p.select({
      message: 'Select branch to remove:',
      options: project.branches.map((b) => ({
        value: b.branch,
        label: b.branch,
        hint: b.command,
      })),
    });

    if (p.isCancel(branchName)) return;

    const confirmed = await p.confirm({
      message: `Remove branch "${branchName}"?`,
      initialValue: false,
    });

    if (p.isCancel(confirmed) || !confirmed) return;

    project.branches = project.branches.filter((b) => b.branch !== branchName);
    await saveConfig(config);
    p.log.success(`Branch "${branchName}" removed`);
  }
}

async function addProject(config: Config): Promise<void> {
  const method = await p.select({
    message: 'How to add project?',
    options: [
      { value: 'scan', label: 'Scan directory' },
      { value: 'manual', label: 'Enter manually' },
    ],
  });

  if (p.isCancel(method)) return;

  if (method === 'scan') {
    const dir = await p.text({
      message: 'Directory to scan:',
      initialValue: '.',
      validate: (value) => {
        if (!value.trim()) return 'Directory is required';
      },
    });

    if (p.isCancel(dir)) return;

    const scanPath = dir.replace(/^~/, process.env.HOME || '');
    const s = p.spinner();
    s.start('Scanning for projects...');

    const discovered = await scanForProjects(scanPath);
    s.stop(`Found ${discovered.length} project(s)`);

    if (discovered.length === 0) {
      p.log.warn('No projects found with Kamal config');
      return;
    }

    // Filter out already registered
    const existingPaths = new Set(config.projects.map((p) => p.path));
    const newProjects = discovered.filter((d) => !existingPaths.has(d.path));

    if (newProjects.length === 0) {
      p.log.warn('All found projects are already registered');
      return;
    }

    const selected = await p.multiselect({
      message: 'Select projects to add:',
      options: newProjects.map((proj) => ({
        value: proj.name,
        label: proj.name,
        hint: `${proj.deployConfigs.length} config(s)`,
      })),
      required: true,
    });

    if (p.isCancel(selected)) return;

    for (const name of selected) {
      const proj = newProjects.find((p) => p.name === name)!;
      const branches: BranchConfig[] = [];

      for (const configFile of proj.deployConfigs) {
        const branch = extractBranchFromConfig(configFile);
        const defaultCommand = `kamal deploy -c ${configFile}`;

        const command = await p.text({
          message: `Command for ${proj.name}/${branch}:`,
          initialValue: defaultCommand,
        });

        if (p.isCancel(command)) continue;
        branches.push({ branch, command });
      }

      if (branches.length > 0) {
        config.projects.push({
          name: proj.name,
          path: proj.path,
          branches,
        });
      }
    }

    await saveConfig(config);
    p.log.success('Projects added');
  } else {
    const name = await p.text({
      message: 'Project name:',
      validate: (value) => {
        if (!value.trim()) return 'Name is required';
        if (config.projects.some((p) => p.name === value)) {
          return 'Name already exists';
        }
      },
    });

    if (p.isCancel(name)) return;

    const path = await p.text({
      message: 'Project path:',
      validate: (value) => {
        if (!value.trim()) return 'Path is required';
      },
    });

    if (p.isCancel(path)) return;

    const branch = await p.text({
      message: 'Branch name:',
      initialValue: 'main',
    });

    if (p.isCancel(branch)) return;

    const configFile =
      branch === 'main' ? 'config/deploy.yml' : `config/deploy.${branch}.yml`;

    const command = await p.text({
      message: 'Deploy command:',
      initialValue: `kamal deploy -c ${configFile}`,
    });

    if (p.isCancel(command)) return;

    config.projects.push({
      name,
      path: path.replace(/^~/, process.env.HOME || ''),
      branches: [{ branch, command }],
    });

    await saveConfig(config);
    p.log.success(`Project "${name}" added`);
  }
}

async function removeProject(config: Config): Promise<void> {
  const project = await selectProject(config, 'Select project to remove:');
  if (!project) return;

  const confirmed = await p.confirm({
    message: `Remove project "${project.name}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) return;

  config.projects = config.projects.filter((p) => p.name !== project.name);
  await saveConfig(config);
  p.log.success(`Project "${project.name}" removed`);
}
