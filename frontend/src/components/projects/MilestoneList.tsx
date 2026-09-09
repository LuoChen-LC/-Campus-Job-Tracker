import { Check, Flag, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/misc";
import { INVALIDATE_PROJECTS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Milestone } from "@/types";

export function MilestoneList({
  projectId,
  milestones,
}: {
  projectId: number;
  milestones: Milestone[];
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const create = useAppMutation(
    (payload: Record<string, unknown>) => api.projects.addMilestone(projectId, payload),
    {
      invalidate: INVALIDATE_PROJECTS,
      onSuccess: () => {
        setTitle("");
        setDueDate("");
      },
    },
  );

  const update = useAppMutation(
    (vars: { id: number; body: Record<string, unknown> }) =>
      api.projects.updateMilestone(projectId, vars.id, vars.body),
    { invalidate: INVALIDATE_PROJECTS },
  );

  const remove = useAppMutation(
    (id: number) => api.projects.removeMilestone(projectId, id),
    { invalidate: INVALIDATE_PROJECTS, success: "已删除（下面的任务会解绑保留）" },
  );

  return (
    <div className="space-y-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          create.mutate({ title: title.trim(), due_date: dueDate || null });
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="加一个里程碑，比如「核心功能可用」"
          className="min-w-[200px] flex-1"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-40"
        />
        <Button type="submit" size="icon" disabled={create.isPending}>
          <Plus className="size-4" />
        </Button>
      </form>

      {milestones.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
          还没有里程碑。挂了任务的里程碑会在任务全部完成时自动打勾。
        </p>
      ) : (
        <ul className="space-y-2">
          {milestones.map((milestone) => {
            const ratio = milestone.task_total
              ? milestone.task_done / milestone.task_total
              : milestone.done
                ? 1
                : 0;
            return (
              <li
                key={milestone.id}
                className="group flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <button
                  onClick={() =>
                    update.mutate({ id: milestone.id, body: { done: !milestone.done } })
                  }
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                    milestone.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-input hover:border-primary",
                  )}
                  aria-label="切换完成"
                >
                  {milestone.done ? <Check className="size-3" /> : null}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        milestone.done && "text-muted-foreground line-through",
                      )}
                    >
                      {milestone.title}
                    </span>
                    {milestone.due_date ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Flag className="size-3" />
                        {formatDate(milestone.due_date)}
                      </span>
                    ) : null}
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {milestone.task_done}/{milestone.task_total} 任务
                    </span>
                  </div>
                  <Progress value={ratio} className="mt-2" />
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    if (confirm(`删除里程碑「${milestone.title}」？`)) remove.mutate(milestone.id);
                  }}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
