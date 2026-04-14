"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function AdminShell({
  admin,
  children,
}: {
  admin: {
    id: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    const res = await fetchApi("/api/admin/auth/logout", { method: "POST" });
    if (res.code !== 0) return;
    router.push("/admin/login");
    router.refresh();
  }

  const nav = [
    { href: "/admin", label: "概览" },
    { href: "/admin/agents", label: "用户管理" },
    { href: "/admin/config", label: "系统配置" },
    { href: "/admin/categories", label: "分类管理" },
    { href: "/admin/registry-overview", label: "注册表总览" },
    { href: "/admin/skills/manage", label: "Skill 管理" },
    { href: "/admin/rules/manage", label: "Rule 管理" },
    { href: "/admin/skills", label: "待审 Skill" },
    { href: "/admin/rules", label: "待审 Rule" },
    { href: "/admin/roles", label: "专家管理" },
    { href: "/admin/scenarios", label: "场景方案" },
    { href: "/admin/install-presets", label: "安装预设" },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/skills") return pathname === "/admin/skills";
    if (href === "/admin/rules") return pathname === "/admin/rules";
    if (href === "/admin/skills/manage") {
      return (
        pathname === "/admin/skills/manage" ||
        pathname === "/admin/skills/new" ||
        pathname.startsWith("/admin/skills/") && pathname.endsWith("/edit")
      );
    }
    if (href === "/admin/rules/manage") {
      return (
        pathname === "/admin/rules/manage" ||
        pathname === "/admin/rules/new" ||
        pathname.startsWith("/admin/rules/") && pathname.endsWith("/edit")
      );
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 md:flex-row">
      <aside className="shrink-0 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 md:w-52">
        <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">管理后台</p>
        <p className="mt-1 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          {admin.email}
        </p>
        <nav className="mt-4 flex flex-col gap-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-sm border-2 border-transparent px-2 py-1 font-[family-name:var(--font-pixel-body)] text-sm",
                isActive(n.href)
                  ? "border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/25"
                  : "hover:border-[var(--pixel-border)]/60",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="mt-6 w-full border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-1 font-[family-name:var(--font-pixel-body)] text-xs hover:bg-[var(--pixel-yellow)]/30"
          onClick={() => void logout()}
        >
          登出
        </button>
        <Link
          href="/"
          className="mt-2 block text-center font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)] underline"
        >
          返回站点
        </Link>
      </aside>
      <main className="min-w-0 flex-1 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
