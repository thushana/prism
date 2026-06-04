import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveExistingConfigFile(
  rootDirectory: string,
  fileNames: readonly string[]
): string | undefined {
  for (const fileName of fileNames) {
    const filePath = join(rootDirectory, fileName);
    if (existsSync(filePath)) return filePath;
  }
  return undefined;
}

export function requireExistingConfigFile(
  rootDirectory: string,
  fileNames: readonly string[],
  hint: string
): string {
  const filePath = resolveExistingConfigFile(rootDirectory, fileNames);
  if (filePath) return filePath;
  throw new Error(
    `application-settings: missing ${fileNames.join(" or ")} under ${rootDirectory}. ${hint}`
  );
}
