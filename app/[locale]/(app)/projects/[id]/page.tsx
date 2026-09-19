import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ensurePaymentStages } from "@/actions/finance";
import { ensureWorkOrderPipeline } from "@/actions/pipeline";
import { ProjectHub } from "@/components/projects/project-hub";
import { prisma } from "@/lib/prisma";
import { isMissingTable } from "@/lib/prisma-missing";
import { getCompanyLegal } from "@/lib/company";
import { emptyContractValues } from "@/lib/validations/contract";
import { emptyPipelineValues } from "@/lib/validations/pipeline";
import { emptyQuotationValues } from "@/lib/validations/quotation";
import { emptySurveyValues } from "@/lib/validations/survey";

export const metadata: Metadata = {
  title: "Project hub",
};

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

async function loadDirectoryData(projectId: string) {
  try {
    const [suppliers, variationOrders, invoices] = await Promise.all([
      prisma.supplier.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true },
      }),
      prisma.variationOrder.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { projectId },
        orderBy: { issueDate: "desc" },
      }),
    ]);
    return { suppliers, variationOrders, invoices };
  } catch (error) {
    if (isMissingTable(error)) {
      return { suppliers: [], variationOrders: [], invoices: [] };
    }
    throw error;
  }
}

export default async function ProjectHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      siteSurvey: true,
      contract: true,
      materialApprovals: { orderBy: { createdAt: "desc" } },
      drawingApprovals: { orderBy: { createdAt: "desc" } },
      cuttingListParts: { orderBy: { createdAt: "asc" } },
      purchaseOrders: {
        orderBy: { createdAt: "asc" },
        include: { receivingNotes: { orderBy: { createdAt: "desc" } } },
      },
      qualityControl: true,
      deliveryNotes: { orderBy: { createdAt: "desc" } },
      installationReports: { orderBy: { reportDate: "desc" } },
      paymentStages: { orderBy: { sortOrder: "asc" } },
      workOrderPipeline: true,
      handoverCertificate: true,
      serviceRequests: { orderBy: { createdAt: "desc" } },
      quotation: true,
    },
  });

  if (!project) {
    notFound();
  }

  const paymentStages =
    project.paymentStages.length > 0
      ? project.paymentStages
      : await ensurePaymentStages(project.id);
  const pipelineRecord =
    project.workOrderPipeline ?? (await ensureWorkOrderPipeline(project.id));
  const workOrderPipeline = pipelineRecord
    ? {
        materialIssued: pipelineRecord.materialIssued,
        cutting: pipelineRecord.cutting,
        cnc: pipelineRecord.cnc,
        edgeBanding: pipelineRecord.edgeBanding,
        assembly: pipelineRecord.assembly,
        finishing: pipelineRecord.finishing,
        hardware: pipelineRecord.hardware,
        stoneFabrication: pipelineRecord.stoneFabrication,
        qc: pipelineRecord.qc,
        packing: pipelineRecord.packing,
      }
    : emptyPipelineValues;

  const survey = project.siteSurvey
    ? {
        electrical: project.siteSurvey.electrical,
        plumbing: project.siteSurvey.plumbing,
        drainage: project.siteSurvey.drainage,
        gas: project.siteSurvey.gas,
        ac: project.siteSurvey.ac,
        lighting: project.siteSurvey.lighting,
        elevator: project.siteSurvey.elevator,
        loadingAccess: project.siteSurvey.loadingAccess,
        craneRequired: project.siteSurvey.craneRequired,
        restrictions: project.siteSurvey.restrictions ?? "",
        observations: project.siteSurvey.observations ?? "",
        photoReferences: project.siteSurvey.photoReferences ?? "",
        photoUrls: asStringArray(project.siteSurvey.photoUrls),
      }
    : emptySurveyValues;

  const contract = project.contract
    ? {
        ...emptyContractValues,
        contractValue: project.contract.contractValue?.toString() ?? "",
        projectDuration: project.contract.projectDuration ?? "",
        warrantyPeriod: project.contract.warrantyPeriod ?? "",
        specialConditions: project.contract.specialConditions ?? "",
        scopeOfWorkAttached: project.contract.scopeOfWorkAttached,
        paymentTermsAgreed: project.contract.paymentTermsAgreed,
        shopDrawingApprovalRequired:
          project.contract.shopDrawingApprovalRequired,
        materialApprovalRequired: project.contract.materialApprovalRequired,
        siteReadinessDefined: project.contract.siteReadinessDefined,
        variationsRequireWrittenApproval:
          project.contract.variationsRequireWrittenApproval,
        delayTermsIncluded: project.contract.delayTermsIncluded,
        warrantyTermsIncluded: project.contract.warrantyTermsIncluded,
        cancellationTermsIncluded: project.contract.cancellationTermsIncluded,
        governingLawReviewed: project.contract.governingLawReviewed,
      }
    : emptyContractValues;

  const quotation = project.quotation
    ? {
        scopeSummary: project.quotation.scopeSummary,
        subtotal: String(project.quotation.subtotal),
        vat: String(project.quotation.vat),
        total: String(project.quotation.total),
        paymentTerms: project.quotation.paymentTerms,
        leadTimeWeeks: String(project.quotation.leadTimeWeeks),
        validUntil: project.quotation.validUntil.toISOString().slice(0, 10),
        status: project.quotation.status,
        kitchenScopeIncluded: project.quotation.kitchenScopeIncluded,
        stoneScopeIncluded: project.quotation.stoneScopeIncluded,
        exclusionsListed: project.quotation.exclusionsListed,
      }
    : emptyQuotationValues;

  const [attachments, directory] = await Promise.all([
    prisma.fileAttachment.findMany({
      where: {
        OR: [
          { entityType: "SITE_SURVEY", entityId: project.id },
          { entityType: "HANDOVER_CERTIFICATE", entityId: project.id },
          {
            entityType: "MATERIAL_APPROVAL",
            entityId: { in: project.materialApprovals.map((item) => item.id) },
          },
          {
            entityType: "SERVICE_REQUEST",
            entityId: { in: project.serviceRequests.map((item) => item.id) },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, entityType: true, entityId: true, fileUrl: true },
    }),
    loadDirectoryData(project.id),
  ]);
  const { suppliers, variationOrders, invoices } = directory;

  const surveyPhotos = attachments
    .filter((item) => item.entityType === "SITE_SURVEY")
    .map((item) => ({ id: item.id, url: item.fileUrl }));
  const handoverPhotos = attachments
    .filter((item) => item.entityType === "HANDOVER_CERTIFICATE")
    .map((item) => ({ id: item.id, url: item.fileUrl }));
  const surveyPhotoUrls = [
    ...new Set([
      ...asStringArray(project.siteSurvey?.photoUrls),
      ...surveyPhotos.map((item) => item.url),
    ]),
  ];
  const handoverPhotoUrls = [
    ...new Set([
      ...asStringArray(project.handoverCertificate?.photoUrls),
      ...handoverPhotos.map((item) => item.url),
    ]),
  ];
  const materialPhotos = new Map<string, { id: string; url: string }[]>();
  const servicePhotos = new Map<string, { id: string; url: string }[]>();
  for (const item of attachments) {
    if (item.entityType === "MATERIAL_APPROVAL") {
      const list = materialPhotos.get(item.entityId) ?? [];
      list.push({ id: item.id, url: item.fileUrl });
      materialPhotos.set(item.entityId, list);
    }
    if (item.entityType === "SERVICE_REQUEST") {
      const list = servicePhotos.get(item.entityId) ?? [];
      list.push({ id: item.id, url: item.fileUrl });
      servicePhotos.set(item.entityId, list);
    }
  }

  return (
    <ProjectHub
      project={{
        id: project.id,
        projectNumber: project.projectNumber,
        location: project.location,
        targetBudget: project.targetBudget?.toString() ?? null,
        targetCompletionDate: project.targetCompletionDate
          ? project.targetCompletionDate.toISOString().slice(0, 10)
          : null,
        preferredStyle: project.preferredStyle,
        preferredWood: project.preferredWood,
        preferredStone: project.preferredStone,
        preferredColors: project.preferredColors,
        preferredHardware: project.preferredHardware,
        areasIncluded: asStringArray(project.areasIncluded),
        status: project.status,
        createdAt: project.createdAt.toISOString().slice(0, 10),
        client: {
          id: project.client.id,
          name: project.client.name,
          leadNumber: project.client.leadNumber,
          contactPerson: project.client.contactPerson,
          phone: project.client.phone,
          email: project.client.email,
        },
        survey: { ...survey, photoUrls: surveyPhotoUrls },
        surveyPhotos,
        quotation,
        contract,
        materialApprovals: project.materialApprovals.map((item) => ({
          id: item.id,
          itemLocation: item.itemLocation,
          material: item.material,
          supplier: item.supplier,
          productCode: item.productCode,
          thickness: item.thickness,
          finish: item.finish,
          sampleAttached: item.sampleAttached,
          status: item.status,
          comments: item.comments,
          photos: materialPhotos.get(item.id) ?? [],
        })),
        drawingApprovals: project.drawingApprovals.map((item) => ({
          id: item.id,
          drawingNo: item.drawingNo,
          title: item.title,
          revision: item.revision,
          status: item.status,
          comments: item.comments,
        })),
        cuttingList: project.cuttingListParts.map((part) => ({
          id: part.id,
          partNumber: part.partNumber,
          description: part.description,
          qty: String(part.qty),
          length: String(part.length),
          width: String(part.width),
          thickness: String(part.thickness),
          material: part.material,
          edge1: part.edge1 ?? "",
          edge2: part.edge2 ?? "",
          notes: part.notes ?? "",
        })),
        workOrderPipeline,
        purchaseOrders: project.purchaseOrders.map((order) => ({
          id: order.id,
          poNumber: order.poNumber,
          item: order.item,
          description: order.description,
          specification: order.specification,
          qty: String(order.qty),
          unit: order.unit,
          unitPrice: String(order.unitPrice),
          requiredDate: order.requiredDate.toISOString().slice(0, 10),
          deliveryLocation: order.deliveryLocation,
          remarks: order.remarks ?? "",
          supplierId: order.supplierId ?? "",
        })),
        receivingNotes: project.purchaseOrders.flatMap((order) =>
          order.receivingNotes.map((note) => ({
            id: note.id,
            purchaseOrderId: order.id,
            poNumber: order.poNumber,
            receivedQty: note.receivedQty,
            condition: note.condition,
            shortageDamage: note.shortageDamage,
            checkedBy: note.checkedBy,
            date: note.date.toISOString().slice(0, 10),
          }))
        ),
        qualityControl: project.qualityControl
          ? {
              inspector: project.qualityControl.inspector,
              workOrder: project.qualityControl.workOrder,
              unitArea: project.qualityControl.unitArea,
              dimensionsMatch: project.qualityControl.dimensionsMatch,
              correctMaterial: project.qualityControl.correctMaterial,
              correctFinishColor: project.qualityControl.correctFinishColor,
              grainVeinDirectionCorrect:
                project.qualityControl.grainVeinDirectionCorrect,
              edgesProperlyFinished:
                project.qualityControl.edgesProperlyFinished,
              jointsClean: project.qualityControl.jointsClean,
              hardwareCorrect: project.qualityControl.hardwareCorrect,
              doorsDrawersAligned: project.qualityControl.doorsDrawersAligned,
              noScratchesDamage: project.qualityControl.noScratchesDamage,
              stoneCutoutsCorrect: project.qualityControl.stoneCutoutsCorrect,
              stoneEdgeProfileAcceptable:
                project.qualityControl.stoneEdgeProfileAcceptable,
            }
          : null,
        deliveryNotes: project.deliveryNotes.map((note) => ({
          id: note.id,
          deliveryDateTime: note.deliveryDateTime.toISOString().slice(0, 16).replace("T", " "),
          vehicleDriver: note.vehicleDriver,
          itemsDelivered: note.itemsDelivered,
          quantity: note.quantity,
          conditionRemarks: note.conditionRemarks,
        })),
        installationReports: project.installationReports.map((report) => ({
          id: report.id,
          reportDate: report.reportDate.toISOString().slice(0, 10),
          supervisor: report.supervisor,
          teamOnSite: report.teamOnSite,
          workCompleted: report.workCompleted,
          workRemaining: report.workRemaining,
          issuesDelays: report.issuesDelays,
          materialsRequired: report.materialsRequired,
          nextPlannedWork: report.nextPlannedWork,
          siteReady: report.siteReady,
          materialsAvailable: report.materialsAvailable,
          workAreaAccessible: report.workAreaAccessible,
          photosTaken: report.photosTaken,
          photoUrls: asStringArray(report.photoUrls),
        })),
        paymentStages: paymentStages.map((stage) => ({
          id: stage.id,
          stageName: stage.stageName,
          percentage: stage.percentage,
          amount: stage.amount,
          dueDate: stage.dueDate
            ? stage.dueDate.toISOString().slice(0, 10)
            : null,
          invoiceRef: stage.invoiceRef,
          paidDate: stage.paidDate
            ? stage.paidDate.toISOString().slice(0, 10)
            : null,
          amountPaid: stage.amountPaid,
          balance: stage.balance,
          status: stage.status,
          notes: stage.notes,
        })),
        invoices: invoices.map((item) => ({
          id: item.id,
          invoiceNumber: item.invoiceNumber,
          issueDate: item.issueDate.toISOString().slice(0, 10),
          dueDate: item.dueDate.toISOString().slice(0, 10),
          subtotal: item.subtotal,
          vat: item.vat,
          total: item.total,
          currency: item.currency === "LBP" ? "LBP" : "USD",
          exchangeRateLbp: item.exchangeRateLbp,
          vatAmountLbp: item.vatAmountLbp,
          totalLbp: item.totalLbp,
          mofNumber: item.mofNumber,
          tvaNumber: item.tvaNumber,
          crNumber: item.crNumber,
          status: item.status,
          stageName: item.stageName,
        })),
        companyLegal: getCompanyLegal(),
        variationOrders: variationOrders.map((order) => ({
          id: order.id,
          voNumber: order.voNumber,
          date: order.date.toISOString().slice(0, 10),
          requestedBy: order.requestedBy,
          originalContractValue: order.originalContractValue,
          scopeVariation: order.scopeVariation,
          reason: order.reason,
          costImpact: order.costImpact,
          timeImpactDays: order.timeImpactDays,
          revisedContractValue: order.revisedContractValue,
          status: order.status,
        })),
        originalContractValue: project.contract?.contractValue?.toString() ?? "",
        suppliers,
        handover: project.handoverCertificate
          ? {
              handoverDate: project.handoverCertificate.handoverDate
                .toISOString()
                .slice(0, 10),
              woodJoinery: project.handoverCertificate.woodJoinery,
              kitchen: project.handoverCertificate.kitchen,
              wardrobes: project.handoverCertificate.wardrobes,
              stoneWorks: project.handoverCertificate.stoneWorks,
              countertops: project.handoverCertificate.countertops,
              careInstructions: project.handoverCertificate.careInstructions,
              warrantyProvided: project.handoverCertificate.warrantyProvided,
              finalDrawings: project.handoverCertificate.finalDrawings,
              outstandingItems: project.handoverCertificate.outstandingItems ?? "",
              remarks: project.handoverCertificate.remarks ?? "",
              photoUrls: handoverPhotoUrls,
            }
          : null,
        handoverPhotos,
        serviceRequests: project.serviceRequests.map((item) => ({
          id: item.id,
          dateReported: item.dateReported.toISOString().slice(0, 10),
          issue: item.issue,
          warrantyStatus: item.warrantyStatus,
          technician: item.technician,
          visitDate: item.visitDate
            ? item.visitDate.toISOString().slice(0, 10)
            : null,
          diagnosis: item.diagnosis,
          status: item.status,
          photos: servicePhotos.get(item.id) ?? [],
        })),
      }}
    />
  );
}
