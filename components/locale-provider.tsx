"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/translate";
import type { Dictionary } from "@/i18n/types";

type LocaleContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      dictionary,
      t: (key: string) => translate(dictionary, key),
    }),
    [dictionary, locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider.");
  }
  return context;
}
