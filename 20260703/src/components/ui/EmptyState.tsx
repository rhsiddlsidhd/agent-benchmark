/**
 * EmptyState — 빈 상태 (03_DESIGN §2.7, §3.2, NFR-3).
 *
 * 아이콘 + 제목 + 메시지(body) + 선택 액션. 검색 초기(입력 전)/무결과 등에
 * 사용한다("다른 키워드로 검색"). 콜백을 직접 받지 않고 action(ReactNode)으로
 * 위임하므로 Server Component 로 동작한다(액션은 필요 시 클라이언트 Button 을
 * 상위에서 넣는다).
 */
import type { ReactNode } from "react";
import { cn } from "@/src/lib/clsx/merge";

interface EmptyStateProps {
  /** 제목. */
  title: string;
  /** 보조 메시지. */
  message?: string;
  /** 커스텀 아이콘(없으면 기본 검색 아이콘). */
  icon?: ReactNode;
  /** 하단 액션(Button 등). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-gutter py-section text-center",
        className,
      )}
    >
      <div className="text-content-muted">
        {icon ?? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="size-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"
            />
          </svg>
        )}
      </div>
      <h2 className="text-h3 text-content-primary">{title}</h2>
      {message ? (
        <p className="max-w-sm text-body-sm text-content-secondary">{message}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
