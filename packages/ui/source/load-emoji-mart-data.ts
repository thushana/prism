import type { EmojiMartData } from "@emoji-mart/data";

export type EmojiMartCatalog = {
  data: EmojiMartData;
  aliasesByTarget: Record<string, string[]>;
  categoryTitles: Record<string, string>;
};

let pending: Promise<EmojiMartCatalog> | undefined;

function aliasesByTargetFromData(
  data: EmojiMartData
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [alias, target] of Object.entries(data.aliases)) {
    (out[target] ??= []).push(alias);
  }
  return out;
}

/** Full emoji-mart JSON — load only when a picker mounts, not on every `@ui` import. */
export function loadEmojiMartCatalog(): Promise<EmojiMartCatalog> {
  pending ??= Promise.all([
    import("@emoji-mart/data"),
    import("@emoji-mart/data/i18n/en.json"),
  ]).then(([dataMod, enMod]) => {
    const data = dataMod.default as EmojiMartData;
    const en = enMod.default as { categories?: Record<string, string> };
    return {
      data,
      aliasesByTarget: aliasesByTargetFromData(data),
      categoryTitles: en.categories ?? {},
    };
  });
  return pending;
}
