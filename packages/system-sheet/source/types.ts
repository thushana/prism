export interface AppStatus {
  name: string;
  port: number;
  hosts: string[];
  url: string;
  isRunning: boolean;
}

/** Git metadata for one worktree (app root, nested package, etc.). */
export interface SystemSheetGitRepoInfo {
  repositoryUrl?: string;
  repositoryName?: string;
  status: string;
  branch?: string;
  commitSha?: string;
  commitUrl?: string;
  commitAuthor?: string;
  commitDate?: string;
  commitMessage?: string;
  /** Local branch vs upstream (e.g. unpushed commits); undefined if not computed. */
  pushStatus?: string;
}

export interface SystemSheetData {
  apps: AppStatus[];
  shadcn: {
    style: string;
    iconLibrary: string;
    baseColor: string;
    components: string[];
  };
  components: {
    shadcn: string[];
    custom: string[];
    app: string[];
  };
  techStack: {
    framework: string;
    language: string;
    styling: string;
    database: string;
    testing: string;
    nodeVersion: string;
    environment: string;
  };
  /**
   * Single-repo apps: populate this when you do not use `gitRepositories`.
   * Ignored by the sheet UI when `gitRepositories` is non-empty.
   */
  git?: SystemSheetGitRepoInfo;
  /**
   * Multiple worktrees (e.g. monorepo root + `prism/`). When set and non-empty,
   * the Git section renders one subsection per entry with `title` as the heading.
   */
  gitRepositories?: Array<{
    title: string;
    git: SystemSheetGitRepoInfo;
  }>;
  vercel?: {
    env: string;
    url?: string;
    branchUrl?: string;
    productionUrl?: string;
    region?: string;
    buildTime: string;
  };
  lastUpdated: string;
}

export interface SystemSheetConfig {
  showEnvironment?: boolean;
  showGit?: boolean;
  showVercel?: boolean;
  showApps?: boolean;
  showComponents?: boolean;
  /**
   * When true, the main sheet title renders as `h2` so an outer admin shell can own the page `h1`.
   */
  nestedUnderAdminPageShell?: boolean;
}
