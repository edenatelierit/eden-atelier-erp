"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  deleteInstallationReport,
  saveInstallationReport,
} from "@/actions/installation";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { RowActions } from "@/components/ui/row-actions";
import { Textarea } from "@/components/ui/textarea";
import {
  INSTALLATION_CHECKS,
  emptyInstallationValues,
  installationReportSchema,
  type InstallationReportValues,
} from "@/lib/validations/installation";

export type InstallationReportRow = InstallationReportValues & { id: string };

export function InstallationTab({
  projectId,
  reports,
}: {
  projectId: string;
  reports: InstallationReportRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<InstallationReportRow | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const form = useForm<InstallationReportValues>({
    resolver: zodResolver(installationReportSchema),
    defaultValues: emptyInstallationValues,
  });

  const photoUrls = form.watch("photoUrls");
  const editing = Boolean(form.watch("id"));

  async function onSubmit(values: InstallationReportValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveInstallationReport(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    form.reset(emptyInstallationValues);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <CollapsibleCard
        title={t("installation.title")}
        description={t("installation.description")}
      >
        <Form form={form} onSubmit={onSubmit}>
          <CardContent className="space-y-4 pt-4">
            <FieldGroup>
              <FormGrid>
                <FormField data-invalid={!!form.formState.errors.reportDate}>
                  <FieldLabel htmlFor="reportDate">
                    {t("installation.reportDate")}
                  </FieldLabel>
                  <Input
                    id="reportDate"
                    type="date"
                    {...form.register("reportDate")}
                  />
                  <FieldError errors={[form.formState.errors.reportDate]} />
                </FormField>
                <FormField data-invalid={!!form.formState.errors.supervisor}>
                  <FieldLabel htmlFor="supervisor">
                    {t("installation.supervisor")}
                  </FieldLabel>
                  <Input id="supervisor" {...form.register("supervisor")} />
                  <FieldError errors={[form.formState.errors.supervisor]} />
                </FormField>
                <FormField span="wide" data-invalid={!!form.formState.errors.teamOnSite}>
                  <FieldLabel htmlFor="teamOnSite">
                    {t("installation.teamOnSite")}
                  </FieldLabel>
                  <Input id="teamOnSite" {...form.register("teamOnSite")} />
                  <FieldError errors={[form.formState.errors.teamOnSite]} />
                </FormField>
                <FormField
                  span="full"
                  data-invalid={!!form.formState.errors.workCompleted}
                >
                  <FieldLabel htmlFor="workCompleted">
                    {t("installation.workCompleted")}
                  </FieldLabel>
                  <Textarea
                    id="workCompleted"
                    rows={2}
                    {...form.register("workCompleted")}
                  />
                  <FieldError errors={[form.formState.errors.workCompleted]} />
                </FormField>
                <FormField span="wide">
                  <FieldLabel htmlFor="workRemaining">
                    {t("installation.workRemaining")}
                  </FieldLabel>
                  <Input id="workRemaining" {...form.register("workRemaining")} />
                </FormField>
                <FormField span="wide">
                  <FieldLabel htmlFor="materialsRequired">
                    {t("installation.materialsRequired")}
                  </FieldLabel>
                  <Input
                    id="materialsRequired"
                    {...form.register("materialsRequired")}
                  />
                </FormField>
                <FormField span="wide">
                  <FieldLabel htmlFor="issuesDelays">
                    {t("installation.issuesDelays")}
                  </FieldLabel>
                  <Textarea
                    id="issuesDelays"
                    rows={2}
                    {...form.register("issuesDelays")}
                  />
                </FormField>
                <FormField span="wide">
                  <FieldLabel htmlFor="nextPlannedWork">
                    {t("installation.nextPlannedWork")}
                  </FieldLabel>
                  <Textarea
                    id="nextPlannedWork"
                    rows={2}
                    {...form.register("nextPlannedWork")}
                  />
                </FormField>
              </FormGrid>
              <div>
                <p className="mb-2 text-sm font-medium">
                  {t("installation.checklist")}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {INSTALLATION_CHECKS.map((name) => (
                    <Controller
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(value) =>
                              field.onChange(value === true)
                            }
                          />
                          {t(`options.installationChecks.${name}`)}
                        </label>
                      )}
                    />
                  ))}
                </div>
              </div>
              <FormGrid>
                <FormField span="full">
                  <FieldLabel>{t("installation.photos")}</FieldLabel>
                  <ImageUploader
                    urls={photoUrls}
                    onChange={(next) =>
                      form.setValue("photoUrls", next, { shouldDirty: true })
                    }
                  />
                </FormField>
              </FormGrid>
            </FieldGroup>
            {serverError ? (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}
            {saved ? (
              <p className="text-sm text-muted-foreground">
                {t("installation.saved")}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(emptyInstallationValues);
                  setSaved(false);
                  setServerError(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            ) : null}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("installation.save")
              )}
            </Button>
          </CardFooter>
        </Form>
      </CollapsibleCard>

      <CollapsibleCard title={t("installation.logged")}>
        <CardContent className="pt-4">
          {reports.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              {t("installation.empty")}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{report.reportDate}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.supervisor} · {report.teamOnSite}
                      </p>
                    </div>
                    <RowActions
                      onEdit={() => {
                        form.reset(report);
                        setSaved(false);
                        setServerError(null);
                      }}
                      onDelete={() => setPendingDelete(report)}
                    />
                  </div>
                  <p className="mt-2 text-sm">{report.workCompleted}</p>
                  {report.issuesDelays ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("installation.issuesDelays")}: {report.issuesDelays}
                    </p>
                  ) : null}
                  {report.photoUrls.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {report.photoUrls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="size-14 rounded-md object-cover ring-1 ring-foreground/10"
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </CollapsibleCard>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("installation.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteInstallationReport(
            projectId,
            pendingDelete.id
          );
          setDeleting(false);
          if (result.error) {
            setServerError(result.error);
            return;
          }
          setPendingDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
