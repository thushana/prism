import { Geist_Mono } from "next/font/google";
import {
  Badge,
  Button as UiButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ContentBreakout,
  ContentText,
  LayoutWrappersReference,
} from "@ui";
import { Icon } from "@ui";
import { satoshi, sentient, zodiak } from "@ui";
import { formatDateTimeWithRelative } from "./data";
import { Button } from "./button";
import type { SystemSheetConfig, SystemSheetData } from "./types";

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
      return (
        <div className="flex flex-wrap gap-2 items-center">
          <UiButton variant="default">Default</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="outline">Outline</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="destructive">Destructive</UiButton>
          <UiButton variant="link">Link</UiButton>
          <UiButton size="icon">
            <Icon name="settings" />
          </UiButton>
          <UiButton size="sm">Small</UiButton>
          <UiButton size="lg">Large</UiButton>
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
    showTypography = true,
  } = config;

  if (!data) {
    return (
      <div className="container mx-auto p-8 space-y-8 font-sans">
        <h1 className="mb-2">System Sheet</h1>
        <p className="text-muted-foreground">
          Unable to load system data. Please try again in a moment.
        </p>
        <p className="text-sm text-muted-foreground">
          Make sure your app has an{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            /api/system-sheet
          </code>{" "}
          endpoint that returns system data.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto p-8 space-y-8 font-sans ${geistMono.variable}`}
    >
      <div>
        <h1 className="mb-2">System Sheet</h1>
        <p className="text-muted-foreground">
          Overview of installed components, styles, and dependencies
        </p>
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
        )}

        {/* Row 1: Tech Stack | Key Dependencies */}
        {showEnvironment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="mb-4">Tech Stack</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(data.techStack).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="typography-label capitalize">{key}</p>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4">Key Dependencies</h2>
              <div className="flex flex-wrap gap-2">
                {data.dependencies.key.map((dep) => (
                  <Badge key={dep} variant="secondary">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Git Section */}
        {showGit && data.git && (
          <div className="border-t pt-8">
            <h2 className="mb-4">Git</h2>
            {/* First row: Commit Message (4 cols) and Commit Author (2 cols) */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              {data.git.commitMessage && (
                <div className="space-y-1 md:col-span-4">
                  <p className="typography-label">Commit Message</p>
                  <p className="text-sm text-muted-foreground">
                    {data.git.commitMessage}
                  </p>
                </div>
              )}
              {data.git.commitAuthor && (
                <div className="space-y-1 md:col-span-2">
                  <p className="typography-label">Commit Author</p>
                  <Badge variant="outline">{data.git.commitAuthor}</Badge>
                </div>
              )}
            </div>
            {/* Second row: Commit Date (2 cols) and other fields */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {data.git.commitSha && (
                <div className="space-y-1">
                  <p className="typography-label">Commit SHA</p>
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
                  <p className="typography-label">Repository</p>
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
                <p className="typography-label">Status</p>
                <Badge variant="outline">
                  {data.git.status === "clean" ? "clean" : "dirty"}
                </Badge>
              </div>
              {data.git.branch && (
                <div className="space-y-1">
                  <p className="typography-label">Branch</p>
                  <Badge variant="outline">{data.git.branch}</Badge>
                </div>
              )}
              {data.git.commitDate && (
                <div className="space-y-1 md:col-span-2">
                  <p className="typography-label">Commit Date</p>
                  <Badge variant="outline">
                    {formatDateTimeWithRelative(data.git.commitDate)}
                  </Badge>
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
                <p className="typography-label">Environment</p>
                <Badge variant="outline">{data.vercel.env}</Badge>
              </div>
              {data.vercel.region && (
                <div className="space-y-1">
                  <p className="typography-label">Region</p>
                  <Badge variant="outline">{data.vercel.region}</Badge>
                </div>
              )}
              <div className="space-y-1">
                <p className="typography-label">Build Time</p>
                <Badge variant="outline">
                  {formatDateTimeWithRelative(data.vercel.buildTime)}
                </Badge>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.vercel.url && (
                <div className="space-y-1">
                  <p className="typography-label">Deployment URL</p>
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
                  <p className="typography-label">Branch URL</p>
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
                  <p className="typography-label">Production URL</p>
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
                <p className="typography-label">Style</p>
                <Badge variant="outline">{data.shadcn.style}</Badge>
              </div>
              <div className="space-y-1">
                <p className="typography-label">Icon Library</p>
                <Badge variant="outline">{data.shadcn.iconLibrary}</Badge>
              </div>
              <div className="space-y-1">
                <p className="typography-label">Base Color</p>
                <Badge variant="outline">{data.shadcn.baseColor}</Badge>
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
        )}

        {/* Typography Section */}
        {showTypography && (
          <div className="border-t pt-8">
            <h2 className="mb-4">Typography</h2>

            {/* Font Families - Dynamic Columns */}
            <div className="mb-8 space-y-4">
              {/* Column Headers */}
              <div className="grid grid-cols-4 gap-4 border-b pb-2">
                <div>
                  <h2 className={`font-sans ${satoshi.variable}`}>Satoshi</h2>
                  <p className="text-sm text-muted-foreground">
                    Variable (300-900)
                  </p>
                </div>
                <div>
                  <h2 className={`font-serif ${sentient.variable}`}>
                    Sentient
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Variable (200-800)
                  </p>
                </div>
                <div>
                  <h2 className={`font-serif ${zodiak.variable}`}>Zodiak</h2>
                  <p className="text-sm text-muted-foreground">
                    Variable (100-900)
                  </p>
                </div>
                <div>
                  <h2 className={`font-mono ${geistMono.variable}`}>
                    Geist Mono
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Variable (100-900)
                  </p>
                </div>
              </div>

              {/* Weight Rows */}
              <div className="space-y-8">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                  <div key={weight} className="grid grid-cols-4 gap-4">
                    {/* Satoshi (300-900) */}
                    {weight >= 300 && weight <= 900 && (
                      <div className="min-h-14">
                        <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                          {weight}
                        </p>
                        <p
                          className={`text-base ${satoshi.variable}`}
                          style={{
                            fontFamily: "var(--font-satoshi)",
                            fontWeight: weight,
                            textWrap: "balance",
                            maxWidth: "66%",
                          }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </p>
                      </div>
                    )}
                    {weight < 300 && <div className="min-h-14" />}

                    {/* Sentient (200-800) */}
                    {weight >= 200 && weight <= 800 && (
                      <div className="min-h-14">
                        <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                          {weight}
                        </p>
                        <p
                          className={`text-base ${sentient.variable}`}
                          style={{
                            fontFamily: "var(--font-sentient)",
                            fontWeight: weight,
                            textWrap: "balance",
                            maxWidth: "66%",
                          }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </p>
                      </div>
                    )}
                    {(weight < 200 || weight > 800) && (
                      <div className="min-h-14" />
                    )}

                    {/* Zodiak (100-900) */}
                    <div className="min-h-14">
                      <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                        {weight}
                      </p>
                      <p
                        className={`text-base ${zodiak.variable}`}
                        style={{
                          fontFamily: "var(--font-zodiak)",
                          fontWeight: weight,
                          textWrap: "balance",
                          maxWidth: "66%",
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>

                    {/* Geist Mono (100-900) */}
                    <div className="min-h-14">
                      <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                        {weight}
                      </p>
                      <p
                        className={`text-base ${geistMono.variable}`}
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontWeight: weight,
                          textWrap: "balance",
                          maxWidth: "66%",
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                  </div>
                ))}

                {/* Italic row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="min-h-14">
                    <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                      400 – ITALIC
                    </p>
                    <p
                      className={`text-base italic ${satoshi.variable}`}
                      style={{
                        fontFamily: "var(--font-satoshi)",
                        fontWeight: 400,
                        textWrap: "balance",
                        maxWidth: "66%",
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                  <div className="min-h-14">
                    <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                      400 – ITALIC
                    </p>
                    <p
                      className={`text-base italic ${sentient.variable}`}
                      style={{
                        fontFamily: "var(--font-sentient)",
                        fontWeight: 400,
                        textWrap: "balance",
                        maxWidth: "66%",
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                  <div className="min-h-14">
                    <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                      400 – ITALIC
                    </p>
                    <p
                      className={`text-base italic ${zodiak.variable}`}
                      style={{
                        fontFamily: "var(--font-zodiak)",
                        fontWeight: 400,
                        textWrap: "balance",
                        maxWidth: "66%",
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                  <div className="min-h-14">
                    <p className="text-[0.6rem] text-muted-foreground mb-1 font-mono uppercase">
                      400 – ITALIC
                    </p>
                    <p
                      className={`text-base italic ${geistMono.variable}`}
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 400,
                        textWrap: "balance",
                        maxWidth: "66%",
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Variants */}
            <div className="mb-8">
              <h3 className="mb-4">Typography Variants</h3>
              <div className="grid grid-cols-3 gap-8 border-b pb-2 mb-4">
                <div>
                  <h4 className={`font-sans ${satoshi.variable}`}>
                    Satoshi (Sans)
                  </h4>
                </div>
                <div>
                  <h4 className={`font-serif ${sentient.variable}`}>
                    Sentient (Serif)
                  </h4>
                </div>
                <div>
                  <h4 className={`font-mono ${geistMono.variable}`}>
                    Geist Mono
                  </h4>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { class: "typography-h1", label: "h1. Heading" },
                  { class: "typography-h2", label: "h2. Heading" },
                  { class: "typography-h3", label: "h3. Heading" },
                  { class: "typography-h4", label: "h4. Heading" },
                  { class: "typography-h5", label: "h5. Heading" },
                  { class: "typography-h6", label: "h6. Heading" },
                  {
                    class: "typography-subtitle1",
                    label:
                      "subtitle1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur",
                  },
                  {
                    class: "typography-subtitle2",
                    label:
                      "subtitle2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur",
                  },
                  {
                    class: "typography-body1",
                    label:
                      "body1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.",
                  },
                  {
                    class: "typography-body2",
                    label:
                      "body2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.",
                  },
                  { class: "typography-button", label: "button text" },
                  { class: "typography-caption", label: "caption text" },
                  { class: "typography-overline", label: "overline text" },
                  { class: "typography-label", label: "label text" },
                ].map((variant) => (
                  <div key={variant.class} className="grid grid-cols-3 gap-8">
                    <div>
                      <code className="text-xs text-muted-foreground">
                        {variant.class}
                      </code>
                      <p
                        className={`${variant.class} mt-1 ${satoshi.variable}`}
                        style={{ fontFamily: "var(--font-satoshi)" }}
                      >
                        {variant.label}
                      </p>
                    </div>
                    <div>
                      <code className="text-xs text-muted-foreground">
                        {variant.class}
                      </code>
                      <p
                        className={`${variant.class} mt-1 ${sentient.variable}`}
                        style={{ fontFamily: "var(--font-sentient)" }}
                      >
                        {variant.label}
                      </p>
                    </div>
                    <div>
                      <code className="text-xs text-muted-foreground">
                        {variant.class}
                      </code>
                      <p
                        className={`${variant.class} mt-1 ${geistMono.variable}`}
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {variant.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Headings Examples */}
            <div className="mb-8">
              <h3 className="mb-4">Headings</h3>
              <div className="space-y-2 border rounded-lg p-6 bg-muted/30">
                <div>
                  <code className="text-xs text-muted-foreground">
                    {"<h1>"}
                  </code>
                  <h1 className="mt-1">Heading 1</h1>
                </div>
                <div>
                  <code className="text-xs text-muted-foreground">
                    {"<h2>"}
                  </code>
                  <h2 className="mt-1">Heading 2</h2>
                </div>
                <div>
                  <code className="text-xs text-muted-foreground">
                    {"<h3>"}
                  </code>
                  <h3 className="mt-1">Heading 3</h3>
                </div>
                <div>
                  <code className="text-xs text-muted-foreground">
                    {"<h4>"}
                  </code>
                  <h4 className="mt-1">Heading 4</h4>
                </div>
                <div>
                  <code className="text-xs text-muted-foreground">
                    {"<h5>"}
                  </code>
                  <h5 className="mt-1">Heading 5</h5>
                </div>
                <div>
                  <code className="text-xs text-muted-foreground">
                    {"<h6>"}
                  </code>
                  <h6 className="mt-1">Heading 6</h6>
                </div>
              </div>
            </div>

            {/* Type Sizes List */}
            <div className="mb-8">
              <h3 className="mb-4">Type Sizes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "text-xs",
                  "text-sm",
                  "text-base",
                  "text-lg",
                  "text-xl",
                  "text-2xl",
                  "text-3xl",
                  "text-4xl",
                ].map((size) => (
                  <div key={size} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{size}</p>
                    <p className={size}>Sample Text</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons — pill style; variants .plain, .icon, .uppercase + .icon */}
            <Button />
          </div>
        )}

        <LayoutWrappersReference />

        {/* Layout sample: content-text with Prism blog post */}
        <ContentBreakout className="mt-8">
          <div>
            <h2 className="mb-4">Layout sample — content-text</h2>
            <ContentText
              className={`space-y-4 font-serif ${sentient.variable}`}
            >
              <h3 className="typography-h3 font-sans">What is Prism?</h3>
              <p className="typography-body1 text-muted-foreground">
                Prism is a full-stack app framework that gets you from zero to a
                running Next.js app with a consistent stack: UI components,
                database access, logging, feature flags, and deployment wiring.
                It’s built for small teams and solo developers who want
                structure without heavy boilerplate.
              </p>
              <p className="typography-body1 text-muted-foreground">
                Out of the box you get a design system (Satoshi, Sentient,
                Zodiak), layout wrappers for content and graphics, and a system
                sheet for environment and dependency overview. The CLI can
                scaffold new apps and packages, and the generator keeps your
                config in sync across the monorepo.
              </p>
              <p className="typography-body1 text-muted-foreground">
                Feature flags, authentication, and cost tracking plug in via
                Prism packages so you can turn capabilities on when you need
                them. If you want a single stack that stays consistent as the
                product grows, Prism is built for that.
              </p>
            </ContentText>
          </div>
        </ContentBreakout>
      </div>
    </div>
  );
}

export default SystemSheetPage;
