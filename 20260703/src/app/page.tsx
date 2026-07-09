/**
 * 홈 화면 `/` (FR-1, 03_DESIGN §3.1, TODO.md 홈페이지 개선).
 *
 * Server Component 에서 tmdb-client 를 직접 호출한다(ADR-0003 — 키는 서버 전용
 * 모듈 내부에서만 접근). 히어로 후보/인기 드라마·예능·영화를 Promise.all 로 병렬
 * 조회하고 목록 캐싱은 client.ts 에서 revalidate: 3600 으로 주입된다.
 *
 * - 히어로: `getHeroCarouselItems()`(3~5개) → `HeroCarousel`(Client Component,
 *   자동전환 + dot + 일시정지, WCAG 2.2.2).
 * - 캐러셀 3섹션(잠정 순서 — "인기 드라마/인기 예능/인기 영화", _workspace/
 *   01_planner_tasks.md "미정 사항" 참고, 최종 확정 아님): 각 h2 헤더 +
 *   `CarouselSection`(ScrollRail 드래그/키보드 스크롤).
 * - 카드 href 는 media_type 에 따라 /movie/[id] · /tv/[id] 로 분기.
 *
 * 에러/엣지케이스(§4): fetch 실패는 src/app/error.tsx(세그먼트 Error Boundary)
 * 로 전파해 재시도. 리스트가 빈 배열이면 해당 섹션을 렌더하지 않는다. 이미지
 * 결측(poster/backdrop null)은 Poster/BackdropImage 플레이스홀더가 처리한다.
 */
import {
  getHeroCarouselItems,
  getPopularKrDramas,
  getPopularKrMovies,
  getPopularKrVariety,
} from "@/src/lib/tmdb/client";
import { movieToCard, tvToCard } from "./_utils";
import { CarouselSection, HeroCarousel } from "./_components";

export default async function Home() {
  const [heroItems, dramas, variety, movies] = await Promise.all([
    getHeroCarouselItems(),
    getPopularKrDramas(),
    getPopularKrVariety(),
    getPopularKrMovies(),
  ]);

  const dramaCards = dramas.map(tvToCard);
  const varietyCards = variety.map(tvToCard);
  const movieCards = movies.map(movieToCard);

  return (
    <div className="flex w-full flex-col gap-section pb-section">
      <HeroCarousel items={heroItems} />

      {dramaCards.length > 0 ? (
        <CarouselSection title="인기 드라마" items={dramaCards} />
      ) : null}
      {varietyCards.length > 0 ? (
        <CarouselSection title="인기 예능" items={varietyCards} />
      ) : null}
      {movieCards.length > 0 ? (
        <CarouselSection title="인기 영화" items={movieCards} />
      ) : null}
    </div>
  );
}
