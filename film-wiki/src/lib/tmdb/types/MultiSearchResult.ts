import type { MovieSearchResult } from "./MovieSearchResult";
import type { PersonSearchResult } from "./PersonSearchResult";
import type { TVSearchResult } from "./TVSearchResult";

/** multi 검색/트렌딩(all) 결과 유니온. media_type으로 분기. */
export type MultiSearchResult =
  | MovieSearchResult
  | TVSearchResult
  | PersonSearchResult;
