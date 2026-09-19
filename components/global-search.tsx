"use client";

import { FolderKanban, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  searchWorkspace,
  type GlobalSearchClient,
  type GlobalSearchProject,
} from "@/actions/search";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { withLocale } from "@/i18n/config";

export function GlobalSearch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shortcut, setShortcut] = useState(t("search.shortcutCtrl"));
  const [clients, setClients] = useState<GlobalSearchClient[]>([]);
  const [projects, setProjects] = useState<GlobalSearchProject[]>([]);
  const [pending, setPending] = useState(false);
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    setShortcut(isMac ? t("search.shortcutMac") : t("search.shortcutCtrl"));
  }, [t]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPending(true);
    searchWorkspace(debounced)
      .then((result) => {
        if (cancelled) return;
        setClients(result.clients);
        setProjects(result.projects);
      })
      .catch(() => {
        if (cancelled) return;
        setClients([]);
        setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  function go(path: string) {
    setOpen(false);
    setQuery("");
    router.push(withLocale(locale, path));
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={t("search.global")}
        onClick={() => setOpen(true)}
        className="h-8 w-8 justify-center px-0 text-muted-foreground sm:w-full sm:max-w-xs sm:justify-start sm:px-2.5 lg:max-w-sm"
      >
        <Search className="size-4 shrink-0 opacity-70" />
        <span className="hidden min-w-0 flex-1 truncate text-start sm:inline">
          {t("search.hint")}
        </span>
        <kbd className="ms-auto hidden h-5 items-center rounded border border-border bg-muted px-1.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-flex">
          {shortcut}
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        title={t("search.global")}
        description={t("search.hint")}
        className="sm:max-w-lg"
      >
        <Command shouldFilter={false} className="bg-popover">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t("search.placeholder")}
          />
          <CommandList>
            {!pending ? (
              <CommandEmpty>{t("search.noResults")}</CommandEmpty>
            ) : null}
            {clients.length > 0 ? (
              <CommandGroup heading={t("search.clients")}>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`client-${client.id}`}
                    onSelect={() =>
                      go(`/crm?query=${encodeURIComponent(client.leadNumber)}`)
                    }
                  >
                    <Users className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{client.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.leadNumber}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {projects.length > 0 ? (
              <CommandGroup heading={t("search.projects")}>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`project-${project.id}`}
                    onSelect={() => go(`/projects/${project.id}`)}
                  >
                    <FolderKanban className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {project.projectNumber}
                      <span className="ms-2 font-normal text-muted-foreground">
                        {project.clientName}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
