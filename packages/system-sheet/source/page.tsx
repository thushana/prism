import { Geist_Mono } from "next/font/google";
import {
  PrismBadge,
  PrismCard,
  PrismCardContent,
  PrismCardHeader,
  PrismCardTitle,
  PrismIcon,
  PrismTypography,
} from "@ui";
import { satoshi, sentient, zodiak } from "@ui";
import { formatDateTimeWithRelative } from "./data";
import { FontWeightPreview } from "./font-weight-preview";
import { TypeScalePreview } from "./type-scale-preview";
import type { SystemSheetConfig, SystemSheetData } from "./types";
import { SystemSheetButtonExamples } from "./system-sheet-button-examples";

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

// Helper function to render component examples
function renderComponentExample(componentName: string) {
  switch (componentName) {
    case "button":
      return <SystemSheetButtonExamples />;
    case "badge":
      return (
        <div className="flex flex-wrap gap-2 items-center">
          <PrismBadge variant="default">Default</PrismBadge>
          <PrismBadge variant="secondary">Secondary</PrismBadge>
          <PrismBadge variant="outline">Outline</PrismBadge>
          <PrismBadge variant="destructive">Destructive</PrismBadge>
        </div>
      );
    case "card":
      return (
        <PrismCard className="w-full max-w-sm">
          <PrismCardHeader>
            <PrismCardTitle>Card Example</PrismCardTitle>
          </PrismCardHeader>
          <PrismCardContent>
            <PrismTypography role="body" size="medium" className="text-muted-foreground">
              This is a card component example.
            </PrismTypography>
          </PrismCardContent>
        </PrismCard>
      );
    case "icon":
      return (
        <div className="flex flex-wrap gap-4 items-center">
          <PrismIcon name="home" size="medium" />
          <PrismIcon name="settings" size="large" />
          <PrismIcon name="favorite" size="medium" fill="on" />
          <PrismIcon name="star" size="medium" weight="thick" />
        </div>
      );
    default:
      return (
        <PrismTypography role="body" size="medium" className="text-muted-foreground italic">
          No preview available
        </PrismTypography>
      );
  }
}

/**
 * SystemSheetPage - A reusable system information page
 *
 * Usage in your app:
 * ```tsx
 * import { SystemSheetPage } from "@prism/core/system-sheet";
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
    showPrismTypography = true,
    nestedUnderAdminPageShell = false,
  } = config;
  const sheetHeadlineElement = nestedUnderAdminPageShell ? "h2" : "h1";

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
        <div className="space-y-2">
          <PrismTypography
            role="headline"
            size="large"
            as={sheetHeadlineElement}
          >
            System Sheet
          </PrismTypography>
          <PrismTypography role="body" size="large" className="text-muted-foreground">
            Unable to load system data. Please try again in a moment.
          </PrismTypography>
        </div>
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
      <div className="space-y-2">
        <PrismTypography
          role="headline"
          size="large"
          as={sheetHeadlineElement}
        >
          System Sheet
        </PrismTypography>
        <PrismTypography role="body" size="large" className="text-muted-foreground">
          Overview of installed components, styles, and dependencies
        </PrismTypography>
      </div>

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
                  <PrismBadge variant="outline">{value}</PrismBadge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Git Section */}
        {showGit && data.git && (
          <div className="border-t pt-8">
            <h2 className="mb-4">Git</h2>
            {/* First row: Full-width blocks */}
            <div className="mb-4 space-y-4">
              {data.git.commitMessage && (
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
                    {data.git.commitMessage}
                  </PrismTypography>
                </div>
              )}
              {data.git.commitAuthor && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Commit Author
                  </PrismTypography>
                  <PrismBadge variant="outline">{data.git.commitAuthor}</PrismBadge>
                </div>
              )}
            </div>
            {/* Second row: Commit Date (2 cols) and other fields */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {data.git.commitSha && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Commit SHA
                  </PrismTypography>
                  {data.git.commitUrl ? (
                    <a
                      href={data.git.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <PrismBadge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors"
                      >
                        {data.git.commitSha.slice(0, 7)}
                      </PrismBadge>
                    </a>
                  ) : (
                    <PrismBadge variant="outline">
                      {data.git.commitSha.slice(0, 7)}
                    </PrismBadge>
                  )}
                </div>
              )}
              {data.git.repositoryUrl && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Repository
                  </PrismTypography>
                  <a
                    href={data.git.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <PrismBadge
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors"
                    >
                      {data.git.repositoryName || "Repository"}
                    </PrismBadge>
                  </a>
                </div>
              )}
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Status
                </PrismTypography>
                <PrismBadge variant="outline">
                  {data.git.status === "clean" ? "clean" : "dirty"}
                </PrismBadge>
              </div>
              {data.git.branch && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Branch
                  </PrismTypography>
                  <PrismBadge variant="outline">{data.git.branch}</PrismBadge>
                </div>
              )}
              {data.git.commitDate && (
                <div className="space-y-1 md:col-span-2">
                  <PrismTypography role="overline" size="small">
                    Commit Date
                  </PrismTypography>
                  <PrismBadge variant="outline">
                    {formatDateTimeWithRelative(data.git.commitDate)}
                  </PrismBadge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vercel Deployment Info */}
        {showVercel && data.vercel && (
          <div className="border-t pt-8">
            <h2 className="mb-4">Vercel Deployment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Environment
                </PrismTypography>
                <PrismBadge variant="outline">{data.vercel.env}</PrismBadge>
              </div>
              {data.vercel.region && (
                <div className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    Region
                  </PrismTypography>
                  <PrismBadge variant="outline">{data.vercel.region}</PrismBadge>
                </div>
              )}
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Build Time
                </PrismTypography>
                <PrismBadge variant="outline">
                  {formatDateTimeWithRelative(data.vercel.buildTime)}
                </PrismBadge>
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
                <PrismBadge variant="outline">{data.shadcn.style}</PrismBadge>
              </div>
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Icon Library
                </PrismTypography>
                <PrismBadge variant="outline">{data.shadcn.iconLibrary}</PrismBadge>
              </div>
              <div className="space-y-1">
                <PrismTypography role="overline" size="small">
                  Base Color
                </PrismTypography>
                <PrismBadge variant="outline">{data.shadcn.baseColor}</PrismBadge>
              </div>
            </div>
          </div>
        )}

        {/* Components */}
        {showComponents && data.components && (
          <div className="border-t pt-8">
            <h2 className="mb-4">Components</h2>
            <div className="space-y-12">
              {data.components.shadcn.length > 0 &&
                data.components.shadcn.map((component) => (
                  <div key={component} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PrismBadge variant="secondary">{component}</PrismBadge>
                    </div>
                    {renderComponentExample(component)}
                  </div>
                ))}
              {data.components.custom.length > 0 &&
                data.components.custom.map((component) => (
                  <div key={component} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PrismBadge variant="outline">{component}</PrismBadge>
                    </div>
                    {renderComponentExample(component)}
                  </div>
                ))}
              {data.components.app.length > 0 &&
                data.components.app.map((component) => (
                  <div key={component} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PrismBadge variant="outline">{component}</PrismBadge>
                    </div>
                    {renderComponentExample(component)}
                  </div>
                ))}
              {data.components.shadcn.length === 0 &&
                data.components.custom.length === 0 &&
                data.components.app.length === 0 && (
                  <PrismTypography role="body" size="medium" className="text-muted-foreground">
                    No components
                  </PrismTypography>
                )}
            </div>
          </div>
        )}

        {/* PrismTypography Section */}
        {showPrismTypography && (
          <div className="border-t pt-8">
            <h2 className="mb-4">PrismTypography</h2>

            <FontWeightPreview
              satoshiVariableClass={satoshi.variable}
              sentientVariableClass={sentient.variable}
              zodiakVariableClass={zodiak.variable}
              geistMonoVariableClass={geistMono.variable}
            />

            <TypeScalePreview
              satoshiVariableClass={satoshi.variable}
              sentientVariableClass={sentient.variable}
              zodiakVariableClass={zodiak.variable}
              geistMonoVariableClass={geistMono.variable}
            />

          </div>
        )}
      </div>
    </div>
  );
}

export default SystemSheetPage;
