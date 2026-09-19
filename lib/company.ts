export type CompanyLegal = {
  mofNumber: string;
  tvaNumber: string;
  crNumber: string;
};

export function getCompanyLegal(): CompanyLegal {
  return {
    mofNumber: process.env.NEXT_PUBLIC_COMPANY_MOF_NUMBER ?? "",
    tvaNumber: process.env.NEXT_PUBLIC_COMPANY_TVA_NUMBER ?? "",
    crNumber: process.env.NEXT_PUBLIC_COMPANY_CR_NUMBER ?? "",
  };
}
