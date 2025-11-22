import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { Card, CardContent, CardHeader, CardTitle } from "ui";
import { Badge } from "ui";
import { Button } from "ui";
import { Icon } from "ui";

async function checkPortAccessible(
  host: string,
  port: number
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`http://${host}:${port}`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "dev-sheet-status-check",
      },
    });

    clearTimeout(timeoutId);
    return response.status < 500; // Any response < 500 means server is running
  } catch {
    // Timeout, connection refused, or other network error
    return false;
  }
}

async function getAppStatuses(): Promise<AppStatus[]> {
  // Define apps with preferred hosts (subdomains first, then localhost)
  const apps: AppStatus[] = [
    {
      name: "Web",
      port: 3000,
      hosts: ["www.localhost", "web.localhost", "localhost"],
      url: `http://localhost:3000`,
      isRunning: false,
    },
    {
      name: "Admin",
      port: 3001,
      hosts: ["admin.localhost", "localhost"],
      url: `http://localhost:3001`,
      isRunning: false,
    },
  ];

  // Check each app's status
  for (const app of apps) {
    // Try each host in order of preference
    for (const host of app.hosts) {
      try {
        const isRunning = await checkPortAccessible(host, app.port);
        if (isRunning) {
          app.isRunning = true;
          app.url = `http://${host}:${app.port}`;
          break; // Use the first working host
        }
      } catch {
        // Continue to next host
        continue;
      }
    }
  }

  return apps;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return `${diffSeconds} ${diffSeconds === 1 ? "second" : "seconds"} ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
  }
}

function formatDateTimeWithRelative(dateString: string): string {
  const date = new Date(dateString);
  const formatted = date.toLocaleString();
  const relative = getRelativeTime(date);
  return `${formatted} – ${relative}`;
}

interface AppStatus {
  name: string;
  port: number;
  hosts: string[];
  url: string;
  isRunning: boolean;
}

interface DevSheetData {
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
  dependencies: {
    key: string[];
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

function getComponentsInDirectory(dirPath: string): string[] {
  try {
    const files = readdirSync(dirPath, { withFileTypes: true });
    return files
      .filter((file) => file.isFile() && file.name.endsWith(".tsx"))
      .map((file) => file.name.replace(".tsx", ""));
  } catch {
    return [];
  }
}

function getAllComponents() {
  // Get root directory (monorepo root)
  // process.cwd() in Next.js will be the app directory (apps/admin) when running from there
  // or the root when running from root. Try both.
  let rootDir = process.cwd();

  // If we're in apps/admin, go up to root
  if (rootDir.endsWith("apps/admin") || rootDir.endsWith("apps\\admin")) {
    rootDir = join(rootDir, "../..");
  }
  // If we're already at root, stay there

  // UI components are in packages/ui/source
  const shadcnComponents = getComponentsInDirectory(
    join(rootDir, "packages", "ui", "source")
  );

  // Custom components would be in apps/web/components (if any)
  const customComponents = getComponentsInDirectory(
    join(rootDir, "apps", "web", "components")
  ).filter((name) => name !== "ui");

  // App-specific components
  const appComponents = getComponentsInDirectory(
    join(rootDir, "apps", "web", "app", "components")
  );

  return {
    shadcn: shadcnComponents,
    custom: customComponents,
    app: appComponents,
  };
}

function getShadcnConfig() {
  try {
    // components.json is in apps/web
    let rootDir = process.cwd();

    // If we're in apps/admin, go up to root
    if (rootDir.endsWith("apps/admin") || rootDir.endsWith("apps\\admin")) {
      rootDir = join(rootDir, "../..");
    }

    const configPath = join(rootDir, "apps", "web", "components.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return {
      style: config.style || "default",
      iconLibrary: config.iconLibrary || "lucide",
      baseColor: config.tailwind?.baseColor || "neutral",
    };
  } catch {
    return {
      style: "unknown",
      iconLibrary: "unknown",
      baseColor: "unknown",
    };
  }
}

function getTechStack() {
  try {
    const packagePath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return {
      framework: `Next.js ${deps.next || "unknown"}`,
      language: `TypeScript ${deps.typescript || "unknown"}`,
      styling: `Tailwind CSS ${deps.tailwindcss || "unknown"}`,
      database: deps["drizzle-orm"]
        ? `Drizzle ORM ${deps["drizzle-orm"]}`
        : "None",
      testing: deps.vitest ? `Vitest ${deps.vitest}` : "None",
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    };
  } catch {
    return {
      framework: "Unknown",
      language: "Unknown",
      styling: "Unknown",
      database: "Unknown",
      testing: "Unknown",
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    };
  }
}

function getGitRepositoryUrl(): string | undefined {
  // Use Vercel environment variables in production
  if (process.env.VERCEL) {
    const repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
    const repoSlug = process.env.VERCEL_GIT_REPO_SLUG;
    if (repoOwner && repoSlug) {
      // Assume GitHub for Vercel deployments
      return `https://github.com/${repoOwner}/${repoSlug}`;
    }
  }

  // Fallback to git command in development
  try {
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();

    // Convert SSH to HTTPS URL (git@github.com:user/repo.git -> https://github.com/user/repo)
    if (remoteUrl.startsWith("git@")) {
      const match = remoteUrl.match(/git@([^:]+):(.+)\.git$/);
      if (match) {
        const [, host, repo] = match;
        return `https://${host}/${repo}`;
      }
    }

    // Convert HTTPS URL (remove .git if present)
    if (remoteUrl.startsWith("http")) {
      return remoteUrl.replace(/\.git$/, "");
    }

    return remoteUrl;
  } catch {
    return undefined;
  }
}

function getGitRepositoryName(): string | undefined {
  const repoUrl = getGitRepositoryUrl();
  if (!repoUrl) return undefined;

  // Extract repository name from URL
  // e.g., https://github.com/user/repo -> "GitHub"
  // or we could extract the repo name: "user/repo"
  if (repoUrl.includes("github.com")) {
    return "GitHub";
  } else if (repoUrl.includes("gitlab.com")) {
    return "GitLab";
  } else if (repoUrl.includes("bitbucket.org")) {
    return "Bitbucket";
  }

  return undefined;
}

function getGitCommitUrl(commitSha?: string): string | undefined {
  const repoUrl = getGitRepositoryUrl();
  if (!repoUrl) return undefined;

  const sha =
    commitSha ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    (() => {
      try {
        return execSync("git rev-parse HEAD", {
          encoding: "utf-8",
          cwd: process.cwd(),
        }).trim();
      } catch {
        return undefined;
      }
    })();

  if (!sha) return undefined;

  // Generate commit URL for GitHub, GitLab, etc.
  if (repoUrl.includes("github.com")) {
    return `${repoUrl}/commit/${sha}`;
  } else if (repoUrl.includes("gitlab.com")) {
    return `${repoUrl}/-/commit/${sha}`;
  } else if (repoUrl.includes("bitbucket.org")) {
    return `${repoUrl}/commits/${sha}`;
  }

  return undefined;
}

function getGitStatus(): string {
  // In production (Vercel), assume clean since it's from a committed state
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "clean";
  }

  // Only check git status in development
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
    return status.length === 0 ? "clean" : "dirty";
  } catch {
    return "unknown";
  }
}

function getBuildTime(): string {
  try {
    const nextDir = join(process.cwd(), ".next");
    const stats = statSync(nextDir);
    return stats.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function getCommitDate(commitSha?: string): string | undefined {
  const sha =
    commitSha ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    (() => {
      try {
        return execSync("git rev-parse HEAD", {
          encoding: "utf-8",
          cwd: process.cwd(),
        }).trim();
      } catch {
        return undefined;
      }
    })();

  if (!sha) return undefined;

  try {
    const dateStr = execSync(`git log -1 --format=%ci ${sha}`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
    return dateStr ? new Date(dateStr).toISOString() : undefined;
  } catch {
    return undefined;
  }
}

function getCommitMessage(commitSha?: string): string | undefined {
  // Use Vercel's environment variable in production
  if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
    return process.env.VERCEL_GIT_COMMIT_MESSAGE;
  }

  const sha =
    commitSha ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    (() => {
      try {
        return execSync("git rev-parse HEAD", {
          encoding: "utf-8",
          cwd: process.cwd(),
        }).trim();
      } catch {
        return undefined;
      }
    })();

  if (!sha) return undefined;

  try {
    const message = execSync(`git log -1 --format=%s ${sha}`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
    return message || undefined;
  } catch {
    return undefined;
  }
}

function getCommitAuthor(commitSha?: string): string | undefined {
  // Use Vercel's environment variable in production
  if (process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME) {
    return process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME;
  }

  const sha =
    commitSha ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    (() => {
      try {
        return execSync("git rev-parse HEAD", {
          encoding: "utf-8",
          cwd: process.cwd(),
        }).trim();
      } catch {
        return undefined;
      }
    })();

  if (!sha) return undefined;

  try {
    const author = execSync(`git log -1 --format=%an ${sha}`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
    return author || undefined;
  } catch {
    return undefined;
  }
}

function getGitBranch(): string | undefined {
  // Use Vercel's environment variable in production
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }

  // Fallback to git command in development
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
    return branch || undefined;
  } catch {
    return undefined;
  }
}

function getGitInfo() {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    (() => {
      try {
        return execSync("git rev-parse HEAD", {
          encoding: "utf-8",
          cwd: process.cwd(),
        }).trim();
      } catch {
        return undefined;
      }
    })();

  return {
    repositoryUrl: getGitRepositoryUrl(),
    repositoryName: getGitRepositoryName(),
    status: getGitStatus(),
    branch: getGitBranch(),
    commitSha: commitSha || undefined,
    commitUrl: getGitCommitUrl(commitSha),
    commitAuthor: getCommitAuthor(commitSha),
    commitDate: getCommitDate(commitSha),
    commitMessage: getCommitMessage(commitSha),
  };
}

function getKeyDependencies(): string[] {
  try {
    const packagePath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const keyDeps = [
      "next",
      "react",
      "react-dom",
      "typescript",
      "tailwindcss",
      "drizzle-orm",
      "vitest",
      "eslint",
      "prettier",
    ];

    return keyDeps
      .filter((dep) => allDeps[dep])
      .map((dep) => `${dep}@${allDeps[dep]}`);
  } catch {
    return [];
  }
}

function getVercelInfo() {
  // Only return Vercel info if running on Vercel
  if (!process.env.VERCEL) {
    return undefined;
  }

  return {
    env: process.env.VERCEL_ENV || "unknown",
    url: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
    branchUrl: process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
    productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    region: process.env.VERCEL_REGION || undefined,
    buildTime: getBuildTime(),
  };
}

async function getDevSheetData(): Promise<DevSheetData> {
  const apps = await getAppStatuses();
  const shadcnConfig = getShadcnConfig();
  const allComponents = getAllComponents();
  const techStack = getTechStack();
  const git = getGitInfo();
  const dependencies = getKeyDependencies();
  const vercel = getVercelInfo();

  return {
    apps,
    shadcn: {
      ...shadcnConfig,
      components: allComponents.shadcn,
    },
    components: allComponents,
    techStack,
    git,
    dependencies: {
      key: dependencies,
    },
    vercel,
    lastUpdated: new Date().toISOString(),
  };
}

function renderComponentExample(componentName: string) {
  switch (componentName) {
    case "button":
      return (
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="icon">
            <Icon name="settings" />
          </Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      );
    case "card":
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Card Example</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is a card component example.
            </p>
          </CardContent>
        </Card>
      );
    case "icon":
      return (
        <div className="flex flex-wrap gap-4 items-center">
          <Icon name="home" size={24} />
          <Icon name="settings" size={32} />
          <Icon name="favorite" size={24} fill />
          <Icon name="star" size={24} weight={600} />
        </div>
      );
    default:
      return (
        <p className="text-sm text-muted-foreground italic">
          No preview available
        </p>
      );
  }
}

export default async function DevSheetPage() {
  const data = await getDevSheetData();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Development Sheet</h1>
        <p className="text-muted-foreground">
          Overview of installed components, styles, and dependencies
        </p>
      </div>

      <div className="space-y-8">
        {/* Apps Status Row - Top Row */}
        <div className="border-b pb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {data.apps.map((app) => (
              <div
                key={app.name}
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    app.isRunning ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={app.isRunning ? "Running" : "Not running"}
                />
                <span className="font-medium">{app.name}</span>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline font-mono flex items-center gap-1"
                >
                  {app.url}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
        {/* Row 1: Tech Stack | Key Dependencies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(data.techStack).map(([key, value]) => {
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium capitalize">{key}</p>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Key Dependencies</h2>
            <div className="flex flex-wrap gap-2">
              {data.dependencies.key.map((dep) => (
                <Badge key={dep} variant="secondary">
                  {dep}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Git Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4">Git</h2>
          {/* First row: Commit Message (4 cols) and Commit Author (2 cols) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            {data.git.commitMessage && (
              <div className="space-y-1 md:col-span-4">
                <p className="text-sm font-medium">Commit Message</p>
                <p className="text-sm text-muted-foreground">
                  {data.git.commitMessage}
                </p>
              </div>
            )}
            {data.git.commitAuthor && (
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium">Commit Author</p>
                <Badge variant="outline">{data.git.commitAuthor}</Badge>
              </div>
            )}
          </div>
          {/* Second row: Commit Date (2 cols) and other fields */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {data.git.commitSha && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Commit SHA</p>
                {data.git.commitUrl ? (
                  <a
                    href={data.git.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors"
                    >
                      {data.git.commitSha.slice(0, 7)}
                    </Badge>
                  </a>
                ) : (
                  <Badge variant="outline">
                    {data.git.commitSha.slice(0, 7)}
                  </Badge>
                )}
              </div>
            )}
            {data.git.repositoryUrl && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Repository</p>
                <a
                  href={data.git.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    {data.git.repositoryName || "Repository"}
                  </Badge>
                </a>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <Badge variant="outline">
                {data.git.status === "clean" ? "clean" : "dirty"}
              </Badge>
            </div>
            {data.git.branch && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Branch</p>
                <Badge variant="outline">{data.git.branch}</Badge>
              </div>
            )}
            {data.git.commitDate && (
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium">Commit Date</p>
                <Badge variant="outline">
                  {formatDateTimeWithRelative(data.git.commitDate)}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Vercel Deployment Info */}
        {data.vercel && (
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Vercel Deployment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Environment</p>
                <Badge variant="outline">{data.vercel.env}</Badge>
              </div>
              {data.vercel.region && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Region</p>
                  <Badge variant="outline">{data.vercel.region}</Badge>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">Build Time</p>
                <Badge variant="outline">
                  {formatDateTimeWithRelative(data.vercel.buildTime)}
                </Badge>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.vercel.url && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Deployment URL</p>
                  <a
                    href={data.vercel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline font-mono"
                  >
                    {data.vercel.url}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
              {data.vercel.branchUrl && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Branch URL</p>
                  <a
                    href={data.vercel.branchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline font-mono"
                  >
                    {data.vercel.branchUrl}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
              {data.vercel.productionUrl && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Production URL</p>
                  <a
                    href={data.vercel.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline font-mono"
                  >
                    {data.vercel.productionUrl}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-8">
          {/* Row 2: UI Configuration - six columns */}
          <div>
            <h1 className="text-3xl font-bold mb-6">Interface</h1>
            <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
            <div className="grid grid-cols-6 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Style</p>
                <Badge variant="outline">{data.shadcn.style}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Icon Library</p>
                <Badge variant="outline">{data.shadcn.iconLibrary}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Base Color</p>
                <Badge variant="outline">{data.shadcn.baseColor}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Components - each in its own row */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-12">
            {data.components.shadcn.length > 0 &&
              data.components.shadcn.map((component) => (
                <div key={component} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{component}</Badge>
                  </div>
                  {renderComponentExample(component)}
                </div>
              ))}
            {data.components.custom.length > 0 &&
              data.components.custom.map((component) => (
                <div key={component} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{component}</Badge>
                  </div>
                  {renderComponentExample(component)}
                </div>
              ))}
            {data.components.app.length > 0 &&
              data.components.app.map((component) => (
                <div key={component} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{component}</Badge>
                  </div>
                  {renderComponentExample(component)}
                </div>
              ))}
            {data.components.shadcn.length === 0 &&
              data.components.custom.length === 0 &&
              data.components.app.length === 0 && (
                <p className="text-sm text-muted-foreground">No components</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
