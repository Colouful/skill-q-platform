"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Overview = {
  agents: number;
  skillsPublished: number;
  rulesPublished: number;
  skillsPending: number;
  rulesPending: number;
  downloadLogs: number;
  reviews: number;
};

type Trends = {
  range: string;
  downloadsByDay: { day: string; count: number }[];
  skillsCreatedByDay: { day: string; count: number }[];
  newAgentsByDay: { day: string; count: number }[];
};

function mergeTrendRows(trends: Trends) {
  const toMap = (arr: { day: string; count: number }[]) =>
    Object.fromEntries(arr.map((x) => [x.day, x.count]));
  const d = toMap(trends.downloadsByDay);
  const s = toMap(trends.skillsCreatedByDay);
  const a = toMap(trends.newAgentsByDay);
  const allDays = [...new Set([...Object.keys(d), ...Object.keys(s), ...Object.keys(a)])].sort();
  return allDays.map((day) => ({
    day,
    downloads: d[day] ?? 0,
    skills: s[day] ?? 0,
    agents: a[day] ?? 0,
  }));
}

export function AdminDashboardCharts({ overview, trends }: { overview: Overview; trends: Trends }) {
  const chartData = mergeTrendRows(trends);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="特工" value={overview.agents} />
        <StatCard label="下载记录（总）" value={overview.downloadLogs} />
        <StatCard label="评测（总）" value={overview.reviews} />
        <StatCard label="已上架 Skill / Rule" value={`${overview.skillsPublished} / ${overview.rulesPublished}`} />
      </div>

      <div className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-3">
        <p className="mb-2 font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          趋势（最近 {trends.range === "7d" ? "7" : trends.range === "30d" ? "30" : "90"} 天）
        </p>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                contentStyle={{
                  background: "#fffef8",
                  border: "2px solid var(--pixel-border)",
                  fontFamily: "var(--font-pixel-body)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="downloads" name="下载" stroke="var(--pixel-cyan)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="skills" name="新建 Skill" stroke="var(--pixel-accent)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="agents" name="新用户" stroke="var(--rule-accent)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3">
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">{label}</p>
      <p className="font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)]">{value}</p>
    </div>
  );
}
