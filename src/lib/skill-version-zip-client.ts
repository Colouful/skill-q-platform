/** 客户端：从 export-zip 拉取 ZIP 并触发浏览器保存 */
export function downloadSkillVersionZip(
  slug: string,
  versionLabel: string,
  onDone: (ok: boolean, errorMessage?: string) => void,
  onProgress?: (pct: number | null) => void,
): void {
  const url = `/api/skills/${slug}/versions/${encodeURIComponent(versionLabel)}/export-zip`;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.responseType = "blob";

  xhr.onprogress = (e) => {
    if (e.lengthComputable && e.total > 0 && onProgress) {
      onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
      const blob = xhr.response as Blob;
      const a = document.createElement("a");
      const safe = `${slug}-${versionLabel}.zip`.replace(/[^\w.\-]+/g, "_");
      a.href = URL.createObjectURL(blob);
      a.download = safe;
      a.click();
      URL.revokeObjectURL(a.href);
      onDone(true);
      return;
    }
    void (async () => {
      let msg: string | undefined;
      const blob = xhr.response as Blob | undefined;
      if (blob && typeof blob.text === "function") {
        try {
          const t = await blob.text();
          const j = JSON.parse(t) as { message?: string };
          msg = j.message;
        } catch {
          msg = undefined;
        }
      }
      onDone(false, msg);
    })();
  };

  xhr.onerror = () => onDone(false);
  onProgress?.(0);
  xhr.send();
}
