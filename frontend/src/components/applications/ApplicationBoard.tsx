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
import { CalendarDays, MapPin, NotebookPen, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INVALIDATE_APPLICATIONS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { APP_STATUS, BOARD_ORDER, CHANNEL } from "@/lib/constants";
import { cn, relativeDays } from "@/lib/utils";
import type { Application, AppStatus, BoardColumn } from "@/types";

type Columns = Record<AppStatus, Application[]>;

const emptyColumns = (): Columns =>
  BOARD_ORDER.reduce((acc, status) => ({ ...acc, [status]: [] }), {} as Columns);

function toColumns(data: BoardColumn[]): Columns {
  const next = emptyColumns();
  for (const column of data) next[column.status] = column.items;
  return next;
}

function findContainer(columns: Columns, id: string): AppStatus | undefined {
  if (BOARD_ORDER.includes(id as AppStatus)) return id as AppStatus;
  const numeric = Number(id);
  return BOARD_ORDER.find((status) => columns[status].some((item) => item.id === numeric));
}

function Card({ app, onOpen }: { app: Application; onOpen: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(app.id),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(app.id)}
      className={cn(
        "group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <p className="text-sm font-medium leading-tight">{app.company}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{app.position}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3" />
          {relativeDays(app.applied_at)}
        </span>
        {app.city ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {app.city}
          </span>
        ) : null}
        {app.question_count > 0 ? (
          <span className="inline-flex items-center gap-1">
            <NotebookPen className="size-3" />
            {app.question_count}
          </span>
        ) : null}
      </div>

      <Badge className="mt-2 bg-muted text-muted-foreground">{CHANNEL[app.channel]}</Badge>
    </div>
  );
}

function Column({
  status,
  items,
  onOpen,
  onAdd,
}: {
  status: AppStatus;
  items: Application[];
  onOpen: (id: number) => void;
  onAdd: (status: AppStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = APP_STATUS[status];

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Badge className={meta.className}>{meta.label}</Badge>
          <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onAdd(status)}
          title={`在「${meta.label}」新建`}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-primary/50 bg-accent" : "border-transparent bg-muted/40",
        )}
      >
        <SortableContext
          items={items.map((item) => String(item.id))}
          strategy={verticalListSortingStrategy}
        >
          {items.map((app) => (
            <Card key={app.id} app={app} onOpen={onOpen} />
          ))}
        </SortableContext>
        {items.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-muted-foreground/70">拖到这里</p>
        ) : null}
      </div>
    </div>
  );
}

export function ApplicationBoard({
  data,
  onAdd,
}: {
  data: BoardColumn[];
  onAdd: (status: AppStatus) => void;
}) {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<Columns>(() => toColumns(data));
  const [activeId, setActiveId] = useState<string | null>(null);

  // 服务端数据回来后重置本地镜像（拖拽过程中不会触发，因为 data 引用不变）
  useEffect(() => setColumns(toColumns(data)), [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const move = useAppMutation(
    (vars: { id: number; status: AppStatus; ordered_ids: number[] }) =>
      api.applications.move(vars.id, { status: vars.status, ordered_ids: vars.ordered_ids }),
    { invalidate: INVALIDATE_APPLICATIONS },
  );

  const activeApp = useMemo(() => {
    if (!activeId) return null;
    const numeric = Number(activeId);
    for (const status of BOARD_ORDER) {
      const found = columns[status].find((item) => item.id === numeric);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  /** 跨列时先在本地把卡片搬过去，拖拽过程中列高才会跟着变 */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const from = findContainer(columns, String(active.id));
    const to = findContainer(columns, String(over.id));
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const moving = prev[from].find((item) => item.id === Number(active.id));
      if (!moving) return prev;
      const overIndex = prev[to].findIndex((item) => item.id === Number(over.id));
      const insertAt = overIndex >= 0 ? overIndex : prev[to].length;
      return {
        ...prev,
        [from]: prev[from].filter((item) => item.id !== moving.id),
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
    const oldIndex = current.findIndex((item) => item.id === Number(active.id));
    const overIndex = current.findIndex((item) => item.id === Number(over.id));
    const next =
      oldIndex >= 0 && overIndex >= 0 && oldIndex !== overIndex
        ? arrayMove(current, oldIndex, overIndex)
        : current;

    setColumns((prev) => ({ ...prev, [target]: next }));
    move.mutate({
      id: Number(active.id),
      status: target,
      ordered_ids: next.map((item) => item.id),
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-4">
        {BOARD_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            items={columns[status]}
            onOpen={(id) => navigate(`/applications/${id}`)}
            onAdd={onAdd}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp ? (
          <div className="w-60 rotate-2 rounded-lg border bg-card p-3 shadow-lg">
            <p className="text-sm font-medium">{activeApp.company}</p>
            <p className="text-xs text-muted-foreground">{activeApp.position}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
