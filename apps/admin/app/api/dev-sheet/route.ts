import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { AppStatus, DevSheetData } from "dev-sheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const execFileAsync = promisify(execFile);

async function safeExec(
  cmd: string,
  args: string[],
  timeoutMs = 1000
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: timeoutMs });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

async function findProjectRoot(startDir: string): Promise<string> {
  let currentDir = startDir;
  const { root } = path.parse(startDir);

  while (true) {
    try {
      const pkgPath = path.join(currentDir, "package.json");
      const pkgRaw = await readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgRaw);
      if (pkg.workspaces) {
        return currentDir;
      }
    } catch {
      // ignore
    }

    if (currentDir === root) break;
    currentDir = path.dirname(currentDir);
  }

  return startDir;
}

async function getComponentsInDirectory(dirPath: string): Promise<string[]> {
  try {
    const items = await readdir(dirPath, { withFileTypes: true });
    return items
      .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
      .map((entry) => entry.name.replace(/\.tsx$/, ""));
  } catch {
    return [];
  }
}

async function getAppStatuses(): Promise<AppStatus[]> {
  const apps: AppStatus[] = [
    {
      name: "Web",
      port: 3000,
      hosts: ["www.localhost", "web.localhost", "localhost"],
      url: "http://localhost:3000",
      isRunning: false,
    },
    {
      name: "Admin",
      port: 3001,
      hosts: ["admin.localhost", "localhost"],
      url: "http://localhost:3001",
      isRunning: false,
    },
  ];

  // Skip port checks in production (Vercel) - localhost ports won't be accessible
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return apps;
  }

  // In development, check app statuses with shorter timeout and parallelize
  const checkPromises = apps.map(async (app) => {
    for (const host of app.hosts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500); // Reduced from 2000ms
      try {
        const response = await fetch(`http://${host}:${app.port}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
          headers: { "User-Agent": "dev-sheet-status-check" },
        });
        clearTimeout(timeoutId);
        if (response.status < 500) {
          app.isRunning = true;
          app.url = `http://${host}:${app.port}`;
          break;
        }
      } catch {
        clearTimeout(timeoutId);
        continue;
      }
    }
  });

  await Promise.all(checkPromises);

  return apps;
}

async function getShadcnConfig(rootDir: string) {
  try {
    const configPath = path.join(rootDir, "apps", "web", "components.json");
    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    return {
      style: config.style || "default",
      iconLibrary: config.iconLibrary || "lucide",
      baseColor: config.tailwind?.baseColor || "neutral",
    };
  } catch {
    return { style: "unknown", iconLibrary: "unknown", baseColor: "unknown" };
  }
}

async function getTechStack(rootDir: string) {
  try {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
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

async function getGitInfo() {
  const repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
  const repoSlug = process.env.VERCEL_GIT_REPO_SLUG;
  const envCommit = process.env.VERCEL_GIT_COMMIT_SHA;

  const repositoryUrl =
    repoOwner && repoSlug
      ? `https://github.com/${repoOwner}/${repoSlug}`
      : await safeExec("git", ["config", "--get", "remote.origin.url"]);

  const commitSha = envCommit || (await safeExec("git", ["rev-parse", "HEAD"]));
  const commitMessage =
    process.env.VERCEL_GIT_COMMIT_MESSAGE ||
    (await safeExec("git", ["log", "-1", "--format=%s"]));
  const commitAuthor =
    process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME ||
    (await safeExec("git", ["log", "-1", "--format=%an"]));
  const commitDate = await safeExec("git", ["log", "-1", "--format=%ci"]);
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    (await safeExec("git", ["rev-parse", "--abbrev-ref", "HEAD"]));
  const status =
    process.env.VERCEL || process.env.NODE_ENV === "production"
      ? "clean"
      : (await safeExec("git", ["status", "--porcelain"]))?.trim() === ""
        ? "clean"
        : "dirty";

  let repositoryName: string | undefined;
  if (repositoryUrl?.includes("github.com")) repositoryName = "GitHub";
  else if (repositoryUrl?.includes("gitlab.com")) repositoryName = "GitLab";
  else if (repositoryUrl?.includes("bitbucket.org"))
    repositoryName = "Bitbucket";

  let commitUrl: string | undefined;
  if (repositoryUrl && commitSha) {
    if (repositoryUrl.includes("github.com")) {
      commitUrl = `${repositoryUrl.replace(/\.git$/, "")}/commit/${commitSha}`;
    } else if (repositoryUrl.includes("gitlab.com")) {
      commitUrl = `${repositoryUrl.replace(/\.git$/, "")}/-/commit/${commitSha}`;
    } else if (repositoryUrl.includes("bitbucket.org")) {
      commitUrl = `${repositoryUrl.replace(/\.git$/, "")}/commits/${commitSha}`;
    }
  }

  const parsedCommitDate = commitDate
    ? new Date(commitDate).toISOString()
    : undefined;

  return {
    repositoryUrl: repositoryUrl?.replace(/\.git$/, ""),
    repositoryName,
    status: status || "unknown",
    branch: branch || undefined,
    commitSha: commitSha || undefined,
    commitUrl,
    commitAuthor: commitAuthor || undefined,
    commitDate: parsedCommitDate,
    commitMessage: commitMessage || undefined,
  };
}

async function getKeyDependencies(rootDir: string): Promise<string[]> {
  try {
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
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

async function getBuildTime(rootDir: string): Promise<string> {
  try {
    const nextDir = path.join(rootDir, ".next");
    const stats = await stat(nextDir);
    return stats.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function getVercelInfo(buildTime: string) {
  if (!process.env.VERCEL) return undefined;
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
    buildTime,
  };
}

export async function GET() {
  try {
    const projectRoot = await findProjectRoot(process.cwd());
    const apps = await getAppStatuses();
    const shadcnConfig = await getShadcnConfig(projectRoot);
    const shadcnComponents = await getComponentsInDirectory(
      path.join(projectRoot, "packages", "ui", "source")
    );
    const customComponents = await getComponentsInDirectory(
      path.join(projectRoot, "apps", "web", "components")
    );
    const appComponents = await getComponentsInDirectory(
      path.join(projectRoot, "apps", "web", "app", "components")
    );
    const techStack = await getTechStack(projectRoot);
    const git = await getGitInfo();
    const dependencies = await getKeyDependencies(projectRoot);
    const buildTime = await getBuildTime(projectRoot);
    const vercel = getVercelInfo(buildTime);

    const data: DevSheetData = {
      apps,
      shadcn: {
        ...shadcnConfig,
        components: shadcnComponents,
      },
      components: {
        shadcn: shadcnComponents,
        custom: customComponents,
        app: appComponents,
      },
      techStack,
      git,
      dependencies: { key: dependencies },
      vercel,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load dev sheet data" },
      { status: 500 }
    );
  }
}
