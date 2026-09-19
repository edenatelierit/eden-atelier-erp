"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { LoginForm } from "@/components/login-form";
import { useI18n } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEMO_ADMIN } from "@/lib/client-options";

export function LoginPageView() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-md gap-6">
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo variant="login" priority />
          <div>
            <p className="font-heading text-xl font-semibold tracking-tight">
              {t("brand.name")}
            </p>
            <p className="text-sm text-muted-foreground">{t("brand.tagline")}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signIn")}</CardTitle>
            <CardDescription>{t("auth.signInHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex-col items-start gap-1">
            <p className="text-sm text-muted-foreground">
              {t("auth.testAdmin")}: {DEMO_ADMIN.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("auth.testPassword")}: {DEMO_ADMIN.password}
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {t("brand.credit")}
        </p>
      </div>
    </div>
  );
}
