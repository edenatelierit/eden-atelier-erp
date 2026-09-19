import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginPageView } from "@/components/login-page-view";
import { ensureDefaultAdmin } from "@/lib/ensure-admin";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  await ensureDefaultAdmin();

  return (
    <Suspense>
      <LoginPageView />
    </Suspense>
  );
}
