"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { createUser, updateUser } from "@/actions/user";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { FormField, FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  emptyUserValues,
  USER_ROLE_VALUES,
  userFormSchema,
  type UserFormValues,
} from "@/lib/validations/user";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserFormValues["role"];
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRecord | null;
}) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(user);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: emptyUserValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setServerError(null);
    form.reset(
      user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            password: "",
          }
        : emptyUserValues
    );
  }, [open, user, form.reset]);

  async function onSubmit(values: UserFormValues) {
    setServerError(null);
    const result = user
      ? await updateUser(user.id, values)
      : await createUser(values);

    if ("error" in result && result.error) {
      setServerError(result.error);
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("admin.editUser") : t("admin.addUser")}
          </DialogTitle>
          <DialogDescription>{t("admin.userDescription")}</DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField
                span="wide"
                data-invalid={!!form.formState.errors.name}
              >
                <FieldLabel htmlFor="user-name">{t("admin.name")}</FieldLabel>
                <Input id="user-name" autoComplete="name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FormField>

              <FormField
                span="wide"
                data-invalid={!!form.formState.errors.email}
              >
                <FieldLabel htmlFor="user-email">{t("admin.email")}</FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </FormField>

              <FormField data-invalid={!!form.formState.errors.role}>
                <FieldLabel>{t("admin.role")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="w-full font-mono text-xs">
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start">
                        {USER_ROLE_VALUES.map((role) => (
                          <SelectItem
                            key={role}
                            value={role}
                            className="font-mono text-xs"
                          >
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[form.formState.errors.role]} />
              </FormField>

              <FormField
                span="wide"
                data-invalid={!!form.formState.errors.password}
              >
                <FieldLabel htmlFor="user-password">
                  {isEditing ? t("admin.password") : t("admin.passwordCreate")}
                </FieldLabel>
                <Input
                  id="user-password"
                  type="password"
                  autoComplete={isEditing ? "new-password" : "new-password"}
                  {...form.register("password")}
                />
                {isEditing ? (
                  <p className="text-xs text-muted-foreground">
                    {t("admin.passwordHint")}
                  </p>
                ) : null}
                <FieldError errors={[form.formState.errors.password]} />
              </FormField>
            </FormGrid>
          </FieldGroup>

          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : isEditing ? (
                t("admin.saveChanges")
              ) : (
                t("admin.createUser")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
