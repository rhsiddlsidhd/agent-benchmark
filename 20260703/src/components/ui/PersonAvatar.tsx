/**
 * PersonAvatar — 원형(1/1) 인물 프로필 + 이름/역할 (03_DESIGN §2.8).
 *
 * next/image + blur placeholder, aspect-profile 고정. `name` 필수(alt/접근명).
 * profile_path 가 null 이면 이니셜 플레이스홀더(§2.9). 역할(character/job)이
 * 없으면 해당 줄 생략(텍스트 결측 §2.9).
 *
 * 링크는 호출부에서 <Link>로 감싼다(탐색 흐름은 상위 책임).
 */
import Image from "next/image";
import {
  BLUR_DATA_URL,
  tmdbImageUrl,
  type ProfileSize,
} from "@/src/lib/tmdb/images";

interface PersonAvatarProps {
  /** TMDB profile_path (없으면 null → 이니셜 플레이스홀더). */
  path: string | null;
  /** 필수 — 인물 이름(alt/접근명, §6). */
  name: string;
  /** 배역/직무(없으면 줄 자체 생략). */
  role?: string | null;
  /** 이미지 사이즈. 기본 w185. */
  size?: ProfileSize;
  className?: string;
}

export function PersonAvatar({
  path,
  name,
  role,
  size = "w185",
  className,
}: PersonAvatarProps) {
  const initial = [...name.trim()][0]?.toUpperCase() ?? "?";

  return (
    <figure
      className={`flex flex-col items-center gap-2 text-center${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="relative aspect-profile w-full overflow-hidden rounded-full bg-surface">
        {path ? (
          <Image
            src={tmdbImageUrl(path, size)}
            alt={name}
            fill
            sizes="(max-width: 640px) 30vw, 120px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            draggable={false}
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-h2 font-semibold text-content-muted"
            role="img"
            aria-label={name}
          >
            <span aria-hidden="true">{initial}</span>
          </div>
        )}
      </div>
      <figcaption className="w-full">
        <span className="block truncate text-body-sm font-medium text-content-primary">
          {name}
        </span>
        {role ? (
          <span className="block truncate text-caption text-content-secondary">
            {role}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
