import type {
  PersonCombinedCastCredit,
  PersonCombinedCrewCredit,
} from "@/src/lib/tmdb/types";
import { yearOf } from "@/src/utils";
import type {
  FilmographyEntry,
  FilmographyRoleDetail,
  NormalizedCredits,
} from "../_types";

type Credit = PersonCombinedCastCredit | PersonCombinedCrewCredit;

/** 크레딧 1건의 정렬 기준 날짜(movie=release_date, tv=first_air_date). 없으면 "". */
function creditDate(credit: Credit): string {
  return credit.media_type === "movie"
    ? credit.release_date
    : credit.first_air_date;
}

/** 크레딧 1건 → 병합 전 기본 카드 필드(media_type 으로 movie/tv 경로·필드 분기). */
function baseEntry(credit: Credit): FilmographyEntry {
  const year = yearOf(creditDate(credit));
  const rating = credit.vote_average;
  const roleDetail: FilmographyRoleDetail = { character: null, jobs: [] };
  if (credit.media_type === "movie") {
    return {
      key: `movie:${credit.id}`,
      href: `/movie/${credit.id}`,
      title: credit.title,
      posterPath: credit.poster_path,
      year,
      rating,
      badges: [],
      roleDetail,
    };
  }
  return {
    key: `tv:${credit.id}`,
    href: `/tv/${credit.id}`,
    title: credit.name,
    posterPath: credit.poster_path,
    year,
    rating,
    badges: [],
    roleDetail,
  };
}

/** 엔트리에 출연(cast) 역할을 누적한다("출연" 배지 + 캐릭터명 상세). */
function applyCast(entry: FilmographyEntry, credit: PersonCombinedCastCredit) {
  if (!entry.badges.includes("출연")) {
    entry.badges.push("출연");
  }
  const character = credit.character.trim();
  if (character) {
    entry.roleDetail.character = entry.roleDetail.character
      ? `${entry.roleDetail.character}, ${character}`
      : character;
  }
}

/** 엔트리에 제작(crew) 역할을 누적한다(구체 job 배지 + 부서·job 상세). */
function applyCrew(entry: FilmographyEntry, credit: PersonCombinedCrewCredit) {
  if (!entry.badges.includes(credit.job)) {
    entry.badges.push(credit.job);
  }
  const detail = `${credit.department} · ${credit.job}`;
  if (!entry.roleDetail.jobs.includes(detail)) {
    entry.roleDetail.jobs.push(detail);
  }
}

/**
 * cast+crew 크레딧을 `media_type:id` 기준으로 병합해 카드 뷰 모델로 변환한다.
 * 같은 작품이 cast/crew 양쪽 또는 crew 내 복수 job으로 걸쳐 있어도 하나의
 * 노드로 합치고 역할 배지·상세(캐릭터명/구체 job명)를 누적한다.
 * 정렬: 개봉/방영일 과거→현재 오름차순(ISO 날짜 문자열 사전식 비교 = 시간순 일치).
 * 날짜 없는 작품은 정렬하지 않고 undated 로 분리한다(§2.9, "예정" 버킷 대상).
 */
export function normalizeCredits(
  cast: PersonCombinedCastCredit[],
  crew: PersonCombinedCrewCredit[]
): NormalizedCredits {
  const byKey = new Map<string, { entry: FilmographyEntry; date: string }>();

  function entryFor(credit: Credit): FilmographyEntry {
    const base = baseEntry(credit);
    let record = byKey.get(base.key);
    if (!record) {
      record = { entry: base, date: creditDate(credit) };
      byKey.set(base.key, record);
    }
    return record.entry;
  }

  for (const credit of cast) {
    applyCast(entryFor(credit), credit);
  }
  for (const credit of crew) {
    applyCrew(entryFor(credit), credit);
  }

  const records = [...byKey.values()];
  const dated = records
    .filter((record) => record.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((record) => record.entry);
  const undated = records
    .filter((record) => !record.date)
    .map((record) => record.entry);

  return { dated, undated };
}
