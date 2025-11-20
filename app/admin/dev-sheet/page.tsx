import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface DevSheetData {
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
    gitHash: string;
    gitHashUrl?: string;
    gitStatus: string;
    environment: string;
    buildTime: string;
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
    commitSha?: string;
    commitUrl?: string;
    commitMessage?: string;
    commitAuthor?: string;
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
  const shadcnComponents = getComponentsInDirectory(
    join(process.cwd(), "components", "ui")
  );
  const customComponents = getComponentsInDirectory(
    join(process.cwd(), "components")
  ).filter((name) => name !== "ui");
  const appComponents = getComponentsInDirectory(
    join(process.cwd(), "app", "components")
  );

  return {
    shadcn: shadcnComponents,
    custom: customComponents,
    app: appComponents,
  };
}

function getShadcnConfig() {
  try {
    const configPath = join(process.cwd(), "components.json");
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
      gitHash: getGitHash(),
      gitHashUrl: getGitCommitUrl(),
      gitStatus: getGitStatus(),
      environment: process.env.NODE_ENV || "development",
      buildTime: getBuildTime(),
    };
  } catch {
    return {
      framework: "Unknown",
      language: "Unknown",
      styling: "Unknown",
      database: "Unknown",
      testing: "Unknown",
      nodeVersion: process.version,
      gitHash: "unknown",
      gitHashUrl: undefined,
      gitStatus: "unknown",
      environment: process.env.NODE_ENV || "development",
      buildTime: "Unknown",
    };
  }
}

function getGitRepositoryUrl(): string | undefined {
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

function getGitCommitUrl(): string | undefined {
  const repoUrl = getGitRepositoryUrl();
  if (!repoUrl) return undefined;

  // Use Vercel's environment variable in production
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

  if (!commitSha) return undefined;

  // Generate commit URL for GitHub, GitLab, etc.
  if (repoUrl.includes("github.com")) {
    return `${repoUrl}/commit/${commitSha}`;
  } else if (repoUrl.includes("gitlab.com")) {
    return `${repoUrl}/-/commit/${commitSha}`;
  } else if (repoUrl.includes("bitbucket.org")) {
    return `${repoUrl}/commits/${commitSha}`;
  }

  return undefined;
}

function getGitHash(): string {
  // Use Vercel's environment variable in production
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }

  // Fallback to git command in development
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf-8",
      cwd: process.cwd(),
    })
      .trim()
      .slice(0, 7);
  } catch {
    return "unknown";
  }
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
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    commitUrl: getGitCommitUrl(),
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || undefined,
    commitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || undefined,
  };
}

function getDevSheetData(): DevSheetData {
  const shadcnConfig = getShadcnConfig();
  const allComponents = getAllComponents();
  const techStack = getTechStack();
  const dependencies = getKeyDependencies();
  const vercel = getVercelInfo();

  return {
    shadcn: {
      ...shadcnConfig,
      components: allComponents.shadcn,
    },
    components: allComponents,
    techStack,
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

export default function DevSheetPage() {
  const data = getDevSheetData();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Development Sheet</h1>
        <p className="text-muted-foreground">
          Overview of installed components, styles, and dependencies
        </p>
      </div>

      <div className="space-y-8">
        {/* Row 1: Tech Stack | Key Dependencies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(data.techStack).map(([key, value]) => {
                let displayValue = value;
                let isClickable = false;
                let clickUrl: string | undefined;

                if (key === "buildTime" && typeof value === "string") {
                  displayValue = new Date(value).toLocaleString();
                } else if (key === "gitHash" && typeof value === "string") {
                  displayValue = value;
                  clickUrl = data.techStack.gitHashUrl;
                  isClickable = !!clickUrl;
                } else if (key === "gitStatus" && typeof value === "string") {
                  displayValue = value === "clean" ? "clean" : "dirty";
                }

                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium capitalize">{key}</p>
                    {isClickable && clickUrl ? (
                      <a
                        href={clickUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-accent transition-colors"
                        >
                          {displayValue}
                        </Badge>
                      </a>
                    ) : (
                      <Badge variant="outline">{displayValue}</Badge>
                    )}
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

        {/* Vercel Deployment Info */}
        {data.vercel && (
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Vercel Deployment</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {data.vercel.commitSha && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Commit SHA</p>
                  {data.vercel.commitUrl ? (
                    <a
                      href={data.vercel.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors"
                      >
                        {data.vercel.commitSha.slice(0, 7)}
                      </Badge>
                    </a>
                  ) : (
                    <Badge variant="outline">
                      {data.vercel.commitSha.slice(0, 7)}
                    </Badge>
                  )}
                </div>
              )}
              {data.vercel.commitAuthor && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Commit Author</p>
                  <Badge variant="outline">{data.vercel.commitAuthor}</Badge>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {data.vercel.url && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Deployment URL</p>
                  <a
                    href={data.vercel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline font-mono"
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
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline font-mono"
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
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline font-mono"
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
              {data.vercel.commitMessage && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Commit Message</p>
                  <p className="text-sm text-muted-foreground">
                    {data.vercel.commitMessage}
                  </p>
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
