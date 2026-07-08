/**
 * BackdropImage — 백드롭(16/9) 이미지 래퍼 (03_DESIGN §2.2).
 *
 * next/image + blur placeholder, aspect-backdrop 고정으로 CLS 방지(NFR-1).
 * `alt` 필수. backdrop_path 가 null 이면 surface 플레이스홀더로 대체(§2.9).
 * 히어로 배경으로 쓰이므로 preload 옵션 제공(LCP).
 */
import Image from "next/image";
import {
  BLUR_DATA_URL,
  tmdbImageUrl,
  type BackdropSize,
} from "@/src/lib/tmdb/images";
import { ImagePlaceholder } from "./PosterImage";

interface BackdropImageProps {
  /** TMDB backdrop_path (없으면 null → 플레이스홀더). */
  path: string | null;
  /** 필수 대체 텍스트 — 작품 제목(§6). */
  alt: string;
  /** TMDB 이미지 사이즈. 기본 w1280. */
  size?: BackdropSize;
  /** 반응형 srcset 힌트. 기본 100vw(풀블리드 히어로). */
  sizes?: string;
  className?: string;
  /** 히어로 LCP 용 즉시 로드. 기본 false. */
  preload?: boolean;
}

export function BackdropImage({
  path,
  alt,
  size = "w1280",
  sizes = "100vw",
  className,
  preload = false,
}: BackdropImageProps) {
  const wrapperClass = `relative aspect-backdrop overflow-hidden bg-surface${
    className ? ` ${className}` : ""
  }`;

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
        className="object-cover"
      />
    </div>
  );
}
