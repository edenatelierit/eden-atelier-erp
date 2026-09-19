"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/locale-provider";
import { localeCookieName } from "@/i18n/config";
import { cn } from "cn";

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const nextLocale = locale === "en" ? "ar" : "en";
  const href = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${nextLocale}`) || `/${nextLocale}`;

  return (
    <Link
      href={href}
      hrefLang={nextLocale}
      aria-label={t("header.language")}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      onClick={() => {
        document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      {nextLocale === "ar" ? "عربي" : "EN"}
    </Link>
  );
}
