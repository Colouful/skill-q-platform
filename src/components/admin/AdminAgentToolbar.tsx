"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";

export function AdminAgentToolbar({
  agentId,
  isActive,
}: {
  agentId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function ban() {
    if (!window.confirm("确定封禁该用户？其将无法使用 API Key 与会话。")) return;
    setBusy("ban");
    const res = await fetchApi(`/api/admin/agents/${agentId}/ban`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "操作失败");
      return;
    }
    toast.success("已封禁");
    router.refresh();
  }

  async function unban() {
    setBusy("unban");
    const res = await fetchApi(`/api/admin/agents/${agentId}/unban`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "操作失败");
      return;
    }
    toast.success("已解封");
    router.refresh();
  }

  async function resetKey() {
    if (
      !window.confirm(
        "将撤销该用户下全部 API Key 并生成新的 Default Key。旧 Key 立即失效。是否继续？",
      )
    ) {
      return;
    }
    setBusy("key");
    const res = await fetchApi<{ apiKey: string }>(`/api/admin/agents/${agentId}/reset-api-key`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setBusy(null);
    if (res.code !== 0 || !res.data?.apiKey) {
      toast.error(res.message || "操作失败");
      return;
    }
    window.prompt("请复制并安全保存新 API Key（仅显示一次）：", res.data.apiKey);
    toast.success("已重置 Key");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isActive ? (
        <Button
          type="button"
          variant="outline"
          className="border-2 border-red-800 text-red-800"
          disabled={busy !== null}
          onClick={() => void ban()}
        >
          {busy === "ban" ? "处理中…" : "封禁"}
        </Button>
      ) : (
        <Button type="button" className="border-2" disabled={busy !== null} onClick={() => void unban()}>
          {busy === "unban" ? "处理中…" : "解封"}
        </Button>
      )}
      <Button type="button" variant="outline" className="border-2" disabled={busy !== null} onClick={() => void resetKey()}>
        {busy === "key" ? "处理中…" : "重置 API Key"}
      </Button>
    </div>
  );
}
