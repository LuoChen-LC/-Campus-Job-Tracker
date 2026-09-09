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
import { Stars } from "@/components/ui/misc";
import { INVALIDATE_QUESTIONS, useAppMutation, useApplications } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { MASTERY_LABEL, QUESTION_TYPE, toOptions } from "@/lib/constants";
import { todayISO } from "@/lib/utils";
import type { Question, QuestionType } from "@/types";

const EMPTY = {
  title: "",
  question_type: "fundamentals" as QuestionType,
  content: "",
  my_answer: "",
  reference_answer: "",
  code_snippet: "",
  code_language: "python",
  difficulty: 3,
  mastery: 1,
  source_company: "",
  application_id: "",
  asked_at: todayISO(),
  tags: "",
};

type FormState = typeof EMPTY;

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  presetApplicationId,
  presetCompany,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question;
  presetApplicationId?: number;
  presetCompany?: string;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const { data: applications } = useApplications({});
  const editing = Boolean(question);

  useEffect(() => {
    if (!open) return;
    setForm(
      question
        ? {
            title: question.title,
            question_type: question.question_type,
            content: question.content ?? "",
            my_answer: question.my_answer ?? "",
            reference_answer: question.reference_answer ?? "",
            code_snippet: question.code_snippet ?? "",
            code_language: question.code_language ?? "python",
            difficulty: question.difficulty,
            mastery: question.mastery,
            source_company: question.source_company ?? "",
            application_id: question.application_id ? String(question.application_id) : "",
            asked_at: question.asked_at ?? todayISO(),
            tags: question.tags.map((t) => t.name).join(", "),
          }
        : {
            ...EMPTY,
            asked_at: todayISO(),
            application_id: presetApplicationId ? String(presetApplicationId) : "",
            source_company: presetCompany ?? "",
          },
    );
  }, [open, question, presetApplicationId, presetCompany]);

  const save = useAppMutation(
    (payload: Record<string, unknown>) =>
      question ? api.questions.update(question.id, payload) : api.questions.create(payload),
    {
      invalidate: INVALIDATE_QUESTIONS,
      success: editing ? "已更新" : "已记下这道题",
      onSuccess: () => onOpenChange(false),
    },
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    save.mutate({
      title: form.title.trim(),
      question_type: form.question_type,
      content: form.content || null,
      my_answer: form.my_answer || null,
      reference_answer: form.reference_answer || null,
      code_snippet: form.code_snippet || null,
      code_language: form.code_language || null,
      difficulty: form.difficulty,
      mastery: form.mastery,
      need_review: form.mastery <= 3,
      source_company: form.source_company || null,
      application_id: form.application_id ? Number(form.application_id) : null,
      asked_at: form.asked_at || null,
      tags: form.tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑题目" : "记一道题"}</DialogTitle>
          <DialogDescription>
            标签用逗号分隔，不存在会自动创建。掌握度 3 星及以下会自动进「待复习」。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label="题目 *">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="HashMap 为什么用红黑树而不是 AVL？"
              autoFocus
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label="类型">
              <Select
                value={form.question_type}
                onChange={(e) => set("question_type", e.target.value as QuestionType)}
              >
                {toOptions(QUESTION_TYPE).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="来源公司">
              <Input
                value={form.source_company}
                onChange={(e) => set("source_company", e.target.value)}
              />
            </Field>
            <Field label="被问日期">
              <Input
                type="date"
                value={form.asked_at}
                onChange={(e) => set("asked_at", e.target.value)}
              />
            </Field>
            <Field label="关联投递">
              <Select
                value={form.application_id}
                onChange={(e) => set("application_id", e.target.value)}
              >
                <option value="">不关联</option>
                {(applications ?? []).map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} · {app.position}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="标签" hint="逗号分隔，例如：MySQL, 索引, B+树">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`题目难度 · ${form.difficulty} 星`}>
              <div className="flex h-9 items-center">
                <Stars
                  value={form.difficulty}
                  size="md"
                  onChange={(value) => set("difficulty", value)}
                />
              </div>
            </Field>
            <Field label={`我的掌握度 · ${MASTERY_LABEL[form.mastery]}`}>
              <div className="flex h-9 items-center">
                <Stars
                  value={form.mastery}
                  size="md"
                  onChange={(value) => set("mastery", value)}
                />
              </div>
            </Field>
          </div>

          <Field label="题干 / 当时的情境">
            <Textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={3}
              placeholder="面试官先问了 put 流程，然后追问 treeify 阈值…"
            />
          </Field>

          <Field label="我当时怎么答的">
            <Textarea
              value={form.my_answer}
              onChange={(e) => set("my_answer", e.target.value)}
              rows={3}
            />
          </Field>

          <Field label="正确 / 参考答案">
            <Textarea
              value={form.reference_answer}
              onChange={(e) => set("reference_answer", e.target.value)}
              rows={4}
            />
          </Field>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="代码">
              <Textarea
                value={form.code_snippet}
                onChange={(e) => set("code_snippet", e.target.value)}
                rows={5}
                className="font-mono text-xs"
                placeholder="手撕题就把 AC 的代码贴这儿"
              />
            </Field>
            <Field label="语言">
              <Select
                value={form.code_language}
                onChange={(e) => set("code_language", e.target.value)}
              >
                {["python", "java", "cpp", "go", "javascript", "sql", "other"].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

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
