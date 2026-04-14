"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PixelTextarea } from "@/components/pixel";
import { buildRoleTemplatePrompt } from "@/lib/role-template-prompt";

type TemplateOption = {
  id: string;
  name: string;
  slug: string;
};

const fieldGroups = [
  {
    title: "基础信息",
    description: "后台创建专家时最先填写的身份字段。",
    items: [
      "`name`：中文展示名，建议写成“XXX专家”",
      "`slug / id`：英文 kebab-case，后台 `slug` 与 Markdown `id` 保持一致",
      "`author` / `publishStatus` / `roleStatus`：作者、Hub 发布状态、专家状态",
      "`description` / `supportedProfiles` / `tags`：一句话简介、适用 Profile、标签",
    ],
  },
  {
    title: "执行元数据",
    description: "对应角色 frontmatter 和后台执行配置。",
    items: [
      "`domains`：能力域归属，建议与后台关联能力域一致",
      "`triggers` / `preferred_skills`：触发条件与优先技能",
      "`reads` / `writes`：主要读取内容与产出物",
      "`handoff_to`：默认交接对象",
    ],
  },
  {
    title: "正文结构",
    description: "当前项目专家正文需要稳定覆盖的 7 段。",
    items: [
      "`角色定位`：负责什么，不负责什么",
      "`工作原则`：边界、约束、优先级",
      "`必做步骤`：按顺序写清执行动作",
      "`执行契约` / `输出标准` / `禁止事项` / `交接说明`：把协同边界写透",
    ],
  },
  {
    title: "平台补充映射",
    description: "后台真正点选的是关联项 ID，提示词里统一先输出 slug 便于复制。",
    items: [
      "`skillSlugs`：用于对照后台关联 Skill",
      "`ruleSlugs`：用于对照后台附带 Rule",
      "`domainSlugs`：用于对照后台能力域，通常与 `domains` 同步",
      "所有不确定值统一保留 `XXX`，不要漏字段",
    ],
  },
];

function pickReferenceSlugs(items: TemplateOption[], limit = 8): string[] {
  return Array.from(new Set(items.map((item) => item.slug.trim()).filter(Boolean))).slice(0, limit);
}

function renderReferencePills(items: string[]) {
  if (items.length === 0) {
    return <span className="text-xs text-[var(--pixel-muted)]">暂无可参考数据</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-sm border border-[var(--pixel-border)] bg-[var(--pixel-bg)] px-2 py-1 text-xs text-[var(--pixel-fg)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function AdminRolePromptTemplateDialog({
  skills,
  rules,
  domains,
}: {
  skills: TemplateOption[];
  rules: TemplateOption[];
  domains: TemplateOption[];
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const skillReferenceSlugs = useMemo(() => pickReferenceSlugs(skills), [skills]);
  const ruleReferenceSlugs = useMemo(() => pickReferenceSlugs(rules), [rules]);
  const domainReferenceSlugs = useMemo(() => pickReferenceSlugs(domains), [domains]);

  const promptText = useMemo(
    () =>
      buildRoleTemplatePrompt({
        domainSlugs: domains.map((item) => item.slug),
        skillSlugs: skills.map((item) => item.slug),
        ruleSlugs: rules.map((item) => item.slug),
      }),
    [domains, rules, skills],
  );

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success("专家模版提示词已复制");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
        onClick={() => setOpen(true)}
      >
        专家模版提示词
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[92vh] w-[96vw] overflow-hidden rounded-none border-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)] p-0 sm:!max-w-none"
          style={{ width: "min(96vw, 1280px)", maxWidth: "min(96vw, 1280px)" }}
        >
          <div className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b-2 border-[var(--pixel-border)] px-6 pt-6 pb-4">
              <DialogTitle className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
                专家模版提示词
              </DialogTitle>
              <p className="pr-10 text-sm leading-6 text-[var(--pixel-muted)]">
                这里把创建一个专家需要的字段、参数、元数据和正文结构都整理成了可复制指令。
                直接复制右侧提示词，把其中的“XXX专家”替换成目标专家即可。
              </p>
            </DialogHeader>

            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-6 py-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {fieldGroups.map((group) => (
                    <section
                      key={group.title}
                      className="space-y-3 rounded-sm border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] p-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--pixel-fg)]">{group.title}</p>
                        <p className="text-xs leading-5 text-[var(--pixel-muted)]">{group.description}</p>
                      </div>
                      <ul className="space-y-2 text-xs leading-5 text-[var(--pixel-fg)]">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                <section className="space-y-4 rounded-sm border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--pixel-fg)]">当前项目参考</p>
                    <p className="text-xs leading-5 text-[var(--pixel-muted)]">
                      提示词里已经自动带入当前项目可参考的能力域、Skill 和 Rule slug 节选，便于别人直接照着生成。
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-2">
                      <p className="text-[var(--pixel-fg)]">能力域（{domains.length}）</p>
                      {renderReferencePills(domainReferenceSlugs)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[var(--pixel-fg)]">Skill（{skills.length}）</p>
                      {renderReferencePills(skillReferenceSlugs)}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[var(--pixel-fg)]">Rule（{rules.length}）</p>
                      {renderReferencePills(ruleReferenceSlugs)}
                    </div>
                  </div>
                </section>
              </div>

              <section className="flex min-h-0 flex-col space-y-3 rounded-sm border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)] p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--pixel-fg)]">一键复制提示词</p>
                  <p className="text-xs leading-5 text-[var(--pixel-muted)]">
                    复制后可直接发给他人或粘贴给大模型生成专家定义结果。
                  </p>
                </div>
                <PixelTextarea
                  readOnly
                  value={promptText}
                  rows={28}
                  className="min-h-[560px] flex-1 font-mono text-xs leading-6"
                />
              </section>
            </div>

            <div className="flex items-center justify-end border-t-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)] px-6 py-4">
              <Button
                type="button"
                className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
                onClick={() => void copyPrompt()}
              >
                {copied ? "已复制提示词" : "复制提示词"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
