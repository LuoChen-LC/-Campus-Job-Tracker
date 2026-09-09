import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Flag, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { INVALIDATE_PROJECTS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PRIORITY, TASK_ORDER, TASK_STATUS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { Milestone, Priority, Task, TaskStatus } from "@/types";

type Columns = Record<TaskStatus, Task[]>;

const TASK_PRIORITIES: Priority[] = ["high", "medium", "low"];

const emptyColumns = (): Columns =>
  TASK_ORDER.reduce((acc, status) => ({ ...acc, [status]: [] }), {} as Columns);

function toColumns(tasks: Task[]): Columns {
  const next = emptyColumns();
  for (const task of tasks) next[task.status].push(task);
  for (const status of TASK_ORDER) next[status].sort((a, b) => a.sort_order - b.sort_order);
  return next;
}

function findContainer(columns: Columns, id: string): TaskStatus | undefined {
  if (TASK_ORDER.includes(id as TaskStatus)) return id as TaskStatus;
  const numeric = Number(id);
  return TASK_ORDER.find((status) => columns[status].some((task) => task.id === numeric));
}

function TaskCard({
  task,
  milestone,
  onRemove,
}: {
  task: Task;
  milestone?: Milestone;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group rounded-lg border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="min-w-0 flex-1 cursor-grab active:cursor-grabbing">
          <p
            className={cn(
              "text-xs font-medium leading-snug",
              task.status === "done" && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onRemove(task.id)}
        >
          <Trash2 className="size-3 text-destructive" />
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge className={PRIORITY[task.priority].className}>
          {PRIORITY[task.priority].label}
        </Badge>
        {milestone ? (
          <Badge className="bg-muted text-muted-foreground">
            <Flag className="size-2.5" />
            {milestone.title}
          </Badge>
        ) : null}
        {task.due_date ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarDays className="size-2.5" />
            {formatDate(task.due_date)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Column({
  status,
  tasks,
  milestones,
  onRemove,
  children,
}: {
  status: TaskStatus;
  tasks: Task[];
  milestones: Milestone[];
  onRemove: (id: number) => void;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = TASK_STATUS[status];

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <Badge className={meta.className}>{meta.label}</Badge>
        <span className="text-xs tabular-nums text-muted-foreground">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-primary/50 bg-accent" : "border-transparent bg-muted/40",
        )}
      >
        <SortableContext
          items={tasks.map((task) => String(task.id))}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              milestone={milestones.find((m) => m.id === task.milestone_id)}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
        {children}
      </div>
    </div>
  );
}

export function TaskBoard({
  projectId,
  tasks,
  milestones,
}: {
  projectId: number;
  tasks: Task[];
  milestones: Milestone[];
}) {
  const [columns, setColumns] = useState<Columns>(() => toColumns(tasks));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");
  const [draftMilestone, setDraftMilestone] = useState("");

  useEffect(() => setColumns(toColumns(tasks)), [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const move = useAppMutation(
    (vars: { id: number; status: TaskStatus; ordered_ids: number[] }) =>
      api.projects.moveTask(projectId, vars.id, {
        status: vars.status,
        ordered_ids: vars.ordered_ids,
      }),
    { invalidate: INVALIDATE_PROJECTS },
  );

  const create = useAppMutation(
    (payload: Record<string, unknown>) => api.projects.addTask(projectId, payload),
    { invalidate: INVALIDATE_PROJECTS, onSuccess: () => setDraft("") },
  );

  const remove = useAppMutation((taskId: number) => api.projects.removeTask(projectId, taskId), {
    invalidate: INVALIDATE_PROJECTS,
  });

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    return tasks.find((task) => task.id === Number(activeId)) ?? null;
  }, [activeId, tasks]);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const from = findContainer(columns, String(active.id));
    const to = findContainer(columns, String(over.id));
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const moving = prev[from].find((task) => task.id === Number(active.id));
      if (!moving) return prev;
      const overIndex = prev[to].findIndex((task) => task.id === Number(over.id));
      const insertAt = overIndex >= 0 ? overIndex : prev[to].length;
      return {
        ...prev,
        [from]: prev[from].filter((task) => task.id !== moving.id),
        [to]: [...prev[to].slice(0, insertAt), moving, ...prev[to].slice(insertAt)],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const target = findContainer(columns, String(over.id));
    if (!target) return;

    const current = columns[target];
    const oldIndex = current.findIndex((task) => task.id === Number(active.id));
    const overIndex = current.findIndex((task) => task.id === Number(over.id));
    const next =
      oldIndex >= 0 && overIndex >= 0 && oldIndex !== overIndex
        ? arrayMove(current, oldIndex, overIndex)
        : current;

    setColumns((prev) => ({ ...prev, [target]: next }));
    move.mutate({
      id: Number(active.id),
      status: target,
      ordered_ids: next.map((task) => task.id),
    });
  };

  const addTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    create.mutate({
      title: draft.trim(),
      status: "todo",
      priority: draftPriority,
      milestone_id: draftMilestone ? Number(draftMilestone) : null,
    });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={addTask} className="flex flex-wrap gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="加一个任务，回车提交"
          className="min-w-[200px] flex-1"
        />
        <Select
          value={draftMilestone}
          onChange={(e) => setDraftMilestone(e.target.value)}
          className="w-40"
        >
          <option value="">不挂里程碑</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </Select>
        <Select
          value={draftPriority}
          onChange={(e) => setDraftPriority(e.target.value as Priority)}
          className="w-24"
        >
          {TASK_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {PRIORITY[value].label}优先
            </option>
          ))}
        </Select>
        <Button type="submit" size="icon" disabled={create.isPending}>
          <Plus className="size-4" />
        </Button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          {TASK_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={columns[status]}
              milestones={milestones}
              onRemove={(id) => remove.mutate(id)}
            >
              {columns[status].length === 0 ? (
                <p className="py-5 text-center text-[11px] text-muted-foreground/70">拖到这里</p>
              ) : null}
            </Column>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-56 rotate-2 rounded-lg border bg-card p-2.5 shadow-lg">
              <p className="text-xs font-medium">{activeTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
