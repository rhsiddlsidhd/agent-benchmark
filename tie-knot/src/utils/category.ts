export type ProductCategory = "invitation" | "business-card";
export type InvitationSubCategory = "wedding" | "first-birthday" | "vip" | "business";
export type BusinessCardSubCategory = "business" | "store" | "creator";
export type SubCategory = InvitationSubCategory | BusinessCardSubCategory;

export const SUB_CATEGORY_MAP: Record<ProductCategory, SubCategory[]> = {
  "invitation": ["wedding", "first-birthday", "vip", "business"],
  "business-card": ["business", "store", "creator"],
};

export const productCategoryLabels: Record<ProductCategory, string> = {
  invitation: "초대장",
  "business-card": "명함",
};

export const subCategoryLabels: Record<SubCategory, string> = {
  wedding: "청첩장",
  "first-birthday": "돌잔치",
  vip: "VIP",
  business: "비즈니스",
  store: "매장/샾",
  creator: "크리에이터",
};

export const isProductCategory = (value: string): value is ProductCategory => {
  return Object.keys(productCategoryLabels).includes(value);
};

export const isSubCategory = (value: string): value is SubCategory => {
  return Object.keys(subCategoryLabels).includes(value);
};

export const getCategoryOptions = (includeAll = false) => {
  const allOption = includeAll ? [{ value: "all" as const, label: "전체" }] : [];
  return [
    ...allOption,
    ...Object.entries(productCategoryLabels).map(([value, label]) => ({
      value: value as ProductCategory,
      label,
    })),
  ];
};

export const getSubCategoryOptions = (category: ProductCategory, includeAll = false) => {
  const allOption = includeAll ? [{ value: "all" as const, label: "전체" }] : [];
  const options = SUB_CATEGORY_MAP[category].map((value) => ({
    value,
    label: subCategoryLabels[value],
  }));
  return [...allOption, ...options];
};
