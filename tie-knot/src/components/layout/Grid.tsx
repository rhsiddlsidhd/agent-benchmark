import { cn } from "@/lib/utils";
import React from "react";

/**
 * 프로젝트 표준 반응형 그리드 레이아웃
 * 기본값: 1열(모바일) -> 2열(sm) -> 3열(lg) -> 4열(xl) / 간격 6
 */
const Grid = ({
  className,
  slot = "",
  ...props
}: React.ComponentProps<"section"> & { slot?: string }) => {
  return (
    <section
      data-slot={`${slot}-grid`}
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      {...props}
    />
  );
};

export default Grid;
