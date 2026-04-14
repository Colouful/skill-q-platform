const DEFAULT_AI_SPEC_PACKAGE_NAME = "@ex/ai-spec-auto";
const DEFAULT_AI_SPEC_PACKAGE_VERSION = "latest";
const SUPPORTED_IDE_PRESETS = ["cursor", "claude", "opencode", "trae"];

export const AI_SPEC_PACKAGE_NAME =
  process.env.NEXT_PUBLIC_AI_SPEC_PACKAGE_NAME?.trim() || DEFAULT_AI_SPEC_PACKAGE_NAME;
export const AI_SPEC_PACKAGE_VERSION =
  process.env.NEXT_PUBLIC_AI_SPEC_PACKAGE_VERSION?.trim() || DEFAULT_AI_SPEC_PACKAGE_VERSION;
export const AI_SPEC_PACKAGE_SPEC = `${AI_SPEC_PACKAGE_NAME}@${AI_SPEC_PACKAGE_VERSION}`;

function normalizeIdePreset(ides: string[] | undefined): string {
  const cleaned = (ides ?? [])
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && SUPPORTED_IDE_PRESETS.includes(item));
  return cleaned.length > 0 ? cleaned.join(",") : "default";
}

function quoteArg(value: string): string {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}

function normalizeProfile(profile: string | undefined): string {
  const cleaned = (profile ?? "").trim().toLowerCase();
  return cleaned || "default";
}

function formatCommand(parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part, index, arr) =>
      index === 0 ? `${part} \\` : `  ${part}${index === arr.length - 1 ? "" : " \\"}`,
    )
    .join("\n");
}

export function buildAiSpecInitCommand(input: {
  profile: string;
  ides?: string[];
}): string {
  return formatCommand([
    `npx ${AI_SPEC_PACKAGE_SPEC} init .`,
    `--profile ${quoteArg(normalizeProfile(input.profile))}`,
    `--ide ${quoteArg(normalizeIdePreset(input.ides))}`,
  ]);
}

export function buildAiSpecSyncCommand(input: { manifestRef: string }): string {
  return formatCommand([
    `npx ${AI_SPEC_PACKAGE_SPEC} sync .`,
    `--manifest ${quoteArg(input.manifestRef)}`,
  ]);
}

export function buildAiSpecFirstInstallCommand(input: {
  profile: string;
  manifestRef: string;
  ides?: string[];
}): string {
  return [
    buildAiSpecInitCommand({
      profile: input.profile,
      ides: input.ides,
    }),
    buildAiSpecSyncCommand({
      manifestRef: input.manifestRef,
    }),
  ].join("\n\n");
}
