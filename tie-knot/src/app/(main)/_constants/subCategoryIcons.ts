import { Heart, Cake, type LucideIcon } from "lucide-react";
import type { SubCategory } from "@/shared/utils";

// Partial이 아니라 완전한 Record — 서브카테고리를 추가하고 아이콘을 안 채우면
// subCategoryLabels와 동일하게 컴파일 에러로 잡힌다.
export const subCategoryIcons: Record<SubCategory, LucideIcon> = {
  wedding: Heart, // 청첩장(결혼식) — "초대장"(카테고리 라벨)과는 다른 층위
  "first-birthday": Cake, // 돌잔치
};
