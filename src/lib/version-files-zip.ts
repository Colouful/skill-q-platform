import JSZip from "jszip";

/** 将版本 files JSON 打成 ZIP（13.7） */
export async function buildZipFromVersionFiles(files: unknown): Promise<Uint8Array> {
  const zip = new JSZip();
  const list = normalizeVersionFiles(files);
  if (list.length === 0) {
    zip.file("README.txt", "（此版本暂无文件条目，可在详情页补充）\n");
  } else {
    for (const f of list) {
      const path = f.path.replace(/^\/+/, "");
      if (!path || path.includes("..")) continue;
      zip.file(path, f.content ?? "");
    }
  }
  const out = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
  return out;
}

function normalizeVersionFiles(
  files: unknown,
): { path: string; content: string }[] {
  if (!Array.isArray(files)) return [];
  const out: { path: string; content: string }[] = [];
  for (const x of files) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    if (typeof o.path !== "string" || !o.path.trim()) continue;
    out.push({
      path: o.path,
      content: typeof o.content === "string" ? o.content : "",
    });
  }
  return out;
}
