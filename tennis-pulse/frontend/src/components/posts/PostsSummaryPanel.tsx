import { useState, type FormEvent } from "react";
import { usePostsSummary } from "../../hooks/usePostsSummary";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultStartDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return toDateInputValue(date);
}

/** 기간 지정 게시글 요약(OpenAI) 패널. usePostsSummary 훅 반환 타입을 그대로 사용한다. */
export function PostsSummaryPanel() {
  const [from, setFrom] = useState(defaultStartDate);
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const { data, isLoading, error, fetchSummary } = usePostsSummary();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchSummary({ from, to });
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold text-[var(--text-h)]">기간 게시글 요약</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          시작일
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded border border-[var(--border)] px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          종료일
          <input
            type="date"
            value={to}
            min={from}
            max={toDateInputValue(new Date())}
            onChange={(event) => setTo(event.target.value)}
            className="rounded border border-[var(--border)] px-2 py-1"
            required
          />
        </label>
        <button type="submit" className="counter" disabled={isLoading}>
          {isLoading ? "요약 중..." : "요약"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {data && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--text)]">
            {data.period.from} ~ {data.period.to} · 게시글 {data.postCount}건
          </p>
          {data.postCount === 0 ? (
            <p className="text-sm">해당 기간 게시글이 없습니다.</p>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{data.summary}</p>
          )}
        </div>
      )}
    </section>
  );
}
