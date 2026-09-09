import { useEffect, useState } from "react";

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
import {
  INVALIDATE_APPLICATIONS,
  useAppMutation,
} from "@/hooks/useApi";
import { api } from "@/lib/api";
import { APP_STATUS, CHANNEL, JOB_TYPE, toOptions } from "@/lib/constants";
import { todayISO } from "@/lib/utils";
import type { Application, AppStatus } from "@/types";

const EMPTY = {
  company: "",
  position: "",
  job_type: "intern",
  channel: "official",
  city: "",
  salary: "",
  jd_url: "",
  referrer: "",
  applied_at: todayISO(),
  status: "applied" as AppStatus,
  notes: "",
};

type FormState = typeof EMPTY;

function fromApplication(app: Application): FormState {
  return {
    company: app.company,
    position: app.position,
    job_type: app.job_type,
    channel: app.channel,
    city: app.city ?? "",
    salary: app.salary ?? "",
    jd_url: app.jd_url ?? "",
    referrer: app.referrer ?? "",
    applied_at: app.applied_at,
    status: app.status,
    notes: app.notes ?? "",
  };
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
  defaultStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application;
  defaultStatus?: AppStatus;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const editing = Boolean(application);

  useEffect(() => {
    if (!open) return;
    setForm(
      application
        ? fromApplication(application)
        : { ...EMPTY, status: defaultStatus ?? "applied", applied_at: todayISO() },
    );
  }, [open, application, defaultStatus]);

  const save = useAppMutation(
    (payload: Record<string, unknown>) =>
      application
        ? api.applications.update(application.id, payload)
        : api.applications.create(payload),
    {
      invalidate: INVALIDATE_APPLICATIONS,
      success: editing ? "已更新" : "已记下这条投递",
      onSuccess: () => onOpenChange(false),
    },
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.company.trim() || !form.position.trim()) return;
    // 空字符串统一转 null，免得后端存下一堆 ""
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        typeof value === "string" && value.trim() === "" ? null : value,
      ]),
    );
    save.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑投递" : "记一条投递"}</DialogTitle>
          <DialogDescription>
            公司和岗位必填，其余留空也行。新建时会自动在时间线上补一条起点事件。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="公司 *">
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="字节跳动"
                autoFocus
                required
              />
            </Field>
            <Field label="岗位 *">
              <Input
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="后端开发实习生"
                required
              />
            </Field>
            <Field label="类型">
              <Select
                value={form.job_type}
                onChange={(e) => set("job_type", e.target.value)}
              >
                {toOptions(JOB_TYPE).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="渠道">
              <Select value={form.channel} onChange={(e) => set("channel", e.target.value)}>
                {toOptions(CHANNEL).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="城市">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="薪资 / 日薪">
              <Input
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
                placeholder="300/天"
              />
            </Field>
            <Field label="投递日期">
              <Input
                type="date"
                value={form.applied_at}
                onChange={(e) => set("applied_at", e.target.value)}
              />
            </Field>
            <Field label="当前阶段">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as AppStatus)}
              >
                {toOptions(APP_STATUS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="内推人">
              <Input value={form.referrer} onChange={(e) => set("referrer", e.target.value)} />
            </Field>
            <Field label="JD 链接">
              <Input
                value={form.jd_url}
                onChange={(e) => set("jd_url", e.target.value)}
                placeholder="https://"
              />
            </Field>
          </div>

          <Field label="备注">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="部门、base、HR 联系方式、要注意的东西…"
              rows={3}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
