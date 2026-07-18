/** 시즌 요약(TVDetail.seasons 아이템). */
export interface Season {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}
