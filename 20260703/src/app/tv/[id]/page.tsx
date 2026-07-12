/**
 * TV 상세 화면 `/tv/[id]` (FR-4, 03_DESIGN §3.4).
 *
 * Server Component 에서 tmdb-client 를 직접 호출한다(ADR-0003 — 키는 서버 전용
 * 모듈 내부에서만 접근). 상세 캐싱은 client.ts 에서 revalidate: 86400(REVALIDATE
 * .DETAIL)으로 주입되므로 페이지 레벨 설정은 두지 않는다.
 *
 * 레이아웃(§3.4 — "영화 상세와 동일 히어로 + 시즌/에피소드 영역 추가"): 히어로
 * (백드롭 + 포스터 오버랩 + display 제목 · 방영연도/회차 러닝타임/장르 Pill ·
 * RatingBadge) → 개요 → 시즌/에피소드(SeasonSelector) → 출연진 레일(→ /person/[id])
 * → 추천/유사 작품 레일(→ /tv/[id]). movie/[id]/page.tsx 와 동일한 구조/컨벤션을
 * 재사용한다. 시즌 전환은 인터랙티브라 SeasonSelector(Client Component)가 온디맨드로
 * 시즌 상세를 조회한다(T9, ADR-0003 — Route Handler 경유).
 *
 * 에러/엣지케이스(§4):
 * - 존재하지 않는 id → getTvShow 가 null → notFound()(→ not-found.tsx). id 파싱
 *   불가(비정수/음수)도 동일하게 notFound().
 * - credits/recommendations fetch 실패(throw) → error.tsx(세그먼트 Error
 *   Boundary)로 전파해 재시도. TV 존재 확인 이후에만 병렬 조회하므로, 없는 id 가
 *   error.tsx 로 새지 않는다.
 * - 데이터 결측(§2.9): 개요/러닝타임/방영연도는 대체 문구, 리스트(출연진/추천작)가
 *   비면 해당 섹션 자체를 숨긴다. 이미지 null 은 Poster/Backdrop/PersonAvatar
 *   플레이스홀더가 처리한다.
 */
import { notFound } from "next/navigation";
import { BackdropImage, ContentCard, PersonLink, Pill, PosterImage, RatingBadge, ScrollRail, ScrollReveal } from "@/src/components/ui";
import {
  getTvCredits,
  getTvRecommendations,
  getTvShow,
} from "@/src/lib/tmdb/client";
import { yearOf, formatRuntime } from "@/src/utils";
import { MAX_CAST } from "./_constants";
import { pickEpisodeRuntime } from "./_utils";
import { SeasonSelector } from "./_components";

export default async function TvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tvId = Number(id);
  if (!Number.isInteger(tvId) || tvId <= 0) {
    notFound();
  }

  // 먼저 TV 존재를 확인(null → notFound). 존재할 때만 credits/recommendations 를
  // 병렬 조회해, 없는 id 가 credits throw 로 error.tsx 에 새지 않게 한다.
  const tvShow = await getTvShow(tvId);
  if (tvShow === null) {
    notFound();
  }

  const [credits, recommendations] = await Promise.all([
    getTvCredits(tvId),
    getTvRecommendations(tvId),
  ]);

  const cast = credits.cast.slice(0, MAX_CAST);
  const recommended = recommendations.results;

  const yearText = yearOf(tvShow.first_air_date) ?? "방영일 미정";
  const runtimeText =
    formatRuntime(pickEpisodeRuntime(tvShow.episode_run_time)) ??
    "러닝타임 정보 없음";

  return (
    <div className="flex w-full flex-col gap-section pb-section">
      {/* 히어로: 백드롭 + 하단 보호 그라데이션. */}
      <section aria-labelledby="tv-title" className="relative w-full">
        <BackdropImage
          path={tvShow.backdrop_path}
          alt={tvShow.name}
          size="w1280"
          sizes="100vw"
          preload
          className="h-[70svh]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent"
        />
      </section>

      {/* 히어로 콘텐츠: 포스터가 백드롭 하단에 오버랩(md 미만 세로 스택 §4). */}
      <div className="mx-auto -mt-[15svh] w-full max-w-page px-gutter md:px-gutter-lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="w-28 shrink-0 sm:w-36 md:w-48">
            <PosterImage
              path={tvShow.poster_path}
              alt={tvShow.name}
              size="w500"
              className="rounded-lg shadow-hover"
            />
          </div>
          <div className="flex flex-col gap-3 sm:pb-2">
            <h1 id="tv-title" className="text-display text-content-primary">
              {tvShow.name}
            </h1>
            {tvShow.tagline ? (
              <p className="text-body italic text-content-secondary">
                {tvShow.tagline}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{yearText}</Pill>
              <Pill>{runtimeText}</Pill>
              {tvShow.genres.map((genre) => (
                <Pill key={genre.id} variant="outline">
                  {genre.name}
                </Pill>
              ))}
            </div>
            <RatingBadge value={tvShow.vote_average} variant="inline" />
          </div>
        </div>
      </div>

      {/* 개요(텍스트 결측 시 대체 문구, 섹션은 유지 §2.9). */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg">
          <h2 className="text-h2 text-content-primary">개요</h2>
          <p className="mt-3 max-w-3xl text-body text-content-secondary">
            {tvShow.overview ? tvShow.overview : "개요 정보가 없습니다."}
          </p>
        </section>
      </ScrollReveal>

      {/* 시즌/에피소드(§3.4). 시즌 목록이 비면 섹션 자체를 숨긴다(§2.9). */}
      {tvShow.seasons.length > 0 ? (
        <ScrollReveal>
          <SeasonSelector tvId={tvId} seasons={tvShow.seasons} />
        </ScrollReveal>
      ) : null}

      {/* 출연진 레일(빈 배열이면 섹션 숨김 §2.9). */}
      {cast.length > 0 ? (
        <ScrollReveal>
          <section aria-label="출연진" className="mx-auto w-full max-w-page">
            <h2 className="px-gutter text-h2 text-content-primary md:px-gutter-lg">
              출연진
            </h2>
            <ScrollRail>
              {cast.map((member) => (
                <li key={member.credit_id}>
                  <PersonLink
                    href={`/person/${member.id}`}
                    path={member.profile_path}
                    name={member.name}
                    role={member.character || null}
                  />
                </li>
              ))}
            </ScrollRail>
          </section>
        </ScrollReveal>
      ) : null}

      {/* 추천/유사 작품 레일(전부 tv → /tv/[id], 빈 배열이면 숨김 §2.9). */}
      {recommended.length > 0 ? (
        <ScrollReveal>
          <section aria-label="추천 작품" className="mx-auto w-full max-w-page">
            <h2 className="px-gutter text-h2 text-content-primary md:px-gutter-lg">
              추천 작품
            </h2>
            <ScrollRail>
              {recommended.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <ContentCard
                    href={`/tv/${item.id}`}
                    title={item.name}
                    posterPath={item.poster_path}
                    year={yearOf(item.first_air_date)}
                    rating={item.vote_average}
                  />
                </li>
              ))}
            </ScrollRail>
          </section>
        </ScrollReveal>
      ) : null}
    </div>
  );
}
