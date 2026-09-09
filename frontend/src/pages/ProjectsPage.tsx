import { CalendarClock, FolderKanban, GitBranch, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Loading, Progress } from "@/components/ui/misc";
import { useProjects } from "@/hooks/useApi";
import { PROJECT_STATUS } from "@/lib/constants";
import { formatDate, percent, relativeDays } from "@/lib/utils";

export default function ProjectsPage() {
  const { data, isLoading, isError, error } = useProjects();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">项目进度</h1>
          <p className="text-xs text-muted-foreground">
            进度按「已完成任务 / 总任务」自动算，不用手动维护百分比
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          新建项目
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={(error as Error).message} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-8" />}
          title="还没有项目"
          description="建一个，然后用里程碑拆阶段、看板管任务、日志记过程。"
          action={<Button onClick={() => setOpen(true)}>新建项目</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data!.map((project) => {
            const meta = PROJECT_STATUS[project.status];
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold leading-snug">{project.name}</h2>
                  <Badge className={meta.className}>{meta.label}</Badge>
                </div>

                {project.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {project.summary}
                  </p>
                ) : null}

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      任务 {project.task_done}/{project.task_total} · 里程碑{" "}
                      {project.milestone_done}/{project.milestone_total}
                    </span>
                    <span className="tabular-nums">{percent(project.progress)}</span>
                  </div>
                  <Progress value={project.progress} />
                </div>

                {project.tech_stack ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.tech_stack
                      .split(/[,，]/)
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((item) => (
                        <Badge key={item} className="bg-muted text-muted-foreground">
                          {item}
                        </Badge>
                      ))}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" />
                    {project.last_log_date
                      ? `最近更新 ${relativeDays(project.last_log_date)}`
                      : `开始于 ${formatDate(project.started_at)}`}
                  </span>
                  <span>{project.log_count} 篇日志</span>
                  {project.total_hours > 0 ? <span>{project.total_hours} 小时</span> : null}
                  {project.repo_url ? (
                    <span className="inline-flex items-center gap-1">
                      <GitBranch className="size-3" />
                      仓库
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
