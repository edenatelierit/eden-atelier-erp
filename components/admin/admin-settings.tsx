"use client";

import { Layers, ScrollText, Users } from "lucide-react";

import { useI18n } from "@/components/locale-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { withLocale } from "@/i18n/config";

export function AdminSettings() {
  const { locale, t } = useI18n();

  const links = [
    {
      href: "/admin/settings/categories",
      title: t("admin.categoriesTitle"),
      description: t("admin.categoriesSubtitle"),
      icon: Layers,
    },
    {
      href: "/admin/users",
      title: t("admin.usersTitle"),
      description: t("admin.usersSubtitle"),
      icon: Users,
    },
    {
      href: "/admin/audit-logs",
      title: t("admin.auditTitle"),
      description: t("admin.auditSubtitle"),
      icon: ScrollText,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("admin.settingsTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("admin.settingsSubtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <a
            key={item.href}
            href={withLocale(locale, item.href)}
            className="group outline-none"
          >
            <Card className="h-full transition-colors group-hover:ring-foreground/20 group-focus-visible:ring-ring">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <item.icon className="size-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
