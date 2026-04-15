"use client";

import * as React from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function hasClearableValue(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return true;
  return String(value).length > 0;
}

export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
        continue;
      }
      ref.current = node;
    }
  };
}

export function dispatchFormControlValue(
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  nextValue: string,
  eventName: "input" | "change",
) {
  const prototype =
    control instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : control instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(control, nextValue);
  control.dispatchEvent(new Event(eventName, { bubbles: true }));
}

type PixelClearButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PixelClearButton({ className, ...props }: PixelClearButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "absolute right-2 flex size-5 items-center justify-center border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] text-[var(--pixel-fg)] transition-colors hover:bg-[var(--pixel-cyan)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-cyan)]/40 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <XIcon className="size-3.5" />
    </button>
  );
}

export function PixelSelectChevron({ className }: { className?: string }) {
  return (
    <ChevronDownIcon
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-[var(--pixel-fg)]/70",
        className,
      )}
    />
  );
}

export function useClientMounted() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
