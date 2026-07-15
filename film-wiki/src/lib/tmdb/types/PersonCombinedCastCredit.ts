import type { Movie } from "./Movie";
import type { TVShow } from "./TVShow";

/** 인물 필모그래피의 출연 크레딧(영화/TV 판별 유니온). */
export type PersonCombinedCastCredit =
  | (Movie & {
      media_type: "movie";
      credit_id: string;
      character: string;
      order?: number;
    })
  | (TVShow & {
      media_type: "tv";
      credit_id: string;
      character: string;
      episode_count?: number;
    });
