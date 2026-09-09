import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { INVALIDATE_PROJECTS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PROJECT_STATUS, toOptions } from "@/lib/constants";
import { todayISO } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

const EMPTY = {
  name: "",
  summary: "",
  tech_stack: "",
  repo_url: "",
  demo_url: "",
  status: "active" as ProjectStatus,
  started_at: todayISO(),
  target_at: "",
  description: "",
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}) {
  const [form, setForm] = useState(EMPTY);
  const editing = Boolean(project);

  useEffect(() => {
    if (!open) return;
    setForm(
      project
        ? {
            name: project.name,
            summary: project.summary ?? "",
            tech_stack: project.tech_stack ?? "",
            repo_url: project.repo_url ?? "",
            demo_url: project.demo_url ?? "",
            status: project.status,
            started_at: project.started_at ?? todayISO(),
            target_at: project.target_at ?? "",
            description: project.description ?? "",
          }
        : { ...EMPTY, started_at: todayISO() },
    );
  }, [open, project]);

  const save = useAppMutation(
    (payload: Record<string, unknown>) =>
      project ? api.projects.update(project.id, payload) : api.projects.create(payload),
    {
      invalidate: INVALIDATE_PROJECTS,
      success: editing ? "已更新" : "项目已创建",
      onSuccess: () => onOpenChange(false),
    },
  );

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    save.mutate({
      name: form.name.trim(),
      summary: form.summary || null,
      tech_stack: form.tech_stack || null,
      repo_url: form.repo_url || null,
      demo_url: form.demo_url || null,
      status: form.status,
      started_at: form.started_at || null,
      target_at: form.target_at || null,
      description: form.description || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "编辑项目" : "新建项目"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label="项目名 *">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
              required
            />
          </Field>

          <Field label="一句话简介" hint="简历上那句，写在这里方便随时打磨">
            <Input value={form.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>

          <Field label="技术栈" hint="逗号分隔">
            <Input
              value={form.tech_stack}
              onChange={(e) => set("tech_stack", e.target.value)}
              placeholder="React, FastAPI, PostgreSQL"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="仓库地址">
              <Input value={form.repo_url} onChange={(e) => set("repo_url", e.target.value)} />
            </Field>
            <Field label="线上地址">
              <Input value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} />
            </Field>
            <Field label="状态">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProjectStatus)}
              >
                {toOptions(PROJECT_STATUS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="开始日期">
              <Input
                type="date"
                value={form.started_at}
                onChange={(e) => set("started_at", e.target.value)}
              />
            </Field>
            <Field label="目标完成">
              <Input
                type="date"
                value={form.target_at}
                onChange={(e) => set("target_at", e.target.value)}
              />
            </Field>
          </div>

          <Field label="详细描述">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
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
