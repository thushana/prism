export interface AppStatus {
  name: string;
  port: number;
  hosts: string[];
  url: string;
  isRunning: boolean;
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
  git: {
    repositoryUrl?: string;
    repositoryName?: string;
    status: string;
    branch?: string;
    commitSha?: string;
    commitUrl?: string;
    commitAuthor?: string;
    commitDate?: string;
    commitMessage?: string;
  };
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
  showPrismTypography?: boolean;
  /**
   * When true, the main sheet title renders as `h2` so an outer admin shell can own the page `h1`.
   */
  nestedUnderAdminPageShell?: boolean;
}
