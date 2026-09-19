export type MasterLabel = {
  nameEn: string;
  nameAr: string;
};

export function masterLabel(item: MasterLabel, locale: string) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

export function unitOptionLabel(
  item: MasterLabel & { symbol: string },
  locale: string
) {
  return `${masterLabel(item, locale)} (${item.symbol})`;
}
