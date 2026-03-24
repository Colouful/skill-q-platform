"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PixelInput, pixelSelectClassName } from "@/components/pixel";
import { fetchApi } from "@/lib/client-api";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

type ConfigPayload = {
  siteName: string;
  siteUrl: string;
  defaultDownloadPolicy: string;
  registerMaxPerHour: string;
  maintenanceMode: string;
  uploadRequiresLogin: string;
};

export function AdminConfigClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [defaultDownloadPolicy, setDefaultDownloadPolicy] = useState("public");
  const [registerMaxPerHour, setRegisterMaxPerHour] = useState("10");
  const [maintenanceMode, setMaintenanceMode] = useState("false");
  const [uploadRequiresLogin, setUploadRequiresLogin] = useState("false");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchApi<ConfigPayload>("/api/admin/config");
    setLoading(false);
    if (res.code !== 0 || !res.data) {
      toast.error(res.message || "加载失败");
      return;
    }
    setSiteName(res.data.siteName);
    setSiteUrl(res.data.siteUrl);
    setDefaultDownloadPolicy(res.data.defaultDownloadPolicy);
    setRegisterMaxPerHour(res.data.registerMaxPerHour);
    setMaintenanceMode(res.data.maintenanceMode);
    setUploadRequiresLogin(res.data.uploadRequiresLogin);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    const pairs: { key: string; value: string }[] = [
      { key: SYSTEM_CONFIG_KEYS.SITE_NAME, value: siteName },
      { key: SYSTEM_CONFIG_KEYS.SITE_URL, value: siteUrl },
      { key: SYSTEM_CONFIG_KEYS.DEFAULT_DOWNLOAD_POLICY, value: defaultDownloadPolicy },
      { key: SYSTEM_CONFIG_KEYS.REGISTER_MAX_PER_HOUR, value: registerMaxPerHour },
      { key: SYSTEM_CONFIG_KEYS.MAINTENANCE_MODE, value: maintenanceMode },
      { key: SYSTEM_CONFIG_KEYS.UPLOAD_REQUIRES_LOGIN, value: uploadRequiresLogin },
    ];
    for (const p of pairs) {
      const res = await fetchApi("/api/admin/config/update", {
        method: "POST",
        body: JSON.stringify(p),
      });
      if (res.code !== 0) {
        setBusy(false);
        toast.error(res.message || `保存失败：${p.key}`);
        return;
      }
    }
    setBusy(false);
    toast.success("已全部保存");
    router.refresh();
    void load();
  }

  if (loading) {
    return <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">加载中…</p>;
  }

  return (
    <div className="max-w-lg space-y-4 font-[family-name:var(--font-pixel-body)] text-sm">
      <div>
        <Label>站点名称</Label>
        <PixelInput className="mt-1" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
      </div>
      <div>
        <Label>站点 URL</Label>
        <PixelInput
          className="mt-1"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div>
        <Label>默认下载策略（新建 Skill / Rule 未指定时）</Label>
        <select
          className={pixelSelectClassName + " mt-1 w-full"}
          value={defaultDownloadPolicy}
          onChange={(e) => setDefaultDownloadPolicy(e.target.value)}
        >
          <option value="public">公开（public）</option>
          <option value="login">需登录（login）</option>
          <option value="author">仅作者（author）</option>
        </select>
      </div>
      <div>
        <Label>注册速率限制（每 IP 每小时最大次数）</Label>
        <PixelInput
          className="mt-1"
          value={registerMaxPerHour}
          onChange={(e) => setRegisterMaxPerHour(e.target.value)}
          inputMode="numeric"
        />
      </div>
      <div>
        <Label>维护模式（开启后前台与公开 API 不可用，管理后台除外）</Label>
        <select
          className={pixelSelectClassName + " mt-1 w-full"}
          value={maintenanceMode === "true" ? "true" : "false"}
          onChange={(e) => setMaintenanceMode(e.target.value)}
        >
          <option value="false">关闭</option>
          <option value="true">开启</option>
        </select>
      </div>
      <div>
        <Label>上传需登录（开启后未登录不能新建/分叉 Skill·Rule 及上传新版本；默认关闭）</Label>
        <select
          className={pixelSelectClassName + " mt-1 w-full"}
          value={uploadRequiresLogin === "true" ? "true" : "false"}
          onChange={(e) => setUploadRequiresLogin(e.target.value)}
        >
          <option value="false">允许匿名上传（仍受限流与 HUB_AUTH 约束）</option>
          <option value="true">必须登录（Cookie 会话或 Bearer API Key）</option>
        </select>
      </div>
      <Button type="button" className="border-2" disabled={busy} onClick={() => void save()}>
        {busy ? "保存中…" : "保存全部"}
      </Button>
    </div>
  );
}
