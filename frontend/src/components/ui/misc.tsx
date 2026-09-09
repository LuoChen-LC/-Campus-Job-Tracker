import { Loader2, Star } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

/** 1-5 星掌握度。只读时是展示，传 onChange 就变成自评控件。 */
export function Stars({
  value,
  max = 5,
  onChange,
  size = "sm",
  className,
}: {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const readOnly = !onChange;
  const dimension = size === "sm" ? "size-3.5" : "size-5";
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, index) => index + 1).map((level) => (
        <button
          key={level}
          type="button"
          disabled={readOnly}
          onClick={(event) => {
            event.stopPropagation();
            onChange?.(level);
          }}
          className={cn(
            "transition-transform",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-125",
          )}
          aria-label={`${level} 星`}
        >
          <Star
            className={cn(
              dimension,
              level <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin text-muted-foreground", className)} />;
}

export function Loading({ label = "加载中" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
      {message}
      <p className="mt-1 text-xs text-muted-foreground">
        后端没起来？先在 backend 目录跑 uvicorn app.main:app --reload
      </p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
      {icon ? <div className="text-muted-foreground/60">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const tones = {
    default: "text-foreground",
    positive: "text-emerald-600",
    negative: "text-rose-600",
    warning: "text-amber-600",
  } as const;
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", tones[tone])}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {title}
        {count !== undefined ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
            {count}
          </span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}
