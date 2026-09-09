import { NotebookPen, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFormDialog } from "@/components/questions/QuestionFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState, ErrorState, Loading, StatTile } from "@/components/ui/misc";
import { useQuestions, useTags } from "@/hooks/useApi";
import { QUESTION_TYPE, toOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

export default function QuestionsPage() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");
  const [onlyReview, setOnlyReview] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | undefined>();

  const filters = useMemo(
    () => ({
      q: keyword || undefined,
      question_type: type || undefined,
      tag: tag || undefined,
      need_review: onlyReview ? true : undefined,
    }),
    [keyword, type, tag, onlyReview],
  );

  const { data, isLoading, isError, error } = useQuestions(filters);
  const { data: allQuestions } = useQuestions({});
  const { data: tags } = useTags();

  const reviewCount = (allQuestions ?? []).filter((q) => q.need_review).length;
  const avgMastery = allQuestions?.length
    ? (
        allQuestions.reduce((sum, q) => sum + q.mastery, 0) / allQuestions.length
      ).toFixed(1)
    : "—";

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">题目本</h1>
          <p className="text-xs text-muted-foreground">
            点星星就能改掌握度，3 星及以下自动留在待复习里
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          记一道题
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="题目总数" value={allQuestions?.length ?? "—"} />
        <StatTile label="待复习" value={reviewCount} tone={reviewCount > 0 ? "warning" : "positive"} />
        <StatTile label="平均掌握度" value={avgMastery} sub="满分 5" />
        <StatTile label="标签数" value={tags?.length ?? "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜标题 / 题干 / 答案 / 代码"
            className="h-9 w-60 pl-8"
          />
        </div>

        <Select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-32">
          <option value="">全部类型</option>
          {toOptions(QUESTION_TYPE).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <Select value={tag} onChange={(e) => setTag(e.target.value)} className="h-9 w-32">
          <option value="">全部标签</option>
          {(tags ?? []).map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </Select>

        <Button
          variant={onlyReview ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyReview((value) => !value)}
        >
          只看待复习
        </Button>

        <span className="ml-auto text-xs text-muted-foreground">
          {data?.length ?? 0} 道
        </span>
      </div>

      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 20).map((item) => (
            <button key={item.id} onClick={() => setTag(tag === item.name ? "" : item.name)}>
              <Badge
                className={cn(
                  "cursor-pointer transition-colors",
                  tag === item.name
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {item.name}
              </Badge>
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={(error as Error).message} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<NotebookPen className="size-8" />}
          title="这里还是空的"
          description="面完趁热记一条，把当时怎么答的和标准答案都留下，复盘时最值钱。"
          action={<Button onClick={openCreate}>记一道题</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {data!.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onEdit={(item) => {
                setEditing(item);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={editing}
      />
    </div>
  );
}
