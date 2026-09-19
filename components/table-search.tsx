"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/locale-provider";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/use-debounce";

export function TableSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") ?? "";
  const [value, setValue] = useState(queryParam);
  const debounced = useDebounce(value, 300);

  useEffect(() => {
    setValue(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const next = debounced.trim();
    if (next === queryParam) return;

    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("query", next);
    } else {
      params.delete("query");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debounced, pathname, queryParam, router, searchParams]);

  return (
    <InputGroup className="max-w-sm bg-background dark:bg-input/30">
      <InputGroupAddon>
        <Search className="size-4 opacity-60" />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
      />
    </InputGroup>
  );
}
