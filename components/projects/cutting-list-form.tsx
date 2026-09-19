"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  deleteCuttingListPart,
  saveCuttingListPart,
} from "@/actions/production";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
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
import { RowActions } from "@/components/ui/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cuttingListPartSchema,
  emptyCuttingListPart,
  type CuttingListPartValues,
} from "@/lib/validations/production";

function CuttingListPartDialog({
  projectId,
  open,
  onOpenChange,
  part,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: CuttingListPartValues | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(part?.id);

  const form = useForm<CuttingListPartValues>({
    resolver: zodResolver(cuttingListPartSchema),
    defaultValues: emptyCuttingListPart,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(part ?? emptyCuttingListPart);
  }, [open, part, form]);

  async function onSubmit(values: CuttingListPartValues) {
    setServerError(null);
    const result = await saveCuttingListPart(projectId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("production.editPart") : t("production.addPart")}
          </DialogTitle>
          <DialogDescription>{t("production.description")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField data-invalid={!!form.formState.errors.partNumber}>
                <FieldLabel htmlFor="partNumber">{t("production.part")}</FieldLabel>
                <Input id="partNumber" {...form.register("partNumber")} />
                <FieldError errors={[form.formState.errors.partNumber]} />
              </FormField>
              <FormField span="wide" data-invalid={!!form.formState.errors.description}>
                <FieldLabel htmlFor="partDescription">
                  {t("production.descriptionCol")}
                </FieldLabel>
                <Input id="partDescription" {...form.register("description")} />
                <FieldError errors={[form.formState.errors.description]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.qty}>
                <FieldLabel htmlFor="partQty">{t("production.qty")}</FieldLabel>
                <Input id="partQty" type="number" min="1" step="1" {...form.register("qty")} />
                <FieldError errors={[form.formState.errors.qty]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.material}>
                <FieldLabel htmlFor="partMaterial">{t("production.material")}</FieldLabel>
                <Input id="partMaterial" {...form.register("material")} />
                <FieldError errors={[form.formState.errors.material]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.length}>
                <FieldLabel htmlFor="partLength">{t("production.length")}</FieldLabel>
                <Input id="partLength" type="number" min="0" step="0.1" {...form.register("length")} />
                <FieldError errors={[form.formState.errors.length]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.width}>
                <FieldLabel htmlFor="partWidth">{t("production.width")}</FieldLabel>
                <Input id="partWidth" type="number" min="0" step="0.1" {...form.register("width")} />
                <FieldError errors={[form.formState.errors.width]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.thickness}>
                <FieldLabel htmlFor="partThickness">{t("production.thickness")}</FieldLabel>
                <Input
                  id="partThickness"
                  type="number"
                  min="0"
                  step="0.1"
                  {...form.register("thickness")}
                />
                <FieldError errors={[form.formState.errors.thickness]} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="partEdge1">{t("production.edge1")}</FieldLabel>
                <Input id="partEdge1" {...form.register("edge1")} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="partEdge2">{t("production.edge2")}</FieldLabel>
                <Input id="partEdge2" {...form.register("edge2")} />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="partNotes">{t("production.notes")}</FieldLabel>
                <Input id="partNotes" {...form.register("notes")} />
              </FormField>
            </FormGrid>
          </FieldGroup>
          {serverError ? (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("production.saving")}
                </>
              ) : (
                t("production.save")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CuttingListForm({
  projectId,
  initialParts,
}: {
  projectId: string;
  initialParts: CuttingListPartValues[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CuttingListPartValues | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CuttingListPartValues | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <CollapsibleCard
      title={t("production.title")}
      description={t("production.description")}
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelected(null);
            setDialogOpen(true);
          }}
        >
          <Plus />
          {t("production.addPart")}
        </Button>
      }
    >
      <CardContent className="pt-4">
        {deleteError ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}
        {initialParts.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {t("production.empty")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("production.part")}</TableHead>
                  <TableHead>{t("production.descriptionCol")}</TableHead>
                  <TableHead>{t("production.qty")}</TableHead>
                  <TableHead>{t("production.material")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialParts.map((part) => (
                  <TableRow key={part.id || part.partNumber}>
                    <TableCell className="font-medium">{part.partNumber}</TableCell>
                    <TableCell className="whitespace-normal">
                      {part.description}
                    </TableCell>
                    <TableCell>{part.qty}</TableCell>
                    <TableCell>{part.material}</TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => {
                          setSelected(part);
                          setDialogOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteError(null);
                          setPendingDelete(part);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CuttingListPartDialog
        projectId={projectId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        part={selected}
      />
      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("production.deleteTitle")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingDelete?.id) return;
          setDeleting(true);
          const result = await deleteCuttingListPart(projectId, pendingDelete.id);
          setDeleting(false);
          if (result.error) {
            setDeleteError(result.error);
            return;
          }
          setPendingDelete(null);
          router.refresh();
        }}
      />
    </CollapsibleCard>
  );
}
