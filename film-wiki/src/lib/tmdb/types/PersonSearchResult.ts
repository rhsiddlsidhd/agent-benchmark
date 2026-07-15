import type { Person } from "./Person";

/** multi 검색의 인물 결과. */
export type PersonSearchResult = Person & { media_type: "person" };
