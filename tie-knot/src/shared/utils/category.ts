import {
  ProductCategory,
  SubCategory,
  SUB_CATEGORY_MAP,
  productCategoryLabels,
  subCategoryLabels,
} from "@/shared/constants";

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

// 라벨 역조회 최소 길이 — 1글자는 오탐이 지나치다(예: "비" 하나로 "비즈니스" 전체가 딸려옴).
const LABEL_MATCH_MIN_LENGTH = 2;

// 검색어가 라벨 또는 enum key에 부분일치하는 카테고리 key들을 돌려준다 (대소문자 무시).
export const findProductCategoriesByTerm = (term: string): ProductCategory[] => {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < LABEL_MATCH_MIN_LENGTH) return [];

  return (Object.entries(productCategoryLabels) as [ProductCategory, string][])
    .filter(
      ([key, label]) =>
        label.toLowerCase().includes(normalized) || key.toLowerCase().includes(normalized),
    )
    .map(([key]) => key);
};

// 검색어가 라벨 또는 enum key에 부분일치하는 서브카테고리 key들을 돌려준다 (대소문자 무시).
export const findSubCategoriesByTerm = (term: string): SubCategory[] => {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < LABEL_MATCH_MIN_LENGTH) return [];

  return (Object.entries(subCategoryLabels) as [SubCategory, string][])
    .filter(
      ([key, label]) =>
        label.toLowerCase().includes(normalized) || key.toLowerCase().includes(normalized),
    )
    .map(([key]) => key);
};
