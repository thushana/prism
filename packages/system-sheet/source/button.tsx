"use client";

import { PrismButton } from "@ui";
import type { ColorName, PrismButtonSize } from "@ui";
import {
  Calendar,
  Copy,
  Download,
  Filter,
  Link,
  Lock,
  Mail,
  Map,
  MapPin,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

const ACTION_BUTTONS: { color: ColorName; label: string; icon: LucideIcon }[] =
  [
    { color: "red", label: "Download", icon: Download },
    { color: "pink", label: "Email", icon: Mail },
    { color: "purple", label: "Route", icon: MapPin },
    { color: "deepPurple", label: "Share", icon: Share2 },
    { color: "indigo", label: "Save", icon: Save },
    { color: "blue", label: "Add", icon: Plus },
    { color: "lightBlue", label: "Edit", icon: Pencil },
    { color: "cyan", label: "Delete", icon: Trash2 },
    { color: "teal", label: "Send", icon: Send },
    { color: "green", label: "Copy", icon: Copy },
    { color: "lightGreen", label: "Link", icon: Link },
    { color: "lime", label: "Play", icon: Play },
    { color: "yellow", label: "Pause", icon: Pause },
    { color: "amber", label: "Search", icon: Search },
    { color: "orange", label: "Filter", icon: Filter },
    { color: "deepOrange", label: "Calendar", icon: Calendar },
    { color: "brown", label: "Map", icon: Map },
    { color: "grey", label: "Lock", icon: Lock },
    { color: "blueGrey", label: "Star", icon: Star },
  ];

type AppearanceKey =
  | "icon"
  | "iconOnly"
  | "iconLeft"
  | "iconRight"
  | "uppercase"
  | "shapeRectangle"
  | "shapeRectangleRounded"
  | "shapeRounded"
  | "shapeLineBorder"
  | "shapeLineNo"
  | "shapeLineBottom"
  | "colorBackground"
  | "colorBackgroundLight"
  | "colorBackgroundDark"
  | "colorBackgroundSolid"
  | "colorBackgroundNo"
  | "colorMonochrome"
  | "colorGradientSideways"
  | "colorGradientUp"
  | "colorGradientAngle"
  | "tight"
  | "gapNo"
  | "small"
  | "normal"
  | "large"
  | "large2x"
  | "fontSans"
  | "fontSerif"
  | "fontMono"
  | "animationNo"
  | "animationNoGrow"
  | "animationNoColorChange"
  | "animationIcons"
  | "animationIconsNo"
  | "stateInverted"
  | "stateDisabled"
  | "stateToggled";

const APPEARANCE_OPTIONS: { key: AppearanceKey; label: string }[] = [
  { key: "icon", label: ".icon" },
  { key: "iconOnly", label: ".icon-only" },
  { key: "iconLeft", label: ".icon-left" },
  { key: "iconRight", label: ".icon-right" },
  { key: "uppercase", label: ".uppercase" },
  { key: "shapeRectangle", label: ".shape-rectangle" },
  { key: "shapeRectangleRounded", label: ".shape-rectangle-rounded" },
  { key: "shapeRounded", label: ".shape-rounded" },
  { key: "shapeLineBorder", label: ".shape-line-border" },
  { key: "shapeLineNo", label: ".shape-line-no" },
  { key: "shapeLineBottom", label: ".shape-line-bottom" },
  { key: "colorBackground", label: ".color-background" },
  { key: "colorBackgroundLight", label: ".color-background-light" },
  { key: "colorBackgroundDark", label: ".color-background-dark" },
  { key: "colorBackgroundSolid", label: ".color-background-solid" },
  { key: "colorBackgroundNo", label: ".color-background-no" },
  { key: "colorMonochrome", label: ".color-monochrome" },
  { key: "colorGradientSideways", label: ".color-gradient-sideways" },
  { key: "colorGradientUp", label: ".color-gradient-up" },
  { key: "colorGradientAngle", label: ".color-gradient-angle" },
  { key: "tight", label: ".tight" },
  { key: "gapNo", label: ".gap-no" },
  { key: "small", label: ".small" },
  { key: "normal", label: ".normal" },
  { key: "large", label: ".large" },
  { key: "large2x", label: ".large2x" },
  { key: "fontSans", label: ".font-sans" },
  { key: "fontSerif", label: ".font-serif" },
  { key: "fontMono", label: ".font-mono" },
  { key: "animationNo", label: ".animation-no" },
  { key: "animationNoGrow", label: ".animation-no-grow" },
  { key: "animationNoColorChange", label: ".animation-no-color-change" },
  { key: "animationIcons", label: ".animation-icons" },
  { key: "animationIconsNo", label: ".animation-icons-no" },
  { key: "stateInverted", label: ".state-inverted" },
  { key: "stateDisabled", label: ".state-disabled" },
  { key: "stateToggled", label: ".state-toggled" },
];

const CUSTOMIZER_COLUMNS: { heading: string; keys: AppearanceKey[] }[] = [
  { heading: "Icon", keys: ["icon", "iconOnly", "iconLeft", "iconRight"] },
  { heading: "Type", keys: ["uppercase", "fontSans", "fontSerif", "fontMono"] },
  {
    heading: "Shape",
    keys: [
      "shapeRectangle",
      "shapeRectangleRounded",
      "shapeRounded",
      "shapeLineBorder",
      "shapeLineNo",
      "shapeLineBottom",
    ],
  },
  {
    heading: "Coloring",
    keys: [
      "colorBackground",
      "colorBackgroundLight",
      "colorBackgroundDark",
      "colorBackgroundSolid",
      "colorBackgroundNo",
      "colorMonochrome",
      "colorGradientSideways",
      "colorGradientUp",
      "colorGradientAngle",
    ],
  },
  {
    heading: "Size",
    keys: ["tight", "gapNo", "small", "normal", "large", "large2x"],
  },
  {
    heading: "Animation",
    keys: [
      "animationNo",
      "animationNoGrow",
      "animationNoColorChange",
      "animationIcons",
      "animationIconsNo",
    ],
  },
  {
    heading: "States",
    keys: ["stateInverted", "stateDisabled", "stateToggled"],
  },
];

const OPTION_LABEL = Object.fromEntries(
  APPEARANCE_OPTIONS.map((o) => [o.key, o.label])
);

function Row({
  title,
  children,
  noGap,
}: {
  title: string;
  children: React.ReactNode;
  noGap?: boolean;
}) {
  return (
    <div className="pb-12">
      <code className="typography-caption mb-2 block">{title}</code>
      <div
        className={`flex flex-wrap items-center ${noGap ? "gap-0" : "gap-3"}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Button() {
  const [selected, setSelected] = useState<Set<AppearanceKey>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);

  const replayAnimations = () => setAnimationKey((k) => k + 1);

  const toggle = (key: AppearanceKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const customProps = useMemo(() => {
    const size: PrismButtonSize | undefined = selected.has("large2x")
      ? "large2x"
      : selected.has("large")
        ? "large"
        : selected.has("normal")
          ? "normal"
          : selected.has("small")
            ? "small"
            : undefined;
    const needsIcon =
      selected.has("icon") ||
      selected.has("iconOnly") ||
      selected.has("iconLeft") ||
      selected.has("iconRight");
    const font: "sans" | "serif" | "mono" | undefined = selected.has("fontMono")
      ? "mono"
      : selected.has("fontSerif")
        ? "serif"
        : selected.has("fontSans")
          ? "sans"
          : undefined;
    const lineVariant = selected.has("shapeLineNo")
      ? "no"
      : selected.has("shapeLineBottom")
        ? "bottom"
        : "border";
    const iconPosition: "left" | "right" = selected.has("iconRight")
      ? "right"
      : "left";
    return {
      variant: needsIcon ? ("icon" as const) : ("plain" as const),
      iconOnly: selected.has("iconOnly") || undefined,
      iconPosition,
      uppercase: selected.has("uppercase") || undefined,
      rectangle: selected.has("shapeRectangle") || undefined,
      rectangleRounded: selected.has("shapeRectangleRounded") || undefined,
      line: lineVariant === "bottom" || undefined,
      lineNo: lineVariant === "no" || undefined,
      colorVariant: (selected.has("colorGradientAngle")
        ? "gradient-angle"
        : selected.has("colorGradientUp")
          ? "gradient-up"
          : selected.has("colorGradientSideways")
            ? "gradient-sideways"
            : selected.has("colorMonochrome")
              ? "monochrome"
              : selected.has("colorBackgroundNo")
                ? "background-no"
                : selected.has("colorBackgroundDark")
                  ? "background-dark"
                  : selected.has("colorBackgroundLight")
                    ? "background-light"
                    : selected.has("colorBackgroundSolid")
                      ? "background-solid"
                      : selected.has("colorBackground")
                        ? "background"
                        : undefined) as
        | "background"
        | "background-light"
        | "background-dark"
        | "background-solid"
        | "background-no"
        | "monochrome"
        | "gradient-sideways"
        | "gradient-up"
        | "gradient-angle"
        | undefined,
      tight: selected.has("tight") || undefined,
      gapNo: selected.has("gapNo") || undefined,
      size,
      font,
      animationNo: selected.has("animationNo") || undefined,
      animationNoGrow: selected.has("animationNoGrow") || undefined,
      animationNoColorChange:
        selected.has("animationNoColorChange") || undefined,
      animationIconsNo: selected.has("animationIconsNo") || undefined,
      inverted: selected.has("stateInverted") || undefined,
      disabled: selected.has("stateDisabled") || undefined,
      toggled: selected.has("stateToggled") || undefined,
    };
  }, [selected]);

  return (
    <div className="mb-8">
      <h3 className="mb-2">Buttons</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Toggle options to view appearances in the buttons below.{" "}
        <button
          type="button"
          onClick={replayAnimations}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline font-medium"
        >
          Replay animations
        </button>
        {" · "}
        <a
          href="../sheets/buttons"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          View all variants here.
        </a>
      </p>
      <div className="space-y-6">
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
            {CUSTOMIZER_COLUMNS.map(({ heading, keys }) => (
              <div key={heading} className="space-y-1">
                <p className="typography-label">{heading}</p>
                {keys.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggle(key)}
                      className="rounded border-input"
                    />
                    <span className="text-sm font-mono">
                      {OPTION_LABEL[key]}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div
            className={`flex flex-wrap items-center ${selected.has("gapNo") ? "gap-0" : "gap-3"}`}
          >
            {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
              <PrismButton
                key={`${color}-${animationKey}`}
                color={color}
                label={label}
                icon={icon}
                asSpan
                {...customProps}
                segmentPosition={
                  selected.has("gapNo")
                    ? i === 0
                      ? "first"
                      : i === ACTION_BUTTONS.length - 1
                        ? "last"
                        : "middle"
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** List of all PrismButton variant rows for use on /admin/sheets/buttons */
export function ButtonVariantsList({
  className,
}: {
  className?: string;
} = {}) {
  return (
    <div className={className ?? "space-y-6"}>
      <Row title=".plain">
        {ACTION_BUTTONS.map(({ color, label }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="plain"
            asSpan
          />
        ))}
      </Row>
      <Row title=".icon (add icon to plain)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            asSpan
          />
        ))}
      </Row>
      <Row title=".icon-only (no text, alt/hover)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            iconOnly
            asSpan
          />
        ))}
      </Row>
      <Row title=".icon-right">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            iconPosition="right"
            asSpan
          />
        ))}
      </Row>
      <Row title=".uppercase">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            uppercase
            asSpan
          />
        ))}
      </Row>
      <Row title=".shape-rectangle (90° corners)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            rectangle
            asSpan
          />
        ))}
      </Row>
      <Row title=".shape-rectangle-rounded (slight curve)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            rectangleRounded
            asSpan
          />
        ))}
      </Row>
      <Row title=".shape-line-bottom .shape-rectangle">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            line
            rectangle
            asSpan
          />
        ))}
      </Row>
      <Row title=".shape-line-no (no border)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            lineNo
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-background-light (100 fill, default)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-light"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-background-dark (800 fill)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-dark"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-background-solid (outline matches fill)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-solid"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-background-no (no fill)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="background-no"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-monochrome">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="monochrome"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-gradient-sideways (L→R, next in palette)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="gradient-sideways"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-gradient-up">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="gradient-up"
            asSpan
          />
        ))}
      </Row>
      <Row title=".color-gradient-angle (45°)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            colorVariant="gradient-angle"
            asSpan
          />
        ))}
      </Row>
      <Row title=".tight (50% padding)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            tight
            asSpan
          />
        ))}
      </Row>
      <Row title=".gap-no (segment radius: first / middle / last)" noGap>
        {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            gapNo
            segmentPosition={
              i === 0
                ? "first"
                : i === ACTION_BUTTONS.length - 1
                  ? "last"
                  : "middle"
            }
            asSpan
          />
        ))}
      </Row>
      <Row title=".small (75%) + .uppercase">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="small"
            uppercase
            asSpan
          />
        ))}
      </Row>
      <Row title=".normal (100%)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="normal"
            asSpan
          />
        ))}
      </Row>
      <Row title=".large (1.5×)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="large"
            asSpan
          />
        ))}
      </Row>
      <Row title=".large2x (2×)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="large2x"
            asSpan
          />
        ))}
      </Row>
      <Row title=".animation-no">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            animationNo
            asSpan
          />
        ))}
      </Row>
      <Row title=".animation-no-grow">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            animationNoGrow
            asSpan
          />
        ))}
      </Row>
      <Row title=".animation-no-color-change">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            animationNoColorChange
            asSpan
          />
        ))}
      </Row>
      <Row title=".animation-icons (default)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            asSpan
          />
        ))}
      </Row>
      <Row title=".animation-icons-no">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            animationIconsNo
            asSpan
          />
        ))}
      </Row>
      <Row title=".state-inverted">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            inverted
            asSpan
          />
        ))}
      </Row>
      <Row title=".state-disabled (33% opacity, no interaction)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            disabled
            asSpan
          />
        ))}
      </Row>
      <Row title=".state-toggled (locked hover state, no scaling)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            toggled
            asSpan
          />
        ))}
      </Row>
    </div>
  );
}
