/** 카드 hover/tap 툴팁에 노출할 역할 상세(캐릭터명/구체 job명, §3.5). 상시 노출 금지. */
export interface FilmographyRoleDetail {
  /** cast 캐릭터명(여러 크레딧에 걸치면 ", " 결합). 없으면 null. */
  character: string | null;
  /** crew 구체 역할("부서 · job" 형태, 중복 없이 누적). */
  jobs: string[];
}
