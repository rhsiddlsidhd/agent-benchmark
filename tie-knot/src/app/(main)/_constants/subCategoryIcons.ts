import {
  Heart,
  Cake,
  Flame,
  Droplet,
  SoapDispenserDroplet,
  Magnet,
  Shirt,
  Gem,
  Signpost,
  Frame,
  NotebookText,
  Stamp,
  FlameKindling,
  Ticket,
  BookOpenText,
  Route,
  type LucideIcon,
} from "lucide-react";
import type { SubCategory } from "@/shared/constants";

// Partial이 아니라 완전한 Record — 서브카테고리를 추가하고 아이콘을 안 채우면
// subCategoryLabels와 동일하게 컴파일 에러로 잡힌다.
export const subCategoryIcons: Record<SubCategory, LucideIcon> = {
  wedding: Heart, // 청첩장(결혼식) — "초대장"(카테고리 라벨)과는 다른 층위
  "first-birthday": Cake, // 돌잔치
  candle: Flame, // 답례품 — 캔들
  diffuser: Droplet, // 답례품 — 디퓨저
  soap: SoapDispenserDroplet, // 답례품 — 비누
  magnet: Magnet, // 답례품 — 마그넷
  handkerchief: Shirt, // 답례품 — 손수건
  "ring-pillow": Gem, // 웨딩소품 — 링필로우
  "welcome-board": Signpost, // 웨딩소품 — 웰컴보드
  "polaroid-frame": Frame, // 웨딩소품 — 폴라로이드 액자
  book: NotebookText, // 방명록 굿즈 — 방명록
  stamp: Stamp, // 방명록 굿즈 — 스탬프
  "candle-holder": FlameKindling, // 예식 용품 — 캔들홀더
  "escort-card": Ticket, // 예식 용품 — 에스코트 카드
  "program-book": BookOpenText, // 예식 용품 — 예식 순서지
  "aisle-runner": Route, // 예식 용품 — 아일 러너
};
