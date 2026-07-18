/** 인물 상세(약력 등). */
export interface PersonDetail {
  id: number;
  name: string;
  profile_path: string | null;
  adult: boolean;
  popularity: number;
  gender: number;
  known_for_department: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string | null;
}
