import type { PersonCombinedCastCredit } from "./PersonCombinedCastCredit";
import type { PersonCombinedCrewCredit } from "./PersonCombinedCrewCredit";

/** 인물 combined_credits 응답. */
export interface PersonCombinedCredits {
  id: number;
  cast: PersonCombinedCastCredit[];
  crew: PersonCombinedCrewCredit[];
}
