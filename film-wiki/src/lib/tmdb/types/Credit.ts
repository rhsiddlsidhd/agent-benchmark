import type { CastMember } from "./CastMember";
import type { CrewMember } from "./CrewMember";

/** 출연/제작 크레딧 통합(개별 항목 판별용 유니온). */
export type Credit = CastMember | CrewMember;
