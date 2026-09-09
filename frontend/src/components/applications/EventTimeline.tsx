import { Clock, Pencil, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { INVALIDATE_APPLICATIONS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { EVENT_RESULT, EVENT_TYPE, toOptions } from "@/lib/constants";
import { formatDateTime, toLocalInput } from "@/lib/utils";
import type { ApplicationEvent, EventResult, EventType } from "@/types";

const EMPTY = {
  event_type: "interview_1" as EventType,
  result: "pending" as EventResult,
  happened_at: "",
  duration_minutes: "",
  interviewer: "",
  notes: "",
};

function EventDialog({
  applicationId,
  event,
  open,
  onOpenChange,
}: {
  applicationId: number;
  event?: ApplicationEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const editing = Boolean(event);

  useEffect(() => {
    if (!open) return;
    setForm(
      event
        ? {
            event_type: event.event_type,
            result: event.result,
            happened_at: toLocalInput(event.happened_at),
            duration_minutes: event.duration_minutes ? String(event.duration_minutes) : "",
            interviewer: event.interviewer ?? "",
            notes: event.notes ?? "",
          }
        : { ...EMPTY, happened_at: toLocalInput() },
    );
  }, [open, event]);

  const save = useAppMutation(
    (payload: Record<string, unknown>) =>
      event
        ? api.applications.updateEvent(applicationId, event.id, payload)
        : api.applications.addEvent(applicationId, payload),
    {
      invalidate: INVALIDATE_APPLICATIONS,
      success: editing ? "已更新" : "已记入时间线",
      onSuccess: () => onOpenChange(false),
    },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({
      event_type: form.event_type,
      result: form.result,
      happened_at: form.happened_at ? new Date(form.happened_at).toISOString() : undefined,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      interviewer: form.interviewer || null,
      notes: form.notes || null,
      // 新建时顺手把投递的当前阶段推到这一轮
      ...(editing ? {} : { sync_status: true }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "编辑节点" : "加一个时间线节点"}</DialogTitle>
          <DialogDescription>
            {editing ? "改完不会动投递的当前阶段。" : "新增时会把投递的当前阶段同步推进到这一轮。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="轮次">
              <Select
                value={form.event_type}
                onChange={(e) =>
                  setForm({ ...form, event_type: e.target.value as EventType })
                }
              >
                {toOptions(EVENT_TYPE).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="结果">
              <Select
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value as EventResult })}
              >
                {toOptions(EVENT_RESULT).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="时间">
              <Input
                type="datetime-local"
                value={form.happened_at}
                onChange={(e) => setForm({ ...form, happened_at: e.target.value })}
              />
            </Field>
            <Field label="时长（分钟）">
              <Input
                type="number"
                min={0}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                placeholder="60"
              />
            </Field>
          </div>

          <Field label="面试官 / 部门">
            <Input
              value={form.interviewer}
              onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
              placeholder="推荐架构组 · 王工"
            />
          </Field>

          <Field label="复盘" hint="答得怎么样、哪里卡住了、下次要补什么">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={save.isPending}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EventTimeline({
  applicationId,
  events,
}: {
  applicationId: number;
  events: ApplicationEvent[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationEvent | undefined>();

  const remove = useAppMutation(
    (eventId: number) => api.applications.removeEvent(applicationId, eventId),
    { invalidate: INVALIDATE_APPLICATIONS, success: "已删除" },
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">时间线</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          加一轮
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
          还没有节点
        </p>
      ) : (
        <ol className="relative space-y-4 border-l pl-5">
          {events.map((event) => (
            <li key={event.id} className="group relative">
              <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{EVENT_TYPE[event.event_type]}</span>
                <Badge className={EVENT_RESULT[event.result].className}>
                  {EVENT_RESULT[event.result].label}
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(event.happened_at)}
                </span>

                <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditing(event);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (confirm("删除这个节点？")) remove.mutate(event.id);
                    }}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {event.duration_minutes ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {event.duration_minutes} 分钟
                  </span>
                ) : null}
                {event.interviewer ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" />
                    {event.interviewer}
                  </span>
                ) : null}
              </div>

              {event.notes ? (
                <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed">
                  {event.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <EventDialog
        applicationId={applicationId}
        event={editing}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
