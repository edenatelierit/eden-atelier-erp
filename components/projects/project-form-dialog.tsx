"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { createProject, updateProject } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/components/locale-provider";
import { PROJECT_AREAS, type ProjectArea } from "@/lib/project-options";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/validations/project";

export type ProjectClientOption = {
  id: string;
  name: string;
  leadNumber: string;
};

export type ProjectEditRecord = {
  id: string;
  clientId: string;
  location: string;
  targetBudget: string | null;
  targetCompletionDate: string | null;
  preferredStyle: string | null;
  preferredWood: string | null;
  preferredStone: string | null;
  preferredColors: string | null;
  preferredHardware: string | null;
  areasIncluded: string[];
};

const emptyValues: ProjectFormValues = {
  clientId: "",
  location: "",
  targetBudget: "",
  targetCompletionDate: "",
  preferredStyle: "",
  preferredWood: "",
  preferredStone: "",
  preferredColors: "",
  preferredHardware: "",
  areasIncluded: [],
};

export function ProjectFormPanel({
  open,
  onOpenChange,
  clients,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ProjectClientOption[];
  project?: ProjectEditRecord | null;
}) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(project);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setServerError(null);
    form.reset(
      project
        ? {
            clientId: project.clientId,
            location: project.location,
            targetBudget: project.targetBudget ?? "",
            targetCompletionDate: project.targetCompletionDate ?? "",
            preferredStyle: project.preferredStyle ?? "",
            preferredWood: project.preferredWood ?? "",
            preferredStone: project.preferredStone ?? "",
            preferredColors: project.preferredColors ?? "",
            preferredHardware: project.preferredHardware ?? "",
            areasIncluded: project.areasIncluded.filter((area): area is ProjectArea =>
              PROJECT_AREAS.some((item) => item.value === area)
            ),
          }
        : emptyValues
    );
  }, [open, project, form]);

  async function onSubmit(values: ProjectFormValues) {
    setServerError(null);
    const result = project
      ? await updateProject(project.id, values)
      : await createProject(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <InlineFormPanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? t("projectForm.editTitle") : t("projectForm.title")}
      description={t("projectForm.description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("projectForm.cancel")}
          </Button>
          <Button
            type="submit"
            form="project-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("projectForm.saving")}
              </>
            ) : isEditing ? (
              t("projectForm.saveChanges")
            ) : (
              t("projectForm.create")
            )}
          </Button>
        </>
      }
    >
      <Form id="project-form" form={form} onSubmit={onSubmit} className="space-y-6">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                className="sm:col-span-2"
                data-invalid={!!form.formState.errors.clientId}
              >
                <FieldLabel>{t("projectForm.client")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <Select
                      value={field.value || null}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("projectForm.selectClient")}>
                          {clients.find((client) => client.id === field.value)
                            ? `${clients.find((client) => client.id === field.value)?.name} · ${clients.find((client) => client.id === field.value)?.leadNumber}`
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start">
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} · {client.leadNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.clientId]} />
              </Field>

              <Field
                className="sm:col-span-2"
                data-invalid={!!form.formState.errors.location}
              >
                <FieldLabel htmlFor="location">{t("projectForm.location")}</FieldLabel>
                <Input
                  id="location"
                  placeholder="Site address or building"
                  {...form.register("location")}
                />
                <FieldError errors={[form.formState.errors.location]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.targetBudget}>
                <FieldLabel htmlFor="targetBudget">{t("projectForm.targetBudget")}</FieldLabel>
                <Input
                  id="targetBudget"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="45000"
                  {...form.register("targetBudget")}
                />
                <FieldError errors={[form.formState.errors.targetBudget]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.targetCompletionDate}>
                <FieldLabel htmlFor="targetCompletionDate">
                  {t("projectForm.targetCompletion")}
                </FieldLabel>
                <Input
                  id="targetCompletionDate"
                  type="date"
                  {...form.register("targetCompletionDate")}
                />
                <FieldError
                  errors={[form.formState.errors.targetCompletionDate]}
                />
              </Field>
            </div>
          </FieldGroup>

          <Collapsible defaultOpen className="rounded-xl border border-border">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-start">
              <div>
                <p className="text-sm font-medium">{t("projectForm.designDirection")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("projectForm.designHint")}
                </p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-open]_&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="preferredStyle">
                    {t("projectForm.preferredStyle")}
                  </FieldLabel>
                  <Input
                    id="preferredStyle"
                    placeholder="Modern, classic, rustic…"
                    {...form.register("preferredStyle")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="preferredWood">{t("projectForm.preferredWood")}</FieldLabel>
                  <Input
                    id="preferredWood"
                    placeholder="Walnut, oak, teak…"
                    {...form.register("preferredWood")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="preferredStone">
                    {t("projectForm.preferredStone")}
                  </FieldLabel>
                  <Input
                    id="preferredStone"
                    placeholder="Calacatta, basalt, travertine…"
                    {...form.register("preferredStone")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="preferredColors">
                    {t("projectForm.preferredColors")}
                  </FieldLabel>
                  <Input
                    id="preferredColors"
                    placeholder="Warm neutrals, charcoal…"
                    {...form.register("preferredColors")}
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="preferredHardware">
                    {t("projectForm.preferredHardware")}
                  </FieldLabel>
                  <Input
                    id="preferredHardware"
                    placeholder="Brushed brass, black steel…"
                    {...form.register("preferredHardware")}
                  />
                </Field>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Field>
            <FieldLabel>{t("projectForm.areas")}</FieldLabel>
            <Controller
              control={form.control}
              name="areasIncluded"
              render={({ field }) => (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {PROJECT_AREAS.map((area) => {
                    const checked = field.value.includes(area.value);
                    return (
                      <label
                        key={area.value}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const next = value
                              ? [...field.value, area.value]
                              : field.value.filter(
                                  (item) => item !== area.value
                                );
                            field.onChange(next);
                          }}
                        />
                        {t(`options.projectAreas.${area.value}`)}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </Field>

          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}

      </Form>
    </InlineFormPanel>
  );
}

/** @deprecated Use ProjectFormPanel */
export const ProjectFormDialog = ProjectFormPanel;
