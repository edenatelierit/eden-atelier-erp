"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { BrandLogo } from "@/components/brand-logo";
import { GlobalSearch } from "@/components/global-search";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { withLocale } from "@/i18n/config";

export function AppHeader() {
  const { data: session } = useSession();
  const { locale, t } = useI18n();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur-md md:px-5">
      <SidebarTrigger className="text-foreground" />
      <Separator orientation="vertical" className="h-6" />
      <BrandLogo variant="header" className="shrink-0" priority />
      <div className="hidden min-w-0 sm:block">
        <p className="truncate font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
          {t("brand.name")}
        </p>
        <p className="hidden truncate text-xs text-muted-foreground lg:block">
          {t("brand.operations")}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
        {session?.user?.name ? (
          <span className="hidden max-w-36 truncate text-sm text-muted-foreground sm:inline">
            {session.user.name}
          </span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            signOut({ callbackUrl: withLocale(locale, "/login") })
          }
        >
          <LogOut />
          <span className="hidden sm:inline">{t("header.signOut")}</span>
        </Button>
      </div>
    </header>
  );
}
