/**
 * 영화 상세 화면 `/movie/[id]` (FR-3, 03_DESIGN §3.3).
 *
 * Server Component 에서 tmdb-client 를 직접 호출한다(ADR-0003 — 키는 서버 전용
 * 모듈 내부에서만 접근). 상세 캐싱은 client.ts 에서 revalidate: 86400(REVALIDATE
 * .DETAIL)으로 주입되므로 페이지 레벨 설정은 두지 않는다.
 *
 * 레이아웃(§3.3): 히어로(백드롭 + 포스터 오버랩 + display 제목 · 연도/러닝타임/
 * 장르 Pill · RatingBadge) → 줄거리 → 출연진 레일(→ /person/[id]) → 감독·제작진
 * → 추천/유사 작품 레일(→ /movie/[id]). 모든 인물/연관작은 링크로 이어
 * 콘텐츠→인물→다른 작품 탐색 흐름(PRD §2)을 유지한다.
 *
 * 에러/엣지케이스(§4):
 * - 존재하지 않는 id → getMovie 가 null → notFound()(→ not-found.tsx). id 파싱
 *   불가(비정수/음수)도 동일하게 notFound().
 * - credits/recommendations fetch 실패(throw) → error.tsx(세그먼트 Error
 *   Boundary)로 전파해 재시도. 영화 존재 확인 이후에만 병렬 조회하므로, 없는 id
 *   가 error.tsx 로 새지 않는다.
 * - 데이터 결측(§2.9): 줄거리/러닝타임/연도는 대체 문구, 리스트(출연진/제작진/
 *   추천작)가 비면 해당 섹션 자체를 숨긴다. 이미지 null 은 Poster/Backdrop/
 *   PersonAvatar 플레이스홀더가 처리한다.
 */
import { notFound } from "next/navigation";
import { BackdropImage, ContentCard, Pill, PosterImage, RatingBadge } from "@/src/components/ui";
import {
  getMovie,
  getMovieCredits,
  getMovieRecommendations,
} from "@/src/lib/tmdb/client";
import type { CrewMember } from "@/src/lib/tmdb/types";
import { PersonLink } from "./person-link";
import styles from "./detail.module.css";

/** 출연진 레일 최대 노출 인원(§3.3 — 주요 배역 위주). */
const MAX_CAST = 20;

/** 감독·제작진 섹션에 노출할 주요 직무(TMDB job 원문). */
const KEY_CREW_JOBS: readonly string[] = [
  "Director",
  "Writer",
  "Screenplay",
  "Story",
  "Producer",
];

/** TMDB job 원문 → 한국어 표기. 매핑에 없으면 원문 유지. */
const JOB_LABELS: Record<string, string> = {
  Director: "감독",
  Writer: "각본",
  Screenplay: "각본",
  Story: "원안",
  Producer: "제작",
};

/** 주요 제작진을 인물 단위로 묶은 뷰 모델(같은 인물의 여러 직무를 병합). */
interface KeyCrewPerson {
  id: number;
  name: string;
  profilePath: string | null;
  jobs: string[];
}

/** 출시일 문자열에서 연도만 추출. 빈 문자열이면 null(§2.9 결측). */
function yearOf(date: string): string | null {
  return date ? date.slice(0, 4) : null;
}

/** 러닝타임(분) → "N시간 M분" 표기. 없거나 0 이하이면 null(호출부에서 대체 문구). */
function formatRuntime(runtime: number | null): string | null {
  if (runtime === null || runtime <= 0) {
    return null;
  }
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간`;
  }
  return `${minutes}분`;
}

/** crew 배열에서 주요 직무만 인물 단위로 병합(감독 우선 정렬). */
function selectKeyCrew(crew: CrewMember[]): KeyCrewPerson[] {
  const byPerson = new Map<number, KeyCrewPerson>();
  for (const member of crew) {
    if (!KEY_CREW_JOBS.includes(member.job)) {
      continue;
    }
    const existing = byPerson.get(member.id);
    if (existing) {
      if (!existing.jobs.includes(member.job)) {
        existing.jobs.push(member.job);
      }
    } else {
      byPerson.set(member.id, {
        id: member.id,
        name: member.name,
        profilePath: member.profile_path,
        jobs: [member.job],
      });
    }
  }
  // 감독을 먼저 노출(Director 포함 인물 우선).
  return [...byPerson.values()].sort(
    (a, b) =>
      Number(b.jobs.includes("Director")) - Number(a.jobs.includes("Director"))
  );
}

/** 병합된 직무 목록 → 한국어 역할 라벨("감독 · 각본" 등, 중복 제거). */
function crewRoleLabel(jobs: string[]): string {
  const labels: string[] = [];
  for (const job of jobs) {
    const label = JOB_LABELS[job] ?? job;
    if (!labels.includes(label)) {
      labels.push(label);
    }
  }
  return labels.join(" · ");
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    notFound();
  }

  // 먼저 영화 존재를 확인(null → notFound). 존재할 때만 credits/recommendations
  // 를 병렬 조회해, 없는 id 가 credits throw 로 error.tsx 에 새지 않게 한다.
  const movie = await getMovie(movieId);
  if (movie === null) {
    notFound();
  }

  const [credits, recommendations] = await Promise.all([
    getMovieCredits(movieId),
    getMovieRecommendations(movieId),
  ]);

  const cast = credits.cast.slice(0, MAX_CAST);
  const keyCrew = selectKeyCrew(credits.crew);
  const recommended = recommendations.results;

  const yearText = yearOf(movie.release_date) ?? "출시일 미정";
  const runtimeText = formatRuntime(movie.runtime) ?? "러닝타임 정보 없음";

  return (
    <div className="flex w-full flex-col gap-section pb-section">
      {/* 히어로: 백드롭 + 하단 보호 그라데이션. */}
      <section aria-labelledby="movie-title" className="relative w-full">
        <BackdropImage
          path={movie.backdrop_path}
          alt={movie.title}
          size="w1280"
          sizes="100vw"
          preload
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent"
        />
      </section>

      {/* 히어로 콘텐츠: 포스터가 백드롭 하단에 오버랩(md 미만 세로 스택 §4). */}
      <div className="mx-auto -mt-16 w-full max-w-page px-gutter md:-mt-24 md:px-gutter-lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="w-28 shrink-0 sm:w-36 md:w-48">
            <PosterImage
              path={movie.poster_path}
              alt={movie.title}
              size="w500"
              className="rounded-lg shadow-hover"
            />
          </div>
          <div className="flex flex-col gap-3 sm:pb-2">
            <h1 id="movie-title" className="text-display text-content-primary">
              {movie.title}
            </h1>
            {movie.tagline ? (
              <p className="text-body italic text-content-secondary">
                {movie.tagline}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{yearText}</Pill>
              <Pill>{runtimeText}</Pill>
              {movie.genres.map((genre) => (
                <Pill key={genre.id} variant="outline">
                  {genre.name}
                </Pill>
              ))}
            </div>
            <RatingBadge value={movie.vote_average} variant="inline" />
          </div>
        </div>
      </div>

      {/* 줄거리(텍스트 결측 시 대체 문구, 섹션은 유지 §2.9). */}
      <section className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg">
        <h2 className="text-h2 text-content-primary">줄거리</h2>
        <p className="mt-3 max-w-3xl text-body text-content-secondary">
          {movie.overview ? movie.overview : "줄거리 정보가 없습니다."}
        </p>
      </section>

      {/* 출연진 레일(빈 배열이면 섹션 숨김 §2.9). */}
      {cast.length > 0 ? (
        <section aria-label="출연진" className="mx-auto w-full max-w-page">
          <h2 className="px-gutter text-h2 text-content-primary md:px-gutter-lg">
            출연진
          </h2>
          <ul className={`mt-4 ${styles.rail}`}>
            {cast.map((member) => (
              <li key={member.credit_id} className={styles.personItem}>
                <PersonLink
                  href={`/person/${member.id}`}
                  path={member.profile_path}
                  name={member.name}
                  role={member.character || null}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 감독·제작진(빈 배열이면 섹션 숨김 §2.9). */}
      {keyCrew.length > 0 ? (
        <section
          aria-label="감독 및 제작진"
          className="mx-auto w-full max-w-page px-gutter md:px-gutter-lg"
        >
          <h2 className="text-h2 text-content-primary">감독 · 제작진</h2>
          <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {keyCrew.map((person) => (
              <li key={person.id}>
                <PersonLink
                  href={`/person/${person.id}`}
                  path={person.profilePath}
                  name={person.name}
                  role={crewRoleLabel(person.jobs)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 추천/유사 작품 레일(전부 movie → /movie/[id], 빈 배열이면 숨김 §2.9). */}
      {recommended.length > 0 ? (
        <section aria-label="추천 작품" className="mx-auto w-full max-w-page">
          <h2 className="px-gutter text-h2 text-content-primary md:px-gutter-lg">
            추천 작품
          </h2>
          <ul className={`mt-4 ${styles.rail}`}>
            {recommended.map((item, index) => (
              <li key={`${item.id}-${index}`} className={styles.cardItem}>
                <ContentCard
                  href={`/movie/${item.id}`}
                  title={item.title}
                  posterPath={item.poster_path}
                  year={yearOf(item.release_date)}
                  rating={item.vote_average}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
