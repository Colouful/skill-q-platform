/**
 * 龙虾像素素材（openspec: lobster-mascot）— SVG + globals.css 动画
 */
import { cn } from "@/lib/utils";

const shell = "#e74c3c";
const claw = "#c0392b";
const eye = "#fffef8";
const qYellow = "#ffe66d";

/** 单枚龙虾钳（用于评分等） — 15.7 */
export function LobsterClawIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  const fill = filled ? claw : "#b0bec5";
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block shrink-0", className)}
      aria-hidden
    >
      <rect x="6" y="8" width="8" height="6" fill={fill} />
      <rect x="2" y="4" width="6" height="6" fill={fill} />
      <rect x="4" y="2" width="4" height="4" fill={fill} />
    </svg>
  );
}

/** 15.1 主吉祥物：走路 Sprite（动画见 .lobster-walk） */
export function LobsterWalk({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("lobster-walk text-[var(--pixel-fg)]", className)}
      aria-hidden
    >
      <rect x="10" y="12" width="12" height="10" fill={shell} />
      <rect x="8" y="14" width="4" height="4" fill={claw} />
      <rect x="20" y="14" width="4" height="4" fill={claw} />
      <rect x="12" y="8" width="2" height="4" fill={claw} />
      <rect x="18" y="8" width="2" height="4" fill={claw} />
      <rect x="13" y="14" width="2" height="2" fill={eye} />
      <rect x="17" y="14" width="2" height="2" fill={eye} />
      <rect x="14" y="22" width="2" height="4" fill={claw} />
      <rect x="16" y="22" width="2" height="4" fill={claw} />
    </svg>
  );
}

/** 15.1 别名：主视觉与 LobsterWalk 相同 */
export function LobsterMascot({ className }: { className?: string }) {
  return <LobsterWalk className={className} />;
}

/** 15.2 / 加载：走路动画 + 文案 */
export function LobsterLoading({
  className,
  label = "加载中…",
}: {
  className?: string;
  /** 给屏幕阅读器与 aria-live */
  label?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <LobsterWalk className="h-14 w-14" />
      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        {label}
      </p>
    </div>
  );
}

/** 15.4 庆祝（举小旗）— 成功场景可与 LobsterSuccess 互换 */
export function LobsterCelebrate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("lobster-bounce", className)} aria-hidden>
      <rect x="10" y="10" width="12" height="10" fill={shell} />
      <rect x="6" y="8" width="6" height="4" fill={claw} />
      <rect x="20" y="8" width="6" height="4" fill={claw} />
      <rect x="13" y="12" width="2" height="2" fill={eye} />
      <rect x="17" y="12" width="2" height="2" fill={eye} />
      <rect x="14" y="6" width="4" height="2" fill={qYellow} />
    </svg>
  );
}

/** 15.4 成功庆祝（与 LobsterCelebrate 相同，语义化命名） */
export const LobsterSuccess = LobsterCelebrate;

/** 15.5 困惑 / 错误小插画 */
export function LobsterError({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-16 w-16", className)} aria-hidden>
      <rect x="10" y="12" width="12" height="10" fill={shell} />
      <rect x="8" y="14" width="4" height="4" fill={claw} />
      <rect x="20" y="14" width="4" height="4" fill={claw} />
      <rect x="13" y="14" width="2" height="2" fill="#2c3e50" />
      <rect x="17" y="14" width="2" height="2" fill="#2c3e50" />
      <rect x="12" y="22" width="8" height="2" fill={claw} />
    </svg>
  );
}

const shellRule = "#7d6f8a";
const clawRule = "#5d4f6e";

/** 15.3 空状态：摊手龙虾 + 可配置文案（默认对齐 spec） */
export function LobsterEmpty({
  className,
  message = "空空如也，来上传第一个 Skill 吧！",
  tone = "skill",
}: {
  className?: string;
  /** 空状态说明；分类页等可传入自定义句 */
  message?: string;
  /** Rule 场景使用紫色系龙虾 */
  tone?: "skill" | "rule";
}) {
  const s = tone === "rule" ? shellRule : shell;
  const c = tone === "rule" ? clawRule : claw;
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg viewBox="0 0 48 48" className="h-24 w-24 shrink-0" aria-hidden>
        <rect x="16" y="18" width="16" height="14" fill={s} />
        <rect x="10" y="22" width="8" height="6" fill={c} />
        <rect x="30" y="22" width="8" height="6" fill={c} />
        <rect x="20" y="22" width="3" height="3" fill={eye} />
        <rect x="25" y="22" width="3" height="3" fill={eye} />
        <rect x="18" y="32" width="12" height="2" fill={c} />
        <rect x="20" y="38" width="8" height="2" fill={c} />
      </svg>
      <p className="max-w-sm text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        {message}
      </p>
    </div>
  );
}

/** 迷路插画：头顶像素问号 + 小龙虾 */
function LobsterLostIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-24 w-24 text-[var(--pixel-fg)]", className)} aria-hidden>
      <rect x="18" y="4" width="12" height="4" fill={qYellow} />
      <rect x="28" y="8" width="4" height="12" fill={qYellow} />
      <rect x="18" y="20" width="8" height="4" fill={qYellow} />
      <rect x="22" y="24" width="4" height="8" fill={qYellow} />
      <rect x="14" y="30" width="20" height="12" fill={shell} />
      <rect x="8" y="32" width="8" height="6" fill={claw} />
      <rect x="32" y="32" width="8" height="6" fill={claw} />
      <rect x="18" y="34" width="3" height="3" fill={eye} />
      <rect x="25" y="34" width="3" height="3" fill={eye} />
    </svg>
  );
}

/** 15.6 404：迷路插画 + 文案（spec） */
export function Lobster404({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-12", className)}>
      <LobsterLostIllustration />
      <p className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        404
      </p>
      <p className="text-center font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
        哎呀，龙虾迷路了...
      </p>
    </div>
  );
}
