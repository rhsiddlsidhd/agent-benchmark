/**
 * 홈 화면 `/` (FR-1, 03_DESIGN §3.1).
 *
 * Server Component 에서 tmdb-client 를 직접 호출한다(ADR-0003 — 키는 서버 전용
 * 모듈 내부에서만 접근). 트렌딩/인기 영화/인기 TV 를 Promise.all 로 병렬 조회하고
 * 목록 캐싱은 client.ts 에서 revalidate: 3600 으로 주입된다.
 *
 * - 히어로: 트렌딩 중 backdrop 이 있는 영화/TV 1건 + 보호 그라데이션 + display
 *   타이틀 + 상세 CTA.
 * - 캐러셀 3섹션: 각 h2 헤더 + 가로 스크롤 ContentCard 레일(home.module.css).
 * - 카드 href 는 media_type 에 따라 /movie/[id] · /tv/[id] 로 분기.
 *
 * 에러/엣지케이스(§4): fetch 실패는 src/app/error.tsx(세그먼트 Error Boundary)
 * 로 전파해 재시도. 리스트가 빈 배열이면 해당 섹션을 렌더하지 않는다. 이미지
 * 결측(poster/backdrop null)은 Poster/BackdropImage 플레이스홀더가 처리한다.
 */
import Link from "next/link";
import { BackdropImage, ContentCard } from "@/src/components/ui";
import {
  getPopularMovies,
  getPopularTv,
  getTrending,
} from "@/src/lib/tmdb/client";
import type {
  Movie,
  MovieSearchResult,
  MultiSearchResult,
  TVShow,
  TVSearchResult,
} from "@/src/lib/tmdb/types";
import styles from "./home.module.css";

/** 캐러셀 카드로 정규화한 뷰 모델(영화/TV 공통). */
interface CardItem {
  href: string;
  title: string;
  posterPath: string | null;
  year: string | null;
  rating: number;
}

/** 트렌딩(multi) 결과에서 포스터/제목이 있는 영화·TV 만 취한다(인물 제외). */
function isTitledResult(
  item: MultiSearchResult
): item is MovieSearchResult | TVSearchResult {
  return item.media_type === "movie" || item.media_type === "tv";
}

/** 출시/방영일 문자열에서 연도만 추출. 빈 문자열이면 null(§2.9 결측). */
function yearOf(date: string): string | null {
  return date ? date.slice(0, 4) : null;
}

/** 트렌딩 영화/TV 결과 → CardItem. media_type 으로 title/name·경로 분기. */
function trendingToCard(item: MovieSearchResult | TVSearchResult): CardItem {
  if (item.media_type === "movie") {
    return {
      href: `/movie/${item.id}`,
      title: item.title,
      posterPath: item.poster_path,
      year: yearOf(item.release_date),
      rating: item.vote_average,
    };
  }
  return {
    href: `/tv/${item.id}`,
    title: item.name,
    posterPath: item.poster_path,
    year: yearOf(item.first_air_date),
    rating: item.vote_average,
  };
}

/** 인기 영화 → CardItem. */
function movieToCard(movie: Movie): CardItem {
  return {
    href: `/movie/${movie.id}`,
    title: movie.title,
    posterPath: movie.poster_path,
    year: yearOf(movie.release_date),
    rating: movie.vote_average,
  };
}

/** 인기 TV → CardItem. */
function tvToCard(show: TVShow): CardItem {
  return {
    href: `/tv/${show.id}`,
    title: show.name,
    posterPath: show.poster_path,
    year: yearOf(show.first_air_date),
    rating: show.vote_average,
  };
}

/** 캐러셀 섹션 — h2 헤더 + 가로 스크롤 ContentCard 레일. */
function CarouselSection({
  title,
  items,
}: {
  title: string;
  items: CardItem[];
}) {
  return (
    <section aria-label={title} className="mx-auto w-full max-w-page">
      <h2 className="px-gutter text-h2 text-content-primary md:px-gutter-lg">
        {title}
      </h2>
      <ul className={`mt-4 ${styles.rail}`}>
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`} className={styles.railItem}>
            <ContentCard
              href={item.href}
              title={item.title}
              posterPath={item.posterPath}
              year={item.year}
              rating={item.rating}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Home() {
  const [trending, popularMovies, popularTv] = await Promise.all([
    getTrending(),
    getPopularMovies(),
    getPopularTv(),
  ]);

  const titledTrending = trending.results.filter(isTitledResult);
  // 히어로: backdrop 이 있는 항목 우선, 없으면 첫 영화/TV, 그것도 없으면 히어로 생략.
  const heroItem =
    titledTrending.find((item) => item.backdrop_path) ??
    titledTrending[0] ??
    null;

  const trendingCards = titledTrending.map(trendingToCard);
  const movieCards = popularMovies.results.map(movieToCard);
  const tvCards = popularTv.results.map(tvToCard);

  const heroTitle =
    heroItem === null
      ? ""
      : heroItem.media_type === "movie"
        ? heroItem.title
        : heroItem.name;
  const heroHref =
    heroItem === null ? "" : `/${heroItem.media_type}/${heroItem.id}`;

  return (
    <div className="flex w-full flex-col gap-section pb-section">
      {heroItem !== null ? (
        <section aria-labelledby="hero-title" className="relative w-full">
          <BackdropImage
            path={heroItem.backdrop_path}
            alt={heroTitle}
            size="w1280"
            sizes="100vw"
            preload
          />
          {/* 하단 텍스트 보호 그라데이션(§3.1) — base 색에서 투명으로. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-page px-gutter pb-8 md:px-gutter-lg md:pb-section">
            <p className="text-overline text-brand">지금 뜨는 콘텐츠</p>
            <h1
              id="hero-title"
              className="mt-2 max-w-2xl text-display text-content-primary"
            >
              {heroTitle}
            </h1>
            {heroItem.overview ? (
              <p className="mt-3 line-clamp-3 max-w-xl text-body text-content-secondary">
                {heroItem.overview}
              </p>
            ) : null}
            <Link
              href={heroHref}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-body-sm font-medium text-base transition-colors hover:bg-brand-strong"
            >
              상세 정보 보기
            </Link>
          </div>
        </section>
      ) : null}

      {trendingCards.length > 0 ? (
        <CarouselSection title="트렌딩" items={trendingCards} />
      ) : null}
      {movieCards.length > 0 ? (
        <CarouselSection title="인기 영화" items={movieCards} />
      ) : null}
      {tvCards.length > 0 ? (
        <CarouselSection title="인기 TV" items={tvCards} />
      ) : null}
    </div>
  );
}
