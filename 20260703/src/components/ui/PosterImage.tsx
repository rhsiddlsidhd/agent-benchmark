/**
 * PosterImage — 포스터(2/3) 이미지 래퍼 (03_DESIGN §2.2).
 *
 * next/image + lazy loading + blur placeholder, 종횡비 토큰(aspect-poster)
 * 고정으로 CLS 방지(NFR-1). `alt` 필수(작품 제목). poster_path 가 null 이면
 * surface 플레이스홀더(아이콘 + 이니셜)로 대체(§2.9).
 *
 * 콜백 prop 을 쓰지 않으므로 Server Component 로 동작한다(홈/상세 직접 사용 가능).
 */
import Image from "next/image";
import { cn } from "@/src/lib/clsx/merge";
import {
  BLUR_DATA_URL,
  tmdbImageUrl,
  type PosterSize,
} from "@/src/lib/tmdb/images";

interface PosterImageProps {
  /** TMDB poster_path (없으면 null → 플레이스홀더). */
  path: string | null;
  /** 필수 대체 텍스트 — 작품 제목(빈 문자열 금지, §6). */
  alt: string;
  /** TMDB 이미지 사이즈. 기본 w500. */
  size?: PosterSize;
  /** 반응형 srcset 힌트. */
  sizes?: string;
  /** 래퍼 확장 클래스(rounded 등은 호출부에서 지정). */
  className?: string;
  /** LCP(히어로) 용 — 즉시 로드. 기본 false(lazy). */
  preload?: boolean;
}

export function PosterImage({
  path,
  alt,
  size = "w500",
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px",
  className,
  preload = false,
}: PosterImageProps) {
  const wrapperClass = cn("relative aspect-poster overflow-hidden bg-surface", className);

  if (!path) {
    return <ImagePlaceholder label={alt} className={wrapperClass} />;
  }

  return (
    <div className={wrapperClass}>
      <Image
        src={tmdbImageUrl(path, size)}
        alt={alt}
        fill
        sizes={sizes}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        preload={preload}
        draggable={false}
        className="object-cover"
      />
    </div>
  );
}

/** 이미지 없음 플레이스홀더 — 아이콘 + 제목 이니셜 (§2.2, §2.9). */
export function ImagePlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-2 text-content-muted", className)}
      role="img"
      aria-label={label}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-8"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 4.5h18v15H3zM3 9h18M7.5 4.5v4.5M16.5 4.5v4.5M7.5 15h4.5"
        />
      </svg>
    </div>
  );
}
