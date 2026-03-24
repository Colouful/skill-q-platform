"use client";

import Link from "next/link";
import { useTheme } from "@/themes/useTheme";
import { ThemeSwitcher } from "@/themes/ThemeSwitcher";

/** 开发/验收用：四主题色板与描述，不依赖业务数据 */
export default function ThemePreviewPage() {
  const { list, themeId, current, mounted } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-3 py-6 sm:px-4">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/" className="hover:text-[var(--pixel-fg)]">
          首页
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">主题预览</span>
      </nav>

      <header className="border-b-4 border-[var(--pixel-border)] pb-4">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          主题预览
        </h1>
        <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          用于核对四款主题的变量、切换器与预览色块；生产环境可保留供支持人员使用。
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-4">
        <span className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          当前：
          {mounted ? (
            <strong className="text-[var(--pixel-fg)]">{current.meta.name}</strong>
          ) : (
            "…"
          )}
          <span className="ml-2 font-mono text-xs">({themeId})</span>
        </span>
        <ThemeSwitcher />
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((t) => {
          const active = t.meta.id === themeId;
          return (
            <li
              key={t.meta.id}
              className={`border-4 border-[var(--pixel-border)] bg-[var(--hub-surface-elevated)] p-4 shadow-[var(--hub-shadow-card-skill)] ${
                active ? "ring-2 ring-[var(--pixel-cyan)]" : ""
              }`}
            >
              <div
                className="mb-3 h-10 w-full rounded-sm border-2 border-[var(--pixel-border)]"
                style={{ backgroundColor: t.meta.previewColor }}
                aria-hidden
              />
              <p className="font-[family-name:var(--font-pixel-body)] text-xs font-bold text-[var(--pixel-fg)]">
                {t.meta.name}
                {active ? (
                  <span className="ml-2 text-[var(--pixel-cyan)]">当前</span>
                ) : null}
              </p>
              <p className="mt-1 font-mono text-[10px] text-[var(--pixel-muted)]">{t.meta.id}</p>
              <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs leading-snug text-[var(--pixel-muted)]">
                {t.meta.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
