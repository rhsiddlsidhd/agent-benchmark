/** 주요 제작진을 인물 단위로 묶은 뷰 모델(같은 인물의 여러 직무를 병합). */
export interface KeyCrewPerson {
  id: number;
  name: string;
  profilePath: string | null;
  jobs: string[];
}
