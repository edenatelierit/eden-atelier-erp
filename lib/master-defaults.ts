export const DEFAULT_UNITS = [
  { symbol: "sheet", nameEn: "Sheet", nameAr: "لوح" },
  { symbol: "slab", nameEn: "Slab", nameAr: "لوح رخام كامل" },
  { symbol: "m²", nameEn: "Square Meter", nameAr: "متر مربع" },
  { symbol: "lm", nameEn: "Linear Meter", nameAr: "متر طولي" },
  { symbol: "m³", nameEn: "Cubic Meter", nameAr: "متر مكعب" },
  { symbol: "pcs", nameEn: "Piece", nameAr: "قطعة" },
  { symbol: "kg", nameEn: "Kilogram", nameAr: "كيلوغرام" },
  { symbol: "L", nameEn: "Liter", nameAr: "لتر" },
] as const;

export const DEFAULT_INVENTORY_CATEGORIES = [
  { code: "MDF", nameEn: "Sheet Goods & MDF", nameAr: "الألواح والخشب المصنع" },
  { code: "STN", nameEn: "Natural Stone & Marble", nameAr: "الرخام والأحجار الطبيعية" },
  { code: "WVD", nameEn: "Wood Veneers & Solid Timber", nameAr: "القشور والأخشاب الصلبة" },
  { code: "HDW", nameEn: "Hardware & Accessories", nameAr: "الإكسسوارات والمفصلات" },
  { code: "GLU", nameEn: "Glues, Resins & Finishes", nameAr: "الغراء والمواد الكيميائية والدهانات" },
  { code: "CON", nameEn: "Consumables & Tooling", nameAr: "المستهلكات وشفرات القص" },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { code: "RENT", nameEn: "Factory Rent", nameAr: "إيجار المعمل" },
  { code: "FUEL", nameEn: "Generator & Diesel Fuel", nameAr: "المحروقات واشتراك الموتور" },
  { code: "LAB", nameEn: "Daily Labor & Subcontractors", nameAr: "أجور العمال والمياومين" },
  { code: "MAT", nameEn: "Raw Materials Procurement", nameAr: "شراء المواد الأولية" },
  { code: "MNT", nameEn: "Machine Maintenance & Tooling", nameAr: "صيانة الآلات والمعدات" },
  { code: "UTIL", nameEn: "Utilities, Water & Electricity", nameAr: "الكهرباء والمياه" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { code: "PAY", nameEn: "Project Payments", nameAr: "دفعات المشاريع" },
  { code: "DEP", nameEn: "Deposits & Advances", nameAr: "عربون ودفعات مقدمة" },
  { code: "VO", nameEn: "Variation Order Billing", nameAr: "فوترة أوامر التغيير" },
  { code: "SALE", nameEn: "Material & Offcut Sales", nameAr: "بيع المواد والقصاصات" },
  { code: "SVC", nameEn: "Service & After-sales", nameAr: "الصيانة وخدمات ما بعد البيع" },
  { code: "OTH", nameEn: "Other Income", nameAr: "إيرادات أخرى" },
] as const;
