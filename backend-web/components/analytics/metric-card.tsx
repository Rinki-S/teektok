import type { ComponentType, ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  deltaLabel,
  deltaTone = "neutral",
  icon: Icon,
  right,
  className,
}: {
  title: string;
  value: string;
  deltaLabel?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon: ComponentType<{ className?: string }>;
  right?: ReactNode;
  className?: string;
}) {
  const deltaClass =
    deltaTone === "positive"
      ? "text-emerald-300"
      : deltaTone === "negative"
        ? "text-rose-300"
        : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "bg-card/70 ring-white/12 backdrop-blur supports-[backdrop-filter]:bg-card/55",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0 space-y-1">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="truncate text-2xl font-semibold tracking-tight">
            {value}
          </div>
          {deltaLabel ? (
            <div className={cn("text-xs", deltaClass)}>{deltaLabel}</div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {right ? <div className="w-28">{right}</div> : null}
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 ring-1 ring-white/10">
            <Icon className="h-5 w-5 text-foreground/90" />
          </div>
        </div>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
