import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import {
  ChannelChart,
  FunnelChart,
  MasteryChart,
  QuestionTypeChart,
  WeeklyChart,
} from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, Loading, Progress, StatTile } from "@/components/ui/misc";
import { useDashboard } from "@/hooks/useApi";
import { CHANNEL, PROJECT_STATUS } from "@/lib/constants";
import { percent } from "@/lib/utils";
import type { Channel, ProjectStatus } from "@/types";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState message={(error as Error).message} />;
  if (!data) return null;

  const hasApplications = data.total_applications > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">总览</h1>
        <p className="text-xs text-muted-foreground">投递、题目、项目三块的当前状况</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="总投递" value={data.total_applications} />
        <StatTile label="流程进行中" value={data.active_applications} />
        <StatTile
          label="Offer"
          value={data.offer_count}
          tone={data.offer_count > 0 ? "positive" : "default"}
        />
        <StatTile label="已挂" value={data.rejected_count} tone="negative" />
        <StatTile label="面试轮次" value={data.interview_count} sub="累计" />
        <StatTile
          label="首次回音"
          value={data.avg_days_to_first_response ?? "—"}
          sub="平均天数"
        />
      </div>

      {!hasApplications ? (
        <EmptyState
          title="还没有数据"
          description="先去「投递记录」记一条，这里的漏斗和转化率就会自己长出来。"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 一条投递都没有时，空坐标轴没有信息量，上面的提示已经说清楚了 */}
        {hasApplications ? (
          <>
          <Card>
            <CardHeader>
              <CardTitle>投递漏斗</CardTitle>
              <CardDescription>
                每个阶段到达的公司数，取自各条投递的时间线；下方是相对上一阶段的转化率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelChart data={data.funnel} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>每周投递量</CardTitle>
              <CardDescription>最近 12 周</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyChart data={data.weekly_applications} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>各渠道效果</CardTitle>
              <CardDescription>投出去多少，其中多少走到了面试</CardDescription>
            </CardHeader>
            <CardContent>
              {data.channel_stats.length === 0 ? (
                <p className="py-12 text-center text-xs text-muted-foreground">暂无数据</p>
              ) : (
                <>
                  <ChannelChart data={data.channel_stats} />
                  <div className="mt-3 space-y-1">
                    {data.channel_stats.slice(0, 6).map((item) => (
                      <div
                        key={item.channel}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-muted-foreground">
                          {CHANNEL[item.channel as Channel] ?? item.channel}
                        </span>
                        <span className="tabular-nums">
                          {item.reached_interview}/{item.total} 进面 ·{" "}
                          <span className="font-medium">{percent(item.conversion)}</span>
                          {item.offers > 0 ? ` · ${item.offers} offer` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          </>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>题目分布</CardTitle>
            <CardDescription>
              共 {data.total_questions} 道，其中 {data.need_review_count} 道待复习
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.total_questions === 0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">还没记题</p>
            ) : (
              <>
                <QuestionTypeChart data={data.question_types} />
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">掌握度分布</p>
                  <MasteryChart data={data.mastery_distribution} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>高频标签</CardTitle>
            <CardDescription>被问得最多的知识点，优先复习这些</CardDescription>
          </CardHeader>
          <CardContent>
            {data.top_tags.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">还没有标签</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.top_tags.map((tag) => (
                  <Badge key={tag.key} className="bg-muted text-muted-foreground">
                    {tag.key}
                    <span className="tabular-nums opacity-60">{tag.count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>项目进度</CardTitle>
              <CardDescription>本周已投入 {data.logged_hours_this_week} 小时</CardDescription>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              全部
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.project_progress.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">还没有项目</p>
            ) : (
              data.project_progress.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} className="block">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-medium">
                      {project.name}
                      <Badge className={PROJECT_STATUS[project.status as ProjectStatus].className}>
                        {PROJECT_STATUS[project.status as ProjectStatus].label}
                      </Badge>
                    </span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {project.task_done}/{project.task_total} · {percent(project.progress)}
                    </span>
                  </div>
                  <Progress value={project.progress} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
