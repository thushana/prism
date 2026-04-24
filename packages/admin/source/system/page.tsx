import { Geist_Mono } from "next/font/google";
import {
  PRISM_META_CHIP_INTERACTIVE_CLASS,
  PRISM_META_CHIP_OUTLINE_CLASS,
  PrismDivider,
  PrismTypography,
} from "@ui";
import { cn } from "@utilities";
import { formatDateTimeWithRelative } from "./data";
import type {
  SystemSheetConfig,
  SystemSheetData,
  SystemSheetGitRepoInfo,
} from "./types";

// Initialize Geist Mono font
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SystemSheetPageProps {
  data?: SystemSheetData | null;
  config?: SystemSheetConfig;
}

function GitRepoDetail({ git }: { git: SystemSheetGitRepoInfo }) {
  return (
    <>
      <div className="mb-4 space-y-4">
        {git.commitMessage && (
          <div className="space-y-1 w-full">
            <PrismTypography role="overline" size="small">
              Commit Message
            </PrismTypography>
            <PrismTypography
              role="body"
              size="medium"
              font="mono"
              className="block w-full text-muted-foreground wrap-break-word"
            >
              {git.commitMessage}
            </PrismTypography>
          </div>
        )}
        {git.commitAuthor && (
          <div className="space-y-1">
            <PrismTypography role="overline" size="small">
              Commit Author
            </PrismTypography>
            <span className={PRISM_META_CHIP_OUTLINE_CLASS}>{git.commitAuthor}</span>
          </div>
        )}
      </div>
      <div className="grid min-w-0 w-full grid-cols-2 md:grid-cols-6 gap-4">
        {git.commitSha && (
          <div className="space-y-1">
            <PrismTypography role="overline" size="small">
              Commit SHA
            </PrismTypography>
            {git.commitUrl ? (
              <a
                href={git.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <span
                  className={cn(
                    PRISM_META_CHIP_OUTLINE_CLASS,
                    PRISM_META_CHIP_INTERACTIVE_CLASS,
                  )}
                >
                  {git.commitSha.slice(0, 7)}
                </span>
              </a>
            ) : (
              <span className={PRISM_META_CHIP_OUTLINE_CLASS}>
                {git.commitSha.slice(0, 7)}
              </span>
            )}
          </div>
        )}
        {git.repositoryUrl && (
          <div className="space-y-1">
            <PrismTypography role="overline" size="small">
              Repository
            </PrismTypography>
            <a
              href={git.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <span
                className={cn(
                  PRISM_META_CHIP_OUTLINE_CLASS,
                  PRISM_META_CHIP_INTERACTIVE_CLASS,
                )}
              >
                {git.repositoryName || "Repository"}
              </span>
            </a>
          </div>
        )}
        <div className="space-y-1">
          <PrismTypography role="overline" size="small">
            Status
          </PrismTypography>
          <span className={PRISM_META_CHIP_OUTLINE_CLASS}>
            {git.status === "clean" ? "clean" : "dirty"}
          </span>
        </div>
        {git.branch && (
          <div className="space-y-1">
            <PrismTypography role="overline" size="small">
              Branch
            </PrismTypography>
            <span className={PRISM_META_CHIP_OUTLINE_CLASS}>{git.branch}</span>
          </div>
        )}
        {git.commitDate && (
          <div className="space-y-1 md:col-span-2">
            <PrismTypography role="overline" size="small">
              Commit Date
            </PrismTypography>
            <span
              className={cn(
                PRISM_META_CHIP_OUTLINE_CLASS,
                "max-w-full whitespace-normal text-left",
              )}
            >
              {formatDateTimeWithRelative(git.commitDate)}
            </span>
          </div>
        )}
        {git.pushStatus && (
          <div className="space-y-1 md:col-span-2">
            <PrismTypography role="overline" size="small">
              Push Status
            </PrismTypography>
            <span
              className={cn(
                PRISM_META_CHIP_OUTLINE_CLASS,
                "max-w-full whitespace-normal text-left",
              )}
            >
              {git.pushStatus}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * SystemSheetPage - A reusable system information page
 *
 * Usage in your app:
 * ```tsx
 * import { SystemSheetPage } from "@prism/core/admin";
 * import { headers } from "next/headers";
 *
 * export const dynamic = "force-dynamic";
 *
 * async function fetchSystemSheetData() {
 *   try {
 *     const headersList = await headers();
 *     const host = headersList.get("host") || "localhost:3001";
 *     const protocol = process.env.VERCEL_URL
 *       ? "https"
 *       : host.includes("localhost")
 *         ? "http"
 *         : "https";
 *     const baseUrl = `${protocol}://${host}`;
 *
 *     const res = await fetch(`${baseUrl}/api/system-sheet`, {
 *       cache: "no-store",
 *     });
 *     if (!res.ok) return null;
 *     const json = await res.json();
 *     return json?.success ? json.data : null;
 *   } catch {
 *     return null;
 *   }
 * }
 *
 * export default async function Page() {
 *   const data = await fetchSystemSheetData();
 *   return <SystemSheetPage data={data} />;
 * }
 * ```
 */
export function SystemSheetPage({ data, config = {} }: SystemSheetPageProps) {
  const {
    showEnvironment = true,
    showGit = true,
    showVercel = true,
    showApps = true,
    showComponents = true,
    nestedUnderAdminPageShell = false,
  } = config;

  const sheetOuterClassName = nestedUnderAdminPageShell
    ? `space-y-8 font-sans w-full ${geistMono.variable}`
    : `container mx-auto space-y-8 p-8 font-sans ${geistMono.variable}`;

  if (!data) {
    return (
      <div
        className={
          nestedUnderAdminPageShell
            ? "space-y-8 font-sans w-full"
            : "container mx-auto space-y-8 p-8 font-sans"
        }
      >
        <PrismTypography role="body" size="large" className="text-muted-foreground">
          Unable to load system data. Please try again in a moment.
        </PrismTypography>
        <PrismTypography role="body" size="medium" className="text-muted-foreground">
          Make sure your app has an{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            /api/system-sheet
          </code>{" "}
          endpoint that returns system data.
        </PrismTypography>
      </div>
    );
  }

  return (
    <div className={sheetOuterClassName}>
      <div className="space-y-8">
        {/* Apps Status Row - Top Row */}
        {showApps && data.apps && data.apps.length > 0 && (
          <div className="border-b pb-8">
            <div className="flex flex-wrap gap-4 items-center">
              {data.apps.map((app) => (
                <div
                  key={app.name}
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      app.isRunning ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={app.isRunning ? "Running" : "Not running"}
                  />
                  <PrismTypography role="title" size="medium" as="p" className="inline">
                    {app.name}
                  </PrismTypography>
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
        )}

        {/* Tech stack (environment summary) */}
        {showEnvironment && (
          <div>
            <h2 className="mb-4">Tech Stack</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(data.techStack).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    {key}
                  </PrismTypography>
                  <span className={PRISM_META_CHIP_OUTLINE_CLASS}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Git Section */}
        {showGit &&
          (data.gitRepositories && data.gitRepositories.length > 0 ? (
            <div className="border-t pt-8">
              <h2 className="mb-6">Git</h2>
              <div className="w-full min-w-0 space-y-2">
                {data.gitRepositories.map((entry, index) => (
                  <div key={entry.title} className="w-full min-w-0">
                    {index > 0 ? (
                      <PrismDivider
                        spacing="comfortable"
                        lineWeight="thin"
                        tone="default"
                        className="mt-8"
                      />
                    ) : null}
                    <div className="min-w-0 w-full space-y-4">
                      <PrismTypography
                        role="title"
                        size="large"
                        as="h3"
                        color={{ semanticText: "foreground" }}
                      >
                        {entry.title}
                      </PrismTypography>
                      <GitRepoDetail git={entry.git} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : data.git ? (
            <div className="border-t pt-8">
              <h2 className="mb-4">Git</h2>
              <GitRepoDetail git={data.git} />
            </div>
          ) : null)}

        {/* Vercel Deployment Info */}
        {showVercel && data.vercel && (
          <div className="border-t pt-8">
            <h2 className="mb-4">Vercel Deployment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Environment
                </PrismTypography>
                <span className={PRISM_META_CHIP_OUTLINE_CLASS}>{data.vercel.env}</span>
              </div>
              {data.vercel.region && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Region
                  </PrismTypography>
                  <span className={PRISM_META_CHIP_OUTLINE_CLASS}>
                    {data.vercel.region}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Build Time
                </PrismTypography>
                <span className={PRISM_META_CHIP_OUTLINE_CLASS}>
                  {formatDateTimeWithRelative(data.vercel.buildTime)}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.vercel.url && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Deployment URL
                  </PrismTypography>
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
                  <PrismTypography role="overline" size="small">
                    Branch URL
                  </PrismTypography>
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
                  <PrismTypography role="overline" size="small">
                    Production URL
                  </PrismTypography>
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

        {/* UI Configuration */}
        {showComponents && data.shadcn && (
          <div className="border-t pt-8">
            <h2 className="mb-4">UI Configuration</h2>
            <div className="grid grid-cols-6 gap-4">
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Style
                </PrismTypography>
                <span className={PRISM_META_CHIP_OUTLINE_CLASS}>{data.shadcn.style}</span>
              </div>
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Icon Library
                </PrismTypography>
                <span className={PRISM_META_CHIP_OUTLINE_CLASS}>
                  {data.shadcn.iconLibrary}
                </span>
              </div>
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Base Color
                </PrismTypography>
                <span className={PRISM_META_CHIP_OUTLINE_CLASS}>
                  {data.shadcn.baseColor}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemSheetPage;
