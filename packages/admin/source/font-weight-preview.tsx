"use client";

import { useState, type JSX } from "react";
import { PrismTypography } from "@ui";

export type FontWeightPreviewProps = {
  satoshiVariableClass: string;
  sentientVariableClass: string;
  zodiakVariableClass: string;
  geistMonoVariableClass: string;
};

type FamilyConfig = {
  id: string;
  label: string;
  subtitle: string;
  variableClass: string;
  fontFamily: string;
  minWeight: number;
  maxWeight: number;
};

type SansFamilyId = "satoshi";
type SerifFamilyId = "sentient" | "zodiak";
type MonoFamilyId = "geistMono";

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const SELECT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function buildFamilies(props: FontWeightPreviewProps): Record<
  SansFamilyId | SerifFamilyId | MonoFamilyId,
  FamilyConfig
> {
  return {
    satoshi: {
      id: "satoshi",
      label: "Satoshi",
      subtitle: "Variable (300-900)",
      variableClass: props.satoshiVariableClass,
      fontFamily: "var(--font-satoshi)",
      minWeight: 300,
      maxWeight: 900,
    },
    sentient: {
      id: "sentient",
      label: "Sentient",
      subtitle: "Variable (200-800)",
      variableClass: props.sentientVariableClass,
      fontFamily: "var(--font-sentient)",
      minWeight: 200,
      maxWeight: 800,
    },
    zodiak: {
      id: "zodiak",
      label: "Zodiak",
      subtitle: "Variable (100-900)",
      variableClass: props.zodiakVariableClass,
      fontFamily: "var(--font-zodiak)",
      minWeight: 100,
      maxWeight: 900,
    },
    geistMono: {
      id: "geistMono",
      label: "Geist Mono",
      subtitle: "Variable (100-900)",
      variableClass: props.geistMonoVariableClass,
      fontFamily: "var(--font-geist-mono)",
      minWeight: 100,
      maxWeight: 900,
    },
  };
}

function WeightSample({
  weight,
  family,
}: {
  weight: number;
  family: FamilyConfig;
}) {
  const inRange = weight >= family.minWeight && weight <= family.maxWeight;
  if (!inRange) {
    return <div className="min-h-14" aria-hidden />;
  }
  return (
    <div className="min-h-14">
      <PrismTypography
        role="overline"
        size="small"
        font="mono"
        className="mb-1 text-muted-foreground"
      >
        {weight}
      </PrismTypography>
      <PrismTypography
        role="body"
        size="large"
        className={family.variableClass}
        style={{
          fontFamily: family.fontFamily,
          fontWeight: weight,
          textWrap: "balance",
          maxWidth: "min(100%, 42rem)",
        }}
      >
        The quick brown fox jumps over the lazy dog
      </PrismTypography>
    </div>
  );
}

function ItalicSample({ family }: { family: FamilyConfig }) {
  return (
    <div className="min-h-14">
      <PrismTypography
        role="overline"
        size="small"
        font="mono"
        className="mb-1 text-muted-foreground"
      >
        400 – ITALIC
      </PrismTypography>
      <PrismTypography
        role="body"
        size="large"
        className={`italic ${family.variableClass}`}
        style={{
          fontFamily: family.fontFamily,
          fontWeight: 400,
          textWrap: "balance",
          maxWidth: "min(100%, 42rem)",
        }}
      >
        The quick brown fox jumps over the lazy dog
      </PrismTypography>
    </div>
  );
}

function CategoryColumn({
  categoryTitle,
  headingClassName,
  typefaceLabelId,
  selectId,
  optionEntries,
  selectedId,
  onSelect,
  activeFamily,
}: {
  categoryTitle: string;
  headingClassName: string;
  typefaceLabelId: string;
  selectId: string;
  optionEntries: readonly { value: string; label: string }[];
  selectedId: string;
  onSelect: (value: string) => void;
  activeFamily: FamilyConfig;
}) {
  return (
    <div
      className="space-y-1 border-b border-border pb-8 last:border-b-0 last:pb-0 md:border-b-0 md:pb-0 md:[&:not(:first-child)]:pl-12 lg:[&:not(:first-child)]:pl-16"
    >
      <h2
        className={`text-lg font-semibold tracking-tight sm:text-xl ${headingClassName}`}
      >
        {categoryTitle}
      </h2>
      <PrismTypography
        role="overline"
        size="small"
        id={typefaceLabelId}
        className="pt-2"
      >
        Typeface
      </PrismTypography>
      <select
        id={selectId}
        aria-labelledby={typefaceLabelId}
        className={SELECT_CLASS}
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
      >
        {optionEntries.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <PrismTypography role="body" size="medium" className="text-muted-foreground">
        {activeFamily.subtitle}
      </PrismTypography>
      <div className="space-y-8 pt-6">
        {WEIGHTS.map((weight) => (
          <WeightSample key={weight} weight={weight} family={activeFamily} />
        ))}
        <ItalicSample family={activeFamily} />
      </div>
    </div>
  );
}

export function FontWeightPreview(props: FontWeightPreviewProps): JSX.Element {
  const families = buildFamilies(props);

  const [sansId, setSansId] = useState<SansFamilyId>("satoshi");
  const [serifId, setSerifId] = useState<SerifFamilyId>("sentient");
  const [monoId, setMonoId] = useState<MonoFamilyId>("geistMono");

  const sansOptions = [{ value: "satoshi" as const, label: "Satoshi" }];
  const serifOptions = [
    { value: "sentient" as const, label: "Sentient" },
    { value: "zodiak" as const, label: "Zodiak" },
  ];
  const monoOptions = [{ value: "geistMono" as const, label: "Geist Mono" }];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
        <CategoryColumn
          categoryTitle="Sans"
          headingClassName="font-sans"
          typefaceLabelId="font-weight-preview-sans-typeface"
          selectId="font-weight-preview-sans-select"
          optionEntries={sansOptions}
          selectedId={sansId}
          onSelect={(v) => setSansId(v as SansFamilyId)}
          activeFamily={families[sansId]}
        />
        <CategoryColumn
          categoryTitle="Serif"
          headingClassName="font-serif"
          typefaceLabelId="font-weight-preview-serif-typeface"
          selectId="font-weight-preview-serif-select"
          optionEntries={serifOptions}
          selectedId={serifId}
          onSelect={(v) => setSerifId(v as SerifFamilyId)}
          activeFamily={families[serifId]}
        />
        <CategoryColumn
          categoryTitle="Mono"
          headingClassName="font-mono"
          typefaceLabelId="font-weight-preview-mono-typeface"
          selectId="font-weight-preview-mono-select"
          optionEntries={monoOptions}
          selectedId={monoId}
          onSelect={(v) => setMonoId(v as MonoFamilyId)}
          activeFamily={families[monoId]}
        />
      </div>
    </div>
  );
}
