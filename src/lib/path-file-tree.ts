/** 由 path 字符串构建文件树（Skill / Rule 版本与编辑器共用） */

export type FilePathTreeNode<T> =
  | { kind: "file"; fullPath: string; name: string; data: T }
  | {
      kind: "folder";
      prefix: string;
      name: string;
      children: FilePathTreeNode<T>[];
      /** 用户主动创建的空目录占位，可单独删除 */
      isVirtual?: boolean;
    };

type MDir<T> = {
  type: "dir";
  segment: string;
  prefix: string;
  children: Map<string, MDir<T> | MFile<T>>;
};

type MFile<T> = { type: "file"; name: string; fullPath: string; data: T };

function hasFileUnderPrefix(files: { path: string }[], prefix: string): boolean {
  const p = prefix.replace(/\/+$/, "");
  if (!p) return files.length > 0;
  return files.some((f) => f.path.startsWith(`${p}/`) || f.path === p);
}

function ensureDir<T>(root: MDir<T>, parts: string[], depth: number): MDir<T> | null {
  let cur = root;
  let prefix = "";
  for (let i = 0; i < depth; i++) {
    const seg = parts[i]!;
    prefix = prefix ? `${prefix}/${seg}` : seg;
    const next = cur.children.get(seg);
    if (next?.type === "file") {
      return null;
    }
    if (!next) {
      const dir: MDir<T> = { type: "dir", segment: seg, prefix, children: new Map() };
      cur.children.set(seg, dir);
      cur = dir;
    } else {
      cur = next;
    }
  }
  return cur;
}

function insertFile<T extends { path: string }>(root: MDir<T>, item: T): void {
  const norm = item.path.replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = norm.split("/").filter(Boolean);
  if (parts.length === 0) return;
  const parent = ensureDir(root, parts, parts.length - 1);
  if (!parent) return;
  const fileName = parts[parts.length - 1]!;
  if (parent.children.get(fileName)?.type === "dir") {
    return;
  }
  parent.children.set(fileName, {
    type: "file",
    name: fileName,
    fullPath: norm,
    data: item,
  });
}

function insertVirtualPath<T>(root: MDir<T>, path: string): void {
  const norm = path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!norm) return;
  const parts = norm.split("/").filter(Boolean);
  ensureDir(root, parts, parts.length);
}

function mutableToNodes<T>(
  dir: MDir<T>,
  virtualPrefixes: Set<string>,
  allFiles: { path: string }[],
): FilePathTreeNode<T>[] {
  const entries = [...dir.children.entries()];
  const dirs = entries.filter(([, v]) => v.type === "dir") as [string, MDir<T>][];
  const files = entries.filter(([, v]) => v.type === "file") as [string, MFile<T>][];
  dirs.sort(([a], [b]) => a.localeCompare(b));
  files.sort(([a], [b]) => a.localeCompare(b));
  const out: FilePathTreeNode<T>[] = [];

  for (const [, d] of dirs) {
    const children = mutableToNodes(d, virtualPrefixes, allFiles);
    const isVirtual =
      virtualPrefixes.has(d.prefix) && !hasFileUnderPrefix(allFiles, d.prefix);
    out.push({
      kind: "folder",
      prefix: d.prefix,
      name: d.segment,
      children,
      isVirtual,
    });
  }

  for (const [, f] of files) {
    out.push({
      kind: "file",
      fullPath: f.fullPath,
      name: f.name,
      data: f.data,
    });
  }

  return out;
}

/**
 * @param virtualFolderPrefixes 不含首尾斜杠的目录路径，如 ["scripts", "scripts/lib"]
 */
export function buildFilePathTree<T extends { path: string }>(
  items: T[],
  virtualFolderPrefixes: string[] = [],
): FilePathTreeNode<T>[] {
  const root: MDir<T> = { type: "dir", segment: "", prefix: "", children: new Map() };
  const virtualSet = new Set(
    virtualFolderPrefixes
      .map((p) => p.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, ""))
      .filter(Boolean),
  );

  for (const item of items) {
    insertFile(root, item);
  }
  for (const v of virtualSet) {
    insertVirtualPath(root, v);
  }

  return mutableToNodes(root, virtualSet, items);
}

/** 从已有文件路径收集所有「可作为父目录」的前缀（含根目录 ""） */
export function collectParentFolderPrefixes(files: { path: string }[]): string[] {
  const set = new Set<string>([""]);
  for (const f of files) {
    const norm = f.path.replace(/\\/g, "/").replace(/^\/+/, "");
    const parts = norm.split("/").filter(Boolean);
    if (parts.length <= 1) continue;
    let acc = "";
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i]!;
      set.add(acc);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * 当所有带层级的路径都落在同一「公共父目录」下时返回该前缀（如上传了文件夹 A，路径为 A/A-1/...，
 * 则返回 A），用于新建文件/文件夹时默认父目录，避免误以为「包根」就是上传时的最外层文件夹名。
 */
export function suggestDefaultParentPrefix(
  files: { path: string }[],
  virtualFolderPrefixes: string[] = [],
): string {
  const normalize = (p: string) =>
    p.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");

  const paths = [
    ...files.map((f) => normalize(f.path)),
    ...virtualFolderPrefixes.map(normalize),
  ].filter(Boolean);

  const dirPartLists = paths
    .filter((p) => p.includes("/"))
    .map((p) => {
      const segs = p.split("/").filter(Boolean);
      return segs.slice(0, -1);
    })
    .filter((d) => d.length > 0);

  if (dirPartLists.length === 0) return "";

  let common = dirPartLists[0]!;
  for (let i = 1; i < dirPartLists.length; i++) {
    const parts = dirPartLists[i]!;
    let j = 0;
    while (j < common.length && j < parts.length && common[j] === parts[j]) j++;
    common = common.slice(0, j);
    if (common.length === 0) return "";
  }
  return common.join("/");
}
