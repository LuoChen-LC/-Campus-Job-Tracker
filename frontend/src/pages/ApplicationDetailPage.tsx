import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApplicationFormDialog } from "@/components/applications/ApplicationFormDialog";
import { EventTimeline } from "@/components/applications/EventTimeline";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFormDialog } from "@/components/questions/QuestionFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, Loading, SectionTitle } from "@/components/ui/misc";
import { useApplication, useQuestions } from "@/hooks/useApi";
import { APP_STATUS, CHANNEL, JOB_TYPE } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Question } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const applicationId = Number(id);
  const { data, isLoading, isError, error } = useApplication(applicationId);
  const questions = useQuestions({ application_id: applicationId });

  const [editOpen, setEditOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState message={(error as Error).message} />;
  if (!data) return null;

  const status = APP_STATUS[data.status];

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5">
        <Link to="/applications">
          <ArrowLeft className="size-4" />
          返回投递列表
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{data.company}</h1>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{data.position}</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" />
          编辑
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Row label="类型" value={JOB_TYPE[data.job_type]} />
            <Row label="渠道" value={CHANNEL[data.channel]} />
            <Row label="城市" value={data.city} />
            <Row label="薪资" value={data.salary} />
            <Row label="内推人" value={data.referrer} />
            <Row label="投递日期" value={formatDate(data.applied_at)} />
            <Row
              label="JD"
              value={
                data.jd_url ? (
                  <a
                    href={data.jd_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    打开
                    <ExternalLink className="size-3" />
                  </a>
                ) : null
              }
            />
            {data.notes ? (
              <div className="pt-2">
                <p className="mb-1 text-xs text-muted-foreground">备注</p>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed">
                  {data.notes}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5">
              <EventTimeline applicationId={applicationId} events={data.events} />
            </CardContent>
          </Card>

          <div>
            <SectionTitle
              title="这家问过的题"
              count={questions.data?.length ?? 0}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditingQuestion(undefined);
                    setQuestionOpen(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  记一道题
                </Button>
              }
            />

            {(questions.data?.length ?? 0) === 0 ? (
              <EmptyState
                title="还没记题"
                description="笔试面试完趁记忆新鲜，把题目和当时的回答都记下来。"
              />
            ) : (
              <div className="space-y-2.5">
                {questions.data!.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={(item) => {
                      setEditingQuestion(item);
                      setQuestionOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ApplicationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        application={data}
      />
      <QuestionFormDialog
        open={questionOpen}
        onOpenChange={setQuestionOpen}
        question={editingQuestion}
        presetApplicationId={applicationId}
        presetCompany={data.company}
      />
    </div>
  );
}
