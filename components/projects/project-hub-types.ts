import type { ContractFormValues } from "@/lib/validations/contract";
import type {
  HandoverCertificateValues,
  ServiceRequestValues,
} from "@/lib/validations/handover";
import type { InstallationReportValues } from "@/lib/validations/installation";
import type { PaymentStatusValue } from "@/lib/validations/finance";
import type { QualityControlValues } from "@/lib/validations/logistics";
import type { PurchaseOrderLineValues } from "@/lib/validations/procurement";
import type { CuttingListPartValues } from "@/lib/validations/production";
import type { WorkOrderPipelineValues } from "@/lib/validations/pipeline";
import type { QuotationFormValues } from "@/lib/validations/quotation";
import type { SurveyFormValues } from "@/lib/validations/survey";
import type { UnitOption } from "@/lib/validations/category";
import type { PhotoItem } from "@/lib/photos";
import type { SupplierOption } from "@/lib/validations/supplier";
import type { InvoiceStatusValue } from "@/lib/validations/invoice";
import type { VariationStatusValue } from "@/lib/validations/variation";

export type ReceivingNoteRow = {
  id: string;
  purchaseOrderId: string;
  poNumber: string;
  receivedQty: number;
  condition: string;
  shortageDamage: string;
  checkedBy: string;
  date: string;
};

export type DeliveryNoteRow = {
  id: string;
  deliveryDateTime: string;
  vehicleDriver: string;
  itemsDelivered: string;
  quantity: number;
  conditionRemarks: string | null;
};

export type MaterialApprovalRow = {
  id: string;
  itemLocation: string;
  material: string;
  supplier: string;
  supplierId: string;
  productCode: string;
  thickness: string;
  finish: string;
  sampleAttached: boolean;
  hasPhysicalSample: boolean;
  hasPhotograph: boolean;
  hasTechnicalData: boolean;
  status: string;
  comments: string | null;
  photos: PhotoItem[];
};

export type ServiceRequestRow = {
  id: string;
  dateReported: string;
  issue: string;
  warrantyStatus: ServiceRequestValues["warrantyStatus"];
  technician: string;
  visitDate: string | null;
  diagnosis: string | null;
  status: ServiceRequestValues["status"];
  photos: PhotoItem[];
};

export type DrawingApprovalRow = {
  id: string;
  drawingNumber: string;
  title: string;
  revision: string;
  fileUrl: string | null;
  status: string;
  comments: string | null;
};

export type BoqItemRow = {
  id: string;
  itemCode: string;
  description: string;
  material: string;
  unitId: string;
  unitSymbol: string;
  quantity: number;
  materialCost: number;
  laborCost: number;
  otherCost: number;
  totalCost: number;
  sellingPrice: number;
};

export type PaymentStageRow = {
  id: string;
  stageName: string;
  percentage: number;
  amount: number;
  dueDate: string | null;
  invoiceRef: string | null;
  paidDate: string | null;
  amountPaid: number;
  balance: number;
  status: PaymentStatusValue;
  notes: string | null;
};

export type VariationOrderRow = {
  id: string;
  voNumber: string;
  date: string;
  requestedBy: string;
  originalContractValue: number;
  scopeVariation: string;
  reason: string;
  costImpact: number;
  timeImpactDays: number;
  revisedContractValue: number;
  status: VariationStatusValue;
};

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  total: number;
  currency: "USD" | "LBP";
  exchangeRateLbp: number;
  vatAmountLbp: number;
  totalLbp: number;
  mofNumber: string;
  tvaNumber: string;
  crNumber: string;
  status: InvoiceStatusValue;
  stageName: string | null;
};

export type ProjectHubData = {
  id: string;
  projectNumber: string;
  location: string;
  targetBudget: string | null;
  targetCompletionDate: string | null;
  preferredStyle: string | null;
  preferredWood: string | null;
  preferredStone: string | null;
  preferredColors: string | null;
  preferredHardware: string | null;
  areasIncluded: string[];
  status: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    leadNumber: string;
    contactPerson: string | null;
    phone: string;
    email: string;
  };
  survey: SurveyFormValues | null;
  surveyPhotos: PhotoItem[];
  quotation: QuotationFormValues | null;
  contract: ContractFormValues | null;
  materialApprovals: MaterialApprovalRow[];
  drawingApprovals: DrawingApprovalRow[];
  boqItems: BoqItemRow[];
  units: UnitOption[];
  hasApprovedShopDrawing: boolean;
  cuttingList: CuttingListPartValues[];
  workOrderPipeline: WorkOrderPipelineValues;
  purchaseOrders: PurchaseOrderLineValues[];
  receivingNotes: ReceivingNoteRow[];
  qualityControl: QualityControlValues | null;
  deliveryNotes: DeliveryNoteRow[];
  installationReports: (InstallationReportValues & { id: string })[];
  paymentStages: PaymentStageRow[];
  invoices: InvoiceRow[];
  companyLegal: {
    mofNumber: string;
    tvaNumber: string;
    crNumber: string;
  };
  variationOrders: VariationOrderRow[];
  originalContractValue: string;
  suppliers: SupplierOption[];
  handover: HandoverCertificateValues | null;
  handoverPhotos: PhotoItem[];
  serviceRequests: ServiceRequestRow[];
};
