"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useTheme } from "./useTheme";
import type { ThemeId } from "./types";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { themeId, setThemeId, list, current, mounted, isTransitioning } = useTheme();
  const [open, setOpen] = useState(false);
  /** 下拉打开时，键盘高亮项索引 */
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Map<ThemeId, HTMLButtonElement | null>>(new Map());
  const btnId = useId();
  const menuId = `${btnId}-menu`;

  const closeAndFocusTrigger = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const id = list[activeIndex]?.meta.id;
    if (!id) return;
    optionRefs.current.get(id)?.focus();
  }, [open, activeIndex, list]);

  const onMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAndFocusTrigger();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, list.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setActiveIndex(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setActiveIndex(list.length - 1);
      }
    },
    [list.length, closeAndFocusTrigger],
  );

  const onTriggerKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open && e.key === "ArrowDown") {
      e.preventDefault();
      const idx = list.findIndex((t) => t.meta.id === themeId);
      setActiveIndex(idx >= 0 ? idx : 0);
      setOpen(true);
    }
  }, [open, list, themeId]);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8 w-9 shrink-0 rounded-sm border border-[var(--pixel-border)]/40 bg-muted/20",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={btnId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-busy={isTransitioning}
        aria-controls={menuId}
        onClick={() => {
          setOpen((o) => {
            if (!o) {
              const idx = list.findIndex((t) => t.meta.id === themeId);
              setActiveIndex(idx >= 0 ? idx : 0);
              return true;
            }
            return false;
          });
        }}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-8 max-w-[7rem] items-center gap-1 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] px-1.5 font-[family-name:var(--font-pixel-body)] text-[10px] font-bold text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/15 sm:max-w-none sm:gap-1.5 sm:px-2 sm:text-xs"
        title="切换主题"
      >
        <Palette className="size-3.5 shrink-0 sm:size-4" aria-hidden />
        <span className="hidden min-w-0 truncate sm:inline">{current.meta.name}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={btnId}
          aria-activedescendant={
            list[activeIndex] ? `${btnId}-opt-${list[activeIndex].meta.id}` : undefined
          }
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-[60] mt-1 w-[min(100vw-1.5rem,18rem)] rounded-sm border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] p-1.5 shadow-[var(--hub-shadow-card-skill)] outline-none"
        >
          {list.map((t, index) => {
            const id = t.meta.id as ThemeId;
            const active = id === themeId;
            const highlighted = index === activeIndex;
            return (
              <button
                key={id}
                id={`${btnId}-opt-${id}`}
                ref={(el) => {
                  optionRefs.current.set(id, el);
                }}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={-1}
                onClick={() => {
                  setThemeId(id);
                  setOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left transition",
                  active
                    ? "bg-[var(--pixel-cyan)]/20 ring-2 ring-[var(--pixel-border)]"
                    : "hover:bg-[var(--pixel-yellow)]/25",
                  highlighted && "ring-1 ring-[var(--pixel-muted)]/40",
                )}
              >
                <span
                  className="mt-0.5 size-6 shrink-0 rounded-sm border-2 border-[var(--pixel-border)]"
                  style={{ backgroundColor: t.meta.previewColor }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-[family-name:var(--font-pixel-body)] text-xs font-bold text-[var(--pixel-fg)]">
                    {t.meta.name}
                  </span>
                  <span className="mt-0.5 line-clamp-2 font-[family-name:var(--font-pixel-body)] text-[10px] leading-snug text-[var(--pixel-muted)]">
                    {t.meta.description}
                  </span>
                </span>
                {active ? (
                  <span className="shrink-0 text-[var(--pixel-cyan)]" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
