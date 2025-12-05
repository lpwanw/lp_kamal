export interface BranchConfig {
  branch: string;
  command: string;
}

export interface ProjectConfig {
  name: string;
  path: string;
  branches: BranchConfig[];
}

// Legacy v1 config for migration
export interface ConfigV1 {
  version: 1;
  branches: BranchConfig[];
}

export interface Config {
  version: 2;
  projects: ProjectConfig[];
}

export const DEFAULT_CONFIG: Config = {
  version: 2,
  projects: [],
};
