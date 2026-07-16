import { useEffect, useState, type FormEvent } from "react";
import { usePosts } from "../../hooks/usePosts";
import type { Post } from "../../types/posts";
import { relativeFrom, toDateInputValue } from "../../utils/date";
import { PostsTrendChart, type PostsTrendPoint } from "./PostsTrendChart";

type RangePreset = "6m" | "1y" | "all" | "custom";

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: "6m", label: "최근 6개월" },
  { value: "1y", label: "최근 1년" },
  { value: "all", label: "전체" },
  { value: "custom", label: "직접 입력" },
];

// posted_at(ISO date) 기준 월 단위 게시글 수 집계 — 계약 응답(Post[])을 차트용으로 가공.
function aggregateByMonth(posts: Post[]): PostsTrendPoint[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const period = post.posted_at.slice(0, 7); // YYYY-MM
    counts.set(period, (counts.get(period) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));
}

/** 기간별/상대구간 필터링 게시글 수 추이 차트. usePosts 훅 반환 타입을 그대로 사용한다. */
export function PostsTrendPanel() {
  const [preset, setPreset] = useState<RangePreset>("6m");
  const [customFrom, setCustomFrom] = useState(() => relativeFrom(6));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(new Date()));
  const { data, isLoading, error, fetchPosts } = usePosts();

  useEffect(() => {
    void fetchPosts({ from: relativeFrom(6) });
  }, [fetchPosts]);

  const applyPreset = (value: RangePreset) => {
    setPreset(value);
    if (value === "custom") return;
    const from = value === "6m" ? relativeFrom(6) : value === "1y" ? relativeFrom(12) : undefined;
    void fetchPosts({ from });
  };

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchPosts({ from: customFrom, to: customTo });
  };

  const chartData = data ? aggregateByMonth(data.posts) : [];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold text-[var(--text-h)]">게시글 수 추이</h2>
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="counter"
            aria-pressed={preset === option.value}
            onClick={() => applyPreset(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            시작일
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="rounded border border-[var(--border)] px-2 py-1"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            종료일
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={toDateInputValue(new Date())}
              onChange={(event) => setCustomTo(event.target.value)}
              className="rounded border border-[var(--border)] px-2 py-1"
              required
            />
          </label>
          <button type="submit" className="counter" disabled={isLoading}>
            {isLoading ? "조회 중..." : "조회"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {isLoading && preset !== "custom" && <p className="text-sm">조회 중...</p>}
      {data && chartData.length === 0 && <p className="text-sm">조회 기간 내 데이터가 없습니다.</p>}
      {data && chartData.length > 0 && <PostsTrendChart data={chartData} />}
    </section>
  );
}
