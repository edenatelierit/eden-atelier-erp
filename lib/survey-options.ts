export const SURVEY_INFRASTRUCTURE = [
  { name: "electrical", label: "Electrical points" },
  { name: "plumbing", label: "Plumbing points" },
  { name: "drainage", label: "Drainage" },
  { name: "gas", label: "Gas location" },
  { name: "ac", label: "AC location" },
  { name: "lighting", label: "Lighting points" },
] as const;

export const SURVEY_ACCESS = [
  { name: "elevator", label: "Elevator available" },
  { name: "loadingAccess", label: "Loading access" },
  { name: "craneRequired", label: "Crane required" },
] as const;

export type SurveyInfrastructureField =
  (typeof SURVEY_INFRASTRUCTURE)[number]["name"];
export type SurveyAccessField = (typeof SURVEY_ACCESS)[number]["name"];
