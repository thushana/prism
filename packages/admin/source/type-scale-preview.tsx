"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  PrismButton,
  PrismCodeBlock,
  PrismColorPicker,
  PrismTypography,
  prismColorPickerClipboardColorProp,
} from "@ui";
import type {
  PartialPrismColorSpec,
  PrismTypographyAnimationKind,
  PrismTypographyAnimationZone,
  PrismTypographyRole,
  PrismTypographySize,
} from "@ui";
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

type TypographyOptionKey =
  | "styleThin"
  | "styleBold"
  | "styleBlack"
  | "styleItalic"
  | "styleCaseCaps"
  | "styleCaseTitle"
  | "styleCaseLower"
  | "toneForeground"
  | "toneMuted"
  | "toneMonochrome"
  | "gradientSideways"
  | "gradientUp"
  | "gradientAngle"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustified"
  | "wrapBalance"
  | "animationWhole"
  | "animationLine"
  | "animationWord"
  | "animationCharacter"
  | "animationFadeIn"
  | "animationMoveIn";

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
  "After a year of redesign work and 47 prototype rounds, the transit authority finally approved the wayfinding system that color-codes every station, platform, and transfer corridor across the network",
  "As rain moved offshore and sunlight returned in narrow bands, thousands gathered on the riverfront to watch a full double rainbow arc over the skyline while drone crews broadcast the event live",
  "Engineers say the latest rendering pipeline cuts first-paint time by 38% on mid-range devices, but caution that long-form typography still needs tuning to avoid awkward one-word final lines",
  "What started as a small neighborhood lighting test became a citywide rollout after residents reported fewer navigation errors, faster response times, and significantly better readability at night",
  "Curators reopened the gallery's longest corridor with suspended glass panels that refract daylight from noon to sunset, creating shifting color fields that change perception of scale and distance",
  "Despite budget pressure and shipping delays, the studio committed to preserving editorial typography standards, arguing that consistent rhythm and balanced wrapping materially improve comprehension",
  "In a rare joint statement, design and engineering leaders agreed to prioritize text quality metrics this quarter, including rag smoothness, balanced wraps, and reduction of high-variance line lengths",
  "The new content system now flags headlines likely to produce typographic widows, then suggests alternative phrasings that preserve meaning while producing stronger multiline composition",
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

const TYPOGRAPHY_OPTION_COLUMNS: {
  heading: string;
  keys: TypographyOptionKey[];
}[] = [
  {
    heading: "STYLE",
    keys: [
      "styleThin",
      "styleBold",
      "styleBlack",
      "styleItalic",
      "styleCaseCaps",
      "styleCaseTitle",
      "styleCaseLower",
    ],
  },
  {
    heading: "TONE / GRADIENT",
    keys: [
      "toneForeground",
      "toneMuted",
      "toneMonochrome",
      "gradientSideways",
      "gradientUp",
      "gradientAngle",
    ],
  },
  {
    heading: "ALIGN",
    keys: ["alignLeft", "alignCenter", "alignRight", "alignJustified"],
  },
  {
    heading: "WRAP",
    keys: ["wrapBalance"],
  },
  {
    heading: "ZONE",
    keys: [
      "animationWhole",
      "animationLine",
      "animationWord",
      "animationCharacter",
    ],
  },
  {
    heading: "TYPE",
    keys: ["animationFadeIn", "animationMoveIn"],
  },
];

const TYPOGRAPHY_OPTION_LABEL: Record<TypographyOptionKey, string> = {
  styleThin: ".styleThin",
  styleBold: ".styleBold",
  styleBlack: ".styleBlack",
  styleItalic: ".styleItalic",
  styleCaseCaps: ".styleCaseCaps",
  styleCaseTitle: ".styleCaseTitle",
  styleCaseLower: ".styleCaseLower",
  toneForeground: "foreground (text-foreground)",
  toneMuted: "muted (text-muted-foreground)",
  toneMonochrome: "monochrome (text-black / dark:text-white)",
  gradientSideways: "gradient →",
  gradientUp: "gradient ↑",
  gradientAngle: "gradient 45°",
  alignLeft: ".alignLeft",
  alignCenter: ".alignCenter",
  alignRight: ".alignRight",
  alignJustified: ".alignJustified",
  wrapBalance: ".wrapBalance",
  animationWhole: ".animationWhole",
  animationLine: ".animationLine",
  animationWord: ".animationWord",
  animationCharacter: ".animationCharacter",
  animationFadeIn: ".animationFadeIn",
  animationMoveIn: ".animationMoveIn",
};

const ANIMATION_ZONE_KEYS = [
  "animationWhole",
  "animationLine",
  "animationWord",
  "animationCharacter",
] as const satisfies readonly TypographyOptionKey[];

const ANIMATION_TYPE_KEYS = [
  "animationFadeIn",
  "animationMoveIn",
] as const satisfies readonly TypographyOptionKey[];

/** At most one flat text color; clears gradients when chosen. */
const TONE_FLAT_KEYS = [
  "toneForeground",
  "toneMuted",
  "toneMonochrome",
] as const satisfies readonly TypographyOptionKey[];

/** At most one gradient direction; clears flat colors when chosen. */
const GRADIENT_KEYS = [
  "gradientSideways",
  "gradientUp",
  "gradientAngle",
] as const satisfies readonly TypographyOptionKey[];

const ALIGN_KEYS = [
  "alignLeft",
  "alignCenter",
  "alignRight",
  "alignJustified",
] as const satisfies readonly TypographyOptionKey[];

const CASE_STYLE_KEYS = [
  "styleCaseCaps",
  "styleCaseTitle",
  "styleCaseLower",
] as const satisfies readonly TypographyOptionKey[];

const WEIGHT_STYLE_KEYS = [
  "styleThin",
  "styleBold",
  "styleBlack",
] as const satisfies readonly TypographyOptionKey[];

function typographyColorSnippetFromSpec(spec: PartialPrismColorSpec): string {
  const colorBlock = prismColorPickerClipboardColorProp(spec);
  return [
    "<PrismTypography",
    '  role="headline"',
    '  size="large"',
    ...colorBlock.split("\n").map((line) => `  ${line}`),
    ">",
    "  Headline preview with PrismColor",
    "</PrismTypography>",
    "",
  ].join("\n");
}

const GRADIENT_COLOR_PAIRS: ReadonlyArray<[string, string]> = [
  ["var(--color-indigo-500)", "var(--color-cyan-500)"],
  ["var(--color-purple-500)", "var(--color-pink-500)"],
  ["var(--color-blue-500)", "var(--color-teal-500)"],
  ["var(--color-deep-purple-500)", "var(--color-light-blue-500)"],
  ["var(--color-green-500)", "var(--color-lime-500)"],
  ["var(--color-amber-500)", "var(--color-deep-orange-500)"],
];

function getSampleLabel(
  item: { role: PrismTypographyRole; size: PrismTypographySize; label: string },
  headlineStartIndex: number,
  pools: SamplePools
): string {
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
  const [selectedOptions, setSelectedOptions] = useState<Set<TypographyOptionKey>>(
    new Set()
  );
  const [pickerColor, setPickerColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "indigo",
    shade: 500,
  });

  const typographyColorSnippet = useMemo(
    () => typographyColorSnippetFromSpec(pickerColor),
    [pickerColor],
  );

  const activeTypeface =
    typefaces.find((typeface) => typeface.id === selectedTypefaceId) ?? typefaces[0];
  const reshuffleSamples = () =>
    setHeadlineStartIndex((prev) => {
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * SAMPLE_INDEX_RANGE);
      }
      return next;
    });
  const toggleOption = (key: TypographyOptionKey) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (ANIMATION_ZONE_KEYS.includes(key as (typeof ANIMATION_ZONE_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of ANIMATION_ZONE_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (ANIMATION_TYPE_KEYS.includes(key as (typeof ANIMATION_TYPE_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of ANIMATION_TYPE_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (TONE_FLAT_KEYS.includes(key as (typeof TONE_FLAT_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of TONE_FLAT_KEYS) next.delete(k);
          for (const k of GRADIENT_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (GRADIENT_KEYS.includes(key as (typeof GRADIENT_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of GRADIENT_KEYS) next.delete(k);
          for (const k of TONE_FLAT_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (ALIGN_KEYS.includes(key as (typeof ALIGN_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of ALIGN_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (CASE_STYLE_KEYS.includes(key as (typeof CASE_STYLE_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of CASE_STYLE_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (WEIGHT_STYLE_KEYS.includes(key as (typeof WEIGHT_STYLE_KEYS)[number])) {
        if (next.has(key)) next.delete(key);
        else {
          for (const k of WEIGHT_STYLE_KEYS) next.delete(k);
          next.add(key);
        }
        return next;
      }
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const customFontWeight = selectedOptions.has("styleBlack")
    ? 900
    : selectedOptions.has("styleBold")
      ? 700
      : selectedOptions.has("styleThin")
        ? 200
      : undefined;
  const customFontStyle = selectedOptions.has("styleItalic") ? "italic" : undefined;
  const customTextTransform = selectedOptions.has("styleCaseCaps")
    ? "uppercase"
    : selectedOptions.has("styleCaseTitle")
      ? "capitalize"
    : selectedOptions.has("styleCaseLower")
      ? "lowercase"
      : undefined;
  const customTextAlign = selectedOptions.has("alignJustified")
    ? "justify"
    : selectedOptions.has("alignRight")
      ? "right"
      : selectedOptions.has("alignCenter")
        ? "center"
        : selectedOptions.has("alignLeft")
          ? "left"
          : undefined;
  const customTextWrap = selectedOptions.has("wrapBalance")
    ? ("balance" as const)
    : undefined;
  const hasGradientColor =
    selectedOptions.has("gradientSideways") ||
    selectedOptions.has("gradientUp") ||
    selectedOptions.has("gradientAngle");
  const customColorClass = hasGradientColor
    ? undefined
    : selectedOptions.has("toneMonochrome")
      ? "text-black dark:text-white"
      : selectedOptions.has("toneMuted")
        ? "text-muted-foreground"
        : selectedOptions.has("toneForeground")
          ? "text-foreground"
          : undefined;
  const customGradientDirection = selectedOptions.has("gradientAngle")
    ? "135deg"
    : selectedOptions.has("gradientUp")
      ? "to top"
      : selectedOptions.has("gradientSideways")
        ? "to right"
        : undefined;
  const [gradientStart, gradientEnd] =
    GRADIENT_COLOR_PAIRS[headlineStartIndex % GRADIENT_COLOR_PAIRS.length];
  const customColorStyle =
    customGradientDirection !== undefined
      ? {
          backgroundImage: `linear-gradient(${customGradientDirection}, ${gradientStart}, ${gradientEnd})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }
      : undefined;

  const previewTextStyle: CSSProperties = {
    fontFamily: activeTypeface.cssVariable,
    fontWeight: customFontWeight,
    fontStyle: customFontStyle,
    textTransform: customTextTransform,
    ...(customTextAlign !== undefined ? { textAlign: customTextAlign } : {}),
    ...(customTextWrap !== undefined
      ? { textWrap: customTextWrap as CSSProperties["textWrap"] }
      : {}),
    ...(customColorStyle ?? {}),
  };

  const animationWhole = selectedOptions.has("animationWhole");
  const animationLine = selectedOptions.has("animationLine");
  const animationWord = selectedOptions.has("animationWord");
  const animationCharacter = selectedOptions.has("animationCharacter");
  const animationFadeIn = selectedOptions.has("animationFadeIn");
  const animationMoveIn = selectedOptions.has("animationMoveIn");
  const animationZoneKey: PrismTypographyAnimationZone = animationCharacter
    ? "character"
    : animationWord
      ? "word"
      : animationLine
        ? "line"
        : animationWhole
          ? "whole"
          : "none";
  const animationTypeKey = animationMoveIn
    ? "moveIn"
    : animationFadeIn
      ? "fadeIn"
      : "default";
  const animationEnabled = animationZoneKey !== "none";
  const animationRemountKey = `${animationZoneKey}-${animationTypeKey}`;
  const typographyAnimationProps: {
    animationZone?: PrismTypographyAnimationZone;
    animationKind?: PrismTypographyAnimationKind;
  } =
    animationZoneKey === "none"
      ? {}
      : {
          animationZone: animationZoneKey,
          animationKind: animationMoveIn ? "moveIn" : "fadeIn",
        };
  /** Line/word/char splits need a string child; body samples otherwise use `<p>` and fall back to whole. */
  const needsPlainTextForAnimation =
    animationLine || animationWord || animationCharacter;

  return (
    <div className="typography-preview mb-8">
      <h3 className="mb-4">Type scale (role × size)</h3>
      <div className="mb-4 space-y-1 md:hidden">
        <PrismTypography
          role="overline"
          size="small"
          id="type-scale-typeface-label"
        >
          Typeface
        </PrismTypography>
        <div className="flex items-center gap-2">
          <select
            aria-labelledby="type-scale-typeface-label"
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedTypefaceId}
            onChange={(e) =>
              setSelectedTypefaceId(e.target.value as TypefaceOption["id"])
            }
          >
            {typefaces.map((typeface) => (
              <option key={typeface.id} value={typeface.id}>
                {typeface.label}
              </option>
            ))}
          </select>
          <PrismButton
            label="Change headlines"
            color="grey"
            paint="monochrome"
            variant="icon"
            icon={RefreshCw}
            iconOnly
            line="none"
            onClick={reshuffleSamples}
          />
        </div>
      </div>
      <div className="mb-4 hidden flex-wrap items-center gap-2 md:flex">
        {typefaces.map((typeface) => (
          <PrismButton
            key={typeface.id}
            label={typeface.label}
            color="grey"
            paint="monochrome"
            shape="rectangle"
            line="bottom"
            toggled={selectedTypefaceId === typeface.id}
            disableColorChange={selectedTypefaceId !== typeface.id}
            disableGrow={selectedTypefaceId !== typeface.id}
            onClick={() => setSelectedTypefaceId(typeface.id)}
          />
        ))}
        <PrismButton
          label="Change headlines"
          color="grey"
          paint="monochrome"
          variant="icon"
          icon={RefreshCw}
          iconOnly
          line="none"
          onClick={reshuffleSamples}
        />
      </div>
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {TYPOGRAPHY_OPTION_COLUMNS.map(({ heading, keys }) => (
          <div key={heading} className="space-y-1">
            <PrismTypography role="overline" size="small">
              {heading}
            </PrismTypography>
            {keys.map((key) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.has(key)}
                  onChange={() => toggleOption(key)}
                  className="rounded border-input"
                />
                <PrismTypography
                  role="label"
                  size="medium"
                  color={{ semanticText: "muted" }}
                  font="mono"
                >
                  {TYPOGRAPHY_OPTION_LABEL[key]}
                </PrismTypography>
              </label>
            ))}
          </div>
        ))}
      </div>

      <section className="mb-8 space-y-4 border-b border-border pb-8">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          PrismColor + typography
        </PrismTypography>
        <div className="max-w-xl space-y-2">
          <PrismTypography role="overline" size="small" className="block">
            Color
          </PrismTypography>
          <PrismColorPicker
            color={pickerColor}
            onColorChange={setPickerColor}
            showCopyButton={false}
          />
        </div>
        <div className="space-y-2">
          <PrismTypography role="overline" size="small" className="block">
            Example
          </PrismTypography>
          <PrismTypography
            role="headline"
            size="large"
            color={pickerColor}
            className={activeTypeface.className}
          >
            Headline preview with PrismColor
          </PrismTypography>
        </div>
        <div className="space-y-2">
          <PrismTypography role="overline" size="small" className="block">
            Code sample
          </PrismTypography>
          <PrismCodeBlock
            className="font-mono"
            mode="card"
            disableLineNumbers={false}
            disableLanguageLabel={false}
            color={{ swatchPrimary: "grey" }}
            language="tsx"
          >
            {typographyColorSnippet}
          </PrismCodeBlock>
        </div>
      </section>

      <div className="border-b pb-4">
        {typeScaleItemsByRole.map(({ role, items }, roleIndex) => (
          <div
            key={role}
            className={roleIndex === 0 ? "space-y-3" : "mt-8 space-y-3"}
          >
            {items.map((item) => (
              <div
                key={`${item.role}-${item.size}-${animationRemountKey}${
                  animationEnabled ? `-${headlineStartIndex}` : ""
                }`}
                className="space-y-1"
              >
                <code className="block text-xs text-muted-foreground">
                  {`typography-${item.role}-${item.size}`}
                </code>
                {item.role === "body" ? (
                  <PrismTypography
                    as="div"
                    role={item.role}
                    size={item.size}
                    {...typographyAnimationProps}
                    className={`block content-text mx-0 ${activeTypeface.className} ${customColorClass ?? ""}`}
                    style={previewTextStyle}
                  >
                    {/* Plain string (no <p> blocks): SplitText needs a single text host for line/word/char zones. */}
                    {needsPlainTextForAnimation ? (
                      getSampleLabel(item, headlineStartIndex, shuffledPools)
                    ) : (
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
                    )}
                  </PrismTypography>
                ) : (
                  <PrismTypography
                    role={item.role}
                    size={item.size}
                    {...typographyAnimationProps}
                    className={`block ${activeTypeface.className} ${customColorClass ?? ""}`}
                    style={previewTextStyle}
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
            paint="monochrome"
            variant="icon"
            icon={RefreshCw}
            shape="rectangle"
            line="bottom"
            onClick={reshuffleSamples}
          />
        </div>
      </div>
    </div>
  );
}
