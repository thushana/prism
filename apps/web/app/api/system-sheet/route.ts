import { NextResponse } from "next/server";
import type { SystemSheetData } from "@system-sheet";
import { serverLogger as logger } from "@logger/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getGitInfo() {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  async function safeExec(
    cmd: string,
    args: string[]
  ): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(cmd, args, { timeout: 1000 });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

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
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    (await safeExec("git", ["rev-parse", "--abbrev-ref", "HEAD"]));
  const status =
    process.env.VERCEL || process.env.NODE_ENV === "production"
      ? "clean"
      : (await safeExec("git", ["status", "--porcelain"]))?.trim() === ""
        ? "clean"
        : "dirty";

  return {
    repositoryUrl: repositoryUrl?.replace(/\.git$/, ""),
    status: status || "unknown",
    branch: branch || undefined,
    commitSha: commitSha || undefined,
    commitMessage: commitMessage || undefined,
  };
}

function getVercelInfo() {
  if (!process.env.VERCEL) return undefined;
  return {
    env: process.env.VERCEL_ENV || "unknown",
    url: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
    region: process.env.VERCEL_REGION || undefined,
    buildTime: new Date().toISOString(),
  };
}

export async function getSystemSheetData(): Promise<SystemSheetData> {
  const git = await getGitInfo();
  const vercel = getVercelInfo();

  const data: SystemSheetData = {
    apps: [],
    shadcn: {
      style: "default",
      iconLibrary: "material-symbols",
      baseColor: "neutral",
      components: [],
    },
    components: {
      shadcn: [],
      custom: [],
      app: [],
    },
    techStack: {
      framework: "Next.js 16.1.1",
      language: "TypeScript 5.9.3",
      styling: "Tailwind CSS 4.1.17",
      database: "Drizzle ORM beta",
      testing: "None",
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    },
    git,
    dependencies: { key: [] },
    vercel,
    lastUpdated: new Date().toISOString(),
  };

  return data;
}

export async function GET() {
  try {
    const data = await getSystemSheetData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to get system-sheet data", { error: errorMessage });
    return NextResponse.json(
      { success: false, error: "Failed to fetch system-sheet data" },
      { status: 500 }
    );
  }
}
