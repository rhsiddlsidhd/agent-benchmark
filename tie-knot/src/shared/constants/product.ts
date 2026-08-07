// 0. Home 인기 상품 섹션(좋아요순 Top N) 관련 상수 — service 기본값과 UI 노출 게이트가 같은 값을 본다.
export const POPULAR_PRODUCTS_LIMIT = 8;
export const POPULAR_PRODUCTS_MIN_ITEMS = 3;

// 1. 필터 키 배열 정의 (UI 노출 순서 보장 및 타입 추출용)
export const PRODUCT_SORT_KEYS = [
  "ALL",
  "POPULAR",
  "RECOMENDED",
  "LATEST",
  "PRICE_LOW",
  "PRICE_HIGH",
] as const;

export const PRODUCT_PRICE_KEYS = [
  "ALL",
  "FREE",
  "UNDER-10k",
  "10k-30k",
  "OVER-30k",
] as const;

export const PREMIUM_FEATURE_KEYS = [
  "VIDEO",
  "HORIZONTAL_SLIDE",
  "CUSTOM_FONT",
  "SAVE_MOBILE_INVITATION",
  "SAVE_GUESTBOOK",
] as const;

// 2. 각 키에 대응하는 라벨 정의 (Record 활용으로 누락 방지)
export const PRODUCT_SORT_OPTIONS: Record<ProductSortType, string> = {
  ALL: "모두",
  POPULAR: "인기순",
  RECOMENDED: "추천순",
  LATEST: "최신순",
  PRICE_LOW: "낮은 가격순",
  PRICE_HIGH: "높은 가격순",
};

export const PRODUCT_PRICE_OPTIONS: Record<ProductPriceType, string> = {
  ALL: "모두",
  FREE: "무료",
  "UNDER-10k": "1만원 이하",
  "10k-30k": "1만원 이상 3만원 이하",
  "OVER-30k": "3만원 이상",
};

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeatureType, string> = {
  VIDEO: "🎬 비디오 추가",
  HORIZONTAL_SLIDE: "➡️ 가로 슬라이드 갤러리",
  CUSTOM_FONT: "✍️ 나만의 폰트",
  SAVE_MOBILE_INVITATION: "💌 영원히 간직하는 청첩장",
  SAVE_GUESTBOOK: "📝 방명록 추억 저장",
};

// 3. 타입은 배열로부터 파생
export type ProductSortType = (typeof PRODUCT_SORT_KEYS)[number];
export type ProductPriceType = (typeof PRODUCT_PRICE_KEYS)[number];
export type PremiumFeatureType = (typeof PREMIUM_FEATURE_KEYS)[number];
