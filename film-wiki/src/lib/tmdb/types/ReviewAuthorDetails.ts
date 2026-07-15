/** 리뷰 작성자 상세(평점 등). 평점 미부여 시 `rating`은 null. */
export interface ReviewAuthorDetails {
  name: string;
  username: string;
  avatar_path: string | null;
  rating: number | null;
}
