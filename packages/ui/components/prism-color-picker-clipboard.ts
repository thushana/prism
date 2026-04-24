import {
  clampPrismColorLoopRange,
  normalizePrismColorSpec,
  PrismColor,
  prismColorSpecToHex,
  type PartialPrismColorSpec,
} from "../styles/prism-color";
import {
  materialShadeLabelDisplay,
  normalizePickerColorToken,
  paletteFamilyDisplayTitle,
  type PrismColorPickerColorFace,
  type PrismColorPickerSwatch,
} from "./prism-color-picker-helpers";

/** `FAMILY • shade • token` — trigger strip (with token when shown), grid cell titles, tooltips. */
export function prismColorPickerDisplayBullets(
  face: PrismColorPickerColorFace,
): string {
  const t = normalizePickerColorToken(face.token);
  if (!face.swatch) {
    return t || "—";
  }
  const family = paletteFamilyDisplayTitle(
    face.swatch.palette,
    face.swatch.family,
  ).toUpperCase();
  const shade = materialShadeLabelDisplay(face.swatch.shade);
  if (!t) {
    return `${family} • ${shade}`;
  }
  return `${family} • ${shade} • ${t}`;
}

function sanitizeSingleLineJsComment(body: string): string {
  return body.trim().replace(/\s+/g, " ").replace(/\*\//g, "*\\/");
}

/**
 * Clipboard text: a pasteable JSX `color={{ … }}` block (same shape as {@link PartialPrismColorSpec}).
 * Omits `palette` when `"default"`. Trailing `//` comment is {@link prismColorSpecToHex} for that spec
 * (hex or e.g. `oklch(...)` for Tailwind literals).
 *
 * Emits `colorLoop` only when it would carry a value — i.e. `range > 0` or an explicit `center`. A spec
 * with `colorLoop: { range: 0 }` and no `center` renders as a plain picker config.
 */
export function prismColorPickerClipboardColorProp(
  partial: PartialPrismColorSpec | undefined,
): string {
  const n = normalizePrismColorSpec(partial);
  const family =
    n.swatchPrimary ?? PrismColor.Loop.normalize(n.palette, "blue");
  const resolved = sanitizeSingleLineJsComment(prismColorSpecToHex(partial));

  const lines: string[] = ["color={{"];
  if (n.palette !== "default") {
    lines.push(`  palette: ${JSON.stringify(n.palette)},`);
  }
  lines.push(
    `  swatchPrimary: ${JSON.stringify(family)}, // ${resolved || "—"}`,
  );
  const shadeLit =
    typeof n.shade === "string" ? JSON.stringify(n.shade) : String(n.shade);
  lines.push(`  shade: ${shadeLit},`);
  const cl = partial?.colorLoop;
  if (cl !== undefined) {
    const bits: string[] = [];
    if (cl.center !== undefined) {
      bits.push(`center: ${JSON.stringify(cl.center)}`);
    }
    if (cl.range !== undefined) {
      const clamped = clampPrismColorLoopRange(n.palette, cl.range);
      if (clamped > 0) bits.push(`range: ${clamped}`);
    }
    if (bits.length > 0) {
      lines.push(`  colorLoop: { ${bits.join(", ")} },`);
    }
  }
  lines.push("}}");
  return lines.join("\n");
}

/** Title/aria string for a single grid cell (palette + family + shade + hex). */
export function swatchPickerDisplayTitle(
  swatch: PrismColorPickerSwatch,
): string {
  return prismColorPickerDisplayBullets({ swatch, token: swatch.hex });
}
