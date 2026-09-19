"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/components/locale-provider";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "cn";

function CollapseChevron({ className }: { className?: string }) {
  return (
    <ChevronDown
      className={cn(
        "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180",
        className
      )}
    />
  );
}

export function CollapsibleCard({
  title,
  description,
  actions,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <Collapsible
      defaultOpen={open === undefined ? defaultOpen : undefined}
      open={open}
      onOpenChange={onOpenChange}
      className={cn("group/panel", className)}
    >
      <Card>
        <CardHeader className="group-data-open/panel:border-b">
          <div className="flex items-start gap-3">
            <CollapsibleTrigger
              type="button"
              className="group flex min-w-0 flex-1 items-start gap-2 rounded-lg text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`${typeof title === "string" ? title : ""} ${t("common.togglePanel")}`}
            >
              <CollapseChevron />
              <div className="min-w-0 space-y-1">
                <CardTitle>{title}</CardTitle>
                {description ? (
                  <CardDescription>{description}</CardDescription>
                ) : null}
              </div>
            </CollapsibleTrigger>
            {actions ? (
              <div className="shrink-0 self-center">{actions}</div>
            ) : null}
          </div>
        </CardHeader>
        <CollapsibleContent keepMounted>
          {children}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function CollapsibleSection({
  title,
  description,
  summary,
  actions,
  defaultOpen = true,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn("rounded-xl border border-border bg-background", className)}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <CollapsibleTrigger
          type="button"
          className="group flex min-w-0 flex-1 items-start gap-2 rounded-md text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${typeof title === "string" ? title : ""} ${t("common.togglePanel")}`}
        >
          <CollapseChevron />
          <div className="min-w-0">
            <p className="text-sm font-medium">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
            {summary ? (
              <p className="truncate text-xs text-muted-foreground">{summary}</p>
            ) : null}
          </div>
        </CollapsibleTrigger>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <CollapsibleContent keepMounted className="border-t border-border px-3 py-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
