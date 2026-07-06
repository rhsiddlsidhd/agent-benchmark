/**
 * 인물 상세 화면 `/person/[id]` (FR-5, 03_DESIGN §3.5).
 *
 * Server Component 에서 tmdb-client 를 직접 호출한다(ADR-0003 — 키는 서버 전용
 * 모듈 내부에서만 접근). 상세 캐싱은 client.ts 에서 revalidate: 86400(REVALIDATE
 * .DETAIL)으로 주입되므로 페이지 레벨 설정은 두지 않는다.
 *
 * 레이아웃(§3.5): 좌(데스크톱)/상(모바일) 프로필(1/1) + 이름(display) + 약력
 * → 필모그래피(출연작/제작 참여 토글 + ContentCard 그리드, 최신순). 각 작품 카드는
 * media_type 에 따라 /movie/[id] · /tv/[id] 로 이어져 인물→작품 탐색 흐름(PRD §2)을
 * 완결한다. 토글은 인터랙티브라 Filmography(Client Component)로 분리하되, 정렬·중복
 * 제거·경로 산출은 여기(서버)에서 끝낸다.
 *
 * 에러/엣지케이스(§4):
 * - 존재하지 않는 id → getPerson 이 null → notFound()(→ not-found.tsx). id 파싱
 *   불가(비정수/음수)도 동일하게 notFound().
 * - combined_credits fetch 실패(throw) → error.tsx(세그먼트 Error Boundary)로
 *   전파해 재시도. **인물 존재 확인(null → notFound) 이후에만** 필모그래피를 조회해,
 *   없는 id 가 credits throw 로 error.tsx 에 새지 않게 한다(T7/T8 순서 원칙 동일).
 * - 데이터 결측(§2.9): 약력이 비면 대체 문구, 프로필 이미지 null 은 이니셜
 *   플레이스홀더. cast/crew 가 모두 비면 필모그래피 섹션 자체를 숨긴다.
 */
import Image from "next/image";
import { notFound } from "next/navigation";
import { Pill } from "@/src/components/ui";
import { getPerson, getPersonCombinedCredits } from "@/src/lib/tmdb/client";
import { BLUR_DATA_URL, tmdbImageUrl } from "@/src/lib/tmdb/images";
import type { PersonDetail } from "@/src/lib/tmdb/types";
import type {
  PersonCombinedCastCredit,
  PersonCombinedCrewCredit,
} from "@/src/lib/tmdb/types";
import { Filmography, type FilmographyEntry } from "./filmography";

/** 날짜 문자열에서 연도만 추출. 빈 문자열이면 null(§2.9 결측). */
function yearOf(date: string): string | null {
  return date ? date.slice(0, 4) : null;
}

/** 생년월일·출생지를 한 줄로 결합. 둘 다 없으면 null(§2.9 결측 → 줄 생략). */
function formatBirthLine(person: PersonDetail): string | null {
  const parts: string[] = [];
  if (person.birthday) {
    parts.push(person.birthday);
  }
  if (person.place_of_birth) {
    parts.push(person.place_of_birth);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** 크레딧 1건을 카드 뷰 모델로 변환(media_type 으로 movie/tv 경로·필드 분기). */
function toEntry(
  credit: PersonCombinedCastCredit | PersonCombinedCrewCredit
): FilmographyEntry {
  if (credit.media_type === "movie") {
    return {
      key: `movie:${credit.id}`,
      href: `/movie/${credit.id}`,
      title: credit.title,
      posterPath: credit.poster_path,
      year: yearOf(credit.release_date),
      rating: credit.vote_average,
    };
  }
  return {
    key: `tv:${credit.id}`,
    href: `/tv/${credit.id}`,
    title: credit.name,
    posterPath: credit.poster_path,
    year: yearOf(credit.first_air_date),
    rating: credit.vote_average,
  };
}

/** 크레딧 1건의 정렬 기준 날짜(movie=release_date, tv=first_air_date). 없으면 "". */
function creditDate(
  credit: PersonCombinedCastCredit | PersonCombinedCrewCredit
): string {
  return credit.media_type === "movie"
    ? credit.release_date
    : credit.first_air_date;
}

/**
 * 크레딧 배열 → 카드 뷰 모델 배열.
 * - 중복 제거: 같은 작품이 여러 크레딧(예: 감독+각본)으로 중복될 수 있어
 *   media_type:id 기준으로 첫 항목만 남긴다.
 * - 정렬: 개봉/방영일 내림차순(최신순). 날짜 없는 항목은 맨 뒤(§3.5).
 * ISO 날짜(YYYY-MM-DD) 문자열은 사전식 비교가 시간순과 일치한다.
 */
function normalizeCredits(
  credits: Array<PersonCombinedCastCredit | PersonCombinedCrewCredit>
): FilmographyEntry[] {
  const byKey = new Map<string, { entry: FilmographyEntry; date: string }>();
  for (const credit of credits) {
    const entry = toEntry(credit);
    if (!byKey.has(entry.key)) {
      byKey.set(entry.key, { entry, date: creditDate(credit) });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => {
      // 날짜 없는 항목(빈 문자열)은 항상 뒤로.
      if (!a.date && !b.date) {
        return 0;
      }
      if (!a.date) {
        return 1;
      }
      if (!b.date) {
        return -1;
      }
      return b.date.localeCompare(a.date);
    })
    .map((item) => item.entry);
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personId = Number(id);
  if (!Number.isInteger(personId) || personId <= 0) {
    notFound();
  }

  // 먼저 인물 존재를 확인(null → notFound). 존재할 때만 combined_credits 를
  // 조회해, 없는 id 가 credits throw 로 error.tsx 에 새지 않게 한다(T7/T8 동일).
  const person = await getPerson(personId);
  if (person === null) {
    notFound();
  }

  const credits = await getPersonCombinedCredits(personId);
  const castEntries = normalizeCredits(credits.cast);
  const crewEntries = normalizeCredits(credits.crew);
  const hasFilmography = castEntries.length > 0 || crewEntries.length > 0;

  const initial = person.name.trim().charAt(0).toUpperCase() || "?";
  const birthLine = formatBirthLine(person);

  return (
    <div className="flex w-full flex-col gap-section pb-section">
      {/* 프로필 + 이름 + 약력: 모바일 세로 스택 / md 이상 가로 배치(§3.5, §4). */}
      <section
        aria-labelledby="person-name"
        className="mx-auto flex w-full max-w-page flex-col gap-6 px-gutter py-section md:flex-row md:gap-8 md:px-gutter-lg"
      >
        <div className="w-40 shrink-0 sm:w-48 md:w-56">
          <div className="relative aspect-profile w-full overflow-hidden rounded-lg bg-surface shadow-hover">
            {person.profile_path ? (
              <Image
                src={tmdbImageUrl(person.profile_path, "h632")}
                alt={person.name}
                fill
                sizes="(max-width: 768px) 45vw, 224px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-display font-semibold text-content-muted"
                role="img"
                aria-label={person.name}
              >
                <span aria-hidden="true">{initial}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 id="person-name" className="text-display text-content-primary">
            {person.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {person.known_for_department ? (
              <Pill variant="outline">{person.known_for_department}</Pill>
            ) : null}
            {birthLine ? (
              <span className="text-body-sm text-content-secondary">
                {birthLine}
              </span>
            ) : null}
          </div>
          <div className="mt-1">
            <h2 className="text-h3 text-content-primary">약력</h2>
            <p className="mt-2 max-w-3xl whitespace-pre-line text-body text-content-secondary">
              {person.biography ? person.biography : "약력 정보가 없습니다."}
            </p>
          </div>
        </div>
      </section>

      {/* 필모그래피(출연/제작 토글 + 그리드). cast/crew 모두 비면 섹션 숨김(§2.9). */}
      {hasFilmography ? (
        <Filmography castEntries={castEntries} crewEntries={crewEntries} />
      ) : null}
    </div>
  );
}
