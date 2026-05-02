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
  face: PrismColorPickerColorFace
): string {
  const t = normalizePickerColorToken(face.token);
  if (!face.swatch) {
    return t || "—";
  }
  const family = paletteFamilyDisplayTitle(
    face.swatch.palette,
    face.swatch.family
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
 *
 * - **Gradient spec** (`gradient.swatches.length > 0`): emits `gradient: { swatches, direction, shade? }`.
 *   `swatchPrimary` / `shade` are omitted because they are not the primary control surface.
 * - **Single spec**: emits `swatchPrimary + shade`, and `colorLoop` when `range > 0` or `center` is set.
 *
 * `palette` is omitted when `"default"`. Single-color output includes a trailing `//` resolved CSS
 * color comment; gradient output stays focused on the ordered `gradient` spec.
 */
export function prismColorPickerClipboardColorProp(
  partial: PartialPrismColorSpec | undefined
): string {
  const n = normalizePrismColorSpec(partial);
  const grad = partial?.gradient;

  // ── Gradient mode ──────────────────────────────────────────────────────────
  if (grad && grad.swatches.length > 0) {
    const lines: string[] = ["color={{"];
    if (n.palette !== "default") {
      lines.push(`  palette: ${JSON.stringify(n.palette)},`);
    }
    lines.push("  gradient: {");
    lines.push(
      `    swatches: [${grad.swatches.map((s) => JSON.stringify(s)).join(", ")}],`
    );
    lines.push(`    direction: "${grad.direction}",`);
    if (grad.shade !== undefined) {
      const shadeStr =
        typeof grad.shade === "number"
          ? String(grad.shade)
          : `{ light: ${(grad.shade as { light: number; dark: number }).light}, dark: ${(grad.shade as { light: number; dark: number }).dark} }`;
      lines.push(`    shade: ${shadeStr},`);
    }
    lines.push("  },");
    lines.push("}}");
    return lines.join("\n");
  }

  // ── Single / ColorLoop mode ────────────────────────────────────────────────
  const family =
    n.swatchPrimary ?? PrismColor.Loop.normalize(n.palette, "blue");
  const resolved = sanitizeSingleLineJsComment(prismColorSpecToHex(partial));

  const lines: string[] = ["color={{"];
  if (n.palette !== "default") {
    lines.push(`  palette: ${JSON.stringify(n.palette)},`);
  }
  lines.push(
    `  swatchPrimary: ${JSON.stringify(family)}, // ${resolved || "—"}`
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
  swatch: PrismColorPickerSwatch
): string {
  return prismColorPickerDisplayBullets({ swatch, token: swatch.hex });
}
