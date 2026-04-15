"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { PixelInput } from "@/components/pixel";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetchApi<{ admin: { id: string; email: string } }>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setPending(false);
    if (res.code === 0) {
      toast.success("登录成功");
      router.push("/admin");
      router.refresh();
      return;
    }
    toast.error(res.message || "登录失败");
  }

  return (
    <div className="mx-auto max-w-md border-4 border-[var(--pixel-border)] bg-[#fffef8] p-6 shadow-[6px_6px_0_0_var(--pixel-border)]">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        管理员登录
      </h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label className="font-[family-name:var(--font-pixel-body)]">账号</Label>
          <PixelInput
            type="text"
            autoComplete="username"
            required
            clearable
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="font-[family-name:var(--font-pixel-body)]">密码</Label>
          <PixelInput
            type="password"
            autoComplete="current-password"
            required
            clearable
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="w-full border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
        >
          {pending ? "登录中…" : "登录"}
        </Button>
      </form>
      <p className="mt-4 text-center font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        <Link href="/" className="underline">
          返回首页
        </Link>
      </p>
    </div>
  );
}
