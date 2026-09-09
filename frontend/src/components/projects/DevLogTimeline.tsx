import { AlertTriangle, Clock, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { INVALIDATE_PROJECTS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { formatDate, relativeDays, todayISO } from "@/lib/utils";
import type { DevLog } from "@/types";

export function DevLogTimeline({
  projectId,
  logs,
}: {
  projectId: number;
  logs: DevLog[];
}) {
  const [content, setContent] = useState("");
  const [blockers, setBlockers] = useState("");
  const [hours, setHours] = useState("");
  const [logDate, setLogDate] = useState(todayISO());

  const create = useAppMutation(
    (payload: Record<string, unknown>) => api.projects.addLog(projectId, payload),
    {
      invalidate: INVALIDATE_PROJECTS,
      success: "已记录",
      onSuccess: () => {
        setContent("");
        setBlockers("");
        setHours("");
      },
    },
  );

  const remove = useAppMutation((logId: number) => api.projects.removeLog(projectId, logId), {
    invalidate: INVALIDATE_PROJECTS,
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    create.mutate({
      log_date: logDate || null,
      content: content.trim(),
      blockers: blockers || null,
      hours_spent: hours ? Number(hours) : null,
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
        <Field label="今天做了什么" hint="写具体一点，秋招写简历时这里就是素材库">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="把看板拖拽接上后端 move 接口，顺手让拖动自动补一条时间线事件"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="日期">
            <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          </Field>
          <Field label="耗时（小时）">
            <Input
              type="number"
              step="0.5"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="3.5"
            />
          </Field>
          <Field label="卡住的地方" className="col-span-2">
            <Input
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="拖拽跨列时列高抖动，还没解决"
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending || !content.trim()}>
            记一笔
          </Button>
        </div>
      </form>

      {logs.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
          还没有日志
        </p>
      ) : (
        <ol className="relative space-y-4 border-l pl-5">
          {logs.map((log) => (
            <li key={log.id} className="group relative">
              <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium tabular-nums">
                  {formatDate(log.log_date)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {relativeDays(log.log_date)}
                </span>
                {log.hours_spent ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {log.hours_spent} 小时
                  </span>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    if (confirm("删除这条日志？")) remove.mutate(log.id);
                  }}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>

              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed">{log.content}</p>

              {log.blockers ? (
                <p className="mt-1.5 inline-flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  {log.blockers}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
