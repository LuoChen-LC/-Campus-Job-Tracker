import { BriefcaseBusiness, KanbanSquare, Plus, Search, Table2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ApplicationBoard } from "@/components/applications/ApplicationBoard";
import { ApplicationFormDialog } from "@/components/applications/ApplicationFormDialog";
import { ApplicationTable } from "@/components/applications/ApplicationTable";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, ErrorState, Loading } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApplications, useBoard } from "@/hooks/useApi";
import { JOB_TYPE, toOptions } from "@/lib/constants";
import type { Application, AppStatus } from "@/types";

export default function ApplicationsPage() {
  const [view, setView] = useState("board");
  const [keyword, setKeyword] = useState("");
  const [jobType, setJobType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Application | undefined>();
  const [defaultStatus, setDefaultStatus] = useState<AppStatus | undefined>();

  const filters = useMemo(
    () => ({ q: keyword || undefined, job_type: jobType || undefined }),
    [keyword, jobType],
  );

  const board = useBoard(filters);
  const list = useApplications(filters);

  const openCreate = (status?: AppStatus) => {
    setEditing(undefined);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const openEdit = (app: Application) => {
    setEditing(app);
    setDefaultStatus(undefined);
    setDialogOpen(true);
  };

  const total = board.data?.reduce((sum, column) => sum + column.items.length, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">投递记录</h1>
          <p className="text-xs text-muted-foreground">
            拖动卡片换阶段，会自动在这条投递的时间线上补一笔
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-1.5">
          <Plus className="size-4" />
          记一条投递
        </Button>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="board">
              <KanbanSquare className="size-3.5" />
              看板
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 className="size-3.5" />
              表格
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜公司 / 岗位"
              className="h-9 w-48 pl-8"
            />
          </div>

          <Select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="h-9 w-28"
          >
            <option value="">全部类型</option>
            {toOptions(JOB_TYPE).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>

          <span className="ml-auto text-xs text-muted-foreground">共 {total} 条</span>
        </div>

        <TabsContent value="board">
          {board.isLoading ? (
            <Loading />
          ) : board.isError ? (
            <ErrorState message={(board.error as Error).message} />
          ) : total === 0 ? (
            <EmptyState
              icon={<BriefcaseBusiness className="size-8" />}
              title="还没有投递记录"
              description="从右上角记下第一条，之后每次状态变化都会留下时间线。"
              action={<Button onClick={() => openCreate()}>记一条投递</Button>}
            />
          ) : (
            <ApplicationBoard data={board.data!} onAdd={openCreate} />
          )}
        </TabsContent>

        <TabsContent value="table">
          {list.isLoading ? (
            <Loading />
          ) : list.isError ? (
            <ErrorState message={(list.error as Error).message} />
          ) : (list.data?.length ?? 0) === 0 ? (
            <EmptyState title="没有匹配的投递" description="换个关键词或类型试试。" />
          ) : (
            <ApplicationTable items={list.data!} onEdit={openEdit} />
          )}
        </TabsContent>
      </Tabs>

      <ApplicationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={editing}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
