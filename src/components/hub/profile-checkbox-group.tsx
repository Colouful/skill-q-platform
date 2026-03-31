"use client";

import { HUB_PROFILE_OPTIONS } from "@/lib/profile-options";

type ProfileCheckboxGroupProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

function toggleProfile(list: string[], profileId: string): string[] {
  return list.includes(profileId)
    ? list.filter((item) => item !== profileId)
    : [...list, profileId];
}

export function ProfileCheckboxGroup({
  value,
  onChange,
  disabled = false,
}: ProfileCheckboxGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {HUB_PROFILE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="inline-flex items-center gap-2 rounded border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2 text-sm text-[var(--pixel-fg)]"
          >
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              disabled={disabled}
              onChange={() => onChange(toggleProfile(value, option.id))}
            />
            <span className="font-[family-name:var(--font-pixel-body)]">{option.label}</span>
          </label>
        ))}
      </div>
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        不勾选表示 common；勾选后导出到对应 <code>.agents/.../profiles/&lt;profile&gt;</code> 目录。
      </p>
    </div>
  );
}
