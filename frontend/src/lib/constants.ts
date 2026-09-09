import type {
  AppStatus,
  Channel,
  EventResult,
  EventType,
  JobType,
  Priority,
  ProjectStatus,
  QuestionType,
  TaskStatus,
} from "@/types";

type Meta = { label: string; className: string };

export const APP_STATUS: Record<AppStatus, Meta> = {
  wishlist: { label: "想投", className: "bg-slate-100 text-slate-700 border-slate-200" },
  applied: { label: "已投递", className: "bg-blue-50 text-blue-700 border-blue-200" },
  written_test: { label: "笔试", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  interview_1: { label: "一面", className: "bg-violet-50 text-violet-700 border-violet-200" },
  interview_2: { label: "二面", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  interview_3: { label: "三面", className: "bg-purple-50 text-purple-700 border-purple-200" },
  hr: { label: "HR面", className: "bg-amber-50 text-amber-700 border-amber-200" },
  offer: { label: "Offer", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pool: { label: "泡池子", className: "bg-orange-50 text-orange-700 border-orange-200" },
  rejected: { label: "已挂", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

/** 看板列顺序 */
export const BOARD_ORDER: AppStatus[] = [
  "wishlist",
  "applied",
  "written_test",
  "interview_1",
  "interview_2",
  "interview_3",
  "hr",
  "offer",
  "pool",
  "rejected",
];

export const JOB_TYPE: Record<JobType, string> = {
  intern: "实习",
  autumn: "秋招",
  spring: "春招",
  social: "社招",
};

export const CHANNEL: Record<Channel, string> = {
  official: "官网",
  boss: "BOSS直聘",
  referral: "内推",
  nowcoder: "牛客",
  liepin: "猎聘",
  maimai: "脉脉",
  campus_talk: "宣讲会",
  other: "其他",
};

export const EVENT_TYPE: Record<EventType, string> = {
  apply: "投递",
  written_test: "笔试",
  interview_1: "一面",
  interview_2: "二面",
  interview_3: "三面",
  hr: "HR面",
  offer: "Offer",
  reject: "被拒",
  pool: "进池子",
  other: "其他",
};

export const EVENT_RESULT: Record<EventResult, Meta> = {
  pending: { label: "待结果", className: "bg-slate-100 text-slate-600 border-slate-200" },
  passed: { label: "通过", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "未通过", className: "bg-rose-50 text-rose-700 border-rose-200" },
  na: { label: "不适用", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export const QUESTION_TYPE: Record<QuestionType, Meta> = {
  algorithm: { label: "算法题", className: "bg-blue-50 text-blue-700 border-blue-200" },
  fundamentals: { label: "八股", className: "bg-violet-50 text-violet-700 border-violet-200" },
  project: { label: "项目追问", className: "bg-amber-50 text-amber-700 border-amber-200" },
  system_design: { label: "场景设计", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  sql: { label: "SQL", className: "bg-teal-50 text-teal-700 border-teal-200" },
  hr: { label: "HR题", className: "bg-pink-50 text-pink-700 border-pink-200" },
  puzzle: { label: "智力题", className: "bg-orange-50 text-orange-700 border-orange-200" },
  other: { label: "其他", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export const PROJECT_STATUS: Record<ProjectStatus, Meta> = {
  planning: { label: "规划中", className: "bg-slate-100 text-slate-700 border-slate-200" },
  active: { label: "进行中", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paused: { label: "暂停", className: "bg-amber-50 text-amber-700 border-amber-200" },
  done: { label: "已完成", className: "bg-blue-50 text-blue-700 border-blue-200" },
  archived: { label: "已归档", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export const TASK_STATUS: Record<TaskStatus, Meta> = {
  todo: { label: "待办", className: "bg-slate-100 text-slate-700 border-slate-200" },
  doing: { label: "进行中", className: "bg-blue-50 text-blue-700 border-blue-200" },
  done: { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const TASK_ORDER: TaskStatus[] = ["todo", "doing", "done"];

export const PRIORITY: Record<Priority, Meta> = {
  low: { label: "低", className: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "中", className: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "高", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const MASTERY_LABEL = ["", "完全不会", "有印象", "能答个大概", "答得比较全", "闭眼秒"];

export function entries<T extends Record<string, unknown>>(record: T) {
  return Object.entries(record) as [keyof T & string, T[keyof T]][];
}

/** 把 Record<string, Meta | string> 转成 <Select> 用的选项 */
export function toOptions(record: Record<string, Meta | string>) {
  return Object.entries(record).map(([value, meta]) => ({
    value,
    label: typeof meta === "string" ? meta : meta.label,
  }));
}
