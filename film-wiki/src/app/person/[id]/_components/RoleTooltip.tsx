"use client";

/**
 * RoleTooltip — 필모그래피 카드 역할 배지 + hover/tap 상세 툴팁 (03_DESIGN §3.5, §6).
 *
 * 배지(badges, 예: "출연"/"감독")는 카드에 상시 노출하고, 캐릭터명/구체 job
 * 상세(roleDetail)는 hover·키보드 포커스·탭에서만 노출한다(상시 노출 금지).
 * 트리거를 `<button>`으로 감싸 마우스(hover)·키보드(focus)·터치(click) 세
 * 경로 모두 접근 가능하게 하고, `role="tooltip"` + `aria-describedby`로
 * 연결한다(§6 키보드 접근성 — 색상만으로 상태를 구분하지 않는다).
 *
 * 상세 텍스트가 없으면(캐릭터명·job 상세 모두 없음) 배지만 정적으로 렌더하고
 * 인터랙티브 트리거를 만들지 않는다(빈 툴팁을 여는 무의미한 포커스 스탑 방지).
 */
import { useId, useState } from "react";
import { Pill } from "@/src/components/ui";
import type { FilmographyRoleDetail } from "../_types";

interface RoleTooltipProps {
  badges: string[];
  roleDetail: FilmographyRoleDetail;
}

export function RoleTooltip({ badges, roleDetail }: RoleTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  if (badges.length === 0) {
    return null;
  }

  const detailLines = [
    roleDetail.character ? `출연: ${roleDetail.character}` : null,
    ...roleDetail.jobs,
  ].filter((line): line is string => line !== null);

  const badgeList = (
    <span className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <Pill key={badge} variant="outline">
          {badge}
        </Pill>
      ))}
    </span>
  );

  if (detailLines.length === 0) {
    return <div className="mt-1.5">{badgeList}</div>;
  }

  return (
    <div className="relative mt-1.5">
      <button
        type="button"
        className="rounded-sm text-left"
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        {badgeList}
      </button>
      {open ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute top-full left-0 z-dropdown mt-1 w-max max-w-56 rounded-md bg-surface-hover px-2.5 py-1.5 text-caption text-content-secondary shadow-pop"
        >
          {detailLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
