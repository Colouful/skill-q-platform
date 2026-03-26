/** 从拖拽的目录条目递归收集 File，并补上 webkitRelativePath（与选择文件夹行为一致） */

function shouldSkipFolderNoisePath(normalized: string): boolean {
  const lower = normalized.toLowerCase();
  if (lower.endsWith(".ds_store")) return true;
  if (lower.startsWith("__macosx/")) return true;
  if (lower.includes("/__macosx/")) return true;
  if (lower.endsWith("thumbs.db")) return true;
  return false;
}

function patchRelativePath(file: File, relativePath: string): File {
  const normalized = relativePath.replace(/\\/g, "/");
  const patched = new File([file], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
  Object.defineProperty(patched, "webkitRelativePath", {
    value: normalized,
    configurable: true,
    enumerable: true,
  });
  return patched;
}

async function readAllDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const acc: FileSystemEntry[] = [];
  await new Promise<void>((resolve, reject) => {
    const read = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length) {
            acc.push(...batch);
            read();
          } else resolve();
        },
        reject,
      );
    };
    read();
  });
  return acc;
}

async function collectFromDirectory(
  dir: FileSystemDirectoryEntry,
  basePath: string,
): Promise<File[]> {
  const reader = dir.createReader();
  const entries = await readAllDirectoryEntries(reader);
  const out: File[] = [];

  for (const e of entries) {
    const rel = basePath ? `${basePath}/${e.name}` : e.name;
    const norm = rel.replace(/\\/g, "/");
    if (e.isFile) {
      if (shouldSkipFolderNoisePath(norm)) continue;
      const file = await new Promise<File>((resolve, reject) =>
        (e as FileSystemFileEntry).file(resolve, reject),
      );
      out.push(patchRelativePath(file, norm));
    } else if (e.isDirectory) {
      out.push(...(await collectFromDirectory(e as FileSystemDirectoryEntry, norm)));
    }
  }
  return out;
}

/**
 * 若用户拖入的是文件夹，返回带 webkitRelativePath 的 File[]；否则返回 null（应用 ZIP 单文件逻辑）
 */
export async function tryCollectFilesFromDroppedFolder(
  dt: DataTransfer,
): Promise<File[] | null> {
  const items = dt.items;
  if (!items?.length) return null;

  const first = items[0];
  const asEntry = (
    first as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }
  ).webkitGetAsEntry?.();
  if (!asEntry?.isDirectory) return null;

  const files = await collectFromDirectory(asEntry as FileSystemDirectoryEntry, "");
  return files.length > 0 ? files : null;
}
