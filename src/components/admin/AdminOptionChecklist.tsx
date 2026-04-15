"use client";

import { useMemo, useState } from "react";
import { PixelInput } from "@/components/pixel";

type Option = {
  id: string;
  label: string;
  caption?: string;
};

export function AdminOptionChecklist({
  title,
  options,
  selected,
  onToggle,
  searchEnabled = false,
  searchPlaceholder = "搜索名称或 slug",
  minHeightClassName = "",
  maxHeightClassName = "max-h-52",
}: {
  title: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  minHeightClassName?: string;
  maxHeightClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const caption = option.caption?.toLowerCase() ?? "";
      return label.includes(normalizedQuery) || caption.includes(normalizedQuery);
    });
  }, [normalizedQuery, options]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
          {title}
        </p>
        {searchEnabled ? (
          <div className="w-full max-w-[15rem]">
            <PixelInput
              clearable
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 px-2 text-xs"
            />
          </div>
        ) : null}
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-[var(--pixel-muted)]">暂无可选项</p>
      ) : filteredOptions.length === 0 ? (
        <div
          className={`space-y-2 overflow-y-auto rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-2 ${minHeightClassName} ${maxHeightClassName}`}
        >
          <p className="px-2 py-1 text-xs text-[var(--pixel-muted)]">无匹配结果</p>
        </div>
      ) : (
        <div
          className={`space-y-2 overflow-y-auto rounded-sm border-2 border-[var(--pixel-border)] bg-[#fffef8] p-2 ${minHeightClassName} ${maxHeightClassName}`}
        >
          {filteredOptions.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1 hover:bg-[var(--pixel-cyan)]/10"
            >
              <input
                type="checkbox"
                checked={selected.has(option.id)}
                onChange={() => onToggle(option.id)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--pixel-accent)]"
              />
              <span className="min-w-0">
                <span className="block text-sm text-[var(--pixel-fg)]">{option.label}</span>
                {option.caption ? (
                  <span className="block text-xs text-[var(--pixel-muted)]">{option.caption}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
