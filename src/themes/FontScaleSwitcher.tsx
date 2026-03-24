"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { FONT_SCALE_LABEL, FONT_SCALE_ORDER } from "./font-scale";
import { useFontScale } from "./useFontScale";
import type { FontScaleId } from "./types";
import { cn } from "@/lib/utils";

export function FontScaleSwitcher({ className }: { className?: string }) {
  const { fontScaleId, setFontScaleId, mounted } = useFontScale();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Map<FontScaleId, HTMLButtonElement | null>>(new Map());
  const btnId = useId();
  const menuId = `${btnId}-font-menu`;

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
    const id = FONT_SCALE_ORDER[activeIndex];
    if (!id) return;
    optionRefs.current.get(id)?.focus();
  }, [open, activeIndex]);

  const onMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAndFocusTrigger();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, FONT_SCALE_ORDER.length - 1));
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
        setActiveIndex(FONT_SCALE_ORDER.length - 1);
      }
    },
    [closeAndFocusTrigger],
  );

  const onTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!open && e.key === "ArrowDown") {
        e.preventDefault();
        const idx = FONT_SCALE_ORDER.indexOf(fontScaleId);
        setActiveIndex(idx >= 0 ? idx : 0);
        setOpen(true);
      }
    },
    [open, fontScaleId],
  );

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
        aria-controls={menuId}
        aria-label={`全站字号：${FONT_SCALE_LABEL[fontScaleId]}`}
        title="全站字号"
        onClick={() => {
          setOpen((o) => {
            if (!o) {
              const idx = FONT_SCALE_ORDER.indexOf(fontScaleId);
              setActiveIndex(idx >= 0 ? idx : 0);
              return true;
            }
            return false;
          });
        }}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-8 max-w-[5rem] items-center gap-1 rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] px-1.5 font-[family-name:var(--font-pixel-body)] text-[10px] font-bold text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/15 sm:max-w-none sm:gap-1.5 sm:px-2 sm:text-xs"
      >
        <Type className="size-3.5 shrink-0 sm:size-4" aria-hidden />
        <span className="hidden min-w-0 truncate sm:inline">{FONT_SCALE_LABEL[fontScaleId]}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={btnId}
          aria-activedescendant={
            FONT_SCALE_ORDER[activeIndex] ? `${btnId}-fs-${FONT_SCALE_ORDER[activeIndex]}` : undefined
          }
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-[60] mt-1 w-[min(100vw-1.5rem,12rem)] rounded-sm border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] p-1.5 shadow-[var(--hub-shadow-card-skill)] outline-none"
        >
          {FONT_SCALE_ORDER.map((id, index) => {
            const active = id === fontScaleId;
            const highlighted = index === activeIndex;
            return (
              <button
                key={id}
                id={`${btnId}-fs-${id}`}
                ref={(el) => {
                  optionRefs.current.set(id, el);
                }}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={-1}
                onClick={() => {
                  setFontScaleId(id);
                  setOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left font-[family-name:var(--font-pixel-body)] text-xs transition",
                  active
                    ? "bg-[var(--pixel-cyan)]/20 ring-2 ring-[var(--pixel-border)]"
                    : "hover:bg-[var(--pixel-yellow)]/25",
                  highlighted && "ring-1 ring-[var(--pixel-muted)]/40",
                )}
              >
                <span className="text-[var(--pixel-fg)]">{FONT_SCALE_LABEL[id]}</span>
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
