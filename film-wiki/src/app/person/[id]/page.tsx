/**
 * 인물 상세 화면 `/person/[id]` (FR-5, 03_DESIGN §3.5).
 *
 * Server Component 에서 tmdb-client 를 직접 호출한다(ADR-0003 — 키는 서버 전용
 * 모듈 내부에서만 접근). 상세 캐싱은 client.ts 에서 revalidate: 86400(REVALIDATE
 * .DETAIL)으로 주입되므로 페이지 레벨 설정은 두지 않는다.
 *
 * 레이아웃(§3.5): 좌(데스크톱)/상(모바일) 프로필(1/1) + 이름(display) + 약력
 * → 필모그래피 타임라인(좌측 고정 수직 레일 + 우측 연도별 카드 클러스터, 과거→현재
 * 오름차순, 예정작은 별도 버킷). 각 작품 카드는 media_type 에 따라 /movie/[id] ·
 * /tv/[id] 로 이어져 인물→작품 탐색 흐름(PRD §2)을 완결한다. 스크롤/툴팁 인터랙션은
 * Filmography(Client Component)로 분리하되, cast+crew 병합·정렬·연도별 그룹핑·
 * 경로 산출은 여기(서버, normalizeCredits+groupFilmographyEntries)에서 끝낸다.
 *
 * 에러/엣지케이스(§4):
 * - 존재하지 않는 id → getPerson 이 null → notFound()(→ not-found.tsx). id 파싱
 *   불가(비정수/음수)도 동일하게 notFound().
 * - combined_credits fetch 실패(throw) → error.tsx(세그먼트 Error Boundary)로
 *   전파해 재시도. **인물 존재 확인(null → notFound) 이후에만** 필모그래피를 조회해,
 *   없는 id 가 credits throw 로 error.tsx 에 새지 않게 한다(T7/T8 순서 원칙 동일).
 * - 데이터 결측(§2.9): 약력이 비면 대체 문구, 프로필 이미지 null 은 이니셜
 *   플레이스홀더. 연도 클러스터·예정작이 모두 비면 필모그래피 섹션 자체를 숨긴다.
 */
import Image from "next/image";
import { notFound } from "next/navigation";
import { Pill } from "@/src/components/ui";
import { getPerson, getPersonCombinedCredits } from "@/src/lib/tmdb/client";
import { BLUR_DATA_URL, tmdbImageUrl } from "@/src/lib/tmdb/images";
import {
  formatBirthLine,
  groupFilmographyEntries,
  normalizeCredits,
} from "./_utils";
import { Filmography } from "./_components";

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
  const normalizedCredits = normalizeCredits(credits.cast, credits.crew);
  const filmography = groupFilmographyEntries(normalizedCredits);
  const hasFilmography =
    filmography.clusters.length > 0 || filmography.upcoming.length > 0;

  const initial = [...person.name.trim()][0]?.toUpperCase() ?? "?";
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
                preload
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
            <p className="mt-2 max-w-3xl text-body whitespace-pre-line text-content-secondary">
              {person.biography ? person.biography : "약력 정보가 없습니다."}
            </p>
          </div>
        </div>
      </section>

      {/* 필모그래피 타임라인. 크레딧/예정작 모두 없으면 섹션 숨김(§2.9). */}
      {hasFilmography ? (
        <Filmography
          clusters={filmography.clusters}
          upcoming={filmography.upcoming}
        />
      ) : null}
    </div>
  );
}
