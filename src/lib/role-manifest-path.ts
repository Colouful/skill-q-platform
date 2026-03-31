export function normalizeRoleZipEntryPath(relPath: string): string {
  return relPath.replace(/\\/g, "/").replace(/^\.\//, "").trim();
}

export function isRoleManifestPath(normalizedPath: string): boolean {
  return /(^|\/)role\.md(\.txt)?$/i.test(normalizedPath);
}

const MD_BASENAME = /\.md$/i;

export function isRoleMarkdownFilenamePath(normalizedPath: string): boolean {
  const seg = normalizeRoleZipEntryPath(normalizedPath).split("/").pop() || "";
  return MD_BASENAME.test(seg);
}
