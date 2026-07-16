import { useState, type FormEvent } from "react";
import { useNaverTrend } from "../../hooks/useNaverTrend";
import type { TimeUnit } from "../../types/naver-trend";
import { relativeFrom, toDateInputValue } from "../../utils/date";
import { NaverTrendChart } from "./NaverTrendChart";

const TIME_UNIT_OPTIONS: { value: TimeUnit; label: string }[] = [
  { value: "date", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
];

function isTimeUnit(value: string): value is TimeUnit {
  return value === "date" || value === "week" || value === "month";
}

/** 검색어/기간/단위 입력 폼 + 라인 차트. useNaverTrend 훅 반환 타입을 그대로 사용한다. */
export function NaverTrendPanel() {
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState(() => relativeFrom(3));
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("month");
  const { data, isLoading, error, fetchTrend } = useNaverTrend();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    void fetchTrend({ keyword: trimmed, startDate, endDate, timeUnit });
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold text-[var(--text-h)]">네이버 검색어트렌드</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          검색어
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="예: 조코비치"
            className="rounded border border-[var(--border)] px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          시작일
          <input
            type="date"
            value={startDate}
            min="2016-01-01"
            max={endDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded border border-[var(--border)] px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          종료일
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={toDateInputValue(new Date())}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded border border-[var(--border)] px-2 py-1"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          단위
          <select
            value={timeUnit}
            onChange={(event) => {
              if (isTimeUnit(event.target.value)) setTimeUnit(event.target.value);
            }}
            className="rounded border border-[var(--border)] px-2 py-1"
          >
            {TIME_UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="counter" disabled={isLoading}>
          {isLoading ? "조회 중..." : "조회"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {data && data.data.length === 0 && <p className="text-sm">조회 기간 내 데이터가 없습니다.</p>}
      {data && data.data.length > 0 && <NaverTrendChart data={data.data} />}
    </section>
  );
}
