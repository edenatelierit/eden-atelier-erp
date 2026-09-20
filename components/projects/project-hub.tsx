"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, type ReactNode } from "react";

import { BoqTab } from "@/components/projects/boq-tab";
import { ContractForm } from "@/components/projects/contract-form";
import { EngineeringTab } from "@/components/projects/engineering-tab";
import { FinanceTab } from "@/components/projects/finance-tab";
import { HandoverTab } from "@/components/projects/handover-tab";
import { InstallationTab } from "@/components/projects/installation-tab";
import { InvoicesTab } from "@/components/projects/invoices-tab";
import { LogisticsTab } from "@/components/projects/logistics-tab";
import { ProcurementTab } from "@/components/projects/procurement-tab";
import type { ProjectHubData } from "@/components/projects/project-hub-types";
import { ProductionTab } from "@/components/projects/production-tab";
import { ProjectOverview } from "@/components/projects/project-overview";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { QuotationForm } from "@/components/projects/quotation-form";
import { SiteSurveyForm } from "@/components/projects/site-survey-form";
import { VariationsTab } from "@/components/projects/variations-tab";
import { useI18n } from "@/components/locale-provider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { withLocale } from "@/i18n/config";
import { canAccessHubTab, type HubTabId } from "@/lib/rbac";

const HUB_TABS: { value: HubTabId; labelKey: string }[] = [
  { value: "overview", labelKey: "hub.overview" },
  { value: "survey", labelKey: "hub.siteSurvey" },
  { value: "engineering", labelKey: "hub.engineering" },
  { value: "boq", labelKey: "hub.boq" },
  { value: "quotations", labelKey: "hub.quotations" },
  { value: "contracts", labelKey: "hub.contracts" },
  { value: "variations", labelKey: "hub.variations" },
  { value: "finance", labelKey: "hub.finance" },
  { value: "invoices", labelKey: "hub.invoices" },
  { value: "production", labelKey: "hub.production" },
  { value: "procurement", labelKey: "hub.procurement" },
  { value: "logistics", labelKey: "hub.logistics" },
  { value: "installation", labelKey: "hub.installation" },
  { value: "handover", labelKey: "hub.handover" },
];

export function ProjectHub({ project }: { project: ProjectHubData }) {
  const { locale, t } = useI18n();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const tabVisible = (tab: HubTabId) =>
    role ? canAccessHubTab(role, tab) : tab === "overview";
  const visibleTabs = HUB_TABS.filter((tab) => tabVisible(tab.value));
  const defaultTab = visibleTabs[0]?.value ?? "overview";
  const [visitedTabs, setVisitedTabs] = useState<Set<HubTabId>>(
    () => new Set([defaultTab])
  );

  function renderTab(value: HubTabId, content: ReactNode) {
    if (!tabVisible(value) || !visitedTabs.has(value)) return null;
    return <TabsContent value={value}>{content}</TabsContent>;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-3">
        <Link
          href={withLocale(locale, "/projects")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("hub.allProjects")}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("hub.label")}
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {project.projectNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.client.name} · {project.location}
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <Tabs
        defaultValue={defaultTab}
        className="gap-5"
        onValueChange={(value) => {
          if (typeof value !== "string") return;
          const tab = value as HubTabId;
          setVisitedTabs((current) => {
            if (current.has(tab)) return current;
            const next = new Set(current);
            next.add(tab);
            return next;
          });
        }}
      >
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList
            variant="line"
            className="h-auto min-w-full justify-start"
          >
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {renderTab("overview", <ProjectOverview project={project} />)}
        {renderTab(
          "survey",
          <SiteSurveyForm projectId={project.id} initialValues={project.survey} />
        )}
        {renderTab(
          "engineering",
          <EngineeringTab
            projectId={project.id}
            materials={project.materialApprovals}
            drawings={project.drawingApprovals}
            suppliers={project.suppliers}
          />
        )}
        {renderTab(
          "boq",
          <BoqTab
            projectId={project.id}
            items={project.boqItems}
            units={project.units}
          />
        )}
        {renderTab(
          "quotations",
          <QuotationForm
            projectId={project.id}
            initialValues={project.quotation}
            party={{
              projectNumber: project.projectNumber,
              clientName: project.client.name,
              location: project.location,
              contactPerson: project.client.contactPerson,
              phone: project.client.phone,
              email: project.client.email,
            }}
          />
        )}
        {renderTab(
          "contracts",
          <ContractForm
            projectId={project.id}
            initialValues={project.contract}
            party={{
              projectNumber: project.projectNumber,
              clientName: project.client.name,
              location: project.location,
              contactPerson: project.client.contactPerson,
              phone: project.client.phone,
              email: project.client.email,
            }}
          />
        )}
        {renderTab(
          "variations",
          <VariationsTab
            projectId={project.id}
            originalContractValue={project.originalContractValue}
            orders={project.variationOrders}
          />
        )}
        {renderTab(
          "finance",
          <FinanceTab projectId={project.id} stages={project.paymentStages} />
        )}
        {renderTab(
          "invoices",
          <InvoicesTab
            projectId={project.id}
            invoices={project.invoices}
            stages={project.paymentStages}
            companyLegal={project.companyLegal}
            party={{
              projectNumber: project.projectNumber,
              clientName: project.client.name,
              location: project.location,
              contactPerson: project.client.contactPerson,
              phone: project.client.phone,
              email: project.client.email,
            }}
          />
        )}
        {renderTab(
          "production",
          <ProductionTab
            projectId={project.id}
            pipeline={project.workOrderPipeline}
            cuttingList={project.cuttingList}
            hasApprovedShopDrawing={project.hasApprovedShopDrawing}
          />
        )}
        {renderTab(
          "procurement",
          <ProcurementTab
            projectId={project.id}
            orders={project.purchaseOrders}
            receipts={project.receivingNotes}
            suppliers={project.suppliers}
          />
        )}
        {renderTab(
          "logistics",
          <LogisticsTab
            projectId={project.id}
            qualityControl={project.qualityControl}
            deliveryNotes={project.deliveryNotes}
          />
        )}
        {renderTab(
          "installation",
          <InstallationTab
            projectId={project.id}
            reports={project.installationReports}
          />
        )}
        {renderTab(
          "handover",
          <HandoverTab
            projectId={project.id}
            handover={project.handover}
            handoverPhotos={project.handoverPhotos}
            serviceRequests={project.serviceRequests}
            party={{
              projectNumber: project.projectNumber,
              clientName: project.client.name,
              location: project.location,
              contactPerson: project.client.contactPerson,
              phone: project.client.phone,
              email: project.client.email,
            }}
          />
        )}
      </Tabs>
    </div>
  );
}
