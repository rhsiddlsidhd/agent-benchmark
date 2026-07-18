import type { Movie } from "./Movie";
import type { TVShow } from "./TVShow";

/** 인물 필모그래피의 제작 크레딧(영화/TV 판별 유니온). */
export type PersonCombinedCrewCredit =
  | (Movie & {
      media_type: "movie";
      credit_id: string;
      department: string;
      job: string;
    })
  | (TVShow & {
      media_type: "tv";
      credit_id: string;
      department: string;
      job: string;
      episode_count?: number;
    });
