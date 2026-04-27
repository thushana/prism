/**
 * Splits **camelCase** / **snake_case** / **kebab-case** identifiers into words, lowercases them, and
 * applies **sentence case** (only the first character of the string is uppercase). Use with
 * `PrismTypography` **`textTransform="sentenceCase"`**; with **`role="overline"`**, overline CSS
 * `text-transform: uppercase` then yields ALL CAPS section labels.
 */
export function prismTypographySentenceCaseFromIdentifier(
  input: string
): string {
  const trimmed = input.trim();
  if (!trimmed) return input;

  const spaced = trimmed
    .replace(/[_-]+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();

  const words = spaced.split(/\s+/).filter(Boolean);
  if (words.length === 0) return input;

  const lower = words.map((w) => w.toLowerCase()).join(" ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
