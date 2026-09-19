"use client";

import { CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useI18n } from "@/components/locale-provider";
import { formatBudget } from "@/lib/project-options";
import type { ProjectHubData } from "@/components/projects/project-hub-types";

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value?.trim() || "—"}</dd>
    </div>
  );
}

export function ProjectOverview({ project }: { project: ProjectHubData }) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CollapsibleCard title={t("hub.clientSite")}>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label={t("hub.client")} value={project.client.name} />
            <Detail label={t("hub.leadNo")} value={project.client.leadNumber} />
            <Detail
              label={t("hub.contact")}
              value={project.client.contactPerson}
            />
            <Detail label={t("hub.phone")} value={project.client.phone} />
            <Detail label={t("hub.email")} value={project.client.email} />
            <Detail label={t("hub.location")} value={project.location} />
          </dl>
        </CardContent>
      </CollapsibleCard>

      <CollapsibleCard title={t("hub.commercialBrief")}>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail
              label={t("hub.targetBudget")}
              value={formatBudget(project.targetBudget)}
            />
            <Detail
              label={t("hub.targetCompletion")}
              value={project.targetCompletionDate}
            />
            <Detail label={t("hub.opened")} value={project.createdAt} />
          </dl>
        </CardContent>
      </CollapsibleCard>

      <CollapsibleCard title={t("hub.designDirection")} className="lg:col-span-2">
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label={t("projectForm.preferredStyle")}
              value={project.preferredStyle}
            />
            <Detail
              label={t("projectForm.preferredWood")}
              value={project.preferredWood}
            />
            <Detail
              label={t("projectForm.preferredStone")}
              value={project.preferredStone}
            />
            <Detail
              label={t("projectForm.preferredColors")}
              value={project.preferredColors}
            />
            <Detail
              label={t("projectForm.preferredHardware")}
              value={project.preferredHardware}
            />
          </dl>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("hub.areasIncluded")}
            </p>
            {project.areasIncluded.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {project.areasIncluded.map((area) => (
                  <li
                    key={area}
                    className="rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                  >
                    {t(`options.projectAreas.${area}`)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("hub.noneListed")}
              </p>
            )}
          </div>
        </CardContent>
      </CollapsibleCard>
    </div>
  );
}
