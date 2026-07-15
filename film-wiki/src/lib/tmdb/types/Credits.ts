import type { CastMember } from "./CastMember";
import type { CrewMember } from "./CrewMember";

/** movie/tv 크레딧 응답. */
export interface Credits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}
