/** 출연(배우) 크레딧. */
export interface CastMember {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  adult: boolean;
  credit_id: string;
  character: string;
  order: number;
}
