"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { saveContract } from "@/actions/contract";
import { PrintDocumentButton } from "@/components/print/print-document-button";
import type { PrintParty } from "@/components/print/print-template";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  CollapsibleCard,
  CollapsibleSection,
} from "@/components/ui/collapsible-card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/locale-provider";
import { formatMoney } from "@/lib/money";
import { CONTRACT_COMPLIANCE } from "@/lib/contract-options";
import {
  contractFormSchema,
  emptyContractValues,
  type ContractFormValues,
} from "@/lib/validations/contract";

export function ContractForm({
  projectId,
  initialValues,
  party,
}: {
  projectId: string;
  initialValues: ContractFormValues | null;
  party: PrintParty;
}) {
  const { locale, t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: initialValues ?? emptyContractValues,
  });
  const values = form.watch();

  async function onSubmit(values: ContractFormValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveContract(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <CollapsibleCard
      title={t("contract.title")}
      description={t("contract.description")}
      actions={
        <PrintDocumentButton title={t("contract.printTitle")} party={party}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-neutral-500">{t("contract.value")}</dt>
              <dd>{formatMoney(values.contractValue, locale)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("contract.duration")}</dt>
              <dd>{values.projectDuration || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("contract.warranty")}</dt>
              <dd>{values.warrantyPeriod || "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-500">{t("contract.special")}</dt>
              <dd className="whitespace-pre-wrap">
                {values.specialConditions || "—"}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 list-disc ps-5">
            {CONTRACT_COMPLIANCE.filter((item) => values[item.name]).map((item) => (
              <li key={item.name}>{t(`options.contractFields.${item.name}`)}</li>
            ))}
          </ul>
        </PrintDocumentButton>
      }
    >
      <Form form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4 pt-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.contractValue}>
                <FieldLabel htmlFor="contractValue">{t("contract.value")}</FieldLabel>
                <Input
                  id="contractValue"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="42000"
                  {...form.register("contractValue")}
                />
                <FieldError errors={[form.formState.errors.contractValue]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.projectDuration}>
                <FieldLabel htmlFor="projectDuration">
                  {t("contract.duration")}
                </FieldLabel>
                <Input
                  id="projectDuration"
                  placeholder="12 weeks"
                  {...form.register("projectDuration")}
                />
                <FieldError errors={[form.formState.errors.projectDuration]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.warrantyPeriod}>
                <FieldLabel htmlFor="warrantyPeriod">
                  {t("contract.warranty")}
                </FieldLabel>
                <Input
                  id="warrantyPeriod"
                  placeholder="24 months"
                  {...form.register("warrantyPeriod")}
                />
                <FieldError errors={[form.formState.errors.warrantyPeriod]} />
              </FormField>
              <FormField
                span="wide"
                data-invalid={!!form.formState.errors.specialConditions}
              >
                <FieldLabel htmlFor="specialConditions">
                  {t("contract.special")}
                </FieldLabel>
                <Input
                  id="specialConditions"
                  placeholder="Retention, phased handover, client-supplied items…"
                  {...form.register("specialConditions")}
                />
                <FieldError
                  errors={[form.formState.errors.specialConditions]}
                />
              </FormField>
            </FormGrid>

            <CollapsibleSection
              title={t("contract.compliance")}
              description={t("contract.complianceHint")}
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {CONTRACT_COMPLIANCE.map((item) => (
                  <Controller
                    key={item.name}
                    control={form.control}
                    name={item.name}
                    render={({ field }) => (
                      <label className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
                        <Checkbox
                          className="mt-0.5"
                          checked={field.value}
                          onCheckedChange={(value) =>
                            field.onChange(value === true)
                          }
                        />
                        <span>{t(`options.contractFields.${item.name}`)}</span>
                      </label>
                    )}
                  />
                ))}
              </div>
            </CollapsibleSection>
          </FieldGroup>

          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">{t("contract.saved")}</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("contract.saving")}
              </>
            ) : (
              t("contract.save")
            )}
          </Button>
        </CardFooter>
      </Form>
    </CollapsibleCard>
  );
}
