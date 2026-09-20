"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createClient, updateClient } from "@/actions/client";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { InlineFormPanel } from "@/components/ui/inline-form-panel";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/components/locale-provider";
import { CLIENT_STATUSES, LEAD_SOURCES } from "@/lib/client-options";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validations/client";

export type ClientRecord = {
  id: string;
  leadNumber: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string;
  source: ClientFormValues["source"];
  status: ClientFormValues["status"];
};

const emptyValues: ClientFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  source: "WALK_IN",
  status: "NEW",
};

export function ClientFormPanel({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientRecord | null;
}) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(client);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setServerError(null);
    form.reset(
      client
        ? {
            name: client.name,
            contactPerson: client.contactPerson ?? "",
            phone: client.phone,
            email: client.email,
            source: client.source,
            status: client.status,
          }
        : emptyValues
    );
  }, [open, client, form]);

  async function onSubmit(values: ClientFormValues) {
    setServerError(null);
    const result = client
      ? await updateClient(client.id, values)
      : await createClient(values);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    onOpenChange(false);
  }

  return (
    <InlineFormPanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? t("clientForm.editTitle") : t("clientForm.createTitle")}
      description={t("clientForm.description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("clientForm.cancel")}
          </Button>
          <Button
            type="submit"
            form="client-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                {t("clientForm.saving")}
              </>
            ) : isEditing ? (
              t("clientForm.saveChanges")
            ) : (
              t("clientForm.createClient")
            )}
          </Button>
        </>
      }
    >
      <Form
        id="client-form"
        form={form}
        onSubmit={onSubmit}
        className="space-y-4"
      >
        <FieldGroup>
          <FormGrid>
            {isEditing ? (
              <FormField span="medium">
                <FieldLabel>{t("clientForm.leadNumber")}</FieldLabel>
                <Input
                  value={client?.leadNumber ?? ""}
                  readOnly
                  className="bg-muted"
                />
              </FormField>
            ) : null}

            <FormField
              span="wide"
              data-invalid={!!form.formState.errors.name}
            >
              <FieldLabel htmlFor="name">{t("clientForm.name")}</FieldLabel>
              <Input id="name" {...form.register("name")} />
              <FieldError errors={[form.formState.errors.name]} />
            </FormField>

            <FormField
              span="medium"
              data-invalid={!!form.formState.errors.contactPerson}
            >
              <FieldLabel htmlFor="contactPerson">
                {t("clientForm.contactPerson")}
              </FieldLabel>
              <Input id="contactPerson" {...form.register("contactPerson")} />
              <FieldError errors={[form.formState.errors.contactPerson]} />
            </FormField>

            <FormField
              span="medium"
              data-invalid={!!form.formState.errors.phone}
            >
              <FieldLabel htmlFor="phone">{t("clientForm.phone")}</FieldLabel>
              <Input id="phone" type="tel" {...form.register("phone")} />
              <FieldError errors={[form.formState.errors.phone]} />
            </FormField>

            <FormField
              span="medium"
              data-invalid={!!form.formState.errors.email}
            >
              <FieldLabel htmlFor="email">{t("clientForm.email")}</FieldLabel>
              <Input id="email" type="email" {...form.register("email")} />
              <FieldError errors={[form.formState.errors.email]} />
            </FormField>

            <FormField data-invalid={!!form.formState.errors.source}>
              <FieldLabel>{t("clientForm.source")}</FieldLabel>
              <Controller
                control={form.control}
                name="source"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {t(`options.leadSources.${field.value}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} align="start">
                      {LEAD_SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {t(`options.leadSources.${source.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.source]} />
            </FormField>

            <FormField data-invalid={!!form.formState.errors.status}>
              <FieldLabel>{t("clientForm.status")}</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {t(`options.clientStatuses.${field.value}`)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} align="start">
                      {CLIENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {t(`options.clientStatuses.${status.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.status]} />
            </FormField>
          </FormGrid>
        </FieldGroup>

        {serverError ? (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        ) : null}
      </Form>
    </InlineFormPanel>
  );
}

/** @deprecated Use ClientFormPanel */
export const ClientFormDialog = ClientFormPanel;
