"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Factory,
  FolderKanban,
  IdCard,
  Landmark,
  LayoutDashboard,
  Boxes,
  Loader2,
  ScrollText,
  Shield,
  Store,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { useI18n } from "@/components/locale-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { stripLocale, withLocale } from "@/i18n/config";
import { canAccessPath, isSuperAdmin } from "@/lib/rbac";
import { cn } from "cn";

const workspaceNav = [
  { key: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { key: "nav.crm", href: "/crm", icon: Users },
  { key: "nav.projects", href: "/projects", icon: FolderKanban },
  { key: "nav.production", href: "/production", icon: Factory },
  { key: "nav.logistics", href: "/logistics", icon: Truck },
  { key: "nav.accounting", href: "/finance", icon: Landmark },
  { key: "nav.inventory", href: "/inventory", icon: Boxes },
  { key: "nav.hr", href: "/hr", icon: IdCard },
  { key: "nav.suppliers", href: "/suppliers", icon: Store },
] as const;

const adminNav = [
  { key: "nav.users", href: "/admin/users", icon: Users },
  { key: "nav.auditLogs", href: "/admin/audit-logs", icon: ScrollText },
] as const;

function NavPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      aria-hidden
      className={cn(
        "ms-auto size-3.5 shrink-0 opacity-0 transition-opacity",
        pending && "animate-spin opacity-70 [animation-delay:100ms]"
      )}
    />
  );
}

function NavItem({
  href,
  title,
  icon: Icon,
  isActive,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} prefetch />}
        isActive={isActive}
        tooltip={title}
      >
        <Icon />
        <span>{title}</span>
        <NavPendingHint />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale, t } = useI18n();
  const currentPath = stripLocale(pathname);
  const role = session?.user?.role;
  const showAdmin = isSuperAdmin(role);

  const workspaceItems = workspaceNav.filter((item) =>
    role
      ? canAccessPath(role, item.href)
      : item.href === "/" || item.href === "/projects"
  );

  return (
    <Sidebar side={locale === "ar" ? "right" : "left"} collapsible="offcanvas">
      <SidebarHeader className="px-3 py-4">
        <Link
          href={withLocale(locale, "/")}
          prefetch
          className="flex items-center gap-3 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandLogo variant="sidebar" className="shrink-0" priority />
          <div className="grid min-w-0 leading-tight">
            <span className="truncate font-heading text-base font-semibold tracking-tight text-sidebar-foreground">
              {t("brand.name")}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/65">
              {t("brand.tagline")}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => {
                const href = withLocale(locale, item.href);
                const isActive =
                  item.href === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.href);

                return (
                  <NavItem
                    key={item.href}
                    href={href}
                    title={t(item.key)}
                    icon={item.icon}
                    isActive={isActive}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav.admin")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItem
                  href={withLocale(locale, "/admin/settings")}
                  title={t("nav.settings")}
                  icon={Shield}
                  isActive={currentPath === "/admin/settings"}
                />
                {adminNav.map((item) => {
                  const href = withLocale(locale, item.href);
                  return (
                    <NavItem
                      key={item.href}
                      href={href}
                      title={t(item.key)}
                      icon={item.icon}
                      isActive={currentPath.startsWith(item.href)}
                    />
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <p className="text-sm leading-5 text-sidebar-foreground/50">
          {t("brand.credit")}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
