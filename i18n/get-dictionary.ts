import { cache } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

const dictionaries = {
  en: () => import("@/i18n/dictionaries/en.json").then((module) => module.default),
  ar: () => import("@/i18n/dictionaries/ar.json").then((module) => module.default),
};

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
});
