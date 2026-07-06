"use client";

/**
 * ErrorState — 에러 상태 (03_DESIGN §2.7, NFR-3).
 *
 * 아이콘 + 메시지(body) + "다시 시도"(danger ghost Button). `onRetry` 는
 * 라우트 세그먼트 error.tsx 의 reset() 또는 TanStack Query 의 refetch 를
 * 전달받는다(§4 — 최종 실패 시 커스텀 재시도 루프 없이 이 UI 로 노출).
 * role="alert" 로 스크린리더에 즉시 안내(§6).
 *
 * 존재하지 않는 id 는 이 컴포넌트가 아니라 not-found.tsx 로 처리한다(§2.7).
 */
import { Button } from "./button";

interface ErrorStateProps {
  /** 제목. 기본 "문제가 발생했어요". */
  title?: string;
  /** 상세 메시지. */
  message?: string;
  /** 재시도 핸들러(없으면 버튼 숨김). */
  onRetry?: () => void;
  /** 재시도 버튼 라벨. 기본 "다시 시도". */
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "문제가 발생했어요",
  message = "콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  onRetry,
  retryLabel = "다시 시도",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 px-gutter py-section text-center${
        className ? ` ${className}` : ""
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="size-10 text-danger"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.3 3.86l-8.2 14.2A2 2 0 0 0 3.83 21h16.34a2 2 0 0 0 1.73-2.94l-8.2-14.2a2 2 0 0 0-3.46 0z"
        />
      </svg>
      <h2 className="text-h3 text-content-primary">{title}</h2>
      <p className="max-w-sm text-body-sm text-content-secondary">{message}</p>
      {onRetry ? (
        <Button variant="danger" size="md" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
