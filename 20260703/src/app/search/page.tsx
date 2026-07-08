/**
 * 검색 페이지 `/search` (FR-2, 03_DESIGN §3.2).
 *
 * 검색은 입력값에 따라 즉시 재요청하는 인터랙티브 경로이므로 Client Component +
 * TanStack Query + `/api/search` Route Handler 구조를 쓴다(01_ARCHITECTURE §4).
 * 이 파일은 metadata 만 노출하는 얇은 Server Component 껍데기이고, 실제 상태·
 * 이벤트·무한스크롤은 SearchExplorer(Client Component)가 담당한다.
 */
import type { Metadata } from "next";

import { SearchExplorer } from "./_components";

export const metadata: Metadata = {
  title: "검색",
  description: "영화, TV 프로그램, 인물을 검색하세요.",
};

export default function SearchPage() {
  return <SearchExplorer />;
}
