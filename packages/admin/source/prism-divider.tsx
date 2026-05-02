"use client";

import {
  PrismCodeBlock,
  PrismDivider,
  PrismTypography,
  type PrismDividerLineWeight,
  type PrismDividerSpacing,
  type PrismDividerTone,
  type PrismIconProps,
  type PrismSize,
} from "@ui";
import { useMemo, useState } from "react";

type DividerOptionKey =
  | "lwHairline"
  | "lwThin"
  | "lwMedium"
  | "lwThick"
  | "toneDefault"
  | "toneMuted"
  | "tonePrimary"
  | "spNone"
  | "spCompact"
  | "spComfortable"
  | "emblemNone"
  | "emblemLetter"
  | "emblemIcon"
  | "roundedBar"
  | "gradientLine"
  | "surfaceCard";

const OPTION_PROP_LABEL: Record<DividerOptionKey, string> = {
  lwHairline: "hairline",
  lwThin: "thin",
  lwMedium: "medium",
  lwThick: "thick",
  toneDefault: "default",
  toneMuted: "muted",
  tonePrimary: "primary",
  spNone: "none",
  spCompact: "compact",
  spComfortable: "comfortable",
  emblemNone: "none",
  emblemLetter: "letter",
  emblemIcon: "icon",
  roundedBar: "roundedBar",
  gradientLine: "gradientLine",
  surfaceCard: "surfaceCard",
};

const EXCLUSIVE_GROUPS: DividerOptionKey[][] = [
  ["lwHairline", "lwThin", "lwMedium", "lwThick"],
  ["toneDefault", "toneMuted", "tonePrimary"],
  ["spNone", "spCompact", "spComfortable"],
  ["emblemNone", "emblemLetter", "emblemIcon"],
];

const CUSTOMIZER_COLUMNS: { heading: string; keys: DividerOptionKey[] }[] = [
  {
    heading: "Line weight",
    keys: ["lwHairline", "lwThin", "lwMedium", "lwThick"],
  },
  { heading: "Tone", keys: ["toneDefault", "toneMuted", "tonePrimary"] },
  { heading: "Spacing", keys: ["spNone", "spCompact", "spComfortable"] },
  { heading: "Emblem", keys: ["emblemNone", "emblemLetter", "emblemIcon"] },
  {
    heading: "Flags",
    keys: ["roundedBar", "gradientLine", "surfaceCard"],
  },
];

type DividerPreviewProps = {
  lineWeight: PrismDividerLineWeight;
  tone: PrismDividerTone;
  spacing: PrismDividerSpacing;
  roundedBar: boolean;
  lineClassName?: string;
  letter?: string;
  iconName?: string;
  iconSize?: PrismSize;
  iconWeight?: PrismIconProps["weight"];
  iconFill?: PrismIconProps["fill"];
  surfaceClassName?: string;
};

function selectedToDividerProps(
  selected: Set<DividerOptionKey>
): DividerPreviewProps {
  const lineWeight: PrismDividerLineWeight = selected.has("lwHairline")
    ? "hairline"
    : selected.has("lwMedium")
      ? "medium"
      : selected.has("lwThick")
        ? "thick"
        : "thin";
  const tone: PrismDividerTone = selected.has("toneMuted")
    ? "muted"
    : selected.has("tonePrimary")
      ? "primary"
      : "default";
  const spacing: PrismDividerSpacing = selected.has("spNone")
    ? "none"
    : selected.has("spCompact")
      ? "compact"
      : "comfortable";
  const roundedBar = selected.has("roundedBar");
  const gradientLine = selected.has("gradientLine");
  const lineClassName = gradientLine
    ? "!bg-transparent bg-gradient-to-r from-primary/25 via-primary to-primary/25"
    : undefined;
  const surfaceClassName = selected.has("surfaceCard") ? "bg-card" : undefined;

  const base: DividerPreviewProps = {
    lineWeight,
    tone,
    spacing,
    roundedBar,
    lineClassName,
    surfaceClassName,
  };

  if (selected.has("emblemLetter")) {
    return { ...base, letter: "P" };
  }
  if (selected.has("emblemIcon")) {
    return {
      ...base,
      iconName: "deployed_code",
      iconSize: "medium",
      iconWeight: "regular",
      iconFill: "off",
    };
  }
  return base;
}

function formatDividerSnippet(p: DividerPreviewProps): string {
  const parts: string[] = ["<PrismDivider"];
  parts.push(`  spacing="${p.spacing}"`);
  parts.push(`  lineWeight="${p.lineWeight}"`);
  parts.push(`  tone="${p.tone}"`);
  if (p.roundedBar) parts.push("  roundedBar");
  if (p.lineClassName) {
    parts.push(`  lineClassName={\`${p.lineClassName.replace(/`/g, "\\`")}\`}`);
  }
  if (p.letter) parts.push(`  letter="${p.letter.replace(/"/g, '\\"')}"`);
  if (p.iconName) {
    parts.push(`  iconName="${p.iconName.replace(/"/g, '\\"')}"`);
    if (p.iconSize) parts.push(`  iconSize="${p.iconSize}"`);
    if (p.iconWeight !== undefined) {
      parts.push(
        typeof p.iconWeight === "number"
          ? `  iconWeight={${p.iconWeight}}`
          : `  iconWeight="${p.iconWeight}"`
      );
    }
    if (p.iconFill) parts.push(`  iconFill="${p.iconFill}"`);
  }
  if (p.surfaceClassName)
    parts.push(`  surfaceClassName="${p.surfaceClassName}"`);
  parts.push("/>");
  return `${parts.join("\n")}\n`;
}

const DEFAULT_SELECTED = new Set<DividerOptionKey>([
  "lwThin",
  "toneDefault",
  "spComfortable",
  "emblemNone",
]);

/**
 * Live controls for {@link PrismDivider} — layout matches {@link ButtonCustomizerPlayground}.
 */
export function PrismDividerDemo(): React.JSX.Element {
  const [selected, setSelected] = useState<Set<DividerOptionKey>>(
    () => new Set(DEFAULT_SELECTED)
  );
  const [letter, setLetter] = useState("P");
  const [iconName, setIconName] = useState("deployed_code");
  const [iconSize, setIconSize] = useState<PrismSize>("medium");
  const [iconWeight, setIconWeight] =
    useState<NonNullable<PrismIconProps["weight"]>>("regular");
  const [iconFill, setIconFill] =
    useState<NonNullable<PrismIconProps["fill"]>>("off");

  const toggle = (key: DividerOptionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const exclusiveGroup = EXCLUSIVE_GROUPS.find((g) => g.includes(key));
      const isFlag =
        key === "roundedBar" || key === "gradientLine" || key === "surfaceCard";
      if (isFlag) {
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (exclusiveGroup) {
          for (const k of exclusiveGroup) next.delete(k);
        }
        next.add(key);
      }
      return next;
    });
  };

  const dividerProps = useMemo(() => {
    const base = selectedToDividerProps(selected);
    if (selected.has("emblemLetter")) {
      return { ...base, letter: letter.slice(0, 8) };
    }
    if (selected.has("emblemIcon")) {
      return {
        ...base,
        iconName,
        iconSize,
        iconWeight,
        iconFill,
      };
    }
    return { ...base, letter: undefined, iconName: undefined };
  }, [iconFill, iconName, iconSize, iconWeight, letter, selected]);

  const snippet = useMemo(
    () => formatDividerSnippet(dividerProps),
    [dividerProps]
  );

  return (
    <>
      <div className="mb-8">
        <h3 className="mb-2">Customize</h3>
        <PrismTypography
          role="body"
          size="medium"
          className="mb-4 text-muted-foreground"
        >
          Toggle options (same pattern as PrismButton). Preview updates below;
          copy JSX from the snippet block.
        </PrismTypography>
        <div className="space-y-6">
          <div>
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {CUSTOMIZER_COLUMNS.map(({ heading, keys }) => (
                <div key={heading} className="space-y-1">
                  <PrismTypography role="overline" size="small">
                    {heading}
                  </PrismTypography>
                  {keys.map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggle(key)}
                        className="rounded border-input"
                      />
                      <PrismTypography
                        role="label"
                        size="medium"
                        color={{ semanticText: "muted" }}
                        font="mono"
                      >
                        {OPTION_PROP_LABEL[key]}
                      </PrismTypography>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {selected.has("emblemLetter") ? (
              <div className="mb-4">
                <PrismTypography
                  role="overline"
                  size="small"
                  className="mb-1 block"
                >
                  letter
                </PrismTypography>
                <input
                  type="text"
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  maxLength={8}
                  className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : null}

            {selected.has("emblemIcon") ? (
              <div className="mb-4 space-y-3">
                <div>
                  <PrismTypography
                    role="overline"
                    size="small"
                    className="mb-1 block"
                  >
                    iconName
                  </PrismTypography>
                  <input
                    type="text"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <PrismTypography
                      role="overline"
                      size="small"
                      className="mb-1 block"
                    >
                      iconSize
                    </PrismTypography>
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={iconSize}
                      onChange={(e) => setIconSize(e.target.value as PrismSize)}
                    >
                      {(["small", "medium", "large"] as const).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <PrismTypography
                      role="overline"
                      size="small"
                      className="mb-1 block"
                    >
                      iconWeight
                    </PrismTypography>
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={String(iconWeight)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setIconWeight(
                          (Number.isNaN(Number(v))
                            ? v
                            : Number(v)) as NonNullable<
                            PrismIconProps["weight"]
                          >
                        );
                      }}
                    >
                      {(
                        ["light", "thin", "regular", "bold", "heavy"] as const
                      ).map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <PrismTypography
                      role="overline"
                      size="small"
                      className="mb-1 block"
                    >
                      iconFill
                    </PrismTypography>
                    <select
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={iconFill}
                      onChange={(e) =>
                        setIconFill(
                          e.target.value as NonNullable<PrismIconProps["fill"]>
                        )
                      }
                    >
                      <option value="off">off</option>
                      <option value="on">on</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            <PrismCodeBlock language="tsx">{snippet}</PrismCodeBlock>
          </div>
        </div>
      </div>

      <div className="pb-8">
        <PrismTypography
          role="label"
          size="small"
          as="code"
          className="mb-2 block"
        >
          Preview
        </PrismTypography>
        <div
          className={
            selected.has("surfaceCard")
              ? "rounded-xl border border-border bg-card p-8"
              : "rounded-xl border border-dashed border-border bg-background p-8"
          }
        >
          <PrismTypography
            role="body"
            size="medium"
            color={{ semanticText: "muted" }}
          >
            Content above
          </PrismTypography>
          <PrismDivider
            spacing={dividerProps.spacing}
            lineWeight={dividerProps.lineWeight}
            tone={dividerProps.tone}
            roundedBar={dividerProps.roundedBar}
            lineClassName={dividerProps.lineClassName}
            letter={dividerProps.letter}
            iconName={dividerProps.iconName}
            iconSize={dividerProps.iconSize}
            iconWeight={dividerProps.iconWeight}
            iconFill={dividerProps.iconFill}
            surfaceClassName={dividerProps.surfaceClassName}
          />
          <PrismTypography
            role="body"
            size="medium"
            color={{ semanticText: "muted" }}
          >
            Content below
          </PrismTypography>
        </div>
      </div>
    </>
  );
}
