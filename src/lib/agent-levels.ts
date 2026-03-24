/** 特工等级与默认 API 限额（经验规则后续可接 uploads/reviews 事件） */

export const AGENT_LEVEL_MIN = 1;
export const AGENT_LEVEL_MAX = 4;

/** 经验阈值（下限，含）：0 → Lv.1，500 → Lv.2，2000 → Lv.3，10000 → Lv.4 */
export const LEVEL_XP_THRESHOLDS = [0, 500, 2000, 10000] as const;

export const LEVEL_DISPLAY_NAMES = ["见习特工", "初级特工", "资深特工", "王牌特工"] as const;

export interface AgentLevel {
  level: number;
  levelName: string;
  minXp: number;
  /** 下一等级所需最低经验；Lv.4 为 null */
  nextThresholdXp: number | null;
}

export const LEVEL_RATE_LIMIT_PER_HOUR: Record<number, number> = {
  1: 100,
  2: 500,
  3: 2000,
  4: 10000,
};

export function rateLimitForAgentLevel(level: number): number {
  const l = Math.min(AGENT_LEVEL_MAX, Math.max(AGENT_LEVEL_MIN, level));
  return LEVEL_RATE_LIMIT_PER_HOUR[l] ?? LEVEL_RATE_LIMIT_PER_HOUR[1];
}

export function levelStateFromExperience(experience: number): {
  level: number;
  levelName: string;
} {
  const xp = Math.max(0, experience);
  let level = AGENT_LEVEL_MAX;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const idx = Math.min(level - 1, LEVEL_DISPLAY_NAMES.length - 1);
  return { level, levelName: LEVEL_DISPLAY_NAMES[idx] };
}

/** 与任务书一致的 `calculateLevel`：根据经验得到等级与名称 */
export function calculateLevel(experience: number): AgentLevel {
  const { level, levelName } = levelStateFromExperience(experience);
  const minXp = LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
  const nextThresholdXp =
    level >= AGENT_LEVEL_MAX ? null : (LEVEL_XP_THRESHOLDS[level] ?? null);
  return { level, levelName, minXp, nextThresholdXp };
}

export function getLevelBenefits(level: number): string[] {
  const l = Math.min(AGENT_LEVEL_MAX, Math.max(AGENT_LEVEL_MIN, level));
  const hourly = rateLimitForAgentLevel(l);
  return [
    `每小时 API 调用上限约 ${hourly} 次（按等级默认配额）`,
    `Lv.${l} · ${LEVEL_DISPLAY_NAMES[l - 1]}`,
  ];
}

export function getNextLevelRequirements(experience: number): {
  currentLevel: number;
  nextLevel: number | null;
  xpToNext: number | null;
} {
  const { level } = levelStateFromExperience(experience);
  if (level >= AGENT_LEVEL_MAX) {
    return { currentLevel: level, nextLevel: null, xpToNext: null };
  }
  const next = level + 1;
  const need = LEVEL_XP_THRESHOLDS[next - 1];
  const xpToNext = Math.max(0, need - experience);
  return { currentLevel: level, nextLevel: next, xpToNext };
}
