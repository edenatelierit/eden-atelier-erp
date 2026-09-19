"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { togglePipelineStep } from "@/actions/pipeline";
import { useI18n } from "@/components/locale-provider";
import { CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { cn } from "cn";
import {
  PIPELINE_STEPS,
  type PipelineStep,
  type WorkOrderPipelineValues,
} from "@/lib/validations/pipeline";

export function WorkOrderPipelineCard({
  projectId,
  initialValues,
}: {
  projectId: string;
  initialValues: WorkOrderPipelineValues;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [steps, setSteps] = useState(initialValues);
  const [pending, setPending] = useState<PipelineStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSteps(initialValues);
  }, [initialValues]);

  async function onToggle(step: PipelineStep) {
    const next = !steps[step];
    setError(null);
    setPending(step);
    setSteps((current) => ({ ...current, [step]: next }));
    const result = await togglePipelineStep(projectId, step, next);
    setPending(null);
    if (result.error) {
      setSteps((current) => ({ ...current, [step]: !next }));
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <CollapsibleCard
      title={t("production.workOrder")}
      description={t("production.workOrderHint")}
    >
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE_STEPS.map((step) => {
            const complete = steps[step];
            return (
              <button
                key={step}
                type="button"
                disabled={pending === step}
                aria-pressed={complete}
                onClick={() => onToggle(step)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-start text-sm font-medium transition-colors",
                  complete
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-muted/60 dark:bg-input/20"
                )}
              >
                {t(`options.pipelineSteps.${step}`)}
              </button>
            );
          })}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </CollapsibleCard>
  );
}
