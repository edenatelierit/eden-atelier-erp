export const PROJECT_AREAS = [
  { value: "KITCHEN", label: "Kitchen" },
  { value: "LIVING", label: "Living" },
  { value: "BEDROOMS", label: "Bedrooms" },
  { value: "BATHROOMS", label: "Bathrooms" },
  { value: "WARDROBES", label: "Wardrobes" },
  { value: "DOORS", label: "Doors" },
  { value: "FLOORING", label: "Flooring" },
  { value: "WALL_CLADDING", label: "Wall Cladding" },
] as const;

export type ProjectArea = (typeof PROJECT_AREAS)[number]["value"];

export const PROJECT_STATUSES = [
  { value: "LEAD", label: "Lead" },
  { value: "SURVEY", label: "Survey" },
  { value: "DESIGN", label: "Design" },
  { value: "PRODUCTION", label: "Production" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export function projectStatusLabel(status: string) {
  return (
    PROJECT_STATUSES.find((item) => item.value === status)?.label ?? status
  );
}

export function projectAreaLabel(area: string) {
  return PROJECT_AREAS.find((item) => item.value === area)?.label ?? area;
}

export { formatBudget } from "@/lib/money";
