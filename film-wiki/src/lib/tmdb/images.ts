/**
 * TMDB 이미지 CDN URL 빌더 (03_DESIGN §7).
 *
 * 키를 다루지 않고 순수 URL만 조립하므로 server-only 가 아니다
 * (Server/Client 컴포넌트 양쪽에서 사용 가능). next.config remotePatterns 의
 * `/t/p/**` 경로와 일치한다.
 */

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** 포스터(2/3) 사이즈. */
export type PosterSize = "w185" | "w342" | "w500" | "original";
/** 백드롭(16/9) 사이즈. */
export type BackdropSize = "w780" | "w1280" | "original";
/** 인물 프로필 사이즈. */
export type ProfileSize = "w185" | "w342" | "h632" | "original";
/** 에피소드 스틸(16/9) 사이즈. */
export type StillSize = "w300" | "w780" | "original";

/**
 * TMDB 이미지 경로(예: `/abc.jpg`)를 지정 사이즈의 절대 URL로 변환한다.
 * TMDB path 는 선행 슬래시를 포함하므로 그대로 이어 붙인다.
 */
export function tmdbImageUrl(
  path: string,
  size: PosterSize | BackdropSize | ProfileSize | StillSize,
): string {
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * next/image blur placeholder 용 저해상도 데이터 URL (§2.2, NFR-1).
 * surface 토큰(#141821) 단색 3x4 PNG — 원격 이미지 로드 전 CLS/깜빡임 완화.
 */
export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAECAIAAADETxJQAAAAEElEQVR42mMQkVCEIAa8LABHvAOdmfVp2AAAAABJRU5ErkJggg==";
