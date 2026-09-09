import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INVALIDATE_APPLICATIONS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { APP_STATUS, CHANNEL, JOB_TYPE } from "@/lib/constants";
import { formatDate, relativeDays } from "@/lib/utils";
import type { Application } from "@/types";

export function ApplicationTable({
  items,
  onEdit,
}: {
  items: Application[];
  onEdit: (app: Application) => void;
}) {
  const navigate = useNavigate();

  const remove = useAppMutation((id: number) => api.applications.remove(id), {
    invalidate: INVALIDATE_APPLICATIONS,
    success: "已删除（题目会保留，只是解除关联）",
  });

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[840px] text-sm">
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">公司 / 岗位</th>
            <th className="px-3 py-2.5 text-left font-medium">类型</th>
            <th className="px-3 py-2.5 text-left font-medium">渠道</th>
            <th className="px-3 py-2.5 text-left font-medium">城市</th>
            <th className="px-3 py-2.5 text-left font-medium">投递日期</th>
            <th className="px-3 py-2.5 text-left font-medium">阶段</th>
            <th className="px-3 py-2.5 text-left font-medium">最近动静</th>
            <th className="px-3 py-2.5 text-right font-medium">题目</th>
            <th className="w-20 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((app) => (
            <tr
              key={app.id}
              className="cursor-pointer transition-colors hover:bg-muted/40"
              onClick={() => navigate(`/applications/${app.id}`)}
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5 font-medium">
                  {app.company}
                  {app.jd_url ? (
                    <a
                      href={app.jd_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{app.position}</p>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {JOB_TYPE[app.job_type]}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {CHANNEL[app.channel]}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{app.city ?? "—"}</td>
              <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                {formatDate(app.applied_at)}
              </td>
              <td className="px-3 py-2.5">
                <Badge className={APP_STATUS[app.status].className}>
                  {APP_STATUS[app.status].label}
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {relativeDays(app.last_event_at)}
              </td>
              <td className="px-3 py-2.5 text-right text-xs tabular-nums text-muted-foreground">
                {app.question_count || "—"}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(app)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (confirm(`删除「${app.company} · ${app.position}」这条投递？`)) {
                        remove.mutate(app.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
