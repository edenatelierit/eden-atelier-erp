import type { Role } from "@prisma/client";

export const ALL_ROLES: Role[] = [
  "SUPER_ADMIN",
  "SALES",
  "DESIGNER",
  "FACTORY",
  "INSTALLER",
  "ACCOUNTANT",
];

export const USER_ROLES = ALL_ROLES;

const ROLE_RANK: Record<Role, number> = {
  INSTALLER: 1,
  FACTORY: 2,
  DESIGNER: 3,
  SALES: 4,
  ACCOUNTANT: 5,
  SUPER_ADMIN: 6,
};

export type HubTabId =
  | "overview"
  | "survey"
  | "engineering"
  | "boq"
  | "quotations"
  | "contracts"
  | "variations"
  | "approvals"
  | "production"
  | "procurement"
  | "logistics"
  | "installation"
  | "finance"
  | "invoices"
  | "handover";

export const NAV_ACCESS: Record<string, Role[]> = {
  "/": ALL_ROLES,
  "/crm": ["SUPER_ADMIN", "SALES"],
  "/projects": ALL_ROLES,
  "/production": ["SUPER_ADMIN", "FACTORY", "DESIGNER"],
  "/logistics": ["SUPER_ADMIN", "FACTORY", "INSTALLER"],
  "/admin": ["SUPER_ADMIN"],
  "/admin/settings": ["SUPER_ADMIN"],
  "/admin/users": ["SUPER_ADMIN"],
  "/admin/audit-logs": ["SUPER_ADMIN"],
  "/finance": ["SUPER_ADMIN", "ACCOUNTANT"],
  "/suppliers": ["SUPER_ADMIN", "ACCOUNTANT", "SALES", "DESIGNER"],
  "/inventory": ["SUPER_ADMIN", "FACTORY", "ACCOUNTANT"],
  "/hr": ["SUPER_ADMIN", "ACCOUNTANT"],
};

export const HUB_TAB_ACCESS: Record<HubTabId, Role[]> = {
  overview: ALL_ROLES,
  survey: ["SUPER_ADMIN", "SALES", "DESIGNER"],
  engineering: ["SUPER_ADMIN", "SALES", "DESIGNER"],
  boq: ["SUPER_ADMIN", "SALES", "ACCOUNTANT", "DESIGNER"],
  quotations: ["SUPER_ADMIN", "SALES"],
  contracts: ["SUPER_ADMIN", "SALES"],
  variations: ["SUPER_ADMIN", "SALES", "ACCOUNTANT"],
  finance: ["SUPER_ADMIN", "SALES", "ACCOUNTANT"],
  invoices: ["SUPER_ADMIN", "SALES", "ACCOUNTANT"],
  approvals: ["SUPER_ADMIN", "SALES", "DESIGNER"],
  production: ["SUPER_ADMIN", "FACTORY", "DESIGNER"],
  procurement: ["SUPER_ADMIN"],
  logistics: ["SUPER_ADMIN", "FACTORY", "INSTALLER"],
  installation: ["SUPER_ADMIN", "SALES", "INSTALLER"],
  handover: ["SUPER_ADMIN", "SALES", "INSTALLER"],
};

export function hasRole(userRole: Role | undefined, allowed: Role[]) {
  if (!userRole) return false;
  if (userRole === "SUPER_ADMIN") return true;
  return allowed.includes(userRole);
}

export function atLeast(userRole: Role | undefined, minimum: Role) {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[minimum];
}

export function canAccessPath(userRole: Role | undefined, path: string) {
  if (!userRole) return false;
  if (userRole === "SUPER_ADMIN") return true;

  const normalized = path === "" ? "/" : path;
  const match = Object.keys(NAV_ACCESS)
    .sort((a, b) => b.length - a.length)
    .find((prefix) =>
      prefix === "/"
        ? normalized === "/"
        : normalized === prefix || normalized.startsWith(`${prefix}/`)
    );

  if (!match) {
    return true;
  }

  return NAV_ACCESS[match].includes(userRole);
}

export function canAccessHubTab(userRole: Role | undefined, tab: HubTabId) {
  return hasRole(userRole, HUB_TAB_ACCESS[tab]);
}

export function isSuperAdmin(userRole: Role | undefined) {
  return userRole === "SUPER_ADMIN";
}
