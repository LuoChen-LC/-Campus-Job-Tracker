import { Building2, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/misc";
import { INVALIDATE_QUESTIONS, useAppMutation } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { MASTERY_LABEL, QUESTION_TYPE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { Question } from "@/types";

function Answer({ label, text, mono }: { label: string; text: string; mono?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs leading-relaxed",
          mono && "font-mono",
        )}
      >
        {text}
      </p>
    </div>
  );
}

export function QuestionCard({
  question,
  onEdit,
}: {
  question: Question;
  onEdit: (question: Question) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = QUESTION_TYPE[question.question_type];

  const setMastery = useAppMutation(
    (mastery: number) => api.questions.setMastery(question.id, mastery),
    { invalidate: INVALIDATE_QUESTIONS },
  );

  const remove = useAppMutation(() => api.questions.remove(question.id), {
    invalidate: INVALIDATE_QUESTIONS,
    success: "已删除",
  });

  return (
    <div className="rounded-xl border bg-card transition-shadow hover:shadow-sm">
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={meta.className}>{meta.label}</Badge>
            {question.need_review ? (
              <Badge className="border-rose-200 bg-rose-50 text-rose-700">待复习</Badge>
            ) : null}
            {question.source_company ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Building2 className="size-3" />
                {question.source_company}
              </span>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              {formatDate(question.asked_at)}
            </span>
          </div>

          <p className="mt-1.5 text-sm font-medium leading-snug">{question.title}</p>

          {question.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {question.tags.map((tag) => (
                <Badge key={tag.id} className="bg-muted text-muted-foreground">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div
            className="flex items-center gap-1.5"
            title={`掌握度：${MASTERY_LABEL[question.mastery]}`}
          >
            <Stars value={question.mastery} onChange={(value) => setMastery.mutate(value)} />
          </div>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t px-4 py-4">
          {question.content ? <Answer label="题干 / 情境" text={question.content} /> : null}
          {question.my_answer ? <Answer label="我当时的回答" text={question.my_answer} /> : null}
          {question.reference_answer ? (
            <Answer label="参考答案" text={question.reference_answer} />
          ) : null}
          {question.code_snippet ? (
            <Answer
              label={`代码 · ${question.code_language ?? "code"}`}
              text={question.code_snippet}
              mono
            />
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              题目难度 {question.difficulty} 星 · 掌握度 {MASTERY_LABEL[question.mastery]}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(question)}>
                <Pencil className="size-3.5" />
                编辑
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  if (confirm("删除这道题？")) remove.mutate(undefined);
                }}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
