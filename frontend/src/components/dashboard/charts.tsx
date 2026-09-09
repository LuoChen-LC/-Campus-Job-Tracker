import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { APP_STATUS, CHANNEL, MASTERY_LABEL, QUESTION_TYPE } from "@/lib/constants";
import { percent } from "@/lib/utils";
import type {
  AppStatus,
  Channel,
  ChannelStat,
  FunnelStage,
  NamedCount,
  QuestionType,
  WeeklyPoint,
} from "@/types";

const AXIS = { fill: "var(--chart-ink)", fontSize: 11 };
const GRID = "var(--chart-grid)";
const ORDINAL = [
  "var(--ordinal-1)",
  "var(--ordinal-2)",
  "var(--ordinal-3)",
  "var(--ordinal-4)",
  "var(--ordinal-5)",
];

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
};

/** 投递漏斗：越靠后的阶段颜色越深，右侧直接标出相对上一阶段的转化率 */
export function FunnelChart({ data }: { data: FunnelStage[] }) {
  const rows = data.map((stage, index) => ({
    ...stage,
    name: APP_STATUS[stage.stage as AppStatus]?.label ?? stage.stage,
    fill: ORDINAL[Math.min(index, ORDINAL.length - 1)],
  }));

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 40, top: 4 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`${value} 家`, "到达"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16} name="到达">
            {rows.map((row) => (
              <Cell key={row.stage} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {rows.slice(1).map((row) => (
          <span key={row.stage}>
            → {row.name} {percent(row.rate)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 每周投递量。单序列，标题已经说明是什么，不需要图例 */
export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  const rows = data.map((point) => ({
    ...point,
    label: point.week.slice(5).replace("-", "/"),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number) => [`${value} 条`, "投递"]}
          labelFormatter={(label) => `${label} 那周`}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          name="投递"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** 渠道转化：两个序列，必须有图例 */
export function ChannelChart({ data }: { data: ChannelStat[] }) {
  const rows = data
    .slice(0, 6)
    .map((item) => ({
      name: CHANNEL[item.channel as Channel] ?? item.channel,
      total: item.total,
      reached: item.reached_interview,
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--chart-ink)" }} />
        <Bar dataKey="total" name="投递数" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={14} />
        <Bar
          dataKey="reached"
          name="进面数"
          fill="var(--chart-2)"
          radius={[4, 4, 0, 0]}
          barSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function QuestionTypeChart({ data }: { data: NamedCount[] }) {
  const rows = data.map((item) => ({
    name: QUESTION_TYPE[item.key as QuestionType]?.label ?? item.key,
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 16, top: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number) => [`${value} 道`, "题目"]}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={14} name="题目" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 掌握度是有序的，用同一色相由浅到深 */
export function MasteryChart({ data }: { data: NamedCount[] }) {
  const rows = data.map((item) => ({
    name: `${item.key}星`,
    full: MASTERY_LABEL[Number(item.key)] ?? item.key,
    count: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number, _name, entry) => [
            `${value} 道`,
            (entry?.payload as { full?: string })?.full ?? "题目",
          ]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28} name="题目">
          {rows.map((row, index) => (
            <Cell key={row.name} fill={ORDINAL[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
