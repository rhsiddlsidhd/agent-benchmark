import type {
  PersonCombinedCastCredit,
  PersonCombinedCrewCredit,
} from "@/src/lib/tmdb/types";
import { yearOf } from "@/src/utils";
import type { FilmographyEntry } from "../_types";

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
export function normalizeCredits(
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
