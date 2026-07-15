import type { TVShow } from "./TVShow";

/** multi 검색의 TV 결과. */
export type TVSearchResult = TVShow & { media_type: "tv" };
