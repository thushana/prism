"use client";

import { useMemo, useState } from "react";
import { PrismButton, PrismTypography } from "@ui";
import type { PrismTypographyRole, PrismTypographySize } from "@ui";
import { RefreshCw } from "lucide-react";

interface TypefaceOption {
  id: "satoshi" | "sentient" | "zodiak" | "geistMono";
  label: string;
  className: string;
  cssVariable: string;
}

interface TypeScalePreviewProps {
  satoshiVariableClass: string;
  sentientVariableClass: string;
  zodiakVariableClass: string;
  geistMonoVariableClass: string;
}

const TYPE_SCALE_ITEMS: ReadonlyArray<{
  role: PrismTypographyRole;
  size: PrismTypographySize;
  label: string;
}> = [
  { role: "display", size: "large", label: "display · large" },
  { role: "display", size: "medium", label: "display · medium" },
  { role: "display", size: "small", label: "display · small" },
  { role: "headline", size: "large", label: "headline · large" },
  { role: "headline", size: "medium", label: "headline · medium" },
  { role: "headline", size: "small", label: "headline · small" },
  { role: "title", size: "large", label: "title · large" },
  { role: "title", size: "medium", label: "title · medium" },
  { role: "title", size: "small", label: "title · small" },
  { role: "body", size: "large", label: "body · large" },
  { role: "body", size: "medium", label: "body · medium" },
  { role: "body", size: "small", label: "body · small" },
  { role: "label", size: "large", label: "label · large" },
  { role: "label", size: "medium", label: "label · medium" },
  { role: "label", size: "small", label: "label · small" },
  { role: "overline", size: "large", label: "overline · large" },
  { role: "overline", size: "medium", label: "overline · medium" },
  { role: "overline", size: "small", label: "overline · small" },
];

const TYPE_SCALE_ROLES: ReadonlyArray<PrismTypographyRole> = [
  "display",
  "headline",
  "title",
  "body",
  "label",
  "overline",
];

const HEADLINE_POOL: ReadonlyArray<string> = [
  "Prism exhibit opens to record crowds",
  "Spectrum pass drops to $3 this weekend",
  'After 18 months, the "Light Garden" installation returns downtown',
  "Color markets close higher after design week",
  "Studios raise $240M for optics & UI tooling",
  'At 9 p.m., "Rainbow City" premieres in 42 countries',
  "Stormlight warning issued along the coast",
  "Budget 2027 adds $4.2B for public lighting",
  "Train #204 delayed 18 minutes near Prism Station",
  "Festival of Light draws 50,000 visitors!",
  "Engineers ship Spectrum v2.1.0 and cut load time by 37%",
  '"We are ready," says curator as the color district reopens',
  "Court blocks merger of two major display labs",
  "Airport adds 12 color-coded wayfinding zones",
  "A 6.1 quake rattles the coast as neon signs flicker",
  "Home interiors shift toward warm-spectrum palettes",
  "Retail color sales rise 4% before back-to-school",
  'NASA confirms "Prism III" optics window for late 2028',
  "Team wins international light-design title",
  "Studio bulbs fall below $3.00 in 9 states",
  "After years of delay, the prism bridge opens with 2 lit lanes",
  "Banks tighten lending as creative tech costs climb",
  "CEO says color systems revenue beat forecasts by $180M",
  '"No quick fix," analysts warn, as supply chains strain for rare glass',
];

const TITLE_POOL: ReadonlyArray<string> = [
  "Prism",
  "Rainbow",
  "Spectrum",
  "Prism Overview",
  "Spectrum Status",
  "Color Insights",
  "Luminance Telemetry",
  "Hue Roadmap",
  "Now Refracting",
  "Contrast Risks",
  "Chroma Alerts",
  "Optics Health",
  "Light Activity",
  "Refraction Notes",
  "Design Tokens",
  "Palette Summary",
  "Gradient Flags",
  "Signal Timeline",
  "Tone Snapshot",
  "Quality Checks",
  "Color Error Sources",
  "Live Spectrum Status",
  "Response Tone Trends",
  "Daily Hue Breakdown",
  "Current Tint History",
  "Visual System Metrics",
  "Contrast Compliance Checks",
];

const LABEL_POOL: ReadonlyArray<string> = [
  "Spectrum panel 01",
  "Prism panel 02",
  "Color token A",
  "Color token B",
  "Light source input",
  "Refraction output path",
  "Primary hue sample",
  "Secondary hue sample",
  "Contrast check zone",
  "Children run to catch a rainbow far off in the distance, hoping for a pot of gold.",
  "Late sunlight spills through the studio window, washing the wall in soft color bands.",
  "A prism on the table throws violet and amber streaks across an open notebook.",
  "Two friends point at a faint spectrum reflected in the fountain mist at dusk.",
  "Museum visitors pause beneath stained glass as shifting color pools across the floor.",
  "Morning fog lifts and a pale rainbow appears above the river bridge.",
  "Photographers wait for the exact moment the sky turns cobalt and rose.",
  "A child holds a crystal up to the light and laughs at the moving colors.",
  "Rain clears over the city and sunlight catches every window in gold.",
];

const OVERLINE_POOL: ReadonlyArray<string> = [
  "Refraction",
  "Spectrum",
  "Palette",
  "Chroma",
  "Luminance",
  "Gradient",
  "Tokens",
  "Optics",
  "Colorway",
  "Light Study",
  "Color Pass",
  "Prism Output",
  "Hue Check",
  "Tone Shift",
  "Contrast Read",
  "Palette Audit",
  "Type Tooling",
  "Visual Signal",
  "Prism Light Study",
  "Color System Check",
  "Spectrum Balance Pass",
  "Refraction Angle Note",
  "Token Contrast Review",
  "Gradient Output Preview",
  "Luminance Range Audit",
  "Hue Temperature Shift",
  "Visual Hierarchy Signal",
];

const BODY_POOL: ReadonlyArray<string> = [
  "Morning light near a window can begin almost blue, then drift toward pale gold by late afternoon as shadows stretch across the same wall. None of those shifts are abrupt, yet each one changes the emotional reading of the room in measurable ways.\n\nEditorial interfaces can borrow this pattern by keeping foundational surfaces calm and introducing warmth where narrative importance increases. Readers feel guided rather than pushed, which is exactly what good long-form design should accomplish.",
  "Reporters often say that context is what turns facts into understanding, and color systems behave no differently. A vivid accent by itself is simply vivid; beside quieter tones it becomes direction, status, or urgency.\n\nThat relationship-driven approach helps teams avoid over-styling dense screens. The visual language remains expressive enough for headlines and alerts while still protecting body copy as the main actor in the reading flow.",
  "Names like ember, slate, frost, and dusk are more than poetic labels for tokens; they carry shared expectations about temperature, brightness, and emotional register. Designers move faster when language matches perception, because fewer meetings are spent translating abstract color values into intent.\n\nIn practical terms, this means fewer accidental mismatches between writing tone and visual tone. A calm article layout should not feel like a warning panel, and a critical alert should not look like a neutral annotation.",
  "Some palettes are built to hold attention for thirty seconds, others for thirty minutes, and the distinction matters most in body typography. News-style reading surfaces need long stretches of low-friction contrast so paragraphs remain comfortable over time.\n\nStrong systems reserve hard edges and saturated hues for moments that truly deserve interruption. When emphasis is scarce and consistent, users trust it immediately.",
  "A prism on a desk can make ordinary text look cinematic without touching the words themselves; the content remains the same, but perception changes with angle and light. That effect mirrors what typographic hierarchy does in product writing.\n\nWhen headline, title, and body roles are tuned correctly, readers move through information with less effort. The page feels edited, not merely assembled.",
  "On rainy evenings, city colors flatten into a narrow range while a handful of signs still cut sharply through the haze. That contrast between broad quiet and selective intensity is a useful model for interface composition.\n\nMuted backgrounds reduce decision fatigue, and focused accents improve wayfinding. The combination makes complex content feel readable instead of crowded.",
  "Neutrals are frequently described as blank space, but in practice they carry a surprising amount of narrative weight. A warm grey can make a page feel editorial and human, while a cool grey at the same value can feel procedural and analytical. Readers rarely describe that difference directly, yet they respond to it almost immediately in how quickly they settle into long paragraphs.\n\nThis is why foundation tokens deserve as much care as accents. If base tones drift from section to section, emphasis starts to feel inconsistent and users must relearn hierarchy each time they scroll.\n\nStable neutrals make stronger signals more trustworthy. When the background language is coherent, every highlight, badge, and heading carries clearer intent.",
  "Refraction offers a practical model for information hierarchy because it makes structure visible without adding clutter. A single beam enters the prism, bends through consistent rules, and exits as an ordered spread rather than random noise. The beauty is not in excess detail but in disciplined transformation.\n\nGood article layouts follow the same logic. Body text provides continuity, titles frame local sections, and display styles create moments of emphasis that reset attention.\n\nWhen this order is explicit, readers retain more because they spend less effort navigating. The interface disappears just enough for the content to lead.",
  "Primary hues are powerful but incomplete on their own, much like headlines without supporting paragraphs. Real flexibility comes from transitions: tints for quiet surfaces, midtones for structure, and darker values for anchors. The system becomes expressive not because it is louder, but because it can speak at multiple volumes.\n\nThis layered range is essential in mixed-density screens where a short status row might sit beside a long narrative block. One palette must support both quick scanning and sustained reading without visual conflict.\n\nTeams that invest in these in-between tones usually ship faster later. Fewer one-off overrides are needed because the core system already covers real-world edge cases.",
  "An accent color is a promise that something important is happening now. If that promise appears everywhere, it stops meaning anything and quickly turns into background decoration. Scarcity is what gives emphasis its authority in both color and typography.\n\nThe same principle applies to scale. When every label tries to behave like a headline, readers lose rhythm and comprehension drops.\n\nSystems perform best when intensity is reserved for specific, repeatable moments. That discipline keeps interfaces readable as content volume grows.",
  "Palettes rooted in familiar materials often feel timeless because they anchor abstraction in memory. Sea blues, clay reds, pine greens, and dusk violets suggest place before they suggest brand. That sense of place gives digital surfaces texture even when the layout remains minimal.\n\nGrounded references also help cross-functional teams discuss tone with less ambiguity. Writers, designers, and product leads can align on mood using shared language, not just numeric values.\n\nOver time, this cohesion makes a product feel intentional rather than assembled. The visual identity remains steady even as features evolve.",
  "A prism demonstrates a useful truth for systems work: simple constraints can produce surprisingly rich outcomes. One source of light, one geometry, and many coherent results. The process is repeatable, which is what makes it dependable.\n\nDesign systems gain the same advantage when they favor clear rules over ad hoc styling. Components become easier to compose, and updates propagate with fewer regressions.\n\nConsistency does not limit creativity; it protects it. Teams can explore new expressions knowing the underlying structure will hold.",
];

function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(items: ReadonlyArray<T>, seed = 1): T[] {
  const rand = createSeededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type SamplePools = {
  headlines: ReadonlyArray<string>;
  titles: ReadonlyArray<string>;
  labels: ReadonlyArray<string>;
  overlines: ReadonlyArray<string>;
  body: ReadonlyArray<string>;
};

const DEFAULT_SAMPLE_POOLS: SamplePools = {
  headlines: shuffleArray(HEADLINE_POOL, 101),
  titles: shuffleArray(TITLE_POOL, 202),
  labels: shuffleArray(LABEL_POOL, 303),
  overlines: shuffleArray(OVERLINE_POOL, 404),
  body: shuffleArray(BODY_POOL, 505),
};

const SAMPLE_INDEX_RANGE = Math.max(
  HEADLINE_POOL.length,
  TITLE_POOL.length,
  LABEL_POOL.length,
  OVERLINE_POOL.length,
  BODY_POOL.length
);

function getSampleLabel(
  item: { role: PrismTypographyRole; size: PrismTypographySize; label: string },
  headlineStartIndex: number,
  pools: SamplePools
): string {
  if (
    item.role !== "display" &&
    item.role !== "headline" &&
    item.role !== "title" &&
    item.role !== "body" &&
    item.role !== "label" &&
    item.role !== "overline"
  ) {
    return item.label;
  }

  const headlineSlotIndex =
    item.role === "display"
      ? item.size === "large"
        ? 0
        : item.size === "medium"
          ? 1
          : 2
      : item.size === "large"
        ? 3
        : item.size === "medium"
          ? 4
          : 5;

  if (item.role === "display" || item.role === "headline") {
    return pools.headlines[
      (headlineStartIndex + headlineSlotIndex) % pools.headlines.length
    ];
  }

  const triadSlotIndex =
    item.size === "large" ? 0 : item.size === "medium" ? 1 : 2;

  if (item.role === "title") {
    return pools.titles[(headlineStartIndex + triadSlotIndex) % pools.titles.length];
  }

  if (item.role === "label") {
    return pools.labels[(headlineStartIndex + triadSlotIndex) % pools.labels.length];
  }

  if (item.role === "overline") {
    return pools.overlines[
      (headlineStartIndex + triadSlotIndex) % pools.overlines.length
    ];
  }

  return pools.body[(headlineStartIndex + triadSlotIndex) % pools.body.length];
}

export function TypeScalePreview({
  satoshiVariableClass,
  sentientVariableClass,
  zodiakVariableClass,
  geistMonoVariableClass,
}: TypeScalePreviewProps): React.JSX.Element {
  const typefaces = useMemo<TypefaceOption[]>(
    () => [
      {
        id: "satoshi",
        label: "Satoshi (Sans)",
        className: satoshiVariableClass,
        cssVariable: "var(--font-satoshi)",
      },
      {
        id: "sentient",
        label: "Sentient (Serif)",
        className: sentientVariableClass,
        cssVariable: "var(--font-sentient)",
      },
      {
        id: "zodiak",
        label: "Zodiak (Serif Display)",
        className: zodiakVariableClass,
        cssVariable: "var(--font-zodiak)",
      },
      {
        id: "geistMono",
        label: "Geist Mono",
        className: geistMonoVariableClass,
        cssVariable: "var(--font-geist-mono)",
      },
    ],
    [
      satoshiVariableClass,
      sentientVariableClass,
      zodiakVariableClass,
      geistMonoVariableClass,
    ]
  );
  const typeScaleItemsByRole = useMemo(
    () =>
      TYPE_SCALE_ROLES.map((role) => ({
        role,
        items: TYPE_SCALE_ITEMS.filter((item) => item.role === role),
      })),
    []
  );
  const [shuffledPools] = useState<SamplePools>(DEFAULT_SAMPLE_POOLS);

  const [selectedTypefaceId, setSelectedTypefaceId] =
    useState<TypefaceOption["id"]>("satoshi");
  const [headlineStartIndex, setHeadlineStartIndex] = useState(0);

  const activeTypefaceId = selectedTypefaceId;
  const activeTypeface =
    typefaces.find((typeface) => typeface.id === activeTypefaceId) ?? typefaces[0];
  const reshuffleSamples = () =>
    setHeadlineStartIndex((prev) => {
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * SAMPLE_INDEX_RANGE);
      }
      return next;
    });

  return (
    <div className="mb-8">
      <h3 className="mb-4">Type scale (role × size)</h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {typefaces.map((typeface) => (
          <PrismButton
            key={typeface.id}
            label={typeface.label}
            color="grey"
            colorVariant="monochrome"
            shapeRectangle
            shapeLineBottom
            stateToggled={activeTypefaceId === typeface.id}
            animationNoColorChange={activeTypefaceId !== typeface.id}
            animationNoGrow={activeTypefaceId !== typeface.id}
            onClick={() => setSelectedTypefaceId(typeface.id)}
          />
        ))}
        <PrismButton
          label="Change headlines"
          color="grey"
          colorVariant="monochrome"
          variant="icon"
          icon={RefreshCw}
          iconOnly
          shapeLineNo
          onClick={reshuffleSamples}
        />
      </div>
      <div className="border-b pb-4">
        {typeScaleItemsByRole.map(({ role, items }, roleIndex) => (
          <div
            key={role}
            className={roleIndex === 0 ? "space-y-3" : "mt-8 space-y-3"}
          >
            {items.map((item) => (
              <div key={`${item.role}-${item.size}`}>
                <code className="text-xs text-muted-foreground">
                  {`typography-${item.role}-${item.size}`}
                </code>
                {item.role === "body" ? (
                  <PrismTypography
                    as="div"
                    role={item.role}
                    size={item.size}
                    className={`mt-1 block content-text mx-0 text-left ${activeTypeface.className}`}
                    style={{ fontFamily: activeTypeface.cssVariable }}
                  >
                    <div
                      className={
                        item.size === "large"
                          ? "space-y-8"
                          : item.size === "medium"
                            ? "space-y-4"
                            : "space-y-3"
                      }
                    >
                      {getSampleLabel(item, headlineStartIndex, shuffledPools)
                        .split("\n\n")
                        .map((paragraph, index) => (
                          <p key={`${item.role}-${item.size}-paragraph-${index}`}>
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  </PrismTypography>
                ) : (
                <PrismTypography
                  role={item.role}
                  size={item.size}
                  className={`mt-1 block ${activeTypeface.className}`}
                  style={{ fontFamily: activeTypeface.cssVariable }}
                >
                  {getSampleLabel(item, headlineStartIndex, shuffledPools)}
                </PrismTypography>
                )}
              </div>
            ))}
          </div>
        ))}
        <div className="mt-4 flex justify-start">
          <PrismButton
            label="Reshuffle samples"
            color="grey"
            colorVariant="monochrome"
            variant="icon"
            icon={RefreshCw}
            shapeRectangle
            shapeLineBottom
            onClick={reshuffleSamples}
          />
        </div>
      </div>
    </div>
  );
}
