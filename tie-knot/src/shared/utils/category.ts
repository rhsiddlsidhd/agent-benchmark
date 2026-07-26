export type ProductCategory = "invitation";
export type SubCategory = "wedding" | "first-birthday" | "vip" | "business";

export const SUB_CATEGORY_MAP: Record<ProductCategory, SubCategory[]> = {
  "invitation": ["wedding", "first-birthday", "vip", "business"],
};

export const productCategoryLabels: Record<ProductCategory, string> = {
  invitation: "초대장",
};

export const subCategoryLabels: Record<SubCategory, string> = {
  wedding: "청첩장",
  "first-birthday": "돌잔치",
  vip: "VIP",
  business: "비즈니스",
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
