// ---- 값이 원본 ----
export const PRODUCT_CATEGORIES = [
  "invitation",
  "favor",
  "accessory",
  "guestbook",
  "ceremony",
] as const;

export const SUB_CATEGORY_MAP = {
  invitation: ["wedding", "first-birthday"],
  favor: ["candle", "diffuser", "soap", "magnet", "handkerchief"],
  accessory: ["ring-pillow", "welcome-board", "polaroid-frame"],
  guestbook: ["book", "stamp"],
  ceremony: ["candle-holder", "escort-card", "program-book", "aisle-runner"],
} as const satisfies Record<ProductCategory, readonly string[]>;

// ---- 타입은 파생 ----
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SubCategory = (typeof SUB_CATEGORY_MAP)[ProductCategory][number];

export const productCategoryLabels: Record<ProductCategory, string> = {
  invitation: "초대장",
  favor: "답례품",
  accessory: "웨딩소품",
  guestbook: "방명록 굿즈",
  ceremony: "예식 용품",
};

export const subCategoryLabels: Record<SubCategory, string> = {
  wedding: "청첩장",
  "first-birthday": "돌잔치",
  candle: "캔들",
  diffuser: "디퓨저",
  soap: "비누",
  magnet: "마그넷",
  handkerchief: "손수건",
  "ring-pillow": "링필로우",
  "welcome-board": "웰컴보드",
  "polaroid-frame": "폴라로이드 액자",
  book: "방명록",
  stamp: "스탬프",
  "candle-holder": "캔들홀더",
  "escort-card": "에스코트 카드",
  "program-book": "예식 순서지",
  "aisle-runner": "아일 러너",
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
