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
  | "typeUppercase"
  | "typeLowercase"
  | "shapeRectangle"
  | "shapeRectangleRounded"
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
  | "shapeTight"
  | "shapeGapNo"
  | "sizeSmall"
  | "sizeNormal"
  | "sizeLarge"
  | "sizeLarge2x"
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

/** All option keys (camelCase). Labels are "." + key (e.g. .shapeGapNo). */
const APPEARANCE_KEYS: AppearanceKey[] = [
  "icon",
  "iconOnly",
  "iconLeft",
  "iconRight",
  "typeUppercase",
  "typeLowercase",
  "shapeRectangle",
  "shapeRectangleRounded",
  "shapeLineNo",
  "shapeLineBottom",
  "colorBackground",
  "colorBackgroundLight",
  "colorBackgroundDark",
  "colorBackgroundSolid",
  "colorBackgroundNo",
  "colorMonochrome",
  "colorGradientSideways",
  "colorGradientUp",
  "colorGradientAngle",
  "shapeTight",
  "shapeGapNo",
  "sizeSmall",
  "sizeNormal",
  "sizeLarge",
  "sizeLarge2x",
  "fontSans",
  "fontSerif",
  "fontMono",
  "animationNo",
  "animationNoGrow",
  "animationNoColorChange",
  "animationIcons",
  "animationIconsNo",
  "stateInverted",
  "stateDisabled",
  "stateToggled",
];

/** Display label: .camelCase (matches key, e.g. .shapeGapNo). */
const OPTION_LABEL: Record<AppearanceKey, string> = Object.fromEntries(
  APPEARANCE_KEYS.map((key) => [key, `.${key}`])
) as Record<AppearanceKey, string>;

const CUSTOMIZER_COLUMNS: { heading: string; keys: AppearanceKey[] }[] = [
  { heading: "Icon", keys: ["icon", "iconOnly", "iconLeft", "iconRight"] },
  {
    heading: "Type",
    keys: [
      "typeUppercase",
      "typeLowercase",
      "fontSans",
      "fontSerif",
      "fontMono",
    ],
  },
  {
    heading: "Shape",
    keys: [
      "shapeRectangle",
      "shapeRectangleRounded",
      "shapeLineNo",
      "shapeLineBottom",
      "shapeTight",
      "shapeGapNo",
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
    keys: ["sizeSmall", "sizeNormal", "sizeLarge", "sizeLarge2x"],
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
    const size: PrismButtonSize | undefined = selected.has("sizeLarge2x")
      ? "large2x"
      : selected.has("sizeLarge")
        ? "large"
        : selected.has("sizeNormal")
          ? "normal"
          : selected.has("sizeSmall")
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
      typeUppercase: selected.has("typeUppercase")
        ? true
        : selected.has("typeLowercase")
          ? false
          : undefined,
      typeLowercase: selected.has("typeLowercase") || undefined,
      shapeRectangle: selected.has("shapeRectangle") || undefined,
      shapeRectangleRounded: selected.has("shapeRectangleRounded") || undefined,
      shapeLineBottom: lineVariant === "bottom" || undefined,
      shapeLineNo: lineVariant === "no" || undefined,
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
      shapeTight: selected.has("shapeTight") || undefined,
      shapeGapNo: selected.has("shapeGapNo") || undefined,
      size,
      font,
      animationNo: selected.has("animationNo") || undefined,
      animationNoGrow: selected.has("animationNoGrow") || undefined,
      animationNoColorChange:
        selected.has("animationNoColorChange") || undefined,
      animationIconsNo: selected.has("animationIconsNo") || undefined,
      stateInverted: selected.has("stateInverted") || undefined,
      stateDisabled: selected.has("stateDisabled") || undefined,
      stateToggled: selected.has("stateToggled") || undefined,
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
            className={`flex flex-wrap items-center ${selected.has("shapeGapNo") ? "gap-0" : "gap-3"}`}
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
                  selected.has("shapeGapNo")
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
      <Row title=".iconOnly (no text, alt/hover)">
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
      <Row title=".iconRight">
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
      <Row title=".typeUppercase">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            typeUppercase
            asSpan
          />
        ))}
      </Row>
      <Row title=".typeLowercase (label in lowercase)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            typeLowercase
            asSpan
          />
        ))}
      </Row>
      <Row title=".shapeRectangle (90° corners)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shapeRectangle
            asSpan
          />
        ))}
      </Row>
      <Row title=".shapeRectangleRounded (slight curve)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shapeRectangleRounded
            asSpan
          />
        ))}
      </Row>
      <Row title=".shapeLineBottom .shapeRectangle">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shapeLineBottom
            shapeRectangle
            asSpan
          />
        ))}
      </Row>
      <Row title=".shapeLineNo (no border)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shapeLineNo
            asSpan
          />
        ))}
      </Row>
      <Row title=".colorBackgroundLight (100 fill, default)">
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
      <Row title=".colorBackgroundDark (800 fill)">
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
      <Row title=".colorBackgroundSolid (outline matches fill)">
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
      <Row title=".colorBackgroundNo (no fill)">
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
      <Row title=".colorMonochrome">
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
      <Row title=".colorGradientSideways (L→R, next in palette)">
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
      <Row title=".colorGradientUp">
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
      <Row title=".colorGradientAngle (45°)">
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
      <Row title=".shapeTight (50% padding)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shapeTight
            asSpan
          />
        ))}
      </Row>
      <Row title=".shapeGapNo (segment radius: first / middle / last)" noGap>
        {ACTION_BUTTONS.map(({ color, label, icon }, i) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            shapeGapNo
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
      <Row title=".sizeSmall (75%) + .typeUppercase">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            size="small"
            typeUppercase
            asSpan
          />
        ))}
      </Row>
      <Row title=".sizeNormal (100%)">
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
      <Row title=".sizeLarge (1.5×)">
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
      <Row title=".sizeLarge2x (2×)">
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
      <Row title=".animationNo">
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
      <Row title=".animationNoGrow">
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
      <Row title=".animationNoColorChange">
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
      <Row title=".animationIcons (default)">
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
      <Row title=".animationIconsNo">
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
      <Row title=".stateInverted">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            stateInverted
            asSpan
          />
        ))}
      </Row>
      <Row title=".stateDisabled (33% opacity, no interaction)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            stateDisabled
            asSpan
          />
        ))}
      </Row>
      <Row title=".stateToggled (locked hover state, no scaling)">
        {ACTION_BUTTONS.map(({ color, label, icon }) => (
          <PrismButton
            key={color}
            color={color}
            label={label}
            variant="icon"
            icon={icon}
            stateToggled
            asSpan
          />
        ))}
      </Row>
    </div>
  );
}
