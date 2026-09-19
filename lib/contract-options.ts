export const CONTRACT_COMPLIANCE = [
  {
    name: "scopeOfWorkAttached",
    label: "Scope of work attached",
  },
  {
    name: "paymentTermsAgreed",
    label: "Payment terms agreed",
  },
  {
    name: "shopDrawingApprovalRequired",
    label: "Shop drawing approval required before fabrication",
  },
  {
    name: "materialApprovalRequired",
    label: "Material approval required",
  },
  {
    name: "siteReadinessDefined",
    label: "Site readiness obligations defined",
  },
  {
    name: "variationsRequireWrittenApproval",
    label: "Variations require written approval",
  },
  {
    name: "delayTermsIncluded",
    label: "Delay terms included",
  },
  {
    name: "warrantyTermsIncluded",
    label: "Warranty terms included",
  },
  {
    name: "cancellationTermsIncluded",
    label: "Cancellation terms included",
  },
  {
    name: "governingLawReviewed",
    label: "Governing law / dispute terms reviewed by legal counsel",
  },
] as const;

export type ContractComplianceField =
  (typeof CONTRACT_COMPLIANCE)[number]["name"];
