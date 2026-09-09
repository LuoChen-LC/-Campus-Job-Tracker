import { ArrowLeft, ExternalLink, Flag, GitBranch, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { DevLogTimeline } from "@/components/projects/DevLogTimeline";
import { MilestoneList } from "@/components/projects/MilestoneList";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { TaskBoard } from "@/components/projects/TaskBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, Progress, StatTile } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INVALIDATE_PROJECTS, useAppMutation, useProject } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PROJECT_STATUS } from "@/lib/constants";
import { formatDate, percent } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useProject(projectId);
  const [editOpen, setEditOpen] = useState(false);

  const remove = useAppMutation(() => api.projects.remove(projectId), {
    invalidate: INVALIDATE_PROJECTS,
    success: "项目已删除",
    onSuccess: () => navigate("/projects"),
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState message={(error as Error).message} />;
  if (!data) return null;

  const meta = PROJECT_STATUS[data.status];

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5">
        <Link to="/projects">
          <ArrowLeft className="size-4" />
          返回项目列表
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{data.name}</h1>
            <Badge className={meta.className}>{meta.label}</Badge>
          </div>
          {data.summary ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{data.summary}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span>开始 {formatDate(data.started_at)}</span>
            {data.target_at ? (
              <span className="inline-flex items-center gap-1">
                <Flag className="size-3" />
                目标 {formatDate(data.target_at)}
              </span>
            ) : null}
            {data.repo_url ? (
              <a
                href={data.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <GitBranch className="size-3" />
                仓库
              </a>
            ) : null}
            {data.demo_url ? (
              <a
                href={data.demo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="size-3" />
                线上
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex gap-1.5">
          <Button variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm(`删除项目「${data.name}」？里程碑、任务和日志会一起删掉。`)) {
                remove.mutate(undefined);
              }
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="整体进度"
          value={percent(data.progress)}
          sub={`${data.task_done}/${data.task_total} 任务`}
        />
        <StatTile
          label="里程碑"
          value={`${data.milestone_done}/${data.milestone_total}`}
          sub="已完成 / 全部"
        />
        <StatTile label="开发日志" value={data.log_count} sub="篇" />
        <StatTile label="累计投入" value={data.total_hours} sub="小时" />
      </div>

      <Progress value={data.progress} className="h-2" />

      {data.tech_stack ? (
        <div className="flex flex-wrap gap-1.5">
          {data.tech_stack
            .split(/[,，]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => (
              <Badge key={item} className="bg-muted text-muted-foreground">
                {item}
              </Badge>
            ))}
        </div>
      ) : null}

      {data.description ? (
        <p className="whitespace-pre-wrap rounded-xl border bg-card p-4 text-xs leading-relaxed">
          {data.description}
        </p>
      ) : null}

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">任务看板</TabsTrigger>
          <TabsTrigger value="milestones">里程碑</TabsTrigger>
          <TabsTrigger value="logs">开发日志</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TaskBoard projectId={projectId} tasks={data.tasks} milestones={data.milestones} />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestoneList projectId={projectId} milestones={data.milestones} />
        </TabsContent>

        <TabsContent value="logs">
          <DevLogTimeline projectId={projectId} logs={data.logs} />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={data} />
    </div>
  );
}
