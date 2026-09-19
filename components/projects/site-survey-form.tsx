"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { saveSiteSurvey } from "@/actions/survey";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  CollapsibleCard,
  CollapsibleSection,
} from "@/components/ui/collapsible-card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/locale-provider";
import { SURVEY_ACCESS, SURVEY_INFRASTRUCTURE } from "@/lib/survey-options";
import {
  emptySurveyValues,
  surveyFormSchema,
  type SurveyFormValues,
} from "@/lib/validations/survey";

export function SiteSurveyForm({
  projectId,
  initialValues,
}: {
  projectId: string;
  initialValues: SurveyFormValues | null;
}) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: initialValues ?? emptySurveyValues,
  });
  const photoUrls = form.watch("photoUrls");

  async function onSubmit(values: SurveyFormValues) {
    setServerError(null);
    setSaved(false);
    const result = await saveSiteSurvey(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <CollapsibleCard
      title={t("survey.title")}
      description={t("survey.description")}
    >
      <Form form={form} onSubmit={onSubmit}>
        <CardContent className="space-y-4 pt-4">
          <FieldGroup>
            <CollapsibleSection
              title={t("survey.infrastructure")}
              description={t("survey.infrastructureHint")}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {SURVEY_INFRASTRUCTURE.map((item) => (
                  <Controller
                    key={item.name}
                    control={form.control}
                    name={item.name}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(value) =>
                            field.onChange(value === true)
                          }
                        />
                        {t(`options.surveyFields.${item.name}`)}
                      </label>
                    )}
                  />
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("survey.access")}
              description={t("survey.accessHint")}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {SURVEY_ACCESS.map((item) => (
                  <Field key={item.name}>
                    <FieldLabel>{t(`options.surveyFields.${item.name}`)}</FieldLabel>
                    <Controller
                      control={form.control}
                      name={item.name}
                      render={({ field }) => (
                        <Select
                          value={field.value ? "yes" : "no"}
                          onValueChange={(value) => {
                            if (value) field.onChange(value === "yes");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {field.value ? t("survey.yes") : t("survey.no")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectItem value="yes">{t("survey.yes")}</SelectItem>
                            <SelectItem value="no">{t("survey.no")}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={t("survey.observations")}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field data-invalid={!!form.formState.errors.restrictions}>
                  <FieldLabel htmlFor="restrictions">{t("survey.restrictions")}</FieldLabel>
                  <Textarea
                    id="restrictions"
                    rows={2}
                    placeholder="Working hours, HOA rules, parking, noise…"
                    {...form.register("restrictions")}
                  />
                  <FieldError errors={[form.formState.errors.restrictions]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.observations}>
                  <FieldLabel htmlFor="observations">
                    {t("survey.observations")}
                  </FieldLabel>
                  <Textarea
                    id="observations"
                    rows={2}
                    placeholder="Floor levels, moisture, existing finishes…"
                    {...form.register("observations")}
                  />
                  <FieldError errors={[form.formState.errors.observations]} />
                </Field>
                <Field className="lg:col-span-2">
                  <FieldLabel>{t("survey.photos")}</FieldLabel>
                  <ImageUploader
                    urls={photoUrls}
                    onChange={(next) =>
                      form.setValue("photoUrls", next, { shouldDirty: true })
                    }
                  />
                </Field>
              </div>
            </CollapsibleSection>
          </FieldGroup>

          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm text-muted-foreground">{t("survey.saved")}</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("survey.saving")}
              </>
            ) : (
              t("survey.save")
            )}
          </Button>
        </CardFooter>
      </Form>
    </CollapsibleCard>
  );
}
