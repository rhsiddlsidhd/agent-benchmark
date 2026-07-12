import { Skeleton } from "@/src/components/ui";

/** 세로 리스트 로딩 스켈레톤 — `EpisodeList`와 동일 행 형태(썸네일+텍스트)로 레이아웃 점프 방지(grilling §Q12). */
export function EpisodeListSkeleton() {
  return (
    <ul
      className="scrollbar-hide flex h-full flex-col gap-1 overflow-y-auto"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="회차를 불러오는 중"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 p-1.5">
          <Skeleton variant="backdrop" className="w-24 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton variant="text" />
            <Skeleton variant="line" />
          </div>
        </li>
      ))}
    </ul>
  );
}
