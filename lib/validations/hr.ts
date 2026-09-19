import { z } from "zod";

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatusValue = (typeof EMPLOYEE_STATUSES)[number];

export const employeeFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required."),
  position: z.string().trim().min(2, "Position is required."),
  phone: z.string().trim().min(4, "Phone is required."),
  dailyRate: z
    .string()
    .trim()
    .min(1, "Daily rate is required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "Daily rate must be zero or more."
    ),
  status: z.enum(EMPLOYEE_STATUSES),
});

export const timesheetFormSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().trim().min(1, "Select an employee."),
  projectId: z.string().optional(),
  date: z.string().trim().min(1, "Date is required."),
  hoursWorked: z
    .string()
    .trim()
    .min(1, "Hours are required.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) > 0 && Number(value) <= 24,
      "Hours must be between 0 and 24."
    ),
  notes: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type TimesheetFormValues = z.infer<typeof timesheetFormSchema>;

export const emptyEmployeeValues: EmployeeFormValues = {
  id: "",
  name: "",
  position: "",
  phone: "",
  dailyRate: "",
  status: "ACTIVE",
};

export const emptyTimesheetValues: TimesheetFormValues = {
  id: "",
  employeeId: "",
  projectId: "",
  date: "",
  hoursWorked: "8",
  notes: "",
};
