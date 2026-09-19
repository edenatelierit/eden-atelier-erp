import { z } from "zod";

export const INSTALLATION_CHECKS = [
  "siteReady",
  "materialsAvailable",
  "workAreaAccessible",
  "photosTaken",
] as const;

export type InstallationCheckField = (typeof INSTALLATION_CHECKS)[number];

export const installationReportSchema = z.object({
  id: z.string().optional(),
  reportDate: z.string().trim().min(1, "Report date is required."),
  supervisor: z.string().trim().min(1, "Supervisor is required."),
  teamOnSite: z.string().trim().min(1, "Team on site is required."),
  workCompleted: z.string().trim().min(1, "Work completed is required."),
  workRemaining: z.string().optional(),
  issuesDelays: z.string().optional(),
  materialsRequired: z.string().optional(),
  nextPlannedWork: z.string().optional(),
  siteReady: z.boolean(),
  materialsAvailable: z.boolean(),
  workAreaAccessible: z.boolean(),
  photosTaken: z.boolean(),
  photoUrls: z.array(z.string()),
});

export type InstallationReportValues = z.infer<typeof installationReportSchema>;

export const emptyInstallationValues: InstallationReportValues = {
  id: "",
  reportDate: "",
  supervisor: "",
  teamOnSite: "",
  workCompleted: "",
  workRemaining: "",
  issuesDelays: "",
  materialsRequired: "",
  nextPlannedWork: "",
  siteReady: false,
  materialsAvailable: false,
  workAreaAccessible: false,
  photosTaken: false,
  photoUrls: [],
};
