import { Skeleton } from "@/src/components/ui";

/** 필름스트립 로딩 스켈레톤 — ScrollRail 트랙과 동일 폭 클래스로 레이아웃 점프 방지(§2.6). */
export function EpisodeFilmstripSkeleton() {
  return (
    <ul
      className="flex gap-card-gap overflow-hidden px-gutter py-2 md:gap-card-gap-lg md:px-gutter-lg"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="회차를 불러오는 중"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="w-[42%] shrink-0 sm:w-[29%] md:w-[22%] lg:w-[15.5%] xl:w-[13.2%]"
        >
          <Skeleton variant="backdrop" />
        </li>
      ))}
    </ul>
  );
}
