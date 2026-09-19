import type { ClientStatus, LeadSource } from "@prisma/client";

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WORD_OF_MOUTH", label: "Word of Mouth" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONVERTED", label: "Converted" },
];

export function leadSourceLabel(source: LeadSource) {
  return LEAD_SOURCES.find((item) => item.value === source)?.label ?? source;
}

export function clientStatusLabel(status: ClientStatus) {
  return CLIENT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export const DEMO_ADMIN = {
  email: "admin@edenatelier.com",
  password: "Admin123!",
  name: "Eden Atelier Admin",
} as const;
