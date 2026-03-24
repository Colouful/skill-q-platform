"use client";

import { Label } from "@/components/ui/label";

export type DownloadPolicyChoice = "public" | "login" | "author";

export function DownloadPolicyRadios({
  value,
  onChange,
  name,
}: {
  value: DownloadPolicyChoice;
  onChange: (v: DownloadPolicyChoice) => void;
  /** 同一页多个表单时区分 radio name */
  name: string;
}) {
  return (
    <fieldset className="space-y-2">
      <Label className="font-[family-name:var(--font-pixel-body)]">下载策略</Label>
      <div className="space-y-1.5 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="radio"
            name={name}
            checked={value === "public"}
            onChange={() => onChange("public")}
            className="mt-1"
          />
          <span>
            <span className="mr-1">🌍</span>公开下载（任何人）
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="radio"
            name={name}
            checked={value === "login"}
            onChange={() => onChange("login")}
            className="mt-1"
          />
          <span>
            <span className="mr-1">🔒</span>需登录（已登录特工可下载）
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="radio"
            name={name}
            checked={value === "author"}
            onChange={() => onChange("author")}
            className="mt-1"
          />
          <span>
            <span className="mr-1">👤</span>仅作者（绑定作者账号后可下载）
          </span>
        </label>
      </div>
    </fieldset>
  );
}
