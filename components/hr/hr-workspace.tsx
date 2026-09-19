"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  deleteEmployee,
  deleteTimesheet,
  saveEmployee,
  saveTimesheet,
} from "@/actions/hr";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EMPLOYEE_STATUSES,
  emptyEmployeeValues,
  emptyTimesheetValues,
  employeeFormSchema,
  timesheetFormSchema,
  type EmployeeFormValues,
  type EmployeeStatusValue,
  type TimesheetFormValues,
} from "@/lib/validations/hr";
import { formatMoney } from "@/lib/money";

export type EmployeeRow = {
  id: string;
  name: string;
  position: string;
  phone: string;
  dailyRate: number;
  status: EmployeeStatusValue;
};

export type TimesheetRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  dailyRate: number;
  projectId: string | null;
  projectNumber: string | null;
  date: string;
  hoursWorked: number;
  notes: string | null;
};

export type HrProjectOption = { id: string; projectNumber: string };

function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyEmployeeValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      employee
        ? {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            phone: employee.phone,
            dailyRate: String(employee.dailyRate),
            status: employee.status,
          }
        : emptyEmployeeValues
    );
  }, [open, employee, form]);

  async function onSubmit(values: EmployeeFormValues) {
    setServerError(null);
    const result = await saveEmployee(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {employee ? t("hr.editEmployee") : t("hr.addEmployee")}
          </DialogTitle>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField span="wide" data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="emp-name">{t("hr.name")}</FieldLabel>
                <Input id="emp-name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.position}>
                <FieldLabel htmlFor="emp-position">{t("hr.position")}</FieldLabel>
                <Input id="emp-position" {...form.register("position")} />
                <FieldError errors={[form.formState.errors.position]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.phone}>
                <FieldLabel htmlFor="emp-phone">{t("hr.phone")}</FieldLabel>
                <Input id="emp-phone" {...form.register("phone")} />
                <FieldError errors={[form.formState.errors.phone]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.dailyRate}>
                <FieldLabel htmlFor="emp-rate">{t("hr.dailyRate")}</FieldLabel>
                <Input
                  id="emp-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("dailyRate")}
                />
                <FieldError errors={[form.formState.errors.dailyRate]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.status}>
                <FieldLabel>{t("hr.status")}</FieldLabel>
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
                          {t(`options.employeeStatuses.${field.value}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {EMPLOYEE_STATUSES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`options.employeeStatuses.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
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
                  {t("common.saving")}
                </>
              ) : (
                t("hr.saveEmployee")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TimesheetDialog({
  open,
  onOpenChange,
  employees,
  projects,
  timesheet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeRow[];
  projects: HrProjectOption[];
  timesheet: TimesheetRow | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: emptyTimesheetValues,
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    form.reset(
      timesheet
        ? {
            id: timesheet.id,
            employeeId: timesheet.employeeId,
            projectId: timesheet.projectId ?? "",
            date: timesheet.date,
            hoursWorked: String(timesheet.hoursWorked),
            notes: timesheet.notes ?? "",
          }
        : {
            ...emptyTimesheetValues,
            employeeId: employees[0]?.id ?? "",
          }
    );
  }, [open, timesheet, employees, form]);

  async function onSubmit(values: TimesheetFormValues) {
    setServerError(null);
    const result = await saveTimesheet(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {timesheet ? t("hr.editTimesheet") : t("hr.addTimesheet")}
          </DialogTitle>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FieldGroup>
            <FormGrid>
              <FormField span="wide" data-invalid={!!form.formState.errors.employeeId}>
                <FieldLabel>{t("hr.employee")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => {
                    const selected = employees.find((item) => item.id === field.value);
                    return (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>{selected?.name ?? t("hr.employee")}</SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {employees.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <FieldError errors={[form.formState.errors.employeeId]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.date}>
                <FieldLabel htmlFor="ts-date">{t("hr.date")}</FieldLabel>
                <Input id="ts-date" type="date" {...form.register("date")} />
                <FieldError errors={[form.formState.errors.date]} />
              </FormField>
              <FormField data-invalid={!!form.formState.errors.hoursWorked}>
                <FieldLabel htmlFor="ts-hours">{t("hr.hours")}</FieldLabel>
                <Input
                  id="ts-hours"
                  type="number"
                  min="0.25"
                  max="24"
                  step="0.25"
                  {...form.register("hoursWorked")}
                />
                <FieldError errors={[form.formState.errors.hoursWorked]} />
              </FormField>
              <FormField>
                <FieldLabel>{t("hr.project")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="projectId"
                  render={({ field }) => {
                    const selected = projects.find((item) => item.id === field.value);
                    return (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? "" : value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {selected?.projectNumber ?? t("hr.noProject")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="none">{t("hr.noProject")}</SelectItem>
                          {projects.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.projectNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </FormField>
              <FormField span="wide">
                <FieldLabel htmlFor="ts-notes">{t("hr.notes")}</FieldLabel>
                <Input id="ts-notes" {...form.register("notes")} />
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
                  {t("common.saving")}
                </>
              ) : (
                t("hr.saveTimesheet")
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function HrWorkspace({
  employees,
  timesheets,
  projects,
}: {
  employees: EmployeeRow[];
  timesheets: TimesheetRow[];
  projects: HrProjectOption[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [timesheetOpen, setTimesheetOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetRow | null>(null);
  const [pendingEmployee, setPendingEmployee] = useState<EmployeeRow | null>(null);
  const [pendingTimesheet, setPendingTimesheet] = useState<TimesheetRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("hr.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("hr.subtitle")}</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-medium">{t("hr.employees")}</h2>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedEmployee(null);
              setEmployeeOpen(true);
            }}
          >
            <Plus />
            {t("hr.addEmployee")}
          </Button>
        </div>
        {employees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {t("hr.emptyEmployees")}
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("hr.name")}</TableHead>
                  <TableHead>{t("hr.position")}</TableHead>
                  <TableHead>{t("hr.phone")}</TableHead>
                  <TableHead>{t("hr.dailyRate")}</TableHead>
                  <TableHead>{t("hr.status")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{formatMoney(employee.dailyRate, locale)}</TableCell>
                    <TableCell>
                      {t(`options.employeeStatuses.${employee.status}`)}
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => {
                          setSelectedEmployee(employee);
                          setEmployeeOpen(true);
                        }}
                        onDelete={() => setPendingEmployee(employee)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-medium">{t("hr.timesheets")}</h2>
          <Button
            onClick={() => {
              setSelectedTimesheet(null);
              setTimesheetOpen(true);
            }}
            disabled={employees.length === 0}
          >
            <Plus />
            {t("hr.addTimesheet")}
          </Button>
        </div>
        {timesheets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {t("hr.emptyTimesheets")}
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("hr.date")}</TableHead>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("hr.project")}</TableHead>
                  <TableHead>{t("hr.hours")}</TableHead>
                  <TableHead>{t("hr.labourCost")}</TableHead>
                  <TableHead className="w-10 text-end">
                    <span className="sr-only">{t("common.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.projectNumber ?? "—"}</TableCell>
                    <TableCell>{row.hoursWorked}</TableCell>
                    <TableCell>
                      {formatMoney((row.dailyRate / 8) * row.hoursWorked, locale)}
                    </TableCell>
                    <TableCell className="text-end">
                      <RowActions
                        onEdit={() => {
                          setSelectedTimesheet(row);
                          setTimesheetOpen(true);
                        }}
                        onDelete={() => setPendingTimesheet(row)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <EmployeeDialog
        open={employeeOpen}
        onOpenChange={setEmployeeOpen}
        employee={selectedEmployee}
      />
      <TimesheetDialog
        open={timesheetOpen}
        onOpenChange={setTimesheetOpen}
        employees={employees}
        projects={projects}
        timesheet={selectedTimesheet}
      />
      <ConfirmDeleteDialog
        open={Boolean(pendingEmployee)}
        onOpenChange={(openDialog) => {
          if (!openDialog) setPendingEmployee(null);
        }}
        title={t("hr.deleteEmployee")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingEmployee) return;
          setDeleting(true);
          const result = await deleteEmployee(pendingEmployee.id);
          setDeleting(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setPendingEmployee(null);
          router.refresh();
        }}
      />
      <ConfirmDeleteDialog
        open={Boolean(pendingTimesheet)}
        onOpenChange={(openDialog) => {
          if (!openDialog) setPendingTimesheet(null);
        }}
        title={t("hr.deleteTimesheet")}
        pending={deleting}
        onConfirm={async () => {
          if (!pendingTimesheet) return;
          setDeleting(true);
          const result = await deleteTimesheet(pendingTimesheet.id);
          setDeleting(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setPendingTimesheet(null);
          router.refresh();
        }}
      />
    </div>
  );
}
