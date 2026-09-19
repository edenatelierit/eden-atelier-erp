import type { Metadata } from "next";

import { AdminSettings } from "@/components/admin/admin-settings";
import { requirePageAccess } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Admin Settings",
};

export default async function AdminSettingsPage() {
  await requirePageAccess("/admin/settings");
  return <AdminSettings />;
}
